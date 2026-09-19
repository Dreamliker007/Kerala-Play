const districts = ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'];
const accepted = relation => ['following', 'follower', 'mutual'].includes(relation);
const serverHelp = 'Start the Kerala Play server with npm start, then open http://localhost:3000. Accounts and live features need the server.';

export async function api(path, body, method) {
  if (!/^https?:$/.test(location.protocol)) throw new Error(serverHelp);
  let response;
  try {
    response = await fetch(path, { method: method || (body === undefined ? 'GET' : 'POST'), credentials: 'same-origin', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch { throw new Error(`Cannot reach the Kerala Play server. ${serverHelp}`); }
  let result;
  try { result = await response.json(); }
  catch { throw new Error(`This page is not connected to the Kerala Play server. ${serverHelp}`); }
  if (!response.ok) {
    const error = new Error(result.error || result.message || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return result;
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
  let peopleFilter = 'all';
  let peopleSearch = '';
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
  const walletPanel = $('wallet-panel');
  const walletToggle = $('wallet-toggle');
  const walletClose = $('wallet-close');
  const walletBalance = $('wallet-balance');
  const walletTransactions = $('wallet-transactions');
  const walletError = $('wallet-error');
  const starterDelivery = $('starter-delivery');
  const walletRefresh = $('wallet-refresh');
  const walletShop = $('wallet-shop');
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
  const jobsPanel = $('jobs-panel');
  const jobsToggle = $('jobs-toggle');
  const jobsClose = $('jobs-close');
  const jobsList = $('jobs-list');
  const jobsError = $('jobs-error');
  const jobsRefresh = $('jobs-refresh');
  let jobsSnapshot = null;
  let jobsTimer = null;
  const profileChip = $('profile-chip');

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
    for (const panel of [peoplePanel, dmPanel, chatPanel, walletPanel, garagePanel, jobsPanel]) panel?.classList.remove('open');
    peopleToggle?.setAttribute('aria-expanded', 'false');
    chatToggle?.setAttribute('aria-expanded', 'false');
    walletToggle?.setAttribute('aria-expanded', 'false');
    garageToggle?.setAttribute('aria-expanded', 'false');
    jobsToggle?.setAttribute('aria-expanded', 'false');
    if (jobsTimer) { clearInterval(jobsTimer); jobsTimer = null; }
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
    walletToggle?.setAttribute('aria-expanded', String(panel === walletPanel));
    garageToggle?.setAttribute('aria-expanded', String(panel === garagePanel));
    jobsToggle?.setAttribute('aria-expanded', String(panel === jobsPanel));
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
  const authError = node('div', 'social-error');
  authError.setAttribute('role', 'status');
  authError.setAttribute('aria-live', 'polite');
  const authNote = node('p', 'social-muted', 'New accounts start at 0 points. Earn rewards by completing tasks and winning games.');
  const forgot = button('Forgot password?', () => renderReset()); forgot.className = 'social-link';
  authForm.append(field('First name', firstName), field('Username', username), usernameNote, field('Password', password), signupContact, signupFields, authSubmit, forgot, authError);
  authCard.append(node('div', 'social-eyebrow', 'KERALA PLAY'), authTitle, authIntro, authTabs, authForm, authNote);
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

  function trapFocus(event) {
    event.stopPropagation();
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
  profileModal.addEventListener('click', event => { if (event.target === profileModal) closeProfile(); });
  for (const panel of [peoplePanel, dmPanel, chatPanel]) {
    panel?.addEventListener('keydown', event => { event.stopPropagation(); if (event.key === 'Escape') { closePanels(); chatToggle?.focus(); } });
    panel?.addEventListener('pointerdown', event => event.stopPropagation());
  }
  function renderAuth(mode = authMode, error = '') {
    authMode = mode;
    authModal.hidden = false;
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
    password.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    authError.textContent = error;
    queueMicrotask(() => username.focus());
  }
  async function renderReset() {
    const identifier = window.prompt('Enter your username, email, or mobile number:');
    if (!identifier) return;
    await run(async () => { const result = await api('/api/auth/forgot', { identifier }); window.alert(result.message); const code = window.prompt('Enter the 6-digit reset code from the server console:'); if (!code) return; const next = window.prompt('Choose a new password (8+ characters):'); if (!next) return; await api('/api/auth/reset', { code, password: next }); window.alert('Password reset. You can log in now.'); }, authError);
  }
  authForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!authForm.reportValidity()) return;
    authSubmit.disabled = true;
    await run(async () => {
      const result = await api(`/api/auth/${authMode}`, { identifier: username.value.trim(), username: username.value.trim(), firstName: firstName.value.trim(), password: password.value, ...(authMode === 'signup' ? { email: signupEmail.value, mobile: signupMobile.value, district: signupDistrict.value, gender: signupGender.value } : {}) });
      password.value = '';
      await beginSession(result.user);
    }, authError);
    authSubmit.disabled = false;
  });

  peoplePanel.replaceChildren(panelHeader('People', peoplePanel));
  const onlineLabel = node('p', 'panel-note', 'Not connected');
  onlineLabel.id = 'people-online-label';
  const peopleTabs = node('div', 'social-tabs people-tabs');
  for (const [value, label] of [['all', 'Everyone'], ['followers', 'Followers'], ['following', 'Following'], ['requests', 'Requests'], ['blocked', 'Blocked']]) {
    const tab = button(label, () => { peopleFilter = value; renderPeople(); });
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
  function renderPeople() {
    peopleList.replaceChildren();
    for (const tab of peopleTabs.children) tab.setAttribute('aria-pressed', String(tab.dataset.filter === peopleFilter));
    const visible = people.filter(person => {
      if (person.id === user?.id || !person.username?.toLowerCase().includes(peopleSearch)) return false;
      if (peopleFilter === 'blocked') return person.blocked;
      if (person.blocked) return false;
      if (peopleFilter === 'followers') return ['follower', 'mutual'].includes(person.relationship);
      if (peopleFilter === 'following') return ['following', 'mutual'].includes(person.relationship);
      if (peopleFilter === 'requests') return ['outgoing', 'incoming'].includes(person.relationship);
      return true;
    }).sort((a, b) => Number(b.online) - Number(a.online) || a.username.localeCompare(b.username));
    if (!visible.length) peopleList.append(node('p', 'social-empty', peopleFilter === 'all' ? 'No people here yet. Invite a friend to open this world and create an account.' : 'No people in this list yet.'));
    for (const person of visible) peopleList.append(personCard(person));
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
  function openWallet() {
    if (!requireUser()) return;
    showPanel(walletPanel);
    run(refreshWallet, walletError);
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
      toast(`${result.completed.title} salary credited · ${formatCash(result.reward)}`);
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
    closeProfile(); showPanel(peoplePanel);
    run(refreshPeople, peopleError);
    search.focus();
  }
  function openChat() {
    if (!requireUser()) return;
    closeProfile(); showPanel(chatPanel);
    run(refreshPeople, peopleError);
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
      const result = profileId === user.id ? { user } : await api(`/api/profile/${encodeURIComponent(profileId)}`);
      if (profileModal.hidden || version !== profileVersion) return;
      const person = { ...result.user, relationship: result.relationship || result.user.relationship, blocked: result.blocked || result.user.blocked, canMessage: result.canMessage ?? result.user.canMessage };
      const own = person.id === user.id;
      const header = node('div', 'social-profile-header');
      const title = node('h2', '', person.username);
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
      const error = node('div', 'social-error'); error.setAttribute('role', 'status');
      profileCard.replaceChildren(header, node('p', 'social-muted', `${person.district || 'Kerala'} · ${person.gender === 'female' ? 'Female' : 'Male'} avatar`), stats);
      if (own) {
        const form = node('form', 'social-form');
        const district = select(districts, person.district);
        const gender = select([['male', 'Male'], ['female', 'Female']], person.gender);
        const row = node('div', 'social-fields-row'); row.append(field('District', district), field('Avatar', gender));
        const bio = node('textarea'); bio.value = person.bio || ''; bio.maxLength = 180; bio.rows = 3;
        bio.placeholder = 'Tell people a little about yourself';
        const save = node('button', 'social-button primary', 'Save profile'); save.type = 'submit';
        form.append(row, field('About you', bio), save);
        form.addEventListener('submit', async event => { event.preventDefault(); save.disabled = true; await run(async () => { const response = await api('/api/profile', { district: district.value, gender: gender.value, bio: bio.value.trim() }, 'PATCH'); if (response.user) setUser(response.user); else await refreshUser(); toast('Profile saved'); closeProfile(); }, error); save.disabled = false; });
        const logout = button('Log out', () => run(async () => { await api('/api/auth/logout', {}); endSession(); }, error), 'social-button secondary');
        const socialActions = node('div', 'social-actions');
        socialActions.append(button('Followers & requests', () => { peopleFilter = 'followers'; openPeople(); }), logout);
        profileCard.append(form, socialActions);
      } else {
        profileCard.append(node('p', 'social-bio', person.bio || 'This explorer has not added a bio yet.'), node('p', 'social-muted', relationshipText(person)));
        const actions = relationshipButtons(person, error);
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
      toast(error.name === 'NotAllowedError' ? 'Microphone permission was denied.' : 'Could not start nearby voice.');
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
    listen('social', async () => { await refreshPeople(); await refreshUser(); if (!profileModal.hidden && profileId && profileId !== user?.id) await openProfile(profileId, true); });
    listen('message', async value => {
      if (activePeer?.id === value.peerId && dmPanel.classList.contains('open')) await loadMessages();
      else { chatToggle?.classList.add('unread'); toast(`New message${people.find(person => person.id === value.peerId)?.username ? ` from ${people.find(person => person.id === value.peerId).username}` : ''}`); }
    });
    listen('profile', value => { if (value.user?.id === user?.id) setUser(value.user); run(refreshPeople, peopleError); });
    listen('signal', handleSignal);
    listen('proximity-signal', handleProximitySignal);
  }
  async function beginSession(next) {
    if (!next) { renderAuth(); return; }
    sessionVersion++;
    cleanupVoice(); clearMessageURLs();
    source?.close(); source = null;
    peopleVersion++; messageVersion++; profileVersion++;
    people = []; peopleSignature = ''; activePeer = null; profileId = null;
    closePanels(); closeProfile();
    dmInput.value = ''; dmLog.replaceChildren();
    setUser(next);
    authModal.hidden = true;
    profileChip?.focus();
    setConnection(false);
    startEvents();
    await run(refreshPeople, peopleError);
    await run(refreshJobs, jobsError);
    await run(refreshGarage, garageError);
  }
  function endSession(message = '') {
    sessionVersion++;
    source?.close(); source = null;
    cleanupVoice(); clearMessageURLs();
    peopleVersion++; messageVersion++; profileVersion++;
    people = []; peopleSignature = ''; activePeer = null; profileId = null;
    closePanels(); closeProfile();
    setUser(null); setConnection(false); onPlayers([]); onDisconnect();
    if (walletBalance) walletBalance.textContent = '₹0';
    walletTransactions?.replaceChildren();
    if (starterDelivery) { starterDelivery.disabled = false; starterDelivery.textContent = 'Complete Starter Delivery · +₹250'; }
    jobsSnapshot = null; jobsList?.replaceChildren(); window.dispatchEvent(new CustomEvent('kerala-job-mission', { detail: null })); if (jobsTimer) { clearInterval(jobsTimer); jobsTimer = null; }
    garageSnapshot = null; garageMarketSnapshot = null; trafficSnapshot = null; garageList?.replaceChildren(); garageCatalog?.replaceChildren(); garageMarket?.replaceChildren(); trafficDocuments?.replaceChildren(); trafficChallans?.replaceChildren(); window.dispatchEvent(new CustomEvent('kerala-garage-state', { detail: null })); window.dispatchEvent(new CustomEvent('kerala-traffic-state', { detail: null }));
    dmInput.value = ''; dmLog.replaceChildren();
    renderPeople(); renderAuth('login', message);
  }
  profileChip?.addEventListener('click', () => openProfile());
  peopleToggle?.addEventListener('click', () => peoplePanel.classList.contains('open') ? closePanels() : openPeople());
  chatToggle?.addEventListener('click', () => chatPanel.classList.contains('open') || dmPanel.classList.contains('open') ? closePanels() : openChat());
  walletToggle?.addEventListener('click', () => walletPanel?.classList.contains('open') ? closePanels() : openWallet());
  walletClose?.addEventListener('click', () => { closePanels(); walletToggle?.focus(); });
  walletRefresh?.addEventListener('click', () => run(refreshWallet, walletError));
  garageToggle?.addEventListener('click', () => garagePanel?.classList.contains('open') ? closePanels() : openGarage());
  garageClose?.addEventListener('click', () => { closePanels(); garageToggle?.focus(); });
  garageRefresh?.addEventListener('click', () => run(refreshGarage, garageError));
  garageMarketRefresh?.addEventListener('click', () => run(refreshGarage, garageError));
  trafficRefresh?.addEventListener('click', () => run(refreshTraffic, garageError));
  jobsToggle?.addEventListener('click', () => jobsPanel?.classList.contains('open') ? closePanels() : openJobs());
  jobsClose?.addEventListener('click', () => { closePanels(); jobsToggle?.focus(); });
  jobsRefresh?.addEventListener('click', () => run(refreshJobs, jobsError));
  jobsList?.addEventListener('click', event => {
    const action = event.target.closest('button[data-job-action]');
    if (!action || action.disabled) return;
    run(async () => {
      action.disabled = true;
      if (action.dataset.jobAction === 'start') {
        const result = await api(`/api/jobs/${encodeURIComponent(action.dataset.jobId)}/start`, {});
        renderJobs(result.jobs); toast(`${result.jobs.jobs.find(job => job.id === action.dataset.jobId)?.title || 'Job'} started · follow the mission route`);
      } else if (action.dataset.jobAction === 'checkpoint') {
        const result = await api(`/api/jobs/${encodeURIComponent(action.dataset.jobId)}/checkpoint`, { taskId: action.dataset.taskId });
        renderJobs(result.jobs); toast(`${result.checkpoint.action} complete · next mission step ready`);
      } else {
        const result = await api(`/api/jobs/${encodeURIComponent(action.dataset.jobId)}/complete`, { taskId: action.dataset.taskId, reward: 999999 });
        renderJobs(result.jobs); renderWallet(result.wallet); toast(`${result.completed.title} salary credited · ${formatCash(result.reward)}`);
      }
    }, jobsError).finally(() => { if (jobsPanel?.classList.contains('open')) run(refreshJobs, jobsError); });
  });
  starterDelivery?.addEventListener('click', () => run(async () => {
    starterDelivery.disabled = true;
    const result = await api('/api/jobs/starter-delivery/complete', {});
    renderWallet(result.wallet); toast(`Starter Delivery salary credited · ${formatCash(result.reward)}`);
  }, walletError).finally(() => { if (starterDelivery && !starterDelivery.textContent.includes('received')) starterDelivery.disabled = false; }));
  walletShop?.addEventListener('click', event => {
    const purchaseButton = event.target.closest('button[data-item-id]');
    if (!purchaseButton) return;
    run(async () => {
      purchaseButton.disabled = true;
      const result = await api('/api/shop/purchase', { itemId: purchaseButton.dataset.itemId });
      renderWallet(result.wallet); toast(`${result.purchase.name} purchased · ${formatCash(result.purchase.price)}`);
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
  run(async () => {
    const result = await api('/api/session');
    if (initialVersion !== sessionVersion) return;
    if (result.user) await beginSession(result.user);
    else renderAuth();
  }, authError).then(() => { if (!user && authModal.hidden) renderAuth('login', authError.textContent); });

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
