# YORU — Premium TikTok LIVE Overlay System

A complete, production-ready streaming overlay package for **@yoruichi.live** on TikTok LIVE.

---

## Project Structure

```
YORU-LIVE-OVERLAY/
├── index.html            ← Control Dashboard (open this first)
├── chatbox.html          ← Chatbox overlay source
├── follower-goal.html    ← Follower goal overlay source
├── alerts.html           ← All alerts overlay source
│
├── css/
│   ├── global.css        ← Brand tokens, resets, shared utilities
│   ├── chatbox.css       ← Chatbox styles & animations
│   ├── follower-goal.css ← Progress bar styles & animations
│   └── alerts.css        ← Alert card styles & animations
│
├── js/
│   ├── config.js         ← ★ Central configuration — edit this
│   ├── chatbox.js        ← Chatbox module
│   ├── follower-goal.js  ← Follower goal module
│   ├── alerts.js         ← Alert queue module
│   └── integrations.js   ← TikTok event adapter + demo mode
│
└── assets/
    ├── fonts/            ← Add custom .woff2 fonts here
    └── sounds/           ← Add .mp3 alert sounds here
```

---

## Quick Start (Local Testing)

1. Download or clone this project folder.
2. Open `index.html` in a modern browser (Chrome recommended).
3. Click **▶ Start Demo** to see all widgets animate with simulated events.
4. Use the left sidebar controls to adjust the appearance live.
5. Click individual test buttons to trigger specific event types.

> **Note:** Some browsers block local file loading of fonts. For best results, serve the files locally using a simple HTTP server (see below).

### Simple local server (Node.js)

```bash
npx serve .
# Then open http://localhost:3000
```

### Simple local server (Python)

```bash
python -m http.server 8080
# Then open http://localhost:8080
```

---

## Customization

All settings are in `js/config.js`. Key options:

```js
chatbox: {
  maxMessages:      8,       // How many messages to show at once
  messageDuration:  12000,   // ms before messages fade (0 = keep forever)
  fontSize:         14,      // px
  backgroundOpacity: 0.82,   // 0–1 panel transparency
}

followerGoal: {
  current: 125,              // Current follower count
  target:  200,              // Goal target
  glowEnabled: true,         // Glow on progress tip
}

alerts: {
  duration:    4500,         // ms each alert stays on screen
  sound: {
    follow: './assets/sounds/follow.mp3',   // null to disable
    gift:   './assets/sounds/gift.mp3',
  }
}
```

---

## TikTok LIVE Integration

### How it works

TikTok does not expose an official public API for LIVE events. The recommended community approach uses:

**[tiktok-live-connector](https://github.com/zerodytrash/TikTok-Live-Connector)** — an unofficial Node.js library that connects to TikTok's internal WebSocket protocol to relay chat, follows, and gift events.

> ⚠️ This is an unofficial integration. TikTok may change their protocol at any time. The visual widgets remain fully functional without it (use demo mode).

### Bridge Server Setup

1. Install Node.js (v18+): https://nodejs.org

2. Create a `bridge/` folder beside this project, then:

```bash
mkdir bridge && cd bridge
npm init -y
npm install tiktok-live-connector ws
```

3. Create `bridge/server.js`:

```js
const { WebcastPushConnection } = require('tiktok-live-connector');
const WebSocket = require('ws');

const TIKTOK_USERNAME = 'yoruichi.live'; // ← your username
const WS_PORT = 8765;

const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`Bridge listening on ws://localhost:${WS_PORT}`);

const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

tiktok.connect().catch(err => console.error('TikTok connect error:', err));

tiktok.on('chat', data => {
  broadcast({ type: 'chat', ...data });
});

tiktok.on('follow', data => {
  broadcast({ type: 'follow', ...data });
});

tiktok.on('gift', data => {
  if (data.giftType === 1 && !data.repeatEnd) return; // skip streaking gifts mid-combo
  broadcast({ type: 'gift', ...data });
});

tiktok.on('subscribe', data => {
  broadcast({ type: 'subscribe', ...data });
});

function broadcast(msg) {
  const json = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(json);
  });
}
```

4. Run while you're live:

```bash
node bridge/server.js
```

5. Open `index.html` — the dashboard status bar will turn green when connected.

### Events Supported

| Event       | Supported  | Notes                                     |
|-------------|-----------|-------------------------------------------|
| Chat        | ✅ Yes     | Username, message, avatar                 |
| Follow      | ✅ Yes     | Username, avatar                          |
| Gifts       | ✅ Yes     | Gift name, quantity, avatar               |
| Subscriber  | ⚠️ Limited | Only emitted on certain subscription types|

---

## Adding Overlays as Browser Sources

### OBS Studio / StreamLabs

1. Add a **Browser Source** for each widget.
2. Set URL to the absolute local path, e.g.:
   `file:///C:/YORU-LIVE-OVERLAY/chatbox.html`
   or use the `npx serve` local URL: `http://localhost:3000/chatbox.html`
3. Set dimensions:
   - Chatbox: **420 × 600**
   - Follower Goal: **480 × 90**
   - Alerts: **380 × 500**
4. Check **Transparent background** / **Custom CSS: `body { background: transparent; }`**

### TikTok LIVE Studio

TikTok LIVE Studio (Windows) has **limited browser-source support** compared to OBS. As of the latest versions:

- TikTok LIVE Studio supports a **Web View** / **Browser Source** layer.
- Navigate to: `Add Layer → Browser Source`
- Enter the local file URL or the localhost URL from `npx serve`.
- Set width/height to match the values above.

**If TikTok LIVE Studio does not support local file URLs:**

Option A — Use `npx serve .` to host locally and use `http://localhost:3000/chatbox.html`

Option B — Upload the project to a free static hosting service (Netlify, GitHub Pages, Vercel) and use the hosted URL.

Option C — Run OBS Studio alongside TikTok LIVE Studio in a virtual-camera or monitor-capture workflow.

> Always test transparency: add a bright colored image behind the browser source to verify the background is truly transparent.

---

## Widget Positioning

Adjust positions in `js/config.js`:

```js
chatbox:      { position: { bottom: 20, left: 20 } }
followerGoal: { position: { top: 20, left: 20 } }
alerts:       { position: { top: '50%', right: 20 } }
```

Or override at runtime from the dashboard controls.

---

## Alert Sounds

Place audio files in `assets/sounds/`, then update `config.js`:

```js
alerts: {
  sound: {
    follow: './assets/sounds/follow.mp3',
    gift:   './assets/sounds/gift.mp3',
    subscriber: './assets/sounds/sub.mp3',
  }
}
```

Recommended format: `.mp3`, short (< 3s), normalized volume.

---

## Known Limitations

1. **TikTok has no official LIVE API** — the bridge uses an unofficial protocol that may break after TikTok updates.
2. **Subscriber events** are limited — TikTok does not consistently expose subscription events via this method.
3. **Profile pictures** from TikTok may not load due to CORS — the widgets gracefully fall back to initials.
4. **TikTok LIVE Studio browser sources** — support varies by version; test with your installed version.
5. **Local file loading** — open from a local HTTP server, not `file://`, for fonts to load correctly.

---

## Credits & Dependencies

- Fonts: [Rajdhani](https://fonts.google.com/specimen/Rajdhani) + [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts
- TikTok bridge: [tiktok-live-connector](https://github.com/zerodytrash/TikTok-Live-Connector) by zerodytrash (MIT)
- No other runtime dependencies — pure HTML/CSS/JS

---

*YORU Overlay System — built for @yoruichi.live*
