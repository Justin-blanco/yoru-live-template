/**
 * YORU LIVE OVERLAY — FOLLOWER GOAL MODULE
 * Animated progress bar with configurable targets.
 */

(function () {
  'use strict';

  const cfg = YORU_CONFIG.followerGoal;

  let fillEl, currentEl, pctEl, panelEl;
  let _current = cfg.current;
  let _target  = cfg.target;

  /* ── Apply CSS variables ── */
  function applyConfig() {
    const root = document.documentElement;
    root.style.setProperty('--goal-width', cfg.width + 'px');
    root.style.setProperty('--goal-top',   (cfg.position.top  || 20) + 'px');
    root.style.setProperty('--goal-left',  (cfg.position.left || 20) + 'px');
  }

  /* ── Render ── */
  function render(animate) {
    if (!fillEl) return;

    const pct = Math.min((_current / _target) * 100, 100);

    if (animate) {
      // Animate counter from old to new
      const startPct = parseFloat(fillEl.style.width) || 0;
      const startCount = parseInt(currentEl.textContent) || 0;
      const duration = cfg.animDuration;
      const startTime = performance.now();

      function step(now) {
        const p = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4); // ease-out-quart

        fillEl.style.width = (startPct + (pct - startPct) * ease) + '%';
        currentEl.textContent = Math.round(startCount + (_current - startCount) * ease);
        pctEl.textContent = (startPct + (pct - startPct) * ease).toFixed(1) + '%';

        if (p < 1) requestAnimationFrame(step);
        else {
          fillEl.style.width = pct + '%';
          currentEl.textContent = _current;
          pctEl.textContent = pct.toFixed(1) + '%';
          if (pct >= 100 && cfg.completionAnim) panelEl.classList.add('goal-complete');
          else panelEl.classList.remove('goal-complete');
        }
      }

      requestAnimationFrame(step);
    } else {
      fillEl.style.width = pct + '%';
      currentEl.textContent = _current;
      pctEl.textContent = pct.toFixed(1) + '%';
      if (pct >= 100 && cfg.completionAnim) panelEl.classList.add('goal-complete');
    }
  }

  /* ── Public methods ── */
  function setValues(current, target, animate = true) {
    if (target !== undefined) _target  = target;
    if (current !== undefined) _current = current;
    document.getElementById('yoru-goal-target').textContent = _target;
    render(animate);
  }

  function incrementFollowers(n = 1) {
    setValues(_current + n, _target, true);
  }

  /* ── Init ── */
  function init() {
    applyConfig();

    panelEl    = document.querySelector('.goal-panel');
    fillEl     = document.getElementById('yoru-goal-fill');
    currentEl  = document.getElementById('yoru-goal-current');
    pctEl      = document.getElementById('yoru-goal-pct');

    if (!fillEl) return;

    // Glow class
    if (cfg.glowEnabled) fillEl.classList.add('glow-enabled');

    // Set initial values without animation (quiet on load)
    _current = cfg.current;
    _target  = cfg.target;
    document.getElementById('yoru-goal-target').textContent = _target;
    render(false);

    // Trigger animated entrance after a tick
    requestAnimationFrame(() => render(true));

    // Listen for events
    document.addEventListener('yoru:follow', () => incrementFollowers(1));
  }

  window.YoruFollowerGoal = { init, setValues, incrementFollowers };

  document.addEventListener('DOMContentLoaded', init);
})();
