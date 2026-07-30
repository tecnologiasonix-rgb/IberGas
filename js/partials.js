// ============================================================
// IberGas — Header y footer reutilizables (inyectados en runtime)
// Se usa en páginas dentro de /public/ (rutas relativas '../').
// ============================================================

const HEADER_HTML = `
<header class="site-header">
  <nav class="nav container" aria-label="Navegación principal">
    <a href="../index.html" class="brand">
      <span class="brand-mark" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 6 9.5 6 14.5C6 18.09 8.69 21 12 21C15.31 21 18 18.09 18 14.5C18 9.5 12 2 12 2Z" fill="white" fill-opacity="0.95"/></svg></span>
      IberGas
    </a>
    <ul class="nav-links">
      <li><a href="../index.html#sobre-nosotros">Sobre nosotros</a></li>
      <li><a href="../index.html#servicios">Servicios</a></li>
      <li><a href="../index.html#red">Red IberGas</a></li>
      <li><a href="colaboradores.html">Colaboradores</a></li>
      <li><a href="contacto.html">Contacto</a></li>
      <li><a href="faq.html">FAQ</a></li>
    </ul>
    <div class="nav-cta">
      <a href="contacto.html" class="btn btn-secondary btn-sm">Contactar</a>
      <a href="registro-tecnico.html" class="btn btn-primary btn-sm">Registrarme como técnico</a>
    </div>
    <button class="nav-toggle" aria-label="Abrir menú">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
    </button>
  </nav>
</header>
<div class="mobile-menu" role="dialog" aria-modal="true" aria-label="Menú">
  <div class="mobile-menu-inner">
    <div class="mobile-menu-top">
      <span class="brand" style="color:white;">IberGas</span>
      <button class="mobile-menu-close" aria-label="Cerrar menú">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>
      </button>
    </div>
    <a href="../index.html#sobre-nosotros">Sobre nosotros</a>
    <a href="../index.html#servicios">Servicios</a>
    <a href="../index.html#red">Red IberGas</a>
    <a href="colaboradores.html">Colaboradores</a>
    <a href="contacto.html">Contacto</a>
    <a href="faq.html">FAQ</a>
    <a href="registro-tecnico.html" class="btn btn-primary btn-block">Registrarme como técnico</a>
  </div>
</div>`;

const FOOTER_HTML = `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="../index.html" class="brand" style="color:white;">
          <span class="brand-mark" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 6 9.5 6 14.5C6 18.09 8.69 21 12 21C15.31 21 18 18.09 18 14.5C18 9.5 12 2 12 2Z" fill="white" fill-opacity="0.95"/></svg></span>
          IberGas
        </a>
        <p>Empresa especializada en servicios de gas, respaldada por una red de técnicos instaladores habilitados.</p>
      </div>
      <div class="footer-col">
        <h4>Empresa</h4>
        <a href="../index.html#sobre-nosotros">Sobre nosotros</a>
        <a href="../index.html#servicios">Servicios</a>
        <a href="colaboradores.html">Colaboradores</a>
        <a href="contacto.html">Contacto</a>
      </div>
      <div class="footer-col">
        <h4>Red de técnicos</h4>
        <a href="../index.html#red">Red IberGas</a>
        <a href="registro-tecnico.html">Registro de técnicos</a>
        <a href="faq.html">Preguntas frecuentes</a>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <a href="privacidad.html">Política de privacidad</a>
        <a href="aviso-legal.html">Aviso legal</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year></span> IberGas. Todos los derechos reservados.</span>
      <span>Servicios técnicos de gas y red de instaladores habilitados</span>
    </div>
  </div>
</footer>`;

document.addEventListener('DOMContentLoaded', () => {
  const headerSlot = document.getElementById('site-header-slot');
  const footerSlot = document.getElementById('site-footer-slot');
  if (headerSlot) headerSlot.outerHTML = HEADER_HTML;
  if (footerSlot) footerSlot.outerHTML = FOOTER_HTML;
});
