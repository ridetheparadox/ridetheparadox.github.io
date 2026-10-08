/* PARADOX ads landing page.
 * Sample videos load only when on screen and stay as posters on reduced motion, data-saver or a failed load.
 * The enquiry form posts to the same Formspree endpoint as the studio page.
 * Analytics follows the studio's consent: GA4 loads only after "Allow analytics". */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };

  // Sample ads: a missing file shows its "in production" card instead of a broken player.
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection?.saveData === true;
  const videos = [...document.querySelectorAll('.sample-video')];
  const showFallback = video => { video.hidden = true; video.parentElement.querySelector('.sample-fallback')?.classList.add('is-visible'); };
  for (const video of videos) {
    const probe = new Image();
    probe.onerror = () => showFallback(video);
    probe.src = video.getAttribute('poster');
  }
  if (!reduceMotion && !saveData && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const { target, isIntersecting } of entries) {
        if (target.hidden) continue;
        if (isIntersecting) {
          if (!target.src) target.src = target.dataset.src;
          target.play().catch(() => {});
        } else target.pause();
      }
    }, { threshold: 0.35 });
    videos.forEach(video => observer.observe(video));
    document.addEventListener('visibilitychange', () => { if (document.hidden) videos.forEach(video => video.pause()); });
  }

  const form = $('#project-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const submit = form.querySelector('button[type="submit"]');
    if (submit.disabled) return;
    const data = new FormData(form);
    if (data.get('_gotcha')) return;
    data.set('_subject', `PARADOX ADS ENQUIRY — ${data.get('name') || ''}`);
    data.set('portfolio_consent', data.get('portfolio_consent') ? 'Yes' : 'No');
    const status = $('#form-status');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    submit.disabled = true;
    status.textContent = 'Sending your enquiry…';
    try {
      const response = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error('Delivery not confirmed');
      form.reset();
      status.textContent = 'Thank you. Your enquiry has been received. We’ll be in touch by email.';
    } catch {
      const contact = document.createElement('a');
      contact.href = 'mailto:ridetheparadox@gmail.com';
      contact.textContent = 'email the studio';
      contact.style.textDecoration = 'underline';
      status.replaceChildren(document.createTextNode('We couldn’t confirm delivery. Your details are still here. Please '), contact, document.createTextNode(' so we can help.'));
    } finally { clearTimeout(timeout); submit.disabled = false; }
  });

  let analyticsStarted = false;
  function startAnalytics() {
    if (analyticsStarted || read('pdxCookies') !== 'all' || location.hostname !== 'paradox-ai-creatives.pages.dev') return;
    analyticsStarted = true;
    window.PDX_SUPPRESS_BAR = true;
    window['ga-disable-G-LRQBSDTF9T'] = false;
    const script = document.createElement('script'); script.src = '../links/analytics.js'; script.async = true;
    document.head.append(script);
  }
  function setConsent(value) {
    save('pdxCookies', value);
    save('pdxConsentAt', new Date().toISOString());
    $('#cookie-panel').hidden = true;
    window['ga-disable-G-LRQBSDTF9T'] = value !== 'all';
    if (value === 'all') { window.gtag?.('consent', 'update', { analytics_storage: 'granted' }); startAnalytics(); }
    else {
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      for (const item of document.cookie.split(';')) {
        const name = item.split('=')[0].trim();
        if (!/^_ga(?:_|$)/.test(name)) continue;
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
        document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${location.hostname}; SameSite=Lax`;
      }
    }
  }
  document.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => setConsent(button.dataset.consent)));
  $('#cookie-settings').addEventListener('click', () => { $('#cookie-panel').hidden = false; $('#cookie-panel button').focus(); });
  if (!read('pdxCookies')) $('#cookie-panel').hidden = false;
  startAnalytics();
})();
