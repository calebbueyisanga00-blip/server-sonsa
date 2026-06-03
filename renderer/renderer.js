const adminUrl = 'http://localhost:3001';
const statusEl = document.getElementById('status');
const deviceInfoEl = document.getElementById('device-info');
// omnibox (single unified input)
const omniboxForm = document.getElementById('omnibox-form');
const omniboxInput = document.getElementById('omnibox-input');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const webview = document.getElementById('webview');
const heroSection = document.querySelector('.hero');
const browserWindow = document.querySelector('.browser-window');
const appShell = document.querySelector('.app-shell');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const refreshBtn = document.getElementById('refresh-btn');
const homeBtn = document.getElementById('home-btn');
const favoriteBtn = document.getElementById('favorite-btn');
const newTabBtn = document.getElementById('new-tab');
const tabList = document.getElementById('tab-list');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const saveSettings = document.getElementById('save-settings');
const homePageInput = document.getElementById('home-page-input');
const autoReportToggle = document.getElementById('auto-report');

const defaultSearch = 'https://www.google.com/search?q=';
const reportIntervalMs = 5 * 60 * 1000;
let defaultHome = 'https://www.google.com';
let tabs = [];
let currentTabId = null;
let favorites = JSON.parse(localStorage.getItem('sonsa_favorites') || '[]');
let history = JSON.parse(localStorage.getItem('sonsa_history') || '[]');
let autoReportEnabled = localStorage.getItem('sonsa_auto_report') !== 'false';
let reportInFlight = false;
let lastDeviceInfo = null; // Store device info for shutdown event

function normalizeUrl(value) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (/^[\w\-]+\.[\w\-]+/.test(value)) return `https://${value}`;
  return `${defaultSearch}${encodeURIComponent(value)}`;
}

function createTab(url, title = 'Nouvel onglet') {
  const tabId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const tab = { id: tabId, url, title };
  tabs.push(tab);
  currentTabId = tabId;
  renderTabs();
  if (url === defaultHome || url === 'about:blank') {
    showHero();
    if (omniboxInput) omniboxInput.value = '';
    if (webview) webview.src = 'about:blank';
  } else {
    openUrl(url, false);
  }
}

function renderTabs() {
  tabList.innerHTML = '';
  tabs.forEach((tab) => {
    const tabEl = document.createElement('div');
    tabEl.className = `tab-item${tab.id === currentTabId ? ' active' : ''}`;
    
    const titleEl = document.createElement('span');
    titleEl.className = 'tab-title';
    let displayTitle = tab.title || tab.url;
    if (displayTitle.length > 25) {
      displayTitle = displayTitle.slice(0, 22) + '...';
    }
    titleEl.textContent = displayTitle;
    titleEl.addEventListener('click', () => switchTab(tab.id));
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Fermer l\'onglet';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });
    
    tabEl.appendChild(titleEl);
    tabEl.appendChild(closeBtn);
    tabList.appendChild(tabEl);
  });
}

function switchTab(tabId) {
  const tab = tabs.find((t) => t.id === tabId);
  if (!tab) return;
  currentTabId = tabId;
  if (tab.url === defaultHome || tab.url === 'about:blank') {
    showHero();
    if (omniboxInput) omniboxInput.value = '';
    if (webview) webview.src = 'about:blank';
  } else {
    showBrowser();
    if (omniboxInput) omniboxInput.value = tab.url;
    if (webview) webview.src = tab.url;
  }
  renderTabs();
  updateNavButtons();
}

function updateCurrentTab(url, title) {
  const tab = tabs.find((t) => t.id === currentTabId);
  if (!tab) return;
  tab.url = url;
  if (title) tab.title = title;
  renderTabs();
}

function closeTab(tabId) {
  const index = tabs.findIndex((t) => t.id === tabId);
  if (index === -1) return;
  
  tabs.splice(index, 1);
  
  if (tabs.length === 0) {
    createTab(defaultHome, 'Accueil');
  } else {
    if (currentTabId === tabId) {
      const nextActiveIndex = Math.min(index, tabs.length - 1);
      switchTab(tabs[nextActiveIndex].id);
    } else {
      renderTabs();
    }
  }
}

function updateNavButtons() {
  if (!webview) return;
  try {
    backBtn.disabled = !webview.canGoBack();
    forwardBtn.disabled = !webview.canGoForward();
  } catch (e) {}
}

function saveFavorites() { localStorage.setItem('sonsa_favorites', JSON.stringify(favorites)); }
function saveHistory() { localStorage.setItem('sonsa_history', JSON.stringify(history.slice(-200))); }

function addToHistory(url) {
  if (!url || url === 'about:blank') return;
  history.push({ url, timestamp: new Date().toISOString() });
  saveHistory();
}

function renderFavorites() {
  const list = document.getElementById('favorites-list');
  if (!list) return;
  list.innerHTML = '';
  if (favorites.length === 0) {
    list.innerHTML = '<p style="color: #94a3b8; padding: 12px;">Aucun favori enregistré.</p>';
    return;
  }
  favorites.forEach((url, i) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    const urlDiv = document.createElement('div');
    urlDiv.className = 'list-item-url';
    urlDiv.textContent = url;
    const actions = document.createElement('div');
    actions.className = 'list-item-actions';
    const openBtn = document.createElement('button');
    openBtn.className = 'btn-open';
    openBtn.textContent = 'Ouvrir';
    openBtn.addEventListener('click', () => openFavorite(url));
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => { favorites.splice(i, 1); saveFavorites(); renderFavorites(); });
    actions.appendChild(openBtn);
    actions.appendChild(delBtn);
    item.appendChild(urlDiv);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  list.innerHTML = '';
  if (history.length === 0) {
    list.innerHTML = '<p style="color: #94a3b8; padding: 12px;">Aucun historique.</p>';
    return;
  }
  const sorted = [...history].reverse();
  sorted.forEach((h) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    const left = document.createElement('div');
    const urlDiv = document.createElement('div');
    urlDiv.className = 'list-item-url';
    urlDiv.textContent = h.url;
    const meta = document.createElement('div');
    meta.style.fontSize = '0.8rem';
    meta.style.color = '#64748b';
    meta.style.marginTop = '4px';
    meta.textContent = new Date(h.timestamp).toLocaleString('fr-FR');
    left.appendChild(urlDiv);
    left.appendChild(meta);
    const actions = document.createElement('div');
    actions.className = 'list-item-actions';
    const openBtn = document.createElement('button');
    openBtn.className = 'btn-open';
    openBtn.textContent = 'Ouvrir';
    openBtn.addEventListener('click', () => { openUrl(h.url); settingsModal.classList.add('hidden'); });
    actions.appendChild(openBtn);
    item.appendChild(left);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

function openFavorite(url) {
  if (omniboxInput) omniboxInput.value = url;
  openUrl(url);
  settingsModal.classList.add('hidden');
}

function addFavorite(url) {
  if (!url) return;
  if (!favorites.includes(url)) {
    favorites.push(url);
    saveFavorites();
    renderFavorites();
    statusEl.textContent = 'Ajouté aux favoris.';
  } else {
    statusEl.textContent = 'Déjà dans les favoris.';
  }
}

function clearHistory() {
  if (!confirm("Effacer tout l'historique ?")) return;
  history = [];
  saveHistory();
  renderHistory();
}

function setupModalTabs() {
  document.querySelectorAll('.modal-tab').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const tabName = e.currentTarget.dataset.tab;
      document.querySelectorAll('.modal-tab').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.modal-tab-content').forEach((c) => c.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const tabEl = document.getElementById(`${tabName}-tab`);
      if (tabEl) tabEl.classList.add('active');
      if (tabName === 'favorites') renderFavorites();
      if (tabName === 'history') renderHistory();
    });
  });
  const clearBtn = document.getElementById('clear-history');
  if (clearBtn) clearBtn.addEventListener('click', clearHistory);
}

async function reportDevice(eventType = 'heartbeat', details = {}) {
  if (!autoReportEnabled) {
    statusEl.textContent = 'Reporting automatique désactivé.';
    return;
  }
  if (reportInFlight) return;
  reportInFlight = true;
  statusEl.textContent = 'Statut : envoi des informations au serveur admin...';
  try {
    const result = await window.deviceApi.reportDevice(adminUrl, eventType, details);
    if (result && result.success) {
      statusEl.textContent = 'Statut : connecté au serveur admin.';
      deviceInfoEl.textContent = `Machine : ${result.device.hostname} • IP : ${result.device.ipAddress} • MAC : ${result.device.macAddress || 'N/A'}`;
      // Cache device info for shutdown event
      lastDeviceInfo = {
        deviceId: result.device.deviceId || result.device.id,
        hostname: result.device.hostname,
        ipAddress: result.device.ipAddress,
        macAddress: result.device.macAddress,
        platform: result.device.platform,
        arch: result.device.arch
      };
    } else {
      statusEl.textContent = `Erreur serveur admin : ${result && result.error ? result.error : 'impossible de joindre le serveur'}`;
    }
  } catch (err) {
    statusEl.textContent = `Erreur envoi: ${err.message}`;
  } finally {
    reportInFlight = false;
  }
}

function showBrowser() {
  if (heroSection) heroSection.classList.add('hidden');
  if (browserWindow) browserWindow.classList.add('active');
  if (appShell) appShell.classList.add('browser-active');
}

function showHero() {
  if (heroSection) heroSection.classList.remove('hidden');
  if (browserWindow) browserWindow.classList.remove('active');
  if (appShell) appShell.classList.remove('browser-active');
}

function openSearch(query) {
  const cleaned = (query || '').trim();
  if (!cleaned) { statusEl.textContent = 'Entrez un mot-clé pour démarrer la recherche.'; return; }
  const url = `${defaultSearch}${encodeURIComponent(cleaned)}`;
  showBrowser();
  updateCurrentTab(url, `Recherche: ${cleaned}`);
  if (webview) webview.src = url;
}

function openUrl(value, updateTab = true) {
  const url = normalizeUrl((value || '').trim());
  if (!url) { statusEl.textContent = 'Entrez une URL ou une recherche.'; return; }
  statusEl.textContent = 'Statut : navigation en cours...';
  showBrowser();
  if (updateTab) updateCurrentTab(url, url.replace(/^https?:\/\//, '').replace(/\/$/, ''));
  if (webview) webview.src = url;
  addToHistory(url);
}

// Event bindings
// Bind omnibox
if (omniboxForm) {
  omniboxForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = omniboxInput ? omniboxInput.value : '';
    openUrl(v);
  });
}
if (searchForm) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchInput ? searchInput.value : '';
    openSearch(q);
  });
  // Add click handler for search button(s) within the hero area
  document.querySelectorAll('.search-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const q = searchInput ? searchInput.value : '';
      openSearch(q);
    });
  });
}
backBtn.addEventListener('click', () => {
  try {
    if (webview && webview.canGoBack()) {
      webview.goBack();
    }
  } catch (e) {}
});
forwardBtn.addEventListener('click', () => {
  try {
    if (webview && webview.canGoForward()) {
      webview.goForward();
    }
  } catch (e) {}
});
refreshBtn.addEventListener('click', () => {
  try {
    if (webview) webview.reload();
  } catch (e) {}
});
homeBtn.addEventListener('click', () => {
  updateCurrentTab(defaultHome, 'Accueil');
  if (omniboxInput) omniboxInput.value = '';
  if (webview) webview.src = 'about:blank';
  showHero();
});
favoriteBtn.addEventListener('click', () => {
  const cur = tryGetWebviewURL() || (omniboxInput ? omniboxInput.value : '') || defaultHome;
  addFavorite(cur);
});
function openSettingsModal(activeTabName) {
  if (homePageInput) homePageInput.value = defaultHome;
  if (autoReportToggle) autoReportToggle.checked = autoReportEnabled;
  
  document.querySelectorAll('.modal-tab').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.modal-tab-content').forEach((c) => c.classList.remove('active'));
  
  const tabBtn = document.querySelector(`.modal-tab[data-tab="${activeTabName}"]`);
  const tabEl = document.getElementById(`${activeTabName}-tab`);
  if (tabBtn) tabBtn.classList.add('active');
  if (tabEl) tabEl.classList.add('active');
  
  if (activeTabName === 'favorites') renderFavorites();
  if (activeTabName === 'history') renderHistory();
  
  if (settingsModal) settingsModal.classList.remove('hidden');
}

// Bind menu toggle
const menuBtn = document.getElementById('menu-btn');
const menuDropdown = document.getElementById('sonsa-menu-dropdown');

if (menuBtn && menuDropdown) {
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!menuDropdown.classList.contains('hidden') && !menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
      menuDropdown.classList.add('hidden');
    }
  });
}

// Bind dropdown actions
document.getElementById('menu-new-tab')?.addEventListener('click', () => {
  createTab(defaultHome, 'Nouvel onglet');
  if (menuDropdown) menuDropdown.classList.add('hidden');
});

document.getElementById('menu-new-window')?.addEventListener('click', () => {
  createTab(defaultHome, 'Nouvel onglet');
  if (menuDropdown) menuDropdown.classList.add('hidden');
});

document.getElementById('menu-incognito')?.addEventListener('click', () => {
  createTab('about:blank', 'Navigation privée');
  if (menuDropdown) menuDropdown.classList.add('hidden');
});

document.getElementById('menu-settings-btn')?.addEventListener('click', () => {
  openSettingsModal('settings');
  if (menuDropdown) menuDropdown.classList.add('hidden');
});

document.getElementById('menu-history-btn')?.addEventListener('click', () => {
  openSettingsModal('history');
  if (menuDropdown) menuDropdown.classList.add('hidden');
});

document.getElementById('menu-favorites-btn')?.addEventListener('click', () => {
  openSettingsModal('favorites');
  if (menuDropdown) menuDropdown.classList.add('hidden');
});

document.getElementById('menu-clear-history-btn')?.addEventListener('click', () => {
  clearHistory();
  if (menuDropdown) menuDropdown.classList.add('hidden');
});

// Zoom factors
let currentZoomFactor = 1.0;
const zoomLevelEl = document.getElementById('zoom-level');

document.getElementById('zoom-in')?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (webview) {
    currentZoomFactor = Math.min(currentZoomFactor + 0.1, 3.0);
    webview.setZoomFactor(currentZoomFactor);
    if (zoomLevelEl) zoomLevelEl.textContent = `${Math.round(currentZoomFactor * 100)}%`;
  }
});

document.getElementById('zoom-out')?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (webview) {
    currentZoomFactor = Math.max(currentZoomFactor - 0.1, 0.5);
    webview.setZoomFactor(currentZoomFactor);
    if (zoomLevelEl) zoomLevelEl.textContent = `${Math.round(currentZoomFactor * 100)}%`;
  }
});

document.getElementById('zoom-fullscreen')?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
  if (menuDropdown) menuDropdown.classList.add('hidden');
});

newTabBtn.addEventListener('click', () => { createTab(defaultHome, 'Nouvel onglet'); });
closeSettings.addEventListener('click', () => { settingsModal.classList.add('hidden'); });
saveSettings.addEventListener('click', () => {
  defaultHome = normalizeUrl(homePageInput.value) || defaultHome;
  autoReportEnabled = !!autoReportToggle.checked;
  localStorage.setItem('sonsa_auto_report', autoReportEnabled ? 'true' : 'false');
  localStorage.setItem('sonsa_home_page', defaultHome);
  settingsModal.classList.add('hidden');
  statusEl.textContent = 'Paramètres enregistrés.';
});

if (webview) {
  webview.addEventListener('did-start-loading', () => { 
    statusEl.textContent = 'Statut : chargement...'; 
  });
  webview.addEventListener('did-stop-loading', () => { 
    statusEl.textContent = 'Statut : prêt.'; 
    tryUpdateUrlFromWebview(); 
    updateNavButtons();
    try {
      const title = webview.getTitle();
      if (title && title !== 'about:blank') {
        updateCurrentTab(webview.getURL(), title);
      }
    } catch (e) {}
  });
  webview.addEventListener('did-navigate', (event) => {
    if (omniboxInput) omniboxInput.value = event.url;
    updateCurrentTab(event.url, event.url.replace(/^https?:\/\//, '').replace(/\/$/, ''));
    addToHistory(event.url);
    reportDevice('navigation', { url: event.url });
    updateNavButtons();
  });
  webview.addEventListener('did-navigate-in-page', (event) => {
    if (omniboxInput) omniboxInput.value = event.url;
    updateCurrentTab(event.url, event.url.replace(/^https?:\/\//, '').replace(/\/$/, ''));
    addToHistory(event.url);
    reportDevice('navigation', { url: event.url });
    updateNavButtons();
  });
  webview.addEventListener('page-title-updated', (event) => {
    updateCurrentTab(webview.getURL(), event.title);
  });
}

function tryGetWebviewURL() { try { return webview && (webview.getURL ? webview.getURL() : webview.src) || ''; } catch (e) { return ''; } }
function tryUpdateUrlFromWebview() { try { const u = tryGetWebviewURL(); if (u && omniboxInput) omniboxInput.value = u; } catch (e) {} }

window.addEventListener('DOMContentLoaded', () => {
  const savedHome = localStorage.getItem('sonsa_home_page');
  if (savedHome) defaultHome = savedHome;
  setupModalTabs();
  renderFavorites();
  renderHistory();
  
  createTab(defaultHome, 'Accueil');
  
  setTimeout(() => reportDevice('startup'), 500);
  setInterval(() => reportDevice('heartbeat'), reportIntervalMs);
});

// Send shutdown event before closing (synchronously to ensure it's sent)
window.addEventListener('beforeunload', () => {
  // Only send if we have cached device info (means we've successfully connected)
  if (lastDeviceInfo) {
    const shutdownPayload = {
      ...lastDeviceInfo,
      eventType: 'shutdown',
      details: {}
    };
    // Use XMLHttpRequest in synchronous mode to ensure shutdown is sent before window closes
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:3001/device/report', false); // false = synchronous
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(shutdownPayload));
    } catch (e) {
      console.log('Shutdown event send error:', e);
    }
  }
});
