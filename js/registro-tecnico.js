// ============================================================
// IberGas — Registro de técnicos colaboradores
// Guarda el registro en Firestore (colección "tecnicos") y sube
// los documentos justificativos a Firebase Storage.
// ============================================================

import { db, storage } from "./firebase/config.js";
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  ref, uploadBytesResumable, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const form = document.getElementById('tecnico-form');
const submitBtn = document.getElementById('submit-btn');
const statusMsg = document.getElementById('form-status');
const formCard = form; // el propio <form> lleva la clase .form-card
const successPanel = document.getElementById('success-panel');

// ---------- Estado de archivos seleccionados ----------
const fileState = {
  carnet: [],       // documentación acreditativa del carnet / habilitación
  seguro: []         // justificante del seguro de responsabilidad civil
};

// ============================================================
// Iconos de campo (inyectados a la izquierda de los inputs)
// ============================================================
const FIELD_ICONS = {
  nombre_apellidos: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1"/></svg>',
  dni_nie: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M13 10h6M13 14h4"/></svg>',
  telefono: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
  email: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>',
  ciudad: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  provincia: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  numero_autonomo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 9l1-5h12l1 5M4 9h16v10a1 1 0 01-1 1H5a1 1 0 01-1-1z"/></svg>',
  empresa_nombre: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>',
  anios_experiencia: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  especialidades: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.7-3.7a5 5 0 01-6.6 6.6L6.7 20.3a2 2 0 01-2.8-2.8L12 9.4a5 5 0 016.6-6.6l-3.7 3.7z"/></svg>',
  fecha_obtencion: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  numero_habilitacion: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 15a4 4 0 100-8 4 4 0 000 8z"/><path d="M8.5 13.5L6 21l6-3 6 3-2.5-7.5"/></svg>',
  provincia_trabajo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  radio_desplazamiento: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5.5-5.5 2 2-5.5z"/></svg>',
  municipios: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>'
};

// Envuelve los inputs relevantes en un contenedor con icono a la izquierda
// y un hueco a la derecha para el check de validez, sin romper ids/nombres.
function enhanceFieldsWithIcons() {
  const selector = [
    'input[type=text]', 'input[type=email]', 'input[type=tel]',
    'input[type=number]', 'input[type=date]', 'textarea'
  ].map(s => `#tecnico-form ${s}`).join(', ');

  document.querySelectorAll(selector).forEach((el) => {
    if (el.closest('.input-icon-wrap')) return; // ya envuelto
    const wrap = document.createElement('div');
    wrap.className = 'input-icon-wrap';
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);

    const glyph = FIELD_ICONS[el.name];
    if (glyph) {
      wrap.classList.add('has-glyph');
      const iconSpan = document.createElement('span');
      iconSpan.className = 'icon-glyph';
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.innerHTML = glyph;
      wrap.insertBefore(iconSpan, el);
    }

    const check = document.createElement('span');
    check.className = 'field-check';
    check.setAttribute('aria-hidden', 'true');
    check.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>';
    wrap.appendChild(check);
  });
}
enhanceFieldsWithIcons();

// ============================================================
// Dropzones (subida de documentos)
// ============================================================
function setupDropzone(dropzoneId, inputId, listId, stateKey, accept, maxFiles = 3) {
  const dropzone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if (!dropzone || !input) return;

  const dzTitle = dropzone.querySelector('.dz-title');
  const dzTitleDefault = dzTitle ? dzTitle.textContent : '';

  dropzone.addEventListener('click', () => {
    if (fileState[stateKey].length >= maxFiles) return;
    input.click();
  });
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dropzone.click(); }
  });

  ['dragover', 'dragenter'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); if (fileState[stateKey].length < maxFiles) dropzone.classList.add('dragover'); })
  );
  ['dragleave', 'drop'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); })
  );
  dropzone.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files || []);
    addFiles(files);
  });
  input.addEventListener('change', () => {
    addFiles(Array.from(input.files || []));
    input.value = '';
  });

  function addFiles(files) {
    for (const file of files) {
      if (fileState[stateKey].length >= maxFiles) break;
      if (file.size > 10 * 1024 * 1024) {
        alert(`El archivo "${file.name}" supera los 10MB permitidos.`);
        continue;
      }
      fileState[stateKey].push(file);
    }
    renderList();
    updateProgress();
  }

  function fileIconFor(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') {
      return '<svg class="file-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h1.5a1.5 1.5 0 000-3H9v4M13 12v4M13 12h1.4a1.4 1.4 0 010 2.8H13M17 12v4M17 14h1"/></svg>';
    }
    return '<svg class="file-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
  }

  function renderList() {
    list.innerHTML = '';
    fileState[stateKey].forEach((file, idx) => {
      const chip = document.createElement('div');
      chip.className = 'file-chip';
      chip.innerHTML = `
        ${fileIconFor(file.name)}
        <span class="name">${escapeHtml(file.name)}</span>
        <span class="size">${(file.size / 1024).toFixed(0)} KB</span>
        <button type="button" class="remove" aria-label="Eliminar archivo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>`;
      chip.querySelector('.remove').addEventListener('click', () => {
        fileState[stateKey].splice(idx, 1);
        renderList();
        updateProgress();
      });
      list.appendChild(chip);
    });

    const isFull = fileState[stateKey].length >= maxFiles;
    dropzone.classList.toggle('is-full', isFull);
    if (dzTitle) {
      dzTitle.textContent = isFull
        ? `Límite de archivos alcanzado (${fileState[stateKey].length}/${maxFiles})`
        : fileState[stateKey].length
          ? `${dzTitleDefault} · ${fileState[stateKey].length}/${maxFiles} añadidos`
          : dzTitleDefault;
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

setupDropzone('dz-carnet', 'input-carnet', 'list-carnet', 'carnet', '.pdf,.jpg,.jpeg,.png', 4);
setupDropzone('dz-seguro', 'input-seguro', 'list-seguro', 'seguro', '.pdf,.jpg,.jpeg,.png', 2);

// ============================================================
// Navegación lateral: resalta sección visible
// ============================================================
const navItems = document.querySelectorAll('.form-nav-item');
const sections = document.querySelectorAll('.form-section-block');
if ('IntersectionObserver' in window && sections.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach(item => item.classList.toggle('active', item.dataset.target === id));
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach(s => io.observe(s));
}
navItems.forEach(item => {
  item.addEventListener('click', () => {
    document.getElementById(item.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ============================================================
// Validación de campos (visual) + reglas específicas
// ============================================================
const DNI_NIE_RE = /^(\d{8}[A-Za-z]|[XYZxyz]\d{7}[A-Za-z])$/;
const PHONE_RE = /^(?:\+?34|0034)?[6789]\d{8}$/;

function showFieldError(field, message) {
  const wrap = field.closest('.field');
  if (!wrap) return;
  wrap.classList.remove('has-error'); // fuerza replay de la animación
  void wrap.offsetWidth;
  wrap.classList.add('has-error');
  markInvalid(field);
  const errEl = wrap.querySelector('.field-error');
  if (errEl && message) errEl.textContent = message;
}
function clearFieldError(field) {
  const wrap = field.closest('.field');
  wrap?.classList.remove('has-error');
}
function markValid(field) {
  const iconWrap = field.closest('.input-icon-wrap');
  if (iconWrap) iconWrap.classList.add('is-valid');
  if (field.tagName === 'SELECT') field.closest('.field')?.classList.add('is-valid');
}
function markInvalid(field) {
  const iconWrap = field.closest('.input-icon-wrap');
  if (iconWrap) iconWrap.classList.remove('is-valid');
  if (field.tagName === 'SELECT') field.closest('.field')?.classList.remove('is-valid');
}

function customFieldCheck(field) {
  const value = field.value.trim();
  if (!value) return null; // sin valor: ni válido ni inválido todavía
  if (field.name === 'dni_nie' && !DNI_NIE_RE.test(value)) {
    return 'Formato de DNI/NIE no válido (ej. 12345678A o X1234567A).';
  }
  if (field.name === 'telefono' && !PHONE_RE.test(value.replace(/[\s-]/g, ''))) {
    return 'Introduce un teléfono español válido (9 dígitos).';
  }
  return '';
}

function evaluateField(field) {
  const value = field.value.trim();
  clearFieldError(field);
  if (!value) { markInvalid(field); return; }
  const customError = customFieldCheck(field);
  if (customError) {
    showFieldError(field, customError);
    return;
  }
  if (typeof field.checkValidity === 'function' && !field.checkValidity()) {
    markInvalid(field);
    return;
  }
  markValid(field);
}

form.querySelectorAll('input, select, textarea').forEach(f => {
  f.addEventListener('input', () => { clearFieldError(f); evaluateField(f); updateProgress(); });
  f.addEventListener('change', () => { clearFieldError(f); evaluateField(f); updateProgress(); });
  f.addEventListener('blur', () => evaluateField(f));
});

// ============================================================
// Progreso general del formulario (calculado en tiempo real)
// ============================================================
const progressPctEl = document.getElementById('progress-pct');
const progressSteps = document.querySelectorAll('.form-progress-step');
const mobileRingFill = document.getElementById('mobile-ring-fill');
const mobileRingPct = document.getElementById('mobile-ring-pct');
const RING_CIRCUMFERENCE = 2 * Math.PI * 18;

function sectionIsComplete(section) {
  const requiredFields = section.querySelectorAll('[required]');
  const seenGroups = new Set();
  let allOk = true;

  requiredFields.forEach((field) => {
    if (field.type === 'radio' || field.type === 'checkbox') {
      if (seenGroups.has(field.name)) return;
      seenGroups.add(field.name);
      const group = form.querySelectorAll(`[name="${field.name}"]`);
      const checked = Array.from(group).some(g => g.checked);
      if (!checked) allOk = false;
    } else if (!field.value.trim() || customFieldCheck(field)) {
      allOk = false;
    }
  });

  // Reglas adicionales por sección
  if (section.id === 'sec-habilitaciones' && fileState.carnet.length === 0) allOk = false;
  if (section.id === 'sec-colaboracion') {
    const tipos = form.querySelectorAll('input[name="tipo_colaboracion"]:checked');
    if (tipos.length === 0) allOk = false;
  }

  return allOk;
}

function updateProgress() {
  const allRequired = Array.from(form.querySelectorAll('[required]'));
  const seenGroups = new Set();
  let total = 0;
  let done = 0;

  allRequired.forEach((field) => {
    if (field.type === 'radio' || field.type === 'checkbox') {
      if (seenGroups.has(field.name)) return;
      seenGroups.add(field.name);
      total++;
      const group = form.querySelectorAll(`[name="${field.name}"]`);
      if (Array.from(group).some(g => g.checked)) done++;
    } else {
      total++;
      if (field.value.trim() && !customFieldCheck(field)) done++;
    }
  });

  // Requisitos extra que cuentan en el progreso global
  total += 2; // documentación carnet + al menos un tipo de colaboración
  if (fileState.carnet.length > 0) done++;
  const tiposColab = form.querySelectorAll('input[name="tipo_colaboracion"]:checked');
  if (tiposColab.length > 0) done++;

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  if (progressPctEl) {
    progressPctEl.textContent = pct + '%';
    progressPctEl.classList.toggle('is-complete', pct >= 100);
  }
  if (mobileRingPct) mobileRingPct.textContent = pct + '%';
  if (mobileRingFill) {
    const offset = RING_CIRCUMFERENCE * (1 - pct / 100);
    mobileRingFill.style.strokeDashoffset = offset.toFixed(1);
  }

  // Actualiza el stepper superior (7 segmentos) de forma proporcional
  if (progressSteps.length) {
    const filled = Math.round((pct / 100) * progressSteps.length);
    progressSteps.forEach((step, i) => {
      step.classList.toggle('done', i < filled);
      step.classList.toggle('active', i === filled);
    });
  }

  // Marca en la navegación lateral qué secciones están completas
  sections.forEach((section) => {
    const navItem = document.querySelector(`.form-nav-item[data-target="${section.id}"]`);
    if (!navItem) return;
    const complete = sectionIsComplete(section);
    navItem.classList.toggle('is-complete', complete);
    const n = navItem.querySelector('.n');
    if (n) {
      if (complete) {
        if (!n.dataset.original) n.dataset.original = n.textContent;
        n.textContent = '✓';
      } else if (n.dataset.original) {
        n.textContent = n.dataset.original;
      }
    }
  });
}
updateProgress();

// ============================================================
// Validación completa antes de enviar
// ============================================================
function validateForm() {
  let valid = true;
  const requiredFields = form.querySelectorAll('[required]');
  requiredFields.forEach(field => {
    if (field.type === 'radio' || field.type === 'checkbox') {
      const groupName = field.name;
      const group = form.querySelectorAll(`[name="${groupName}"]`);
      const checked = Array.from(group).some(g => g.checked);
      if (!checked) {
        showFieldError(field, 'Este campo es obligatorio.');
        valid = false;
      }
    } else if (!field.value.trim()) {
      showFieldError(field, 'Este campo es obligatorio.');
      valid = false;
    } else {
      const customError = customFieldCheck(field);
      if (customError) {
        showFieldError(field, customError);
        valid = false;
      }
    }
  });

  // Autónomo debe ser Sí
  const autonomoSi = form.querySelector('input[name="autonomo"][value="si"]');
  if (autonomoSi && !autonomoSi.checked) {
    alert('Para colaborar con IberGas es obligatorio estar dado de alta como autónomo.');
    valid = false;
  }

  // Al menos un tipo de colaboración
  const tiposColab = form.querySelectorAll('input[name="tipo_colaboracion"]:checked');
  if (tiposColab.length === 0) {
    alert('Selecciona al menos un tipo de colaboración.');
    valid = false;
  }

  // Documentación mínima
  if (fileState.carnet.length === 0) {
    alert('Adjunta al menos un documento acreditativo del carnet de instalador.');
    valid = false;
  }

  if (!valid) {
    const firstError = form.querySelector('.has-error');
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return valid;
}

// ============================================================
// Confeti de éxito (ligero, sin dependencias)
// ============================================================
function launchConfetti(container) {
  const colors = ['#F4A81D', '#2C9DB0', '#34B37A', '#6FC4D2', '#FFC24D'];
  const pieceCount = 26;
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = (Math.random() * 100) + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (1400 + Math.random() * 900) + 'ms';
    piece.style.animationDelay = (Math.random() * 300) + 'ms';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

// ============================================================
// Envío
// ============================================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  submitBtn.disabled = true;
  submitBtn.classList.add('is-loading');
  statusMsg.className = 'form-status-msg';

  try {
    const formData = new FormData(form);

    const tiposColaboracion = formData.getAll('tipo_colaboracion');

    const registro = {
      // Datos personales
      nombreApellidos: formData.get('nombre_apellidos')?.trim(),
      dniNie: formData.get('dni_nie')?.trim(),
      telefono: formData.get('telefono')?.trim(),
      email: formData.get('email')?.trim(),
      ciudad: formData.get('ciudad')?.trim(),
      provincia: formData.get('provincia')?.trim(),

      // Datos profesionales
      autonomo: formData.get('autonomo') === 'si',
      numeroAutonomo: formData.get('numero_autonomo')?.trim() || '',
      empresaNombreComercial: formData.get('empresa_nombre')?.trim() || '',
      aniosExperiencia: formData.get('anios_experiencia')?.trim() || '',
      especialidades: formData.get('especialidades')?.trim() || '',

      // Habilitaciones
      carnetCategoriaB: formData.get('carnet_b') === 'si',
      apmr: formData.get('apmr') === 'si',
      fechaObtencion: formData.get('fecha_obtencion') || '',
      numeroHabilitacion: formData.get('numero_habilitacion')?.trim() || '',

      // Zona de trabajo
      provinciaTrabajo: formData.get('provincia_trabajo')?.trim(),
      municipios: formData.get('municipios')?.trim(),
      radioDesplazamiento: formData.get('radio_desplazamiento')?.trim(),
      disponibilidad: formData.get('disponibilidad'),

      // Medios
      vehiculoPropio: formData.get('vehiculo_propio') === 'si',
      herramientasPropias: formData.get('herramientas_propias') === 'si',
      seguroRC: formData.get('seguro_rc') === 'si',

      // Tipo de colaboración
      tiposColaboracion,

      // Experiencia
      experienciaDescripcion: formData.get('experiencia_descripcion')?.trim() || '',

      // Consentimientos
      aceptaPrivacidad: formData.get('acepta_privacidad') === 'on',
      aceptaBaseDatos: formData.get('acepta_base_datos') === 'on',

      // Metadatos internos de gestión
      estado: 'pendiente_revision',
      notasInternas: '',
      documentos: [], // se rellena tras la subida
      fechaRegistro: serverTimestamp(),
    };

    // 1. Crear el documento primero para obtener un ID estable
    const docRef = await addDoc(collection(db, 'tecnicos'), registro);

    // 2. Subir documentos a Storage bajo /tecnicos/{id}/...
    const documentosSubidos = [];
    const allFiles = [
      ...fileState.carnet.map(f => ({ file: f, categoria: 'carnet_habilitacion' })),
      ...fileState.seguro.map(f => ({ file: f, categoria: 'seguro_rc' })),
    ];

    for (const { file, categoria } of allFiles) {
      const path = `tecnicos/${docRef.id}/${categoria}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
      await new Promise((resolve, reject) => {
        task.on('state_changed', null, reject, resolve);
      });
      const url = await getDownloadURL(storageRef);
      documentosSubidos.push({ categoria, nombre: file.name, url, path });
    }

    // 3. Actualizar el documento con las URLs de los archivos
    if (documentosSubidos.length) {
      const { updateDoc } = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");
      await updateDoc(docRef, { documentos: documentosSubidos });
    }

    // Éxito
    formCard.style.display = 'none';
    document.getElementById('form-side-nav').style.display = 'none';
    document.getElementById('form-mobile-bar')?.style.setProperty('display', 'none');
    successPanel.style.display = 'block';
    successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    launchConfetti(successPanel);

  } catch (err) {
    console.error('Error al enviar el registro:', err);
    statusMsg.textContent = 'No se ha podido enviar la solicitud. Comprueba tu conexión e inténtalo de nuevo.';
    statusMsg.className = 'form-status-msg show error';
    submitBtn.disabled = false;
    submitBtn.classList.remove('is-loading');
  }
});

// Botón de envío rápido en la barra fija (móvil): dispara el envío real
document.getElementById('mobile-submit-btn')?.addEventListener('click', () => {
  submitBtn.click();
});
