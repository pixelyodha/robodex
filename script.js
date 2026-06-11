/* ═══════════════════════════════════════════════════════════════════════
   ROBODEX — script.js
   ───────────────────────────────────────────────────────────────────────
   Modules (all boot from DOMContentLoaded):

     1. Loading Screen   — video progress, fallback spinner, reveal
     2. Navigation       — hamburger toggle, overlay, backdrop, a11y
     3. Navbar Scroll    — .scrolled class for glass density change
     4. Scroll Reveal    — IntersectionObserver fade-in for sections
     5. Stat Counters    — animated count-up when stats enter viewport
     6. Hero Parallax    — subtle mouse-tracking depth on desktop
     7. Smooth Scroll    — anchor links corrected for fixed navbar
     8. Footer Year      — auto-fill copyright year
═══════════════════════════════════════════════════════════════════════ */

'use strict';


/* ─── Micro-utilities ──────────────────────────────────────────────── */

/** Single element selector */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);

/** All-matching selector — always returns an Array */
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/** requestAnimationFrame-based throttle for continuous events */
function rafThrottle(fn) {
  let pending = false;
  return function (...args) {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { fn.apply(this, args); pending = false; });
  };
}

/** Clamp a value between min and max */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/** Read --navbar-h CSS variable as a number (px) */
const navbarHeight = () =>
  parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-h')) || 68;

/** True when the user prefers reduced motion */
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ════════════════════════════════════════════════════════════════════
   BOOT
   ─────────────────────────────────────────────────────────────────
   All modules initialise after the DOM is parsed.
   The loading screen fires first and is independent of the others.
════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  initLoadingScreen();  // 1 — must go first (controls site reveal)
  initNavigation();     // 2
  initNavbarScroll();   // 3
  initScrollReveal();   // 4
  initStatCounters();   // 5
  initHeroParallax();   // 6
  initSmoothScroll();   // 7
  initFooterYear();     // 8

});


/* ════════════════════════════════════════════════════════════════════
   1.  LOADING SCREEN
   ─────────────────────────────────────────────────────────────────
   Timeline:
     a) Video plays full-screen; site-wrapper sits invisible behind it.
     b) #loading-bar-fill width tracks video.currentTime / duration.
     c) When 'ended' fires → small pause → fade out screen → show site.

   Fallback path (video missing / autoplay blocked / media error):
     → show spinner + animate bar to 100% → reveal after ~2 s.

   Failsafe: no matter what, site reveals within MAX_WAIT ms.

   Optional:  Uncomment the sessionStorage block to skip the intro
              on every visit after the first within a session.
════════════════════════════════════════════════════════════════════ */
function initLoadingScreen() {

  const screen      = qs('#loading-screen');
  const video       = qs('#intro-video');
  const fallback    = qs('#loading-fallback');
  const barFill     = qs('#loading-bar-fill');
  const siteWrapper = qs('#site-wrapper');

  // Nothing to do if key elements are absent
  if (!screen || !siteWrapper) return;

  const MAX_WAIT          = 15_000;  // hard ceiling before force-reveal (ms)
  const POST_END_DELAY    = 200;     // brief pause after video ends so bar hits 100%
  const FALLBACK_DURATION = 2_000;   // how long spinner shows before revealing

  let revealed = false;

  /* ── Core reveal logic ── */
  function revealSite() {
    if (revealed) return;
    revealed = true;

    clearTimeout(failsafeTimer);

    // Drive bar to 100% for visual completeness
    if (barFill) barFill.style.width = '100%';

    setTimeout(() => {
      // Fade loading screen out
      screen.classList.add('fade-out');

      // Unhide site wrapper
      siteWrapper.classList.remove('site-hidden');
      siteWrapper.removeAttribute('aria-hidden');

      // Remove loading screen from layout after CSS transition finishes
      screen.addEventListener(
        'transitionend',
        () => { screen.style.display = 'none'; },
        { once: true }
      );
    }, POST_END_DELAY);
  }

  /* ── Absolute failsafe ── */
  const failsafeTimer = setTimeout(revealSite, MAX_WAIT);

  /* ─────────────────────────────────
     OPTIONAL: skip intro on repeat visits within same session.
     Uncomment these lines to activate:

  if (sessionStorage.getItem('rdx-intro-seen')) {
    revealSite();
    return;
  }
  ───────────────────────────────── */

  /* ── Fallback: spinner path ── */
  function activateFallback() {
    if (revealed) return;

    // Hide the broken video
    if (video) {
      video.pause();
      video.style.display = 'none';
    }

    // Show spinner
    if (fallback) fallback.classList.add('show');

    // Animate bar to 100% over FALLBACK_DURATION
    if (barFill) {
      barFill.style.transition = `width ${FALLBACK_DURATION}ms ease`;
      barFill.style.width = '100%';
    }

    setTimeout(revealSite, FALLBACK_DURATION);
  }

  /* ── Video happy path ── */
  if (video) {

    // Live progress bar
    video.addEventListener('timeupdate', () => {
      if (!barFill || !video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      barFill.style.width = `${pct}%`;
    });

    // Natural end — mark session and reveal
    video.addEventListener('ended', () => {
      sessionStorage.setItem('rdx-intro-seen', '1');
      revealSite();
    }, { once: true });

    // Media error (missing file, codec issue, server error)
    video.addEventListener('error', activateFallback, { once: true });

    // Autoplay might be silently blocked — catch the promise rejection
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(activateFallback);
    }

  } else {
    // No <video> element in DOM — go directly to fallback
    activateFallback();
  }
}


/* ════════════════════════════════════════════════════════════════════
   2.  NAVIGATION
   ─────────────────────────────────────────────────────────────────
   Handles:
   • Hamburger click   → openNav / closeNav
   • Close btn click   → closeNav
   • Backdrop click    → closeNav
   • Nav link click    → closeNav  (handles same-page anchor cases)
   • Escape key        → closeNav
   • Body scroll-lock  while overlay is open
   • aria-expanded / aria-hidden kept in sync at all times
   • Tab focus trap    keeps keyboard focus inside open overlay
   • Focus management  moves focus into overlay on open,
                       returns it to hamburger on close
════════════════════════════════════════════════════════════════════ */
function initNavigation() {

  const hamburger  = qs('#hamburger-btn');
  const overlay    = qs('#nav-overlay');
  const backdrop   = qs('#nav-backdrop');
  const closeBtn   = qs('#nav-close-btn');
  const navLinks   = qsa('.nav-link', overlay ?? document);

  if (!hamburger || !overlay) return;

  let isOpen = false;

  /* ── Open overlay ── */
  function openNav() {
    isOpen = true;

    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');

    overlay.classList.add('nav-open');
    overlay.removeAttribute('aria-hidden');

    if (backdrop) backdrop.classList.add('backdrop-visible');

    // Lock body scroll (save current position for iOS)
    document.body.style.overflow   = 'hidden';
    document.body.style.touchAction = 'none';

    // Move focus to first nav link after slide-in finishes
    const firstLink = qs('.nav-link', overlay);
    if (firstLink) setTimeout(() => firstLink.focus(), 560);
  }

  /* ── Close overlay ── */
  function closeNav() {
    isOpen = false;

    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');

    overlay.classList.remove('nav-open');
    overlay.setAttribute('aria-hidden', 'true');

    if (backdrop) backdrop.classList.remove('backdrop-visible');

    // Restore body scroll
    document.body.style.overflow    = '';
    document.body.style.touchAction = '';

    // Return focus to the trigger button
    hamburger.focus();
  }

  /* ── Toggle ── */
  const toggleNav = () => (isOpen ? closeNav() : openNav());

  /* ── Event listeners ── */
  hamburger.addEventListener('click', toggleNav);
  if (closeBtn) closeBtn.addEventListener('click', closeNav);
  if (backdrop) backdrop.addEventListener('click', closeNav);

  // Close when any link inside the overlay is activated
  navLinks.forEach(link => link.addEventListener('click', closeNav));

  // Keyboard: Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeNav();
  });

  // Keyboard: Tab trap — keep focus cycling inside open overlay
  overlay.addEventListener('keydown', e => {
    if (!isOpen || e.key !== 'Tab') return;

    const focusable = qsa(
      'a[href], button:not([disabled]), [tabindex="0"]',
      overlay
    ).filter(el => !el.closest('[aria-hidden="true"]'));

    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}


/* ════════════════════════════════════════════════════════════════════
   3.  NAVBAR SCROLL CLASS
   ─────────────────────────────────────────────────────────────────
   Adds  .scrolled  to #navbar once the user scrolls past the
   threshold. CSS reacts by increasing glass opacity + shadow.
════════════════════════════════════════════════════════════════════ */
function initNavbarScroll() {

  const navbar = qs('#navbar');
  if (!navbar) return;

  const THRESHOLD = 40; // px

  const update = rafThrottle(() => {
    navbar.classList.toggle('scrolled', window.scrollY > THRESHOLD);
  });

  window.addEventListener('scroll', update, { passive: true });
  update(); // sync immediately on first paint
}


/* ════════════════════════════════════════════════════════════════════
   4.  SCROLL REVEAL
   ─────────────────────────────────────────────────────────────────
   Dynamically marks sections and cards with .reveal, then uses an
   IntersectionObserver to add .revealed when they enter the viewport.
   Cards within lists get stagger-delay classes (reveal-d1 → reveal-d4).

   CSS handles the actual opacity / transform transition.
   Each element animates only once (unobserved after triggering).
════════════════════════════════════════════════════════════════════ */
function initScrollReveal() {

  if (prefersReducedMotion()) return;

  /* Section-level reveals */
  const sectionSelectors = ['#stats', '#domains', '#join', '#site-footer'];
  sectionSelectors.forEach(sel => {
    const el = qs(sel);
    if (el) el.classList.add('reveal');
  });

  /* Staggered child reveals */
  const staggerSelectors = ['.domain-card', '.stat-item'];
  staggerSelectors.forEach(sel => {
    qsa(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.classList.add(`reveal-d${clamp(i + 1, 1, 4)}`);
    });
  });

  /* Section headings get a small delay */
  qsa('.section-title, .section-sub').forEach((el, i) => {
    el.classList.add('reveal', `reveal-d${i + 1}`);
  });

  /* Single IntersectionObserver for all .reveal elements */
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target); // fire once only
      });
    },
    {
      threshold  : 0.10,
      rootMargin : '0px 0px -50px 0px',
    }
  );

  qsa('.reveal').forEach(el => observer.observe(el));
}


/* ════════════════════════════════════════════════════════════════════
   5.  STAT COUNTERS  (count-up animation)
   ─────────────────────────────────────────────────────────────────
   Each .stat-num has a data-target attribute set in the HTML.
   When the element scrolls into view, the number eases up from
   zero to the target value using requestAnimationFrame.

   The inner .stat-plus (+) span is preserved by capturing its
   outerHTML before the animation runs.
════════════════════════════════════════════════════════════════════ */
function initStatCounters() {

  const DURATION = prefersReducedMotion() ? 0 : 1600; // ms

  /* Ease-out cubic — fast at start, decelerates at end */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /* Animate a single counter element */
  function runCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;

    // Capture the + span HTML before we start overwriting innerHTML
    const plusHTML = el.querySelector('.stat-plus')?.outerHTML ?? '';

    if (DURATION === 0) {
      // Instant (reduced motion)
      el.innerHTML = target + plusHTML;
      return;
    }

    const startTime = performance.now();

    function tick(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased    = easeOutCubic(progress);
      const current  = Math.round(eased * target);

      el.innerHTML = current + plusHTML;

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* Trigger each counter when it enters view */
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        observer.unobserve(entry.target); // run once
      });
    },
    { threshold: 0.5 }
  );

  qsa('.stat-num[data-target]').forEach(el => observer.observe(el));
}


/* ════════════════════════════════════════════════════════════════════
   6.  HERO PARALLAX
   ─────────────────────────────────────────────────────────────────
   On non-touch / mouse-capable devices the hero image wrapper
   shifts slightly in the direction of the cursor, adding depth.

   Applied to .hero-img-wrap (not .hero-img itself) so it doesn't
   conflict with the CSS heroFloat animation on .hero-img.

   Disabled on:
     • touch-only devices  (pointer: fine check)
     • reduced-motion preference
     • viewports < 768px
════════════════════════════════════════════════════════════════════ */
function initHeroParallax() {

  if (prefersReducedMotion()) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.innerWidth < 768) return;

  const imgWrap = qs('.hero-img-wrap');
  if (!imgWrap) return;

  const MAX_SHIFT_X = 18;  // px
  const MAX_SHIFT_Y = 12;  // px

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId;

  /* Lerp-based smooth follow — feels fluid, not snappy */
  const LERP_FACTOR = 0.07;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function animate() {
    currentX = lerp(currentX, targetX, LERP_FACTOR);
    currentY = lerp(currentY, targetY, LERP_FACTOR);

    imgWrap.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;

    rafId = requestAnimationFrame(animate);
  }

  const onMouseMove = rafThrottle(e => {
    const { innerWidth: w, innerHeight: h } = window;

    // Normalise to -1 … +1
    const nx = (e.clientX / w - 0.5) * 2;
    const ny = (e.clientY / h - 0.5) * 2;

    targetX = nx * MAX_SHIFT_X;
    targetY = ny * MAX_SHIFT_Y;
  });

  document.addEventListener('mousemove', onMouseMove);

  // Start the lerp loop
  rafId = requestAnimationFrame(animate);

  // Reset smoothly when cursor leaves the window
  document.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
  });

  // Stop the loop if this page is hidden to save battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(animate);
    }
  });
}


/* ════════════════════════════════════════════════════════════════════
   7.  SMOOTH ANCHOR SCROLL
   ─────────────────────────────────────────────────────────────────
   CSS scroll-behavior: smooth doesn't account for the fixed navbar.
   This intercepts clicks on  href="#..."  links, calculates the
   correct scroll position (target top − navbar height), and uses
   window.scrollTo with {behavior:'smooth'}.

   External page links (e.g. projects.html) are ignored — they
   navigate normally.
════════════════════════════════════════════════════════════════════ */
function initSmoothScroll() {

  qsa('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;   // bare # = scroll-to-top, let browser handle

      const target = qs(href);
      if (!target) return;                 // anchor doesn't exist on this page

      e.preventDefault();

      const scrollTop =
        target.getBoundingClientRect().top
        + window.scrollY
        - navbarHeight()
        - 8;   // small breathing gap

      window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    });
  });
}


/* ════════════════════════════════════════════════════════════════════
   8.  FOOTER YEAR
   ─────────────────────────────────────────────────────────────────
   Writes the current year into #footer-year so the © line never
   needs manual updating.
════════════════════════════════════════════════════════════════════ */
function initFooterYear() {
  const el = qs('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
}