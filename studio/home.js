/* PARADOX home page extras: sections rise into view, the menu marks the current section,
   and on phones a buy bar appears once the top buy card has scrolled away.
   studio.js still runs the films, the 18+ step, motion, the enquiry form and cookie choices. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const $$ = selector => [...document.querySelectorAll(selector)];

  // 1. Reveal. Everything is visible without this; it only adds the rise-in as a section arrives.
  const items = $$('.rv');
  const reveal = element => element.classList.add('is-in');
  if ('IntersectionObserver' in window) {
    const watcher = new IntersectionObserver(entries => {
      let order = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.style.animationDelay = `${Math.min(order++, 5) * 70}ms`;
        reveal(entry.target);
        watcher.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px 10% 0px' });
    items.forEach(element => watcher.observe(element));
  } else items.forEach(reveal);

  // 2. Solid header after the first scroll, and the current section marked in both menus.
  const header = document.querySelector('.site-header');
  const chips = document.querySelector('.section-chips');
  const links = $$('.site-nav a[href^="#"], .section-chips a[href^="#"]');
  const sections = [...new Set(links.map(link => link.hash))]
    .map(hash => document.querySelector(hash))
    .filter(Boolean)
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  let current = null;
  let ticking = false;
  function update() {
    ticking = false;
    header?.classList.toggle('is-solid', window.scrollY > 24);
    const line = window.innerHeight * 0.38;
    let found = null;
    for (const section of sections) if (section.getBoundingClientRect().top <= line) found = `#${section.id}`;
    if (found === current) return;
    current = found;
    for (const link of links) {
      const on = link.hash === found;
      link.classList.toggle('is-current', on);
      if (on) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    }
    const chip = chips?.querySelector('a.is-current');
    if (chip && chips.scrollWidth > chips.clientWidth) {
      chips.scrollTo({ left: Math.max(0, chip.offsetLeft - 12), behavior: reduce.matches ? 'auto' : 'smooth' });
    }
  }
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();

  // 3. Phone buy bar: shown once the buy card at the top has scrolled up behind the header.
  const card = document.querySelector('.hero-buy-card');
  if (card && 'IntersectionObserver' in window) {
    const headerSpace = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--top'), 10) || 0;
    new IntersectionObserver(([entry]) => {
      const onPage = card.offsetParent !== null;
      const top = entry.rootBounds ? entry.rootBounds.top : 0;
      document.body.classList.toggle('show-sticky', onPage && !entry.isIntersecting && entry.boundingClientRect.bottom <= top);
    }, { rootMargin: `-${headerSpace}px 0px 0px 0px` }).observe(card);
  }
})();
