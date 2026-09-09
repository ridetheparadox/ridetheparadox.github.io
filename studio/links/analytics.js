/* PARADOX — analytics loader.
 *
 * ONE FILE, BOTH SITES. Drop it in and add <script src="analytics.js" defer></script>
 * (or ./links/analytics.js from the root page).
 *
 * ---------------------------------------------------------------------------
 * FILL THESE IN. Leave either blank and that provider is simply skipped, so the
 * page keeps working before the accounts exist.
 * --------------------------------------------------------------------------- */
var PDX_GA4_ID = 'G-LRQBSDTF9T';   // Google Analytics 4 — property "PARADOX", created 2026-09-05
var PDX_META_PIXEL_ID = '';   // e.g. '1234567890123' — Meta Pixel

/* ---------------------------------------------------------------------------
 * CONSENT
 * The main site already asks, and stores the answer in localStorage as
 * `pdxCookies` = 'all' | 'essential'. Analytics loads ONLY on 'all'. That key is
 * shared across the whole netlify.app origin, so someone who accepted on the
 * main site is not asked again here.
 *
 * The /links page has no gate by design — cold social traffic will not sit
 * through one — so it shows a small dismissable bar instead of a wall.
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';

  var CONSENT_KEY = 'pdxCookies';

  function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function writeConsent(v) {
    try {
      localStorage.setItem(CONSENT_KEY, v);
      localStorage.setItem('pdxConsentAt', new Date().toISOString());
    } catch (e) {}
  }

  var loaded = false;

  function loadProviders() {
    if (loaded) return;
    loaded = true;

    if (PDX_GA4_ID) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(PDX_GA4_ID);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', PDX_GA4_ID);
    }

    if (PDX_META_PIXEL_ID) {
      /* Standard Meta Pixel bootstrap, reformatted but functionally unchanged. */
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = true; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', PDX_META_PIXEL_ID);
      window.fbq('track', 'PageView');
    }
  }

  /* --------------------------------------------------------------------- */
  /* Outbound click tracking — the entire point of a link-in-bio page.      */
  /* Records WHICH card was tapped, so we learn whether bio traffic wants   */
  /* to hire, to subscribe, to buy merch, or to grab a tool.               */
  /* --------------------------------------------------------------------- */
  function label(a) {
    var t = a.querySelector('.t');
    if (t && t.textContent) return t.textContent.trim();
    return (a.getAttribute('aria-label') || a.href || 'link').trim();
  }

  function trackOutbound(e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.href || '';
    if (!/^https?:/i.test(href)) return;
    if (a.host === location.host) return;             // internal, not outbound

    var name = label(a);
    try {
      if (window.gtag) {
        window.gtag('event', 'outbound_click', {
          link_url: href,
          link_text: name,
          transport_type: 'beacon'
        });
      }
      if (window.fbq) {
        // ViewContent rather than a custom event so it shows up in standard reporting.
        window.fbq('trackCustom', 'OutboundClick', { destination: href, card: name });
      }
    } catch (err) { /* never let analytics break a link */ }
  }

  document.addEventListener('click', trackOutbound, true);

  /* --------------------------------------------------------------------- */
  /* The consent bar — only ever shown when no answer is stored yet.        */
  /* --------------------------------------------------------------------- */
  function bar() {
    var wrap = document.createElement('div');
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Cookie choices');
    wrap.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:9999',
      'background:#0C0E12', 'border-top:1px solid #1C2027',
      'padding:13px 16px calc(13px + env(safe-area-inset-bottom))',
      'display:flex', 'flex-wrap:wrap', 'gap:10px', 'align-items:center',
      'justify-content:center', 'font:400 12.5px/1.5 "Space Grotesk",system-ui,sans-serif',
      'color:#9AA2AC'
    ].join(';');

    var txt = document.createElement('span');
    txt.textContent = 'We use analytics cookies to see which links people use.';
    txt.style.cssText = 'flex:1 1 210px;min-width:180px';

    function btn(text, primary) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.style.cssText = [
        'font:600 11px/1 "Chakra Petch",system-ui,sans-serif', 'letter-spacing:.14em',
        'text-transform:uppercase', 'padding:10px 13px', 'border-radius:8px',
        'cursor:pointer', 'white-space:nowrap',
        primary ? 'background:#E8ECF1;color:#050506;border:1px solid #E8ECF1'
                : 'background:transparent;color:#9AA2AC;border:1px solid #333B4A'
      ].join(';');
      return b;
    }

    var yes = btn('Accept', true);
    var no = btn('Essential only', false);

    yes.addEventListener('click', function () {
      writeConsent('all'); loadProviders(); wrap.remove();
    });
    no.addEventListener('click', function () {
      writeConsent('essential'); wrap.remove();
    });

    wrap.appendChild(txt); wrap.appendChild(no); wrap.appendChild(yes);
    document.body.appendChild(wrap);
  }

  function start() {
    var c = readConsent();
    if (c === 'all') { loadProviders(); return; }
    if (c === 'essential') return;                    // respected, no bar, no nagging
    if (!PDX_GA4_ID && !PDX_META_PIXEL_ID) return;    // nothing to consent to yet

    /* The main site asks for consent in its own entry gate. Setting
       window.PDX_SUPPRESS_BAR = true before this script loads stops us stacking a
       second consent UI on top of it — we just wait for the gate's answer. */
    if (window.PDX_SUPPRESS_BAR) {
      var tries = 0;
      var poll = setInterval(function () {
        if (readConsent() === 'all') { clearInterval(poll); loadProviders(); }
        else if (readConsent() === 'essential' || ++tries > 600) { clearInterval(poll); }
      }, 500);
      return;
    }
    bar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
