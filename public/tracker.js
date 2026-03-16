/**
 * AccountIQ Visitor Tracker v1.0
 * Embed on your website to identify anonymous B2B visitors.
 *
 * Usage:
 *   <script src="https://your-accountiq-domain.com/tracker.js"
 *           data-api-key="aiq_YOUR_KEY" async></script>
 */
(function () {
  'use strict';

  // ─── Locate this script tag & read config ────────────────────────────────
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var apiKey = currentScript ? currentScript.getAttribute('data-api-key') : null;
  if (!apiKey) {
    console.warn('[AccountIQ] No data-api-key attribute found on the script tag. Tracking is disabled.');
    return;
  }

  // Derive the API base URL from where this script was served
  var apiBase = '';
  if (currentScript && currentScript.src) {
    try { apiBase = new URL(currentScript.src).origin; } catch (e) {}
  }
  if (!apiBase) {
    console.warn('[AccountIQ] Could not determine API base URL. Tracking is disabled.');
    return;
  }

  var ENDPOINT = apiBase + '/api/track';

  // ─── Session ID (per browser tab) ────────────────────────────────────────
  var SESSION_KEY   = '_aiq_sid';
  var COUNTED_KEY   = '_aiq_counted';
  var VISITS_KEY    = '_aiq_visits';

  var sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = 'aiq_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  // ─── Weekly visit counter (persisted across sessions via localStorage) ───
  function getISOWeek() {
    var d = new Date();
    return d.getFullYear() + '-W' + Math.ceil(
      (((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7
    );
  }

  var weeklyVisits = 1;
  try {
    var stored = JSON.parse(localStorage.getItem(VISITS_KEY) || 'null');
    var thisWeek = getISOWeek();
    if (stored && stored.week === thisWeek) {
      weeklyVisits = stored.count;
      // Only increment if this is a fresh session (not a page reload within the same tab)
      if (!sessionStorage.getItem(COUNTED_KEY)) {
        weeklyVisits++;
        sessionStorage.setItem(COUNTED_KEY, '1');
      }
    } else {
      // New week — reset
      weeklyVisits = 1;
      sessionStorage.setItem(COUNTED_KEY, '1');
    }
    localStorage.setItem(VISITS_KEY, JSON.stringify({ week: thisWeek, count: weeklyVisits }));
  } catch (e) {
    // localStorage not available (private mode etc.) — default to 1
  }

  // ─── Page view tracking (supports SPAs) ──────────────────────────────────
  var pages = [];
  var startTime = Date.now();
  var sent = false;

  function recordPage() {
    var path = window.location.pathname + (window.location.search || '');
    if (!pages.length || pages[pages.length - 1] !== path) {
      pages.push(path);
    }
  }

  recordPage();

  // Intercept SPA navigation
  var _pushState = history.pushState;
  history.pushState = function () {
    _pushState.apply(history, arguments);
    setTimeout(recordPage, 0);
  };
  window.addEventListener('popstate', recordPage);

  // ─── Referral source ─────────────────────────────────────────────────────
  var referralSource = 'direct';
  if (document.referrer) {
    try {
      var refHost = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (refHost.includes('google')) referralSource = 'google';
      else if (refHost.includes('linkedin')) referralSource = 'linkedin';
      else if (refHost.includes('twitter') || refHost.includes('t.co')) referralSource = 'twitter';
      else if (refHost.includes('bing')) referralSource = 'bing';
      else if (refHost.includes('facebook') || refHost.includes('fb.com')) referralSource = 'facebook';
      else referralSource = refHost;
    } catch (e) {
      referralSource = document.referrer;
    }
  }

  // ─── Send beacon ─────────────────────────────────────────────────────────
  function send() {
    if (sent) return;
    sent = true;

    var dwellSeconds = Math.round((Date.now() - startTime) / 1000);
    var payload = JSON.stringify({
      api_key:             apiKey,
      visitor_id:          sessionId,
      pages_visited:       pages,
      dwell_time_seconds:  dwellSeconds,
      visits_this_week:    weeklyVisits,
      referral_source:     referralSource,
    });

    // sendBeacon is the most reliable way to send data on page unload.
    // We pass a plain string (text/plain) to avoid CORS preflight.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, payload);
    } else {
      // Synchronous XHR fallback for older browsers
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', ENDPOINT, false);
        xhr.setRequestHeader('Content-Type', 'text/plain');
        xhr.send(payload);
      } catch (e) {}
    }
  }

  // Send on all exit events
  window.addEventListener('pagehide', send);
  window.addEventListener('beforeunload', send);

  // Also send after 2 minutes of activity (catches long sessions without navigation)
  setTimeout(function () {
    if (!sent) {
      sent = false; // allow re-send on exit too
      var dwellSeconds = Math.round((Date.now() - startTime) / 1000);
      var payload = JSON.stringify({
        api_key:            apiKey,
        visitor_id:         sessionId,
        pages_visited:      pages,
        dwell_time_seconds: dwellSeconds,
        visits_this_week:   weeklyVisits,
        referral_source:    referralSource,
      });
      try { navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, payload); } catch (e) {}
    }
  }, 120000);

})();
