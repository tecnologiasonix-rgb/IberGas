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
const formCard = document.getElementById('form-card');
const successPanel = document.getElementById('success-panel');

// ---------- Estado de archivos seleccionados ----------
const fileState = {
  carnet: [],       // documentación acreditativa del carnet / habilitación
  seguro: []         // justificante del seguro de responsabilidad civil
};

function setupDropzone(dropzoneId, inputId, listId, stateKey, accept, maxFiles = 3) {
  const dropzone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if (!dropzone || !input) return;

  dropzone.addEventListener('click', () => input.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });

  ['dragover', 'dragenter'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); })
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
  }

  function renderList() {
    list.innerHTML = '';
    fileState[stateKey].forEach((file, idx) => {
      const chip = document.createElement('div');
      chip.className = 'file-chip';
      chip.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--teal-500); flex-shrink:0;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
        <span class="name">${escapeHtml(file.name)}</span>
        <span class="size">${(file.size / 1024).toFixed(0)} KB</span>
        <button type="button" class="remove" aria-label="Eliminar archivo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>`;
      chip.querySelector('.remove').addEventListener('click', () => {
        fileState[stateKey].splice(idx, 1);
        renderList();
      });
      list.appendChild(chip);
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

setupDropzone('dz-carnet', 'input-carnet', 'list-carnet', 'carnet', '.pdf,.jpg,.jpeg,.png', 4);
setupDropzone('dz-seguro', 'input-seguro', 'list-seguro', 'seguro', '.pdf,.jpg,.jpeg,.png', 2);

// ---------- Navegación lateral: resalta sección visible ----------
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

// ---------- Validación ----------
function showFieldError(field, message) {
  const wrap = field.closest('.field');
  if (!wrap) return;
  wrap.classList.add('has-error');
  const errEl = wrap.querySelector('.field-error');
  if (errEl) errEl.textContent = message;
}
function clearFieldError(field) {
  const wrap = field.closest('.field');
  wrap?.classList.remove('has-error');
}
form.querySelectorAll('input, select, textarea').forEach(f => {
  f.addEventListener('input', () => clearFieldError(f));
  f.addEventListener('change', () => clearFieldError(f));
});

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

// ---------- Envío ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando solicitud…';
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
    successPanel.style.display = 'block';
    successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Error al enviar el registro:', err);
    statusMsg.textContent = 'No se ha podido enviar la solicitud. Comprueba tu conexión e inténtalo de nuevo.';
    statusMsg.className = 'form-status-msg show error';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar solicitud';
  }
});
