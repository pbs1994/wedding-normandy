/* ═══════════════════════════════════════════════════════════
   Wedding in Normandy — Behavior
   Nine independent concerns, each owning one DOM subtree.
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initLoadSequence();
  initScrollReveal(reducedMotion);
  initProcessTimeline(reducedMotion);
  initStatsCounter(reducedMotion);
  initGallery();
  initSeasonsTabs();
  initHeroParallax(reducedMotion);
  initTestimonialRotator(reducedMotion);
  initNavCollapse();
});

/* ─── Load sequence: nav fade-in, hero stagger ───────────────────────────── */
function initLoadSequence() {
  // Triggers the nav fade and the [data-load-item] stagger via CSS.
  document.body.classList.add('is-loaded');
}

/* ─── Scroll reveal: IntersectionObserver -> .is-visible, plays once ────── */
function initScrollReveal(reducedMotion) {
  const targets = document.querySelectorAll('[data-reveal], [data-reveal-child]');

  if (reducedMotion) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach((el) => observer.observe(el));
}

/* ─── Process timeline: spine measured from real dot positions, fill
   draws step-by-step as each item scrolls into view ──────────────────── */
function initProcessTimeline(reducedMotion) {
  const timeline = document.querySelector('.process__timeline');
  if (!timeline) return;

  const spine = timeline.querySelector('.process__spine');
  const fill = timeline.querySelector('.process__spine-fill');
  const items = Array.from(timeline.querySelectorAll('.process__list li'));
  const dots = items.map((li) => li.querySelector('.process__dot'));

  function dotCenterY(dot) {
    const timelineRect = timeline.getBoundingClientRect();
    const dotRect = dot.getBoundingClientRect();
    return dotRect.top - timelineRect.top + dotRect.height / 2;
  }

  let top = 0;
  let totalHeight = 0;

  function layout() {
    top = dotCenterY(dots[0]);
    totalHeight = dotCenterY(dots[dots.length - 1]) - top;
    spine.style.top = `${top}px`;
    spine.style.height = `${totalHeight}px`;
    fill.style.top = `${top}px`;
  }

  layout();
  window.addEventListener('resize', layout);

  if (reducedMotion) {
    fill.style.height = `${totalHeight}px`;
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const index = items.indexOf(entry.target);
      const target = dotCenterY(dots[index]) - top;
      const current = parseFloat(fill.style.height) || 0;
      fill.style.height = `${Math.max(target, current)}px`;
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  items.forEach((li) => observer.observe(li));
}

/* ─── Testimonial rotator: crossfade, auto-advance, pause on hover ──────── */
function initTestimonialRotator(reducedMotion) {
  const section = document.querySelector('.testimonials');
  if (!section) return;

  const slides = Array.from(section.querySelectorAll('.testimonial'));
  const prevBtn = section.querySelector('.testimonial__prev');
  const nextBtn = section.querySelector('.testimonial__next');
  let current = slides.findIndex((s) => s.classList.contains('is-active'));
  if (current === -1) current = 0;
  let timer = null;

  function show(index) {
    const nextIndex = (index + slides.length) % slides.length;
    slides[current].classList.remove('is-active');
    slides[current].setAttribute('aria-hidden', 'true');
    slides[nextIndex].classList.add('is-active');
    slides[nextIndex].removeAttribute('aria-hidden');
    current = nextIndex;
  }

  function advance(direction) {
    show(current + direction);
  }

  function startAutoRotate() {
    if (reducedMotion) return;
    timer = setInterval(() => advance(1), 7000);
  }

  function stopAutoRotate() {
    if (timer) clearInterval(timer);
  }

  function resetAutoRotate() {
    stopAutoRotate();
    startAutoRotate();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { advance(-1); resetAutoRotate(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { advance(1); resetAutoRotate(); });

  section.addEventListener('mouseenter', stopAutoRotate);
  section.addEventListener('mouseleave', startAutoRotate);

  startAutoRotate();
}

/* ─── Mobile nav: text toggle, closes on link click or Escape ───────────── */
function initNavCollapse() {
  const toggle = document.querySelector('.nav__toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  function setOpen(isOpen) {
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.textContent = isOpen ? 'Close' : 'Menu';
    links.classList.toggle('is-open', isOpen);
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}

/* ─── Stats counter: counts 0 -> target once each stat scrolls into view ── */
function initStatsCounter(reducedMotion) {
  const targets = document.querySelectorAll('[data-count-to]');
  if (!targets.length) return;

  function setFinal(el) {
    el.textContent = el.dataset.countTo;
  }

  if (reducedMotion) {
    targets.forEach(setFinal);
    return;
  }

  function animate(el) {
    const target = parseInt(el.dataset.countTo, 10);
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  targets.forEach((el) => observer.observe(el));
}

/* ─── Gallery: drag-to-scroll, prev/next, scroll-linked progress bar ────── */
function initGallery() {
  const track = document.querySelector('.gallery__track');
  if (!track) return;

  const prevBtn = document.querySelector('.gallery__prev');
  const nextBtn = document.querySelector('.gallery__next');
  const fill = document.querySelector('.gallery__bar-fill');

  function step(direction) {
    const item = track.querySelector('.gallery__item');
    const distance = item ? item.getBoundingClientRect().width + 24 : 300;
    track.scrollBy({ left: distance * direction, behavior: 'smooth' });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => step(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => step(1));

  function updateProgress() {
    if (!fill) return;
    const max = track.scrollWidth - track.clientWidth;
    const ratio = max > 0 ? track.scrollLeft / max : 0;
    fill.style.width = `${Math.max(8, ratio * 100)}%`;
  }

  track.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Pointer-drag to scroll, for desktop mice without trackpad/touch scroll.
  let isDown = false;
  let startX = 0;
  let startScroll = 0;

  track.addEventListener('pointerdown', (event) => {
    isDown = true;
    track.classList.add('is-dragging');
    startX = event.clientX;
    startScroll = track.scrollLeft;
    track.setPointerCapture(event.pointerId);
  });

  track.addEventListener('pointermove', (event) => {
    if (!isDown) return;
    track.scrollLeft = startScroll - (event.clientX - startX);
  });

  function endDrag() {
    isDown = false;
    track.classList.remove('is-dragging');
  }

  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
}

/* ─── Seasons: click-to-swap tabs, roving-tabindex keyboard support ─────── */
function initSeasonsTabs() {
  const tabs = Array.from(document.querySelectorAll('.seasons__tab'));
  if (!tabs.length) return;

  const panels = Array.from(document.querySelectorAll('.seasons__panel'));

  function activate(season) {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.season === season;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });
    panels.forEach((panel) => {
      const isActive = panel.dataset.seasonPanel === season;
      panel.classList.toggle('is-active', isActive);
      if (isActive) {
        panel.hidden = false;
      } else {
        panel.hidden = true;
      }
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab.dataset.season));
    tab.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const nextIndex = event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : (index - 1 + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      activate(tabs[nextIndex].dataset.season);
    });
  });
}

/* ─── Hero parallax: image drifts slower than scroll, while hero is visible ── */
function initHeroParallax(reducedMotion) {
  if (reducedMotion) return;

  const hero = document.querySelector('.hero');
  const image = document.querySelector('.hero__image');
  if (!hero || !image) return;

  let ticking = false;

  function update() {
    ticking = false;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const offset = rect.top * 0.06;
    image.style.transform = `translate3d(0, ${offset}px, 0) scale(1.12)`;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
}
