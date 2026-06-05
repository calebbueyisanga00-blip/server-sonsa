// Core Admin Server configuration (connects to local port 3001)
const adminUrl = 'http://localhost:3001';

const statusEl = document.getElementById('status');
const deviceInfoEl = document.getElementById('device-info');
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

// Premium new elements
const voiceSearchBtn = document.getElementById('voice-search-btn');
const heroSettingsBtn = document.getElementById('hero-settings-btn');
const aiModeBtn = document.getElementById('ai-mode-btn');
const aiSidebar = document.getElementById('ai-sidebar');
const closeAiSidebar = document.getElementById('close-ai-sidebar');
const aiChatForm = document.getElementById('ai-chat-form');
const aiChatInput = document.getElementById('ai-chat-input');
const aiChatMessages = document.getElementById('ai-chat-messages');
const themeToggle = document.getElementById('theme-toggle');
const toggleNewsBtn = document.getElementById('toggle-news-btn');
const leftSidebar = document.getElementById('left-sidebar');
const mainContent = document.querySelector('.main-content');
const newsOpenStub = document.getElementById('news-open-stub');
const assistantOpenStub = document.getElementById('assistant-open-stub');
const searchEnginesContainer = document.getElementById('search-engines');
const emailSetupOverlay = document.getElementById('email-setup-overlay');
const NEWS_SIDEBAR_KEY = 'sonsa_news_collapsed';
const emailSetupForm = document.getElementById('email-setup-form');
const emailCreateBtn = document.getElementById('email-create-btn');
const emailSkipBtn = document.getElementById('email-skip-btn');
const voiceOverlay = document.getElementById('voice-overlay');
const cancelVoiceBtn = document.getElementById('cancel-voice-btn');
const themeSelect = document.getElementById('theme-select');
const languageSelect = document.getElementById('language-select');
const checkUpdateBtn = document.getElementById('check-update-btn');
const updateProgressContainer = document.getElementById('update-progress-container');
const updateProgressBar = document.getElementById('update-progress-bar');
const updateStatusTxt = document.getElementById('update-status-txt');

// State variables
let activeSearchEngineUrl = 'https://www.google.com/search?q=';
let activeSearchEngineName = 'google';
let reportIntervalMs = 5 * 60 * 1000;
let defaultHome = 'https://www.google.com';
let tabs = [];
let currentTabId = null;
let favorites = JSON.parse(localStorage.getItem('sonsa_favorites') || '[]');
let history = JSON.parse(localStorage.getItem('sonsa_history') || '[]');
let autoReportEnabled = localStorage.getItem('sonsa_auto_report') !== 'false';
let activeLanguage = localStorage.getItem('sonsa_language') || 'FR';
let activeTheme = localStorage.getItem('sonsa_theme') || 'dark';
let aiModeActive = false;
const themeOptions = ['dark', 'light', 'ocean', 'emerald', 'sunset'];
let voiceRecognitionInstance = null;
let reportInFlight = false;
let lastDeviceInfo = null;

// Malicious domains blacklist
const blacklist = [
  'malicious-site.com',
  'phishing-sonsa.net',
  'virus-download.org',
  'hack-login.com',
  'dangerous-leak.ru',
  'spyware-test.cn'
];
let proceedAllowedUrls = new Set();
let warningOverlay = null;

// News articles database
const newsDatabase = [
  { id: 1, title: "RDC : Lancement du nouveau réseau internet à haut débit à Kinshasa", source: "Actualite.cd", time: "Il y a 10 min", tag: "Tech", kw: ["réseau", "kinshasa", "internet", "haut débit", "rdc", "congo"] },
  { id: 2, title: "L'intelligence artificielle révolutionne la cybersécurité en Afrique Centrale", source: "Tech Congo", time: "Il y a 1 h", tag: "IA", kw: ["intelligence", "ia", "sécurité", "cybersécurité", "intelligence artificielle", "ai"] },
  { id: 3, title: "SONSA Browser sort sa version 0.1.0 avec cryptage de bout en bout", source: "SONSA News", time: "Il y a 2 h", tag: "Sécurité", kw: ["sonsa", "navigateur", "browser", "version", "cryptage", "sécurité"] },
  { id: 4, title: "Élections des gouverneurs en RDC : les résultats préliminaires", source: "Radio Okapi", time: "Il y a 3 h", tag: "Politique", kw: ["politique", "élection", "gouverneur", "rdc", "congo", "kinshasa"] },
  { id: 5, title: "Football : Les Léopards de la RDC en préparation pour la CAN 2027", source: "Foot RDC", time: "Il y a 5 h", tag: "Sports", kw: ["léopards", "rdc", "can", "football", "sport"] },
  { id: 6, title: "Développement Web : Pourquoi Node.js reste le meilleur choix en 2026", source: "DevPortal", time: "Il y a 6 h", tag: "Tech", kw: ["node", "javascript", "développement", "web", "programmation", "coding"] },
  { id: 7, title: "RDC : Hausse du cours du cuivre et du cobalt sur le marché mondial", source: "Eco RDC", time: "Il y a 8 h", tag: "Économie", kw: ["économie", "cuivre", "cobalt", "marché", "rdc"] },
  { id: 8, title: "Comment sécuriser sa box Wi-Fi à la maison en 5 étapes", source: "CyberGuard", time: "Il y a 12 h", tag: "Tuto", kw: ["wi-fi", "wifi", "sécurité", "sécuriser", "tuto"] },
  { id: 9, title: "La start-up congolaise SONSA lève des fonds pour son navigateur web", source: "Invest Congo", time: "Il y a 1 jour", tag: "Finance", kw: ["sonsa", "navigateur", "start-up", "fonds", "finance"] },
  { id: 10, title: "Top 5 des destinations touristiques à visiter au Kivu et Katanga", source: "Congo Voyage", time: "Il y a 1 jour", tag: "Tourisme", kw: ["tourisme", "voyage", "kivu", "katanga", "visiter"] }
];

// Translations translation map
const translations = {
  FR: {
    searchPlaceholder: "Rechercher ou saisir une URL...",
    statusInit: "Statut : initialisation...",
    statusReady: "Statut : prêt.",
    statusNavigating: "Statut : navigation en cours...",
    statusConnected: "Statut : connecté au serveur admin.",
    homepage: "Page d'accueil",
    autoreport: "Activer le reporting automatique",
    save: "Enregistrer",
    cancel: "Annuler",
    emailTitle: "Bienvenue sur SONSA",
    emailDesc: "Pour configurer votre navigateur pour la première fois, connectez votre adresse e-mail ou passez cette étape pour commencer à rechercher immédiatement.",
    emailBtn: "Connecter mon compte",
    emailCreateBtn: "Créer un compte",
    emailSkipBtn: "Passer",
    langSelect: "Langue du navigateur",
    themeSelect: "Thème visuel",
    newsTitle: "📰 Actualités pour vous",
    voiceStatus: "Écoute en cours... Parlez maintenant",
    aiTitle: "Chatbot IA SONSA",
    aiWelcome: "Bonjour ! Je suis l'assistant IA de SONSA. Comment puis-je vous aider aujourd'hui ?",
    aiInputPlaceholder: "Posez une question...",
    updateTitle: "Mise à jour du système",
    checkUpdateBtn: "Vérifier les mises à jour"
  },
  EN: {
    searchPlaceholder: "Search or type a URL...",
    statusInit: "Status: initializing...",
    statusReady: "Status: ready.",
    statusNavigating: "Status: navigating...",
    statusConnected: "Status: connected to admin server.",
    homepage: "Home Page",
    autoreport: "Enable automatic reporting",
    save: "Save",
    cancel: "Cancel",
    emailTitle: "Welcome to SONSA",
    emailDesc: "To configure your browser for the first time, please connect your email address. This address will be registered for usage tracking.",
    emailBtn: "Connect my account",
    langSelect: "Browser Language",
    themeSelect: "Visual Theme",
    newsTitle: "📰 News for you",
    voiceStatus: "Listening... Speak now",
    aiTitle: "SONSA AI Chatbot",
    aiWelcome: "Hello! I am the SONSA AI assistant. How can I help you today?",
    aiInputPlaceholder: "Ask a question...",
    updateTitle: "System Update",
    checkUpdateBtn: "Check for updates"
  },
  LN: {
    searchPlaceholder: "Luka to koma adresi...",
    statusInit: "Esaleli: ebandi...",
    statusReady: "Esaleli: elengebeli.",
    statusNavigating: "Esaleli: ekotambola...",
    statusConnected: "Esaleli: ekangami na admin.",
    homepage: "Lokasa ya ebandeli",
    autoreport: "Pela botindeli ya sango",
    save: "Bomba",
    cancel: "Tika",
    emailTitle: "Boyei bolamu na SONSA",
    emailDesc: "Mpo na kobongisa motambolisi na yo mbala ya yambo, tondisa adresi meli na yo. Adresi oyo ekobombama mpo na kolandela misala na yo.",
    emailBtn: "Kanga konti na ngai",
    langSelect: "Lokota ya motambolisi",
    themeSelect: "Monzela ya motambolisi",
    newsTitle: "📰 Sango mpo na yo",
    voiceStatus: "Koyoka ezali kosalema... Loba sikoyo",
    aiTitle: "SONSA Solola na IA",
    aiWelcome: "Mbote! Ngai nazali mosungi ya IA ya SONSA. Ndenge nini nakoki kosunga yo lelo?",
    aiInputPlaceholder: "Tuna motuna...",
    updateTitle: "Kobongisa esaleli",
    checkUpdateBtn: "Luka kobongisami ya sika"
  },
  KG: {
    searchPlaceholder: "Sosa to sonika adresi...",
    statusInit: "Kisalu: yantika...",
    statusReady: "Kisalu: ya kuyilama.",
    statusNavigating: "Kisalu: ke kwenda...",
    statusConnected: "Kisalu: ke kangama na admin.",
    homepage: "Lutiti ya luyantiku",
    autoreport: "Tula botindeli basango",
    save: "Lunda",
    cancel: "Tika",
    emailTitle: "Mbote pe yayisa na SONSA",
    emailDesc: "Mpo na yidika masini na nge mbala ya ntete, tula adresi meli na nge. Adresi yai ta lundama mpo na kulanda kisalu na nge.",
    emailBtn: "Kangisa konti na munu",
    langSelect: "Ndinga ya masini",
    themeSelect: "Luse ya masini",
    newsTitle: "📰 Bansangu mpo na nge",
    voiceStatus: "Kuwa kele kusalama... Luba ntangu yai",
    aiTitle: "SONSA Solola na IA",
    aiWelcome: "Mbote! Munu kele mosungi ya IA ya SONSA. Inki mutindu munu lenda sadisa nge bubu yai?",
    aiInputPlaceholder: "Yula kiuvu...",
    updateTitle: "Kuyidika ya sika",
    checkUpdateBtn: "Sosa kuyidika ya sika"
  },
  SW: {
    searchPlaceholder: "Tafuta au andika URL...",
    statusInit: "Hali: inaanza...",
    statusReady: "Hali: tayari.",
    statusNavigating: "Hali: inafungua...",
    statusConnected: "Hali: imeunganishwa na seva.",
    homepage: "Ukurasa wa Nyumbani",
    autoreport: "Washa ripoti ya kiotomatiki",
    save: "Hifadhi",
    cancel: "Ghairi",
    emailTitle: "Karibu kwenye SONSA",
    emailDesc: "Ili kusanidi kivinjari chako kwa mara ya kwanza, tafadhali unganisha anwani yako ya barua pepe. Anwani hii itasajiliwa kwa ufuatiliaji wa matumizi.",
    emailBtn: "Unganisha akaunti yangu",
    langSelect: "Lugha ya Kivinjari",
    themeSelect: "Mandhari ya Kivinjari",
    newsTitle: "📰 Habari kwako",
    voiceStatus: "Kusikiliza... Ongea sasa",
    aiTitle: "Kivinjari cha IA SONSA",
    aiWelcome: "Habari! Mimi ni msaidizi wa IA wa SONSA. Ninawezaje kukusaidia leo?",
    aiInputPlaceholder: "Uliza swali...",
    updateTitle: "Sasisho la Mfumo",
    checkUpdateBtn: "Angalia sasisho"
  },
  LU: {
    searchPlaceholder: "Keba to funda URL...",
    statusInit: "Malu: mbangilu...",
    statusReady: "Malu: budilayi.",
    statusNavigating: "Malu: kwenda...",
    statusConnected: "Malu: dikwatangana ne admin.",
    homepage: "Dibeji dia ntuadijilu",
    autoreport: "Enza botindeli bimanyinu",
    save: "Lama",
    cancel: "Lekela",
    emailTitle: "Udi muakidila ku SONSA",
    emailDesc: "Bua kulongolola tshikebulu tshiaba bua musangu wa kumpala, uluije adresi webe wa email. Adresi eu nealamibue bua dilonda dia mudimu webe.",
    emailBtn: "Kuata konti wanyi",
    langSelect: "Muakulu wa tshikebulu",
    themeSelect: "Tshimuenekelu",
    newsTitle: "📰 Ngumu bua webe",
    voiceStatus: "Diteleja didi dienda dienzeka... Akula mpindieu",
    aiTitle: "SONSA Solola ne IA",
    aiWelcome: "Moyo! Ndi muambuluishi wa IA wa SONSA. Mmunyi mundi mua kukuambuluisha lelu?",
    aiInputPlaceholder: "Ela lukonko...",
    updateTitle: "Dilongolola dia sika",
    checkUpdateBtn: "Keba dilongolola dia sika"
  },
  PT: {
    searchPlaceholder: "Pesquisar ou digitar URL...",
    statusInit: "Status: inicializando...",
    statusReady: "Status: pronto.",
    statusNavigating: "Status: navegando...",
    statusConnected: "Status: conectado ao servidor admin.",
    homepage: "Página inicial",
    autoreport: "Ativar relatório automático",
    save: "Salvar",
    cancel: "Cancelar",
    emailTitle: "Bem-vindo ao SONSA",
    emailDesc: "Para configurar seu navegador pela primeira vez, conecte seu endereço de e-mail. Este endereço será registrado para rastreamento de uso.",
    emailBtn: "Conectar minha conta",
    langSelect: "Idioma do Navegador",
    themeSelect: "Tema Visual",
    newsTitle: "📰 Notícias para você",
    voiceStatus: "Ouvindo... Fale agora",
    aiTitle: "Chatbot IA SONSA",
    aiWelcome: "Olá! Eu sou o assistente de IA da SONSA. Como posso ajudar você hoje?",
    aiInputPlaceholder: "Faça uma pergunta...",
    updateTitle: "Atualização do Sistema",
    checkUpdateBtn: "Verificar atualizações"
  },
  ES: {
    searchPlaceholder: "Buscar o escribir URL...",
    statusInit: "Estado: inicializando...",
    statusReady: "Estado: listo.",
    statusNavigating: "Estado: navegando...",
    statusConnected: "Estado: conectado al servidor admin.",
    homepage: "Página de inicio",
    autoreport: "Activar informe automático",
    save: "Guardar",
    cancel: "Cancelar",
    emailTitle: "Bienvenido a SONSA",
    emailDesc: "Para configurar su navegador por primera vez, conecte su dirección de correo electrónico. Esta dirección se registrará para el seguimiento de uso.",
    emailBtn: "Conectar mi cuenta",
    langSelect: "Idioma del Navegador",
    themeSelect: "Tema Visual",
    newsTitle: "📰 Noticias para ti",
    voiceStatus: "Escuchando... Hable ahora",
    aiTitle: "Chatbot IA SONSA",
    aiWelcome: "¡Hola! Soy el asistente de IA de SONSA. ¿Cómo te puedo ayudar hoy?",
    aiInputPlaceholder: "Haz una pregunta...",
    updateTitle: "Actualización del Sistema",
    checkUpdateBtn: "Buscar actualizaciones"
  },
  ZH: {
    searchPlaceholder: "搜索或输入网址...",
    statusInit: "状态：正在初始化...",
    statusReady: "状态：就绪。",
    statusNavigating: "状态：正在导航...",
    statusConnected: "状态：已连接到管理服务器。",
    homepage: "主页",
    autoreport: "启用自动报告",
    save: "保存",
    cancel: "取消",
    emailTitle: "欢迎使用 SONSA",
    emailDesc: "首次配置您的浏览器，请关联您的电子邮件地址。此地址将被记录用于使用情况跟踪。",
    emailBtn: "关联我的账户",
    langSelect: "浏览器语言",
    themeSelect: "视觉主题",
    newsTitle: "📰 为您推荐的新闻",
    voiceStatus: "正在倾听... 请说话",
    aiTitle: "SONSA AI 聊天机器人",
    aiWelcome: "你好！我是 SONSA AI 助手。今天我能为您做些什么？",
    aiInputPlaceholder: "提问...",
    updateTitle: "系统更新",
    checkUpdateBtn: "检查更新"
  },
  HI: {
    searchPlaceholder: "खोजें या URL टाइप करें...",
    statusInit: "स्थिति: प्रारंभ हो रहा है...",
    statusReady: "स्थिति: तैयार।",
    statusNavigating: "स्थिति: ब्राउज़िंग...",
    statusConnected: "स्थिति: व्यवस्थापक सर्वर से जुड़ा है।",
    homepage: "होम पेज",
    autoreport: "स्वचालित रिपोर्टिंग सक्षम करें",
    save: "सहेजें",
    cancel: "रद्द करें",
    emailTitle: "SONSA में आपका स्वागत है",
    emailDesc: "पहली बार अपने ब्राउज़र को कॉन्फ़िगर करने के लिए, कृपया अपना ईमेल पता जोड़ें। यह पता उपयोग की ट्रैकिंग के लिए दर्ज किया जाएगा।",
    emailBtn: "मेरा खाता जोड़ें",
    langSelect: "ब्राउज़र की भाषा",
    themeSelect: "दृश्य थीम",
    newsTitle: "📰 आपके लिए समाचार",
    voiceStatus: "सुन रहा है... अब बोलें",
    aiTitle: "SONSA AI चैटबॉट",
    aiWelcome: "नमस्ते! मैं SONSA AI सहायक हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?",
    aiInputPlaceholder: "प्रश्न पूछें...",
    updateTitle: "सिस्टम अपडेट",
    checkUpdateBtn: "अपडेट की जाँच करें"
  }
};

// Translate UI labels dynamically
function translateUI(lang) {
  const t = translations[lang] || translations.FR;
  
  if (omniboxInput) omniboxInput.placeholder = t.searchPlaceholder;
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;
  
  const homeLbl = document.getElementById('setting-lbl-homepage');
  if (homeLbl) homeLbl.textContent = t.homepage;
  
  const langLbl = document.getElementById('setting-lbl-lang');
  if (langLbl) langLbl.textContent = t.langSelect;
  
  const themeLbl = document.getElementById('setting-lbl-theme');
  if (themeLbl) themeLbl.textContent = t.themeSelect;
  
  const updateLbl = document.getElementById('setting-lbl-update');
  if (updateLbl) updateLbl.textContent = t.updateTitle;
  
  const reportLbl = document.getElementById('setting-lbl-autoreport');
  if (reportLbl) reportLbl.textContent = t.autoreport;
  
  const saveBtn = document.getElementById('save-settings');
  if (saveBtn) saveBtn.textContent = t.save;
  
  const emailTitle = document.getElementById('email-setup-title');
  if (emailTitle) emailTitle.textContent = t.emailTitle;
  
  const emailDesc = document.getElementById('email-setup-desc');
  if (emailDesc) emailDesc.textContent = t.emailDesc;
  
  const emailBtn = document.getElementById('email-setup-btn');
  if (emailBtn) emailBtn.textContent = t.emailBtn;
  
  const emailCreateButton = document.getElementById('email-create-btn');
  if (emailCreateButton) emailCreateButton.textContent = t.emailCreateBtn || 'Create account';
  
  const emailSkipButton = document.getElementById('email-skip-btn');
  if (emailSkipButton) emailSkipButton.textContent = t.emailSkipBtn || 'Skip';
  
  const newsTitleEl = document.getElementById('news-title');
  if (newsTitleEl) newsTitleEl.textContent = t.newsTitle;
  
  const voiceStatus = document.getElementById('voice-status');
  if (voiceStatus) voiceStatus.textContent = t.voiceStatus;
  
  const aiTitle = document.getElementById('ai-chatbot-title');
  if (aiTitle) aiTitle.textContent = t.aiTitle;
  
  const aiWelcome = document.getElementById('ai-welcome-msg');
  if (aiWelcome) aiWelcome.textContent = t.aiWelcome;
  
  const aiInput = document.getElementById('ai-chat-input');
  if (aiInput) aiInput.placeholder = t.aiInputPlaceholder;
  
  const checkUpdateBtn = document.getElementById('check-update-btn');
  if (checkUpdateBtn) checkUpdateBtn.textContent = t.checkUpdateBtn;
}

function getKnownEmails() {
  try {
    return JSON.parse(localStorage.getItem('sonsa_known_emails') || '[]');
  } catch (e) {
    return [];
  }
}

function saveKnownEmail(email) {
  const normalized = email.toLowerCase();
  const accounts = getKnownEmails();
  if (!accounts.includes(normalized)) {
    accounts.push(normalized);
    localStorage.setItem('sonsa_known_emails', JSON.stringify(accounts));
  }
}

function hasKnownEmail(email) {
  return getKnownEmails().includes(email.toLowerCase());
}

function continueBrowsing() {
  createTab(defaultHome, 'Accueil');
  renderNewsFeed();
  setTimeout(() => reportDevice('startup'), 1000);
  setInterval(() => reportDevice('heartbeat'), reportIntervalMs);
}

function completeEmailSetup(email) {
  localStorage.setItem('sonsa_user_email', email);
  localStorage.removeItem('sonsa_email_setup_skipped');
  emailSetupOverlay.classList.add('hidden');
  continueBrowsing();
}

function skipEmailSetup() {
  localStorage.setItem('sonsa_email_setup_skipped', 'true');
  emailSetupOverlay.classList.add('hidden');
  continueBrowsing();
}

// ─── Theme and styling customizer ───
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('sonsa_theme', theme);
}

// ─── Malicious Interstitial Alert ───
function isMalicious(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return blacklist.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch (e) {
    return false;
  }
}

function showSecurityWarning(url) {
  if (warningOverlay) warningOverlay.remove();
  
  warningOverlay = document.createElement('div');
  warningOverlay.className = 'email-setup-overlay';
  warningOverlay.style.background = 'rgba(17, 2, 2, 0.95)';
  warningOverlay.style.zIndex = '999999';
  
  const hostname = new URL(url).hostname;
  
  warningOverlay.innerHTML = `
    <div class="email-setup-card" style="background: rgba(31, 8, 8, 0.85); border-color: rgba(239, 68, 68, 0.3);">
      <div class="email-setup-logo" style="background: #ef4444; color: white;">⚠️</div>
      <h2 style="color: #ef4444;">Site malveillant détecté !</h2>
      <p style="color: #fca5a5;">Le navigateur/système SONSA a bloqué la connexion vers <strong>${hostname}</strong> car le domaine est classifié comme dangereux.</p>
      <p style="color: #94a3b8; font-size: 0.85rem; line-height: 1.55;">Il peut s'agir de phishing, d'un site de distribution de virus ou d'une arnaque. Voulez-vous continuer à vos risques et périls ?</p>
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button id="warning-safe-btn" class="btn-primary" style="background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.25); flex: 1;">Retourner en sécurité</button>
        <button id="warning-proceed-btn" class="btn-primary" style="background: #ef4444; color: white; flex: 1;">Ignorer et continuer</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(warningOverlay);
  
  document.getElementById('warning-safe-btn').addEventListener('click', () => {
    warningOverlay.remove();
    warningOverlay = null;
    openUrl(defaultHome);
  });
  
  document.getElementById('warning-proceed-btn').addEventListener('click', () => {
    warningOverlay.remove();
    warningOverlay = null;
    proceedAllowedUrls.add(url);
    openUrl(url, false); // Skip safety warning check
  });
}

// ─── News feed updates ───
function renderNewsFeed() {
  const container = document.getElementById('news-container');
  if (!container) return;

  // Gather keywords from query logs to adapt content
  const keywords = [];
  try {
    history.forEach(h => {
      if (h.url) {
        try {
          const u = new URL(h.url);
          const q = u.searchParams.get('q') || u.searchParams.get('p') || '';
          if (q) {
            q.toLowerCase().split(/\s+/).forEach(word => {
              if (word.length > 2) keywords.push(word);
            });
          }
        } catch(e){}
      }
    });
  } catch(e){}

  const scoredArticles = newsDatabase.map(art => {
    let score = Math.random() * 0.5; // default random score
    art.kw.forEach(keyword => {
      if (keywords.includes(keyword.toLowerCase())) {
        score += 2.0; // matching score bias
      }
    });
    return { art, score };
  });

  scoredArticles.sort((a, b) => b.score - a.score);
  const selected = scoredArticles.slice(0, 3).map(s => s.art);

  container.innerHTML = '';
  selected.forEach(art => {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `
      <div>
        <div class="news-card-meta">
          <span class="news-card-tag">${art.tag}</span>
          <span>${art.time}</span>
        </div>
        <div class="news-card-title">${art.title}</div>
      </div>
      <div class="news-card-source">${art.source}</div>
    `;
    card.addEventListener('click', () => {
      const q = encodeURIComponent(art.title);
      const url = `https://www.google.com/search?q=${q}`;
      openUrl(url);
    });
    container.appendChild(card);
  });
}

// ─── Speech Recognition Web API ───
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Speech recognition is not supported in this environment.");
    return;
  }
  
  voiceRecognitionInstance = new SpeechRecognition();
  voiceRecognitionInstance.continuous = false;
  
  // Adapt speech lang to selected locale
  const langCodes = { FR: 'fr-FR', EN: 'en-US', PT: 'pt-PT', ES: 'es-ES', ZH: 'zh-CN', HI: 'hi-IN' };
  voiceRecognitionInstance.lang = langCodes[activeLanguage] || 'fr-FR';
  
  voiceRecognitionInstance.onstart = () => {
    voiceOverlay.classList.remove('hidden');
  };
  
  voiceRecognitionInstance.onerror = (e) => {
    console.error('Speech recognition error:', e.error);
    voiceOverlay.classList.add('hidden');
  };
  
  voiceRecognitionInstance.onend = () => {
    voiceOverlay.classList.add('hidden');
  };
  
  voiceRecognitionInstance.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (transcript) {
      if (searchInput) {
        searchInput.value = transcript;
        openSearch(transcript);
      }
    }
  };
}

// ─── AI Chatbot generative simulation ───
function appendChatMessage(sender, text, htmlContent = null) {
  const bubble = document.createElement('div');
  bubble.className = `ai-message ${sender}`;
  if (htmlContent) {
    bubble.innerHTML = htmlContent;
  } else {
    bubble.textContent = text;
  }
  aiChatMessages.appendChild(bubble);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

function getUserDisplayName() {
  const email = localStorage.getItem('sonsa_user_email') || '';
  if (!email) return 'ami';
  const namePart = email.split('@')[0];
  return namePart
    .replace(/[._\-]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function setAiModeActive(active) {
  aiModeActive = active;
  if (aiSidebar) {
    aiSidebar.classList.toggle('hidden', !active);
  }
  if (assistantOpenStub) {
    assistantOpenStub.classList.toggle('hidden', active);
  }
  if (aiModeBtn) {
    aiModeBtn.style.background = active ? '#22c55e' : 'rgba(59, 130, 246, 0.1)';
    aiModeBtn.style.color = active ? '#0f172a' : '#60a5fa';
    aiModeBtn.style.borderColor = active ? 'rgba(34,197,94,0.4)' : 'rgba(59, 130, 246, 0.2)';
    aiModeBtn.textContent = 'Assistant';
    aiModeBtn.title = active ? 'Assistant activé' : 'Activer l’assistant';
  }
  if (active) {
    updateAiWelcomeMessage();
  }
}

function updateAiWelcomeMessage() {
  const userName = getUserDisplayName();
  const aiWelcome = document.getElementById('ai-welcome-msg');
  if (aiWelcome) {
    aiWelcome.innerHTML = `Salut <strong>${userName}</strong> ! Je suis l'assistant SONSA. Dis-moi ce que tu veux faire aujourd'hui.`;
  }
}

function handleChatSubmit(e) {
  if (e) e.preventDefault();
  const text = aiChatInput.value.trim();
  if (!text) return;

  appendChatMessage('user', text);
  aiChatInput.value = '';
  setAiModeActive(true);
  appendChatMessage('assistant', '', '<em>Réflexion en cours...</em>');

  setTimeout(() => {
    const assistantText = generateLocalAIResponse(text);
    const lastAssistant = aiChatMessages.querySelector('.ai-message.assistant:last-child');
    if (lastAssistant) {
      lastAssistant.innerHTML = assistantText;
    }
  }, 800);
}

function generateLocalAIResponse(message) {
  const original = message.trim();
  const query = original.toLowerCase();
  const base = `Assistant SONSA ⬢<br/>Voici ce que je peux faire pour vous :`;
  const safeMessage = original.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const actionButtons = (label, value) => `
    <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;">
      <button class="ai-chip" onclick="document.getElementById('search-input').value='${value}'; openSearch('${value}');">${label}</button>
    </div>`;

  if (/\b(bonjour|salut|mbote|mambo|ça va|comment ça va|hey|hello)\b/i.test(query)) {
    return `${base}
      <ul style="margin:10px 0 0 18px; list-style:disc; color:#cbd5e1;">
        <li>Je suis votre assistant de navigation intelligent.</li>
        <li>Je peux chercher, résumer et proposer des actions rapides.</li>
        <li>Demandez-moi n’importe quoi ou dites « trouve ... ».</li>
      </ul>
      ${actionButtons('🔎 Rechercher maintenant', 'Actualités RDC')}`;
  }

  if (/\b(qu|qui|quoi|où|comment|pourquoi|quelle|quand|quel)\b/i.test(query)) {
    return `${base}
      <div style="margin-top:10px; padding:14px; border-radius:18px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);">
        <strong>Résumé rapide :</strong>
        <p style="margin:8px 0 0; color:#e2e8f0;">${safeMessage}</p>
      </div>
      <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px; color:#cbd5e1;">
        <span>✅ Je vais chercher les meilleurs résultats pour votre question.</span>
        <span>✅ Je peux ouvrir un lien, trouver des sources et vous guider.</span>
      </div>
      ${actionButtons('🔍 Recherche web', safeMessage)}
      <button class="ai-chip" onclick="appendChatMessage('assistant', '', 'Donnez-moi plus de détails sur ce que vous voulez exactement.');">📝 Affiner</button>`;
  }

  if (/\b(image|photo|illustration|photos|dessin)\b/i.test(query)) {
    return `${base}
      <div style="margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div style="padding:12px; border-radius:16px; background:rgba(255,255,255,0.05);">🔎 Je cherche des images adaptées.</div>
        <div style="padding:12px; border-radius:16px; background:rgba(255,255,255,0.05);">💡 Je peux aussi proposer des recherches similaires.</div>
      </div>
      ${actionButtons('🖼️ Chercher des images', safeMessage)}
      <div style="margin-top:10px; color:#cbd5e1; font-size:0.88rem;">Vous pouvez préciser : « images de paysage », « photo de sécurité informatique », etc.</div>`;
  }

  if (/\b(lien|site|adresse|web|page)\b/i.test(query)) {
    return `${base}
      <div style="margin-top:10px; display:grid; gap:8px;">
        <a href="https://www.wikipedia.org" target="_blank" style="color:#60a5fa; text-decoration:none;">• Wikipedia — encyclopédie</a>
        <a href="https://www.actualite.cd" target="_blank" style="color:#60a5fa; text-decoration:none;">• Actualite.cd — actualités RDC</a>
        <a href="https://github.com" target="_blank" style="color:#60a5fa; text-decoration:none;">• GitHub — projets de développeurs</a>
      </div>
      <div style="margin-top:12px; color:#cbd5e1;">Je peux ouvrir un site direct ou chercher un site précis pour vous.</div>
      ${actionButtons('🌐 Rechercher un site', safeMessage || 'site utile')}`;
  }

  if (/\b(document|pdf|télécharger|livre|guide|manuel|rapport)\b/i.test(query)) {
    return `${base}
      <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
        <button class="ai-chip" onclick="window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')">📄 Guide de sécurité internet</button>
        <button class="ai-chip" onclick="window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')">📄 Guide d'utilisation de SONSA</button>
      </div>
      <div style="margin-top:10px; color:#cbd5e1;">Demandez-moi un type de document si vous voulez quelque chose de plus précis.</div>`;
  }

  return `${base}
    <div style="margin-top:10px; padding:14px; border-radius:18px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);">
      <strong>Interprétation :</strong>
      <p style="margin:8px 0 0; color:#e2e8f0;">Je vais chercher des résultats pertinents pour : <strong>${safeMessage}</strong>.</p>
    </div>
    <div style="margin-top:12px; display:flex; flex-wrap:wrap; gap:8px;">
      <button class="ai-chip" onclick="document.getElementById('search-input').value='${safeMessage}'; openSearch('${safeMessage}');">🔍 Rechercher</button>
      <button class="ai-chip" onclick="appendChatMessage('assistant', '', 'Que voulez-vous savoir de plus sur ce sujet ?');">❓ Affiner la question</button>
    </div>
    <div style="margin-top:10px; color:#cbd5e1; font-size:0.88rem;">Vous pouvez aussi demander : « résume », « compare », « explique simplement ».`;
}

// ─── Simulated System Update ───
function simulateUpdateCheck() {
  checkUpdateBtn.disabled = true;
  updateProgressContainer.classList.remove('hidden');
  updateProgressBar.style.width = '0%';
  updateStatusTxt.textContent = "Téléchargement : 0%";
  
  let percentage = 0;
  const interval = setInterval(() => {
    percentage += Math.floor(Math.random() * 8) + 3;
    if (percentage >= 100) {
      percentage = 100;
      clearInterval(interval);
      updateStatusTxt.textContent = "Téléchargement terminé ! Redémarrez le navigateur pour appliquer la mise à jour (0.2.0).";
      
      // Replace check update button with restart button
      checkUpdateBtn.textContent = "🔄 Redémarrer";
      checkUpdateBtn.disabled = false;
      checkUpdateBtn.onclick = () => {
        window.location.reload();
      };
    } else {
      updateStatusTxt.textContent = `Téléchargement : ${percentage}%`;
    }
    updateProgressBar.style.width = `${percentage}%`;
  }, 120);
}

// ─── Standard URL Norms ───
function normalizeUrl(value) {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (/^[\w\-]+\.[\w\-]+/.test(value)) return `https://${value}`;
  return `${activeSearchEngineUrl}${encodeURIComponent(value)}`;
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
  renderNewsFeed(); // Update news based on searches
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
  
  // Inject email details
  const userEmail = localStorage.getItem('sonsa_user_email');
  if (userEmail) {
    details.email = userEmail;
  }

  try {
    const result = await window.deviceApi.reportDevice(adminUrl, eventType, details);
    if (result && result.success) {
      statusEl.textContent = 'Statut : connecté au serveur admin.';
      deviceInfoEl.textContent = `Machine : ${result.device.hostname} • IP : ${result.device.ipAddress} • MAC : ${result.device.macAddress || 'N/A'}`;
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
  
  // AI Mode intercept
  if (aiModeActive) {
    aiSidebar.classList.remove('hidden');
    appendChatMessage('user', cleaned);
    setTimeout(() => {
      const responseHtml = generateLocalAIResponse(cleaned);
      appendChatMessage('assistant', '', responseHtml);
    }, 600);
    return;
  }

  const url = `${activeSearchEngineUrl}${encodeURIComponent(cleaned)}`;
  openUrl(url);
}

function openUrl(value, updateTab = true) {
  const url = normalizeUrl((value || '').trim());
  if (!url) { statusEl.textContent = 'Entrez une URL ou une recherche.'; return; }
  
  // Anti-Malicious filtering block
  if (isMalicious(url) && !proceedAllowedUrls.has(url)) {
    showSecurityWarning(url);
    return;
  }

  statusEl.textContent = 'Statut : navigation en cours...';
  showBrowser();
  if (updateTab) updateCurrentTab(url, url.replace(/^https?:\/\//, '').replace(/\/$/, ''));
  if (webview) webview.src = url;
  addToHistory(url);
}

// ─── Event Bindings ───
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
  
  document.querySelectorAll('.search-btn').forEach(btn => {
    if (btn.id !== 'voice-search-btn' && btn.id !== 'hero-settings-btn') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const q = searchInput ? searchInput.value : '';
        openSearch(q);
      });
    }
  });
}

// Nav Buttons
backBtn.addEventListener('click', () => {
  try {
    if (webview && webview.canGoBack()) webview.goBack();
  } catch (e) {}
});
forwardBtn.addEventListener('click', () => {
  try {
    if (webview && webview.canGoForward()) webview.goForward();
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

// Dropdowns
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

// dropdown actions
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

// Settings Modal Open
function openSettingsModal(activeTabName) {
  if (homePageInput) homePageInput.value = defaultHome;
  if (autoReportToggle) autoReportToggle.checked = autoReportEnabled;
  if (themeSelect) themeSelect.value = activeTheme;
  if (languageSelect) languageSelect.value = activeLanguage;

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

// Zoom bindings
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

// Save settings flow
saveSettings.addEventListener('click', () => {
  defaultHome = normalizeUrl(homePageInput.value) || defaultHome;
  autoReportEnabled = !!autoReportToggle.checked;
  localStorage.setItem('sonsa_auto_report', autoReportEnabled ? 'true' : 'false');
  localStorage.setItem('sonsa_home_page', defaultHome);
  
  if (themeSelect) {
    applyTheme(themeSelect.value);
  }
  if (languageSelect) {
    activeLanguage = languageSelect.value;
    localStorage.setItem('sonsa_language', activeLanguage);
    translateUI(activeLanguage);
    initSpeechRecognition(); // re-init voice recognition for correct language code
  }

  settingsModal.classList.add('hidden');
  statusEl.textContent = 'Paramètres enregistrés.';
});

// ─── Webview Handlers ───
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
  
  // Check URLs when navigated internally inside webview
  webview.addEventListener('will-navigate', (event) => {
    const url = event.url;
    if (isMalicious(url) && !proceedAllowedUrls.has(url)) {
      webview.stop();
      showSecurityWarning(url);
    }
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
  webview.addEventListener('did-fail-load', (event) => {
    // Ignore aborted navigations caused by redirects or fast user actions.
    if (event.errorCode === -3 || event.errorCode === 0) {
      return;
    }
    console.warn('Webview failed to load:', event.errorDescription, event.validatedURL);
  });
}

function tryGetWebviewURL() { try { return webview && (webview.getURL ? webview.getURL() : webview.src) || ''; } catch (e) { return ''; } }
function tryUpdateUrlFromWebview() { try { const u = tryGetWebviewURL(); if (u && omniboxInput) omniboxInput.value = u; } catch (e) {} }

// ─── DOM Initializations ───
window.addEventListener('DOMContentLoaded', () => {
  const savedHome = localStorage.getItem('sonsa_home_page');
  if (savedHome) defaultHome = savedHome;
  
  // Theme and Locale initial application
  applyTheme(activeTheme);
  translateUI(activeLanguage);
  initSpeechRecognition();
  
  // First-time Email setup blocker logic
  const savedEmail = localStorage.getItem('sonsa_user_email');
  const setupSkipped = localStorage.getItem('sonsa_email_setup_skipped') === 'true';

  if (!savedEmail && !setupSkipped) {
    emailSetupOverlay.classList.remove('hidden');
  } else {
    continueBrowsing();
  }

  const savedNewsCollapsed = localStorage.getItem(NEWS_SIDEBAR_KEY) === 'true';
  if (savedNewsCollapsed) {
    setNewsSidebarCollapsed(true);
  } else if (toggleNewsBtn) {
    setNewsSidebarCollapsed(false);
  }
  if (assistantOpenStub) {
    assistantOpenStub.classList.remove('hidden');
  }
  updateAiWelcomeMessage();
  setupModalTabs();
  renderFavorites();
  renderHistory();
});

// Setup Form Submission
if (emailSetupForm) {
  emailSetupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email-setup-input').value.trim();
    const errorEl = document.getElementById('email-setup-error');
    errorEl.classList.add('hidden');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorEl.textContent = "Veuillez entrer une adresse e-mail valide.";
      errorEl.classList.remove('hidden');
      return;
    }

    if (!hasKnownEmail(email)) {
      errorEl.textContent = "Compte introuvable. Cliquez sur Créer un compte pour enregistrer cet e-mail, ou passez.";
      errorEl.classList.remove('hidden');
      return;
    }

    completeEmailSetup(email);
  });
}

if (emailCreateBtn) {
  emailCreateBtn.addEventListener('click', () => {
    const email = document.getElementById('email-setup-input').value.trim();
    const errorEl = document.getElementById('email-setup-error');
    errorEl.classList.add('hidden');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorEl.textContent = "Veuillez entrer une adresse e-mail valide pour créer un compte.";
      errorEl.classList.remove('hidden');
      return;
    }

    saveKnownEmail(email);
    completeEmailSetup(email);
  });
}

if (emailSkipBtn) {
  emailSkipBtn.addEventListener('click', () => {
    skipEmailSetup();
  });
}

// Search engines pill buttons selection logic
if (searchEnginesContainer) {
  searchEnginesContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.engine-pill');
    if (!pill) return;
    
    // Toggle active state
    document.querySelectorAll('.engine-pill').forEach(b => b.classList.remove('active'));
    pill.classList.add('active');
    
    // Set active engine
    activeSearchEngineUrl = pill.getAttribute('data-url');
    activeSearchEngineName = pill.getAttribute('data-engine');
  });
}

// Settings toggle on Hero settings icon click
if (heroSettingsBtn) {
  heroSettingsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openSettingsModal('settings');
  });
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const currentIndex = themeOptions.indexOf(activeTheme);
    const nextTheme = themeOptions[(currentIndex + 1) % themeOptions.length];
    activeTheme = nextTheme;
    applyTheme(nextTheme);
    if (themeSelect) themeSelect.value = nextTheme;
    localStorage.setItem('sonsa_theme', nextTheme);
    statusEl.textContent = `Thème changé : ${nextTheme}`;
  });
}

if (themeSelect) {
  themeSelect.addEventListener('change', (e) => {
    const selectedTheme = e.target.value;
    if (selectedTheme) {
      activeTheme = selectedTheme;
      applyTheme(selectedTheme);
      localStorage.setItem('sonsa_theme', selectedTheme);
    }
  });
}

function setNewsSidebarCollapsed(collapsed) {
  if (!leftSidebar || !toggleNewsBtn) return;
  leftSidebar.classList.toggle('collapsed', collapsed);
  if (mainContent) mainContent.classList.toggle('sidebar-collapsed', collapsed);
  if (newsOpenStub) {
    newsOpenStub.classList.toggle('hidden', !collapsed);
  }
  toggleNewsBtn.textContent = collapsed ? '›' : '≡';
  toggleNewsBtn.title = collapsed ? 'Étendre le menu actualités' : 'Réduire le menu actualités';
  localStorage.setItem(NEWS_SIDEBAR_KEY, collapsed ? 'true' : 'false');
}

if (toggleNewsBtn && leftSidebar) {
  toggleNewsBtn.addEventListener('click', () => {
    const collapsed = leftSidebar.classList.contains('collapsed');
    setNewsSidebarCollapsed(!collapsed);
  });
}

if (newsOpenStub) {
  newsOpenStub.addEventListener('click', () => {
    setNewsSidebarCollapsed(false);
  });
}

// Voice typing recording button click listener
if (voiceSearchBtn) {
  voiceSearchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (voiceRecognitionInstance) {
      try {
        voiceRecognitionInstance.start();
      } catch (err) {
        console.warn("Speech recognition already running or failed to start:", err);
      }
    } else {
      alert("La reconnaissance vocale n'est pas supportée dans votre configuration actuelle.");
    }
  });
}
if (cancelVoiceBtn) {
  cancelVoiceBtn.addEventListener('click', () => {
    if (voiceRecognitionInstance) {
      voiceRecognitionInstance.stop();
    }
    voiceOverlay.classList.add('hidden');
  });
}

// AI Mode toggler click listener
if (aiModeBtn) {
  aiModeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setAiModeActive(!aiModeActive);
  });
}

if (assistantOpenStub) {
  assistantOpenStub.addEventListener('click', () => {
    setAiModeActive(true);
  });
}

if (closeAiSidebar) {
  closeAiSidebar.addEventListener('click', () => {
    if (aiSidebar) aiSidebar.classList.add('hidden');
    aiModeActive = false;
    if (aiModeBtn) {
      aiModeBtn.style.background = 'rgba(59, 130, 246, 0.1)';
      aiModeBtn.style.color = '#60a5fa';
      aiModeBtn.style.borderColor = 'rgba(59, 130, 246, 0.2)';
    }
    if (assistantOpenStub) assistantOpenStub.classList.remove('hidden');
  });
}

// AI Form text message sender listener
if (aiChatForm) {
  aiChatForm.addEventListener('submit', handleChatSubmit);
}

// AI Quick Suggestions chip buttons click handlers
document.querySelectorAll('.ai-suggest-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.getAttribute('data-query');
    setAiModeActive(true);
    appendChatMessage('user', text);
    appendChatMessage('assistant', '', '<em>Analyzing your request...</em>');
    setTimeout(() => {
      const responseHtml = generateLocalAIResponse(text);
      const lastAssistant = aiChatMessages.querySelector('.ai-message.assistant:last-child');
      if (lastAssistant) {
        lastAssistant.innerHTML = responseHtml;
      }
    }, 600);
  });
});

// Update Checking simulated listener
if (checkUpdateBtn) {
  checkUpdateBtn.addEventListener('click', () => {
    simulateUpdateCheck();
  });
}

// Send shutdown event before closing
window.addEventListener('beforeunload', () => {
  if (lastDeviceInfo) {
    const userEmail = localStorage.getItem('sonsa_user_email');
    const shutdownPayload = {
      ...lastDeviceInfo,
      eventType: 'shutdown',
      details: { email: userEmail || '' }
    };
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${adminUrl}/device/report`, false); // sync
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(shutdownPayload));
    } catch (e) {
      console.log('Shutdown report failed:', e);
    }
  }
});
