// ============================================================
// IberGas — Comportamiento compartido del sitio público
// ============================================================

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
});
