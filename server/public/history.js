// history.js – Premium per-device session history dashboard

// ─── Utilities ───────────────────────────────────────────────
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function loadDevices() {
  try {
    const resp = await fetch('/admin/devices');
    const data = await resp.json();
    if (data.success) return data.devices || [];
  } catch (e) {
    console.error('Impossible de charger les appareils', e);
  }
  return [];
}

function fmtDate(d) {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(d) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDuration(seconds) {
  if (seconds <= 0) return '< 1s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ─── Determine if device is currently online (seen < 2 min ago) ──
function isDeviceOnline(device) {
  if (!device.lastSeen) return false;
  return (Date.now() - new Date(device.lastSeen).getTime()) <= 2 * 60 * 1000;
}

// ─── Build sessions from events (startup/shutdown define boundaries) ──
function buildSessions(device) {
  const history = device.history || [];
  const allEvents = history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const sessions = [];
  let current = null;
  const SESSION_GAP = 5 * 60 * 1000; // Fallback for ungraceful disconnect

  allEvents.forEach(ev => {
    const ts = new Date(ev.timestamp);
    const url = ev.details?.url;

    if (ev.eventType === 'startup') {
      // Finalize previous session if exists
      if (current) {
        sessions.push(current);
      }
      // Start new session
      current = { start: ts, end: ts, urls: [], events: [ev] };
    } else if (ev.eventType === 'shutdown') {
      // Finalize current session with shutdown time
      if (current) {
        current.end = ts;
        sessions.push(current);
        current = null;
      }
    } else if (['heartbeat', 'navigation', 'web-test'].includes(ev.eventType)) {
      // Continue current session or create fallback
      if (!current) {
        current = { start: ts, end: ts, urls: [], events: [ev] };
      } else {
        const timeSinceLastEvent = ts - current.end;
        if (timeSinceLastEvent > SESSION_GAP) {
          // Ungraceful disconnect – finalize and start new
          sessions.push(current);
          current = { start: ts, end: ts, urls: [], events: [ev] };
        } else {
          // Update existing session
          current.end = ts;
          current.events.push(ev);
        }
      }
      // Collect URLs
      if (url) current.urls.push(url);
    }
  });

  // Finalize last session if exists
  if (current) sessions.push(current);

  // Sort most recent first
  sessions.sort((a, b) => b.start - a.start);
  return sessions;
}

// ─── Render the stats cards ──────────────────────────────────
function renderStats(device, sessions) {
  document.getElementById('h-device-name').textContent = device.hostname || device.id || 'Inconnu';
  document.getElementById('h-total-sessions').textContent = sessions.length;

  // Count unique pages
  const allUrls = sessions.flatMap(s => s.urls);
  document.getElementById('h-total-pages').textContent = allUrls.length;

  // Total time – include real-time duration for active session
  const online = isDeviceOnline(device);
  const now = Date.now();
  let totalSec = 0;
  sessions.forEach((s, idx) => {
    let durationMs;
    if (idx === 0 && online) {
      durationMs = now - s.start.getTime();
    } else {
      durationMs = s.end.getTime() - s.start.getTime();
    }
    totalSec += Math.round(durationMs / 1000);
  });
  document.getElementById('h-total-time').textContent = fmtDuration(totalSec);
}

// ─── Render the session table ────────────────────────────────
function renderSessionTable(device, sessions) {
  const tbody = document.getElementById('history-tbody');
  const emptyState = document.getElementById('empty-state');
  const badge = document.getElementById('session-badge');
  const online = isDeviceOnline(device);
  const now = Date.now();

  tbody.innerHTML = '';

  if (sessions.length === 0) {
    emptyState.classList.remove('hidden');
    badge.textContent = '0 sessions';
    return;
  }

  emptyState.classList.add('hidden');
  badge.textContent = `${sessions.length} session${sessions.length > 1 ? 's' : ''}`;

  sessions.forEach((session, idx) => {
    const row = document.createElement('tr');
    row.style.animationDelay = `${idx * 0.05}s`;

    // Date
    const dateStr = fmtDate(session.start);

    // Connection time
    const connectStr = fmtTime(session.start);

    // Disconnection time – "En cours" if this is the most recent session and device is online
    const isMostRecent = (idx === 0);
    let disconnectHTML;
    if (isMostRecent && online) {
      disconnectHTML = '<span class="status-active">En cours</span>';
    } else {
      disconnectHTML = `<span class="status-ended">${fmtTime(session.end)}</span>`;
    }

    // Duration – recalculate in real-time if session is active
    let durationMs;
    if (isMostRecent && online) {
      durationMs = now - session.start.getTime();
    } else {
      durationMs = session.end.getTime() - session.start.getTime();
    }
    const durationSec = Math.round(durationMs / 1000);
    const durationClass = durationSec < 60 ? 'duration-badge short' : 'duration-badge';
    const durationHTML = `<span class="${durationClass}">${fmtDuration(durationSec)}</span>`;

    // Sites – show unique domains as pills (max 4, then "+N")
    const uniqueDomains = [...new Set(session.urls.map(extractDomain).filter(Boolean))];
    const MAX_PILLS = 4;
    let sitesHTML = '<div class="sites-cell">';
    if (uniqueDomains.length > 0) {
      uniqueDomains.slice(0, MAX_PILLS).forEach(domain => {
        sitesHTML += `<span class="site-pill" title="${domain}">${domain}</span>`;
      });
      if (uniqueDomains.length > MAX_PILLS) {
        sitesHTML += `<span class="more-sites">+${uniqueDomains.length - MAX_PILLS}</span>`;
      }
    } else {
      sitesHTML += '<span style="color: #94a3b8;">Aucun</span>';
    }
    sitesHTML += '</div>';

    row.innerHTML = `
      <td>${dateStr}</td>
      <td><span class="time-connect">${connectStr}</span></td>
      <td>${disconnectHTML}</td>
      <td>${durationHTML}</td>
      <td>${sitesHTML}</td>
    `;
    tbody.appendChild(row);
  });
}

// ─── Init ────────────────────────────────────────────────────
async function init() {
  const id = getQueryParam('id');
  const subtitleEl = document.getElementById('device-subtitle');

  if (!id) {
    subtitleEl.textContent = 'Erreur : ID manquant dans l\'URL';
    return;
  }

  subtitleEl.textContent = 'Chargement des données…';
  await refreshHistory();

  refreshTimer = setInterval(refreshHistory, 1000);
}

let refreshTimer = null;
async function refreshHistory() {
  const id = getQueryParam('id');
  const subtitleEl = document.getElementById('device-subtitle');
  if (!id) return;

  const devices = await loadDevices();
  const device = devices.find(d => (d.id || d.hostname) === id);

  if (!device) {
    subtitleEl.textContent = 'Appareil non trouvé';
    document.getElementById('h-device-name').textContent = '—';
    document.getElementById('empty-state').classList.remove('hidden');
    return;
  }

  subtitleEl.textContent = `${device.hostname || device.id} • ${device.ipAddress || ''} • ${device.platform || ''}`;
  const sessions = buildSessions(device);
  renderStats(device, sessions);
  renderSessionTable(device, sessions);
}

// ─── Events ──────────────────────────────────────────────────
const backBtn = document.getElementById('back-btn');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    window.location.href = 'admin.html';
  });
}

window.addEventListener('DOMContentLoaded', init);
