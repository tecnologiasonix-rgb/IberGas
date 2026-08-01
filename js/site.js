// ============================================================
// IberGas — Comportamiento compartido del sitio público
// ============================================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

document.addEventListener('DOMContentLoaded', () => {
  // --- Menú móvil ---
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose = document.querySelector('.mobile-menu-close');

  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      mobileMenu.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }
  if (mobileClose && mobileMenu) {
    mobileClose.addEventListener('click', closeMobileMenu);
  }
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileMenu));

  function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  // --- Reveal on scroll ---
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // --- Año dinámico en footer ---
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  initScrollProgress();
  initHeaderScrollState();
  initBackToTop();
  initMagneticButtons();
  initCardTilt();
  initCounters();
  initHeroParallax();
});

// ---------- Barra de progreso de scroll ----------
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.innerHTML = '<div class="scroll-progress-fill"></div>';
  document.body.prepend(bar);
  const fill = bar.querySelector('.scroll-progress-fill');

  let ticking = false;
  function update() {
    const scrollTop = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0;
    fill.style.width = pct + '%';
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

// ---------- Header: estado "scrolled" ----------
function initHeaderScrollState() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  function update() {
    header.classList.toggle('scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ---------- Botón volver arriba ----------
function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Volver arriba');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 560);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
}

// ---------- Botones magnéticos (siguen ligeramente al cursor) ----------
function initMagneticButtons() {
  if (!isFinePointer || prefersReducedMotion) return;
  const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
  buttons.forEach(btn => {
    btn.style.transition = `${btn.style.transition ? btn.style.transition + ', ' : ''}transform 200ms ${getComputedStyle(document.documentElement).getPropertyValue('--ease-out-expo') || 'ease'}`;
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ---------- Tilt 3D suave en tarjetas ----------
function initCardTilt() {
  if (!isFinePointer || prefersReducedMotion) return;
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-6px) perspective(700px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ---------- Contadores animados (data-count-to) ----------
function initCounters() {
  const counters = document.querySelectorAll('[data-count-to]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.countTo);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    if (prefersReducedMotion || !target) {
      el.textContent = `${prefix}${target}${suffix}`;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(el => io.observe(el));
  } else {
    counters.forEach(animate);
  }
}

// ---------- Parallax sutil del hero según el cursor ----------
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero || !isFinePointer || prefersReducedMotion) return;
  const grid = hero.querySelector('.hero-grid');
  const visual = hero.querySelector('.hero-visual');

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    if (grid) grid.style.transform = `translate(${px * 14}px, ${py * 14}px)`;
    if (visual) visual.style.transform = `translate(${px * -10}px, ${py * -10}px)`;
  });
  hero.addEventListener('mouseleave', () => {
    if (grid) grid.style.transform = '';
    if (visual) visual.style.transform = '';
  });
}
