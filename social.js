const districts = ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'];
const accepted = relation => ['following', 'follower', 'mutual'].includes(relation);
const localHostnames = new Set(['localhost', '127.0.0.1', '::1']);
const localServerHelp = 'Start the Kerala Play server with npm start, then open http://localhost:3000. Accounts and live features need the server.';
const productionServerHelp = 'Kerala Play account service is starting or temporarily unavailable. Please wait a few seconds and try again.';
const serverHelp = localHostnames.has(location.hostname) ? localServerHelp : productionServerHelp;
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const productionWakeUrl = localHostnames.has(location.hostname) ? '' : 'https://kerala-play-1.onrender.com/api/session';
const SUPABASE_PROJECT_URL = 'https://rxywllmflxuovhlbkext.supabase.co';

function socialRedirectUrl(provider) {
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('kp_oauth', provider);
  return url.toString();
}

function beginProviderSignIn(provider) {
  if (!['google', 'facebook'].includes(provider)) return;
  wakeProductionBackend();
  const authorize = new URL('/auth/v1/authorize', SUPABASE_PROJECT_URL);
  authorize.searchParams.set('provider', provider);
  authorize.searchParams.set('redirect_to', socialRedirectUrl(provider));
  location.assign(authorize.toString());
}

function wakeProductionBackend() {
  if (!productionWakeUrl) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  fetch(`${productionWakeUrl}?wake=${Date.now()}`, {
    method: 'GET',
    mode: 'no-cors',
    cache: 'no-store',
    credentials: 'omit',
    signal: controller.signal,
  }).catch(() => {}).finally(() => clearTimeout(timeout));
}

export async function api(path, body, method) {
  if (!/^https?:$/.test(location.protocol)) throw new Error(serverHelp);
  const requestMethod = method || (body === undefined ? 'GET' : 'POST');
  const options = {
    method: requestMethod,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
  const safeLoginRetry = requestMethod === 'POST' && path === '/api/auth/login';
  const attempts = requestMethod === 'GET' ? 2 : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let response;
    const controller = new AbortController();
    const timeoutMs = safeLoginRetry ? 32000 : (requestMethod === 'GET' ? 18000 : 22000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      response = await fetch(path, { ...options, signal: controller.signal });
    } catch (error) {
      if (attempt + 1 < attempts) { await wait(900); continue; }
      if (error?.name === 'AbortError') {
        throw new Error('Kerala Play server is waking up. Please wait a few seconds and tap Log in again.');
      }
      throw new Error(`Cannot reach the Kerala Play server. ${serverHelp}`);
    } finally {
      clearTimeout(timeout);
    }

    const text = await response.text();
    let result;
    try { result = text ? JSON.parse(text) : {}; }
    catch {
      if (attempt + 1 < attempts) { await wait(900); continue; }
      throw new Error(serverHelp);
    }

    if (!response.ok) {
      if (attempt + 1 < attempts && [429, 502, 503, 504].includes(response.status)) { await wait(900); continue; }
      const error = new Error(result.error || result.message || `Request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return result;
  }
  throw new Error(serverHelp);
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function button(label, action, className = 'social-button') {
  const element = node('button', className, label);
  element.type = 'button';
  element.addEventListener('click', action);
  return element;
}
function field(label, input) {
  const wrap = node('label', 'social-field');
  wrap.append(node('span', '', label), input);
  return wrap;
}
function select(options, value) {
  const element = document.createElement('select');
  options.forEach(option => {
    const entry = node('option', '', typeof option === 'string' ? option : option[1]);
    entry.value = typeof option === 'string' ? option : option[0];
    element.append(entry);
  });
  if (value) element.value = value;
  return element;
}
function input(type, options = {}) {
  const element = document.createElement('input');
  element.type = type;
  Object.assign(element, options);
  return element;
}

export function initSocial({ onUser = () => {}, onPlayers = () => {}, onDisconnect = () => {}, onOpenProfile = () => {}, onToast = () => {} } = {}) {
  let user = null;
  let connected = false;
  let source = null;
  let people = [];
  let peopleSignature = '';
  let activePeer = null;
  let profileId = null;
  let peopleFilter = 'followers';
  let peopleSearch = '';
  let groupsSnapshot = { groups: [], invites: [], limits: {} };
  let groupsVersion = 0;
  let groupMessageVersion = 0;
  let activeGroupId = null;
  let groupReturnFocus = null;
  let messageVersion = 0;
  let profileVersion = 0;
  let peopleVersion = 0;
  let sessionVersion = 0;
  let profileReturnFocus = null;
  let authMode = 'login';
  let recording = null;
  let recordingStream = null;
  let recordingTimer = null;
  let recordingTick = null;
  let recordingPending = false;
  let recordingCancelled = false;
  let holding = false;
  let holdVersion = 0;
  let talkPeer = null;
  let talkStream = null;
  const messageURLs = new Set();
  const receiving = new Set();
  const receiversReady = new Set();
  const peers = new Map();
  const earlyCandidates = new Map();
  const proximityPeers = new Map();
  const proximityCandidates = new Map();
  const proximityRetryAt = new Map();
  const worldPlayers = new Map();
  let proximityEnabled = false;
  let proximityStream = null;
  let proximityStarting = false;
  const PROXIMITY_FULL_VOLUME = 4;
  const PROXIMITY_START_DISTANCE = 22;
  const PROXIMITY_STOP_DISTANCE = 27;
  const listeners = new Set();
  const $ = id => document.getElementById(id);
  const peoplePanel = $('people-panel');
  const dmPanel = $('dm-panel');
  const chatPanel = $('chat-panel');
  const peopleToggle = $('people-toggle');
  const chatToggle = $('chat-toggle');
  const proximityVoiceToggle = $('proximity-voice-toggle');
  const phonePanel = $('phone-panel');
  const phoneToggle = $('phone-toggle');
  const phoneClose = $('phone-close');
  const phoneBadge = $('phone-badge');
  const phoneSummaryText = $('phone-summary-text');
  const phoneNotifications = $('phone-notifications');
  const phoneMarkAll = $('phone-mark-all');
  const phoneRefresh = $('phone-refresh');
  const phoneError = $('phone-error');
  let notificationsSnapshot = null;
  let notificationsTimer = null;
  let npcRelationshipsSnapshot = null;
  const eventsPanel = $('events-panel');
  const eventsToggle = $('events-toggle');
  const eventsClose = $('events-close');
  const eventsList = $('events-list');
  const eventsSummaryText = $('events-summary-text');
  const eventsRefresh = $('events-refresh');
  const eventsError = $('events-error');
  let eventsSnapshot = null;
  let eventsTimer = null;
  const walletPanel = $('wallet-panel');
  const walletToggle = $('wallet-toggle');
  const walletClose = $('wallet-close');
  const walletBalance = $('wallet-balance');
  const walletTransactions = $('wallet-transactions');
  const walletError = $('wallet-error');
  const starterDelivery = $('starter-delivery');
  const walletRefresh = $('wallet-refresh');
  const walletShop = $('wallet-shop');
  const worldShopPanel = $('world-shop-panel');
  const worldShopClose = $('world-shop-close');
  const worldShopName = $('world-shop-name');
  const worldShopNote = $('world-shop-note');
  const worldShopItems = $('world-shop-items');
  const worldShopError = $('world-shop-error');
  let worldShopContext = null;
  const worldShopCatalog = Object.freeze({
    water: Object.freeze({ icon: '💧', name: 'Water', price: 15, effect: 'Thirst +35 · Energy +1' }),
    tea: Object.freeze({ icon: '☕', name: 'Tea', price: 20, effect: 'Thirst +16 · Energy +10' }),
    snack: Object.freeze({ icon: '🥨', name: 'Snack', price: 35, effect: 'Hunger +22 · Energy +5' }),
    meal: Object.freeze({ icon: '🍛', name: 'Kerala Meal', price: 80, effect: 'Hunger +48 · Thirst +6 · Energy +8' }),
  });
  const bankBalance = $('bank-balance');
  const bankAccount = $('bank-account');
  const bankUpiId = $('bank-upi-id');
  const bankCashAmount = $('bank-cash-amount');
  const bankUpiRecipient = $('bank-upi-recipient');
  const bankUpiAmount = $('bank-upi-amount');
  const bankUpiSend = $('bank-upi-send');
  const bankRefresh = $('bank-refresh');
  const bankTransactions = $('bank-transactions');
  const homePanel = $('home-panel');
  const homeToggle = $('home-toggle');
  const homeClose = $('home-close');
  const homeSummaryCard = $('home-summary-card');
  const homeRentStatus = $('home-rent-status');
  const homeUtilityStatus = $('home-utility-status');
  const homePayRent = $('home-pay-rent');
  const homePayUtilities = $('home-pay-utilities');
  const homeSleepNote = $('home-sleep-note');
  const homeRefresh = $('home-refresh');
  const homeError = $('home-error');
  let homeSnapshot = null;
  const garagePanel = $('garage-panel');
  const garageToggle = $('garage-toggle');
  const garageClose = $('garage-close');
  const garageList = $('garage-list');
  const garageCatalog = $('garage-catalog');
  const garageMarket = $('garage-market');
  const garageMarketRefresh = $('garage-market-refresh');
  const trafficDocuments = $('traffic-documents');
  const trafficChallans = $('traffic-challans');
  const trafficRefresh = $('traffic-refresh');
  const trafficCheckpointNote = $('traffic-checkpoint-note');
  const garageError = $('garage-error');
  const garageRefresh = $('garage-refresh');
  const garageSummaryLabel = $('garage-summary');
  let garageSnapshot = null;
  let garageMarketSnapshot = null;
  let trafficSnapshot = null;
  let needsSnapshot = null;
  const jobsPanel = $('jobs-panel');
  const jobsToggle = $('jobs-toggle');
  const jobsClose = $('jobs-close');
  const jobsList = $('jobs-list');
  const jobsError = $('jobs-error');
  const jobsRefresh = $('jobs-refresh');
  let jobsSnapshot = null;
  let jobsTimer = null;
  const profileChip = $('profile-chip');
  const progressionPanel = $('progression-panel');
  const progressionToggle = $('progression-toggle');
  const progressionClose = $('progression-close');
  const progressionTitle = $('progression-title');
  const progressionSummary = $('progression-summary');
  const progressionAchievements = $('progression-achievements');
  const progressionCategories = $('progression-categories');
  const progressionLeaderboard = $('progression-leaderboard');
  const progressionRefresh = $('progression-refresh');
  const progressionError = $('progression-error');
  let progressionSnapshot = null;
  let leaderboardCategoriesSnapshot = [];
  let activeLeaderboardCategory = 'jobs';
  const adminPanel = $('admin-panel');
  const adminToggle = $('admin-toggle');
  const adminClose = $('admin-close');
  const adminMetrics = $('admin-metrics');
  const adminRefresh = $('admin-refresh');
  const adminReportsRefresh = $('admin-reports-refresh');
  const adminReports = $('admin-reports');
  const adminGenerated = $('admin-generated');
  const adminError = $('admin-error');
  let adminTimer = null;

  function renderAdminOverview(data) {
    if (!adminMetrics) return;
    adminMetrics.replaceChildren();
    const cards = [
      ['👥 Players', `${data.players?.online ?? 0} online · ${data.players?.total ?? 0} total`],
      ['🛡 Moderation', `${data.moderation?.reportsOpen ?? 0} open · ${data.moderation?.reportsTotal ?? 0} reports`],
      ['💰 Economy', `₹${Number(data.economy?.combinedMoney || 0).toLocaleString()} combined`],
      ['💼 Jobs', `${data.activity?.activeJobs ?? 0} active`],
      ['📢 World alerts', `${data.world?.configuredAlerts ?? 0} configured`],
    ];
    for (const [title, value] of cards) {
      const card = node('article', 'achievement-card unlocked');
      card.append(node('strong', '', title), node('small', 'social-muted', value));
      adminMetrics.append(card);
    }
    if (adminGenerated) adminGenerated.textContent = `Updated ${new Date(data.generatedAt || Date.now()).toLocaleTimeString()}`;
  }
  function renderAdminReports(data) {
    if (!adminReports) return;
    adminReports.replaceChildren();
    const reports = data?.reports || [];
    if (!reports.length) { adminReports.append(node('p', 'panel-note', 'No moderation reports yet.')); return; }
    for (const report of reports) {
      const card = node('article', 'achievement-card');
      const head = node('strong', '', `${report.status === 'open' ? '🔴' : '✓'} ${report.reason || 'Report'} · ${report.target?.username || 'Unknown'}`);
      const meta = node('small', 'social-muted', `Reported by ${report.reporter?.username || 'Unknown'} · ${new Date(report.createdAt || Date.now()).toLocaleString()}`);
      card.append(head, meta);
      if (report.details) card.append(node('p', 'panel-note', report.details));
      if (report.status === 'open') {
        const actions = node('div', 'profile-actions');
        const resolve = button('Resolve', () => closeAdminReport(report.id, 'resolved'), 'social-button primary');
        const dismiss = button('Dismiss', () => closeAdminReport(report.id, 'dismissed'), 'social-button secondary');
        const warn = button('Warn player', () => moderateReportedPlayer(report, 'warn'), 'social-button secondary');
        const mute = button('Mute 1h', () => moderateReportedPlayer(report, 'mute'), 'social-button secondary');
        actions.append(resolve, dismiss, warn, mute);
        card.append(actions);
      }
      adminReports.append(card);
    }
  }
  async function moderateReportedPlayer(report, action) {
    const targetId = report?.target?.id;
    if (!targetId) return;
    const reason = prompt(`${action === 'warn' ? 'Warning' : 'Mute'} reason for ${report.target?.username || 'player'}:`, report.details || report.reason || '');
    if (reason === null) return;
    const cleanReason = reason.trim();
    if (cleanReason.length < 3 || cleanReason.length > 240) { toast('Reason must be 3–240 characters.'); return; }
    const body = action === 'mute' ? { reason: cleanReason, durationMinutes: 60 } : { reason: cleanReason };
    if (!confirm(`${action === 'warn' ? 'Warn' : 'Mute for 1 hour'} ${report.target?.username || 'this player'}?`)) return;
    await api(`/api/admin/players/${encodeURIComponent(targetId)}/${action}`, body);
    toast(action === 'warn' ? 'Player warning sent.' : 'Player muted for 1 hour.');
    await refreshAdminOverview();
  }
  async function closeAdminReport(reportId, status) {
    if (!confirm(`${status === 'resolved' ? 'Resolve' : 'Dismiss'} this moderation report?`)) return;
    const result = await api(`/api/admin/reports/${encodeURIComponent(reportId)}`, { status }, 'PATCH');
    await Promise.all([refreshAdminReports(), refreshAdminOverview()]);
    toast(`Report ${result.report?.status || status}.`);
  }
  async function refreshAdminReports() {
    const data = await api('/api/admin/reports');
    renderAdminReports(data);
    return data;
  }
  async function refreshAdminOverview() {
    const data = await api('/api/admin/overview');
    if (adminToggle) adminToggle.hidden = false;
    renderAdminOverview(data);
    return data;
  }
  async function discoverAdminAccess() {
    if (!user || !adminToggle) return;
    try { await refreshAdminOverview(); }
    catch (error) {
      if (error?.status === 403) { adminToggle.hidden = true; return; }
      throw error;
    }
  }
  async function openAdmin() {
    showPanel(adminPanel);
    await refreshAdminOverview();
    await refreshAdminReports();
    if (adminTimer) clearInterval(adminTimer);
    adminTimer = setInterval(() => { if (user && adminPanel?.classList.contains('open')) run(refreshAdminOverview, adminError); }, 15000);
  }

  function toast(message) { onToast(message); }
  function notifyState() { for (const listener of listeners) listener({ user, connected }); }
  function report(error, target) {
    const message = error?.message || 'Something went wrong. Please try again.';
    if (target) target.textContent = message;
    else toast(message);
    if (error?.status === 401 && user) endSession('Your session expired. Please log in again.');
  }
  async function run(action, target) {
    const version = sessionVersion;
    try { if (target) target.textContent = ''; return await action(); }
    catch (error) { if (version === sessionVersion) report(error, target); return null; }
  }
  function setUser(next) {
    user = next || null;
    if ($('profile-name')) $('profile-name').textContent = user?.username || 'Sign in';
    if ($('profile-district')) $('profile-district').textContent = user?.district || 'Your Kerala adventure';
    profileChip?.setAttribute('aria-label', user ? `Open ${user.username}'s profile` : 'Sign in');
    onUser(user);
    notifyState();
  }
  function setConnection(next, count) {
    connected = next;
    const label = user ? (next ? `${count ?? Math.max(1, people.filter(person => person.online).length + 1)} online` : 'Reconnecting…') : 'Not connected';
    if ($('online-count')) $('online-count').textContent = label;
    if ($('people-online-label')) $('people-online-label').textContent = label;
    $('online-chip')?.classList.toggle('social-offline', !next);
    notifyState();
    updateVoiceControls();
  }
  function closePanels() {
    cancelRecording(); stopTalking();
    for (const panel of [peoplePanel, dmPanel, chatPanel, phonePanel, eventsPanel, walletPanel, homePanel, garagePanel, jobsPanel, progressionPanel, adminPanel, worldShopPanel]) panel?.classList.remove('open');
    peopleToggle?.setAttribute('aria-expanded', 'false');
    chatToggle?.setAttribute('aria-expanded', 'false');
    phoneToggle?.setAttribute('aria-expanded', 'false');
    eventsToggle?.setAttribute('aria-expanded', 'false');
    walletToggle?.setAttribute('aria-expanded', 'false');
    homeToggle?.setAttribute('aria-expanded', 'false');
    garageToggle?.setAttribute('aria-expanded', 'false');
    jobsToggle?.setAttribute('aria-expanded', 'false');
    progressionToggle?.setAttribute('aria-expanded', 'false');
    adminToggle?.setAttribute('aria-expanded', 'false');
    if (adminTimer) { clearInterval(adminTimer); adminTimer = null; }
    if (jobsTimer) { clearInterval(jobsTimer); jobsTimer = null; }
    if (eventsTimer) { clearInterval(eventsTimer); eventsTimer = null; }
  }
  function showPanel(panel) {
    closePanels();
    for (const [panelId, toggleId] of [['minimap', 'map-open'], ['task-panel', 'task-toggle']]) {
      $(panelId)?.classList.remove('open');
      $(toggleId)?.setAttribute('aria-expanded', 'false');
    }
    panel?.classList.add('open');
    if (panel === chatPanel || panel === dmPanel) chatToggle?.classList.remove('unread');
    peopleToggle?.setAttribute('aria-expanded', String(panel === peoplePanel));
    chatToggle?.setAttribute('aria-expanded', String(panel === dmPanel || panel === chatPanel));
    phoneToggle?.setAttribute('aria-expanded', String(panel === phonePanel));
    eventsToggle?.setAttribute('aria-expanded', String(panel === eventsPanel));
    walletToggle?.setAttribute('aria-expanded', String(panel === walletPanel));
    homeToggle?.setAttribute('aria-expanded', String(panel === homePanel));
    garageToggle?.setAttribute('aria-expanded', String(panel === garagePanel));
    jobsToggle?.setAttribute('aria-expanded', String(panel === jobsPanel));
    progressionToggle?.setAttribute('aria-expanded', String(panel === progressionPanel));
  }
  function panelHeader(title, panel, id) {
    const header = node('div', 'panel-heading');
    const heading = node('strong', '', title);
    if (id) heading.id = id;
    header.append(heading, button('×', () => { closePanels(); (panel === peoplePanel ? peopleToggle : chatToggle)?.focus(); }, 'panel-close'));
    header.lastChild.setAttribute('aria-label', `Close ${title}`);
    return header;
  }

  const authModal = node('section', 'social-modal');
  authModal.id = 'auth-modal';
  authModal.setAttribute('role', 'dialog');
  authModal.setAttribute('aria-modal', 'true');
  authModal.setAttribute('aria-labelledby', 'auth-title');
  authModal.hidden = true;
  const authCard = node('div', 'social-card auth-card');
  const authLogo = document.createElement('img');
  authLogo.className = 'auth-brand-logo';
  authLogo.src = './assets/kerala-play-logo.svg';
  authLogo.alt = 'Kerala Play';
  const authTitle = node('h1', '', 'Welcome to Kerala Play');
  authTitle.id = 'auth-title';
  const authIntro = node('p', 'social-muted', 'Your avatar. Your people. One living Kerala.');
  const authTabs = node('div', 'social-tabs');
  const loginTab = button('Log in', () => renderAuth('login'));
  const signupTab = button('Create account', () => renderAuth('signup'));
  authTabs.append(loginTab, signupTab);
  const authForm = node('form', 'social-form');
  const firstName = input('text', { name: 'firstName', required: true, maxLength: 40, autocomplete: 'given-name' });
  const username = input('text', { name: 'identifier', required: true, minLength: 3, maxLength: 80, autocomplete: 'username', spellcheck: false });
  username.setAttribute('autocapitalize', 'none');
  username.setAttribute('aria-describedby', 'auth-username-note');
  const usernameNote = node('small', 'social-muted', 'Use your username, email, or mobile number.');
  usernameNote.id = 'auth-username-note';
  const password = input('password', { name: 'password', required: true, minLength: 8, maxLength: 128, autocomplete: 'current-password' });
  const signupFields = node('div', 'social-fields-row');
  const signupContact = node('div', 'social-fields-row');
  const signupEmail = input('email', { placeholder: 'Email (optional)', autocomplete: 'email' });
  const signupMobile = input('tel', { placeholder: 'Mobile (optional)', autocomplete: 'tel' });
  signupContact.append(field('Email', signupEmail), field('Mobile', signupMobile));
  const signupDistrict = select(districts, 'Ernakulam');
  const signupGender = select([['male', 'Male'], ['female', 'Female'], ['other', 'Other']], 'male');
  signupFields.append(field('District', signupDistrict), field('Avatar', signupGender));
  const authSubmit = node('button', 'social-button primary', 'Log in');
  authSubmit.type = 'submit';
  const providerDivider = node('div', 'auth-provider-divider', 'or continue with');
  const providerRow = node('div', 'auth-provider-row');
  const googleAuth = button('Google', () => beginProviderSignIn('google'), 'auth-provider google');
  const facebookAuth = button('Facebook', () => beginProviderSignIn('facebook'), 'auth-provider facebook');
  googleAuth.type = 'button';
  facebookAuth.type = 'button';
  googleAuth.setAttribute('aria-label', 'Continue with Google');
  facebookAuth.setAttribute('aria-label', 'Continue with Facebook');
  providerRow.append(googleAuth, facebookAuth);
  const authError = node('div', 'social-error');
  authError.setAttribute('role', 'status');
  authError.setAttribute('aria-live', 'polite');
  const authNote = node('p', 'social-muted', 'New accounts start at 0 points. Earn rewards by completing tasks and winning games.');
  const forgot = button('Forgot password?', () => renderReset()); forgot.className = 'social-link';
  authForm.append(field('First name', firstName), field('Username', username), usernameNote, field('Password', password), signupContact, signupFields, authSubmit, providerDivider, providerRow, forgot, authError);
  authCard.append(authLogo, authTitle, authIntro, authTabs, authForm, authNote);
  const resetForm = node('form', 'social-form');
  resetForm.hidden = true;
  const resetTitle = node('h2', '', 'Reset password');
  const resetIntro = node('p', 'social-muted', 'Enter the username, email, or mobile number used when you registered.');
  const resetIdentifier = input('text', { required: true, maxLength: 80, autocomplete: 'username', placeholder: 'Username, email, or mobile number' });
  const resetCode = input('text', { inputMode: 'numeric', pattern: '[0-9]{6}', maxLength: 6, autocomplete: 'one-time-code', placeholder: '6-digit code' });
  const resetPassword = input('password', { minLength: 8, maxLength: 128, autocomplete: 'new-password', placeholder: 'New password (8+ characters)' });
  const resetConfirmPassword = input('password', { minLength: 8, maxLength: 128, autocomplete: 'new-password', placeholder: 'Confirm new password' });
  const resetAccountStep = node('div');
  resetAccountStep.append(field('Account', resetIdentifier));
  const resetVerifyStep = node('div');
  resetVerifyStep.hidden = true;
  resetVerifyStep.append(field('OTP from email', resetCode), field('New password', resetPassword), field('Confirm password', resetConfirmPassword));
  const resetSubmit = node('button', 'social-button primary', 'Send email OTP');
  resetSubmit.type = 'submit';
  const resetBack = button('Back to log in', () => renderAuth('login'), 'social-button secondary');
  const resetError = node('div', 'social-error');
  resetError.setAttribute('role', 'status');
  resetError.setAttribute('aria-live', 'polite');
  resetForm.append(resetTitle, resetIntro, resetAccountStep, resetVerifyStep, resetSubmit, resetBack, resetError);
  authCard.append(resetForm);
  authModal.append(authCard);
  document.body.append(authModal);

  const profileModal = node('section', 'social-modal');
  profileModal.id = 'social-profile-modal';
  profileModal.setAttribute('role', 'dialog');
  profileModal.setAttribute('aria-modal', 'true');
  profileModal.setAttribute('aria-labelledby', 'social-profile-title');
  profileModal.hidden = true;
  const profileCard = node('div', 'social-card');
  profileModal.append(profileCard);
  document.body.append(profileModal);

  const groupModal = node('section', 'social-modal');
  groupModal.id = 'social-group-modal';
  groupModal.setAttribute('role', 'dialog');
  groupModal.setAttribute('aria-modal', 'true');
  groupModal.setAttribute('aria-labelledby', 'social-group-title');
  groupModal.hidden = true;
  const groupCard = node('div', 'social-card group-card');
  groupModal.append(groupCard);
  document.body.append(groupModal);

  function trapFocus(event) {
    event.stopPropagation();
    if (event.key === 'Escape' && !groupModal.hidden) { closeGroup(); return; }
    if (event.key === 'Escape' && !profileModal.hidden) { closeProfile(); return; }
    if (event.key !== 'Tab') return;
    const elements = [...event.currentTarget.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]')].filter(element => !element.disabled && element.getClientRects().length);
    if (!elements.length) { event.preventDefault(); return; }
    const first = elements[0], last = elements.at(-1);
    if (event.shiftKey && (document.activeElement === first || !elements.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !elements.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
  }
  authModal.addEventListener('keydown', trapFocus);
  profileModal.addEventListener('keydown', trapFocus);
  groupModal.addEventListener('keydown', trapFocus);
  profileModal.addEventListener('click', event => { if (event.target === profileModal) closeProfile(); });
  groupModal.addEventListener('click', event => { if (event.target === groupModal) closeGroup(); });
  for (const panel of [peoplePanel, dmPanel, chatPanel]) {
    panel?.addEventListener('keydown', event => { event.stopPropagation(); if (event.key === 'Escape') { closePanels(); chatToggle?.focus(); } });
    panel?.addEventListener('pointerdown', event => event.stopPropagation());
  }
  function renderAuth(mode = authMode, error = '') {
    authMode = mode;
    authModal.hidden = false;
    resetForm.hidden = true;
    authTabs.hidden = false;
    authForm.hidden = false;
    signupFields.hidden = mode !== 'signup';
    signupContact.hidden = mode !== 'signup';
    firstName.parentElement.hidden = mode !== 'signup';
    firstName.required = mode === 'signup';
    if (mode === 'signup') username.pattern = '(?=.*[A-Za-z])[A-Za-z0-9_]{3,24}';
    else username.removeAttribute('pattern');
    username.minLength = mode === 'signup' ? 3 : 3;
    username.maxLength = mode === 'signup' ? 24 : 80;
    usernameNote.textContent = mode === 'signup' ? 'Letters, numbers and underscores; at least one letter.' : 'Use your username or mobile number.';
    authNote.hidden = mode !== 'signup';
    signupTab.setAttribute('aria-pressed', String(mode === 'signup'));
    loginTab.setAttribute('aria-pressed', String(mode === 'login'));
    authSubmit.textContent = mode === 'signup' ? 'Create account & explore' : 'Log in & explore';
    providerDivider.textContent = mode === 'signup' ? 'or create with' : 'or continue with';
    password.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    authError.textContent = error;
    queueMicrotask(() => username.focus());
  }
  async function completeOAuthCallback() {
    const query = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    const provider = String(query.get('kp_oauth') || '').toLowerCase();
    if (!provider) return false;

    const errorMessage = hash.get('error_description') || hash.get('error') || query.get('error_description') || query.get('error');
    const accessToken = hash.get('access_token');
    const cleanUrl = location.pathname || '/';
    history.replaceState({}, document.title, cleanUrl);

    if (errorMessage) {
      renderAuth('login', decodeURIComponent(errorMessage.replace(/\+/g, ' ')));
      return true;
    }
    if (!accessToken) {
      renderAuth('login', 'Social sign in did not return a valid session. Please try again.');
      return true;
    }

    try {
      wakeProductionBackend();
      const result = await api('/api/auth/oauth', { provider, accessToken });
      await beginSession(result.user, !!result.created);
    } catch (error) {
      renderAuth('login', error?.message || 'Social sign in failed.');
    }
    return true;
  }

  function setResetStep(step = 'account') {
    const verifying = step === 'verify';
    resetAccountStep.hidden = verifying;
    resetVerifyStep.hidden = !verifying;
    resetIdentifier.required = !verifying;
    resetCode.required = verifying;
    resetPassword.required = verifying;
    resetConfirmPassword.required = verifying;
    resetSubmit.textContent = verifying ? 'Save new password' : 'Send email OTP';
    resetIntro.textContent = verifying
      ? 'Enter the 6-digit OTP sent to your saved email, then choose and confirm your new password.'
      : 'Enter the username, email, or mobile number used when you registered.';
  }

  function renderReset() {
    authModal.hidden = false;
    authTabs.hidden = true;
    authForm.hidden = true;
    authNote.hidden = true;
    resetForm.hidden = false;
    resetError.textContent = '';
    resetCode.value = '';
    resetPassword.value = '';
    resetConfirmPassword.value = '';
    setResetStep('account');
    queueMicrotask(() => resetIdentifier.focus());
  }
  resetForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!resetForm.reportValidity()) return;
    resetSubmit.disabled = true;
    await run(async () => {
      if (!resetAccountStep.hidden) {
        const result = await api('/api/auth/forgot', { identifier: resetIdentifier.value.trim() });
        resetIntro.textContent = `${result.message} Enter the OTP below to continue.`;
        setResetStep('verify');
        resetCode.focus();
      } else {
        if (resetPassword.value !== resetConfirmPassword.value) throw new Error('New password and confirm password must match.');
        await api('/api/auth/reset', { code: resetCode.value.trim(), password: resetPassword.value });
        resetCode.value = '';
        resetPassword.value = '';
        resetConfirmPassword.value = '';
        setResetStep('account');
        renderAuth('login', 'Password reset. You can log in now.');
      }
    }, resetError);
    resetSubmit.disabled = false;
  });
  authForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!authForm.reportValidity()) return;
    const submitLabel = authMode === 'signup' ? 'Create account & explore' : 'Log in & explore';
    authSubmit.disabled = true;
    authSubmit.textContent = authMode === 'signup' ? 'Creating account…' : 'Connecting…';
    authError.textContent = '';
    wakeProductionBackend();
    if (authMode === 'login') await wait(1600);
    await run(async () => {
      const result = await api(`/api/auth/${authMode}`, { identifier: username.value.trim(), username: username.value.trim(), firstName: firstName.value.trim(), password: password.value, ...(authMode === 'signup' ? { email: signupEmail.value, mobile: signupMobile.value, district: signupDistrict.value, gender: signupGender.value } : {}) });
      password.value = '';
      await beginSession(result.user, authMode === 'signup');
    }, authError);
    authSubmit.disabled = false;
    if (!user) authSubmit.textContent = submitLabel;
  });

  peoplePanel.replaceChildren(panelHeader('People', peoplePanel));
  const onlineLabel = node('p', 'panel-note', 'Not connected');
  onlineLabel.id = 'people-online-label';
  const peopleTabs = node('div', 'social-tabs people-tabs');
  // People is intentionally a private social space: only relationship lists
  // are shown here. New players can still be met naturally in the world.
  for (const [value, label] of [['followers', 'Followers'], ['following', 'Following'], ['requests', 'Requests'], ['groups', 'Groups']]) {
    const tab = button(label, () => { peopleFilter = value; renderPeople(); if (value === 'groups') run(refreshGroups, peopleError); });
    tab.dataset.filter = value;
    peopleTabs.append(tab);
  }
  const search = input('search', { placeholder: 'Find a username', maxLength: 24 });
  search.setAttribute('aria-label', 'Find people by username');
  search.addEventListener('input', () => { peopleSearch = search.value.trim().toLowerCase(); renderPeople(); });
  const peopleError = node('div', 'social-error');
  peopleError.setAttribute('role', 'status');
  const peopleList = node('div', 'social-people-list');
  peopleList.id = 'people-list';
  peoplePanel.append(onlineLabel, peopleTabs, search, peopleError, peopleList);

  chatPanel.replaceChildren(panelHeader('Messages', chatPanel));
  chatPanel.setAttribute('aria-label', 'Accepted contacts and messages');
  chatPanel.append(node('p', 'panel-note', 'Direct messages unlock when either of you accepts a follow request. Voice messages and walkie-talkie are available inside a conversation.'));
  const conversations = node('div', 'social-people-list');
  chatPanel.append(conversations);

  dmPanel.replaceChildren(panelHeader('Direct message', dmPanel, 'dm-title'));
  const dmNote = node('p', 'panel-note', 'Messages are shared privately with this contact.');
  dmNote.id = 'dm-note';
  const dmLog = node('div', '');
  dmLog.id = 'dm-log';
  dmLog.setAttribute('role', 'log');
  dmLog.setAttribute('aria-live', 'polite');
  const dmForm = node('form');
  dmForm.id = 'dm-form';
  const dmInput = input('text', { placeholder: 'Write a message', maxLength: 1000, autocomplete: 'off', required: true });
  dmInput.id = 'dm-input';
  dmInput.setAttribute('aria-label', 'Direct message text');
  const dmSend = node('button', 'action-button', 'Send');
  dmSend.type = 'submit';
  dmForm.append(dmInput, dmSend);
  const dmError = node('div', 'social-error');
  dmError.setAttribute('role', 'status');
  const voiceBox = node('div', 'social-voice');
  const voiceTitle = node('strong', '', 'Voice');
  const recordButton = button('Record voice message', () => recording || recordingPending ? finishRecording() : run(startRecording, dmError));
  const recordCancel = button('Discard', cancelRecording, 'social-button secondary');
  recordCancel.hidden = true;
  const recordRow = node('div', 'social-actions');
  recordRow.append(recordButton, recordCancel);
  const receiveInput = input('checkbox');
  const receiveLabel = node('label', 'social-check');
  receiveLabel.append(receiveInput, node('span', '', 'Allow this contact’s live voice'));
  receiveInput.addEventListener('change', () => run(async () => {
    if (!activePeer) return;
    const peerId = activePeer.id;
    if (receiveInput.checked) receiving.add(peerId);
    else { receiving.delete(peerId); closePeer(peerId); }
    await sendSignal(peerId, { type: receiveInput.checked ? 'opt-in' : 'disabled', enabled: receiveInput.checked });
    updateVoiceControls();
  }, dmError));
  const talkButton = button('Hold to talk', () => {});
  talkButton.classList.add('social-talk');
  talkButton.setAttribute('aria-label', 'Hold to talk to this contact');
  const voiceStatus = node('p', 'panel-note');
  voiceStatus.setAttribute('role', 'status');
  const audioMount = node('div', 'social-live-audio');
  voiceBox.append(voiceTitle, recordRow, receiveLabel, talkButton, voiceStatus, audioMount);
  dmPanel.append(dmNote, dmLog, dmForm, dmError, voiceBox);
  talkButton.addEventListener('pointerdown', event => { if (event.button !== 0) return; event.preventDefault(); talkButton.setPointerCapture(event.pointerId); run(startTalking, dmError); });
  talkButton.addEventListener('pointerup', stopTalking);
  talkButton.addEventListener('pointercancel', stopTalking);
  talkButton.addEventListener('lostpointercapture', stopTalking);
  talkButton.addEventListener('keydown', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); if (!event.repeat) run(startTalking, dmError); } });
  talkButton.addEventListener('keyup', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); stopTalking(); } });
  talkButton.addEventListener('blur', stopTalking);
  dmForm.addEventListener('submit', async event => {
    event.preventDefault();
    const body = dmInput.value.trim();
    if (!activePeer || !body) return;
    const peerId = activePeer.id;
    dmSend.disabled = true;
    await run(async () => { await api(`/api/messages/${encodeURIComponent(peerId)}`, { body }); if (activePeer?.id === peerId) { dmInput.value = ''; await loadMessages(); } }, dmError);
    dmSend.disabled = false;
  });

  function canMessage(person) { return !!person && !person.blocked && person.canMessage !== false && accepted(person.relationship); }
  function avatar(person) {
    const picture = node('span', `social-avatar ${person.gender === 'female' ? 'female' : ''}`, person.username?.slice(0, 1).toUpperCase() || '?');
    picture.setAttribute('aria-hidden', 'true');
    return picture;
  }
  function relationshipText(person) {
    if (person.blocked) return 'Blocked';
    return { none: 'Meet someone new', outgoing: 'Request sent', incoming: 'Wants to follow you', following: 'Following', follower: 'Follows you', mutual: 'Following each other' }[person.relationship] || '';
  }
  async function relationshipAction(person, action) {
    await api(`/api/follows/${encodeURIComponent(person.id)}`, { action });
    if (['unfollow', 'decline', 'cancel'].includes(action)) { closePeer(person.id); receiversReady.delete(person.id); receiving.delete(person.id); }
    await refreshPeople();
    await refreshUser();
    if (!profileModal.hidden && profileId === person.id) await openProfile(person.id, true);
  }
  function relationshipButtons(person, errorTarget = peopleError) {
    const actions = node('div', 'social-actions');
    if (person.id === user?.id) return actions;
    if (person.blocked) {
      actions.append(button('Unblock', () => run(async () => { await api(`/api/blocks/${encodeURIComponent(person.id)}`, { blocked: false }); await refreshPeople(); if (!profileModal.hidden) await openProfile(person.id, true); }, errorTarget), 'social-button secondary'));
      return actions;
    }
    const relation = person.relationship;
    if (relation === 'incoming') {
      actions.append(button('Accept', () => run(() => relationshipAction(person, 'accept'), errorTarget)));
      actions.append(button('Decline', () => run(() => relationshipAction(person, 'decline'), errorTarget), 'social-button secondary'));
    } else if (relation === 'outgoing') actions.append(button('Cancel request', () => run(() => relationshipAction(person, 'cancel'), errorTarget), 'social-button secondary'));
    else if (['following', 'mutual'].includes(relation)) actions.append(button('Unfollow', () => run(() => relationshipAction(person, 'unfollow'), errorTarget), 'social-button secondary'));
    else actions.append(button(relation === 'follower' ? 'Follow back' : 'Request follow', () => run(() => relationshipAction(person, 'request'), errorTarget)));
    if (canMessage(person)) actions.append(button('Message', () => run(() => openConversation(person), errorTarget)));
    return actions;
  }
  function personCard(person, messageOnly = false) {
    const card = node('article', 'people-entry social-person');
    const name = button('', () => openProfile(person.id), 'social-person-name');
    const details = node('span');
    details.append(node('strong', '', person.username), node('small', '', person.blocked ? 'Blocked account' : `${person.online ? '● Online' : 'Offline'} · ${person.district || 'Kerala'} · Level ${person.level || 1}`));
    name.append(avatar(person), details);
    card.append(name, node('small', 'social-muted', relationshipText(person)));
    if (messageOnly) card.append(button('Open conversation', () => run(() => openConversation(person), peopleError)));
    else card.append(relationshipButtons(person));
    return card;
  }
  function groupById(id) {
    return [...(groupsSnapshot.groups || []), ...(groupsSnapshot.invites || [])].find(group => group.id === id) || null;
  }
  async function refreshGroups() {
    if (!user) return groupsSnapshot;
    const version = ++groupsVersion;
    const result = await api('/api/groups');
    if (!user || version !== groupsVersion) return groupsSnapshot;
    groupsSnapshot = result || { groups: [], invites: [], limits: {} };
    if (peopleFilter === 'groups') renderPeople();
    if (activeGroupId && !groupModal.hidden && !(groupsSnapshot.groups || []).some(group => group.id === activeGroupId)) closeGroup();
    return groupsSnapshot;
  }
  function renderGroupsList() {
    const createForm = node('form', 'social-form group-create-form');
    const name = input('text', { placeholder: 'New group name', maxLength: 40, required: true, autocomplete: 'off' });
    const create = node('button', 'social-button primary', 'Create group'); create.type = 'submit';
    createForm.append(field('Create a group', name), create);
    createForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!name.value.trim()) return;
      create.disabled = true;
      await run(async () => {
        const result = await api('/api/groups', { name: name.value.trim() });
        name.value = '';
        groupsSnapshot = result.summary || await api('/api/groups');
        renderPeople();
        if (result.group?.id) await openGroup(result.group.id);
      }, peopleError);
      create.disabled = false;
    });
    peopleList.append(createForm);

    const invites = groupsSnapshot.invites || [];
    if (invites.length) peopleList.append(node('strong', 'group-section-title', 'Invitations'));
    for (const group of invites) {
      const card = node('article', 'people-entry group-entry');
      const info = node('div');
      info.append(node('strong', '', group.name), node('small', 'social-muted', `${group.memberCount} member${group.memberCount === 1 ? '' : 's'} · invitation pending`));
      const actions = node('div', 'social-actions');
      actions.append(
        button('Accept', () => run(async () => { await api(`/api/groups/${encodeURIComponent(group.id)}/respond`, { action: 'accept' }); await refreshGroups(); }, peopleError)),
        button('Decline', () => run(async () => { await api(`/api/groups/${encodeURIComponent(group.id)}/respond`, { action: 'decline' }); await refreshGroups(); }, peopleError), 'social-button secondary')
      );
      card.append(info, actions); peopleList.append(card);
    }

    const groups = groupsSnapshot.groups || [];
    if (groups.length) peopleList.append(node('strong', 'group-section-title', 'Your groups'));
    if (!groups.length && !invites.length) peopleList.append(node('p', 'social-empty', 'No groups yet. Create one and invite an accepted contact.'));
    for (const group of groups) {
      const card = node('article', 'people-entry group-entry');
      const open = button('', () => run(() => openGroup(group.id), peopleError), 'social-person-name');
      const badge = node('span', 'social-avatar group-avatar', group.name.slice(0, 1).toUpperCase());
      const details = node('span');
      details.append(node('strong', '', group.name), node('small', '', `${group.memberCount} member${group.memberCount === 1 ? '' : 's'}${group.isOwner ? ' · You own this group' : ''}`));
      open.append(badge, details);
      card.append(open, button('Open', () => run(() => openGroup(group.id), peopleError), 'social-button secondary'));
      peopleList.append(card);
    }
  }
  function renderPeople() {
    peopleList.replaceChildren();
    for (const tab of peopleTabs.children) tab.setAttribute('aria-pressed', String(tab.dataset.filter === peopleFilter));
    search.hidden = peopleFilter === 'groups';
    if (peopleFilter === 'groups') renderGroupsList();
    else {
      const visible = people.filter(person => {
        if (person.id === user?.id || !person.username?.toLowerCase().includes(peopleSearch)) return false;
        if (peopleFilter === 'blocked') return person.blocked;
        if (person.blocked) return false;
        if (peopleFilter === 'followers') return ['follower', 'mutual'].includes(person.relationship);
        if (peopleFilter === 'following') return ['following', 'mutual'].includes(person.relationship);
        if (peopleFilter === 'requests') return ['outgoing', 'incoming'].includes(person.relationship);
        return true;
      }).sort((a, b) => Number(b.online) - Number(a.online) || a.username.localeCompare(b.username));
      if (!visible.length) peopleList.append(node('p', 'social-empty', 'No people in this list yet.'));
      for (const person of visible) peopleList.append(personCard(person));
    }
    conversations.replaceChildren();
    const contacts = people.filter(person => person.id !== user?.id && canMessage(person));
    if (!contacts.length) conversations.append(node('p', 'social-empty', 'No accepted contacts yet. Open People to send or accept a follow request.'), button('Find people', openPeople));
    contacts.forEach(person => conversations.append(personCard(person, true)));
    if (activePeer) {
      const updated = people.find(person => person.id === activePeer.id);
      if (!updated || !canMessage(updated)) {
        closePeer(activePeer.id); receiving.delete(activePeer.id); receiversReady.delete(activePeer.id);
        cancelRecording(); stopTalking(); activePeer = null; messageVersion++;
        if (dmPanel.classList.contains('open')) { showPanel(chatPanel); toast('Messaging is unavailable until a follow is accepted.'); }
        clearMessageURLs(); dmLog.replaceChildren();
      } else activePeer = updated;
    }
    for (const id of [...receiving]) if (!canMessage(people.find(person => person.id === id))) { receiving.delete(id); closePeer(id); }
    for (const person of people) if (!person.online) {
      receiversReady.delete(person.id);
      receiving.delete(person.id);
      closePeer(person.id);
      if (talkPeer === person.id) stopTalking();
    }
    updateVoiceControls();
  }
  async function refreshPeople() {
    if (!user) return;
    const version = ++peopleVersion;
    const result = await api('/api/people');
    if (!user || version !== peopleVersion) return;
    people = result.people || [];
    const signature = JSON.stringify(people.map(person => [person.id, person.username, person.district, person.gender, person.points, person.level, person.followers, person.following, person.bio, person.relationship, person.blocked, person.canMessage, person.online]));
    if (signature !== peopleSignature) { peopleSignature = signature; renderPeople(); }
  }
  async function refreshUser() {
    const version = sessionVersion;
    const result = await api('/api/session');
    if (version !== sessionVersion) return user;
    if (result.user && user && result.user.id !== user.id) await beginSession(result.user);
    else if (result.user) setUser(result.user);
    else if (user) endSession('Please log in again.');
    return user;
  }
  function requireUser() { if (user) return true; renderAuth(); return false; }
  function formatCash(value) { return `₹${Number(value || 0).toLocaleString('en-IN')}`; }
  function renderWallet(wallet) {
    if (!wallet) return;
    if (walletBalance) walletBalance.textContent = formatCash(wallet.balance);
    if (starterDelivery) {
      starterDelivery.disabled = !!wallet.starterJobCompleted;
      starterDelivery.textContent = wallet.starterJobCompleted ? 'Starter Delivery · Salary received' : 'Complete Starter Delivery · +₹250';
    }
    if (walletTransactions) {
      walletTransactions.replaceChildren();
      const transactions = Array.isArray(wallet.transactions) ? wallet.transactions : [];
      if (!transactions.length) walletTransactions.append(node('p', 'social-empty', 'No transactions yet.'));
      for (const transaction of transactions) {
        const row = node('div', `wallet-transaction ${transaction.type === 'debit' ? 'debit' : 'credit'}`);
        const title = node('strong', '', transaction.description || transaction.kind || 'Transaction');
        const amount = node('b', '', `${transaction.type === 'debit' ? '−' : '+'}${formatCash(transaction.amount)}`);
        const created = new Date(transaction.createdAt);
        const detail = node('small', '', `${Number.isNaN(created.getTime()) ? '' : created.toLocaleString()} · Balance ${formatCash(transaction.balanceAfter)}`);
        row.append(title, amount, detail); walletTransactions.append(row);
      }
    }
  }
  async function refreshWallet() {
    if (!user) return null;
    const wallet = await api('/api/wallet');
    renderWallet(wallet);
    return wallet;
  }
  function renderBank(bank) {
    if (!bank) return;
    if (bankBalance) bankBalance.textContent = formatCash(bank.balance);
    if (bankAccount) bankAccount.textContent = `${bank.bankName || 'Kerala Bank'} · ${bank.accountNumber || 'Account'}`;
    if (bankUpiId) bankUpiId.textContent = `UPI · ${bank.upiId || ''}`;
    if (bankCashAmount && bank.transferMax) bankCashAmount.max = String(bank.transferMax);
    if (bankUpiAmount && bank.transferMax) bankUpiAmount.max = String(bank.transferMax);
    if (bankTransactions) {
      bankTransactions.replaceChildren();
      const transactions = Array.isArray(bank.transactions) ? bank.transactions : [];
      if (!transactions.length) bankTransactions.append(node('p', 'social-empty', 'No bank transactions yet.'));
      for (const transaction of transactions) {
        const row = node('div', `wallet-transaction ${transaction.type === 'debit' ? 'debit' : 'credit'}`);
        const title = node('strong', '', transaction.description || transaction.kind || 'Bank transaction');
        const amount = node('b', '', `${transaction.type === 'debit' ? '−' : '+'}${formatCash(transaction.amount)}`);
        const created = new Date(transaction.createdAt);
        const counterparty = transaction.counterparty ? ` · ${transaction.counterparty}` : '';
        const detail = node('small', '', `${Number.isNaN(created.getTime()) ? '' : created.toLocaleString()}${counterparty} · Bank ${formatCash(transaction.balanceAfter)}`);
        row.append(title, amount, detail);
        bankTransactions.append(row);
      }
    }
  }

  async function refreshBank() {
    if (!user) return null;
    const bank = await api('/api/bank');
    renderBank(bank);
    return bank;
  }

  async function refreshFinance() {
    if (!user) return null;
    const [wallet, bank] = await Promise.all([api('/api/wallet'), api('/api/bank')]);
    renderWallet(wallet);
    renderBank(bank);
    return { wallet, bank };
  }
  function renderNotifications(summary) {
    notificationsSnapshot = summary || { unreadCount: 0, items: [] };
    const unread = Number(notificationsSnapshot.unreadCount || 0);
    if (phoneBadge) {
      phoneBadge.hidden = unread <= 0;
      phoneBadge.textContent = unread > 99 ? '99+' : String(unread);
    }
    if (phoneSummaryText) phoneSummaryText.textContent = unread ? `${unread} unread alert${unread === 1 ? '' : 's'}` : 'No unread alerts';
    if (phoneMarkAll) phoneMarkAll.disabled = unread <= 0;
    if (!phoneNotifications) return;
    phoneNotifications.replaceChildren();
    const items = Array.isArray(notificationsSnapshot.items) ? notificationsSnapshot.items : [];
    if (!items.length) {
      phoneNotifications.append(node('p', 'social-empty', 'No notifications right now.'));
      return;
    }
    for (const item of items) {
      const card = node('article', `phone-alert ${item.severity || 'info'}${item.read ? '' : ' unread'}`);
      card.dataset.notificationId = item.id;
      const head = node('div', 'phone-alert-head');
      const title = node('strong', '', item.title || 'Kerala Play');
      const created = new Date(Number(item.createdAt || 0));
      const time = document.createElement('time');
      time.textContent = Number.isNaN(created.getTime()) ? '' : created.toLocaleString();
      head.append(title, time);
      const message = node('p', '', item.message || '');
      const actions = node('div', 'phone-alert-actions');
      if (item.target) {
        const open = document.createElement('button');
        open.type = 'button';
        open.dataset.alertTarget = item.target;
        open.dataset.alertId = item.id;
        open.textContent = `Open ${item.target.toUpperCase()}`;
        actions.append(open);
      }
      if (!item.read) {
        const read = document.createElement('button');
        read.type = 'button';
        read.className = 'secondary';
        read.dataset.alertRead = item.id;
        read.textContent = 'Mark read';
        actions.append(read);
      }
      card.append(head, message);
      if (actions.childElementCount) card.append(actions);
      phoneNotifications.append(card);
    }
  }

  async function refreshNotifications() {
    if (!user) return null;
    const summary = await api('/api/notifications');
    renderNotifications(summary);
    return summary;
  }

  function syncNpcRelationships(summary) {
    npcRelationshipsSnapshot = summary || null;
    window.dispatchEvent(new CustomEvent('kerala-npc-relationships-sync', { detail: npcRelationshipsSnapshot }));
    window.dispatchEvent(new CustomEvent('kerala-npc-favor-state', { detail: npcRelationshipsSnapshot?.activeFavor || null }));
  }

  async function refreshNpcRelationships() {
    if (!user) return null;
    const summary = await api('/api/npc/relationships');
    syncNpcRelationships(summary);
    return summary;
  }

  async function markNotificationRead(id, all = false) {
    const summary = await api('/api/notifications/read', all ? { all: true } : { id });
    renderNotifications(summary);
    return summary;
  }

  function openPhone() {
    if (!requireUser()) return;
    showPanel(phonePanel);
    run(refreshNotifications, phoneError);
  }

  function communityEventById(id) {
    const events = [
      eventsSnapshot?.current,
      eventsSnapshot?.upcoming,
      ...(Array.isArray(eventsSnapshot?.recent) ? eventsSnapshot.recent : []),
    ].filter(Boolean);
    return events.find(event => event.id === id) || null;
  }

  function renderCommunityEvents(summary) {
    eventsSnapshot = summary || null;
    window.dispatchEvent(new CustomEvent('kerala-community-events-sync', { detail: eventsSnapshot }));
    if (!eventsList) return;
    eventsList.replaceChildren();
    const current = summary?.current || null;
    const upcoming = summary?.upcoming || null;
    const recent = Array.isArray(summary?.recent) ? summary.recent : [];
    const contribution = Number(summary?.contributions || 0);
    const reputation = summary?.reputation;
    if (eventsSummaryText) {
      eventsSummaryText.textContent = `${contribution} contribution${contribution === 1 ? '' : 's'} · local rep ${Number(reputation?.value || 0)}/100`;
    }

    const appendCard = (event, label) => {
      if (!event) return;
      const card = node('article', `community-event-card ${event.status || ''}`);
      const head = node('div', 'community-event-head');
      const title = node('strong', '', `${event.icon || '📌'} ${event.title || 'Community Event'}`);
      const badge = node('span', 'community-event-status', label);
      head.append(title, badge);
      const description = node('p', '', event.description || '');
      const target = node('small', '', `${event.target?.label || 'Village'} · ₹${Number(event.cashReward || 0)} + ${Number(event.pointsReward || 0)} points`);
      const timing = node('small', 'community-event-time');
      if (event.status === 'active') timing.textContent = `${Math.max(1, Math.ceil(Number(event.secondsRemaining || 0) / 60))} min left`;
      else if (event.status === 'upcoming') timing.textContent = `Starts in ${Math.max(1, Math.ceil(Number(event.secondsUntilStart || 0) / 60))} min`;
      else timing.textContent = event.completed ? 'You participated' : 'Event ended';
      card.append(head, description, target, timing);
      if (event.status === 'active' && !event.completed) {
        const actions = node('div', 'community-event-actions');
        const navigate = button('Navigate', () => {
          window.dispatchEvent(new CustomEvent('kerala-community-event-navigate', { detail: event }));
          closePanels();
        }, 'social-button secondary');
        const participate = button('Join here', () => {
          run(() => participateCommunityEvent(event.id), eventsError);
        }, 'social-button');
        actions.append(navigate, participate);
        card.append(actions);
      }
      eventsList.append(card);
    };

    if (current) appendCard(current, current.status === 'active' ? (current.completed ? 'COMPLETED' : 'NOW') : 'ENDED');
    if (upcoming) appendCard(upcoming, 'UPCOMING');
    for (const event of recent) appendCard(event, event.completed ? 'COMPLETED' : 'RECENT');
    if (!current && !upcoming && !recent.length) eventsList.append(node('p', 'social-empty', 'No community events are scheduled right now.'));
  }

  async function refreshCommunityEvents() {
    if (!user) return null;
    const summary = await api('/api/community/events');
    renderCommunityEvents(summary);
    return summary;
  }

  async function participateCommunityEvent(eventId) {
    if (!user || !eventId) return null;
    const result = await api('/api/community/events/participate', { eventId });
    if (result.wallet) renderWallet(result.wallet);
    if (result.user) setUser(result.user);
    if (result.reputation) {
      syncNpcRelationships({
        ...(npcRelationshipsSnapshot || {}),
        reputation: result.reputation,
      });
    }
    if (result.events) renderCommunityEvents(result.events);
    window.dispatchEvent(new CustomEvent('kerala-community-event-completed', { detail: result }));
    toast(`${result.completed?.title || 'Community event'} complete · +${formatCash(result.completed?.cashReward || 0)} · +${Number(result.completed?.pointsReward || 0)} points`, 4400);
    return result;
  }

  function startEventsTimer() {
    if (eventsTimer) clearInterval(eventsTimer);
    eventsTimer = setInterval(() => {
      if (!eventsPanel?.classList.contains('open')) { clearInterval(eventsTimer); eventsTimer = null; return; }
      run(refreshCommunityEvents, eventsError);
    }, 10000);
  }

  function openEvents() {
    if (!requireUser()) return;
    showPanel(eventsPanel);
    run(refreshCommunityEvents, eventsError).then(() => startEventsTimer());
  }

  function openNotificationTarget(target) {
    if (target === 'wallet') openWallet();
    else if (target === 'home') openHome();
    else if (target === 'garage') openGarage();
    else if (target === 'jobs') openJobs();
    else if (target === 'people') openPeople();
    else if (target === 'groups') { peopleFilter = 'groups'; openPeople(); run(refreshGroups, peopleError); }
    else if (target === 'events') openEvents();
  }

  function renderNeeds(summary) {
    needsSnapshot = summary || null;
    window.dispatchEvent(new CustomEvent('kerala-needs-state', { detail: needsSnapshot }));
  }
  async function refreshNeeds() {
    if (!user) return null;
    const summary = await api('/api/needs');
    renderNeeds(summary);
    return summary;
  }
  function openWallet() {
    if (!requireUser()) return;
    showPanel(walletPanel);
    run(refreshFinance, walletError);
  }

  function lifeLoopSuggestion() {
    const hunger = Number(needsSnapshot?.hunger ?? 100);
    const thirst = Number(needsSnapshot?.thirst ?? 100);
    const energy = Number(needsSnapshot?.energy ?? 100);
    if (thirst <= 25) return 'Next: get water from a village shop';
    if (hunger <= 25) return 'Next: get food from a village shop';
    if (energy <= 25) return 'Next: rest at the bench or sleep at home';
    if (homeSnapshot?.accessBlocked || homeSnapshot?.rentOverdue || homeSnapshot?.utilityOverdue) return 'Next: check HOME bills';
    return 'Next: save, shop, explore or start another job';
  }

  function openWorldShop(detail) {
    if (!requireUser() || !worldShopPanel || !worldShopItems) return;
    const shopId = String(detail?.shopId || '');
    const label = String(detail?.label || 'Village Shop');
    const items = Array.isArray(detail?.items) ? detail.items.filter(id => worldShopCatalog[id]) : [];
    if (!shopId || !items.length) return;
    worldShopContext = {
      shopId,
      label,
      items,
      suggestedItemId: String(detail?.suggestedItemId || ''),
    };
    if (worldShopName) worldShopName.textContent = label;
    if (worldShopNote) worldShopNote.textContent = 'Choose an item. The server confirms that you are still standing near this shop.';
    if (worldShopError) worldShopError.textContent = '';
    worldShopItems.replaceChildren();
    for (const itemId of items) {
      const item = worldShopCatalog[itemId];
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.worldShopItem = itemId;
      const suggested = itemId === worldShopContext.suggestedItemId;
      button.innerHTML = `${item.icon} ${item.name} · ${formatCash(item.price)}<small>${item.effect}${suggested ? ' · Suggested for you' : ''}</small>`;
      if (suggested) button.setAttribute('aria-label', `${item.name}, suggested, ${formatCash(item.price)}`);
      worldShopItems.append(button);
    }
    showPanel(worldShopPanel);
  }

  function homeDueText(timestamp, overdue) {
    const date = new Date(Number(timestamp));
    const label = Number.isNaN(date.getTime()) ? 'Due date unavailable' : date.toLocaleString();
    return overdue ? `OVERDUE · ${label}` : `Due ${label}`;
  }

  function renderHome(summary) {
    homeSnapshot = summary || null;
    window.dispatchEvent(new CustomEvent('kerala-home-state', { detail: homeSnapshot }));
    if (!summary) return;
    if (homeSummaryCard) {
      homeSummaryCard.classList.toggle('overdue', !!(summary.rentOverdue || summary.utilityOverdue));
      homeSummaryCard.classList.toggle('blocked', !!summary.accessBlocked);
      const title = homeSummaryCard.querySelector('strong');
      const status = homeSummaryCard.querySelector('span');
      if (title) title.textContent = summary.home?.label || 'Village Rental Home';
      if (status) status.textContent = summary.reminder || 'Home payments are up to date.';
    }
    if (homeRentStatus) {
      homeRentStatus.textContent = `${formatCash(summary.home?.rent || 0)} · ${homeDueText(summary.rentDueAt, summary.rentOverdue)}`;
      homeRentStatus.classList.toggle('overdue', !!summary.rentOverdue);
    }
    if (homeUtilityStatus) {
      homeUtilityStatus.textContent = `${formatCash(summary.home?.utilities || 0)} · ${homeDueText(summary.utilityDueAt, summary.utilityOverdue)}`;
      homeUtilityStatus.classList.toggle('overdue', !!summary.utilityOverdue);
    }
    if (homePayRent) homePayRent.textContent = `Pay Rent · ${formatCash(summary.home?.rent || 0)}`;
    if (homePayUtilities) homePayUtilities.textContent = `Pay Utilities · ${formatCash(summary.home?.utilities || 0)}`;
    if (homeSleepNote) {
      homeSleepNote.textContent = summary.accessBlocked
        ? 'Sleep access is paused after the grace period. Pay overdue home charges to restore access.'
        : 'Go to your home porch in the world and tap SLEEP. Energy restores to 100; Hunger −4 and Thirst −6.';
    }
  }

  async function refreshHome() {
    if (!user) return null;
    const summary = await api('/api/home');
    renderHome(summary);
    return summary;
  }

  function openHome() {
    if (!requireUser()) return;
    showPanel(homePanel);
    run(refreshHome, homeError);
  }
  function renderProgression(summary) {
    progressionSnapshot = summary?.recognition || null;
    if (!progressionSnapshot) return;
    if (progressionTitle) progressionTitle.textContent = progressionSnapshot.title || 'Newcomer';
    if (progressionSummary) progressionSummary.textContent = `${progressionSnapshot.unlockedCount || 0} of ${progressionSnapshot.totalCount || 0} achievements unlocked`;
    progressionAchievements?.replaceChildren();
    for (const achievement of progressionSnapshot.achievements || []) {
      const card = node('article', `progression-achievement${achievement.unlocked ? ' unlocked' : ''}`);
      const head = node('div', 'progression-row');
      head.append(node('strong', '', `${achievement.unlocked ? '✓' : '○'} ${achievement.title}`), node('span', '', achievement.unlocked ? achievement.badge : `${achievement.progress}/${achievement.threshold}`));
      if (achievement.unlocked) {
        const useTitle = button(progressionSnapshot.title === achievement.badge ? 'Using title' : 'Use title', () => run(() => selectProgressionTitle(achievement.badge), progressionError), 'progression-title-action');
        useTitle.disabled = progressionSnapshot.title === achievement.badge;
        card.append(useTitle);
      }
      const meter = document.createElement('progress');
      meter.max = Math.max(1, Number(achievement.threshold || 1));
      meter.value = Math.min(meter.max, Number(achievement.progress || 0));
      card.append(head, meter);
      progressionAchievements?.append(card);
    }
  }

  function renderLeaderboardCategories(categories) {
    leaderboardCategoriesSnapshot = Array.isArray(categories) ? categories : [];
    progressionCategories?.replaceChildren();
    for (const category of leaderboardCategoriesSnapshot) {
      const item = button(category.label, () => run(() => refreshLeaderboard(category.id), progressionError), 'progression-category');
      item.classList.toggle('active', category.id === activeLeaderboardCategory);
      item.dataset.category = category.id;
      progressionCategories?.append(item);
    }
  }

  function renderLeaderboard(board) {
    if (!progressionLeaderboard) return;
    progressionLeaderboard.replaceChildren();
    const entries = Array.isArray(board?.entries) ? board.entries : [];
    if (!entries.length) {
      progressionLeaderboard.append(node('p', 'social-empty', 'No ranked activity yet. Complete world activities to appear here.'));
      return;
    }
    for (const entry of entries) {
      const row = node('article', 'leaderboard-entry');
      row.append(node('strong', 'leaderboard-rank', `#${entry.rank}`), node('span', 'leaderboard-player', entry.username ? `@${entry.username}` : entry.name), node('b', 'leaderboard-score', String(entry.score)));
      progressionLeaderboard.append(row);
    }
  }

  async function selectProgressionTitle(title) {
    const result = await api('/api/progression/title', { title });
    renderProgression(result);
    toast(`${result.recognition.title} is now your profile title`);
    return result;
  }

  async function refreshLeaderboard(categoryId = activeLeaderboardCategory) {
    activeLeaderboardCategory = leaderboardCategoriesSnapshot.some(item => item.id === categoryId) ? categoryId : (leaderboardCategoriesSnapshot[0]?.id || 'jobs');
    progressionCategories?.querySelectorAll('[data-category]').forEach(item => item.classList.toggle('active', item.dataset.category === activeLeaderboardCategory));
    const board = await api(`/api/leaderboards/${encodeURIComponent(activeLeaderboardCategory)}`);
    renderLeaderboard(board);
    return board;
  }

  async function refreshProgression() {
    if (!user) return null;
    const [summary, categories] = await Promise.all([api('/api/progression'), api('/api/leaderboards')]);
    renderProgression(summary);
    renderLeaderboardCategories(categories.categories || []);
    await refreshLeaderboard(activeLeaderboardCategory);
    return summary;
  }

  function openProgression() {
    if (!requireUser()) return;
    showPanel(progressionPanel);
    run(refreshProgression, progressionError);
  }

  function insuranceLabel(vehicle) {
    if (!vehicle?.insuranceActive) return 'Insurance expired';
    const days = Math.max(1, Math.ceil(Number(vehicle.insuranceRemainingMs || 0) / 86400000));
    return `Insurance ${days}d`;
  }

  function renderUsedMarket(market) {
    garageMarketSnapshot = market || { listings: [] };
    if (!garageMarket) return;
    garageMarket.replaceChildren();
    const listings = Array.isArray(market?.listings) ? market.listings : [];
    if (!listings.length) {
      garageMarket.append(node('p', 'social-empty', 'No used vehicles are listed right now.'));
      return;
    }
    for (const listing of listings) {
      const card = node('article', 'market-card');
      const head = node('div', 'garage-card-head');
      head.append(node('h3', '', listing.label), node('span', 'garage-price', formatCash(listing.price)));
      const registration = node('span', 'garage-registration', listing.registration || 'KL');
      const info = node('p', '', `${listing.sellerName} · ${Math.round(Number(listing.condition || 0))}% condition · Fuel ${Math.round(Number(listing.fuel || 0))}%`);
      const insurance = node('p', listing.insuranceActive ? 'garage-insurance-ok' : 'garage-insurance-expired', insuranceLabel(listing));
      const actions = node('div', 'garage-actions');
      const buy = document.createElement('button');
      buy.type = 'button';
      buy.dataset.marketBuy = listing.vehicleId;
      buy.disabled = !!listing.ownListing;
      buy.textContent = listing.ownListing ? 'Your listing' : `Buy used · ${formatCash(listing.price)}`;
      actions.append(buy);
      card.append(head, registration, info, insurance, actions);
      garageMarket.append(card);
    }
  }

  function renderTraffic(summary) {
    trafficSnapshot = summary || null;
    window.dispatchEvent(new CustomEvent('kerala-traffic-state', { detail: trafficSnapshot }));
    if (trafficCheckpointNote) {
      const unpaid = Number(summary?.unpaidCount || 0);
      const total = Number(summary?.unpaidTotal || 0);
      trafficCheckpointNote.textContent = unpaid
        ? `Kerala Play in-game rules · ${unpaid} unpaid challan${unpaid === 1 ? '' : 's'} · ${formatCash(total)} total`
        : 'Kerala Play in-game rules · no unpaid challans';
    }

    if (trafficDocuments) {
      trafficDocuments.replaceChildren();
      const licence = summary?.licence || null;
      const licenceCard = node('article', `traffic-doc-card driving-licence-card${licence?.active ? '' : ' invalid'}`);
      const licenceTop = node('div', 'traffic-challan-row');
      licenceTop.append(node('strong', '', 'Driving Licence'), node('span', 'garage-registration', licence?.number || 'NOT ISSUED'));
      const licenceStatus = node('p', licence?.active ? 'valid' : 'expired', licence?.active
        ? `${licence.label} · ${Math.max(1, Math.ceil(Number(licence.remainingMs || 0) / 86400000))}d remaining`
        : (licence?.type && licence.type !== 'none' ? `${licence.label} · Expired` : 'No driving licence'));
      const licenceClass = node('p', '', licence?.active
        ? `Allowed: ${(licence.allowedKinds || []).includes('taxi') ? 'Bike + Car' : 'Bike only'} · Holder: ${licence.holderName || ''}`
        : 'Learner Permit is valid for bike; Full Licence is valid for bike + car.');
      const licenceActions = node('div', 'licence-actions');
      if (licence?.canApplyLearner) {
        const apply = document.createElement('button');
        apply.type = 'button'; apply.dataset.licenceAction = 'learner'; apply.textContent = 'Apply Learner · FREE';
        licenceActions.append(apply);
      } else {
        if (licence?.canUpgradeFull) {
          const upgrade = document.createElement('button');
          upgrade.type = 'button'; upgrade.dataset.licenceAction = 'full'; upgrade.textContent = `Upgrade Full · ${formatCash(licence.costs?.full || 0)}`;
          licenceActions.append(upgrade);
        }
        if (licence?.canRenew) {
          const renew = document.createElement('button');
          renew.type = 'button'; renew.dataset.licenceAction = 'renew';
          const renewalCost = licence.type === 'full' ? licence.costs?.renew_full : licence.costs?.renew_learner;
          renew.textContent = `Renew ${licence.type === 'full' ? 'Full' : 'Learner'} · ${formatCash(renewalCost || 0)}`;
          licenceActions.append(renew);
        }
      }
      licenceCard.append(licenceTop, licenceStatus, licenceClass, licenceActions);
      trafficDocuments.append(licenceCard);

      const documents = Array.isArray(summary?.documents) ? summary.documents : [];
      if (!documents.length) trafficDocuments.append(node('p', 'social-empty', 'Buy a personal vehicle to create RC and insurance documents.'));
      for (const document of documents) {
        const card = node('article', 'traffic-doc-card');
        const top = node('div', 'traffic-challan-row');
        top.append(node('strong', '', document.label), node('span', 'garage-registration', document.registration || 'KL'));
        const rc = node('p', 'valid', 'RC · Valid');
        const insurance = node('p', document.insuranceActive ? 'valid' : 'expired', document.insuranceActive ? insuranceLabel(document) : 'Insurance · Expired');
        card.append(top, rc, insurance);
        trafficDocuments.append(card);
      }
    }

    if (trafficChallans) {
      trafficChallans.replaceChildren();
      const challans = Array.isArray(summary?.challans) ? summary.challans : [];
      if (!challans.length) trafficChallans.append(node('p', 'social-empty', 'No traffic challans.'));
      for (const challan of challans.slice(0, 20)) {
        const card = node('article', `traffic-challan-card ${challan.paid ? 'paid' : 'unpaid'}`);
        const row = node('div', 'traffic-challan-row');
        row.append(node('strong', '', challan.description || 'Traffic challan'), node('span', 'garage-price', formatCash(challan.amount)));
        const detail = node('p', '', `${challan.registration || ''} · ${challan.paid ? 'Paid' : 'Unpaid'} · ${new Date(Number(challan.createdAt)).toLocaleString()}`);
        card.append(row, detail);
        if (!challan.paid) {
          const pay = document.createElement('button');
          pay.type = 'button';
          pay.dataset.payChallan = challan.id;
          pay.textContent = `Pay challan · ${formatCash(challan.amount)}`;
          card.append(pay);
        }
        trafficChallans.append(card);
      }
    }
  }

  async function refreshTraffic() {
    if (!user) return null;
    const summary = await api('/api/traffic');
    renderTraffic(summary);
    return summary;
  }

  function renderGarage(summary) {
    garageSnapshot = summary || null;
    window.dispatchEvent(new CustomEvent('kerala-garage-state', { detail: garageSnapshot }));
    if (garageSummaryLabel) {
      const ownedCount = Array.isArray(summary?.owned) ? summary.owned.length : 0;
      garageSummaryLabel.textContent = `${ownedCount} owned · ${summary?.activeVehicle ? (summary.activeVehicle.entered ? 'driving now' : 'vehicle outside') : 'all stored'}`;
    }

    if (garageList) {
      garageList.replaceChildren();
      const owned = Array.isArray(summary?.owned) ? summary.owned : [];
      if (!owned.length) garageList.append(node('p', 'social-empty', 'No personal vehicles yet. Buy your first vehicle from the showroom below.'));
      for (const vehicle of owned) {
        const card = node('article', `garage-card${vehicle.selected ? ' selected' : ''}${vehicle.active ? ' active' : ''}${vehicle.forSale ? ' listed' : ''}`);
        const head = node('div', 'garage-card-head');
        const status = vehicle.forSale
          ? `FOR SALE · ${formatCash(vehicle.salePrice)}`
          : vehicle.active
            ? (vehicle.entered ? 'DRIVING' : 'OUTSIDE')
            : (vehicle.selected ? 'SELECTED' : 'OWNED');
        head.append(node('h3', '', vehicle.label), node('span', 'garage-price', status));
        const registration = node('span', 'garage-registration', vehicle.registration || 'KL');
        const meta = node('div', 'garage-meta');
        meta.append(
          node('span', '', vehicle.kind === 'bike' ? '🏍 Bike' : '🚘 Car'),
          node('span', '', `Fuel ${Math.round(Number(vehicle.fuel ?? 100))}%`),
          node('span', '', `Condition ${Math.round(Number(vehicle.condition ?? 100))}%`),
          node('span', '', `Resale ${formatCash(vehicle.resaleValue)}`),
          node('span', vehicle.insuranceActive ? 'garage-insurance-ok' : 'garage-insurance-expired', insuranceLabel(vehicle)),
        );

        const actions = node('div', 'garage-actions');
        if (vehicle.forSale) {
          const unlist = button('Remove listing', async () => {}, 'secondary');
          unlist.dataset.marketAction = 'unlist';
          unlist.dataset.vehicleId = vehicle.id;
          actions.append(unlist);
        } else if (vehicle.active) {
          const activeButton = button(vehicle.entered ? 'Driving now' : 'Store in garage', async () => {}, vehicle.entered ? 'secondary' : 'danger');
          activeButton.dataset.garageAction = vehicle.entered ? 'none' : 'store';
          activeButton.dataset.vehicleId = vehicle.id;
          activeButton.disabled = !!vehicle.entered;
          actions.append(activeButton);
        } else if (vehicle.selected) {
          const retrieve = button('Retrieve vehicle', async () => {}, '');
          retrieve.dataset.garageAction = 'retrieve';
          retrieve.dataset.vehicleId = vehicle.id;
          retrieve.disabled = !!summary?.activeVehicleId;
          actions.append(retrieve);
        } else {
          const selectVehicle = button('Select', async () => {}, 'secondary');
          selectVehicle.dataset.garageAction = 'select';
          selectVehicle.dataset.vehicleId = vehicle.id;
          selectVehicle.disabled = !!summary?.activeVehicleId;
          actions.append(selectVehicle);
        }

        const ownershipActions = node('div', 'garage-actions');
        const insurance = button(`Renew insurance · ${formatCash(vehicle.insuranceRenewalCost)}`, async () => {}, 'secondary');
        insurance.dataset.insuranceVehicle = vehicle.id;
        ownershipActions.append(insurance);
        if (!vehicle.forSale) {
          const sell = button(vehicle.active ? 'Store before selling' : `List for sale · ${formatCash(vehicle.resaleValue)}`, async () => {}, 'danger');
          sell.dataset.marketAction = 'list';
          sell.dataset.vehicleId = vehicle.id;
          sell.disabled = !!vehicle.active;
          ownershipActions.append(sell);
        }

        card.append(head, registration, meta, actions, ownershipActions);
        garageList.append(card);
      }
    }

    if (garageCatalog) {
      garageCatalog.replaceChildren();
      const catalog = Array.isArray(summary?.catalog) ? summary.catalog : [];
      for (const model of catalog) {
        const card = node('article', 'garage-card');
        const head = node('div', 'garage-card-head');
        head.append(node('h3', '', model.label), node('span', 'garage-price', formatCash(model.price)));
        const description = node('p', '', model.description || '');
        const buy = document.createElement('button');
        buy.type = 'button';
        buy.dataset.buyModel = model.id;
        buy.disabled = !!model.owned;
        buy.textContent = model.owned ? 'Already owned' : `Buy new · ${formatCash(model.price)}`;
        card.append(head, description, buy);
        garageCatalog.append(card);
      }
    }
  }

  async function refreshGarage() {
    if (!user) return null;
    const [summary, market, traffic] = await Promise.all([api('/api/garage'), api('/api/garage/market'), api('/api/traffic')]);
    renderGarage(summary);
    renderUsedMarket(market);
    renderTraffic(traffic);
    return summary;
  }
  function openGarage() {
    if (!requireUser()) return;
    showPanel(garagePanel);
    run(refreshGarage, garageError);
  }
  function secondsRemaining(timestamp) { return Math.max(0, Math.ceil((Number(timestamp || 0) - Date.now()) / 1000)); }
  function renderJobs(summary) {
    jobsSnapshot = summary || null;
    window.dispatchEvent(new CustomEvent('kerala-job-mission', { detail: summary?.active || null }));
    if (!jobsList) return;
    jobsList.replaceChildren();
    const jobs = Array.isArray(summary?.jobs) ? summary.jobs : [];
    if (!jobs.length) { jobsList.append(node('p', 'social-empty', 'No jobs available.')); return; }
    const active = summary?.active || null;
    for (const job of jobs) {
      const isActive = active?.jobId === job.id;
      const card = node('article', `job-card${isActive ? ' active' : ''}`);
      const head = node('div', 'job-card-head');
      head.append(node('h3', '', job.title), node('span', 'job-pay', `+${formatCash(job.reward)}`));
      const meta = node('div', 'job-meta');
      const missionLabel = job.missionType === 'shift' ? `On-site ${Math.ceil(Number(job.durationMs || 0) / 1000)}s` : 'World route';
      meta.append(node('span', '', missionLabel), node('span', '', `Completed ${Number(job.completedCount || 0)}`));
      if (isActive && active?.vehicle) {
        meta.append(node('span', '', `Fuel ${Math.round(Number(active.vehicle.fuel ?? 100))}%`), node('span', '', `Condition ${Math.round(Number(active.vehicle.condition ?? 100))}%`));
      }
      const action = document.createElement('button');
      action.type = 'button'; action.dataset.jobId = job.id;
      let missionNote = null;
      if (isActive) {
        action.dataset.taskId = active.taskId;
        if (active.phase === 'travel' && active.target) {
          const distance = Math.max(0, Math.ceil(Number(active.target.distance || 0)));
          if (active.vehicle && !active.vehicle.entered) {
            const vehicleDistance = Math.max(0, Math.ceil(Number(active.vehicle.distance || 0)));
            missionNote = node('p', 'job-mission-note', `${active.vehicle.label} · ${vehicleDistance} m away · enter the vehicle in the world`);
            action.dataset.jobAction = 'checkpoint';
            action.disabled = true;
            action.textContent = `Enter ${active.vehicle.kind === 'bike' ? 'bike' : 'taxi'} first`;
          } else {
            missionNote = node('p', 'job-mission-note', `${active.target.action} · ${active.target.name} · ${distance} m away`);
            action.dataset.jobAction = 'checkpoint';
            action.disabled = !active.target.withinRange;
            action.textContent = active.target.withinRange ? `Check in · ${active.target.action}` : `Go to ${active.target.name} · ${distance} m`;
          }
        } else if (active.phase === 'working') {
          const wait = secondsRemaining(active.readyAt);
          missionNote = node('p', 'job-mission-note', `Checked in at ${active.target?.name || 'Village Shop'} · stay nearby until the shift ends`);
          action.dataset.jobAction = 'complete';
          action.disabled = wait > 0;
          action.textContent = wait > 0 ? `Working… ${wait}s` : `Complete shift · +${formatCash(job.reward)}`;
          if (!wait) action.classList.add('complete-ready');
        } else {
          missionNote = node('p', 'job-mission-note', 'All route checkpoints complete. Salary is ready to claim.');
          action.dataset.jobAction = 'complete';
          action.textContent = `Complete job · +${formatCash(job.reward)}`;
          action.classList.add('complete-ready');
        }
      } else if (active) {
        action.disabled = true; action.textContent = 'Another job is active';
      } else {
        const cooldown = secondsRemaining(job.cooldownUntil);
        action.dataset.jobAction = 'start'; action.disabled = cooldown > 0;
        action.textContent = cooldown > 0 ? `Cooldown · ${cooldown}s` : 'Start mission';
      }
      card.append(head, node('p', '', job.description || ''), meta);
      if (missionNote) card.append(missionNote);
      card.append(action);
      jobsList.append(card);
    }
  }
  async function refreshJobs() {
    if (!user) return null;
    const summary = await api('/api/jobs');
    renderJobs(summary);
    return summary;
  }
  async function performWorldJobInteraction() {
    const active = jobsSnapshot?.active;
    if (!user || !active) return;
    if (active.phase === 'travel') {
      const result = await api(`/api/jobs/${encodeURIComponent(active.jobId)}/checkpoint`, { taskId: active.taskId });
      renderJobs(result.jobs);
      toast(`${result.checkpoint.action} complete · next mission step ready`);
      return;
    }
    if (active.phase === 'working') {
      const wait = secondsRemaining(active.readyAt);
      if (wait > 0) { toast(`Shift in progress · ${wait}s remaining`); return; }
    }
    if (active.phase === 'working' || active.phase === 'ready') {
      const result = await api(`/api/jobs/${encodeURIComponent(active.jobId)}/complete`, { taskId: active.taskId });
      renderJobs(result.jobs);
      renderWallet(result.wallet);
      await Promise.all([refreshNeeds().catch(() => null), refreshHome().catch(() => null)]);
      toast(`${result.completed.title} salary credited · ${formatCash(result.reward)} · ${lifeLoopSuggestion()}`);
    }
  }
  window.addEventListener('kerala-job-interact', () => run(performWorldJobInteraction));

  async function performJobVehicleAction(action) {
    const active = jobsSnapshot?.active;
    if (!user || !active?.vehicle || !['enter', 'exit'].includes(action)) return;
    const result = await api(`/api/jobs/${encodeURIComponent(active.jobId)}/vehicle`, { taskId: active.taskId, action });
    renderJobs(result.jobs);
    toast(action === 'enter' ? `${active.vehicle.label} ready · drive to the mission marker` : `${active.vehicle.label} parked`);
  }
  window.addEventListener('kerala-job-vehicle', event => run(() => performJobVehicleAction(event.detail?.action)));

  async function performPersonalVehicleAction(action) {
    if (!user || !['enter', 'exit'].includes(action)) return;
    const active = garageSnapshot?.activeVehicle;
    if (!active) return;
    const result = await api('/api/garage/vehicle', { action, vehicleId: active.vehicleId });
    renderGarage(result.garage);
    toast(action === 'enter' ? `${active.label} ready · personal driving active` : `${active.label} parked`);
  }
  window.addEventListener('kerala-personal-vehicle', event => run(() => performPersonalVehicleAction(event.detail?.action), garageError));
  window.addEventListener('kerala-garage-state-local', event => { if (event.detail) renderGarage(event.detail); });

  async function performVehicleService(action, source = 'job') {
    if (!user || !['refuel', 'repair'].includes(action)) return;
    let result;
    if (source === 'personal') {
      const active = garageSnapshot?.activeVehicle;
      if (!active) return;
      result = await api('/api/garage/vehicle/service', { vehicleId: active.vehicleId, action });
      renderGarage(result.garage);
    } else {
      const active = jobsSnapshot?.active;
      if (!active?.vehicle) return;
      result = await api(`/api/jobs/${encodeURIComponent(active.jobId)}/vehicle/service`, { taskId: active.taskId, action });
      renderJobs(result.jobs);
    }
    renderWallet(result.wallet);
    const service = result.service;
    toast(action === 'refuel'
      ? `Fuel tank full · ${formatCash(service.cost)} paid`
      : `Vehicle repaired · condition 100% · ${formatCash(service.cost)} paid`);
  }
  window.addEventListener('kerala-vehicle-service', event => run(() => performVehicleService(event.detail?.action, event.detail?.source || 'job')));

  function startJobsTimer() {
    if (jobsTimer) clearInterval(jobsTimer);
    jobsTimer = setInterval(() => {
      if (!jobsPanel?.classList.contains('open')) { clearInterval(jobsTimer); jobsTimer = null; return; }
      run(refreshJobs, jobsError);
    }, 1500);
  }
  function openJobs() {
    if (!requireUser()) return;
    showPanel(jobsPanel);
    run(refreshJobs, jobsError).then(() => startJobsTimer());
  }
  function openPeople() {
    if (!requireUser()) return;
    closeProfile(); closeGroup(); showPanel(peoplePanel);
    run(refreshPeople, peopleError);
    if (peopleFilter === 'groups') run(refreshGroups, peopleError);
    else search.focus();
  }
  window.addEventListener('kerala-open-blocked', () => {
    if (!requireUser()) return;
    peopleFilter = 'blocked';
    closeProfile(); showPanel(peoplePanel);
    run(refreshPeople, peopleError);
  });
  function openChat() {
    if (!requireUser()) return;
    closeProfile(); showPanel(chatPanel);
    run(refreshPeople, peopleError);
  }
  function closeGroup() {
    if (groupModal.hidden) return;
    groupModal.hidden = true;
    activeGroupId = null;
    groupMessageVersion++;
    if (groupReturnFocus?.isConnected) groupReturnFocus.focus();
  }
  async function openGroup(id, preserveFocus = false) {
    if (!requireUser()) return;
    if (!preserveFocus) groupReturnFocus = document.activeElement;
    activeGroupId = id;
    const version = ++groupMessageVersion;
    groupModal.hidden = false;
    groupCard.replaceChildren(node('p', 'social-muted', 'Loading group…'));
    await run(async () => {
      const result = await api(`/api/groups/${encodeURIComponent(id)}/messages`);
      if (groupModal.hidden || version !== groupMessageVersion) return;
      const group = result.group;
      const header = node('div', 'social-profile-header');
      const title = node('h2', '', group.name); title.id = 'social-group-title';
      const close = button('×', closeGroup, 'panel-close'); close.setAttribute('aria-label', 'Close group');
      header.append(node('span', 'social-avatar group-avatar', group.name.slice(0, 1).toUpperCase()), title, close);

      const members = node('div', 'group-members');
      members.append(node('strong', '', `Members · ${group.memberCount}`));
      for (const member of group.members || []) {
        const row = node('div', 'group-member-row');
        row.append(node('span', '', member.blocked ? 'Hidden member' : member.username), node('small', 'social-muted', `${member.owner ? 'Owner · ' : ''}${member.online ? '● Online' : 'Offline'}`));
        members.append(row);
      }

      const recognition = result.recognition;
      const recognitionBox = node('section', 'profile-recognition');
      if (recognition) {
        recognitionBox.append(node('strong', 'profile-recognition-title', `🏆 ${recognition.title || 'Newcomer'}`));
        const unlocked = (recognition.achievements || []).filter(item => item.unlocked);
        recognitionBox.append(node('small', 'social-muted', `${Number(recognition.unlockedCount || 0)}/${Number(recognition.totalCount || 0)} achievements unlocked`));
        if (unlocked.length) {
          const badges = node('div', 'profile-badges');
          for (const item of unlocked.slice(0, 4)) badges.append(node('span', 'profile-badge', `${item.badge} ${item.title}`));
          recognitionBox.append(badges);
        }
      }
      const error = node('div', 'social-error'); error.setAttribute('role', 'status');
      const inviteBox = node('div', 'group-invite-box');
      if (group.isOwner) {
        const existing = new Set((group.members || []).map(member => member.id));
        const candidates = people.filter(person => canMessage(person) && !person.blocked && !existing.has(person.id));
        if (candidates.length && group.memberCount + Number(group.inviteCount || 0) < Number(groupsSnapshot.limits?.membersPerGroup || 12)) {
          const inviteForm = node('form', 'social-form');
          const inviteSelect = select(candidates.map(person => [person.id, person.username]), candidates[0]?.id);
          const inviteButton = node('button', 'social-button secondary', 'Invite contact'); inviteButton.type = 'submit';
          inviteForm.append(field('Invite an accepted contact', inviteSelect), inviteButton);
          inviteForm.addEventListener('submit', async event => {
            event.preventDefault(); inviteButton.disabled = true;
            await run(async () => {
              await api(`/api/groups/${encodeURIComponent(group.id)}/invite`, { peerId: inviteSelect.value });
              toast('Group invitation sent');
              await refreshGroups();
              await openGroup(group.id, true);
            }, error);
            inviteButton.disabled = false;
          });
          inviteBox.append(inviteForm);
        } else inviteBox.append(node('p', 'social-muted', 'No eligible accepted contacts to invite right now.'));
      }

      const log = node('div', 'group-message-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite');
      const messages = result.messages || [];
      if (!messages.length) log.append(node('p', 'social-empty', 'No group messages yet.'));
      for (const message of messages) {
        const bubble = node('div', `group-message ${message.own ? 'own' : ''}`);
        const created = new Date(message.createdAt);
        bubble.append(node('strong', '', message.own ? 'You' : message.fromName), node('span', '', message.body), node('small', 'social-muted', Number.isNaN(created.getTime()) ? '' : created.toLocaleString()));
        log.append(bubble);
      }

      const form = node('form', 'group-message-form');
      const messageInput = input('text', { placeholder: 'Message the group', maxLength: 240, required: true, autocomplete: 'off' });
      const send = node('button', 'social-button primary', 'Send'); send.type = 'submit';
      form.append(messageInput, send);
      form.addEventListener('submit', async event => {
        event.preventDefault();
        const body = messageInput.value.trim(); if (!body) return;
        send.disabled = true;
        await run(async () => {
          await api(`/api/groups/${encodeURIComponent(group.id)}/messages`, { body });
          messageInput.value = '';
          await openGroup(group.id, true);
        }, error);
        send.disabled = false;
      });

      const leave = button(group.isOwner && group.memberCount === 1 ? 'Delete group' : 'Leave group', () => run(async () => {
        await api(`/api/groups/${encodeURIComponent(group.id)}/leave`, {});
        closeGroup();
        await refreshGroups();
        toast(group.isOwner && group.memberCount === 1 ? 'Group deleted' : 'You left the group');
      }, error), 'social-button danger');
      const actions = node('div', 'social-actions'); actions.append(leave);
      groupCard.replaceChildren(header, node('p', 'social-muted', group.isOwner ? 'You own this group. Invite accepted contacts and chat together.' : 'Private group for members.'), members, inviteBox, node('strong', 'group-section-title', 'Group chat'), log, form, actions, error);
      if (!preserveFocus) close.focus();
    }, null);
    if (version === groupMessageVersion && !groupCard.querySelector('#social-group-title')) {
      groupCard.replaceChildren(node('p', 'social-error', 'Could not load this group. Please try again.'), button('Close', closeGroup));
    }
  }
  function closeProfile() {
    if (profileModal.hidden) return;
    profileModal.hidden = true;
    profileVersion++;
    if (profileReturnFocus?.isConnected) profileReturnFocus.focus();
  }
  async function openProfile(id = user?.id, preserveFocus = false) {
    if (!requireUser()) return;
    cancelRecording(); stopTalking();
    if (!preserveFocus) profileReturnFocus = document.activeElement;
    profileId = id || user.id;
    const version = ++profileVersion;
    profileModal.hidden = false;
    onOpenProfile(profileId);
    profileCard.replaceChildren(node('p', 'social-muted', 'Loading profile…'));
    await run(async () => {
      const result = profileId === user.id ? { user, ...(await api('/api/progression')) } : await api(`/api/profile/${encodeURIComponent(profileId)}`);
      if (profileModal.hidden || version !== profileVersion) return;
      const person = { ...result.user, relationship: result.relationship || result.user.relationship, blocked: result.blocked || result.user.blocked, canMessage: result.canMessage ?? result.user.canMessage };
      const own = person.id === user.id;
      const header = node('div', 'social-profile-header');
      const title = node('h2', '', person.name || person.username);
      title.id = 'social-profile-title';
      const close = button('×', closeProfile, 'panel-close'); close.setAttribute('aria-label', 'Close profile');
      header.append(avatar(person), title, close);
      if (person.blocked) {
        profileCard.replaceChildren(header, node('p', 'social-muted', 'This account is blocked. Unblock to allow a new follow request.'), relationshipButtons(person));
        if (!preserveFocus) close.focus();
        return;
      }
      const stats = node('div', 'social-stats');
      for (const [value, label] of [[person.points || 0, 'points'], [person.level || 1, 'level'], [Array.isArray(person.followers) ? person.followers.length : person.followers || 0, 'followers'], [Array.isArray(person.following) ? person.following.length : person.following || 0, 'following']]) {
        const stat = node('div'); stat.append(node('strong', '', String(value)), node('small', '', label)); stats.append(stat);
      }
      const recognition = result.recognition || null;
      const recognitionBox = node('section', 'profile-recognition');
      if (recognition) {
        recognitionBox.append(node('strong', 'profile-recognition-title', `🏆 ${recognition.title || 'Newcomer'}`));
        recognitionBox.append(node('small', 'social-muted', `${Number(recognition.unlockedCount || 0)}/${Number(recognition.totalCount || 0)} achievements unlocked`));
        const unlocked = (recognition.achievements || []).filter(item => item.unlocked);
        if (unlocked.length) {
          const badges = node('div', 'profile-badges');
          for (const item of unlocked.slice(0, 4)) badges.append(node('span', 'profile-badge', `${item.badge} ${item.title}`));
          recognitionBox.append(badges);
        }
      }
      const error = node('div', 'social-error'); error.setAttribute('role', 'status');
      profileCard.replaceChildren(header, node('p', 'social-muted', `${person.district || 'Kerala'} · ${person.gender === 'female' ? 'Female' : 'Male'} avatar`), stats);
      if (recognition) profileCard.append(recognitionBox);
      if (own) {
        const editActions = node('div', 'social-actions profile-view-actions');
        const edit = button('Edit profile', () => renderOwnProfile(true), 'social-button primary profile-edit-button');
        edit.setAttribute('aria-label', 'Edit your profile');
        const logout = button('Log out', async () => {
          if (!window.confirm('Log out of Kerala Play?')) return;
          logout.disabled = true;
          edit.disabled = true;
          await run(async () => {
            await api('/api/auth/logout', {});
            endSession('You have been logged out.');
          }, error);
          logout.disabled = false;
          edit.disabled = false;
        }, 'social-button danger profile-logout-button');
        logout.setAttribute('aria-label', 'Log out of Kerala Play');
        editActions.append(edit, logout);
        profileCard.append(node('p', 'social-bio', person.bio || 'This explorer has not added a bio yet.'), editActions);
        function renderOwnProfile(editing) {
          if (!editing) return;
          const form = node('form', 'social-form');
          const displayName = input('text', { value: person.name || person.username, maxLength: 40, required: true, autocomplete: 'given-name' });
          const accountUsername = input('text', { value: person.accountUsername || person.username, maxLength: 24, required: true, pattern: '(?=.*[A-Za-z])[A-Za-z0-9_]{3,24}', autocomplete: 'username', spellcheck: false });
          const usernameLockedUntil = Number(person.usernameChangeAvailableAt || 0);
          const usernameLocked = usernameLockedUntil > Date.now();
          accountUsername.disabled = usernameLocked;
          const usernameNote = node('small', 'social-muted', usernameLocked ? `Username can be changed again in ${Math.ceil((usernameLockedUntil - Date.now()) / 86400000)} days.` : 'Username changes are limited to once every 10 days.');
          const district = select(districts, person.district);
          const gender = select([['male', 'Male'], ['female', 'Female'], ['other', 'Other']], person.gender);
          const row = node('div', 'social-fields-row'); row.append(field('Name', displayName), field('District', district));
          const identityRow = node('div', 'social-fields-row'); identityRow.append(field('Username', accountUsername), field('Avatar', gender));
          const bio = node('textarea'); bio.value = person.bio || ''; bio.maxLength = 180; bio.rows = 3;
          bio.placeholder = 'Tell people a little about yourself';
          const save = node('button', 'social-button primary', 'Save changes'); save.type = 'submit';
          const cancel = button('Cancel', () => openProfile(person.id, true), 'social-button secondary');
          const actions = node('div', 'social-actions profile-edit-actions'); actions.append(save, cancel);
          form.append(node('p', 'social-muted', 'Update the details other players see. Username changes are limited to once every 10 days.'), row, identityRow, usernameNote, field('About you', bio), actions);
          form.addEventListener('submit', async event => { event.preventDefault(); save.disabled = true; cancel.disabled = true; await run(async () => { const response = await api('/api/profile', { displayName: displayName.value.trim(), username: accountUsername.value.trim(), district: district.value, gender: gender.value, bio: bio.value.trim() }, 'PATCH'); if (response.user) setUser(response.user); else await refreshUser(); toast('Profile saved'); await openProfile(person.id, true); }, error); save.disabled = false; cancel.disabled = false; });
          profileCard.replaceChildren(header, form, error);
          district.focus();
        }
      } else {
        profileCard.append(node('p', 'social-bio', person.bio || 'This explorer has not added a bio yet.'), node('p', 'social-muted', relationshipText(person)));
        const actions = relationshipButtons(person, error);
        const report = button('Report', () => {
          const form = node('form', 'social-form');
          const reason = select([
            ['harassment', 'Harassment or bullying'],
            ['cheating', 'Cheating or exploit abuse'],
            ['impersonation', 'Impersonation'],
            ['inappropriate', 'Inappropriate content or behaviour'],
            ['spam', 'Spam'],
            ['other', 'Other'],
          ], 'harassment');
          const details = node('textarea'); details.maxLength = 500; details.rows = 4; details.placeholder = 'Add details that will help moderation review this report (optional)';
          const submit = node('button', 'social-button danger', 'Submit report'); submit.type = 'submit';
          const cancel = button('Cancel', () => openProfile(person.id, true), 'social-button secondary');
          const reportActions = node('div', 'social-actions'); reportActions.append(submit, cancel);
          form.append(node('p', 'social-muted', `Report ${person.name || person.username}. Reports are private and the other player is not notified.`), field('Reason', reason), field('Details', details), reportActions);
          form.addEventListener('submit', async event => {
            event.preventDefault(); submit.disabled = true; cancel.disabled = true;
            await run(async () => {
              await api(`/api/reports/${encodeURIComponent(person.id)}`, { reason: reason.value, details: details.value.trim() });
              toast('Report submitted for moderation review');
              await openProfile(person.id, true);
            }, error);
            submit.disabled = false; cancel.disabled = false;
          });
          profileCard.replaceChildren(header, form, error);
          reason.focus();
        }, 'social-button secondary');
        actions.append(report);
        if (!person.blocked) actions.append(button('Block', () => run(async () => { await api(`/api/blocks/${encodeURIComponent(person.id)}`, { blocked: true }); closePeer(person.id); receiving.delete(person.id); receiversReady.delete(person.id); if (activePeer?.id === person.id) { cancelRecording(); stopTalking(); } await refreshPeople(); await refreshUser(); await openProfile(person.id, true); }, error), 'social-button danger'));
        profileCard.append(actions);
      }
      profileCard.append(error);
      if (!preserveFocus) close.focus();
    }, null);
    if (version === profileVersion && !profileCard.querySelector('#social-profile-title')) {
      profileCard.replaceChildren(node('p', 'social-error', 'Could not load this profile. Please try again.'), button('Close', closeProfile));
    }
  }
  async function openConversation(person) {
    if (!requireUser()) return;
    if (!canMessage(person)) throw new Error('Accept a follow request before starting a direct message.');
    if (activePeer?.id !== person.id) { cancelRecording(); stopTalking(); clearMessageURLs(); }
    activePeer = person;
    closeProfile(); showPanel(dmPanel);
    $('dm-title').textContent = `@${person.username}`;
    dmNote.textContent = `${person.online ? 'Online' : 'Offline'} · Accepted contact · Messages are saved on this server.`;
    dmError.textContent = '';
    await loadMessages();
    updateVoiceControls();
    if (person.online) run(() => sendSignal(person.id, { type: 'request' }));
    dmInput.focus();
  }
  function clearMessageURLs() { messageURLs.forEach(url => URL.revokeObjectURL(url)); messageURLs.clear(); }
  function audioURL(base64, mime) {
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: mime })); messageURLs.add(url); return url;
  }
  async function loadMessages() {
    if (!activePeer || !user) return;
    const peerId = activePeer.id;
    const version = ++messageVersion;
    const response = await api(`/api/messages/${encodeURIComponent(peerId)}`);
    if (!user || activePeer?.id !== peerId || version !== messageVersion) return;
    clearMessageURLs(); dmLog.replaceChildren();
    const messages = response.messages || [];
    if (!messages.length) dmLog.append(node('p', 'social-empty', 'Say hello. Your conversation starts here.'));
    for (const message of messages) {
      const mine = message.from === user.id;
      const item = node('div', `dm-message ${mine ? 'mine' : ''}`);
      const time = new Date(message.createdAt);
      item.append(node('small', '', `${mine ? 'You' : activePeer.username}${Number.isNaN(time.getTime()) ? '' : ` · ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}`));
      if (message.body) item.append(node('p', '', message.body));
      if (message.audio) {
        try {
          const audio = document.createElement('audio'); audio.controls = true; audio.preload = 'auto'; audio.src = audioURL(message.audio, message.mime || 'audio/webm'); audio.addEventListener('canplay', () => audio.load(), { once: true });
          audio.setAttribute('aria-label', `Voice message from ${mine ? 'you' : activePeer.username}`);
          item.append(audio);
        } catch { item.append(node('span', 'social-muted', 'Voice message could not be loaded.')); }
      }
      dmLog.append(item);
    }
    dmLog.scrollTop = dmLog.scrollHeight;
  }

  function supportsMicrophone() { return !!(window.isSecureContext && navigator.mediaDevices?.getUserMedia); }
  function updateVoiceControls() {
    const allowed = !!activePeer && canMessage(activePeer);
    recordButton.disabled = !allowed || !supportsMicrophone() || !window.MediaRecorder;
    receiveInput.disabled = !allowed || !window.RTCPeerConnection || !window.isSecureContext || !connected || !activePeer?.online;
    receiveInput.checked = !!activePeer && receiving.has(activePeer.id);
    talkButton.disabled = !allowed || !supportsMicrophone() || !window.RTCPeerConnection || !connected || !activePeer?.online || !!recording || recordingPending;
    talkButton.classList.toggle('transmitting', holding);
    talkButton.textContent = holding ? 'Talking… release to stop' : 'Hold to talk';
    if (!supportsMicrophone()) voiceStatus.textContent = 'Microphone access needs HTTPS or localhost and a browser that supports audio capture.';
    else if (!window.RTCPeerConnection) voiceStatus.textContent = 'Live voice is unavailable in this browser. You can still send voice messages.';
    else if (!connected) voiceStatus.textContent = 'Reconnect to the world to use live voice.';
    else if (!activePeer?.online) voiceStatus.textContent = 'Live voice needs both contacts online. You can send a recorded message now.';
    else if (holding) voiceStatus.textContent = 'Your microphone is active. Release the button to end transmission.';
    else if (!receiversReady.has(activePeer.id)) voiceStatus.textContent = 'Hold to talk. Your contact will be prompted to allow live voice.';
    else voiceStatus.textContent = 'Hold to transmit. Your microphone stops when you release. Remote networks may require a TURN relay.';
  }
  async function startRecording() {
    if (!activePeer || !canMessage(activePeer) || recording || recordingPending) return;
    if (!supportsMicrophone() || !window.MediaRecorder) throw new Error('Voice recording requires HTTPS or localhost and a supported browser.');
    stopTalking(); recordingPending = true; recordingCancelled = false;
    const peerId = activePeer.id;
    const accountId = user.id;
    recordButton.textContent = 'Waiting for microphone…'; recordCancel.hidden = false; updateVoiceControls();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (recordingCancelled || activePeer?.id !== peerId || user?.id !== accountId) { stream.getTracks().forEach(track => track.stop()); return; }
      recordingStream = stream;
      const mime = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(value => MediaRecorder.isTypeSupported(value));
      const recorder = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 48000 });
      recording = recorder;
      const chunks = [];
      const started = Date.now();
      recorder.addEventListener('dataavailable', event => { if (event.data.size) chunks.push(event.data); });
      recorder.addEventListener('error', () => { cancelRecording(); report(new Error('Recording failed. Please try again.'), dmError); });
      recorder.addEventListener('stop', async () => {
        const cancelled = recordingCancelled;
        const duration = Math.min(30, (Date.now() - started) / 1000);
        stream.getTracks().forEach(track => track.stop());
        clearInterval(recordingTick); clearTimeout(recordingTimer);
        recording = null; recordingStream = null; recordingPending = false;
        recordButton.textContent = 'Record voice message'; recordCancel.hidden = true; updateVoiceControls();
        if (cancelled || user?.id !== accountId || duration < 0.25 || activePeer?.id !== peerId) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 500000) { report(new Error('This recording is too large. Try a shorter voice message.'), dmError); return; }
        await run(async () => {
          const audio = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob); });
          if (user?.id !== accountId || activePeer?.id !== peerId) return;
          await api(`/api/messages/${encodeURIComponent(peerId)}`, { audio, mime: blob.type, duration });
          await loadMessages();
        }, dmError);
      }, { once: true });
      recorder.start(250);
      recordingTick = setInterval(() => { recordButton.textContent = `Stop & send · ${Math.min(30, Math.floor((Date.now() - started) / 1000))}/30s`; }, 250);
      recordingTimer = setTimeout(finishRecording, 30000);
      recordButton.textContent = 'Stop & send · 0/30s';
    } catch (error) {
      recordingStream?.getTracks().forEach(track => track.stop()); recordingStream = null;
      throw new Error(error.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow microphone access in your browser to record.' : 'Could not open the microphone. Check your microphone and browser permissions.');
    } finally {
      recordingPending = false;
      if (!recording) { recordButton.textContent = 'Record voice message'; recordCancel.hidden = true; }
      updateVoiceControls();
    }
  }
  function finishRecording() { if (recordingPending) { cancelRecording(); return; } if (recording?.state === 'recording') recording.stop(); }
  function cancelRecording() {
    recordingCancelled = true;
    clearInterval(recordingTick); clearTimeout(recordingTimer);
    if (recording?.state === 'recording') recording.stop();
    recordingStream?.getTracks().forEach(track => track.stop());
    if (!recording) { recordButton.textContent = 'Record voice message'; recordCancel.hidden = true; }
  }
  function proximityDistance(peerId) {
    const self = worldPlayers.get(user?.id), peer = worldPlayers.get(peerId);
    if (!self || !peer || !Number.isFinite(self.x) || !Number.isFinite(self.z) || !Number.isFinite(peer.x) || !Number.isFinite(peer.z)) return Infinity;
    return Math.hypot(self.x - peer.x, self.z - peer.z);
  }
  function proximityVolume(distance) {
    if (distance <= PROXIMITY_FULL_VOLUME) return 1;
    if (distance >= PROXIMITY_STOP_DISTANCE) return 0;
    const linear = 1 - (distance - PROXIMITY_FULL_VOLUME) / (PROXIMITY_STOP_DISTANCE - PROXIMITY_FULL_VOLUME);
    return Math.max(0, Math.min(1, linear * linear));
  }
  function updateProximityButton() {
    if (!proximityVoiceToggle) return;
    proximityVoiceToggle.setAttribute('aria-pressed', proximityEnabled ? 'true' : 'false');
    proximityVoiceToggle.setAttribute('aria-label', proximityEnabled ? 'Turn off nearby voice' : 'Turn on nearby voice');
    const label = proximityVoiceToggle.querySelector('span');
    if (label) label.textContent = proximityEnabled ? 'VOICE ON' : 'VOICE';
  }
  async function sendProximitySignal(peerId, data) {
    if (!user || !connected) return;
    return api(`/api/proximity/signal/${encodeURIComponent(peerId)}`, { data });
  }
  function closeProximityPeer(peerId, callId) {
    const connection = proximityPeers.get(peerId);
    if (!connection || (callId && connection.callId !== callId)) return;
    proximityPeers.delete(peerId);
    try { connection.pc.close(); } catch { /* already closed */ }
    connection.audio.pause();
    connection.audio.srcObject = null;
    connection.audio.remove();
    proximityCandidates.delete(`${peerId}:${connection.callId}`);
  }
  function makeProximityPeer(peerId, callId) {
    closeProximityPeer(peerId);
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    const audio = document.createElement('audio');
    audio.autoplay = true; audio.playsInline = true; audio.style.display = 'none';
    audio.setAttribute('aria-label', 'Nearby player voice');
    const connection = { pc, audio, callId };
    proximityPeers.set(peerId, connection);
    pc.onicecandidate = event => {
      if (!event.candidate) return;
      sendProximitySignal(peerId, { type: 'candidate', callId, candidate: event.candidate.toJSON() }).catch(() => closeProximityPeer(peerId, callId));
    };
    pc.ontrack = event => {
      const distance = proximityDistance(peerId);
      if (!proximityEnabled || distance > PROXIMITY_STOP_DISTANCE) { closeProximityPeer(peerId, callId); return; }
      audio.srcObject = event.streams[0] || new MediaStream([event.track]);
      audio.volume = proximityVolume(distance);
      document.body.append(audio);
      audio.play().catch(() => toast('Tap the VOICE button once to allow nearby audio playback.'));
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(pc.connectionState)) closeProximityPeer(peerId, callId);
    };
    return connection;
  }
  async function flushProximityCandidates(peerId, connection) {
    const key = `${peerId}:${connection.callId}`;
    const candidates = proximityCandidates.get(key) || [];
    proximityCandidates.delete(key);
    for (const candidate of candidates) if (connection.pc.signalingState !== 'closed') await connection.pc.addIceCandidate(candidate);
  }
  async function ensureProximityOffer(peerId, force = false) {
    if (!proximityEnabled || !proximityStream || !connected || !window.RTCPeerConnection || !user || user.id.localeCompare(peerId) >= 0) return;
    const distance = proximityDistance(peerId);
    if (distance > PROXIMITY_START_DISTANCE) return;
    const existing = proximityPeers.get(peerId);
    if (existing) { existing.audio.volume = proximityVolume(distance); return; }
    if (!force && (proximityRetryAt.get(peerId) || 0) > Date.now()) return;
    const callId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const connection = makeProximityPeer(peerId, callId);
    for (const track of proximityStream.getAudioTracks()) connection.pc.addTrack(track, proximityStream);
    try {
      const offer = await connection.pc.createOffer();
      if (!proximityEnabled || proximityDistance(peerId) > PROXIMITY_STOP_DISTANCE || proximityPeers.get(peerId) !== connection) { closeProximityPeer(peerId, callId); return; }
      await connection.pc.setLocalDescription(offer);
      await sendProximitySignal(peerId, { type: 'offer', callId, sdp: offer.sdp });
    } catch {
      closeProximityPeer(peerId, callId);
      proximityRetryAt.set(peerId, Date.now() + 5000);
    }
  }
  function updateProximityWorld(players) {
    worldPlayers.clear();
    for (const player of players) if (player?.id) worldPlayers.set(player.id, player);
    for (const [peerId, connection] of [...proximityPeers]) {
      const distance = proximityDistance(peerId);
      if (!proximityEnabled || distance > PROXIMITY_STOP_DISTANCE) {
        closeProximityPeer(peerId);
        if (connected) sendProximitySignal(peerId, { type: 'end', callId: connection.callId }).catch(() => {});
      } else connection.audio.volume = proximityVolume(distance);
    }
    if (!proximityEnabled || !proximityStream) return;
    for (const player of players) {
      if (!player?.id || player.id === user?.id || proximityDistance(player.id) > PROXIMITY_START_DISTANCE) continue;
      if (user.id.localeCompare(player.id) < 0) ensureProximityOffer(player.id).catch(() => {});
    }
  }
  async function startProximityVoice() {
    if (proximityEnabled || proximityStarting) return;
    if (!user || !connected) { toast('Connect to the world before turning on nearby voice.'); return; }
    if (!supportsMicrophone() || !window.RTCPeerConnection) { toast('Nearby voice needs microphone access on HTTPS or localhost.'); return; }
    proximityStarting = true;
    try {
      const accountId = user.id;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (!user || user.id !== accountId || !connected) { stream.getTracks().forEach(track => track.stop()); return; }
      proximityStream = stream; proximityEnabled = true; updateProximityButton();
      toast('Nearby voice is on. Players close to you can hear you.');
      const nearby = [...worldPlayers.values()].filter(player => player.id !== user.id && proximityDistance(player.id) <= PROXIMITY_START_DISTANCE);
      await Promise.allSettled(nearby.map(player => sendProximitySignal(player.id, { type: 'ready' })));
      updateProximityWorld([...worldPlayers.values()]);
    } catch (error) {
      // Android/browser permission UI is sufficient; do not cover gameplay
      // with a second denial popup.
      if (error.name !== 'NotAllowedError') console.warn('Could not start nearby voice:', error);
    } finally { proximityStarting = false; updateProximityButton(); }
  }
  function stopProximityVoice(notifyPeers = true) {
    const ids = [...proximityPeers.keys()];
    proximityEnabled = false; proximityStarting = false;
    proximityStream?.getTracks().forEach(track => track.stop()); proximityStream = null;
    for (const peerId of ids) {
      const callId = proximityPeers.get(peerId)?.callId;
      closeProximityPeer(peerId);
      if (notifyPeers && connected) sendProximitySignal(peerId, { type: 'disabled', callId }).catch(() => {});
    }
    proximityCandidates.clear(); proximityRetryAt.clear(); updateProximityButton();
  }
  async function handleProximitySignal({ from, data }) {
    if (!user || !from || !data) return;
    if (data.type === 'ready') {
      proximityRetryAt.delete(from);
      if (proximityEnabled && proximityDistance(from) <= PROXIMITY_START_DISTANCE && user.id.localeCompare(from) < 0) await ensureProximityOffer(from, true);
      return;
    }
    if (data.type === 'disabled') { closeProximityPeer(from, data.callId); proximityRetryAt.set(from, Date.now() + 5000); return; }
    if (data.type === 'end') { closeProximityPeer(from, data.callId); return; }
    if (!data.callId) return;
    const distance = proximityDistance(from);
    if (!proximityEnabled || !proximityStream || distance > PROXIMITY_STOP_DISTANCE) {
      await sendProximitySignal(from, { type: 'disabled', callId: data.callId }).catch(() => {});
      closeProximityPeer(from, data.callId); return;
    }
    if (data.type === 'offer') {
      const connection = makeProximityPeer(from, data.callId);
      for (const track of proximityStream.getAudioTracks()) connection.pc.addTrack(track, proximityStream);
      await connection.pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
      await flushProximityCandidates(from, connection);
      const answer = await connection.pc.createAnswer();
      await connection.pc.setLocalDescription(answer);
      await sendProximitySignal(from, { type: 'answer', callId: data.callId, sdp: answer.sdp });
    } else if (data.type === 'answer') {
      const connection = proximityPeers.get(from);
      if (!connection || connection.callId !== data.callId || connection.pc.signalingState !== 'have-local-offer') return;
      await connection.pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
      await flushProximityCandidates(from, connection);
    } else if (data.type === 'candidate' && data.candidate) {
      const connection = proximityPeers.get(from);
      if (connection?.callId === data.callId && connection.pc.remoteDescription) await connection.pc.addIceCandidate(data.candidate);
      else {
        const key = `${from}:${data.callId}`;
        const pending = proximityCandidates.get(key) || [];
        if (pending.length < 50 && proximityCandidates.size < 50) { pending.push(data.candidate); proximityCandidates.set(key, pending); }
      }
    }
  }
  async function sendSignal(peerId, data) { if (!user || !connected) return; return api(`/api/voice/signal/${encodeURIComponent(peerId)}`, { data }); }
  function closePeer(peerId, callId) {
    const connection = peers.get(peerId);
    if (!connection || (callId && connection.callId !== callId)) return;
    peers.delete(peerId);
    connection.pc.close();
    connection.audio.pause();
    connection.audio.srcObject?.getTracks().forEach(track => track.stop());
    connection.audio.srcObject = null;
    connection.audio.remove();
    earlyCandidates.delete(`${peerId}:${connection.callId}`);
  }
  function makePeer(peerId, callId) {
    closePeer(peerId);
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    const audio = document.createElement('audio'); audio.autoplay = true; audio.controls = true;
    audio.setAttribute('aria-label', 'Incoming walkie-talkie audio');
    const connection = { pc, audio, callId };
    peers.set(peerId, connection);
    pc.onicecandidate = event => { if (event.candidate) run(() => sendSignal(peerId, { type: 'candidate', callId, candidate: event.candidate.toJSON() })); };
    pc.ontrack = event => {
      if (!receiving.has(peerId)) { closePeer(peerId, callId); return; }
      audio.srcObject = event.streams[0] || new MediaStream([event.track]);
      audioMount.append(audio);
      audio.play().catch(() => toast('Press play in the conversation to hear incoming live voice.'));
      const contact = people.find(person => person.id === peerId);
      toast(`${contact?.username || 'Your contact'} is speaking`);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') { closePeer(peerId, callId); if (talkPeer === peerId) stopTalking(); toast('Live voice could not connect. Try a voice message; remote networks may need a TURN relay.'); }
    };
    return connection;
  }
  async function flushCandidates(peerId, connection) {
    const key = `${peerId}:${connection.callId}`;
    const candidates = earlyCandidates.get(key) || [];
    earlyCandidates.delete(key);
    for (const candidate of candidates) if (connection.pc.signalingState !== 'closed') await connection.pc.addIceCandidate(candidate);
  }
  async function startTalking() {
    if (holding || talkButton.disabled || !activePeer) return;
    const peerId = activePeer.id;
    const version = ++holdVersion;
    holding = true; talkPeer = peerId; updateVoiceControls();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (!holding || version !== holdVersion || activePeer?.id !== peerId || !connected) { stream.getTracks().forEach(track => track.stop()); return; }
      talkStream = stream;
      const callId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const connection = makePeer(peerId, callId);
      for (const track of stream.getAudioTracks()) connection.pc.addTrack(track, stream);
      const offer = await connection.pc.createOffer();
      if (!holding || version !== holdVersion) return;
      await connection.pc.setLocalDescription(offer);
      await sendSignal(peerId, { type: 'offer', callId, sdp: offer.sdp });
    } catch (error) {
      stopTalking();
      throw new Error(error.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow access to use push-to-talk.' : 'Could not start live voice. Please try again.');
    }
  }
  function stopTalking() {
    if (!holding && !talkStream && !talkPeer) return;
    holding = false; holdVersion++;
    talkStream?.getTracks().forEach(track => track.stop()); talkStream = null;
    const peerId = talkPeer; talkPeer = null;
    const callId = peers.get(peerId)?.callId;
    if (peerId) { closePeer(peerId, callId); if (callId) run(() => sendSignal(peerId, { type: 'end', callId })); }
    updateVoiceControls();
  }
  async function handleSignal({ from, data }) {
    if (!user || !from || !data) return;
    if (data.type === 'request') { await sendSignal(from, { type: receiving.has(from) ? 'opt-in' : 'disabled', enabled: receiving.has(from) }); return; }
    if (data.type === 'opt-in') { receiversReady.add(from); updateVoiceControls(); return; }
    if (data.type === 'disabled') { receiversReady.delete(from); if (talkPeer === from) stopTalking(); closePeer(from); updateVoiceControls(); return; }
    if (data.type === 'end') { closePeer(from, data.callId); return; }
    if (!data.callId) return;
    if (data.type === 'offer') {
      if (!receiving.has(from) || !window.RTCPeerConnection || !canMessage(people.find(person => person.id === from))) { await sendSignal(from, { type: 'disabled' }); return; }
      if (talkPeer === from) stopTalking();
      const connection = makePeer(from, data.callId);
      await connection.pc.setRemoteDescription({ type: 'offer', sdp: data.sdp });
      await flushCandidates(from, connection);
      const answer = await connection.pc.createAnswer();
      await connection.pc.setLocalDescription(answer);
      await sendSignal(from, { type: 'answer', callId: data.callId, sdp: answer.sdp });
    } else if (data.type === 'answer') {
      const connection = peers.get(from);
      if (!connection || connection.callId !== data.callId || connection.pc.signalingState !== 'have-local-offer') return;
      await connection.pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
      await flushCandidates(from, connection);
    } else if (data.type === 'candidate' && data.candidate) {
      const connection = peers.get(from);
      if (connection?.callId === data.callId && connection.pc.remoteDescription) await connection.pc.addIceCandidate(data.candidate);
      else if (receiving.has(from) || talkPeer === from) {
        const key = `${from}:${data.callId}`;
        const pending = earlyCandidates.get(key) || [];
        if (pending.length < 50 && earlyCandidates.size < 30) { pending.push(data.candidate); earlyCandidates.set(key, pending); }
      }
    }
  }
  function cleanupVoice() {
    cancelRecording(); stopTalking(); stopProximityVoice(false);
    for (const peerId of [...peers.keys()]) closePeer(peerId);
    earlyCandidates.clear(); receiving.clear(); receiversReady.clear(); worldPlayers.clear();
    audioMount.replaceChildren(); updateVoiceControls(); updateProximityButton();
  }
  function startEvents() {
    source?.close();
    source = new EventSource('/api/events');
    const events = source;
    const listen = (name, action) => events.addEventListener(name, event => {
      if (source !== events || !user) return;
      const version = sessionVersion;
      try { const value = JSON.parse(event.data); Promise.resolve(action(value)).catch(error => { if (source === events && version === sessionVersion) report(error); }); }
      catch { /* Ignore malformed event payloads without breaking the stream. */ }
    });
    events.onopen = () => { if (source !== events || !user) return; setConnection(true); run(refreshPeople, peopleError); };
    events.onerror = () => {
      if (source !== events || !user) return;
      if (connected) { setConnection(false); cleanupVoice(); onDisconnect(); onPlayers([]); run(refreshUser); }
    };
    listen('session-revoked', () => {
      endSession('This Kerala Play account was signed in on another device.');
    });
    listen('world', value => {
      const players = value.players || [];
      setConnection(true, players.length);
      const online = new Set(players.map(player => player.id));
      let changed = false;
      people.forEach(person => { const isOnline = online.has(person.id); if (person.online !== isOnline) changed = true; person.online = isOnline; });
      if (changed) renderPeople();
      updateProximityWorld(players);
      onPlayers(players);
    });
    listen('social', async () => { await refreshPeople(); await refreshGroups(); await refreshUser(); if (!profileModal.hidden && profileId && profileId !== user?.id) await openProfile(profileId, true); if (!groupModal.hidden && activeGroupId) await openGroup(activeGroupId, true); });
    listen('group-message', async value => {
      if (activeGroupId === value.groupId && !groupModal.hidden) await openGroup(value.groupId, true);
      else { if (peopleFilter === 'groups') run(refreshGroups, peopleError); toast('New group message'); }
    });
    listen('message', async value => {
      if (activePeer?.id === value.peerId && dmPanel.classList.contains('open')) await loadMessages();
      else { chatToggle?.classList.add('unread'); toast(`New message${people.find(person => person.id === value.peerId)?.username ? ` from ${people.find(person => person.id === value.peerId).username}` : ''}`); }
    });
    listen('profile', value => { if (value.user?.id === user?.id) setUser(value.user); run(refreshPeople, peopleError); });
    listen('bank', () => {
      if (walletPanel?.classList.contains('open')) run(refreshBank, walletError);
    });
    listen('notification', value => {
      run(refreshNotifications, phoneError);
      if (!phonePanel?.classList.contains('open') && value?.item?.title) toast(value.item.title);
    });
    listen('signal', handleSignal);
    listen('proximity-signal', handleProximitySignal);
  }
  async function beginSession(next, isNewAccount = false) {
    if (!next) { renderAuth(); return; }
    sessionVersion++;
    cleanupVoice(); clearMessageURLs();
    source?.close(); source = null;
    peopleVersion++; groupsVersion++; groupMessageVersion++; messageVersion++; profileVersion++;
    people = []; peopleSignature = ''; groupsSnapshot = { groups: [], invites: [], limits: {} }; activePeer = null; profileId = null; activeGroupId = null;
    closePanels(); closeProfile(); closeGroup();
    dmInput.value = ''; dmLog.replaceChildren();
    setUser(next);
    authModal.hidden = true;
    // Signup is the one moment a new explorer must always see the guide.
    if (isNewAccount) window.dispatchEvent(new CustomEvent('kerala-onboarding-start'));
    profileChip?.focus();
    setConnection(false);
    startEvents();
    await run(refreshPeople, peopleError);
    await run(refreshGroups, peopleError);
    await run(refreshJobs, jobsError);
    await run(refreshGarage, garageError);
    await run(refreshNeeds, walletError);
    await run(refreshHome, homeError);
    await run(refreshBank, walletError);
    await run(refreshNotifications, phoneError);
    await run(refreshNpcRelationships, peopleError);
    await run(refreshCommunityEvents, eventsError);
    await run(discoverAdminAccess);
    if (notificationsTimer) clearInterval(notificationsTimer);
    notificationsTimer = setInterval(() => {
      if (!user) return;
      run(refreshNotifications, phoneError);
      run(refreshCommunityEvents, eventsPanel?.classList.contains('open') ? eventsError : null);
    }, 30000);
  }
  function endSession(message = '') {
    sessionVersion++;
    source?.close(); source = null;
    cleanupVoice(); clearMessageURLs();
    if (notificationsTimer) { clearInterval(notificationsTimer); notificationsTimer = null; }
    peopleVersion++; groupsVersion++; groupMessageVersion++; messageVersion++; profileVersion++;
    people = []; peopleSignature = ''; groupsSnapshot = { groups: [], invites: [], limits: {} }; activePeer = null; profileId = null; activeGroupId = null;
    closePanels(); closeProfile(); closeGroup();
    setUser(null); setConnection(false); onPlayers([]); onDisconnect();
    if (walletBalance) walletBalance.textContent = '₹0';
    notificationsSnapshot = null;
    if (adminToggle) adminToggle.hidden = true;
    if (adminMetrics) adminMetrics.replaceChildren();
    if (adminReports) adminReports.replaceChildren();
    if (adminTimer) { clearInterval(adminTimer); adminTimer = null; }
    npcRelationshipsSnapshot = null;
    eventsSnapshot = null;
    if (eventsTimer) { clearInterval(eventsTimer); eventsTimer = null; }
    window.dispatchEvent(new CustomEvent('kerala-npc-relationships-sync', { detail: null }));
    window.dispatchEvent(new CustomEvent('kerala-community-events-sync', { detail: null }));
    phoneNotifications?.replaceChildren();
    eventsList?.replaceChildren();
    if (eventsSummaryText) eventsSummaryText.textContent = 'No active session';
    if (phoneBadge) { phoneBadge.hidden = true; phoneBadge.textContent = '0'; }
    if (phoneSummaryText) phoneSummaryText.textContent = 'No unread alerts';
    walletTransactions?.replaceChildren();
    if (starterDelivery) { starterDelivery.disabled = false; starterDelivery.textContent = 'Complete Starter Delivery · +₹250'; }
    jobsSnapshot = null; jobsList?.replaceChildren(); window.dispatchEvent(new CustomEvent('kerala-job-mission', { detail: null })); if (jobsTimer) { clearInterval(jobsTimer); jobsTimer = null; }
    garageSnapshot = null; garageMarketSnapshot = null; trafficSnapshot = null; needsSnapshot = null; homeSnapshot = null; garageList?.replaceChildren(); garageCatalog?.replaceChildren(); garageMarket?.replaceChildren(); trafficDocuments?.replaceChildren(); trafficChallans?.replaceChildren(); window.dispatchEvent(new CustomEvent('kerala-garage-state', { detail: null })); window.dispatchEvent(new CustomEvent('kerala-traffic-state', { detail: null })); window.dispatchEvent(new CustomEvent('kerala-needs-state', { detail: null })); window.dispatchEvent(new CustomEvent('kerala-home-state', { detail: null }));
    dmInput.value = ''; dmLog.replaceChildren();
    renderPeople(); renderAuth('login', message);
  }
  profileChip?.addEventListener('click', () => openProfile());
  peopleToggle?.addEventListener('click', () => peoplePanel.classList.contains('open') ? closePanels() : openPeople());
  chatToggle?.addEventListener('click', () => chatPanel.classList.contains('open') || dmPanel.classList.contains('open') ? closePanels() : openChat());
  phoneToggle?.addEventListener('click', () => phonePanel?.classList.contains('open') ? closePanels() : openPhone());
  phoneClose?.addEventListener('click', () => { closePanels(); phoneToggle?.focus(); });
  phoneRefresh?.addEventListener('click', () => run(refreshNotifications, phoneError));
  phoneMarkAll?.addEventListener('click', () => run(() => markNotificationRead('', true), phoneError));
  eventsToggle?.addEventListener('click', () => eventsPanel?.classList.contains('open') ? closePanels() : openEvents());
  eventsClose?.addEventListener('click', () => { closePanels(); eventsToggle?.focus(); });
  eventsRefresh?.addEventListener('click', () => run(refreshCommunityEvents, eventsError));
  walletToggle?.addEventListener('click', () => walletPanel?.classList.contains('open') ? closePanels() : openWallet());
  walletClose?.addEventListener('click', () => { closePanels(); walletToggle?.focus(); });
  walletRefresh?.addEventListener('click', () => run(refreshWallet, walletError));
  bankRefresh?.addEventListener('click', () => run(refreshBank, walletError));
  homeToggle?.addEventListener('click', () => homePanel?.classList.contains('open') ? closePanels() : openHome());
  homeClose?.addEventListener('click', () => { closePanels(); homeToggle?.focus(); });
  homeRefresh?.addEventListener('click', () => run(refreshHome, homeError));
  garageToggle?.addEventListener('click', () => garagePanel?.classList.contains('open') ? closePanels() : openGarage());
  garageClose?.addEventListener('click', () => { closePanels(); garageToggle?.focus(); });
  garageRefresh?.addEventListener('click', () => run(refreshGarage, garageError));
  garageMarketRefresh?.addEventListener('click', () => run(refreshGarage, garageError));
  trafficRefresh?.addEventListener('click', () => run(refreshTraffic, garageError));
  jobsToggle?.addEventListener('click', () => jobsPanel?.classList.contains('open') ? closePanels() : openJobs());
  progressionToggle?.addEventListener('click', () => progressionPanel?.classList.contains('open') ? closePanels() : openProgression());
  progressionClose?.addEventListener('click', () => { closePanels(); progressionToggle?.focus(); });
  progressionRefresh?.addEventListener('click', () => run(refreshProgression, progressionError));
  adminToggle?.addEventListener('click', () => adminPanel?.classList.contains('open') ? closePanels() : run(openAdmin, adminError));
  adminClose?.addEventListener('click', () => { closePanels(); adminToggle?.focus(); });
  adminRefresh?.addEventListener('click', () => run(refreshAdminOverview, adminError));
  adminReportsRefresh?.addEventListener('click', () => run(refreshAdminReports, adminError));
  jobsClose?.addEventListener('click', () => { closePanels(); jobsToggle?.focus(); });
  jobsRefresh?.addEventListener('click', () => run(refreshJobs, jobsError));
  phoneNotifications?.addEventListener('click', event => {
    const readButton = event.target.closest('button[data-alert-read]');
    if (readButton) {
      run(() => markNotificationRead(readButton.dataset.alertRead), phoneError);
      return;
    }
    const openButton = event.target.closest('button[data-alert-target]');
    if (!openButton) return;
    run(async () => {
      if (openButton.dataset.alertId) await markNotificationRead(openButton.dataset.alertId);
      openNotificationTarget(openButton.dataset.alertTarget);
    }, phoneError);
  });

  const payHomeCharge = (button, kind) => {
    if (!button || button.disabled) return;
    run(async () => {
      button.disabled = true;
      const result = await api('/api/home/pay', { kind, amount: 1 });
      renderHome(result.home);
      renderWallet(result.wallet);
      toast(`${kind === 'rent' ? 'Home rent' : 'Electricity + water'} paid · ${formatCash(result.payment.amount)}`);
    }, homeError).finally(() => { if (button) button.disabled = false; });
  };
  homePayRent?.addEventListener('click', () => payHomeCharge(homePayRent, 'rent'));
  homePayUtilities?.addEventListener('click', () => payHomeCharge(homePayUtilities, 'utilities'));

  window.addEventListener('kerala-home-sleep', () => run(async () => {
    const result = await api('/api/home/sleep', {});
    if (result.home) renderHome(result.home);
    if (result.needs) renderNeeds(result.needs);
    toast(result.slept
      ? `Sleep complete · Energy 100 · Hunger −${result.hungerCost} · Thirst −${result.thirstCost}`
      : (result.message || 'Energy is already full'));
  }, homeError));

  jobsList?.addEventListener('click', event => {
    const action = event.target.closest('button[data-job-action]');
    if (!action || action.disabled) return;
    run(async () => {
      action.disabled = true;
      if (action.dataset.jobAction === 'start') {
        const result = await api(`/api/jobs/${encodeURIComponent(action.dataset.jobId)}/start`, {});
        renderJobs(result.jobs);
        closePanels();
        jobsToggle?.focus();
        toast(`${result.jobs.jobs.find(job => job.id === action.dataset.jobId)?.title || 'Job'} started · follow the mission route`);
      } else if (action.dataset.jobAction === 'checkpoint') {
        const result = await api(`/api/jobs/${encodeURIComponent(action.dataset.jobId)}/checkpoint`, { taskId: action.dataset.taskId });
        renderJobs(result.jobs); toast(`${result.checkpoint.action} complete · next mission step ready`);
      } else {
        const result = await api(`/api/jobs/${encodeURIComponent(action.dataset.jobId)}/complete`, { taskId: action.dataset.taskId, reward: 999999 });
        renderJobs(result.jobs);
        renderWallet(result.wallet);
        await Promise.all([refreshNeeds().catch(() => null), refreshHome().catch(() => null)]);
        toast(`${result.completed.title} salary credited · ${formatCash(result.reward)} · ${lifeLoopSuggestion()}`);
      }
    }, jobsError).finally(() => { if (jobsPanel?.classList.contains('open')) run(refreshJobs, jobsError); });
  });
  starterDelivery?.addEventListener('click', () => run(async () => {
    starterDelivery.disabled = true;
    const result = await api('/api/jobs/starter-delivery/complete', {});
    renderWallet(result.wallet); toast(`Starter Delivery salary credited · ${formatCash(result.reward)}`);
  }, walletError).finally(() => { if (starterDelivery && !starterDelivery.textContent.includes('received')) starterDelivery.disabled = false; }));
  walletPanel?.addEventListener('click', event => {
    const cashButton = event.target.closest('button[data-bank-cash]');
    if (!cashButton || cashButton.disabled) return;
    run(async () => {
      const amount = Number(bankCashAmount?.value);
      cashButton.disabled = true;
      const result = await api('/api/bank/cash', { action: cashButton.dataset.bankCash, amount });
      renderWallet(result.wallet);
      renderBank(result.bank);
      if (bankCashAmount) bankCashAmount.value = '';
      toast(`${result.action === 'deposit' ? 'Deposited to Kerala Bank' : 'Withdrawn to Wallet'} · ${formatCash(result.amount)}`);
    }, walletError).finally(() => { cashButton.disabled = false; });
  });

  bankUpiSend?.addEventListener('click', () => run(async () => {
    const recipient = bankUpiRecipient?.value?.trim() || '';
    const amount = Number(bankUpiAmount?.value);
    bankUpiSend.disabled = true;
    const result = await api('/api/bank/upi', { recipient, amount });
    renderBank(result.bank);
    if (bankUpiAmount) bankUpiAmount.value = '';
    toast(`UPI sent · ${formatCash(result.amount)} · ${result.recipient.upiId}`);
  }, walletError).finally(() => { if (bankUpiSend) bankUpiSend.disabled = false; }));

  walletShop?.addEventListener('click', event => {
    const purchaseButton = event.target.closest('button[data-item-id]');
    if (!purchaseButton) return;
    run(async () => {
      purchaseButton.disabled = true;
      const result = await api('/api/shop/purchase', { itemId: purchaseButton.dataset.itemId });
      renderWallet(result.wallet);
      if (result.needs) renderNeeds(result.needs);
      const effects = result.purchase?.needs || {};
      const restored = [effects.hunger ? `Hunger +${effects.hunger}` : '', effects.thirst ? `Thirst +${effects.thirst}` : '', effects.energy ? `Energy +${effects.energy}` : ''].filter(Boolean).join(' · ');
      toast(`${result.purchase.name} · ${formatCash(result.purchase.price)}${restored ? ` · ${restored}` : ''}`);
    }, walletError).finally(() => { purchaseButton.disabled = false; });
  });
  garageCatalog?.addEventListener('click', event => {
    const buy = event.target.closest('button[data-buy-model]');
    if (!buy || buy.disabled) return;
    run(async () => {
      buy.disabled = true;
      const result = await api('/api/garage/buy', { modelId: buy.dataset.buyModel });
      renderGarage(result.garage);
      renderWallet(result.wallet);
      toast(`${result.purchase.label} purchased · ${formatCash(result.purchase.price)}`);
    }, garageError).finally(() => { if (garagePanel?.classList.contains('open')) run(refreshGarage, garageError); });
  });
  garageList?.addEventListener('click', event => {
    const actionButton = event.target.closest('button[data-garage-action]');
    if (!actionButton || actionButton.disabled || actionButton.dataset.garageAction === 'none') return;
    run(async () => {
      actionButton.disabled = true;
      const action = actionButton.dataset.garageAction;
      let result;
      if (action === 'select') result = await api('/api/garage/select', { vehicleId: actionButton.dataset.vehicleId });
      else result = await api('/api/garage/vehicle', { action, vehicleId: actionButton.dataset.vehicleId });
      renderGarage(result.garage);
      if (action === 'select') toast('Garage vehicle selected');
      if (action === 'retrieve') toast('Vehicle retrieved · walk to it and tap ENTER');
      if (action === 'store') toast('Vehicle stored in My Garage');
    }, garageError).finally(() => { if (garagePanel?.classList.contains('open')) run(refreshGarage, garageError); });
  });
  garageList?.addEventListener('click', event => {
    const insuranceButton = event.target.closest('button[data-insurance-vehicle]');
    if (insuranceButton && !insuranceButton.disabled) {
      run(async () => {
        insuranceButton.disabled = true;
        const result = await api('/api/garage/insurance', { vehicleId: insuranceButton.dataset.insuranceVehicle });
        renderGarage(result.garage);
        renderWallet(result.wallet);
        toast(`Insurance renewed · ${formatCash(result.insurance.cost)}`);
        await refreshGarage();
      }, garageError);
      return;
    }
    const marketButton = event.target.closest('button[data-market-action]');
    if (!marketButton || marketButton.disabled) return;
    run(async () => {
      marketButton.disabled = true;
      const action = marketButton.dataset.marketAction;
      const result = await api(`/api/garage/market/${action}`, { vehicleId: marketButton.dataset.vehicleId });
      renderGarage(result.garage);
      renderUsedMarket(result.market);
      toast(action === 'list' ? `Vehicle listed · ${formatCash(result.listing.price)}` : 'Used-market listing removed');
    }, garageError).finally(() => { if (garagePanel?.classList.contains('open')) run(refreshGarage, garageError); });
  });

  trafficDocuments?.addEventListener('click', event => {
    const actionButton = event.target.closest('button[data-licence-action]');
    if (!actionButton || actionButton.disabled) return;
    run(async () => {
      actionButton.disabled = true;
      const result = await api('/api/traffic/licence', { action: actionButton.dataset.licenceAction });
      renderTraffic(result.traffic);
      renderWallet(result.wallet);
      const action = actionButton.dataset.licenceAction;
      if (action === 'learner') toast('Starter Learner Permit issued · bike class active');
      else if (action === 'full') toast(`Full Licence issued · ${formatCash(result.cost)} paid`);
      else toast(`Driving licence renewed · ${formatCash(result.cost)} paid`);
    }, garageError).finally(() => { if (garagePanel?.classList.contains('open')) run(refreshTraffic, garageError); });
  });

  trafficChallans?.addEventListener('click', event => {
    const pay = event.target.closest('button[data-pay-challan]');
    if (!pay || pay.disabled) return;
    run(async () => {
      pay.disabled = true;
      const result = await api('/api/traffic/challan/pay', { challanId: pay.dataset.payChallan });
      renderTraffic(result.traffic);
      renderWallet(result.wallet);
      toast(`Traffic challan paid · ${formatCash(result.transaction.amount)}`);
    }, garageError);
  });

  window.addEventListener('kerala-traffic-checkpoint', () => run(async () => {
    const result = await api('/api/traffic/checkpoint', {});
    renderTraffic(result.traffic);
    const inspection = result.inspection;
    if (inspection.result === 'clear') {
      toast('Checkpoint clear · RC, insurance and driving licence verified');
    } else {
      const kind = inspection.challan?.kind;
      const label = kind === 'licence_invalid' ? 'Driving licence invalid' : 'Insurance expired';
      toast(inspection.challanCreated
        ? `${label} · in-game challan ${formatCash(inspection.challan.amount)} issued`
        : `${label} · unpaid challan already exists`);
    }
  }, garageError));

  window.addEventListener('kerala-traffic-refresh', () => run(refreshTraffic, garageError));
  window.addEventListener('kerala-needs-rest', () => run(async () => {
    const result = await api('/api/needs/rest', {});
    if (result.needs) renderNeeds(result.needs);
    toast(result.rested ? `Rest complete · Energy +${result.restored}` : (result.message || 'Energy is already full'));
  }, walletError));

  window.addEventListener('kerala-open-home', openHome);
  window.addEventListener('kerala-world-shop-open', event => openWorldShop(event.detail));

  window.addEventListener('kerala-bus-stop-view', event => run(async () => {
    const stopId = String(event.detail?.stopId || '');
    if (!stopId) return;
    const status = await api(`/api/travel/bus/status?stopId=${encodeURIComponent(stopId)}`);
    window.dispatchEvent(new CustomEvent('kerala-bus-status', { detail: status }));
    const timing = status.boarding
      ? `BOARDING NOW · ${status.boardingSecondsRemaining}s left`
      : `next bus in ${status.secondsToArrival}s`;
    toast(`${status.routeLabel} · ${status.stop.label} → ${status.destination.label} · ${timing} · fare ${formatCash(status.fare)}`, 4200);
  }, walletError));

  window.addEventListener('kerala-bus-board', event => run(async () => {
    const stopId = String(event.detail?.stopId || '');
    if (!stopId) return;
    const result = await api('/api/travel/bus/board', { stopId });
    if (result.wallet) renderWallet(result.wallet);
    if (result.user) setUser(result.user);
    window.dispatchEvent(new CustomEvent('kerala-bus-status', { detail: null }));
    window.dispatchEvent(new CustomEvent('kerala-public-travel-arrival', { detail: result.travel || null }));
    toast(`${result.travel?.routeLabel || 'Village Line'} · arrived at ${result.travel?.to?.label || 'destination'} · ticket ${formatCash(result.travel?.fare || 0)}`, 4200);
  }, walletError));

  window.addEventListener('kerala-public-ride-complete', event => {
    const result = event.detail || null;
    if (result?.wallet) renderWallet(result.wallet);
    if (result?.ride) {
      toast(`${result.ride.serviceLabel || 'Ride'} · arrived at ${result.ride.to?.label || 'destination'} · fare ${formatCash(result.ride.fare || 0)}`, 4200);
    }
  });

  window.addEventListener('kerala-community-event-participate', event => {
    const eventId = String(event.detail?.eventId || eventsSnapshot?.current?.id || '');
    if (!eventId) return;
    run(() => participateCommunityEvent(eventId), eventsPanel?.classList.contains('open') ? eventsError : null)
      .finally(() => window.dispatchEvent(new CustomEvent('kerala-community-event-pending-reset')));
  });

  window.addEventListener('kerala-community-events-refresh', () => {
    if (user) run(refreshCommunityEvents, eventsPanel?.classList.contains('open') ? eventsError : null);
  });

  window.addEventListener('kerala-npc-interact', event => run(async () => {
    if (!user) return;
    const npcId = String(event.detail?.npcId || '');
    if (!npcId) return;
    const result = await api('/api/npc/interact', { npcId });
    if (result.relationship) {
      const others = Array.isArray(npcRelationshipsSnapshot?.relationships)
        ? npcRelationshipsSnapshot.relationships.filter(item => item.npcId !== result.relationship.npcId)
        : [];
      syncNpcRelationships({
        ...(npcRelationshipsSnapshot || {}),
        reputation: result.reputation || npcRelationshipsSnapshot?.reputation || null,
        relationships: [...others, result.relationship],
      });
      window.dispatchEvent(new CustomEvent('kerala-npc-relationship-result', { detail: result }));
      window.dispatchEvent(new CustomEvent('kerala-npc-favor-offer', {
        detail: {
          npcId: result.relationship.npcId,
          offer: result.favorOffer || null,
        },
      }));
    }
  }, peopleError));

  window.addEventListener('kerala-npc-favor-start', event => run(async () => {
    if (!user) return;
    const npcId = String(event.detail?.npcId || '');
    if (!npcId) return;
    const result = await api('/api/npc/favor/start', { npcId });
    syncNpcRelationships({
      ...(npcRelationshipsSnapshot || {}),
      reputation: result.reputation || npcRelationshipsSnapshot?.reputation || null,
      activeFavor: result.activeFavor || null,
    });
    if (result.activeFavor) {
      window.dispatchEvent(new CustomEvent('kerala-npc-favor-route-ready', { detail: result.activeFavor }));
    }
  }, peopleError));

  window.addEventListener('kerala-npc-favor-complete', event => {
    run(async () => {
      if (!user) return;
      const favorId = String(event.detail?.favorId || npcRelationshipsSnapshot?.activeFavor?.id || '');
      if (!favorId) return;
      const result = await api('/api/npc/favor/complete', { favorId });
      if (result.wallet) renderWallet(result.wallet);
      const relationships = Array.isArray(npcRelationshipsSnapshot?.relationships)
        ? npcRelationshipsSnapshot.relationships.filter(item => item.npcId !== result.relationship?.npcId)
        : [];
      if (result.relationship) relationships.push(result.relationship);
      syncNpcRelationships({
        ...(npcRelationshipsSnapshot || {}),
        reputation: result.reputation || npcRelationshipsSnapshot?.reputation || null,
        relationships,
        activeFavor: null,
      });
      if (result.relationship) window.dispatchEvent(new CustomEvent('kerala-npc-relationship-result', { detail: result }));
      toast(`${result.completed?.npcName || 'Villager'} favor complete · +${formatCash(result.completed?.reward || 0)} · local reputation ${result.reputation?.value ?? 0}/100`, 4600);
    }, peopleError).finally(() => {
      window.dispatchEvent(new CustomEvent('kerala-npc-favor-completion-reset'));
    });
  });

  worldShopClose?.addEventListener('click', () => {
    worldShopPanel?.classList.remove('open');
    worldShopContext = null;
  });

  worldShopItems?.addEventListener('click', event => {
    const button = event.target.closest('button[data-world-shop-item]');
    if (!button || button.disabled || !worldShopContext) return;
    run(async () => {
      button.disabled = true;
      if (worldShopError) worldShopError.textContent = '';
      const itemId = String(button.dataset.worldShopItem || '');
      const result = await api('/api/world/shop/purchase', {
        shopId: worldShopContext.shopId,
        itemId,
      });
      if (result.wallet) renderWallet(result.wallet);
      if (result.needs) renderNeeds(result.needs);
      const effects = result.purchase?.needs || {};
      const restored = [
        effects.hunger ? `Hunger +${effects.hunger}` : '',
        effects.thirst ? `Thirst +${effects.thirst}` : '',
        effects.energy ? `Energy +${effects.energy}` : '',
      ].filter(Boolean).join(' · ');
      toast(`${result.shop?.label || worldShopContext.label} · ${result.purchase?.name || 'Purchase'} · ${formatCash(result.purchase?.price || 0)}${restored ? ` · ${restored}` : ''}`);
      if (worldShopNote) worldShopNote.textContent = `Purchase complete · ${lifeLoopSuggestion()}`;
    }, worldShopError).finally(() => {
      if (button.isConnected) button.disabled = false;
    });
  });


  garageMarket?.addEventListener('click', event => {
    const buy = event.target.closest('button[data-market-buy]');
    if (!buy || buy.disabled) return;
    run(async () => {
      buy.disabled = true;
      const result = await api('/api/garage/market/buy', { vehicleId: buy.dataset.marketBuy });
      renderGarage(result.garage);
      renderUsedMarket(result.market);
      renderWallet(result.wallet);
      toast(`${result.purchase.label} transferred · ${result.purchase.registration} · ${formatCash(result.purchase.price)}`);
    }, garageError).finally(() => { if (garagePanel?.classList.contains('open')) run(refreshGarage, garageError); });
  });

  proximityVoiceToggle?.addEventListener('click', () => proximityEnabled ? stopProximityVoice() : startProximityVoice());
  window.addEventListener('blur', () => { stopTalking(); cancelRecording(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopTalking(); cancelRecording(); stopProximityVoice(); } });
  window.addEventListener('pagehide', () => { cleanupVoice(); clearMessageURLs(); source?.close(); });
  updateProximityButton();
  setConnection(false);
  const initialVersion = sessionVersion;
  wakeProductionBackend();
  void (async () => {
    if (await completeOAuthCallback()) return;
    await wait(900);
    let result = null;
    try { result = await api('/api/session'); }
    catch { /* Cold-start errors stay out of the login form while the service warms. */ }

    if (initialVersion !== sessionVersion) return;
    if (result?.user) {
      await beginSession(result.user);
      return;
    }

    if (authModal.hidden) renderAuth('login');

    // Free production instances can need time to wake. Keep warming in the
    // background without stealing focus or showing a false login error.
    for (const delay of [2500, 5000, 8000]) {
      await wait(delay);
      if (initialVersion !== sessionVersion || user) return;
      try {
        const retry = await api('/api/session');
        if (initialVersion !== sessionVersion || user) return;
        if (retry?.user) {
          await beginSession(retry.user);
          return;
        }
        return;
      } catch { /* stay on the usable login form and retry quietly */ }
    }
  })();

  return {
    closePanels,
    get user() { return user; },
    get connected() { return connected; },
    refreshUser,
    openProfile,
    openPeople,
    openChat,
    onState(listener) { listeners.add(listener); listener({ user, connected }); return () => listeners.delete(listener); },
  };
}
