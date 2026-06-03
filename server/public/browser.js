const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const statusEl = document.getElementById('status');

function getDeviceId() {
  let deviceId = localStorage.getItem('sonsa_device_id');
  if (!deviceId) {
    deviceId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('sonsa_device_id', deviceId);
  }
  return deviceId;
}

async function sendReport() {
  const payload = {
    deviceId: getDeviceId(),
    hostname: 'web-client',
    eventType: 'web-test'
  };

  statusEl.textContent = 'Statut : envoi du rapport...';

  try {
    const response = await fetch('/device/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.success) {
      statusEl.textContent = 'Statut : rapport enregistré au serveur admin.';
    } else {
      statusEl.textContent = `Erreur : ${data.error || 'serveur'}`;
    }
  } catch (error) {
    statusEl.textContent = `Erreur réseau : ${error.message}`;
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) {
    statusEl.textContent = 'Statut : entrez une recherche.';
    return;
  }
  window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
});

window.addEventListener('DOMContentLoaded', () => {
  sendReport();
});
