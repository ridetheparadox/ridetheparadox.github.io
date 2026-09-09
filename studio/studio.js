/* Paradox universe — native scroll, independently eased visual layers. */
(() => {
  'use strict';
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  function sceneState(y, top, height, viewport) {
    const travel = y - top;
    return { travel, progress: clamp(travel / Math.max(1, height - viewport)), visible: travel > -viewport && travel < height };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { clamp, sceneState };
  if (typeof document === 'undefined') return;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Preferences still work for this visit. */ } };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 700px)');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const conserveData = () => connection && (connection.saveData || ['slow-2g','2g','3g'].includes(connection.effectiveType));
  let paused = reducedMotion.matches || read('pdxMotion') === 'paused';
  let acknowledged = read('pdxConsent') === '1';
  let pendingEntry = null;
  let y = window.scrollY;
  let targetY = y;
  let targetX = 0;
  let mouseX = 0;
  let frameId = 0;
  let lastFrame = 0;
  let scenes = [];
  let chapters = [];
  let viewport = window.innerHeight;
  let pageHeight = document.documentElement.scrollHeight;
  const motionButton = $('#motion-toggle');
  const progressBar = $('.scroll-progress span');
  const journeyLabel = $('.journey-position');
  const ambientVideos = $$('.ambient');
  const inView = new Set();
  const filmDialog = $('#film-dialog');
  const player = $('#film-player');
  const entryDialog = $('#entry-dialog');
  const collectionDialog = $('#collection-dialog');

  function measure() {
    viewport = window.innerHeight;
    pageHeight = document.documentElement.scrollHeight;
    scenes = $$('.motion-scene').map(element => ({
      element, top: element.getBoundingClientRect().top + window.scrollY, height: element.offsetHeight,
      layers: [...element.querySelectorAll('.depth-layer')].map(layer => ({ element: layer, speed: Number(layer.dataset.speed) || 0 }))
    }));
    chapters = $$('[data-chapter]').map(element => ({ top: element.getBoundingClientRect().top + window.scrollY, title: element.dataset.chapter }));
    requestFrame();
  }
  function requestFrame() { if (!frameId && !document.hidden) frameId = requestAnimationFrame(render); }
  function render(time) {
    frameId = 0;
    const dt = clamp(time - (lastFrame || time - 16), 1, 64);
    lastFrame = time;
    const ease = 1 - Math.exp(-dt / 90);
    y = paused ? targetY : y + (targetY - y) * ease;
    mouseX += (targetX - mouseX) * ease;
    progressBar.style.transform = `scaleX(${clamp(targetY / Math.max(1, pageHeight - viewport))})`;
    let chapter = chapters[0];
    for (const item of chapters) if (targetY + viewport * 0.45 >= item.top) chapter = item;
    if (chapter) journeyLabel.textContent = chapter.title;
    for (const scene of scenes) {
      const state = sceneState(y, scene.top, scene.height, viewport);
      if (!state.visible) continue;
      const secondPanorama = scene.element.querySelector('.panorama-second');
      if (secondPanorama) {
        const blend = paused ? 1 : clamp((state.progress - 0.32) / 0.35);
        secondPanorama.style.opacity = blend.toFixed(3);
        secondPanorama.setAttribute('aria-hidden', String(blend < 0.5));
        scene.element.querySelector('.panorama-first').setAttribute('aria-hidden', String(!paused && blend >= 0.5));
      }
      for (const layer of scene.layers) {
        if (paused) { layer.element.style.transform = ''; layer.element.style.opacity = ''; continue; }
        const mobileFactor = narrow.matches ? 0.45 : 1;
        let dy = clamp(state.travel * layer.speed, -160, 160) * mobileFactor;
        let dx = 0, scale = 1;
        if (scene.element.id === 'top') {
          if (layer.element.classList.contains('hero-image')) {
            scale = 1 + state.progress * 0.18;
            dx = (-state.progress * 45 + mouseX * 9) * mobileFactor;
            dy = state.progress * 40 * mobileFactor;
          } else if (layer.element.classList.contains('hero-copy')) {
            dy = -state.progress * 200 * mobileFactor;
            dx = -state.progress * 35 * mobileFactor;
          }
        } else if (scene.element.id === 'work') {
          if (layer.element.classList.contains('chapter-media')) {
            scale = scene.element.classList.contains('chapter-panorama') ? 0.96 + state.progress * 0.07 : 0.9 + state.progress * 0.34;
            dx = -state.progress * (scene.element.classList.contains('chapter-panorama') ? 10 : 90) * mobileFactor;
            dy = (28 - state.progress * 50) * mobileFactor;
          } else if (layer.element.classList.contains('chapter-ghost')) {
            dx = -state.progress * 180;
            dy = state.progress * 30;
          } else dy = -state.progress * 115 * mobileFactor;
        }
        layer.element.style.transform = `translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
      }
    }
    if (Math.abs(targetY - y) > 0.15 || Math.abs(targetX - mouseX) > 0.002) requestFrame();
  }
  window.addEventListener('scroll', () => { targetY = window.scrollY; requestFrame(); }, { passive: true });
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || narrow.matches || paused) return;
    targetX = (event.clientX / window.innerWidth - 0.5) * 2;
    requestFrame();
  }, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  document.fonts?.ready.then(measure);

  function syncAmbient() {
    const blocked = paused || document.hidden || conserveData() || !!document.querySelector('dialog[open]');
    for (const video of ambientVideos) {
      const needsAcknowledgement = !acknowledged && video.dataset.preview !== 'true';
      if (blocked || needsAcknowledgement || !inView.has(video)) { video.pause(); continue; }
      if (!video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
      video.play().catch(() => { /* Keep the poster and explicit film control when autoplay is unavailable. */ });
    }
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) inView.add(entry.target); else inView.delete(entry.target);
      }
      syncAmbient();
    }, { threshold: 0.05 });
    ambientVideos.forEach(video => observer.observe(video));
  }
  function updateMotion() {
    document.documentElement.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Resume motion' : 'Pause motion');
    motionButton.querySelector('.motion-label').textContent = paused ? 'Resume motion' : 'Pause motion';
    motionButton.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
    if (paused) $$('.depth-layer').forEach(layer => { layer.style.transform = ''; layer.style.opacity = ''; });
    syncAmbient();
    requestFrame();
  }
  motionButton.addEventListener('click', () => { paused = !paused; save('pdxMotion', paused ? 'paused' : 'running'); updateMotion(); });
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches || read('pdxMotion') === 'paused'; updateMotion(); measure(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; } else { targetY = window.scrollY; measure(); } syncAmbient(); });
  connection?.addEventListener?.('change', syncAmbient);

  function openDialog(dialog) { if (!dialog.open) dialog.showModal(); syncAmbient(); }
  function requireEntry(action) {
    if (acknowledged) { action(); return; }
    pendingEntry = action;
    openDialog(entryDialog);
  }
  $('#entry-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    acknowledged = true;
    save('pdxConsent', '1');
    save('pdxConsentAt', new Date().toISOString());
    entryDialog.close('accepted');
  });
  entryDialog.addEventListener('close', () => {
    const action = pendingEntry;
    pendingEntry = null;
    if (entryDialog.returnValue === 'accepted' && acknowledged && action) action();
    syncAmbient();
  });
  function playFilm(src, title) {
    if (!/^clips\/[a-z0-9-]+\.mp4$/i.test(src)) return;
    requireEntry(() => {
      $('#film-title').textContent = title;
      $('.film-disclosure').textContent = 'Original studio study · 100% AI-generated imagery';
      player.src = src;
      player.muted = false;
      openDialog(filmDialog);
      player.play().catch(() => { /* Native controls provide a playback button. */ });
    });
  }
  $$('.play-film').forEach(button => button.addEventListener('click', () => playFilm(button.dataset.film, button.dataset.title)));
  player.addEventListener('error', () => { $('.film-disclosure').textContent = 'The film could not load. Please close it and try again.'; });
  filmDialog.addEventListener('close', () => { player.pause(); player.removeAttribute('src'); player.load(); syncAmbient(); });
  for (const dialog of $$('dialog')) {
    dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close('cancelled'));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close('cancelled');
    });
    dialog.addEventListener('close', syncAmbient);
  }
  document.addEventListener('contextmenu', event => { if (['IMG','VIDEO'].includes(event.target.tagName)) event.preventDefault(); });
  document.addEventListener('dragstart', event => { if (['IMG','VIDEO'].includes(event.target.tagName)) event.preventDefault(); });

  let films = null;
  let shown = 0;
  let loadingCollection = false;
  const archiveGrid = $('#collection-grid');
  const archiveStatus = $('#collection-status');
  const moreFilms = $('#more-films');
  function renderMoreFilms() {
    const next = films.slice(shown, shown + 12);
    for (const film of next) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'archive-film';
      button.setAttribute('aria-label', `Watch film ${film.number}: ${film.title}`);
      const image = document.createElement('img'); image.src = film.poster; image.alt = ''; image.loading = 'lazy'; image.width = 240; image.height = 320;
      const label = document.createElement('span'); label.textContent = film.title;
      const number = document.createElement('small'); number.textContent = `Film ${film.number}`;
      button.append(image, label, number);
      button.addEventListener('click', () => playFilm(film.src, `${film.title} / Film ${film.number}`));
      archiveGrid.append(button);
    }
    shown += next.length;
    archiveStatus.textContent = `${shown} of ${films.length} films`;
    moreFilms.hidden = shown >= films.length;
  }
  async function openCollection() {
    openDialog(collectionDialog);
    if (films || loadingCollection) return;
    loadingCollection = true;
    archiveStatus.textContent = 'Opening the archive…';
    moreFilms.hidden = true;
    try {
      const response = await fetch('collection.json');
      if (!response.ok) throw new Error('Collection unavailable');
      films = await response.json();
      if (!Array.isArray(films) || !films.every(film => /^clips\/[a-z0-9-]+\.mp4$/i.test(film.src) && /^posters\/[a-z0-9-]+\.jpg$/i.test(film.poster))) throw new Error('Invalid collection');
      renderMoreFilms();
    } catch {
      films = null;
      archiveStatus.textContent = 'The archive couldn’t load. Close this window and try again.';
    } finally { loadingCollection = false; }
  }
  $('#open-collection').addEventListener('click', () => requireEntry(openCollection));
  moreFilms.addEventListener('click', renderMoreFilms);

  const form = $('#project-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const submit = form.querySelector('button[type="submit"]');
    if (submit.disabled) return;
    const data = new FormData(form);
    if (data.get('_gotcha')) return;
    data.set('_subject', `PARADOX PROJECT ENQUIRY — ${data.get('name') || ''}`);
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
    const script = document.createElement('script'); script.src = 'links/analytics.js'; script.async = true;
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
  $$('[data-consent]').forEach(button => button.addEventListener('click', () => setConsent(button.dataset.consent)));
  $('#cookie-settings').addEventListener('click', () => { $('#cookie-panel').hidden = false; $('#cookie-panel button').focus(); });
  if (!read('pdxCookies')) $('#cookie-panel').hidden = false;
  startAnalytics();
  updateMotion();
  measure();
})();
