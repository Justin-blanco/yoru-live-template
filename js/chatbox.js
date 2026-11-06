/**
 * YORU LIVE OVERLAY — CHATBOX MODULE
 * Renders incoming chat messages with entrance/exit animations.
 * Receives events via YoruEventBus.
 */

(function () {
  'use strict';

  const cfg = YORU_CONFIG.chatbox;

  /* ── Apply CSS variables from config ── */
  function applyConfig() {
    const root = document.documentElement;
    root.style.setProperty('--chatbox-width',   cfg.width + 'px');
    root.style.setProperty('--chatbox-font',    cfg.fontSize + 'px');
    root.style.setProperty('--chatbox-spacing', cfg.messageSpacing + 'px');
    root.style.setProperty('--chatbox-opacity', cfg.backgroundOpacity);
    root.style.setProperty('--chatbox-radius',  cfg.borderRadius + 'px');
    root.style.setProperty('--chatbox-anim',    cfg.animationSpeed + 'ms');
    root.style.setProperty('--chatbox-bottom',  (cfg.position.bottom || 20) + 'px');
    root.style.setProperty('--chatbox-left',    (cfg.position.left   || 20) + 'px');
  }

  /* ── State ── */
  let messageQueue = [];
  let container;

  /* ── Helpers ── */
  function getInitials(username) {
    return (username || '?').slice(0, 2).toUpperCase();
  }

  function sanitize(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function colorForUser(username) {
    // Deterministic hue from username — avoids pure red (conflict with accent)
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
    const hue = ((Math.abs(hash) % 300) + 10) % 360; // skip 350-360 (near accent red)
    return `hsl(${hue}, 70%, 72%)`;
  }

  /* ── Build message DOM ── */
  function buildMessage(data) {
    const { username, text, avatarUrl, badges = [], type } = data;

    const el = document.createElement('div');
    el.className = 'chat-message chat-fresh';
    if (!cfg.showAvatars) el.classList.add('no-avatar');

    // Avatar
    if (cfg.showAvatars) {
      const avatarEl = document.createElement('div');
      avatarEl.className = 'chat-avatar';
      if (avatarUrl) {
        const img = document.createElement('img');
        img.src = avatarUrl;
        img.alt = '';
        img.onerror = () => {
          avatarEl.removeChild(img);
          avatarEl.textContent = getInitials(username);
        };
        avatarEl.appendChild(img);
      } else {
        avatarEl.textContent = getInitials(username);
        avatarEl.style.color = colorForUser(username);
      }
      el.appendChild(avatarEl);
    }

    // Content
    const contentEl = document.createElement('div');
    contentEl.className = 'chat-content';

    // Username row
    const nameEl = document.createElement('div');
    nameEl.className = 'chat-username';
    nameEl.style.color = colorForUser(username);

    if (cfg.showBadges && badges.length) {
      badges.forEach(badge => {
        const b = document.createElement('span');
        b.className = `chat-badge chat-badge-${badge}`;
        b.textContent = badge === 'mod' ? 'MOD' : badge === 'sub' ? 'SUB' : badge.toUpperCase();
        nameEl.appendChild(b);
      });
    }

    nameEl.appendChild(document.createTextNode(sanitize(username)));
    contentEl.appendChild(nameEl);

    // Message text
    const textEl = document.createElement('div');
    textEl.className = 'chat-text';
    textEl.innerHTML = sanitize(text);
    contentEl.appendChild(textEl);

    el.appendChild(contentEl);

    // Remove fresh accent border after 1.5s
    setTimeout(() => el.classList.remove('chat-fresh'), 1500);

    return el;
  }

  /* ── Add message ── */
  function addMessage(data) {
    if (!container) return;

    const el = buildMessage(data);
    container.prepend(el); // newest at bottom (column-reverse)
    messageQueue.push(el);

    // Trim overflow
    while (messageQueue.length > cfg.maxMessages) {
      const old = messageQueue.shift();
      removeMessage(old);
    }

    // Auto-expire
    if (cfg.messageDuration > 0) {
      setTimeout(() => removeMessage(el), cfg.messageDuration);
    }
  }

  /* ── Remove message ── */
  function removeMessage(el) {
    if (!el || !el.parentNode) return;
    el.classList.add('chat-exiting');
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, cfg.animationSpeed + 50);
    messageQueue = messageQueue.filter(m => m !== el);
  }

  /* ── Init ── */
  function init() {
    applyConfig();
    container = document.getElementById('yoru-chatbox');
    if (!container) return;

    // Listen for events
    document.addEventListener('yoru:chat', e => addMessage(e.detail));
  }

  /* ── Public API ── */
  window.YoruChatbox = { init, addMessage };

  document.addEventListener('DOMContentLoaded', init);
})();
