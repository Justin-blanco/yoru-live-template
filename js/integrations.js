/**
 * YORU LIVE OVERLAY — TIKTOK INTEGRATION ADAPTER
 * ─────────────────────────────────────────────────────────────
 *
 * STATUS: ADAPTER LAYER — real TikTok connection requires
 * an external Node.js bridge. See README.md for setup.
 *
 * HOW IT WORKS:
 *   1.  This file sets up a WebSocket client that connects
 *       to a local Node.js bridge server.
 *   2.  The bridge server uses `tiktok-live-connector` (npm)
 *       to authenticate with TikTok and relay events.
 *   3.  When events arrive, this adapter fires custom DOM
 *       events that the widget modules listen to.
 *
 * EVENTS FIRED:
 *   yoru:chat       — { username, text, avatarUrl, badges }
 *   yoru:follow     — { username, avatarUrl }
 *   yoru:gift       — { username, giftName, giftQty, avatarUrl }
 *   yoru:subscriber — { username, avatarUrl }   (if supported)
 *
 * To use demo mode (no real connection), call:
 *   YoruIntegrations.startDemo()
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  const BRIDGE_URL = 'ws://localhost:8765';
  let ws = null;
  let reconnectTimer = null;
  let demoInterval = null;
  let statusCallback = null;

  /* ── Event dispatcher ── */
  function dispatch(type, detail) {
    document.dispatchEvent(new CustomEvent(type, { detail }));
  }

  /* ── WebSocket bridge ── */
  function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    ws = new WebSocket(BRIDGE_URL);

    ws.onopen = () => {
      console.log('[YORU] Bridge connected');
      if (statusCallback) statusCallback('connected');
      clearTimeout(reconnectTimer);
    };

    ws.onmessage = ({ data }) => {
      let msg;
      try { msg = JSON.parse(data); } catch { return; }
      handleBridgeMessage(msg);
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      console.log('[YORU] Bridge disconnected — retrying in 5s');
      if (statusCallback) statusCallback('disconnected');
      reconnectTimer = setTimeout(connect, 5000);
    };
  }

  function disconnect() {
    clearTimeout(reconnectTimer);
    if (ws) { ws.close(); ws = null; }
  }

  /* ── Map bridge message → YORU events ── */
  function handleBridgeMessage(msg) {
    switch (msg.type) {
      case 'chat':
        dispatch('yoru:chat', {
          username:  msg.uniqueId  || msg.username || 'User',
          text:      msg.comment   || msg.text     || '',
          avatarUrl: msg.profilePictureUrl || null,
          badges:    mapBadges(msg),
        });
        break;

      case 'follow':
        dispatch('yoru:follow', {
          username:  msg.uniqueId  || msg.username || 'User',
          avatarUrl: msg.profilePictureUrl || null,
        });
        // Also update follower goal if the module is loaded
        if (window.YoruFollowerGoal) {
          YoruFollowerGoal.incrementFollowers(1);
        }
        break;

      case 'gift':
        dispatch('yoru:gift', {
          username:  msg.uniqueId   || msg.username || 'User',
          giftName:  msg.giftName   || msg.gift     || 'Gift',
          giftQty:   msg.repeatCount || 1,
          avatarUrl: msg.profilePictureUrl || null,
        });
        break;

      case 'subscribe':
        dispatch('yoru:subscriber', {
          username:  msg.uniqueId  || msg.username || 'User',
          avatarUrl: msg.profilePictureUrl || null,
        });
        break;

      default:
        // Unknown message type — ignore
        break;
    }
  }

  function mapBadges(msg) {
    const badges = [];
    if (msg.isModerator) badges.push('mod');
    if (msg.isSubscriber) badges.push('sub');
    if (msg.userId === msg.roomHostId) badges.push('owner');
    return badges;
  }

  /* ── Demo / test mode ── */
  const DEMO_USERS = [
    'ShadowKnight', 'CrimsonBlade', 'NightOwl99', 'VoidWalker',
    'StarForge', 'DarkMatter', 'GhostRider', 'IceBreaker',
    'ThunderWolf', 'ArcaneWitch', 'NeonRaider', 'EchoStorm',
  ];

  const DEMO_MESSAGES = [
    'YORU PogChamp', 'GG WP!', 'Let\'s gooo 🔥', 'That clip was insane',
    'First time watching, this is sick', 'W streamer', 'What game is this?',
    'VOD gang 👀', 'Clip it!', 'YORU best streamer no cap',
    'The grind never stops', 'You\'re actually cracked at this',
    'More streams please!', 'PauseChamp', 'What\'s your setup?',
  ];

  const DEMO_GIFTS = [
    { name: 'Rose',        qty: 1  },
    { name: 'Galaxy',      qty: 5  },
    { name: 'Lion',        qty: 1  },
    { name: 'Universe',    qty: 1  },
    { name: 'TikTok',      qty: 10 },
    { name: 'Mic Drop',    qty: 3  },
  ];

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function demoChat() {
    const user    = rand(DEMO_USERS);
    const badges  = Math.random() < 0.15 ? ['mod'] : Math.random() < 0.25 ? ['sub'] : [];
    dispatch('yoru:chat', { username: user, text: rand(DEMO_MESSAGES), avatarUrl: null, badges });
  }

  function demoFollow() {
    dispatch('yoru:follow', { username: rand(DEMO_USERS) });
    if (window.YoruFollowerGoal) YoruFollowerGoal.incrementFollowers(1);
  }

  function demoGift() {
    const g = rand(DEMO_GIFTS);
    dispatch('yoru:gift', { username: rand(DEMO_USERS), giftName: g.name, giftQty: g.qty });
  }

  function demoSubscriber() {
    dispatch('yoru:subscriber', { username: rand(DEMO_USERS) });
  }

  function startDemo(rate = 2500) {
    stopDemo();
    demoChat();
    demoInterval = setInterval(() => {
      const roll = Math.random();
      if      (roll < 0.70) demoChat();
      else if (roll < 0.85) demoFollow();
      else if (roll < 0.95) demoGift();
      else                  demoSubscriber();
    }, rate);
    console.log('[YORU] Demo mode started');
  }

  function stopDemo() {
    clearInterval(demoInterval);
    demoInterval = null;
  }

  /* ── Init ── */
  function init() {
    // Try to connect to bridge; fall back gracefully if unavailable
    try { connect(); } catch (e) {
      console.warn('[YORU] Bridge unavailable — use startDemo() for testing');
    }
  }

  /* ── Public API ── */
  window.YoruIntegrations = {
    init,
    connect,
    disconnect,
    startDemo,
    stopDemo,
    onStatus: fn => { statusCallback = fn; },
    // Manual triggers for dashboard buttons
    triggerChat:       demoChat,
    triggerFollow:     demoFollow,
    triggerGift:       demoGift,
    triggerSubscriber: demoSubscriber,
  };

})();
