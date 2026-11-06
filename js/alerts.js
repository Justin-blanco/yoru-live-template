/**
 * YORU LIVE OVERLAY — ALERTS MODULE
 * Queue-based alert system for follow, gift, and subscriber events.
 */

(function () {
  'use strict';

  const cfg = YORU_CONFIG.alerts;

  let container;
  let queue    = [];
  let active   = false;

  /* ── Build alert element ── */
  function buildAlert(data) {
    const { type, username, giftName, giftQty, avatarUrl } = data;

    const el = document.createElement('div');
    el.className = `yoru-alert alert-${type}`;

    // Background glow
    const glow = document.createElement('div');
    glow.className = 'alert-bg-glow';
    el.appendChild(glow);

    // Inner grid
    const inner = document.createElement('div');
    inner.className = 'alert-inner';

    // Icon / avatar
    if (avatarUrl) {
      const av = document.createElement('div');
      av.className = 'alert-avatar';
      const img = document.createElement('img');
      img.src = avatarUrl;
      img.alt = '';
      img.onerror = () => {
        av.removeChild(img);
        av.textContent = (username || '?').slice(0, 2).toUpperCase();
      };
      av.appendChild(img);
      inner.appendChild(av);
    } else {
      const iconWrap = document.createElement('div');
      iconWrap.className = 'alert-icon-wrap';
      const icon = document.createElement('span');
      icon.className = 'alert-icon';
      icon.textContent = type === 'follow' ? '＋' : type === 'gift' ? '🎁' : '★';
      iconWrap.appendChild(icon);
      inner.appendChild(iconWrap);
    }

    // Content
    const content = document.createElement('div');
    content.className = 'alert-content';

    const label = document.createElement('div');
    label.className = 'alert-type-label';
    label.textContent = type === 'follow' ? 'NEW FOLLOWER'
                      : type === 'gift'   ? 'GIFT RECEIVED'
                      :                     'NEW SUBSCRIBER';
    content.appendChild(label);

    const uname = document.createElement('div');
    uname.className = 'alert-username';
    uname.textContent = username || 'Anonymous';
    content.appendChild(uname);

    const sub = document.createElement('div');
    sub.className = 'alert-subtext';

    if (type === 'follow') {
      sub.textContent = 'Welcome to the YORU community!';
    } else if (type === 'gift') {
      sub.innerHTML = `Sent <strong>${giftName || 'a gift'}</strong>`;
      if (giftQty && giftQty > 1) {
        const qty = document.createElement('span');
        qty.className = 'alert-qty';
        qty.textContent = `×${giftQty}`;
        sub.appendChild(qty);
      }
      sub.innerHTML += ' — thank you for the support!';
    } else {
      sub.textContent = 'Welcome to the community!';
    }
    content.appendChild(sub);

    inner.appendChild(content);
    el.appendChild(inner);

    // Timer bar
    const timer = document.createElement('div');
    timer.className = 'alert-timer';
    timer.style.color = type === 'gift' ? '#FFB91E' : type === 'subscriber' ? '#BBA4FF' : 'var(--yoru-accent)';
    timer.style.animationDuration = cfg.duration + 'ms';
    el.appendChild(timer);

    return el;
  }

  /* ── Show next in queue ── */
  function showNext() {
    if (active || queue.length === 0) return;
    active = true;

    const data = queue.shift();
    const el   = buildAlert(data);
    container.appendChild(el);

    // Play sound
    const soundPath = cfg.sound[data.type];
    if (soundPath) {
      try {
        const audio = new Audio(soundPath);
        audio.volume = 0.6;
        audio.play().catch(() => {});
      } catch (e) {}
    }

    // Auto-dismiss
    setTimeout(() => {
      el.classList.add('alert-exiting');
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
        active = false;
        setTimeout(showNext, cfg.queueDelay);
      }, cfg.animDuration + 50);
    }, cfg.duration);
  }

  /* ── Enqueue alert ── */
  function triggerAlert(data) {
    queue.push(data);
    showNext();
  }

  /* ── Init ── */
  function init() {
    container = document.getElementById('yoru-alerts');
    if (!container) return;

    document.addEventListener('yoru:follow',     e => triggerAlert({ type: 'follow',     ...e.detail }));
    document.addEventListener('yoru:gift',       e => triggerAlert({ type: 'gift',       ...e.detail }));
    document.addEventListener('yoru:subscriber', e => triggerAlert({ type: 'subscriber', ...e.detail }));
  }

  window.YoruAlerts = { init, triggerAlert };

  document.addEventListener('DOMContentLoaded', init);
})();
