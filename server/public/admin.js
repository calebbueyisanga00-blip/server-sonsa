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
    device.ipAddress && device.ipAddress !== '127.0.0.1' && device.ipAddress !== 'unknown' &&
    device.macAddress && device.macAddress !== 'unknown' && device.macAddress !== 'non-disponible';
}

// Charger les appareils du serveur
async function loadDevices() {
  try {
    const response = await fetch('/admin/devices');
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

    row.innerHTML = `
      <td><strong>#${index + 1} ${device.hostname}</strong></td>
      <td><code>${device.ipAddress}</code></td>
      <td><code>${device.macAddress}</code></td>
      <td>${device.platform} ${device.arch || ''}</td>
      <td>${statusBadge}</td>
      <td><button class="history-btn btn btn-secondary" data-id="${device.id || device.hostname}">🕘 Historique</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Rendre l'historique d'un appareil dans le modal
let usageChart = null;
function renderHistory(device) {
  const listEl = document.getElementById('history-list');
  const ctx = document.getElementById('usage-chart').getContext('2d');

  // Remplir la liste des URL
  listEl.innerHTML = '';
  const navEvents = (device.history || []).filter(e => e.eventType === 'navigation');
  navEvents.forEach(ev => {
    const li = document.createElement('li');
    li.textContent = `${formatTime(ev.timestamp)} – ${ev.details?.url || 'URL inconnue'}`;
    listEl.appendChild(li);
  });

  // Préparer les données du graphique (nombre de navigations par heure sur les dernières 24 h)
  const now = new Date();
  const labels = [];
  const data = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    const label = `${hour.getHours().toString().padStart(2, '0')}:00`;
    labels.push(label);
    const count = navEvents.filter(ev => {
      const d = new Date(ev.timestamp);
      return d.getHours() === hour.getHours() && d.getDate() === hour.getDate() &&
        d.getMonth() === hour.getMonth() && d.getFullYear() === hour.getFullYear();
    }).length;
    data.push(count);
  }

  if (usageChart) usageChart.destroy();
  usageChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Navigations par heure',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.6)'
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });

  document.getElementById('history-device-name').textContent = device.hostname || device.id || '';
  document.getElementById('history-modal').classList.remove('hidden');
}

function closeHistoryModal() {
  document.getElementById('history-modal').classList.add('hidden');
}

// Rendre les statistiques
function renderStats(devices) {
  const stats = calculateStats(devices);
  document.getElementById('stat-devices').textContent = stats.totalDevices;
  document.getElementById('stat-reports').textContent = stats.totalReports;
  document.getElementById('stat-platform').textContent = stats.mostCommonPlatform || '-';
  document.getElementById('stat-updated').textContent = formatTime(new Date().toISOString());
}


// Charger et afficher les données
async function refreshDashboard() {
  const devices = await loadDevices();
  window.__allDevices = devices;
  renderDevices(devices);
  renderStats(devices);
  document.getElementById('sync-time').textContent = formatTime(new Date().toISOString());
}

// Événements DOM
window.addEventListener('DOMContentLoaded', () => {
  refreshDashboard();

  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshDashboard);
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

  const closeModalBtn = document.getElementById('close-history-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeHistoryModal);
  }

  setInterval(refreshDashboard, 30000);
});
