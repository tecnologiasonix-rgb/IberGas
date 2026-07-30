// ============================================================
// IberGas — Panel administrador
// Requiere que el email del usuario autenticado exista en la
// colección "admins" de Firestore (ver README para configurar
// el primer administrador y las reglas de seguridad).
// ============================================================

import { db, auth } from "./firebase/config.js";
import {
  collection, query, onSnapshot, doc, updateDoc, getDoc, orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// ---------- Elementos ----------
const loginWrap = document.getElementById('admin-login-wrap');
const shell = document.getElementById('admin-shell');
const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('admin-login-error');
const logoutBtn = document.getElementById('logout-btn');
const userChipEmail = document.getElementById('user-chip-email');
const userChipAvatar = document.getElementById('user-chip-avatar');

const tableBody = document.getElementById('tecnicos-tbody');
const emptyState = document.getElementById('admin-empty-state');
const filterCount = document.getElementById('filter-count');

const fProvincia = document.getElementById('filter-provincia');
const fCarnet = document.getElementById('filter-carnet');
const fDisponibilidad = document.getElementById('filter-disponibilidad');
const fEstado = document.getElementById('filter-estado');
const fSearch = document.getElementById('filter-search');

const statCards = {
  total: document.getElementById('stat-total'),
  pendientes: document.getElementById('stat-pendientes'),
  validados: document.getElementById('stat-validados'),
  disponibles: document.getElementById('stat-disponibles'),
};

const drawerOverlay = document.getElementById('drawer-overlay');
const drawer = document.getElementById('drawer');
const drawerBody = document.getElementById('drawer-body');
const drawerClose = document.getElementById('drawer-close');

let allTecnicos = [];
let activeTecnicoId = null;

// ---------- Autenticación ----------
onAuthStateChanged(auth, (user) => {
  if (user) {
    showAdminShell(user);
    startTecnicosListener();
  } else {
    showLogin();
  }
});

function showLogin() {
  loginWrap.style.display = 'flex';
  shell.style.display = 'none';
}

function showAdminShell(user) {
  loginWrap.style.display = 'none';
  shell.style.display = 'grid';
  const initial = (user.email || '?').charAt(0).toUpperCase();
  userChipAvatar.textContent = initial;
  userChipEmail.textContent = user.email || '';
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.remove('show');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = 'Credenciales incorrectas o usuario no autorizado.';
    loginError.classList.add('show');
  }
});

logoutBtn?.addEventListener('click', () => signOut(auth));

// ---------- Listado en tiempo real ----------
function startTecnicosListener() {
  const q = query(collection(db, 'tecnicos'), orderBy('fechaRegistro', 'desc'));
  onSnapshot(q, (snapshot) => {
    allTecnicos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    populateProvinciaFilter();
    renderStats();
    renderTable();
  }, (err) => {
    console.error('Error al escuchar la colección tecnicos:', err);
    emptyState.style.display = 'block';
    emptyState.textContent = 'No se ha podido cargar la lista de técnicos. Comprueba tu conexión o los permisos de Firestore.';
  });
}

function populateProvinciaFilter() {
  const provincias = [...new Set(allTecnicos.map(t => t.provinciaTrabajo || t.provincia).filter(Boolean))].sort();
  const current = fProvincia.value;
  fProvincia.innerHTML = '<option value="">Todas las provincias</option>' +
    provincias.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
  fProvincia.value = current;
}

function renderStats() {
  statCards.total.textContent = allTecnicos.length;
  statCards.pendientes.textContent = allTecnicos.filter(t => t.estado === 'pendiente_revision').length;
  statCards.validados.textContent = allTecnicos.filter(t => t.estado === 'validado').length;
  statCards.disponibles.textContent = allTecnicos.filter(t => t.estado === 'disponible').length;
}

function getFiltered() {
  return allTecnicos.filter(t => {
    if (fProvincia.value && (t.provinciaTrabajo || t.provincia) !== fProvincia.value) return false;
    if (fCarnet.value === 'carnet_b' && !t.carnetCategoriaB) return false;
    if (fCarnet.value === 'apmr' && !t.apmr) return false;
    if (fDisponibilidad.value && t.disponibilidad !== fDisponibilidad.value) return false;
    if (fEstado.value && t.estado !== fEstado.value) return false;
    if (fSearch.value.trim()) {
      const s = fSearch.value.trim().toLowerCase();
      const haystack = `${t.nombreApellidos || ''} ${t.email || ''} ${t.ciudad || ''}`.toLowerCase();
      if (!haystack.includes(s)) return false;
    }
    return true;
  });
}

function renderTable() {
  const filtered = getFiltered();
  filterCount.textContent = `${filtered.length} de ${allTecnicos.length} técnicos`;

  if (filtered.length === 0) {
    tableBody.innerHTML = '';
    emptyState.style.display = 'block';
    emptyState.textContent = allTecnicos.length === 0
      ? 'Todavía no hay técnicos registrados.'
      : 'Ningún técnico coincide con los filtros seleccionados.';
    return;
  }
  emptyState.style.display = 'none';

  tableBody.innerHTML = filtered.map(t => `
    <tr data-id="${t.id}">
      <td>
        <div class="tech-name-cell">
          <span class="name">${escapeHtml(t.nombreApellidos || '—')}</span>
          <span class="sub">${escapeHtml(t.email || '')}</span>
        </div>
      </td>
      <td>${escapeHtml(t.provinciaTrabajo || t.provincia || '—')}</td>
      <td>
        <span class="badge-carnet ${t.carnetCategoriaB ? 'yes' : ''}">Carnet B ${t.carnetCategoriaB ? '✓' : '✕'}</span>
        <span class="badge-carnet ${t.apmr ? 'yes' : ''}">APMR ${t.apmr ? '✓' : '✕'}</span>
      </td>
      <td>${escapeHtml(disponibilidadLabel(t.disponibilidad))}</td>
      <td><span class="status-badge status-${t.estado || 'pendiente_revision'}">${estadoLabel(t.estado)}</span></td>
      <td>${(t.documentos || []).length} doc.</td>
    </tr>
  `).join('');

  tableBody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', () => openDrawer(row.dataset.id));
  });
}

[fProvincia, fCarnet, fDisponibilidad, fEstado].forEach(el => el?.addEventListener('change', renderTable));
fSearch?.addEventListener('input', renderTable);

function estadoLabel(estado) {
  return {
    pendiente_revision: 'Pendiente revisión',
    validado: 'Validado',
    disponible: 'Disponible',
    no_disponible: 'No disponible',
  }[estado] || 'Pendiente revisión';
}

function disponibilidadLabel(d) {
  return {
    completa: 'Completa',
    parcial: 'Parcial',
    fines_de_semana: 'Fines de semana',
    urgencias_24h: 'Urgencias 24h',
    bajo_demanda: 'Bajo demanda',
  }[d] || '—';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------- Drawer de detalle ----------
async function openDrawer(id) {
  activeTecnicoId = id;
  const snap = await getDoc(doc(db, 'tecnicos', id));
  if (!snap.exists()) return;
  const t = snap.data();

  drawerBody.innerHTML = buildDrawerContent(t);
  attachDrawerEvents(id, t);

  drawerOverlay.classList.add('open');
  drawer.classList.add('open');
}

function closeDrawer() {
  drawerOverlay.classList.remove('open');
  drawer.classList.remove('open');
  activeTecnicoId = null;
}
drawerClose?.addEventListener('click', closeDrawer);
drawerOverlay?.addEventListener('click', closeDrawer);

function buildDrawerContent(t) {
  const estados = ['pendiente_revision', 'validado', 'disponible', 'no_disponible'];
  const docs = t.documentos || [];

  return `
    <div class="drawer-section">
      <h4>Datos personales</h4>
      <div class="drawer-field-grid">
        <div class="drawer-field"><div class="k">Nombre</div><div class="v">${escapeHtml(t.nombreApellidos)}</div></div>
        <div class="drawer-field"><div class="k">DNI/NIE</div><div class="v">${escapeHtml(t.dniNie)}</div></div>
        <div class="drawer-field"><div class="k">Teléfono</div><div class="v">${escapeHtml(t.telefono)}</div></div>
        <div class="drawer-field"><div class="k">Email</div><div class="v">${escapeHtml(t.email)}</div></div>
        <div class="drawer-field"><div class="k">Ciudad</div><div class="v">${escapeHtml(t.ciudad)}</div></div>
        <div class="drawer-field"><div class="k">Provincia</div><div class="v">${escapeHtml(t.provincia)}</div></div>
      </div>
    </div>

    <div class="drawer-section">
      <h4>Datos profesionales</h4>
      <div class="drawer-field-grid">
        <div class="drawer-field"><div class="k">Autónomo</div><div class="v">${t.autonomo ? 'Sí' : 'No'}</div></div>
        <div class="drawer-field"><div class="k">Nº autónomo</div><div class="v">${escapeHtml(t.numeroAutonomo) || '—'}</div></div>
        <div class="drawer-field"><div class="k">Empresa</div><div class="v">${escapeHtml(t.empresaNombreComercial) || '—'}</div></div>
        <div class="drawer-field"><div class="k">Años de experiencia</div><div class="v">${escapeHtml(t.aniosExperiencia) || '—'}</div></div>
        <div class="drawer-field" style="grid-column:1/-1;"><div class="k">Especialidades</div><div class="v">${escapeHtml(t.especialidades) || '—'}</div></div>
      </div>
    </div>

    <div class="drawer-section">
      <h4>Habilitaciones</h4>
      <div class="drawer-field-grid">
        <div class="drawer-field"><div class="k">Carnet categoría B</div><div class="v">${t.carnetCategoriaB ? 'Sí' : 'No'}</div></div>
        <div class="drawer-field"><div class="k">APMR</div><div class="v">${t.apmr ? 'Sí' : 'No'}</div></div>
        <div class="drawer-field"><div class="k">Fecha obtención</div><div class="v">${escapeHtml(t.fechaObtencion) || '—'}</div></div>
        <div class="drawer-field"><div class="k">Nº habilitación</div><div class="v">${escapeHtml(t.numeroHabilitacion) || '—'}</div></div>
      </div>
    </div>

    <div class="drawer-section">
      <h4>Zona y disponibilidad</h4>
      <div class="drawer-field-grid">
        <div class="drawer-field"><div class="k">Provincia de trabajo</div><div class="v">${escapeHtml(t.provinciaTrabajo) || '—'}</div></div>
        <div class="drawer-field"><div class="k">Radio desplazamiento</div><div class="v">${escapeHtml(t.radioDesplazamiento) ? t.radioDesplazamiento + ' km' : '—'}</div></div>
        <div class="drawer-field" style="grid-column:1/-1;"><div class="k">Municipios</div><div class="v">${escapeHtml(t.municipios) || '—'}</div></div>
        <div class="drawer-field"><div class="k">Disponibilidad</div><div class="v">${disponibilidadLabel(t.disponibilidad)}</div></div>
      </div>
    </div>

    <div class="drawer-section">
      <h4>Medios</h4>
      <div class="drawer-field-grid">
        <div class="drawer-field"><div class="k">Vehículo propio</div><div class="v">${t.vehiculoPropio ? 'Sí' : 'No'}</div></div>
        <div class="drawer-field"><div class="k">Herramientas propias</div><div class="v">${t.herramientasPropias ? 'Sí' : 'No'}</div></div>
        <div class="drawer-field"><div class="k">Seguro RC</div><div class="v">${t.seguroRC ? 'Sí' : 'No'}</div></div>
      </div>
    </div>

    <div class="drawer-section">
      <h4>Tipo de colaboración</h4>
      <p style="font-size:0.88rem;">${(t.tiposColaboracion || []).map(escapeHtml).join(', ') || '—'}</p>
    </div>

    ${t.experienciaDescripcion ? `
    <div class="drawer-section">
      <h4>Experiencia profesional</h4>
      <p style="font-size:0.88rem; color:var(--ink-soft);">${escapeHtml(t.experienciaDescripcion)}</p>
    </div>` : ''}

    <div class="drawer-section">
      <h4>Documentos enviados</h4>
      <div class="drawer-doc-list">
        ${docs.length === 0 ? '<p style="font-size:0.85rem; color:var(--ink-soft);">Sin documentos adjuntos.</p>' :
          docs.map(d => `
            <div class="drawer-doc-item">
              <span class="cat">${escapeHtml(docCategoriaLabel(d.categoria))} — ${escapeHtml(d.nombre)}</span>
              <a href="${d.url}" target="_blank" rel="noopener">Ver documento</a>
            </div>
          `).join('')}
      </div>
    </div>

    <div class="drawer-section">
      <h4>Estado de validación</h4>
      <div class="status-select-row" id="status-select-row">
        ${estados.map(e => `<button type="button" class="status-option ${t.estado === e || (!t.estado && e === 'pendiente_revision') ? 'active' : ''}" data-status="${e}">${estadoLabel(e)}</button>`).join('')}
      </div>
    </div>

    <div class="drawer-section drawer-notes">
      <h4>Notas internas</h4>
      <textarea id="notas-internas-input" placeholder="Anota aquí observaciones internas sobre este técnico…">${escapeHtml(t.notasInternas) || ''}</textarea>
    </div>

    <div class="drawer-actions">
      <button type="button" class="btn btn-primary" id="save-drawer-btn">Guardar cambios</button>
      <button type="button" class="btn btn-outline" id="close-drawer-btn-2">Cerrar</button>
    </div>
    <p class="save-indicator" id="save-indicator">Cambios guardados.</p>
  `;
}

function docCategoriaLabel(cat) {
  return {
    carnet_habilitacion: 'Carnet / habilitación',
    seguro_rc: 'Seguro de responsabilidad civil',
  }[cat] || cat;
}

function attachDrawerEvents(id, tecnico) {
  let selectedStatus = tecnico.estado || 'pendiente_revision';

  drawerBody.querySelectorAll('.status-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedStatus = btn.dataset.status;
      drawerBody.querySelectorAll('.status-option').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  document.getElementById('close-drawer-btn-2')?.addEventListener('click', closeDrawer);

  document.getElementById('save-drawer-btn')?.addEventListener('click', async () => {
    const saveBtn = document.getElementById('save-drawer-btn');
    const notas = document.getElementById('notas-internas-input').value;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando…';
    try {
      await updateDoc(doc(db, 'tecnicos', id), {
        estado: selectedStatus,
        notasInternas: notas,
      });
      const indicator = document.getElementById('save-indicator');
      indicator.classList.add('show');
      setTimeout(() => indicator.classList.remove('show'), 2500);
    } catch (err) {
      console.error('Error al guardar cambios:', err);
      alert('No se han podido guardar los cambios. Inténtalo de nuevo.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar cambios';
    }
  });
}
