# Kerala Play Full Script Backup — Part 1: Frontend & Game

## index.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <meta name="theme-color" content="#4a8cda">
  <title>Kerala Play — Living Kerala</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #92c9ff; font-family: Arial, sans-serif; touch-action: none; }
    canvas { display: block; width: 100%; height: 100%; }
    #hud { position: fixed; inset: 0; pointer-events: none; }
    #brand { position: absolute; top: calc(env(safe-area-inset-top) + 14px); left: 16px; padding: 9px 12px; border-radius: 12px; color: white; background: rgba(11, 35, 45, .62); box-shadow: 0 2px 12px rgba(0,0,0,.18); font-weight: 700; letter-spacing: .2px; }
    #hint { position: absolute; top: calc(env(safe-area-inset-top) + 64px); left: 16px; color: rgba(255,255,255,.92); background: rgba(11,35,45,.46); border-radius: 10px; padding: 7px 10px; font-size: 12px; line-height: 1.35; }
    #joystick-zone { position: absolute; z-index:2; left: 0; bottom: 0; width: 48vw; height: 42vh; min-width: 220px; min-height: 245px; pointer-events: auto; touch-action: none; }
    #joystick-base { position: absolute; width: 118px; height: 118px; left: 30px; bottom: calc(env(safe-area-inset-bottom) + 28px); border: 2px solid rgba(255,255,255,.34); border-radius: 50%; background: rgba(10,37,42,.24); box-shadow: inset 0 0 22px rgba(0,0,0,.15); }
    #joystick-knob { position: absolute; width: 54px; height: 54px; left: 30px; top: 30px; border: 2px solid rgba(255,255,255,.55); border-radius: 50%; background: rgba(255,255,255,.28); box-shadow: 0 3px 9px rgba(0,0,0,.18); transform: translate(0,0); }
    #run { position: absolute; z-index:3; right: 22px; bottom: calc(env(safe-area-inset-bottom) + 38px); width: 80px; height: 80px; pointer-events: auto; touch-action: none; border: 2px solid rgba(255,255,255,.55); border-radius: 50%; color: #fff; font-weight: 800; font-size: 14px; letter-spacing: .5px; background: rgba(26,92,72,.68); box-shadow: 0 4px 15px rgba(0,0,0,.24); }
    #run.active { background: rgba(55,174,112,.9); transform: scale(.96); }
    #camera-zone { position: absolute; right: 0; bottom: 0; width: 52vw; height: 100vh; pointer-events: auto; touch-action: none; }
    #camera-note { position: absolute; z-index:2; right: 122px; bottom: calc(env(safe-area-inset-bottom) + 65px); color: rgba(255,255,255,.87); background: rgba(11,35,45,.42); padding: 6px 8px; border-radius: 8px; font-size: 11px; pointer-events:none; }
    #fallback { display: none; position: fixed; inset: 0; z-index: 5; place-items: center; padding: 24px; background: #16323f; color: white; text-align: center; line-height: 1.5; }
    #camera-zone { z-index: 1; }
    #profile-chip, #progress-chip, #online-chip, #mission-card, #quick-actions, #minimap, #chat-panel, #people-panel, #task-panel, #dm-panel, #asset-notice, #toast { z-index: 5; pointer-events: auto; }
    #profile-chip { position:absolute; top:calc(env(safe-area-inset-top) + 14px); left:176px; max-width:180px; padding:8px 10px; border:1px solid rgba(255,255,255,.22); border-radius:11px; background:rgba(8,29,34,.67); color:#fff; font-size:11px; line-height:1.25; cursor:pointer; touch-action:manipulation; }
    #profile-name { display:block; font-weight:800; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    #profile-district { display:block; margin-top:2px; color:#bde7d0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    #progress-chip { position:absolute; top:calc(env(safe-area-inset-top) + 58px); left:176px; max-width:180px; padding:7px 10px; border:1px solid rgba(255,255,255,.18); border-radius:10px; background:rgba(8,29,34,.62); color:#f8dc79; font-size:11px; font-weight:800; }
    #online-chip { position:absolute; top:calc(env(safe-area-inset-top) + 14px); right:74px; display:flex; align-items:center; gap:6px; max-width:160px; padding:7px 9px; border:1px solid rgba(255,255,255,.2); border-radius:10px; background:rgba(8,29,34,.66); color:#e7fff1; font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; pointer-events:none; }
    #online-chip i { display:block; width:7px; height:7px; flex:0 0 auto; border-radius:50%; background:#41df83; box-shadow:0 0 8px rgba(65,223,131,.72); }
    #mission-card { position:absolute; top:calc(env(safe-area-inset-top) + 108px); left:16px; width:194px; padding:10px 11px; border:1px solid rgba(255,255,255,.17); border-radius:12px; background:rgba(10,29,34,.67); color:#fff; font:inherit; font-size:12px; line-height:1.35; text-align:left; cursor:pointer; touch-action:manipulation; }
    #mission-card strong { display:block; color:#f6d66b; margin-bottom:3px; font-size:12px; }
    #landmark-status { color:#d3ece1; font-size:11px; }
    #quick-actions { position:absolute; top:calc(env(safe-area-inset-top) + 14px); right:14px; display:grid; gap:8px; pointer-events:auto; }
    .hud-icon { width:48px; height:48px; border:1px solid rgba(255,255,255,.36); border-radius:14px; color:#fff; background:rgba(8,35,43,.78); box-shadow:0 4px 14px rgba(0,0,0,.18); font-size:20px; cursor:pointer; touch-action:manipulation; }
    .hud-icon span { display:block; margin-top:-1px; font-size:8px; font-weight:900; letter-spacing:.4px; }
    .hud-icon[aria-expanded="true"] { background:rgba(38,133,91,.95); border-color:#b9ffe1; }
    #chat-toggle.unread { position:relative; }
    #chat-toggle.unread::after { content:''; position:absolute; top:5px; right:5px; width:10px; height:10px; border-radius:50%; background:#ff5d67; box-shadow:0 0 0 2px #08232b; }
    #minimap, #chat-panel, #people-panel, #task-panel, #dm-panel { display:none; position:absolute; top:calc(env(safe-area-inset-top) + 14px); right:72px; width:min(310px, calc(100vw - 90px)); max-height:min(58dvh, 380px); overflow-y:auto; padding:11px; border:1px solid rgba(255,255,255,.3); border-radius:15px; background:rgba(7,24,30,.94); color:#fff; box-shadow:0 9px 26px rgba(0,0,0,.32); touch-action:pan-y; }
    #minimap.open, #chat-panel.open, #people-panel.open, #task-panel.open, #dm-panel.open { display:block; z-index:7; }
    .panel-heading, .map-header, .chat-heading { display:flex; align-items:center; justify-content:space-between; gap:8px; color:#fff; font-size:13px; font-weight:900; }
    .panel-heading small { color:#abd7c1; font-size:10px; font-weight:600; }
    .panel-close, #map-label-toggle { border:0; border-radius:7px; color:#fff; background:rgba(255,255,255,.13); padding:4px 7px; font:inherit; font-size:12px; cursor:pointer; touch-action:manipulation; }
    #map-label-toggle { margin-left:auto; }
    #kerala-map { display:block; width:100%; height:250px; margin-top:6px; overflow:visible; }
    #kerala-outline { fill:rgba(48,119,79,.88); stroke:#d9f2c8; stroke-width:1.5; }
    .district-lines path { fill:none; stroke:rgba(228,255,225,.30); stroke-width:.65; }
    #map-route { stroke:#f5d566; stroke-width:1.2; stroke-dasharray:2 2; }
    .landmark-marker { cursor:pointer; pointer-events:all; }
    .landmark-marker .pin { fill:#f5c95c; stroke:#162b32; stroke-width:1.2; }
    .landmark-marker text { fill:#102831; font-size:7px; font-weight:800; text-anchor:middle; dominant-baseline:central; pointer-events:none; }
    .district-label { fill:#f4ffe9; font-size:5.2px; font-weight:800; text-anchor:middle; paint-order:stroke; stroke:#24553d; stroke-width:1.2px; stroke-opacity:.8; pointer-events:none; }
    #map-player circle { fill:#fff; stroke:#152f3b; stroke-width:1.5; }
    #map-player path { fill:#1ee879; stroke:#062f1c; stroke-width:.8; }
    #map-status { display:block; min-height:15px; color:rgba(255,255,255,.88); font-size:10px; text-align:center; }
    #chat-channel { margin-top:8px; width:100%; border:1px solid rgba(255,255,255,.23); border-radius:8px; padding:7px; color:#fff; background:#17323a; font-size:12px; }
    #chat-note { margin:7px 0; color:#b9d8cf; font-size:10px; line-height:1.35; }
    #chat-log { height:142px; overflow-y:auto; padding:7px; border-radius:9px; background:rgba(255,255,255,.06); font-size:11px; line-height:1.35; }
    .chat-message { margin:0 0 7px; word-break:break-word; }
    .chat-message small { display:block; color:#9ec8b6; font-size:9px; }
    #chat-form { display:flex; gap:6px; margin-top:8px; }
    #chat-input { min-width:0; flex:1; border:1px solid rgba(255,255,255,.22); border-radius:8px; padding:8px; color:#fff; background:#163139; font:inherit; }
    #chat-send, .action-button { border:0; border-radius:8px; color:#fff; background:#25865c; padding:8px 10px; font-weight:800; font:inherit; cursor:pointer; touch-action:manipulation; }
    .panel-note { margin:8px 0; color:#b9d8cf; font-size:10px; line-height:1.4; }
    .people-entry, .task-card, .challenge-box { margin-top:8px; padding:9px; border:1px solid rgba(255,255,255,.13); border-radius:10px; background:rgba(255,255,255,.055); }
    .people-entry strong, .task-card strong { display:block; color:#fff; font-size:12px; }
    .people-entry small, .task-card small { display:block; margin-top:3px; color:#b9d8cf; font-size:10px; line-height:1.32; }
    .people-actions { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
    .people-actions button, .challenge-box button { border:1px solid rgba(255,255,255,.18); border-radius:7px; padding:6px 8px; color:#fff; background:#1d5d55; font:inherit; font-size:11px; font-weight:800; cursor:pointer; }
    .people-actions button.secondary, .challenge-box button.secondary { background:#28434d; }
    .task-card.done { border-color:rgba(79,213,132,.62); background:rgba(33,123,80,.18); }
    .task-card progress { width:100%; height:6px; margin-top:7px; accent-color:#50ce82; }
    .challenge-box p { margin:5px 0 8px; color:#c5e5d8; font-size:11px; line-height:1.35; }
    #challenge-result { display:block; min-height:15px; margin-top:7px; color:#f6d66b; font-size:10px; line-height:1.35; }
    #dm-log { min-height:90px; max-height:155px; overflow-y:auto; padding:7px; border-radius:9px; background:rgba(255,255,255,.06); font-size:11px; line-height:1.35; }
    .dm-message { margin-bottom:7px; }
    .dm-message small { display:block; color:#9ec8b6; font-size:9px; }
    #dm-form { display:flex; gap:6px; margin-top:8px; }
    #dm-input { min-width:0; flex:1; border:1px solid rgba(255,255,255,.22); border-radius:8px; padding:8px; color:#fff; background:#163139; font:inherit; }
    #toast { display:none; position:absolute; top:calc(env(safe-area-inset-top) + 14px); left:50%; transform:translateX(-50%); max-width:260px; padding:8px 11px; border-radius:10px; color:#fff; background:rgba(21,105,69,.93); box-shadow:0 4px 17px rgba(0,0,0,.24); text-align:center; font-size:11px; font-weight:800; pointer-events:none; }
    #asset-notice { display:none; position:absolute; left:50%; top:calc(env(safe-area-inset-top) + 14px); transform:translateX(-50%); max-width:310px; padding:8px 10px; border-radius:9px; color:#fff7d7; background:rgba(93,60,10,.85); font-size:11px; text-align:center; }
    #profile-modal { display:none; position:fixed; inset:0; z-index:20; align-items:center; justify-content:center; padding:20px; background:rgba(3,15,18,.72); color:#fff; }
    #profile-modal.open { display:flex; }
    .profile-card { width:min(360px, 100%); padding:22px; border:1px solid rgba(255,255,255,.25); border-radius:18px; background:linear-gradient(145deg, #143e43, #0c2229); box-shadow:0 12px 36px rgba(0,0,0,.38); }
    .profile-card h1 { margin:0 0 7px; font-size:23px; }
    .profile-card p { margin:0 0 15px; color:#bcdad1; font-size:13px; line-height:1.4; }
    .profile-card label { display:block; margin:11px 0 5px; color:#d7f0e4; font-size:12px; font-weight:700; }
    .profile-card input, .profile-card select { width:100%; padding:11px; border:1px solid rgba(255,255,255,.24); border-radius:9px; color:#fff; background:#18363d; font:inherit; }
    #profile-submit { width:100%; margin-top:17px; border:0; border-radius:10px; padding:12px; color:#062019; background:#50c980; font-weight:900; font-size:14px; cursor:pointer; }
    #profile-error { min-height:17px; margin-top:8px; color:#ffd996; font-size:11px; }
    @media (max-width: 560px) { #profile-chip { top:calc(env(safe-area-inset-top) + 62px); left:16px; max-width:145px; } #progress-chip { top:calc(env(safe-area-inset-top) + 105px); left:16px; max-width:165px; } #mission-card { top:calc(env(safe-area-inset-top) + 144px); width:166px; } #online-chip { top:calc(env(safe-area-inset-top) + 242px); right:14px; max-width:118px; } #hint { display:none; } #minimap, #chat-panel, #people-panel, #task-panel, #dm-panel { width:min(284px, calc(100vw - 88px)); max-height:min(56dvh, 350px); } #kerala-map { height:220px; } }
    @media (min-width: 740px) { #joystick-zone { width: 330px; height: 330px; } #joystick-base { left: 44px; bottom: 38px; } #run { right: 44px; bottom: 46px; } }
    @media (max-width: 560px) {
      #brand { padding:7px 9px; font-size:13px; }
      #hint, #camera-note { display:none; }
      #profile-chip { left:16px; top:calc(env(safe-area-inset-top) + 54px); max-width:126px; padding:6px 8px; opacity:.9; }
      #profile-name { font-size:11px; }
      #profile-district { font-size:9px; }
      #progress-chip { left:16px; top:calc(env(safe-area-inset-top) + 99px); max-width:126px; padding:5px 8px; font-size:10px; }
      #mission-card { top:calc(env(safe-area-inset-top) + 143px); width:auto; max-width:132px; padding:7px 8px; font-size:10px; opacity:.86; }
      #mission-card strong { font-size:10px; }
      #mission-text { display:block; max-width:112px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #landmark-status { display:none; }
      #online-chip { top:calc(env(safe-area-inset-top) + 14px); right:70px; max-width:64px; padding:6px 7px; font-size:9px; }
      #online-chip span { max-width:35px; overflow:hidden; }
      #quick-actions { top:calc(env(safe-area-inset-top) + 14px); right:8px; gap:5px; }
      .hud-icon { width:42px; height:42px; border-radius:12px; font-size:17px; }
      .hud-icon span { font-size:7px; }
      #joystick-base { opacity:.45; }
      #run { width:68px; height:68px; right:16px; bottom:calc(env(safe-area-inset-bottom) + 30px); opacity:.72; }
      #joystick-zone:active #joystick-base, #run:active { opacity:.88; }
      #minimap, #chat-panel, #people-panel, #task-panel, #dm-panel { right:58px; width:min(286px,calc(100vw - 74px)); max-height:58dvh; }
    }
  </style>
  <link rel="stylesheet" href="./social.css">
  <link rel="stylesheet" href="./game.css">
</head>
<body>
  <div id="hud" aria-label="Game controls">
    <div id="brand">Kerala Play <span style="font-size:11px;opacity:.8">V48</span></div>
    <div id="hint">WASD / left pad: move<br>Drag right side: look<br>Shift / hold RUN: run</div>
    <div id="joystick-zone" aria-label="Movement joystick">
      <div id="joystick-base"><div id="joystick-knob"></div></div>
    </div>
    <div id="camera-zone" aria-label="Camera look area"></div>
    <div id="camera-note">Swipe to look</div>
    <button id="run" type="button" aria-label="Hold to run">RUN</button>
    <button id="profile-chip" type="button" aria-label="Edit profile"><span id="profile-name">Explorer</span><span id="profile-district">Choose district</span></button>
    <output id="progress-chip" aria-live="polite">Lv. 1 · 0 points</output>
    <output id="online-chip" aria-live="polite"><i></i><span id="online-count">Connecting…</span></output>
    <button id="mission-card" type="button" aria-label="Open tasks"><strong>● Current Mission</strong><span id="mission-text">Explore Kerala landmarks</span><br><span id="landmark-status">Tap TASKS for rewards</span></button>
    <div id="quick-actions" aria-label="Expandable game panels">
      <button id="map-open" class="hud-icon" type="button" aria-label="Open Kerala map" aria-controls="minimap" aria-expanded="false">🗺<span>MAP</span></button>
      <button id="people-toggle" class="hud-icon" type="button" aria-label="Open people" aria-controls="people-panel" aria-expanded="false">👥<span>PEOPLE</span></button>
      <button id="chat-toggle" class="hud-icon" type="button" aria-label="Open chat" aria-controls="chat-panel" aria-expanded="false">💬<span>CHAT</span></button>
      <button id="task-toggle" class="hud-icon" type="button" aria-label="Open tasks" aria-controls="task-panel" aria-expanded="false">★<span>TASKS</span></button>
      <button id="fullscreen-toggle" class="hud-icon" type="button" aria-label="Enter fullscreen">⛶<span>FULL</span></button>
    </div>
    <aside id="minimap" aria-label="Kerala mini-map">
      <div class="map-header"><strong>KERALA MAP</strong><button id="map-label-toggle" type="button" aria-label="Toggle landmark labels">Labels</button><button id="map-close" class="panel-close" type="button" aria-label="Close map">×</button></div>
      <svg id="kerala-map" viewBox="0 0 120 300" role="img" aria-label="Kerala outline map with landmarks and player location">
        <defs><clipPath id="kerala-clip"><path d="M55 8 C63 13 67 20 70 29 L76 38 L73 48 L82 58 L79 68 L88 80 L83 91 L90 103 L86 114 L92 126 L87 138 L95 151 L90 163 L97 176 L91 188 L94 201 L87 214 L90 226 L83 239 L82 251 L75 263 L72 275 L64 285 L58 294 L52 286 L48 276 L42 268 L43 257 L36 248 L39 237 L31 226 L35 215 L27 204 L32 192 L25 181 L30 169 L23 157 L29 145 L24 133 L30 121 L25 109 L31 97 L27 85 L34 74 L30 63 L38 52 L35 41 L43 31 L42 21 L49 14 Z"/></clipPath></defs>
        <path id="kerala-outline" d="M55 8 C63 13 67 20 70 29 L76 38 L73 48 L82 58 L79 68 L88 80 L83 91 L90 103 L86 114 L92 126 L87 138 L95 151 L90 163 L97 176 L91 188 L94 201 L87 214 L90 226 L83 239 L82 251 L75 263 L72 275 L64 285 L58 294 L52 286 L48 276 L42 268 L43 257 L36 248 L39 237 L31 226 L35 215 L27 204 L32 192 L25 181 L30 169 L23 157 L29 145 L24 133 L30 121 L25 109 L31 97 L27 85 L34 74 L30 63 L38 52 L35 41 L43 31 L42 21 L49 14 Z"/>
        <g class="district-lines" clip-path="url(#kerala-clip)"><path d="M22 58 H92 M22 101 H94 M22 142 H97 M22 184 H96 M25 225 H90 M35 263 H82"/></g>
        <g id="district-labels" aria-label="Kerala districts">
          <text class="district-label" x="58" y="18">Kasaragod</text><text class="district-label" x="55" y="32">Kannur</text><text class="district-label" x="58" y="48">Wayanad</text><text class="district-label" x="56" y="64">Kozhikode</text><text class="district-label" x="58" y="82">Malappuram</text><text class="district-label" x="61" y="101">Palakkad</text><text class="district-label" x="58" y="120">Thrissur</text><text class="district-label" x="57" y="141">Ernakulam</text><text class="district-label" x="57" y="160">Idukki</text><text class="district-label" x="57" y="179">Kottayam</text><text class="district-label" x="57" y="198">Pathanamthitta</text><text class="district-label" x="57" y="218">Alappuzha</text><text class="district-label" x="56" y="240">Kollam</text><text class="district-label" x="57" y="266">Thiruvananthapuram</text>
        </g>
        <line id="map-route" hidden /><g id="landmark-layer"></g><g id="map-player" aria-label="Your location"><circle r="6.4"></circle><path d="M0 -5 L4 5 L0 2.4 L-4 5 Z"></path></g>
      </svg>
      <output id="map-status" aria-live="polite">Village · You</output>
    </aside>
    <section id="chat-panel" aria-label="Regional text chat"><div class="chat-heading"><span>Regional Chat</span><button id="chat-close" class="panel-close" type="button" aria-label="Close chat">×</button></div><select id="chat-channel" aria-label="Chat channel"></select><div id="chat-note">Select an accepted connection to chat privately.</div><div id="chat-log" aria-live="polite"></div><form id="chat-form"><input id="chat-input" maxlength="240" autocomplete="off" placeholder="Write a message"><button id="chat-send" type="submit">Send</button></form></section>
    <section id="people-panel" aria-label="People and follows"><div class="panel-heading"><span>People</span><button id="people-close" class="panel-close" type="button" aria-label="Close people">×</button></div><p class="panel-note"><strong id="people-online-label">1 online · you</strong><br>Find players, accept follow requests and manage your connections.</p><div id="people-list"></div></section>
    <section id="task-panel" aria-label="Tasks and challenges"><div class="panel-heading"><span>Tasks &amp; Challenges</span><button id="task-close" class="panel-close" type="button" aria-label="Close tasks">×</button></div><p class="panel-note">Earn points from completed tasks. Each account starts at 0. Level requirements increase as you explore.</p><div id="task-list"></div><div class="challenge-box"><strong>🥥 Coconut Memory</strong><p>Watch the four symbols and repeat their order. Win 20 points, up to five wins per day.</p><button id="challenge-play" type="button">Start memory game</button><div id="coconut-keys" aria-label="Memory game choices"></div><output id="challenge-result" aria-live="polite"></output></div></section>
    <section id="dm-panel" aria-label="Direct message"><div class="panel-heading"><span id="dm-title">Direct message</span><button id="dm-close" class="panel-close" type="button" aria-label="Close direct message">×</button></div><p id="dm-note" class="panel-note">Direct messages unlock after a follow request is accepted.</p><div id="dm-log" aria-live="polite"></div><form id="dm-form"><input id="dm-input" maxlength="240" autocomplete="off" placeholder="Write a direct message"><button class="action-button" type="submit">Send</button></form></section>
    <div id="asset-notice" role="status"></div>
    <div id="toast" role="status" aria-live="polite"></div>
  </div>
  <div id="fallback">Kerala Play could not start. Run npm start in the project folder, open http://localhost:3000 and use a browser with WebGL enabled.</div>
  <div id="avatar-labels" aria-label="Avatars in the world"></div>
  <section id="npc-profile" hidden aria-label="Village guide profile"><button type="button" class="panel-close" aria-label="Close guide profile">×</button><h2></h2><p></p></section>

  <script type="module" src="./boot.js"></script>
</body>
</html>


```

---

## boot.js

```javascript
// Display a useful recovery screen even if a module fails before game.js runs.
import('./game.js').catch(error => {
  console.error('Kerala Play startup failed:', error);
  const fallback = document.querySelector('#fallback');
  fallback.style.display = 'grid';
  fallback.textContent = location.protocol === 'file:'
    ? 'Start Kerala Play with npm start in its project folder, then open http://localhost:3000. Accounts and multiplayer need the included server.'
    : 'Kerala Play could not load. Reload this page. If it continues, restart the server with npm start and check its terminal output.';
});

```

---

## environment.js

```javascript
// A shared visual clock and opt-in soundscape. No downloaded audio or visual assets.
const DAY_LENGTH_MS = 24 * 60 * 1000;
const PREFERENCE_KEY = 'kerala-play:environment:v1';
const QUALITY_LEVELS = ['low', 'balanced', 'high'];

function readPreferences() {
  try { return JSON.parse(localStorage.getItem(PREFERENCE_KEY) || '{}') || {}; }
  catch { return {}; }
}

/** Environment controller; time is game elapsed time, while the sky uses UTC epoch time. */
export function createAtmosphere(THREE, { scene, renderer, camera, sun, hemi }) {
  const preferences = readPreferences();
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  let quality = QUALITY_LEVELS.includes(preferences.quality) ? preferences.quality : (coarsePointer ? 'low' : 'balanced');
  let disposed = false;
  let lastHudMinute = -1;
  let materialTimer = 1;
  let audioEnabled = false;
  let soundscape = null;
  const disposables = [];
  const originalRenderer = { toneMapping: renderer.toneMapping, exposure: renderer.toneMappingExposure, shadows: renderer.shadowMap.enabled, shadowType: renderer.shadowMap.type, pixelRatio: renderer.getPixelRatio() };
  const shadowObjects = [];
  const unlitMaterials = new Map();
  const emissiveMaterials = new Map();
  const seenMaterials = new Set();
  scene.traverse(object => {
    if (!object.isMesh && !object.isSprite) return;
    if (object.isMesh) {
      shadowObjects.push({ object, cast: object.castShadow, receive: object.receiveShadow });
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const opaque = materials.every(material => !material.transparent && !material.wireframe);
      object.castShadow = opaque && (object.geometry?.type !== 'PlaneGeometry' || object.isInstancedMesh);
      object.receiveShadow = opaque;
    }
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material || seenMaterials.has(material)) continue;
      seenMaterials.add(material);
      // Tint unlit photo assets gently at night; labels created later remain legible.
      if (material.color && material.map && (material.isMeshBasicMaterial || material.isSpriteMaterial)) {
        unlitMaterials.set(material, material.color.clone());
      }
      if (material.emissive && material.emissive.getHex() !== 0) {
        emissiveMaterials.set(material, material.emissiveIntensity);
      }
    }
  });
  const sky = new THREE.Group();
  sky.name = 'Shared world atmosphere';
  scene.add(sky);
  const sphereGeometry = new THREE.SphereGeometry(1, 14, 10);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffefd0, fog: false, toneMapped: false, depthWrite: false });
  const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xc8d9f2, fog: false, depthWrite: false });
  const sunDisc = new THREE.Mesh(sphereGeometry, sunMaterial);
  const moonDisc = new THREE.Mesh(sphereGeometry, moonMaterial);
  sunDisc.scale.setScalar(3.2);
  moonDisc.scale.setScalar(1.7);
  sky.add(sunDisc, moonDisc);
  disposables.push(sphereGeometry, sunMaterial, moonMaterial);

  // One draw call for the star field; positions never allocate in the render loop.
  let seed = 72019;
  function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
  const starPositions = new Float32Array(220 * 3);
  for (let index = 0; index < starPositions.length; index += 3) {
    const azimuth = random() * Math.PI * 2;
    const elevation = .08 + random() * .92;
    const horizontal = Math.sqrt(1 - elevation * elevation);
    starPositions[index] = Math.cos(azimuth) * horizontal * 135;
    starPositions[index + 1] = elevation * 135;
    starPositions[index + 2] = Math.sin(azimuth) * horizontal * 135;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xe4efff, size: .3, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false });
  const stars = new THREE.Points(starGeometry, starMaterial);
  stars.frustumCulled = false;
  sky.add(stars);
  disposables.push(starGeometry, starMaterial);

  const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xf1f0ec, transparent: true, opacity: .58, depthWrite: false, fog: false });
  const clouds = new THREE.InstancedMesh(sphereGeometry, cloudMaterial, 18);
  const cloudTransform = new THREE.Object3D();
  for (let index = 0; index < 18; index++) {
    const group = Math.floor(index / 3);
    const angle = group / 6 * Math.PI * 2;
    cloudTransform.position.set(Math.cos(angle) * (73 + group * 4) + (index % 3 - 1) * 5, 23 + group % 3 * 4, Math.sin(angle) * (73 + group * 4));
    cloudTransform.scale.set(7 + random() * 3, 1.4 + random(), 3.8 + random() * 2);
    cloudTransform.updateMatrix();
    clouds.setMatrixAt(index, cloudTransform.matrix);
  }
  clouds.frustumCulled = false;
  clouds.instanceMatrix.needsUpdate = true;
  sky.add(clouds);
  disposables.push(cloudMaterial);

  const moonLight = new THREE.DirectionalLight(0x8cacff, .35);
  scene.add(moonLight, moonLight.target);
  const originalSun = sun ? {
    intensity: sun.intensity, color: sun.color.clone(), position: sun.position.clone(), castShadow: sun.castShadow,
    targetPosition: sun.target.position.clone(), targetParent: sun.target.parent,
    shadow: sun.shadow ? { camera: sun.shadow.camera.clone(), size: sun.shadow.mapSize.clone(), bias: sun.shadow.bias, normalBias: sun.shadow.normalBias } : null
  } : null;
  const originalHemi = hemi ? { intensity: hemi.intensity, color: hemi.color.clone(), groundColor: hemi.groundColor.clone() } : null;
  const originalBackground = scene.background?.clone ? scene.background.clone() : scene.background;
  const originalFog = scene.fog?.clone ? scene.fog.clone() : scene.fog;
  if (!scene.background?.isColor) scene.background = new THREE.Color();
  if (!scene.fog?.isFog) scene.fog = new THREE.Fog(0x92c9ff, 50, 150);
  if (sun?.shadow) {
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    sun.shadow.camera.near = .1;
    sun.shadow.camera.far = 130;
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -.00035;
    sun.shadow.normalBias = .08;
    sun.shadow.mapSize.set(1024, 1024);
    if (!sun.target.parent) scene.add(sun.target);
  }
  const daySky = new THREE.Color(0x97ccee);
  const nightSky = new THREE.Color(0x101d36);
  const duskSky = new THREE.Color(0xc68f84);
  const daylightColor = new THREE.Color(0xeaf5ff);
  const nightLightColor = new THREE.Color(0x98b4e3);
  const warmColor = new THREE.Color(0xffc797);
  const whiteColor = new THREE.Color(0xfff2d9);
  const groundDay = new THREE.Color(0x647d42);
  const groundNight = new THREE.Color(0x303d50);
  const lightDirection = new THREE.Vector3();
  const target = new THREE.Vector3();

  const style = document.createElement('style');
  style.textContent = `
    #world-time { position:fixed; z-index:4; top:calc(env(safe-area-inset-top) + 15px); left:50%; transform:translateX(-50%); border:1px solid #ffffff2d; border-radius:10px; padding:7px 10px; background:#0b232dcc; color:#e7f2ff; font:700 11px/1.4 Arial,sans-serif; pointer-events:none; white-space:nowrap; }
    #world-settings { position:fixed; z-index:6; bottom:calc(env(safe-area-inset-bottom) + 20px); left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:5px; padding:5px; border:1px solid #ffffff2d; border-radius:12px; background:#0b232dd9; color:white; font:11px Arial,sans-serif; pointer-events:auto; touch-action:manipulation; }
    #world-settings button,#world-settings select { min-height:32px; max-width:100px; border:1px solid #ffffff36; border-radius:7px; padding:5px 7px; background:#193d46; color:#fff; font:inherit; touch-action:manipulation; cursor:pointer; }
    #world-settings button[aria-pressed="true"] { background:#237650; }
    #world-settings :focus-visible { outline:2px solid #9be7c1; outline-offset:2px; }
    #world-settings label { display:flex; align-items:center; gap:5px; }
    #world-audio-status { position:absolute; width:1px; height:1px; padding:0; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
    @media(max-width:979px) { #world-time { top:calc(env(safe-area-inset-top) + 65px); left:auto; right:74px; transform:none; } }
    @media(max-width:560px) { #world-time { max-width:132px; font-size:10px; padding:6px 7px; } #world-settings { top:calc(env(safe-area-inset-top) + 103px); bottom:auto; right:74px; left:auto; transform:none; display:grid; width:125px; padding:5px; } #world-settings button,#world-settings select { max-width:none; width:100%; min-height:29px; } #world-settings label span { display:none; } }
    @media(max-width:369px) { #world-time { top:calc(env(safe-area-inset-top) + 230px); left:16px; right:auto; } #world-settings { top:calc(env(safe-area-inset-top) + 263px); left:16px; right:auto; width:135px; display:flex; } #world-settings button { max-width:65px; } #world-settings select { width:53px; } }
    @media(max-height:480px) and (min-width:561px) { #world-settings { bottom:8px; padding:3px; } }
  `;
  document.head.append(style);
  const clockOutput = document.createElement('output');
  clockOutput.id = 'world-time';
  clockOutput.title = 'Shared world time · one full day every 24 real minutes · based on device UTC clock';
  clockOutput.setAttribute('aria-label', 'World time');
  const settings = document.createElement('div');
  settings.id = 'world-settings';
  settings.setAttribute('aria-label', 'World sound and graphics');
  settings.innerHTML = '<button type="button" id="world-sound" aria-pressed="false">Sound off</button><label><span>Graphics</span><select id="world-quality" aria-label="Graphics quality"><option value="low">Low</option><option value="balanced">Balanced</option><option value="high">High</option></select></label><output id="world-audio-status" role="status"></output>';
  (document.querySelector('#hud') || document.body).append(clockOutput, settings);
  const soundButton = settings.querySelector('#world-sound');
  const qualitySelect = settings.querySelector('#world-quality');
  const audioStatus = settings.querySelector('#world-audio-status');
  if (preferences.sound) soundButton.textContent = 'Resume sound';
  soundButton.title = 'Enable birds, water, night insects, and gentle music';

  function savePreferences() {
    try { localStorage.setItem(PREFERENCE_KEY, JSON.stringify({ quality, sound: audioEnabled })); } catch { /* Storage can be unavailable in private mode. */ }
  }
  function applyQuality() {
    const maxRatio = quality === 'low' ? .85 : quality === 'high' ? 1.6 : 1.2;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, maxRatio));
    renderer.shadowMap.enabled = quality === 'high';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.needsUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    if (sun) sun.castShadow = quality === 'high';
    stars.visible = quality !== 'low';
    clouds.visible = quality !== 'low';
    qualitySelect.value = quality;
  }
  function setQuality(value) {
    if (!QUALITY_LEVELS.includes(value) || disposed) return;
    quality = value;
    applyQuality();
    savePreferences();
  }
  qualitySelect.addEventListener('change', () => setQuality(qualitySelect.value));
  async function toggleSound() {
    if (disposed) return;
    soundButton.disabled = true;
    try {
      if (audioEnabled) {
        audioEnabled = false;
        await soundscape?.suspend();
      } else {
        soundscape ||= createSoundscape();
        await soundscape.resume();
        if (disposed) { await soundscape.dispose(); return; }
        audioEnabled = true;
        if (document.hidden) await soundscape.suspend();
      }
      audioStatus.textContent = audioEnabled ? 'World sound enabled.' : 'World sound muted.';
    } catch {
      audioEnabled = false;
      audioStatus.textContent = 'Sound could not start. Tap Sound off to try again.';
    } finally {
      soundButton.textContent = audioEnabled ? 'Sound on' : 'Sound off';
      soundButton.setAttribute('aria-pressed', String(audioEnabled));
      soundButton.disabled = false;
      savePreferences();
    }
  }
  soundButton.addEventListener('click', toggleSound);
  async function visibilityChanged() {
    if (!soundscape || !audioEnabled) return;
    try {
      if (document.hidden) await soundscape.suspend();
      else {
        await soundscape.resume();
        if (document.hidden) await soundscape.suspend();
      }
    } catch {
      audioEnabled = false;
      soundButton.textContent = 'Resume sound';
      soundButton.setAttribute('aria-pressed', 'false');
    }
  }
  document.addEventListener('visibilitychange', visibilityChanged);
  applyQuality();

  function update(delta, time, { moving = false, running = false, nearWater = false, inChallenge = false } = {}) {
    if (disposed) return;
    const worldMinute = ((Date.now() % DAY_LENGTH_MS) + DAY_LENGTH_MS) % DAY_LENGTH_MS / 1000;
    const hour = worldMinute / 60;
    const angle = (hour - 6) / 24 * Math.PI * 2;
    const elevation = Math.sin(angle);
    const daylight = THREE.MathUtils.smoothstep(elevation, -.15, .28);
    const twilight = Math.max(0, 1 - Math.abs(elevation) / .42) * .58;
    scene.background.copy(nightSky).lerp(daySky, daylight).lerp(duskSky, twilight);
    scene.fog.color.copy(scene.background);
    scene.fog.near = 42 + daylight * 15;
    scene.fog.far = 120 + daylight * 38;
    sky.position.copy(camera.position);
    lightDirection.set(Math.cos(angle) * .84, elevation, Math.cos(angle) * .54).normalize();
    sunDisc.position.copy(lightDirection).multiplyScalar(120);
    moonDisc.position.copy(lightDirection).multiplyScalar(-120);
    sunDisc.visible = elevation > -.08;
    moonDisc.visible = elevation < .08;
    starMaterial.opacity = (1 - daylight) * .88;
    clouds.rotation.y = worldMinute / 1440 * Math.PI * 2;
    cloudMaterial.color.copy(nightLightColor).lerp(whiteColor, daylight).lerp(warmColor, twilight).multiplyScalar(.35 + daylight * .65);
    target.set(camera.position.x, 0, camera.position.z);
    if (sun) {
      sun.color.copy(whiteColor).lerp(warmColor, twilight);
      sun.intensity = Math.max(0, elevation) * 1.7 + daylight * .28;
      sun.position.copy(target).addScaledVector(lightDirection, 75);
      // Keep its shadow camera above ground while the light fades out at the horizon.
      sun.position.y = Math.max(8, sun.position.y);
      sun.target.position.copy(target);
    }
    if (hemi) {
      hemi.intensity = .65 + daylight * 1.5;
      hemi.color.copy(nightLightColor).lerp(daylightColor, daylight);
      hemi.groundColor.copy(groundNight).lerp(groundDay, daylight);
    }
    moonLight.intensity = (1 - daylight) * .38;
    moonLight.position.copy(target).addScaledVector(lightDirection, -70);
    moonLight.position.y = Math.max(15, moonLight.position.y);
    moonLight.target.position.copy(target);
    materialTimer += delta;
    if (materialTimer >= .4) {
      materialTimer = 0;
      for (const [material, color] of unlitMaterials) material.color.copy(color).multiplyScalar(.5 + daylight * .5);
      for (const [material, intensity] of emissiveMaterials) material.emissiveIntensity = intensity + (1 - daylight) * .65;
    }
    const minute = Math.floor(worldMinute);
    if (minute !== lastHudMinute) {
      lastHudMinute = minute;
      const period = hour < 5 || hour >= 19 ? 'Night' : hour < 8 ? 'Dawn' : hour < 16.5 ? 'Day' : 'Evening';
      const icon = period === 'Night' ? '☾' : period === 'Day' ? '☀' : '◐';
      clockOutput.textContent = `${icon} ${period} · ${String(Math.floor(hour)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    }
    if (audioEnabled && !document.hidden) soundscape?.update({ daylight, moving, running, nearWater, inChallenge });
  }
  update(0, 0);

  function dispose() {
    if (disposed) return;
    disposed = true;
    document.removeEventListener('visibilitychange', visibilityChanged);
    soundscape?.dispose();
    settings.remove(); clockOutput.remove(); style.remove();
    scene.remove(sky, moonLight, moonLight.target);
    for (const item of disposables) item.dispose();
    for (const { object, cast, receive } of shadowObjects) { object.castShadow = cast; object.receiveShadow = receive; }
    for (const [material, color] of unlitMaterials) material.color.copy(color);
    for (const [material, intensity] of emissiveMaterials) material.emissiveIntensity = intensity;
    renderer.toneMapping = originalRenderer.toneMapping;
    renderer.toneMappingExposure = originalRenderer.exposure;
    renderer.shadowMap.enabled = originalRenderer.shadows;
    renderer.shadowMap.type = originalRenderer.shadowType;
    renderer.setPixelRatio(originalRenderer.pixelRatio);
    scene.background = originalBackground;
    scene.fog = originalFog;
    if (sun && originalSun) {
      sun.intensity = originalSun.intensity;
      sun.color.copy(originalSun.color);
      sun.position.copy(originalSun.position);
      sun.castShadow = originalSun.castShadow;
      sun.target.position.copy(originalSun.targetPosition);
      if (!originalSun.targetParent) scene.remove(sun.target);
      if (sun.shadow && originalSun.shadow) {
        sun.shadow.camera.copy(originalSun.shadow.camera);
        sun.shadow.mapSize.copy(originalSun.shadow.size);
        sun.shadow.bias = originalSun.shadow.bias;
        sun.shadow.normalBias = originalSun.shadow.normalBias;
      }
    }
    if (hemi && originalHemi) { hemi.intensity = originalHemi.intensity; hemi.color.copy(originalHemi.color); hemi.groundColor.copy(originalHemi.groundColor); }
  }
  return { update, dispose, setQuality, applyQuality, get quality() { return quality; } };
}

function createSoundscape() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) throw new Error('Web Audio is unavailable');
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = .24;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -20;
  limiter.ratio.value = 4;
  master.connect(limiter).connect(context.destination);
  const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  let smoothed = 0;
  for (let index = 0; index < noiseData.length; index++) {
    smoothed = (smoothed + Math.random() * .08 - .04) / 1.02;
    noiseData[index] = smoothed * 4;
  }
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const waterFilter = context.createBiquadFilter();
  waterFilter.type = 'bandpass';
  waterFilter.frequency.value = 850;
  waterFilter.Q.value = .6;
  const water = context.createGain();
  water.gain.value = 0;
  noise.connect(waterFilter).connect(water).connect(master);
  const windFilter = context.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 330;
  const wind = context.createGain();
  wind.gain.value = .06;
  noise.connect(windFilter).connect(wind).connect(master);
  noise.start();
  const active = new Set();
  let nextBird = 0;
  let nextCricket = 0;
  let nextNote = 0;
  let sequence = 0;
  let closed = false;

  function note(frequency, duration, volume, delay = 0, endFrequency = frequency, type = 'sine') {
    if (closed || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + Math.min(.035, duration / 3));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(master);
    active.add(oscillator);
    oscillator.onended = () => { active.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  }
  function update({ daylight, moving, running, nearWater, inChallenge }) {
    if (closed || context.state !== 'running') return;
    const now = context.currentTime;
    water.gain.setTargetAtTime(nearWater ? .65 : 0, now, .8);
    wind.gain.setTargetAtTime(running && moving ? .09 : .045, now, .7);
    if (daylight > .45 && now >= nextBird) {
      const pitch = 1800 + Math.random() * 1100;
      note(pitch, .18, .085 * daylight, 0, pitch * 1.35);
      note(pitch * 1.25, .22, .06 * daylight, .2, pitch * .82);
      nextBird = now + 3 + Math.random() * 5;
    }
    if (daylight < .55 && now >= nextCricket) {
      for (let count = 0; count < 3; count++) note(3800, .08, .048 * (1 - daylight), count * .15, 3650);
      nextCricket = now + 1.3 + Math.random() * 1.8;
    }
    if (now >= nextNote) {
      const notes = inChallenge ? [293.66, 392, 440, 493.88, 587.33, 440, 392, 329.63]
        : running && moving ? [196, 293.66, 329.63, 392, 293.66, 246.94]
          : [196, 246.94, 293.66, 392, 329.63, 293.66, 246.94, 0];
      const pitch = notes[sequence++ % notes.length];
      if (pitch) note(pitch * (daylight < .4 ? .75 : 1), .85, inChallenge ? .095 : .065, 0, pitch * (daylight < .4 ? .75 : 1), 'triangle');
      nextNote = now + (inChallenge ? .38 : running && moving ? .5 : moving ? .95 : 1.5);
    }
  }
  async function resume() {
    if (closed) return;
    await context.resume();
    if (context.state !== 'running') throw new Error('Audio awaits a user gesture');
    nextBird = context.currentTime + .7;
    nextCricket = context.currentTime + .7;
    nextNote = context.currentTime + .2;
  }
  async function suspend() { if (!closed && context.state !== 'closed') await context.suspend(); }
  async function dispose() {
    if (closed) return;
    closed = true;
    for (const oscillator of active) { try { oscillator.stop(); } catch { /* Already ended. */ } }
    noise.stop();
    noise.disconnect();
    await context.close().catch(() => {});
  }
  return { update, resume, suspend, dispose };
}

```

---

## game.js

```javascript
import * as THREE from './vendor/three.module.js';
import { initSocial, api } from './social.js';
import { createAtmosphere } from './environment.js';

const fallback = document.querySelector('#fallback');
const joystickZone = document.querySelector('#joystick-zone');
const joystickBase = document.querySelector('#joystick-base');
const joystickKnob = document.querySelector('#joystick-knob');
const cameraZone = document.querySelector('#camera-zone');
const runButton = document.querySelector('#run');
const profileName = document.querySelector('#profile-name');
const profileDistrict = document.querySelector('#profile-district');
const profileChip = document.querySelector('#profile-chip');
const progressChip = document.querySelector('#progress-chip');
const onlineCount = document.querySelector('#online-count');
const mapLayer = document.querySelector('#landmark-layer');
const mapPlayer = document.querySelector('#map-player');
const mapRoute = document.querySelector('#map-route');
const mapStatus = document.querySelector('#map-status');
const minimap = document.querySelector('#minimap');
const mapOpen = document.querySelector('#map-open');
const mapClose = document.querySelector('#map-close');
const mapLabelToggle = document.querySelector('#map-label-toggle');
const missionText = document.querySelector('#mission-text');
const landmarkStatus = document.querySelector('#landmark-status');
const missionCard = document.querySelector('#mission-card');
const chatToggle = document.querySelector('#chat-toggle');
const chatPanel = document.querySelector('#chat-panel');
const chatClose = document.querySelector('#chat-close');
const chatChannel = document.querySelector('#chat-channel');
const chatLog = document.querySelector('#chat-log');
const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const peopleToggle = document.querySelector('#people-toggle');
const peoplePanel = document.querySelector('#people-panel');
const peopleClose = document.querySelector('#people-close');
const peopleList = document.querySelector('#people-list');
const peopleOnlineLabel = document.querySelector('#people-online-label');
const taskToggle = document.querySelector('#task-toggle');
const fullscreenToggle = document.querySelector('#fullscreen-toggle');
const taskPanel = document.querySelector('#task-panel');
const taskClose = document.querySelector('#task-close');
const taskList = document.querySelector('#task-list');
const challengePlay = document.querySelector('#challenge-play');
const challengeResult = document.querySelector('#challenge-result');
const dmPanel = document.querySelector('#dm-panel');
const dmClose = document.querySelector('#dm-close');
const dmTitle = document.querySelector('#dm-title');
const dmLog = document.querySelector('#dm-log');
const dmForm = document.querySelector('#dm-form');
const dmInput = document.querySelector('#dm-input');
const assetNotice = document.querySelector('#asset-notice');
const toast = document.querySelector('#toast');
document.querySelector('#hud').append(document.querySelector('#avatar-labels'));
const villagers = [];
const traffic = [];
const fruitGeometry = new THREE.SphereGeometry(.14, 6, 5);
const fruitMaterial = new THREE.MeshStandardMaterial({ color: 0xe4a737, roughness: .72 });
const birdBodyGeometry = new THREE.SphereGeometry(.10, 6, 5);
const birdWingGeometry = new THREE.PlaneGeometry(.28, .055);
const birdMaterial = new THREE.MeshBasicMaterial({ color: 0x202724, side: THREE.DoubleSide });
let villageTime = 0;
let playerRef = null;
let selectedLandmark = null;
let mapLabelsVisible = false;
let activeDmContact = null;
let profile = null;
let progress = newProgress();
let social = null;
let sceneRef = null;
let atmosphere = null;
let connectionReady = false;
const remotePlayers = new Map();
const claimPending = new Set();
let lastMovementSend = 0;
let movementPending = false;
let lastProgressRefresh = 0;
let lastMoveError = 0;
const labelPosition = new THREE.Vector3();
const labelWorldPosition = new THREE.Vector3();
const pointerOrigin = new Map();
let challengeRound = null;
let challengeGeneration = 0;
const districtStarts = {
  Alappuzha: [-34, -13], Ernakulam: [-26, 6], Idukki: [42, 26], Kannur: [-10, 47], Kasaragod: [-7, 60], Kollam: [5, -45], Kottayam: [7, -23], Kozhikode: [-6, 35], Malappuram: [-16, 23], Palakkad: [28, 10], Pathanamthitta: [14, -34], Thiruvananthapuram: [13, -57], Thrissur: [-4, 14], Wayanad: [-19, 44]
};
const landmarks = [
  { id: 'bekal', name: 'Bekal Fort', icon: 'F', x: -7, z: 60, district: 'Kasaragod' },
  { id: 'munnar', name: 'Munnar Tea Hills', icon: 'M', x: 42, z: 26, district: 'Idukki' },
  { id: 'kochi', name: 'Mattancherry Palace', icon: 'P', x: -26, z: 6, district: 'Ernakulam' },
  { id: 'alappuzha', name: 'Alappuzha Backwaters', icon: 'B', x: -34, z: -13, district: 'Alappuzha' },
  { id: 'kuttanad', name: 'Kuttanad Fields', icon: 'K', x: 7, z: -23, district: 'Kottayam' },
  { id: 'temple', name: 'Padmanabhaswamy Temple', icon: 'T', x: 13, z: -57, district: 'Thiruvananthapuram' }
];
const taskCatalog = [
  { id: 'open-map', title: 'Open the Kerala map', target: 1, reward: 10 },
  { id: 'walk-50', title: 'Walk 50 metres', target: 50, reward: 25 },
  { id: 'visit-landmark', title: 'Visit one landmark', target: 1, reward: 50 },
  { id: 'walk-250', title: 'Take a village stroll', target: 250, reward: 75 },
  { id: 'discover-3', title: 'Discover three landmarks', target: 3, reward: 100 },
  { id: 'walk-500', title: 'Complete a Kerala road trip', target: 500, reward: 150 },
  { id: 'discover-5', title: 'Become a landmark explorer', target: 5, reward: 200 },
  { id: 'social', title: 'Make an accepted connection', target: 1, reward: 35 }
];


window.addEventListener('error', event => {
  console.error(event.error || event.message);
  showAssetNotice('A game error occurred. Reload if the controls stop responding.');
});
window.addEventListener('unhandledrejection', event => {
  console.error(event.reason);
  showAssetNotice('An action could not finish. Please try again.');
});

function newProgress() {
  return { xp: 0, level: 1, walkMeters: 0, visitedLandmarkIds: [], completedTaskIds: [], followingIds: [] };
}

function acceptUser(user) {
  const previous = profile;
  profile = user;
  progress = user ? { xp: user.points || 0, level: user.level || 1, walkMeters: user.walkMeters || 0,
    visitedLandmarkIds: user.visitedLandmarks || [], completedTaskIds: user.completedTasks || [], followingIds: [] } : newProgress();
  updateProfileHud(); updateProgressHud(); renderTasks();
  if (playerRef) {
    playerRef.visible = !!user;
    if (user && (!previous || previous.gender !== user.gender)) replacePlayerAvatar(user.gender);
    if (user && (!previous || previous.id !== user.id || previous.district !== user.district)) {
      if (Number.isFinite(user.x) && Number.isFinite(user.z)) playerRef.position.set(user.x, 0, user.z);
      else placePlayerAtDistrict(user.district);
    }
    updateNameLabel(playerRef, user?.username || '', user?.id);
  }
  if (!user) {
    connectionReady = false;
    synchronizePlayers([]);
    challengeGeneration++;
    challengeRound = null;
    challengePlay.disabled = false;
    document.querySelector('#coconut-keys')?.replaceChildren();
    challengeResult.textContent = '';
  } else if ((user.followers || 0) + (user.following || 0) > 0) finishTask('social');
}


function xpState(totalXp = progress.xp) {
  let level = 1;
  let used = 0;
  let next = 100;
  const total = Math.max(0, Math.floor(totalXp));
  while (total - used >= next) {
    used += next;
    level += 1;
    next = 100 + (level - 1) * 50;
  }
  return { level, current: total - used, next };
}

function updateProgressHud() {
  const state = xpState();
  progress.level = state.level;
  progressChip.textContent = `Lv. ${state.level} · ${progress.xp} points`;
  progressChip.title = `${state.current} / ${state.next} points toward level ${state.level + 1}`;
}



function showToast(message) {
  toast.textContent = message;
  toast.style.display = 'block';
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.style.display = 'none'; }, 2600);
}

function taskProgress(task) {
  if (progress.completedTaskIds.includes(task.id)) return task.target;
  if (task.id === 'walk-50' || task.id === 'walk-250' || task.id === 'walk-500') return Math.min(task.target, Math.floor(progress.walkMeters));
  if (task.id === 'visit-landmark' || task.id === 'discover-3' || task.id === 'discover-5') return Math.min(task.target, progress.visitedLandmarkIds.length);
  if (task.id === 'social') return Math.min(task.target, (profile?.followers || 0) + (profile?.following || 0));
  return 0;
}

function renderTasks() {
  taskList.replaceChildren();
  taskCatalog.forEach(task => {
    const done = progress.completedTaskIds.includes(task.id);
    const card = document.createElement('div');
    card.className = `task-card${done ? ' done' : ''}`;
    const title = document.createElement('strong');
    title.textContent = `${done ? '✓ ' : ''}${task.title}`;
    const details = document.createElement('small');
    details.textContent = done ? `Completed · +${task.reward} points` : `${taskProgress(task)} / ${task.target} · reward ${task.reward} points`;
    const meter = document.createElement('progress');
    meter.max = task.target;
    meter.value = taskProgress(task);
    card.append(title, details, meter);
    taskList.append(card);
  });
}

async function finishTask(taskId) {
  if (!profile || claimPending.has(taskId) || progress.completedTaskIds.includes(taskId)) return false;
  const task = taskCatalog.find(item => item.id === taskId);
  if (!task) return false;
  claimPending.add(taskId);
  const before = progress.level;
  const userId = profile.id;
  try {
    await api('/api/tasks/' + taskId + '/claim', {});
    if (profile?.id !== userId) return false;
    await social.refreshUser();
    showToast(progress.level > before ? 'Level ' + progress.level + '! +' + task.reward + ' points' : '+' + task.reward + ' points · ' + task.title);
    return true;
  } catch (error) {
    if (profile?.id !== userId) return false;
    // Position-based tasks may become eligible on the next server movement acknowledgement.
    if (taskId === 'open-map') showToast(error.message);
    return false;
  } finally { claimPending.delete(taskId); }
}

function addWalkProgress() { /* Distance and task eligibility are measured by the server. */ }

function markLandmarkVisited() {
  if (!progress.completedTaskIds.includes('visit-landmark')) finishTask('visit-landmark');
}


function updateProfileHud() {
  profileName.textContent = profile?.username || 'Sign in';
  profileDistrict.textContent = profile?.district ? `${profile.district} · ${profile.gender === 'female' ? 'Female' : 'Male'} avatar` : 'Choose your district';
}

function disposeObject(object) {
  const geometries = new Set(), materials = new Set();
  object.traverse(child => {
    if (child.geometry) geometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) if (material) materials.add(material);
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

function updateNameLabel(object, name, id) {
  if (!object.userData.label) {
    const label = document.createElement('button');
    label.className = 'avatar-name'; label.type = 'button'; label.hidden = true;
    label.addEventListener('click', event => { event.stopPropagation(); inspectAvatar(object); });
    document.querySelector('#avatar-labels').append(label);
    object.userData.label = label;
  }
  object.userData.playerId = id;
  const label = object.userData.label;
  label.textContent = name;
  label.setAttribute('aria-label', 'View ' + name + ' profile');
}

function inspectAvatar(object) {
  if (object.userData.npc) {
    const panel = document.querySelector('#npc-profile');
    panel.querySelector('h2').textContent = object.userData.name;
    panel.querySelector('p').textContent = 'Village guide · ' + (object.userData.gender === 'female' ? 'Female' : 'Male') + ' avatar. I live in the village and help bring Kerala to life. Find real players in People to follow and chat.';
    panel.hidden = false;
    panel.querySelector('button').focus();
  } else if (object.userData.playerId) social.openProfile(object.userData.playerId);
}

function synchronizePlayers(players) {
  if (!sceneRef) return;
  const keep = new Set();
  for (const data of players) {
    if (!data.id || data.id === profile?.id || !Number.isFinite(data.x) || !Number.isFinite(data.z)) continue;
    keep.add(data.id);
    let remote = remotePlayers.get(data.id);
    if (remote && remote.userData.gender !== data.gender) {
      sceneRef.remove(remote); remote.userData.label?.remove(); disposeObject(remote);
      remotePlayers.delete(data.id); remote = null;
    }
    if (!remote) {
      remote = new THREE.Group();
      const avatar = createHuman({ gender: data.gender, shirt: data.gender === 'female' ? 0xc57e93 : 0x569bb5,
        trousers: 0x293b50, skin: 0xa96d4c, hair: 0x1b1412, shoes: 0x2c2825, accent: 0xe5bb51 });
      remote.add(avatar); remote.position.set(data.x, 0, data.z);
      remote.userData = { avatar, gender: data.gender, phase: 0, target: new THREE.Vector3() };
      sceneRef.add(remote); remotePlayers.set(data.id, remote);
    }
    remote.userData.target.set(data.x, 0, data.z);
    remote.userData.yaw = Number(data.rotation) || 0;
    remote.userData.moving = !!data.moving;
    updateNameLabel(remote, data.username, data.id);
  }
  for (const [id, remote] of remotePlayers) if (!keep.has(id)) {
    sceneRef.remove(remote); remote.userData.label?.remove(); disposeObject(remote); remotePlayers.delete(id);
  }
}

function updateRemotePlayers(delta, camera) {
  for (const remote of remotePlayers.values()) {
    remote.position.lerp(remote.userData.target, 1 - Math.exp(-delta * 12));
    remote.rotation.y = rotateTowards(remote.rotation.y, remote.userData.yaw, delta * 12);
    remote.userData.phase += delta * 9;
    animatePlayer(remote, remote.userData.phase, remote.userData.moving ? 1 : 0);
  }
  camera.updateMatrixWorld();
  for (const object of [playerRef, ...villagers, ...remotePlayers.values()]) {
    if (!object?.userData.label) continue;
    const label = object.userData.label;
    object.getWorldPosition(labelWorldPosition);
    const distance = camera.position.distanceTo(labelWorldPosition);
    labelPosition.copy(labelWorldPosition); labelPosition.y += 2.65;
    labelPosition.project(camera);
    const visible = !!profile && object.visible && !!label.textContent && distance < 45 && labelPosition.z > -1 && labelPosition.z < 1 && Math.abs(labelPosition.x) < .95 && Math.abs(labelPosition.y) < .93;
    label.hidden = !visible;
    if (visible) label.style.transform = 'translate(-50%, -100%) translate(' + ((labelPosition.x + 1) * innerWidth / 2).toFixed(1) + 'px,' + ((1 - labelPosition.y) * innerHeight / 2).toFixed(1) + 'px)';
  }
}

async function sendMovement(player, moving) {
  const now = performance.now();
  if (!profile || !connectionReady || document.hidden || movementPending || now - lastMovementSend < (moving ? 250 : 1500)) return;
  movementPending = true; lastMovementSend = now;
  const userId = profile.id;
  try {
    const result = await api('/api/world/move', { x: player.position.x, z: player.position.z, rotation: player.rotation.y, moving });
    if (profile?.id !== userId) return;
    if (result.user) acceptUser(result.user);
    if (now - lastProgressRefresh > 3000) {
      lastProgressRefresh = now;
      await social.refreshUser();
      if (progress.walkMeters >= 50) finishTask('walk-50');
      if (progress.walkMeters >= 250) finishTask('walk-250');
      if (progress.walkMeters >= 500) finishTask('walk-500');
      if (selectedLandmark && Math.hypot(player.position.x - selectedLandmark.x, player.position.z - selectedLandmark.z) < 5.2) finishTask('visit-landmark');
      if (progress.visitedLandmarkIds.length >= 3) finishTask('discover-3');
      if (progress.visitedLandmarkIds.length >= 5) finishTask('discover-5');
    }
  } catch (error) {
    if (profile?.id !== userId) return;
    if (error.status === 400 || error.status === 409) {
      await social.refreshUser().catch(() => {});
      if (Number.isFinite(profile?.x) && Number.isFinite(profile?.z)) player.position.set(profile.x, 0, profile.z);
    }
    if (now - lastMoveError > 10000) { showToast('World sync: ' + error.message); lastMoveError = now; }
  } finally { movementPending = false; }
}



function placePlayerAtDistrict(district) {
  const start = districtStarts[district] || [0, 0];
  playerRef.position.set(start[0] + 12, 0, start[1]);
  updateMapPlayer(playerRef);
}

function showAssetNotice(message) {
  assetNotice.textContent = message;
  assetNotice.style.display = 'block';
  clearTimeout(showAssetNotice.timer);
  showAssetNotice.timer = setTimeout(() => { assetNotice.style.display = 'none'; }, 5200);
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function worldToKeralaMap(worldX, worldZ) {
  const bands = [[0,52,7],[.12,56,13],[.28,60,19],[.44,62,20],[.60,65,20],[.76,62,18],[.90,58,14],[1,54,7]];
  const t = clamp((70 - worldZ) / 140, 0, 1);
  let index = 0;
  while (index < bands.length - 2 && t > bands[index + 1][0]) index++;
  const [t0, center0, half0] = bands[index];
  const [t1, center1, half1] = bands[index + 1];
  const localT = (t - t0) / (t1 - t0);
  return { x: lerp(center0, center1, localT) + clamp(worldX / 70, -1, 1) * (lerp(half0, half1, localT) - 4), y: 16 + t * 268 };
}

function renderMapLandmarks() {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  mapLayer.replaceChildren();
  landmarks.forEach(landmark => {
    const point = worldToKeralaMap(landmark.x, landmark.z);
    const marker = document.createElementNS(svgNamespace, 'g');
    marker.setAttribute('class', 'landmark-marker');
    marker.setAttribute('transform', `translate(${point.x} ${point.y})`);
    marker.setAttribute('aria-label', landmark.name);
    const pin = document.createElementNS(svgNamespace, 'circle');
    pin.setAttribute('class', 'pin'); pin.setAttribute('r', '5.8');
    const label = document.createElementNS(svgNamespace, 'text');
    label.textContent = landmark.icon;
    const caption = document.createElementNS(svgNamespace, 'text');
    caption.textContent = landmark.name.replace('Padmanabhaswamy ', '').replace('Mattancherry ', '');
    caption.setAttribute('y', '11'); caption.setAttribute('font-size', '5.2'); caption.setAttribute('fill', '#fff'); caption.setAttribute('text-anchor', 'middle');
    caption.style.display = mapLabelsVisible ? 'block' : 'none';
    marker.append(pin, label, caption);
    marker.addEventListener('click', event => { event.stopPropagation(); setWaypoint(landmark); });
    mapLayer.append(marker);
  });
}

function setWaypoint(landmark) {
  selectedLandmark = landmark;
  missionText.textContent = `Travel to ${landmark.name}`;
  landmarkStatus.textContent = `${landmark.district} landmark selected`;
  if (playerRef) updateMapPlayer(playerRef);
}

function updateMapPlayer(player) {
  const point = worldToKeralaMap(player.position.x, player.position.z);
  const angle = player.rotation.y * 180 / Math.PI;
  mapPlayer.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
  if (selectedLandmark) {
    const activeLandmark = selectedLandmark;
    const target = worldToKeralaMap(activeLandmark.x, activeLandmark.z);
    mapRoute.setAttribute('x1', point.x); mapRoute.setAttribute('y1', point.y);
    mapRoute.setAttribute('x2', target.x); mapRoute.setAttribute('y2', target.y);
    mapRoute.hidden = false;
    const distance = Math.hypot(activeLandmark.x - player.position.x, activeLandmark.z - player.position.z);
    if (distance < 5.2) {
      markLandmarkVisited(activeLandmark);
      selectedLandmark = null;
      missionText.textContent = `Visited ${activeLandmark.name}`;
      landmarkStatus.textContent = 'Landmark reward collected · choose another place';
      mapRoute.hidden = true;
      mapStatus.textContent = `${activeLandmark.name} · visited`;
    } else {
      mapStatus.textContent = `${activeLandmark.name} · ${Math.ceil(distance)} m`;
    }
  } else {
    mapRoute.hidden = true;
    mapStatus.textContent = `${profile?.district || 'Kerala'} · You`;
  }
}



function setOpenPanel(which = null) {
  social?.closePanels();
  if (which !== 'tasks' && challengeRound) {
    challengeGeneration++; challengeRound = null; challengePlay.disabled = false;
    document.querySelector('#coconut-keys').replaceChildren(); challengeResult.textContent = '';
  }
  const panels = { map: minimap, people: peoplePanel, chat: chatPanel, tasks: taskPanel, dm: dmPanel };
  Object.entries(panels).forEach(([name, panel]) => panel.classList.toggle('open', name === which));
  mapOpen.setAttribute('aria-expanded', String(which === 'map'));
  peopleToggle.setAttribute('aria-expanded', String(which === 'people'));
  chatToggle.setAttribute('aria-expanded', String(which === 'chat'));
  taskToggle.setAttribute('aria-expanded', String(which === 'tasks'));
  if (which === 'map') finishTask('open-map');
  if (which === 'tasks') renderTasks();
}

async function playCoconutChallenge() {
  if (!profile || challengeRound) return;
  const generation = ++challengeGeneration;
  challengePlay.disabled = true;
  const keys = document.querySelector('#coconut-keys');
  keys.replaceChildren();
  challengeResult.textContent = 'Getting a fresh pattern…';
  try {
    const round = await api('/api/games/coconut/start', {});
    if (generation !== challengeGeneration) return;
    challengeRound = { ...round, answers: [], accepting: false };
    const labels = ['🥥', '🌴', '🌺', '🥭'];
    for (let i = 0; i < 4; i++) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = labels[i]; button.disabled = true;
      button.setAttribute('aria-label', ['Coconut', 'Palm', 'Flower', 'Mango'][i]);
      button.addEventListener('click', () => answerCoconut(i, generation));
      keys.append(button);
    }
    challengeResult.textContent = 'Watch the pattern, then repeat it.';
    for (const value of round.sequence) {
      await new Promise(resolve => setTimeout(resolve, 350));
      if (generation !== challengeGeneration) return;
      keys.children[value].classList.add('lit');
      await new Promise(resolve => setTimeout(resolve, 650));
      if (generation !== challengeGeneration) return;
      keys.children[value].classList.remove('lit');
    }
    challengeRound.accepting = true;
    for (const button of keys.children) button.disabled = false;
    challengeResult.textContent = 'Your turn · 0 / ' + round.sequence.length;
  } catch (error) {
    if (generation !== challengeGeneration) return;
    challengeResult.textContent = error.message;
    challengeRound = null; challengePlay.disabled = false;
  }
}

async function answerCoconut(value, generation) {
  if (!challengeRound?.accepting || generation !== challengeGeneration) return;
  challengeRound.answers.push(value);
  challengeResult.textContent = 'Your turn · ' + challengeRound.answers.length + ' / ' + challengeRound.sequence.length;
  if (challengeRound.answers.length !== challengeRound.sequence.length) return;
  challengeRound.accepting = false;
  for (const button of document.querySelector('#coconut-keys').children) button.disabled = true;
  const submitted = challengeRound;
  try {
    const result = await api('/api/games/coconut/finish', { roundId: submitted.roundId, sequence: submitted.answers });
    if (generation !== challengeGeneration) return;
    challengeResult.textContent = result.won === false ? 'Pattern missed. Try a new round!' : 'Pattern complete! +20 points.';
    await social.refreshUser();
  } catch (error) { if (generation === challengeGeneration) challengeResult.textContent = error.message; }
  finally { if (generation === challengeGeneration) { challengeRound = null; challengePlay.disabled = false; } }
}

function wireInterface() {
  updateProfileHud(); updateProgressHud(); renderTasks(); renderMapLandmarks(); setOpenPanel();
  mapOpen.addEventListener('click', () => setOpenPanel(minimap.classList.contains('open') ? null : 'map'));
  mapClose.addEventListener('click', () => setOpenPanel());
  mapLabelToggle.addEventListener('click', () => {
    mapLabelsVisible = !mapLabelsVisible;
    mapLabelToggle.textContent = mapLabelsVisible ? 'Labels on' : 'Labels'; renderMapLandmarks();
  });
  taskToggle.addEventListener('click', () => setOpenPanel(taskPanel.classList.contains('open') ? null : 'tasks'));
  fullscreenToggle?.addEventListener('click', async () => { try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch { showToast('Fullscreen is unavailable in this browser'); } });
  taskClose.addEventListener('click', () => setOpenPanel());
  missionCard.addEventListener('click', () => setOpenPanel(taskPanel.classList.contains('open') ? null : 'tasks'));
  challengePlay.addEventListener('click', playCoconutChallenge);
  document.querySelector('#npc-profile .panel-close').addEventListener('click', () => { document.querySelector('#npc-profile').hidden = true; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { setOpenPanel(); document.querySelector('#npc-profile').hidden = true; } });
}

social = initSocial({ onUser: acceptUser, onPlayers: players => { connectionReady = true; synchronizePlayers(players); },
  onDisconnect: () => { connectionReady = false; synchronizePlayers([]); }, onToast: showToast });

try {
  const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 800;
  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance', alpha: false });
  let renderScale = isMobile ? 0.72 : 1;
  function applyRenderScale() { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? renderScale : 1.25)); renderer.setSize(window.innerWidth, window.innerHeight, false); }
  applyRenderScale();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = false;
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  sceneRef = scene;
  scene.background = new THREE.Color(0x92c9ff);
  scene.fog = new THREE.Fog(0x92c9ff, 50, 150);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 200);
  const raycaster = new THREE.Raycaster();
  document.addEventListener('pointerdown', event => {
    if (event.target === renderer.domElement || event.target === cameraZone) pointerOrigin.set(event.pointerId, [event.clientX, event.clientY]);
  });
  document.addEventListener('pointerup', event => {
    const start = pointerOrigin.get(event.pointerId); pointerOrigin.delete(event.pointerId);
    if (!start || !profile || Math.hypot(event.clientX - start[0], event.clientY - start[1]) > 7) return;
    raycaster.setFromCamera(new THREE.Vector2(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2), camera);
    const avatars = [playerRef, ...villagers, ...remotePlayers.values()];
    const hit = raycaster.intersectObjects(avatars, true)[0];
    if (hit && hit.distance < 45) {
      let object = hit.object;
      while (object && !avatars.includes(object)) object = object.parent;
      if (object) inspectAvatar(object);
    }
  });
  document.addEventListener('pointercancel', event => pointerOrigin.delete(event.pointerId));
  const clock = new THREE.Clock();
  const player = new THREE.Group();
  const cameraTarget = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const desiredMove = new THREE.Vector3();

  scene.add(player);
  playerRef = player;
  buildWorld(scene);
  buildLandmarkWorld(scene);
  buildPlayer(player);
  player.visible = !!profile;
  if (profile) placePlayerAtDistrict(profile.district);
  wireInterface();
  updateMapPlayer(player);

  const sun = new THREE.HemisphereLight(0xeaf7ff, 0x486231, 2.25);
  scene.add(sun);
  const warmLight = new THREE.DirectionalLight(0xfff1d0, 1.5);
  warmLight.position.set(35, 55, 25);
  scene.add(warmLight);
  atmosphere = createAtmosphere(THREE, { scene, renderer, camera, sun: warmLight, hemi: sun });

  let joystickPointerId = null;
  let lookPointerId = null;
  let lastLookX = 0;
  let lastLookY = 0;
  let inputX = 0;
  let inputY = 0;
  let cameraYaw = Math.PI * .75;
  let cameraPitch = .31;
  let runHeld = false;
  let walkPhase = 0;
  let perfFrames = 0, perfTime = performance.now(), perfCooldown = 0;
  let npcAccumulator = 0, trafficAccumulator = 0, mapAccumulator = 0;
  const moveForward = new THREE.Vector3();
  const moveRight = new THREE.Vector3();
  const keys = new Set();

  function clearJoystick() {
    joystickPointerId = null;
    inputX = 0;
    inputY = 0;
    joystickKnob.style.transform = 'translate(0px, 0px)';
  }

  function updateJoystick(event) {
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maximum = 38;
    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    if (distance > maximum) {
      dx *= maximum / distance;
      dy *= maximum / distance;
    }
    inputX = dx / maximum;
    inputY = dy / maximum;
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  joystickZone.addEventListener('pointerdown', event => {
    if (joystickPointerId !== null) return;
    joystickPointerId = event.pointerId;
    joystickZone.setPointerCapture(event.pointerId);
    updateJoystick(event);
    event.preventDefault();
  });
  joystickZone.addEventListener('pointermove', event => {
    if (event.pointerId === joystickPointerId) updateJoystick(event);
  });
  joystickZone.addEventListener('pointerup', event => {
    if (event.pointerId === joystickPointerId) clearJoystick();
  });
  joystickZone.addEventListener('pointercancel', event => {
    if (event.pointerId === joystickPointerId) clearJoystick();
  });
  joystickZone.addEventListener('lostpointercapture', clearJoystick);

  cameraZone.addEventListener('pointerdown', event => {
    if (lookPointerId !== null || event.target === runButton) return;
    lookPointerId = event.pointerId;
    lastLookX = event.clientX;
    lastLookY = event.clientY;
    cameraZone.setPointerCapture(event.pointerId);
  });
  cameraZone.addEventListener('pointermove', event => {
    if (event.pointerId !== lookPointerId) return;
    cameraYaw -= (event.clientX - lastLookX) * .009;
    cameraPitch = THREE.MathUtils.clamp(cameraPitch + (event.clientY - lastLookY) * .006, .12, .64);
    lastLookX = event.clientX;
    lastLookY = event.clientY;
  });
  function clearLook(event) { if (!event || event.pointerId === lookPointerId) lookPointerId = null; }
  cameraZone.addEventListener('pointerup', clearLook);
  cameraZone.addEventListener('pointercancel', clearLook);
  cameraZone.addEventListener('lostpointercapture', clearLook);

  function setRun(value) {
    runHeld = value;
    runButton.classList.toggle('active', value);
  }
  runButton.addEventListener('pointerdown', event => {
    runButton.setPointerCapture(event.pointerId);
    setRun(true);
    event.preventDefault();
  });
  runButton.addEventListener('pointerup', () => setRun(false));
  runButton.addEventListener('pointercancel', () => setRun(false));
  runButton.addEventListener('lostpointercapture', () => setRun(false));

  function typingIntoField(event) {
    return event.target instanceof Element && event.target.matches('input, select, textarea, [contenteditable]');
  }
  function clearGameInput() {
    keys.clear();
    clearJoystick();
    setRun(false);
    lookPointerId = null;
  }
  window.addEventListener('keydown', event => {
    if (typingIntoField(event) || !profile || document.querySelector('[aria-modal="true"]:not([hidden])')) return;
    keys.add(event.key.toLowerCase());
    if (event.key === 'Shift') setRun(true);
  });
  window.addEventListener('keyup', event => {
    if (typingIntoField(event)) { keys.clear(); return; }
    keys.delete(event.key.toLowerCase());
    if (event.key === 'Shift') setRun(false);
  });
  document.addEventListener('focusin', event => { if (typingIntoField(event)) clearGameInput(); });
  window.addEventListener('blur', clearGameInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearGameInput(); });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    if (atmosphere) atmosphere.applyQuality(); else applyRenderScale();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    fallback.style.display = 'grid';
    fallback.textContent = 'The game paused because WebGL was interrupted. Reload this page to continue.';
  });

  function gameLoop() {
    requestAnimationFrame(gameLoop);
    const delta = Math.min(clock.getDelta(), .05);
    villageTime += delta;
    npcAccumulator += delta; trafficAccumulator += delta; mapAccumulator += delta;
    if (npcAccumulator >= (isMobile ? .10 : .05)) { updateVillagers(villageTime); npcAccumulator = 0; }
    if (trafficAccumulator >= (isMobile ? .05 : .025)) { updateTraffic(trafficAccumulator); trafficAccumulator = 0; }
    const keyboardX = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
    const keyboardY = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
    const controlX = Math.abs(keyboardX) > 0 ? keyboardX : inputX;
    const controlY = Math.abs(keyboardY) > 0 ? keyboardY : inputY;
    const paused = !profile || !connectionReady || !!document.querySelector('[aria-modal="true"]:not([hidden])');
    if (paused) clearGameInput();
    const controlLength = paused ? 0 : Math.min(1, Math.hypot(controlX, controlY));

    if (controlLength > .06) {
      moveForward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
      moveRight.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
      desiredMove.copy(moveForward).multiplyScalar(-controlY).addScaledVector(moveRight, controlX).normalize();
      const speed = runHeld ? 7.2 : 3.8;
      player.position.addScaledVector(desiredMove, speed * controlLength * delta);
      addWalkProgress(speed * controlLength * delta);
      player.position.x = THREE.MathUtils.clamp(player.position.x, -110, 110);
      player.position.z = THREE.MathUtils.clamp(player.position.z, -110, 110);
      const desiredYaw = Math.atan2(desiredMove.x, desiredMove.z);
      player.rotation.y = rotateTowards(player.rotation.y, desiredYaw, delta * 11);
      cameraYaw = rotateTowards(cameraYaw, player.rotation.y + Math.PI, delta * 1.4);
      walkPhase += delta * (runHeld ? 15 : 9) * controlLength;
      animatePlayer(player, walkPhase, controlLength);
      if (mapAccumulator >= .15) { updateMapPlayer(player); mapAccumulator = 0; }
    } else {
      animatePlayer(player, walkPhase, 0);
    }

    cameraTarget.set(player.position.x, player.position.y + 1.45, player.position.z);
    const distance = 7.1;
    const horizontal = Math.cos(cameraPitch) * distance;
    cameraPosition.set(
      player.position.x + Math.sin(cameraYaw) * horizontal,
      player.position.y + 1.45 + Math.sin(cameraPitch) * distance,
      player.position.z + Math.cos(cameraYaw) * horizontal
    );
    camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * 9));
    camera.lookAt(cameraTarget);
    updateRemotePlayers(delta, camera);
    sendMovement(player, controlLength > .06);
    atmosphere.update(delta, villageTime, { moving: controlLength > .06, running: runHeld, nearWater: Math.hypot(player.position.x - 39, player.position.z + 4) < 15 || Math.hypot(player.position.x + 34, player.position.z + 13) < 13, inChallenge: !!challengeRound });
    renderer.render(scene, camera);
    if (isMobile && !atmosphere) {
      perfFrames++; const now = performance.now();
      if (now - perfTime >= 2000) {
        const fps = perfFrames * 1000 / (now - perfTime); perfFrames = 0; perfTime = now;
        if (perfCooldown > 0) perfCooldown--;
        else if (fps < 22 && renderScale > .48) { renderScale = Math.max(.48, renderScale - .08); applyRenderScale(); perfCooldown = 2; }
        else if (fps > 42 && renderScale < .82) { renderScale = Math.min(.82, renderScale + .04); applyRenderScale(); perfCooldown = 3; }
      }
    }
  }
  gameLoop();
} catch (error) {
  console.error(error);
  fallback.style.display = 'grid';
}

function rotateTowards(current, target, amount) {
  const turn = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + THREE.MathUtils.clamp(turn, -amount, amount);
}



function buildPlayer(player) {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(.48, 20),
    new THREE.MeshBasicMaterial({ color: 0x16201a, transparent: true, opacity: .25, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .025;
  player.add(shadow);
  player.userData.shadow = shadow;
  replacePlayerAvatar(profile?.gender || 'male');
  updateNameLabel(player, profile?.username || '', profile?.id);
}

function replacePlayerAvatar(gender) {
  if (!playerRef) return;
  const oldAvatar = playerRef.userData.avatar;
  if (oldAvatar) { playerRef.remove(oldAvatar); disposeObject(oldAvatar); }
  const avatarStyle = gender === 'female'
    ? { gender: 'female', shirt: 0x1e8173, trousers: 0x273253, skin: 0xa96d4c, hair: 0x1b1412, shoes: 0x6c3c2c, accent: 0xe5bb51 }
    : { gender: 'male', shirt: 0x2a759b, trousers: 0x26354a, skin: 0xa96d4c, hair: 0x171616, shoes: 0x27231f, accent: 0x6eaad0 };
  const avatar = createHuman(avatarStyle);
  avatar.position.y = .04;
  playerRef.add(avatar);
  playerRef.userData.avatar = avatar;
}

function createHuman({ gender = 'male', shirt, trousers, skin, hair, shoes, accent = 0xffffff }) {
  const person = new THREE.Group();
  const isFemale = gender === 'female';
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: .82 });
  const trouserMat = new THREE.MeshStandardMaterial({ color: trousers, roughness: .9 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: .88 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 1 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: shoes, roughness: .95 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accent, roughness: .8 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf6f5ec, roughness: .5 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x251b17, roughness: .55 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x7d3734, roughness: .65 });

  const hips = new THREE.Mesh(new THREE.CylinderGeometry(isFemale ? .30 : .28, isFemale ? .33 : .31, .27, 10), trouserMat);
  hips.position.y = .94;
  person.add(hips);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(isFemale ? .32 : .34, isFemale ? .58 : .62, 7, 12), shirtMat);
  torso.scale.set(isFemale ? .94 : 1, 1.08, .82);
  torso.position.y = 1.37;
  person.add(torso);
  if (isFemale) {
    const kurta = new THREE.Mesh(new THREE.BoxGeometry(.67, .75, .40), shirtMat);
    kurta.position.set(0, 1.30, .01);
    const hem = new THREE.Mesh(new THREE.CylinderGeometry(.39, .27, .55, 12), accentMat);
    hem.position.set(0, .92, .01);
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(.10, .82, .46), accentMat);
    scarf.position.set(.30, 1.37, -.03);
    person.add(kurta, hem, scarf);
  } else {
    const belt = new THREE.Mesh(new THREE.BoxGeometry(.60, .08, .38), accentMat);
    belt.position.y = 1.00;
    person.add(belt);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.12, .13, .18, 9), skinMat);
  neck.position.y = 1.87;
  person.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.265, 14, 11), skinMat);
  head.scale.set(.88, 1.08, .92);
  head.position.y = 2.1;
  person.add(head);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(.277, 14, 10, 0, Math.PI * 2, 0, Math.PI * .55), hairMat);
  hairCap.scale.set(.9, 1.08, .95);
  hairCap.position.y = 2.19;
  person.add(hairCap);
  if (isFemale) {
    const hairBack = new THREE.Mesh(new THREE.CapsuleGeometry(.18, .54, 5, 10), hairMat);
    hairBack.position.set(0, 1.93, -.16);
    hairBack.scale.set(1.12, 1, .45);
    const hairLeft = new THREE.Mesh(new THREE.CapsuleGeometry(.075, .38, 5, 8), hairMat);
    const hairRight = hairLeft.clone();
    hairLeft.position.set(-.21, 1.99, -.02);
    hairRight.position.set(.21, 1.99, -.02);
    person.add(hairBack, hairLeft, hairRight);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 7), skinMat);
  nose.scale.set(.75, 1.1, 1.3);
  nose.position.set(0, 2.09, .245);
  person.add(nose);
  [-.095, .095].forEach(x => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 7), white);
    eyeWhite.scale.z = .45;
    eyeWhite.position.set(x, 2.16, .224);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.02, 7, 6), eye);
    pupil.position.set(x, 2.16, .25);
    person.add(eyeWhite, pupil);
  });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(.09, .018, .012), mouthMat);
  mouth.position.set(0, 2.0, .25);
  person.add(mouth);

  const parts = {};
  [['leftArm', -.39, -.10], ['rightArm', .39, .10]].forEach(([name, x, tilt]) => {
    const pivot = new THREE.Group();
    pivot.name = name;
    pivot.position.set(x, 1.61, 0);
    pivot.rotation.z = tilt;
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.115, isFemale ? .31 : .25, 5, 9), shirtMat);
    sleeve.position.y = isFemale ? -.19 : -.16;
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.088, .28, 5, 9), skinMat);
    forearm.position.y = -.47;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.1, 9, 8), skinMat);
    hand.position.y = -.67;
    pivot.add(sleeve, forearm, hand);
    person.add(pivot);
    parts[name] = pivot;
  });
  [['leftLeg', -.15], ['rightLeg', .15]].forEach(([name, x]) => {
    const pivot = new THREE.Group();
    pivot.name = name;
    pivot.position.set(x, .9, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .58, 5, 9), trouserMat);
    leg.position.y = -.38;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.2, .14, .37), shoeMat);
    foot.position.set(0, -.72, .1);
    pivot.add(leg, foot);
    person.add(pivot);
    parts[name] = pivot;
  });
  person.userData.parts = parts;
  person.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  return person;
}

function animatePlayer(player, phase, moving) {
  const bob = moving ? Math.abs(Math.sin(phase)) * .035 : 0;
  const avatar = player.userData.avatar;
  if (!avatar) return;
  avatar.position.y = .04 + bob;
  avatar.rotation.z = moving ? Math.sin(phase * .5) * .012 : 0;
  player.userData.shadow?.scale.setScalar(1 - bob * 2.3);
  animateHuman(avatar, phase, moving);
}

function animateHuman(human, phase, moving) {
  const parts = human.userData.parts;
  const swing = moving ? Math.sin(phase) * .52 : 0;
  parts.leftArm.rotation.x = swing;
  parts.rightArm.rotation.x = -swing;
  parts.leftLeg.rotation.x = -swing;
  parts.rightLeg.rotation.x = swing;
}

function updateVillagers(time) {
  villagers.forEach(villager => {
    const pace = (Math.sin(time * villager.userData.speed + villager.userData.offset) + 1) * .5;
    villager.position.z = villager.userData.startZ + Math.sin(time * villager.userData.speed + villager.userData.offset) * villager.userData.distance;
    villager.rotation.y = Math.cos(time * villager.userData.speed + villager.userData.offset) > 0 ? 0 : Math.PI;
    if (villager.userData.photo) {
      villager.userData.photo.position.y = .025 + Math.abs(Math.sin(time * villager.userData.speed * 6)) * .018;
      animateHuman(villager.userData.human, time * villager.userData.speed * 7, .55 + pace * .45);
    } else {
      animateHuman(villager.userData.human, time * villager.userData.speed * 7, .55 + pace * .45);
    }
  });
}

function buildWorld(scene) {
  const groundCanvas = document.createElement('canvas'); groundCanvas.width = groundCanvas.height = 128;
  const groundContext = groundCanvas.getContext('2d');
  groundContext.fillStyle = '#65854a'; groundContext.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2400; i++) { groundContext.fillStyle = i % 3 ? '#779655' : '#54713c'; groundContext.fillRect((i * 47) % 128, (i * 73 + Math.floor(i / 128) * 29) % 128, 2, 2); }
  const texture = new THREE.CanvasTexture(groundCanvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(32, 32);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);


  const roadMat = new THREE.MeshStandardMaterial({ color: 0x34393b, roughness: .94, metalness: .02 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(16, 160), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.y = .016;
  scene.add(road);
  addRoadEdges(scene, 0, 0, 16, 160);
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf1d46d, roughness: .75 });
  for (let z = -72; z <= 72; z += 9) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(.18, 4), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, .03, z);
    scene.add(line);
  }
  const sideRoad = new THREE.Mesh(new THREE.PlaneGeometry(88, 12), roadMat);
  sideRoad.rotation.x = -Math.PI / 2;
  sideRoad.position.set(-28, .017, -22);
  scene.add(sideRoad);
  addRoadEdges(scene, -28, -22, 88, 12);
  addRoadVehicle(scene, { kind: 'car', axis: 'z', fixed: -3.1, min: -76, max: 76, progress: -52, direction: 1, speed: 7.0, color: 0xd44737 });
  addRoadVehicle(scene, { kind: 'bus', axis: 'z', fixed: 3.2, min: -76, max: 76, progress: 61, direction: -1, speed: 5.0, color: 0xd9b32d });
  addRoadVehicle(scene, { kind: 'car', axis: 'x', fixed: -24.5, min: -69, max: 10, progress: -60, direction: 1, speed: 6.3, color: 0x427eb5 });

  addPhotoHouse(scene, -24, -36, 10.2, 6.8);
  addPhotoHouse(scene, 28, 24, 8.8, 5.9);
  addPhotoHouse(scene, -36, 33, 9.4, 6.25);
  addPhotoHouse(scene, 18, -32, 8.6, 5.75);
  const treePositions = [[-15,-62],[14,-55],[-20,-47],[20,-42],[-18,-20],[17,-10],[-18,5],[18,9],[-16,34],[16,43],[-14,61],[17,66],[-50,-20],[-45,14],[-42,48],[46,-42],[42,4],[47,52]];
  treePositions.forEach(([x, z], i) => addPalm(scene, x, z, .72 + (i % 3) * .09));
  [[-43,-35,1.08],[41,-29,1.15],[-48,41,.96],[45,39,1.04],[-27,-13,.88],[30,6,.8],[-28,57,.85]].forEach(([x, z, scale]) => addPalm(scene, x, z, scale));
  [[-43,-49,.88],[39,-25,.94],[-42,27,.90],[43,43,.92]].forEach(([x, z, scale]) => addTree(scene, x, z, scale, true));
  addBird(scene, -43.4, 5.15, -48.7, .6);
  addBird(scene, 39.4, 5.6, -24.8, -.8);
  addBird(scene, -42.4, 5.2, 26.5, 1.1);
  addBird(scene, 42.4, 5.4, 42.6, -.45);
  addPond(scene, 39, -4);
  addBench(scene, -10, -10);
  addPhotoVillager(scene, -6, -50, 11, .55, 0, .78);
  addPhotoVillager(scene, 10, -5, 8, .45, 2, .72);
  addPhotoVillager(scene, -9, 19, 8, .5, 4, .75);
  addPhotoVillager(scene, 10, 50, 7, .42, 1, .68);
}

function buildLandmarkWorld(scene) {
  addFortLandmark(scene, -7, 60);
  addTeaHills(scene, 42, 26);
  addPalaceLandmark(scene, -26, 6);
  addBackwaterHouseboat(scene, -34, -13);
  addPaddyFields(scene, 7, -23);
  addTempleLandmark(scene, 13, -57);
}

function landmarkBeacon(scene, x, z, color) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, 2.7, 8), new THREE.MeshStandardMaterial({ color: 0x38443f, roughness: .9 }));
  const marker = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .22, roughness: .6 }));
  pole.position.set(x, 1.35, z); marker.position.set(x, 2.78, z);
  scene.add(pole, marker);
}

function addFortLandmark(scene, x, z) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x777167, roughness: 1 });
  const grassStone = new THREE.MeshStandardMaterial({ color: 0x5d6651, roughness: 1 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(8.8, 2.2, 1.15), stone); wall.position.set(0, 1.1, 0);
  group.add(wall);
  [-3.5, 0, 3.5].forEach(px => {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(.75, .9, 2.85, 8), grassStone); tower.position.set(px, 1.42, .25); group.add(tower);
  });
  group.position.set(x, 0, z); scene.add(group); landmarkBeacon(scene, x, z - 1.2, 0xf1c658);
}

function addTeaHills(scene, x, z) {
  const group = new THREE.Group();
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x497a45, roughness: 1 });
  [[0,0,4.5],[-3,1,2.8],[3,-1,3.2]].forEach(([px,pz,radius]) => {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(radius, radius * .72, 18), hillMat); hill.position.set(px, radius * .34, pz); group.add(hill);
  });
  group.position.set(x, 0, z); scene.add(group); landmarkBeacon(scene, x, z - 3, 0x74ca68);
}

function addPalaceLandmark(scene, x, z) {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xb99667, roughness: .9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x7d3f2e, roughness: .95 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.5, 4.8), wallMat); body.position.y = 1.75;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.65, 2.3, 4), roofMat); roof.rotation.y = Math.PI / 4; roof.position.y = 4.45;
  group.add(body, roof); group.position.set(x, 0, z); scene.add(group); landmarkBeacon(scene, x, z - 3, 0xf5b25e);
}

function addBackwaterHouseboat(scene, x, z) {
  const group = new THREE.Group();
  const water = new THREE.Mesh(new THREE.CircleGeometry(7, 32), new THREE.MeshStandardMaterial({ color: 0x287d94, roughness: .28, metalness: .1 }));
  water.rotation.x = -Math.PI / 2; water.position.y = .03;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(5.9, .72, 2.2), new THREE.MeshStandardMaterial({ color: 0x624528, roughness: .9 })); hull.position.y = .6;
  const cabin = new THREE.Mesh(new THREE.CapsuleGeometry(.85, 3.0, 6, 12), new THREE.MeshStandardMaterial({ color: 0xb69258, roughness: .95 })); cabin.rotation.z = Math.PI / 2; cabin.position.y = 1.45;
  group.add(water, hull, cabin); group.position.set(x, 0, z); scene.add(group); landmarkBeacon(scene, x, z - 2.6, 0x48bad2);
}

function addPaddyFields(scene, x, z) {
  const group = new THREE.Group();
  const soil = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), new THREE.MeshStandardMaterial({ color: 0x807142, roughness: 1 })); soil.rotation.x = -Math.PI / 2; soil.position.y = .018;
  group.add(soil);
  for (let row = -2.4; row <= 2.4; row += .8) {
    const rice = new THREE.Mesh(new THREE.BoxGeometry(9.2, .34, .22), new THREE.MeshStandardMaterial({ color: 0x9bbd41, roughness: 1 })); rice.position.set(0, .17, row); group.add(rice);
  }
  group.position.set(x, 0, z); scene.add(group); landmarkBeacon(scene, x, z - 3.5, 0xcbe064);
}

function addTempleLandmark(scene, x, z) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0xc8b58b, roughness: .9 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x693d24, roughness: .92 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(7, .55, 5.8), stone); base.position.y = .28;
  const hall = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.8, 4.1), stone); hall.position.y = 1.68;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.1, 2.4, 4), wood); roof.rotation.y = Math.PI / 4; roof.position.y = 4.25;
  group.add(base, hall, roof);
  [-2.2, 2.2].forEach(px => { const column = new THREE.Mesh(new THREE.CylinderGeometry(.18, .23, 3.2, 10), stone); column.position.set(px, 1.8, 2.1); group.add(column); });
  group.position.set(x, 0, z); scene.add(group); landmarkBeacon(scene, x, z - 3.1, 0xe8bf55);
}

function addRoadEdges(scene, x, z, width, depth) {
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xc3b9a3, roughness: 1 });
  const left = new THREE.Mesh(new THREE.BoxGeometry(.36, .13, depth), curbMat);
  const right = left.clone();
  left.position.set(x - width / 2, .05, z);
  right.position.set(x + width / 2, .05, z);
  scene.add(left, right);
}

function createRoadVehicle(kind, color) {
  const isBus = kind === 'bus';
  const width = isBus ? 2.25 : 1.55;
  const length = isBus ? 5.15 : 3.05;
  const vehicle = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: .78 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x193543, roughness: .3, metalness: .1 });
  const tire = new THREE.MeshStandardMaterial({ color: 0x16191b, roughness: 1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, isBus ? 1.30 : .68, length), paint);
  body.position.y = isBus ? .90 : .55;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(width - .16, isBus ? .62 : .54, isBus ? 3.85 : 1.62), glass);
  cabin.position.y = isBus ? 1.64 : 1.12;
  const windscreen = new THREE.Mesh(new THREE.BoxGeometry(width - .27, isBus ? .42 : .30, .055), glass);
  windscreen.position.set(0, isBus ? 1.63 : 1.12, length / 2 + .03);
  vehicle.add(body, cabin, windscreen);
  if (isBus) {
    for (let row = -1.25; row <= 1.25; row += .82) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(.045, .34, .56), glass);
      const opposite = window.clone();
      window.position.set(width / 2 + .025, 1.66, row);
      opposite.position.set(-width / 2 - .025, 1.66, row);
      vehicle.add(window, opposite);
    }
  }
  [-length * .31, length * .31].forEach(zPos => {
    [-width / 2, width / 2].forEach(xPos => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.20, .20, .12, 10), tire);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(xPos, .22, zPos);
      vehicle.add(wheel);
    });
  });
  return vehicle;
}

function addRoadVehicle(scene, config) {
  const vehicle = createRoadVehicle(config.kind, config.color);
  vehicle.userData.traffic = { ...config };
  if (config.axis === 'z') {
    vehicle.position.set(config.fixed, 0, config.progress);
    vehicle.rotation.y = config.direction > 0 ? 0 : Math.PI;
  } else {
    vehicle.position.set(config.progress, 0, config.fixed);
    vehicle.rotation.y = config.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  }
  traffic.push(vehicle);
  scene.add(vehicle);
}

function updateTraffic(delta) {
  traffic.forEach(vehicle => {
    const config = vehicle.userData.traffic;
    config.progress += config.direction * config.speed * delta;
    if (config.direction > 0 && config.progress > config.max) config.progress = config.min;
    if (config.direction < 0 && config.progress < config.min) config.progress = config.max;
    if (config.axis === 'z') vehicle.position.z = config.progress;
    else vehicle.position.x = config.progress;
  });
}

function addFruitClusters(parent) {
  const positions = [[-.8,5,.3],[.45,5.45,.55],[1.05,4.82,-.2],[-.3,6,0],[.7,5.52,-.7],[-1.1,4.75,-.2],[.15,4.75,1.05]];
  const fruits = new THREE.InstancedMesh(fruitGeometry, fruitMaterial, positions.length);
  const dummy = new THREE.Object3D();
  positions.forEach(([x, y, z], index) => {
    dummy.position.set(x, y, z);
    dummy.scale.setScalar(.8 + (index % 3) * .12);
    dummy.updateMatrix();
    fruits.setMatrixAt(index, dummy.matrix);
  });
  fruits.instanceMatrix.needsUpdate = true;
  parent.add(fruits);
}

function addBird(scene, x, y, z, yaw = 0) {
  if (typeof isMobile !== 'undefined' && isMobile) return;
  const bird = new THREE.Group();
  const body = new THREE.Mesh(birdBodyGeometry, birdMaterial);
  body.scale.set(.8, .75, 1.55);
  body.rotation.x = .1;
  const leftWing = new THREE.Mesh(birdWingGeometry, birdMaterial);
  leftWing.position.set(-.13, .01, 0);
  leftWing.rotation.z = .42;
  const rightWing = new THREE.Mesh(birdWingGeometry, birdMaterial);
  rightWing.position.set(.13, .01, 0);
  rightWing.rotation.z = -.42;
  bird.add(body, leftWing, rightWing);
  bird.position.set(x, y, z);
  bird.rotation.y = yaw;
  scene.add(bird);
}

function addPhotoHouse(scene, x, z) { addHouse(scene, x, z, 0xf0e5d1, 0x9e533a); }


function addHouse(scene, x, z, wallColor, roofColor) {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: .9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: .98 });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x573a2b, roughness: .92 });
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x6fa4b8, roughness: .2, metalness: .14 });
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(9.25, .32, 8.25), new THREE.MeshStandardMaterial({ color: 0x898072, roughness: 1 }));
  foundation.position.y = .16;
  const walls = new THREE.Mesh(new THREE.BoxGeometry(8.65, 4.4, 7.5), wallMat);
  walls.position.y = 2.45;
  const porchFloor = new THREE.Mesh(new THREE.BoxGeometry(5.1, .22, 1.85), new THREE.MeshStandardMaterial({ color: 0xa79983, roughness: 1 }));
  porchFloor.position.set(0, .36, 4.18);
  const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, .23, .75), new THREE.MeshStandardMaterial({ color: 0x8d8372, roughness: 1 }));
  step.position.set(0, .15, 5.1);
  group.add(foundation, walls, porchFloor, step);

  const roofA = new THREE.Mesh(new THREE.BoxGeometry(9.7, .18, 4.55), roofMat);
  const roofB = roofA.clone();
  roofA.rotation.x = .52;
  roofB.rotation.x = -.52;
  roofA.position.set(0, 5.65, -1.32);
  roofB.position.set(0, 5.65, 1.32);
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(9.7, .22, .32), new THREE.MeshStandardMaterial({ color: 0x713a2e, roughness: 1 }));
  ridge.position.y = 6.75;
  group.add(roofA, roofB, ridge);
  for (let xTile = -4.15; xTile <= 4.15; xTile += 1.18) {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(.88, .07, 4.45), new THREE.MeshStandardMaterial({ color: 0xb46244, roughness: 1 }));
    tile.rotation.x = -.52;
    tile.position.set(xTile, 5.71, 1.39);
    group.add(tile);
  }

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.35, .12), darkWood);
  door.position.set(0, 1.6, 3.82);
  group.add(door);
  [[-2.75, 3.82], [2.75, 3.82]].forEach(([windowX, windowZ]) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.42, .13), darkWood);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.17, .145), windowMat);
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.2, .16), darkWood);
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(1.48, .08, .16), darkWood);
    frame.position.set(windowX, 2.65, windowZ);
    glass.position.set(windowX, 2.65, windowZ + .01);
    vertical.position.set(windowX, 2.65, windowZ + .02);
    horizontal.position.set(windowX, 2.65, windowZ + .02);
    group.add(frame, glass, vertical, horizontal);
  });
  [-1.95, 1.95].forEach(columnX => {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(.15, .18, 3.45, 10), new THREE.MeshStandardMaterial({ color: 0xf7f0df, roughness: .86 }));
    column.position.set(columnX, 2.05, 4.15);
    group.add(column);
  });
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.4, .16, 2.15), roofMat);
  canopy.position.set(0, 3.85, 4.18);
  canopy.rotation.x = -.08;
  group.add(canopy);
  group.position.set(x, 0, z);
  scene.add(group);
}

function addShop(scene, x, z) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(9.4, 3.8, 5.8), new THREE.MeshStandardMaterial({ color: 0xf1e7d2, roughness: .92 }));
  body.position.y = 1.9;
  const awning = new THREE.Mesh(new THREE.BoxGeometry(10.1, .35, 1.8), new THREE.MeshStandardMaterial({ color: 0xb83f36, roughness: .9 }));
  awning.position.set(0, 3.35, 3.2);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(5.5, .9, .1), new THREE.MeshStandardMaterial({ color: 0x276a7e, roughness: .72 }));
  sign.position.set(0, 4.25, 2.93);
  const shutter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.05, .12), new THREE.MeshStandardMaterial({ color: 0x6e5845, roughness: 1 }));
  shutter.position.set(0, 1.82, 2.96);
  group.add(body, awning, sign, shutter);
  group.position.set(x, 0, z);
  scene.add(group);
}

function addTree(scene, x, z, scale, withFruit = false) {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x65442e, roughness: 1 });
  const branchMat = new THREE.MeshStandardMaterial({ color: 0x77503a, roughness: 1 });
  const foliageMats = [0x1d5e2e, 0x29773a, 0x3b843d].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.25, .43, 4.2, 8), trunkMat);
  trunk.position.y = 2.1;
  group.add(trunk);
  [[-.65,4.1,.65],[.7,4.35,-.25],[0,4.85,.55]].forEach(([bx, by, bz], i) => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(.09, .17, 1.6, 7), branchMat);
    branch.position.set(bx * .45, by, bz * .25);
    branch.rotation.z = bx < 0 ? .76 : -.72;
    branch.rotation.x = bz * .32;
    group.add(branch);
  });
  [[0,5.2,0,2.1],[-1.15,4.9,.2,1.48],[1.2,4.9,-.15,1.55],[.35,6.1,.1,1.4],[-.45,5.65,-.85,1.25],[.75,5.55,.82,1.2]].forEach(([lx, ly, lz, radius], i) => {
    const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 1), foliageMats[i % foliageMats.length]);
    leaves.scale.set(1.08, .84, 1);
    leaves.position.set(lx, ly, lz);
    group.add(leaves);
  });
  if (withFruit) addFruitClusters(group);
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  scene.add(group);
}

function addPalm(scene, x, z, scale) {
  const palm = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x84735a, roughness: 1 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x357b32, roughness: .82, side: THREE.DoubleSide });
  const leaflets = new THREE.InstancedMesh(new THREE.PlaneGeometry(.13, 1), leafMaterial, 144);
  const leafletPose = new THREE.Object3D();
  let leafletIndex = 0;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13, .3, 7, 9, 5), trunkMaterial);
  trunk.position.set(.3, 3.5, 0); trunk.rotation.z = -.08; palm.add(trunk);
  for (let i = 0; i < 9; i++) {
    const yaw = i * Math.PI * 2 / 9;
    const points = [];
    for (let j = 0; j <= 8; j++) { const t = j / 8; points.push(new THREE.Vector3(.58 + Math.cos(yaw) * t * 3.2, 7 + Math.sin(t * Math.PI) * .7 - t * 1.1, Math.sin(yaw) * t * 3.2)); }
    const curve = new THREE.CatmullRomCurve3(points);
    palm.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, .035, 4, false), leafMaterial));
    for (let j = 1; j < 9; j++) {
      const point = curve.getPoint(j / 10);
      for (const side of [-1, 1]) {
        leafletPose.position.copy(point); leafletPose.rotation.set(-Math.PI / 2 + .3, 0, -yaw + side * .6);
        leafletPose.scale.set(1, .9 * (1 - j / 12), 1); leafletPose.updateMatrix();
        leaflets.setMatrixAt(leafletIndex++, leafletPose.matrix);
      }
    }
  }
  palm.add(leaflets);
  for (let i = 0; i < 4; i++) { const nut = new THREE.Mesh(new THREE.SphereGeometry(.19, 7, 6), trunkMaterial); nut.position.set(.58 + Math.sin(i * 2) * .25, 6.8, Math.cos(i * 2) * .25); palm.add(nut); }
  palm.position.set(x, 0, z); palm.scale.setScalar(scale); scene.add(palm);
}

function addPhotoVillager(scene, x, z, distance, speed, offset, scale) {
  const index = villagers.length;
  const names = ['Anu', 'Vivek', 'Meera', 'Arun'];
  const gender = index % 2 ? 'male' : 'female';
  const villager = new THREE.Group();
  const human = createHuman({ gender, shirt: index % 2 ? 0x6d8d5a : 0xb36c70, trousers: 0x242b35, skin: 0x9d6245, hair: 0x161310, shoes: 0x2b2723 });
  human.scale.setScalar(.9 * scale + .2); villager.add(human); villager.position.set(x, 0, z);
  villager.userData = { human, startZ: z, distance, speed, offset, npc: true, name: names[index], gender };
  updateNameLabel(villager, names[index] + ' · Guide', 'npc-' + index);
  villagers.push(villager); scene.add(villager);
}


function addPond(scene, x, z) {
  const bank = new THREE.Mesh(new THREE.CircleGeometry(9.8, 40), new THREE.MeshStandardMaterial({ color: 0x907e55, roughness: 1 }));
  bank.rotation.x = -Math.PI / 2;
  bank.position.set(x, .012, z);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(8.8, 40), new THREE.MeshStandardMaterial({ color: 0x2f91ae, roughness: .28, metalness: .09 }));
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(x, .025, z);
  scene.add(bank, pond);
}

function addBench(scene, x, z) {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x74462e, roughness: .9 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x32383a, roughness: .75, metalness: .35 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.7, .16, .55), wood);
  seat.position.y = .72;
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.7, .68, .14), wood);
  back.position.set(0, 1.16, .24);
  [-.98, .98].forEach(xPos => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.1, .65, .1), metal);
    leg.position.set(xPos, .34, 0);
    group.add(leg);
  });
  group.add(seat, back);
  group.position.set(x, 0, z);
  scene.add(group);
}

```

---

## game.css

```css
#avatar-labels { position:fixed; inset:0; pointer-events:none; z-index:4; overflow:hidden; }
#hud { z-index:10; }
.avatar-name { position:absolute; top:0; left:0; border:1px solid #ffffff65; border-radius:20px; padding:5px 9px; color:white; background:#092d32d9; font:700 11px Arial,sans-serif; white-space:nowrap; pointer-events:auto; cursor:pointer; box-shadow:0 2px 8px #0003; touch-action:manipulation; }
.avatar-name[hidden] { display:none; }
#npc-profile { position:fixed; z-index:22; top:50%; left:50%; transform:translate(-50%,-50%); width:min(360px,calc(100vw - 32px)); padding:22px; border:1px solid #80bfa680; border-radius:18px; background:#10383ef5; color:white; box-shadow:0 10px 60px #0009; }
#npc-profile .panel-close { float:right; padding:8px 12px; }
#npc-profile h2 { font-size:21px; }
#npc-profile p { line-height:1.65; color:#c4e0d7; font-size:13px; }
#coconut-keys { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-top:12px; }
#coconut-keys button { font-size:24px; min-height:46px; transition:background .15s,transform .15s; }
#coconut-keys button.lit { background:#f2cf72; box-shadow:0 0 20px #f2cf7290; transform:translateY(-4px); }
#coconut-keys button:disabled { opacity:.55; }
#coconut-keys button.lit:disabled { opacity:1; }
button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline:3px solid #f4d475; outline-offset:3px; }
button:disabled { cursor:default; }
#task-panel { max-height:min(75dvh,580px); }
#camera-zone { touch-action:none; }
#fallback { z-index:30; }
@media (min-width:561px) { #mission-card { top:calc(env(safe-area-inset-top) + 134px); } }
@media (max-width:560px) {
  #brand { font-size:13px; padding:8px 10px; }
  #profile-chip { font-size:10px; }
  #mission-card { width:155px; }
  .avatar-name { font-size:10px; padding:4px 7px; }
  #task-panel { max-height:72dvh; }
  #camera-note { display:none; }
}
@media (prefers-reduced-motion:reduce) { #coconut-keys button { transition:none; } }

```

---

## social.js

```javascript
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
  const listeners = new Set();
  const $ = id => document.getElementById(id);
  const peoplePanel = $('people-panel');
  const dmPanel = $('dm-panel');
  const chatPanel = $('chat-panel');
  const peopleToggle = $('people-toggle');
  const chatToggle = $('chat-toggle');
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
    for (const panel of [peoplePanel, dmPanel, chatPanel]) panel?.classList.remove('open');
    peopleToggle?.setAttribute('aria-expanded', 'false');
    chatToggle?.setAttribute('aria-expanded', 'false');
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
    cancelRecording(); stopTalking();
    for (const peerId of [...peers.keys()]) closePeer(peerId);
    earlyCandidates.clear(); receiving.clear(); receiversReady.clear();
    audioMount.replaceChildren(); updateVoiceControls();
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
      onPlayers(players);
    });
    listen('social', async () => { await refreshPeople(); await refreshUser(); if (!profileModal.hidden && profileId && profileId !== user?.id) await openProfile(profileId, true); });
    listen('message', async value => {
      if (activePeer?.id === value.peerId && dmPanel.classList.contains('open')) await loadMessages();
      else { chatToggle?.classList.add('unread'); toast(`New message${people.find(person => person.id === value.peerId)?.username ? ` from ${people.find(person => person.id === value.peerId).username}` : ''}`); }
    });
    listen('profile', value => { if (value.user?.id === user?.id) setUser(value.user); run(refreshPeople, peopleError); });
    listen('signal', handleSignal);
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
  }
  function endSession(message = '') {
    sessionVersion++;
    source?.close(); source = null;
    cleanupVoice(); clearMessageURLs();
    peopleVersion++; messageVersion++; profileVersion++;
    people = []; peopleSignature = ''; activePeer = null; profileId = null;
    closePanels(); closeProfile();
    setUser(null); setConnection(false); onPlayers([]); onDisconnect();
    dmInput.value = ''; dmLog.replaceChildren();
    renderPeople(); renderAuth('login', message);
  }
  profileChip?.addEventListener('click', () => openProfile());
  peopleToggle?.addEventListener('click', () => peoplePanel.classList.contains('open') ? closePanels() : openPeople());
  chatToggle?.addEventListener('click', () => chatPanel.classList.contains('open') || dmPanel.classList.contains('open') ? closePanels() : openChat());
  window.addEventListener('blur', () => { stopTalking(); cancelRecording(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopTalking(); cancelRecording(); } });
  window.addEventListener('pagehide', () => { cleanupVoice(); clearMessageURLs(); source?.close(); });
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

```

---

## social.css

```css
.social-modal[hidden], .social-modal [hidden], #hud [hidden] { display:none !important; }
.social-modal { position:fixed; inset:0; z-index:40; display:flex; align-items:center; justify-content:center; padding:max(20px, env(safe-area-inset-top)) 20px max(20px, env(safe-area-inset-bottom)); background:rgba(3,17,20,.82); backdrop-filter:blur(9px); color:#edf9f0; touch-action:pan-y; overflow-y:auto; }
.social-card { width:min(430px, 100%); max-height:calc(100dvh - 40px); overflow-y:auto; padding:26px; border:1px solid #52776a; border-radius:22px; background:linear-gradient(145deg,#163d3b,#0a212a); box-shadow:0 24px 70px #0008; touch-action:pan-y; }
.social-card h1 { margin:8px 0 10px; font-size:26px; letter-spacing:-.7px; line-height:1.15; }
.social-card h2 { margin:0; font-size:22px; overflow-wrap:anywhere; }
.social-eyebrow { color:#9ad2a0; font-size:10px; font-weight:800; letter-spacing:2.5px; }
.social-muted { color:#b6d3c8; font-size:12px; line-height:1.5; }
.social-tabs { display:flex; flex-wrap:wrap; gap:5px; margin:16px 0; padding:4px; background:#0002; border-radius:12px; }
.social-tabs .social-button { flex:1; border-color:transparent; background:transparent; font-size:12px; padding:9px; }
.social-tabs button[aria-pressed="true"] { color:#082a22; background:#a2e2bb; }
.social-field { display:flex; flex:1; min-width:0; flex-direction:column; gap:7px; margin:14px 0; color:#d7eee0; font-size:12px; font-weight:700; }
.social-fields-row { display:flex; gap:12px; }
.social-card input, .social-card select, .social-card textarea, #people-panel input[type="search"] { box-sizing:border-box; width:100%; min-width:0; padding:11px 12px; border:1px solid #52756c; border-radius:10px; color:#effbf4; background:#0c242c; font:inherit; font-size:14px; touch-action:manipulation; }
.social-card textarea { resize:vertical; min-height:80px; max-height:200px; }
.social-card select { color-scheme:dark; }
.social-card input::placeholder, .social-card textarea::placeholder { color:#91aea5; }
.social-card .social-field input { margin:0; }
.social-button { border:1px solid #4b8070; border-radius:9px; padding:9px 11px; color:#eefff6; background:#216749; font:inherit; font-size:12px; font-weight:700; cursor:pointer; touch-action:manipulation; line-height:1.3; }
.social-button:hover { filter:brightness(1.12); }
.social-button.primary { width:100%; margin-top:9px; padding:12px; color:#092a21; background:#a2e2bb; font-size:14px; }
.social-button.secondary { background:#223e45; border-color:#49616b; }
.social-button.danger { color:#ffd9c8; background:#583731; border-color:#9b5b50; }
.social-button:disabled, #dm-panel button:disabled { opacity:.48; cursor:not-allowed; }
.social-button:focus-visible, .social-modal :focus-visible, #people-panel :focus-visible, #dm-panel :focus-visible, #chat-panel :focus-visible { outline:3px solid #ffe298; outline-offset:3px; }
.social-error { min-height:17px; margin:9px 0 0; color:#ffddaa; font-size:12px; line-height:1.4; overflow-wrap:anywhere; }
.social-error:empty { margin:0; min-height:0; }
.social-actions { display:flex; flex-wrap:wrap; gap:7px; margin-top:11px; }
.social-person { padding:11px; }
.social-person-name { display:flex; align-items:center; gap:9px; width:100%; padding:0; border:0; color:#fff; background:transparent; text-align:left; cursor:pointer; font:inherit; touch-action:manipulation; }
.social-person-name strong { overflow-wrap:anywhere; }
.social-avatar { display:grid; width:38px; height:38px; flex:0 0 38px; place-items:center; border:1px solid #a0c18b; border-radius:13px; color:#ddf4cb; background:#375448; font-size:18px; font-weight:700; }
.social-avatar.female { background:#59495b; border-color:#baa1bc; color:#ffe1f0; }
.social-person > .social-muted { display:block; margin:6px 0; }
.social-profile-header { display:flex; align-items:center; gap:12px; }
.social-profile-header .panel-close { margin-left:auto; flex:0 0 30px; width:30px; height:30px; }
.social-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; padding:15px 0; margin:16px 0; border-top:1px solid #4b716333; border-bottom:1px solid #4b716366; }
.social-stats div { text-align:center; }
.social-stats strong { display:block; color:#eafbcf; font-size:21px; }
.social-stats small { display:block; margin-top:4px; color:#b0cfc1; font-size:10px; }
.social-bio { white-space:pre-wrap; overflow-wrap:anywhere; color:#d5eade; font-size:14px; line-height:1.6; }
.social-empty { padding:15px 4px; color:#b4cdc4; font-size:12px; line-height:1.6; }
.people-tabs { gap:3px; margin:10px 0; padding:3px; }
.people-tabs .social-button { flex:auto; font-size:10px; padding:7px 5px; }
#people-panel, #chat-panel, #dm-panel { max-height:min(76dvh,620px); }
#people-panel .social-button, #chat-panel .social-button { font-size:11px; }
#dm-panel #dm-log { min-height:120px; max-height:27dvh; }
#dm-panel .dm-message { max-width:95%; padding:9px; margin:5px 0 9px; background:#ffffff09; border-radius:8px; overflow-wrap:anywhere; }
#dm-panel .dm-message.mine { margin-left:auto; background:#35654d66; }
.dm-message p { margin:4px 0; white-space:pre-wrap; line-height:1.5; }
.dm-message audio { display:block; width:100%; height:36px; max-width:100%; margin-top:6px; }
.social-voice { margin-top:13px; padding-top:13px; border-top:1px solid #496b6255; font-size:12px; }
.social-voice > strong { color:#d6eacb; font-size:12px; }
.social-check { display:flex; align-items:flex-start; gap:7px; margin:13px 0; color:#c8e0d4; font-size:11px; line-height:1.4; cursor:pointer; touch-action:manipulation; }
.social-check input { width:17px; height:17px; flex:0 0 17px; margin:0; accent-color:#a2e2bb; }
.social-talk { width:100%; padding:11px; background:#324d3f; border:1px solid #82a082; user-select:none; -webkit-user-select:none; touch-action:none; }
.social-talk.transmitting { background:#a2e2bb; color:#0a2b20; box-shadow:0 0 0 3px #a2e2bb22; }
.social-live-audio audio { width:100%; height:34px; margin-top:8px; }
#online-chip.social-offline i { background:#c6a978; box-shadow:none; }
#auth-modal, #social-profile-modal { overscroll-behavior:contain; }
@media (max-width:560px) { .social-card { padding:21px; border-radius:18px; } .social-card h1 { font-size:24px; } .social-card input, .social-card select, .social-card textarea, #people-panel input[type="search"], #dm-input { font-size:16px; } .social-fields-row { gap:8px; } #people-panel, #chat-panel, #dm-panel { width:min(340px,calc(100vw - 86px)); max-height:calc(100dvh - 40px - env(safe-area-inset-top)); } .social-stats strong { font-size:19px; } }
@media (max-height:580px) { .social-modal { align-items:flex-start; padding-top:12px; padding-bottom:12px; } .social-card { max-height:calc(100dvh - 24px); padding:19px; } .social-card h1 { font-size:21px; } .social-field { margin:10px 0; } .social-tabs { margin:10px 0; } }

```

---

## style.css

```css
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Arial,"Noto Sans Malayalam",sans-serif;background:#f7f8fa;color:#17202a}header{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;padding:16px 7%;background:#fff;box-shadow:0 2px 14px #0001}.logo{font-size:25px;font-weight:800}.logo span{color:#087f5b}nav{display:flex;gap:24px}nav a{text-decoration:none;color:#333;font-weight:600}header button{display:none;border:0;background:none;font-size:24px}.hero{min-height:70vh;padding:70px 8%;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(135deg,#e8fff5,#fff)}.hero p{color:#087f5b;font-weight:800;letter-spacing:2px}.hero h1{font-size:clamp(44px,8vw,78px);margin:8px 0}.ml{font-size:20px;line-height:1.7;color:#56616b;max-width:700px}.btn,button{background:#087f5b;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-weight:700;cursor:pointer}.btn{display:inline-block;text-decoration:none;margin-top:18px;width:max-content}section{padding:70px 8%;max-width:1200px;margin:auto}section h2{font-size:34px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.card{background:#fff;border-radius:18px;padding:26px;box-shadow:0 5px 25px #0001;font-size:35px}.card h3{font-size:21px}.card p{font-size:16px;color:#68737d;min-height:40px}.result{max-width:800px;background:#fff;padding:18px 20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between}#about p{font-size:18px;line-height:1.8;color:#59636c;max-width:800px}footer{text-align:center;padding:30px;background:#111;color:#fff}@media(max-width:700px){header button{display:block}nav{display:none;position:absolute;top:62px;left:0;right:0;background:#fff;flex-direction:column;padding:20px 7%}nav.open{display:flex}.cards{grid-template-columns:1fr}.hero{min-height:65vh;padding:50px 7%}section{padding:55px 7%}}
```

---

## script.js

```javascript
function menu(){document.getElementById('nav').classList.toggle('open')}
function openGame(name){alert(name+' — details will be added here.')}
document.getElementById('year').textContent=new Date().getFullYear();
```

---

## ludo.html

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kerala Play • Online Ludo</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:linear-gradient(135deg,#eef8ff,#f7fff7);color:#172033}.top{padding:15px 20px;background:#fff;border-bottom:1px solid #ddd;display:flex;justify-content:space-between}.logo{font-size:24px;font-weight:900}.logo span{color:#159447}.top a{color:#159447;text-decoration:none;font-weight:800}.wrap{max-width:1200px;margin:auto;padding:18px}.bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between}.actions{display:flex;gap:8px;flex-wrap:wrap}button,input{border:0;border-radius:11px;padding:11px 13px;font-weight:700}button{cursor:pointer;background:#e9eef5;color:#172033}.primary{background:#159447;color:#fff}.layout{display:grid;grid-template-columns:minmax(320px,650px) minmax(280px,1fr);gap:18px;margin-top:18px}.board{position:relative;width:100%;aspect-ratio:1;border:8px solid #172033;border-radius:20px;background:#fff;overflow:hidden;box-shadow:0 15px 35px #0002}.q{position:absolute;width:40%;height:40%;padding:7%;display:grid;grid-template-columns:1fr 1fr;gap:12%;background:#eee}.qr{left:0;top:0;background:#f8dede}.qg{right:0;top:0;background:#ddf5e4}.qy{left:0;bottom:0;background:#fff1bd}.qb{right:0;bottom:0;background:#dceaff}.yard{width:100%;height:100%;background:#fff;border-radius:15px;padding:10%;display:grid;grid-template-columns:1fr 1fr;gap:12%}.spot{border:3px solid #aaa;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#777;font-weight:900}.path{position:absolute;left:20%;top:20%;width:60%;height:60%;background:repeating-conic-gradient(#fff 0 6.92deg,#d7dce3 6.92deg 7.05deg);clip-path:polygon(0 0,100% 0,100% 100%,0 100%)}.cross{position:absolute;left:40%;top:40%;width:20%;height:20%;background:conic-gradient(#65c77c 0 25%,#5d91e8 25% 50%,#f4d35e 50% 75%,#ef6b6b 75%);z-index:2}.panel{background:#fff;border:1px solid #e2e6eb;border-radius:18px;padding:16px;box-shadow:0 10px 28px #0001}.roomline{display:flex;gap:8px;align-items:center}.roomcode{font-size:22px;letter-spacing:2px;background:#f1f5f9;padding:8px 12px;border-radius:10px}.status{font-weight:800;margin:10px 0}.players{display:grid;grid-template-columns:1fr 1fr;gap:8px}.player{padding:9px;border-radius:10px;background:#f4f6f8}.dot{width:11px;height:11px;border-radius:50%;display:inline-block;margin-right:6px}.chat{margin-top:15px}.messages{height:260px;overflow:auto;background:#f6f8fa;border-radius:12px;padding:10px}.bubble{max-width:85%;background:#fff;padding:8px 10px;border-radius:12px;margin:7px 0;box-shadow:0 1px 4px #0001}.me{margin-left:auto;background:#e5f7eb}.small{font-size:12px;color:#667085}.chatrow{display:flex;gap:7px;margin-top:8px}.chatrow input{flex:1;border:1px solid #ddd}.emoji{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.emoji button{padding:7px;background:#f3f4f6}.modal{position:fixed;inset:0;background:#0008;display:flex;align-items:center;justify-content:center;z-index:10}.modalbox{width:min(92%,390px);background:#fff;border-radius:20px;padding:22px}.modalbox h2{margin-top:0}.modalbox input,.modalbox select{width:100%;margin:7px 0;border:1px solid #ddd}.modalbox button{width:100%;margin-top:8px}.hidden{display:none!important}
@media(max-width:900px){.layout{grid-template-columns:1fr}.board{max-width:650px;margin:auto}}
</style></head>
<body>
<header class="top"><div class="logo">Kerala <span>Play</span></div><a href="index.html">← Games</a></header>
<main class="wrap">
<div class="bar"><div><h1 style="margin:0">🎲 Online Ludo</h1><div class="small">Play with friends • invite • live chat</div></div>
<div class="actions"><button id="invite" class="primary">🔗 Invite Friends</button><button id="newRoom">➕ New Room</button></div></div>
<div class="layout">
<section><div class="board"><div class="q qr"><div class="yard"><div class="spot">1</div><div class="spot">2</div><div class="spot">3</div><div class="spot">4</div></div></div><div class="q qg"><div class="yard"><div class="spot">1</div><div class="spot">2</div><div class="spot">3</div><div class="spot">4</div></div></div><div class="q qy"><div class="yard"><div class="spot">1</div><div class="spot">2</div><div class="spot">3</div><div class="spot">4</div></div></div><div class="q qb"><div class="yard"><div class="spot">1</div><div class="spot">2</div><div class="spot">3</div><div class="spot">4</div></div></div><div class="path"></div><div class="cross"></div></div>
<div class="panel" style="margin-top:14px"><div class="roomline"><b>Room:</b><span id="code" class="roomcode">----</span><span id="status" class="status">Waiting</span></div><div style="display:flex;gap:10px;align-items:center;margin-top:8px"><b id="turn">Waiting for players…</b><span id="dice" style="font-size:35px">⚀</span><button id="roll" class="primary" disabled>Roll Dice</button></div></div>
</section>
<aside>
<div class="panel"><h2 style="margin-top:0">👥 Players</h2><div id="players" class="players"></div></div>
<div class="panel chat"><h2 style="margin-top:0">💬 Friends Chat</h2><div id="messages" class="messages"></div><div class="emoji"><button>😀</button><button>😂</button><button>❤️</button><button>🔥</button><button>👍</button><button>🎉</button><button>😎</button><button>👏</button></div><div class="chatrow"><input id="chatInput" maxlength="300" placeholder="Type a message…"><button id="send" class="primary">Send</button></div></div>
</aside></div></main>

<div id="modal" class="modal"><div class="modalbox"><h2>🎲 Join Kerala Play Ludo</h2><input id="name" maxlength="24" placeholder="Your name"><select id="count"><option value="2">2 Players</option><option value="3">3 Players</option><option value="4" selected>4 Players</option></select><input id="roomInput" maxlength="8" placeholder="Room code (leave empty to create)"><button id="join" class="primary">Create / Join Room</button><div class="small" style="margin-top:10px">A friend can join using the room code or invite link.</div></div></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="supabase-config.js"></script>
<script>
const sb=supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
const colors=[["Red","#c94141"],["Green","#258c42"],["Yellow","#c59b00"],["Blue","#2d65bd"]];
let me=null,room=null,player=null,channel=null;
const $=id=>document.getElementById(id);
function code(){return Math.random().toString(36).slice(2,8).toUpperCase()}
function escape(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
async function boot(){let {data,error}=await sb.auth.getSession();if(!data.session){let r=await sb.auth.signInAnonymously();if(r.error){alert("Supabase Anonymous Sign-in is not enabled yet. Please enable it in Supabase.");return}};me=(await sb.auth.getUser()).data.user}
async function enter(){
 const name=$("name").value.trim()||"Player";const wanted=+$("count").value;let rc=$("roomInput").value.trim().toUpperCase();
 if(!rc){rc=code();let g={players:{},turn:0,dice:0,started:false};let r=await sb.from("ludo_rooms").insert({code:rc,host_id:me.id,max_players:wanted,game:g}).select().single();if(r.error){alert(r.error.message);return}room=r.data}else{let r=await sb.from("ludo_rooms").select("*").eq("code",rc).single();if(r.error){alert("Room not found");return}room=r.data}
 let {data:ps}=await sb.from("ludo_players").select("*").eq("room_id",room.id).order("seat");let seat=ps?.findIndex(p=>p.user_id===me.id);if(seat<0||seat===undefined){if((ps?.length||0)>=room.max_players){alert("Room is full");return}seat=ps?.length||0;let p=await sb.from("ludo_players").insert({room_id:room.id,user_id:me.id,name,color:colors[seat][0],seat}).select().single();if(p.error){alert(p.error.message);return}player=p.data}else player=ps[seat];
 $("modal").classList.add("hidden");$("code").textContent=room.code;await refresh();subscribe();let url=location.origin+location.pathname+"?room="+room.code;history.replaceState({},'',url);$("status").textContent="Online";$("invite").onclick=()=>navigator.clipboard?.writeText(url).then(()=>alert("Invite link copied!"))||alert(url)
}
async function refresh(){let {data}=await sb.from("ludo_players").select("*").eq("room_id",room.id).order("seat");$("players").innerHTML=(data||[]).map(p=>`<div class="player"><span class="dot" style="background:${colors[p.seat][1]}"></span>${escape(p.name)}${p.user_id===me.id?" (You)":""}</div>`).join("");let g=room.game||{};$("turn").textContent=data?.length<2?"Waiting for friends…":(data[g.turn]?.name||"Player")+"'s turn";$("roll").disabled=!(data?.[g.turn]?.user_id===me.id&&data.length>=2);$("dice").textContent=g.dice?["⚀","⚁","⚂","⚃","⚄","⚅"][g.dice-1]:"⚀";await loadChat()}
function subscribe(){if(channel)sb.removeChannel(channel);channel=sb.channel("room-"+room.id).on("postgres_changes",{event:"*",schema:"public",table:"ludo_players",filter:"room_id=eq."+room.id},async()=>{let r=await sb.from("ludo_rooms").select("*").eq("id",room.id).single();room=r.data;refresh()}).on("postgres_changes",{event:"*",schema:"public",table:"ludo_rooms",filter:"id=eq."+room.id},async p=>{room=p.new;refresh()}).on("postgres_changes",{event:"INSERT",schema:"public",table:"ludo_messages",filter:"room_id=eq."+room.id},p=>addMessage(p.new)).subscribe()}
async function roll(){let g={...(room.game||{})};g.dice=Math.floor(Math.random()*6)+1;g.turn=((g.turn||0)+1)%room.max_players;let r=await sb.from("ludo_rooms").update({game:g,status:"playing"}).eq("id",room.id);if(r.error)alert(r.error.message)}
async function loadChat(){let r=await sb.from("ludo_messages").select("*").eq("room_id",room.id).order("created_at",{ascending:true}).limit(100);$("messages").innerHTML="";(r.data||[]).forEach(addMessage)}
function addMessage(m){let el=document.createElement("div");el.className="bubble "+(m.user_id===me.id?"me":"");el.innerHTML=`<div class="small"><b>${escape(m.name)}</b></div>${escape(m.text)}`;$("messages").appendChild(el);$("messages").scrollTop=$("messages").scrollHeight}
async function send(){let text=$("chatInput").value.trim();if(!text||!room)return;let r=await sb.from("ludo_messages").insert({room_id:room.id,user_id:me.id,name:player.name,text});if(!r.error)$("chatInput").value=""}
$("join").onclick=enter;$("roll").onclick=roll;$("send").onclick=send;$("chatInput").addEventListener("keydown",e=>{if(e.key==="Enter")send()});document.querySelectorAll(".emoji button").forEach(b=>b.onclick=()=>{$("chatInput").value+=b.textContent;$("chatInput").focus()});$("newRoom").onclick=()=>$("modal").classList.remove("hidden");
(async()=>{await boot();let q=new URLSearchParams(location.search).get("room");if(q)$("roomInput").value=q})()
</script></body></html>
```

---

