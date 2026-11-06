/**
 * YORU LIVE OVERLAY — CENTRALIZED CONFIGURATION
 * Edit values here to customize all overlay widgets.
 * No other files need to be modified for basic customization.
 */

const YORU_CONFIG = {

  /* ── Brand ── */
  brand: {
    name:    'YORU',
    handle:  '@yoruichi.live',
    tagline: 'YORU COMMUNITY',
  },

  /* ── Palette (mirrors CSS variables; also used by JS components) ── */
  colors: {
    bg:          '#0A0A0D',
    surface:     '#15151B',
    surfaceAlt:  '#1C1C24',
    border:      'rgba(255,255,255,0.07)',
    accent:      '#E32636',
    accentDim:   'rgba(227,38,54,0.18)',
    accentGlow:  'rgba(227,38,54,0.45)',
    silver:      '#A7A7B2',
    white:       '#F4F4F8',
    muted:       'rgba(244,244,248,0.45)',
  },

  /* ── Chatbox ── */
  chatbox: {
    maxMessages:          8,       // max visible messages
    messageDuration:      12000,   // ms before a message fades out (0 = never)
    animationSpeed:       350,     // ms for enter/exit transitions
    width:                420,     // px
    fontSize:             14,      // px
    messageSpacing:       8,       // px between messages
    backgroundOpacity:    0.82,    // 0–1
    borderRadius:         8,       // px
    showAvatars:          true,
    showBadges:           true,
    position: { bottom: 20, left: 20 },   // px from edge (overlay coords)
  },

  /* ── Follower Goal ── */
  followerGoal: {
    current:        125,
    target:         200,
    label:          'FOLLOWER GOAL',
    animDuration:   800,            // ms for bar fill animation
    glowEnabled:    true,
    completionAnim: true,
    width:          480,            // px
    position: { top: 20, left: 20 },
  },

  /* ── Alerts (follower / gift / sub) ── */
  alerts: {
    duration:          4500,   // ms on screen
    animDuration:      500,    // enter/exit ms
    queueDelay:        600,    // ms gap between queued alerts
    position: { top: '50%', right: 20 },   // overlay coords
    sound: {
      follow:     null,   // path to audio file, or null to disable
      gift:       null,
      subscriber: null,
    },
  },

};

/* Make config globally accessible */
if (typeof module !== 'undefined') module.exports = YORU_CONFIG;
