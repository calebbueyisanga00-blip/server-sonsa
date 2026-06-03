const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const dataPath = path.join(dataDir, 'devices.json');

// Middleware CORS pour accepter les requêtes de l'app Electron
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') res.sendStatus(200);
  else next();
});

app.use(express.json());

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

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
    console.error('Impossible de lire les données :', error);
    return { devices: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

function generateDeviceId(report, remoteAddress) {
  const seed = `${report.deviceId || ''}-${report.hostname || ''}-${report.macAddress || ''}-${report.ipAddress || remoteAddress}`;
  return crypto.createHash('sha256').update(seed).digest('hex');
}

function upsertDevice(report) {
  const data = loadData();
  let device = data.devices.find((d) => d.deviceId === report.deviceId);
  const now = new Date().toISOString();

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
    // Ensure history array exists
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
      history: [{
        timestamp: now,
        eventType: report.eventType,
        details: report.details || {}
      }]
    };
    data.devices.push(device);
  }

  saveData(data);
  return data.devices.find((d) => d.deviceId === report.deviceId);
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  res.redirect('/admin.html');
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/device/report', (req, res) => {
  // Extract client IP from various sources
  let remoteIp = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.socket.remoteAddress;
  
  // Convert IPv6 loopback to IPv4 loopback
  if (remoteIp === '::1') {
    remoteIp = '127.0.0.1';
  }
  // Remove IPv6 prefix if present
  if (remoteIp && remoteIp.includes('::ffff:')) {
    remoteIp = remoteIp.replace('::ffff:', '');
  }

  const payload = req.body || {};
  
  // Use IP from payload if available and not 'unknown', otherwise use remoteIp
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
    platform: payload.platform
  });

  const device = upsertDevice(payload);
  return res.json({ success: true, device });
});

app.get('/admin/devices', (req, res) => {
  const data = loadData();
  res.json({ success: true, devices: data.devices || [] });
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
