const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const dataPath = path.join(dataDir, 'devices.json');
const settingsPath = path.join(dataDir, 'settings.json');

// Session store for authenticated admin panel clients
const activeSessions = new Set();

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware CORS pour accepter les requêtes de l'app Electron et des navigateurs
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') res.sendStatus(200);
  else next();
});

app.use(express.json());

// ─── Database and Persistence layer ─────────────────────────
let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  // Only log the missing dependency when MongoDB is explicitly configured
  if (process.env.MONGODB_URI) {
    console.log('Mongoose is not installed. MongoDB support will be unavailable.');
  }
}

const MONGO_URI = process.env.MONGODB_URI;
let useMongo = false;
let DeviceModel;
let SettingsModel;

if (MONGO_URI && mongoose) {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('🔌 Connected to MongoDB Atlas successfully.');
      useMongo = true;
    })
    .catch((err) => {
      console.error('❌ Failed to connect to MongoDB. Using local JSON file fallback.', err);
    });

  const deviceSchema = new mongoose.Schema({
    deviceId: { type: String, unique: true, required: true },
    id: String,
    hostname: String,
    ipAddress: String,
    macAddress: String,
    platform: String,
    arch: String,
    lastEventType: String,
    lastDetails: mongoose.Schema.Types.Mixed,
    lastIntervalSeconds: Number,
    firstSeen: String,
    lastSeen: String,
    reports: { type: Number, default: 0 },
    email: String,
    history: [{
      timestamp: String,
      eventType: String,
      details: mongoose.Schema.Types.Mixed
    }]
  });

  const settingsSchema = new mongoose.Schema({
    key: { type: String, unique: true, required: true },
    value: mongoose.Schema.Types.Mixed
  });

  DeviceModel = mongoose.model('Device', deviceSchema);
  SettingsModel = mongoose.model('Settings', settingsSchema);
}

// ─── Local JSON file fallback functions ──────────────────────
function normalizeDevices(data) {
  if (!data || !Array.isArray(data.devices)) {
    data = { devices: [] };
  }

  let changed = false;
  data.devices = data.devices.map((device) => {
    if (!device) return null;
    if (!device.id && device.deviceId) {
      device.id = device.deviceId;
      changed = true;
    }
    if (!Array.isArray(device.history)) {
      device.history = [];
      changed = true;
      if (device.lastEventType) {
        device.history.push({
          timestamp: device.lastSeen || device.firstSeen || new Date().toISOString(),
          eventType: device.lastEventType,
          details: device.lastDetails || {}
        });
      }
    }
    return device;
  }).filter(Boolean);

  if (changed) {
    saveData(data);
  }
  return data;
}

function loadData() {
  if (!fs.existsSync(dataPath)) {
    return { devices: [] };
  }
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return normalizeDevices(data);
  } catch (error) {
    console.error('Impossible de lire les données JSON:', error);
    return { devices: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

// ─── Authentication Password Helpers ─────────────────────────
async function getAdminPasswordHash() {
  if (useMongo && SettingsModel) {
    try {
      const setting = await SettingsModel.findOne({ key: 'admin_password_hash' });
      if (setting) return setting.value;
    } catch (e) {
      console.error('Error fetching password from MongoDB:', e);
    }
  }

  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (settings.passwordHash) return settings.passwordHash;
    } catch (e) {
      console.error('Error reading settings.json:', e);
    }
  }

  // Default password "admin123" SHA256
  return '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
}

async function setAdminPasswordHash(hash) {
  if (useMongo && SettingsModel) {
    try {
      await SettingsModel.findOneAndUpdate(
        { key: 'admin_password_hash' },
        { value: hash },
        { upsert: true, new: true }
      );
      return true;
    } catch (e) {
      console.error('Error saving password to MongoDB:', e);
    }
  }

  try {
    let settings = {};
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    settings.passwordHash = hash;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing settings.json:', e);
    return false;
  }
}

// ─── Device Logic Helpers ─────────────────────────
function generateDeviceId(report, remoteAddress) {
  const seed = `${report.deviceId || ''}-${report.hostname || ''}-${report.macAddress || ''}-${report.ipAddress || remoteAddress}`;
  return crypto.createHash('sha256').update(seed).digest('hex');
}

async function getAllDevices() {
  if (useMongo && DeviceModel) {
    try {
      return await DeviceModel.find({});
    } catch (e) {
      console.error('Error loading devices from MongoDB:', e);
    }
  }
  const data = loadData();
  return data.devices || [];
}

async function upsertDevice(report) {
  const now = new Date().toISOString();
  const email = report.details?.email || null;

  if (useMongo && DeviceModel) {
    try {
      let device = await DeviceModel.findOne({ deviceId: report.deviceId });
      if (device) {
        const previousLastSeen = device.lastSeen ? new Date(device.lastSeen).getTime() : null;
        const currentSeen = new Date(now).getTime();
        const secondsSinceLastReport = previousLastSeen
          ? Math.max(0, Math.round((currentSeen - previousLastSeen) / 1000))
          : null;

        device.ipAddress = report.ipAddress;
        device.macAddress = report.macAddress;
        device.hostname = report.hostname;
        device.platform = report.platform;
        device.arch = report.arch;
        device.lastEventType = report.eventType;
        device.lastDetails = report.details || {};
        device.lastIntervalSeconds = secondsSinceLastReport;
        device.lastSeen = now;
        device.reports += 1;
        if (email) device.email = email;
        device.history.push({
          timestamp: now,
          eventType: report.eventType,
          details: report.details || {}
        });
        await device.save();
        return device;
      } else {
        device = new DeviceModel({
          id: report.deviceId,
          deviceId: report.deviceId,
          hostname: report.hostname,
          ipAddress: report.ipAddress,
          macAddress: report.macAddress,
          platform: report.platform,
          arch: report.arch,
          lastEventType: report.eventType,
          lastDetails: report.details || {},
          lastIntervalSeconds: null,
          firstSeen: now,
          lastSeen: now,
          reports: 1,
          email: email || '',
          history: [{
            timestamp: now,
            eventType: report.eventType,
            details: report.details || {}
          }]
        });
        await device.save();
        return device;
      }
    } catch (e) {
      console.error('Error saving device to MongoDB:', e);
    }
  }

  // Fallback local JSON
  const data = loadData();
  let device = data.devices.find((d) => d.deviceId === report.deviceId);

  if (device) {
    const previousLastSeen = device.lastSeen ? new Date(device.lastSeen).getTime() : null;
    const currentSeen = new Date(now).getTime();
    const secondsSinceLastReport = previousLastSeen
      ? Math.max(0, Math.round((currentSeen - previousLastSeen) / 1000))
      : null;

    device.id = report.deviceId;
    device.deviceId = report.deviceId;
    device.ipAddress = report.ipAddress;
    device.macAddress = report.macAddress;
    device.hostname = report.hostname;
    device.platform = report.platform;
    device.arch = report.arch;
    device.lastEventType = report.eventType;
    device.lastDetails = report.details || {};
    device.lastIntervalSeconds = secondsSinceLastReport;
    device.lastSeen = now;
    device.reports += 1;
    if (email) device.email = email;
    if (!Array.isArray(device.history)) device.history = [];
    device.history.push({
      timestamp: now,
      eventType: report.eventType,
      details: report.details || {}
    });
  } else {
    device = {
      id: report.deviceId,
      deviceId: report.deviceId,
      hostname: report.hostname,
      ipAddress: report.ipAddress,
      macAddress: report.macAddress,
      platform: report.platform,
      arch: report.arch,
      lastEventType: report.eventType,
      lastDetails: report.details || {},
      lastIntervalSeconds: null,
      firstSeen: now,
      lastSeen: now,
      reports: 1,
      email: email || '',
      history: [{
        timestamp: now,
        eventType: report.eventType,
        details: report.details || {}
      }]
    };
    data.devices.push(device);
  }

  saveData(data);
  return device;
}

// ─── Middleware Authentication Check ─────────────────────────
function checkAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ success: false, error: 'Non autorisé' });
  }
  next();
}

// ─── Routing ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.redirect('/admin.html');
});

// Serve static admin files
app.use(express.static(path.join(__dirname, 'public')));

// Public route: browsers report their presence
app.post('/device/report', async (req, res) => {
  let remoteIp = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.socket.remoteAddress;

  if (remoteIp === '::1') {
    remoteIp = '127.0.0.1';
  }
  if (remoteIp && remoteIp.includes('::ffff:')) {
    remoteIp = remoteIp.replace('::ffff:', '');
  }

  const payload = req.body || {};

  if (!payload.ipAddress || payload.ipAddress === 'unknown') {
    payload.ipAddress = remoteIp;
  }

  payload.hostname = payload.hostname || 'unknown-host';
  payload.macAddress = payload.macAddress || 'non-disponible';
  payload.eventType = payload.eventType || 'heartbeat';
  payload.details = payload.details && typeof payload.details === 'object' ? payload.details : {};
  payload.deviceId = payload.deviceId || generateDeviceId(payload, remoteIp);

  if (!payload.deviceId || !payload.ipAddress) {
    return res.status(400).json({ success: false, error: 'Payload invalide' });
  }

  console.log(`📥 Device report received from ${remoteIp}:`, {
    hostname: payload.hostname,
    ipAddress: payload.ipAddress,
    macAddress: payload.macAddress,
    platform: payload.platform,
    email: payload.details?.email || 'N/A'
  });

  try {
    const device = await upsertDevice(payload);
    return res.json({ success: true, device });
  } catch (err) {
    console.error('Error reporting device:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin login route
app.post('/admin/login', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, error: 'Mot de passe requis' });
  }

  try {
    const currentHash = await getAdminPasswordHash();
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');

    if (inputHash === currentHash) {
      const token = crypto.randomBytes(32).toString('hex');
      activeSessions.add(token);
      return res.json({ success: true, token });
    } else {
      return res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Verify token
app.post('/admin/verify-token', (req, res) => {
  const { token } = req.body;
  if (token && activeSessions.has(token)) {
    return res.json({ success: true });
  }
  return res.json({ success: false });
});

// Admin Password change route
app.post('/admin/change-password', checkAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Ancien et nouveau mot de passe requis' });
  }

  try {
    const currentHash = await getAdminPasswordHash();
    const oldHash = crypto.createHash('sha256').update(oldPassword).digest('hex');

    if (oldHash !== currentHash) {
      return res.status(400).json({ success: false, error: 'Ancien mot de passe incorrect' });
    }

    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    const success = await setAdminPasswordHash(newHash);

    if (success) {
      activeSessions.clear(); // Log everyone out on password change
      return res.json({ success: true });
    } else {
      return res.status(500).json({ success: false, error: 'Erreur d\'écriture du mot de passe' });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Erreur interne' });
  }
});

// Protected route: fetch devices list
app.get('/admin/devices', checkAuth, async (req, res) => {
  try {
    const devices = await getAllDevices();
    res.json({ success: true, devices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des périphériques' });
  }
});

function getPeriodStart(period, now) {
  const start = new Date(now);
  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'quarter': {
      const quarter = Math.floor(start.getMonth() / 3) * 3;
      start.setMonth(quarter, 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'semester': {
      const semester = start.getMonth() < 6 ? 0 : 6;
      start.setMonth(semester, 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
  }
  return start;
}

function normalizeHistoryEvents(devices) {
  return devices.flatMap((device) => {
    if (!Array.isArray(device.history)) return [];
    return device.history.map((event) => ({
      ...event,
      deviceId: device.id || device.deviceId,
      hostname: device.hostname,
      platform: device.platform,
      timestamp: event.timestamp || device.lastSeen
    }));
  });
}

function countByInterval(events, intervalFn, start, end) {
  const counts = {};
  events.forEach((event) => {
    const date = new Date(event.timestamp);
    if (date < start || date > end) return;
    const key = intervalFn(date);
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function formatDateLabel(date) {
  return date.toISOString().slice(0, 10);
}

function getPeriodLabels(period, start, end) {
  const labels = [];
  const current = new Date(start);
  if (period === 'day') {
    while (current <= end) {
      labels.push(current.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      current.setHours(current.getHours() + 1);
    }
  } else {
    while (current <= end) {
      labels.push(formatDateLabel(current));
      current.setDate(current.getDate() + 1);
    }
  }
  return labels;
}

// Analytics route for charts and usage insights
app.get('/admin/analytics', checkAuth, async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const now = new Date();
    const start = getPeriodStart(period, now);
    const devices = await getAllDevices();
    const visibleDevices = devices.filter(Boolean);

    const getReportCount = (device) => {
      if (typeof device.reports === 'number' && device.reports >= 0) return device.reports;
      if (Array.isArray(device.history)) return device.history.length;
      return 0;
    };

    const totalConnections = visibleDevices.reduce((sum, d) => sum + getReportCount(d), 0);
    const activeDevices = visibleDevices.filter((device) => {
      if (!device.lastSeen) return false;
      return (new Date() - new Date(device.lastSeen)) <= 2 * 60 * 1000;
    }).length;

    const topDevices = [...visibleDevices]
      .map((device) => ({
        hostname: device.hostname || device.id || device.deviceId || 'Inconnu',
        reports: getReportCount(device)
      }))
      .sort((a, b) => b.reports - a.reports)
      .slice(0, 5);

    const platformCounts = visibleDevices.reduce((acc, device) => {
      const platform = device.platform || 'Inconnu';
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {});

    const platforms = Object.entries(platformCounts).map(([platform, count]) => ({ platform, count }));
    let events = normalizeHistoryEvents(visibleDevices);
    if (events.length === 0) {
      const fallbackTime = new Date().toISOString();
      events = visibleDevices.flatMap((device) => {
        const timestamp = device.lastSeen || device.firstSeen || fallbackTime;
        return [{
          timestamp,
          deviceId: device.id || device.deviceId || device.hostname || 'unknown',
          hostname: device.hostname,
          platform: device.platform,
          eventType: 'heartbeat',
          details: {}
        }];
      });
    }

    const dailyCounts = countByInterval(events, (date) => formatDateLabel(date), start, now);
    const hourlyCounts = countByInterval(events, (date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), start, now);

    const dailyLabels = getPeriodLabels(period, start, now);
    const daily = dailyLabels.map((label) => ({ date: label, count: dailyCounts[label] || 0 }));
    const hourly = Object.entries(hourlyCounts).map(([hour, count]) => ({ hour, count })).sort((a, b) => a.hour.localeCompare(b.hour));

    res.json({
      success: true,
      stats: { totalConnections, activeDevices },
      daily,
      hourly,
      topDevices,
      platforms
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, error: 'Erreur lors du calcul des analytics' });
  }
});

// Get latest version
app.get('/admin/latest-version', (req, res) => {
  res.json({
    success: true,
    latestVersion: '0.2.0',
    updateUrl: 'https://sonsa-browser.onrender.com/releases/sonsa-setup-0.2.0.exe'
  });
});

const server = app.listen(PORT, () => {
  console.log(`Admin server listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} déjà utilisé. Le serveur admin est probablement déjà lancé.`);
  } else {
    console.error('Erreur serveur admin:', err);
  }
});
