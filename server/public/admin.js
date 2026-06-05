// Formatage des dates
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatFrequency(seconds) {
  if (!seconds && seconds !== 0) return 'Premier signal';
  if (seconds < 60) return `Toutes les ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Toutes les ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return `Toutes les ${hours} h`;
}

function formatEventType(eventType) {
  const labels = {
    startup: 'Démarrage',
    heartbeat: 'Présence',
    navigation: 'Navigation',
    'web-test': 'Test web'
  };
  return labels[eventType] || eventType || 'Présence';
}

function hasUsableNetworkIdentity(device) {
  return device &&
    device.ipAddress && device.ipAddress !== '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' && device.ipAddress !== 'unknown' &&
    device.macAddress && device.macAddress !== 'unknown' && device.macAddress !== 'non-disponible';
}

// ─── Authentication Helper Display ──────────────────────────
function showLoginOverlay() {
  document.getElementById('login-overlay').classList.remove('hidden');
}

function hideLoginOverlay() {
  document.getElementById('login-overlay').classList.add('hidden');
}

function logout() {
  localStorage.removeItem('sonsa_admin_token');
  showLoginOverlay();
}

// Check if authenticated
async function checkAuthentication() {
  const token = localStorage.getItem('sonsa_admin_token');
  if (!token) {
    return false;
  }

  try {
    const response = await fetch('/admin/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await response.json();
    return data.success ? true : false;
  } catch (e) {
    return false;
  }
}

// Charger les appareils du serveur
async function loadDevices() {
  const token = localStorage.getItem('sonsa_admin_token');
  try {
    const response = await fetch('/admin/devices', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('sonsa_admin_token');
      showLoginOverlay();
      return [];
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('Erreur de serveur');
    }
    return data.devices || [];
  } catch (error) {
    console.error('Impossible de charger les appareils :', error);
    return [];
  }
}

// Calculer les statistiques
function calculateStats(devices) {
  const visibleDevices = devices.filter(hasUsableNetworkIdentity);
  const stats = {
    totalDevices: visibleDevices.length,
    totalReports: visibleDevices.reduce((sum, d) => sum + (d.reports || 0), 0),
    platforms: {},
    avgReportsPerDevice: 0,
    mostActive: null
  };

  // Compter les plateformes
  visibleDevices.forEach(device => {
    const platform = device.platform || 'unknown';
    stats.platforms[platform] = (stats.platforms[platform] || 0) + 1;
  });

  // Plateforme la plus courante
  if (Object.keys(stats.platforms).length > 0) {
    const platformNames = {
      win32: 'Windows',
      darwin: 'macOS',
      linux: 'Linux',
      unknown: 'Inconnu'
    };
    const mostCommon = Object.keys(stats.platforms).reduce((a, b) =>
      stats.platforms[a] > stats.platforms[b] ? a : b
    );
    stats.mostCommonPlatform = platformNames[mostCommon] || mostCommon;
  }

  // Appareil le plus actif
  if (visibleDevices.length > 0) {
    stats.mostActive = visibleDevices.reduce((max, d) => d.reports > max.reports ? d : max);
    stats.avgReportsPerDevice = Math.round(stats.totalReports / stats.totalDevices);
  }

  return stats;
}

// Déterminer si un appareil est en ligne (dernière activité < 2 minutes)
function isOnline(device) {
  if (!device.lastSeen) return false;
  const last = new Date(device.lastSeen);
  const now = new Date();
  return (now - last) <= 2 * 60 * 1000; // 2 minutes
}

// Rendre le tableau des appareils avec statut et bouton historique
function renderDevices(devices) {
  const tbody = document.getElementById('device-table');
  const emptyState = document.getElementById('empty-state');
  const visibleDevices = devices.filter(hasUsableNetworkIdentity);

  tbody.innerHTML = '';

  if (visibleDevices.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  const sortedDevices = [...visibleDevices].sort((a, b) => (b.reports || 0) - (a.reports || 0));

  sortedDevices.forEach((device, index) => {
    const row = document.createElement('tr');
    const online = isOnline(device);
    const statusBadge = `<span class="status-badge ${online ? 'online' : 'offline'}">${online ? 'En ligne' : 'Déconnecté'}</span>`;
    const emailStr = device.email ? `<code>${device.email}</code>` : '<span style="color: #94a3b8; font-style: italic;">Non connecté</span>';
    const deviceId = device.id || device.deviceId || device.hostname || `device-${index}`;

    row.dataset.deviceId = deviceId;
    row.innerHTML = `
      <td><strong>#${index + 1} ${device.hostname}</strong></td>
      <td>${emailStr}</td>
      <td><code>${device.ipAddress}</code></td>
      <td><code>${device.macAddress}</code></td>
      <td>${device.platform} ${device.arch || ''}</td>
      <td>${statusBadge}</td>
      <td><button class="history-btn btn btn-secondary" data-id="${deviceId}">🕘 Historique</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Rendre les statistiques
function renderStats(devices) {
  const stats = calculateStats(devices);
  document.getElementById('stat-devices').textContent = stats.totalDevices;
  document.getElementById('stat-platform').textContent = stats.mostCommonPlatform || '-';
}

// Charger et afficher les données
async function refreshDashboard() {
  const authenticated = await checkAuthentication();
  if (!authenticated) return;

  const devices = await loadDevices();
  window.__allDevices = devices;
  renderDevices(devices);
  renderStats(devices);
  document.getElementById('sync-time').textContent = formatTime(new Date().toISOString());
}

// ─── Real-time Update with minimal DOM reflow ─────────────────────────
let isUpdating = false;
function startRealTimeUpdates() {
  // Initial load
  refreshDashboardQuiet();
  // Poll every 3 seconds for new device data without flicker
  setInterval(refreshDashboardQuiet, 3000);
  // Update online states and sync time every second for smoother UI
  setInterval(updateLiveDashboardUI, 1000);
}

function updateLiveDashboardUI() {
  const devices = window.__allDevices || [];
  if (devices.length === 0) {
    document.getElementById('sync-time').textContent = formatTime(new Date().toISOString());
    return;
  }

  const tbody = document.getElementById('device-table');
  devices.forEach((device) => {
    const deviceId = device.id || device.deviceId || device.hostname;
    const row = tbody.querySelector(`tr[data-device-id="${deviceId}"]`);
    if (row) {
      const online = isOnline(device);
      const badge = row.querySelector('.status-badge');
      if (badge) {
        const shouldBeOnline = online;
        const isCurrentlyOnline = badge.classList.contains('online');
        if ((shouldBeOnline && !isCurrentlyOnline) || (!shouldBeOnline && isCurrentlyOnline)) {
          badge.className = 'status-badge ' + (online ? 'online' : 'offline');
          badge.textContent = online ? 'En ligne' : 'Déconnecté';
        }
      }
    }
  });
  document.getElementById('sync-time').textContent = formatTime(new Date().toISOString());
}

async function refreshDashboardQuiet() {
  if (isUpdating) return;
  isUpdating = true;
  
  try {
    const devices = await loadDevices();
    if (!devices) {
      isUpdating = false;
      return;
    }
    
    window.__allDevices = devices;
    if (devices.length === 0) {
      renderDevices([]);
      renderStats([]);
      document.getElementById('sync-time').textContent = formatTime(new Date().toISOString());
      isUpdating = false;
      return;
    }

    const visibleDevices = devices.filter(hasUsableNetworkIdentity);
    
    // Update table rows only if changed
    const tbody = document.getElementById('device-table');
    const existingIds = Array.from(tbody.querySelectorAll('tr')).map((row) => row.dataset.deviceId);
    const newIds = visibleDevices.map((device, idx) => device.id || device.deviceId || device.hostname || `device-${idx}`);
    const needsRender = existingIds.length !== newIds.length || existingIds.some((id, idx) => id !== newIds[idx]);
    
    if (needsRender) {
      renderDevices(devices);
    } else {
      // Update status badges in-place without re-rendering
      visibleDevices.forEach((device) => {
        const deviceId = device.id || device.deviceId || device.hostname;
        const row = tbody.querySelector(`tr[data-device-id="${deviceId}"]`);
        if (row) {
          const online = isOnline(device);
          const badge = row.querySelector('.status-badge');
          if (badge) {
            const isCurrentlyOnline = badge.classList.contains('online');
            if ((online && !isCurrentlyOnline) || (!online && isCurrentlyOnline)) {
              badge.className = 'status-badge ' + (online ? 'online' : 'offline');
              badge.textContent = online ? 'En ligne' : 'Déconnecté';
            }
          }
        }
      });
    }
    
    // Update stats without flashing
    const stats = calculateStats(devices);
    const statDevicesEl = document.getElementById('stat-devices');
    const statPlatformEl = document.getElementById('stat-platform');

    if (statDevicesEl && statDevicesEl.textContent !== String(stats.totalDevices)) {
      statDevicesEl.textContent = stats.totalDevices;
    }
    if (statPlatformEl && statPlatformEl.textContent !== (stats.mostCommonPlatform || '-')) {
      statPlatformEl.textContent = stats.mostCommonPlatform || '-';
    }
    
    document.getElementById('sync-time').textContent = formatTime(new Date().toISOString());
  } catch (e) {
    console.error('Quiet update failed:', e);
  } finally {
    isUpdating = false;
  }
}

// Événements DOM
window.addEventListener('DOMContentLoaded', () => {
  // Login flow
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
        refreshDashboard();
      } else {
        errorEl.textContent = data.error || 'Erreur de connexion';
        errorEl.classList.remove('hidden');
      }
    } catch (err) {
      errorEl.textContent = 'Erreur réseau';
      errorEl.classList.remove('hidden');
    }
  });

  const changePwdBtn = document.getElementById('change-pwd-btn');
  const passwordModal = document.getElementById('password-modal');
  const closePwdModal = document.getElementById('close-password-modal');
  const passwordForm = document.getElementById('password-form');

  if (changePwdBtn) {
    changePwdBtn.addEventListener('click', () => {
      passwordModal.classList.remove('hidden');
      document.getElementById('password-error').classList.add('hidden');
      document.getElementById('password-success').classList.add('hidden');
    });
  }

  if (closePwdModal) {
    closePwdModal.addEventListener('click', () => {
      passwordModal.classList.add('hidden');
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('old-password').value;
      const newPassword = document.getElementById('new-password').value;
      const errorEl = document.getElementById('password-error');
      const successEl = document.getElementById('password-success');

      errorEl.classList.add('hidden');
      successEl.classList.add('hidden');

      const token = localStorage.getItem('sonsa_admin_token');
      try {
        const response = await fetch('/admin/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ oldPassword, newPassword })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          successEl.classList.remove('hidden');
          document.getElementById('old-password').value = '';
          document.getElementById('new-password').value = '';
          setTimeout(() => {
            localStorage.removeItem('sonsa_admin_token');
            passwordModal.classList.add('hidden');
            showLoginOverlay();
          }, 2000);
        } else {
          errorEl.textContent = data.error || 'Erreur lors de la modification';
          errorEl.classList.remove('hidden');
        }
      } catch (err) {
        errorEl.textContent = 'Erreur de connexion réseau';
        errorEl.classList.remove('hidden');
      }
    });
  }

  // Initial check and dashboard load
  checkAuthentication().then((authenticated) => {
    if (!authenticated) {
      showLoginOverlay();
    } else {
      hideLoginOverlay();
      startRealTimeUpdates();
    }
  });

  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshDashboard);
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  document.addEventListener('click', e => {
    if (e.target && e.target.classList.contains('history-btn')) {
      const id = e.target.getAttribute('data-id');
      if (id) {
        const url = new URL('history.html', window.location.origin);
        url.searchParams.set('id', id);
        window.location.href = url.href;
      }
    }
  });
});
