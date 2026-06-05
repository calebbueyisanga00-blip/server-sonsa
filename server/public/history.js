// history.js – Premium per-device session history dashboard

// ─── Utilities ───────────────────────────────────────────────
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ─── Authentication Display Helpers ──────────────────────────
function showLoginOverlay() {
  document.getElementById('login-overlay').classList.remove('hidden');
}

function hideLoginOverlay() {
  document.getElementById('login-overlay').classList.add('hidden');
}

async function checkAuthentication() {
  const token = localStorage.getItem('sonsa_admin_token');
  if (!token) {
    showLoginOverlay();
    return false;
  }

  try {
    const response = await fetch('/admin/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await response.json();
    if (data.success) {
      hideLoginOverlay();
      return true;
    }
    showLoginOverlay();
    return false;
  } catch (e) {
    console.error('Verification failed:', e);
    showLoginOverlay();
    return false;
  }
}

async function loadDevices() {
  const token = localStorage.getItem('sonsa_admin_token');
  try {
    const resp = await fetch('/admin/devices', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (resp.status === 401) {
      localStorage.removeItem('sonsa_admin_token');
      showLoginOverlay();
      return [];
    }

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

  historyState.device = device;
  historyState.sessions = sessions;
  historyState.activeSessionIndex = online && sessions.length > 0 ? 0 : -1;
}

function updateLiveTotals() {
  if (!historyState.device || historyState.sessions.length === 0) return;

  const online = isDeviceOnline(historyState.device);
  const now = Date.now();
  let totalSec = 0;

  historyState.sessions.forEach((s, idx) => {
    const durationMs = (idx === historyState.activeSessionIndex && online)
      ? now - s.start.getTime()
      : s.end.getTime() - s.start.getTime();
    totalSec += Math.max(0, Math.round(durationMs / 1000));
  });

  const totalTimeEl = document.getElementById('h-total-time');
  if (totalTimeEl) {
    totalTimeEl.textContent = fmtDuration(totalSec);
  }

  if (online && historyState.activeSessionIndex >= 0) {
    const activeRow = document.querySelector(`tr[data-session-index="${historyState.activeSessionIndex}"]`);
    if (activeRow) {
      const durationCell = activeRow.querySelector('td:nth-child(4) span');
      if (durationCell) {
        const currentDuration = Math.max(0, Math.round((now - historyState.sessions[historyState.activeSessionIndex].start.getTime()) / 1000));
        durationCell.textContent = fmtDuration(currentDuration);
      }
      const disconnectCell = activeRow.querySelector('td:nth-child(3)');
      if (disconnectCell && disconnectCell.textContent.trim() !== 'En cours') {
        disconnectCell.innerHTML = '<span class="status-active">En cours</span>';
      }
    }
  }
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

    // Sites – show unique URLs as clickable links with line-break styling
    const uniqueUrls = [...new Set(session.urls.filter(Boolean))];
    let sitesHTML = '<div class="sites-cell" style="display: flex; flex-direction: column; gap: 8px; max-width: 600px; word-break: break-all;">';
    if (uniqueUrls.length > 0) {
      uniqueUrls.forEach(url => {
        sitesHTML += `<a href="${url}" target="_blank" class="history-url-link" style="color: #2563eb; text-decoration: none; font-size: 0.85rem; transition: color 0.2s;" onmouseover="this.style.color='#1d4ed8'; this.style.textDecoration='underline';" onmouseout="this.style.color='#2563eb'; this.style.textDecoration='none';">${url}</a>`;
      });
    } else {
      sitesHTML += '<span style="color: #94a3b8; font-style: italic;">Aucune navigation</span>';
    }
    sitesHTML += '</div>';

    row.innerHTML = `
      <td>${dateStr}</td>
      <td><span class="time-connect">${connectStr}</span></td>
      <td>${disconnectHTML}</td>
      <td>${durationHTML}</td>
      <td>${sitesHTML}</td>
    `;
    row.dataset.sessionIndex = idx;
    tbody.appendChild(row);
  });
}

// ─── State for live updates ─────────────────────────────────
const historyState = {
  device: null,
  sessions: [],
  activeSessionIndex: -1
};
let refreshTimer = null;
let liveUpdateTimer = null;

async function init() {
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.classList.add('hidden');

    try {
      const response = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('sonsa_admin_token', data.token);
        hideLoginOverlay();
        document.getElementById('login-password').value = '';
        await refreshHistory();
      } else {
        errorEl.textContent = data.error || 'Erreur de connexion';
        errorEl.classList.remove('hidden');
      }
    } catch (err) {
      errorEl.textContent = 'Erreur réseau';
      errorEl.classList.remove('hidden');
    }
  });

  const id = getQueryParam('id');
  const subtitleEl = document.getElementById('device-subtitle');

  if (!id) {
    subtitleEl.textContent = 'Erreur : ID manquant dans l\'URL';
    return;
  }

  subtitleEl.textContent = 'Chargement des données…';

  const authenticated = await checkAuthentication();
  if (authenticated) {
    await refreshHistory();
    refreshTimer = setInterval(refreshHistory, 5000);
    liveUpdateTimer = setInterval(updateLiveTotals, 1000);
  }
}

async function refreshHistory() {
  const authenticated = await checkAuthentication();
  if (!authenticated) {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
    return;
  }

  const id = getQueryParam('id');
  const subtitleEl = document.getElementById('device-subtitle');
  if (!id) return;

  const devices = await loadDevices();
  const device = devices.find(d => {
    const deviceId = d.id || d.deviceId || d.hostname;
    return deviceId === id;
  });

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
