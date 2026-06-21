// =========================================================
// DPRIAN FANFEST — lógica del frontend
// =========================================================

const API = '/api';

const state = {
  token: localStorage.getItem('dprian_token') || null,
  user: JSON.parse(localStorage.getItem('dprian_user') || 'null'),
  posts: [],
  events: [],
};

// ---------- helpers ----------

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

function showToast(msg) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2800);
}

function openModal(id) { $('#' + id).hidden = false; }
function closeModal(id) {
  $('#' + id).hidden = true;
  const err = $('#' + id).querySelector('.form-error');
  if (err) err.hidden = true;
}

$all('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
$all('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.hidden = true;
  });
});

async function api(path, options = {}) {
  const headers = options.headers || {};
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (!(options.body instanceof FormData) && options.body) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Algo salió mal');
  return data;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

// ---------- autenticación ----------

function renderAuthArea() {
  const area = $('#authArea');
  if (state.user) {
    area.innerHTML = `
      <div class="user-chip">
        <span class="avatar">${initials(state.user.name)}</span>
        <span>${state.user.name}</span>
      </div>
      <button class="btn btn-ghost" id="logoutBtn">Salir</button>
    `;
    $('#logoutBtn').addEventListener('click', logout);
  } else {
    area.innerHTML = `
      <button class="btn btn-ghost" id="loginOpenBtn">Iniciar sesión</button>
      <button class="btn btn-primary" id="registerOpenBtn">Registrarme</button>
    `;
    $('#loginOpenBtn').addEventListener('click', () => { switchAuthTab('login'); openModal('authModal'); });
    $('#registerOpenBtn').addEventListener('click', () => { switchAuthTab('register'); openModal('authModal'); });
  }
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('dprian_token');
  localStorage.removeItem('dprian_user');
  renderAuthArea();
  showToast('Sesión cerrada');
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  $('#tabLogin').classList.toggle('active', isLogin);
  $('#tabRegister').classList.toggle('active', !isLogin);
  $('#loginForm').hidden = !isLogin;
  $('#registerForm').hidden = isLogin;
  $('#authModalTitle').textContent = isLogin ? 'Inicia sesión' : 'Crea tu cuenta';
  $('#authError').hidden = true;
}

$('#tabLogin').addEventListener('click', () => switchAuthTab('login'));
$('#tabRegister').addEventListener('click', () => switchAuthTab('register'));

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#loginEmail').value.trim();
  const password = $('#loginPassword').value;
  try {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    onAuthSuccess(data);
  } catch (err) {
    const box = $('#authError');
    box.textContent = err.message;
    box.hidden = false;
  }
});

$('#registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('#regName').value.trim();
  const email = $('#regEmail').value.trim();
  const password = $('#regPassword').value;
  try {
    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    onAuthSuccess(data);
  } catch (err) {
    const box = $('#authError');
    box.textContent = err.message;
    box.hidden = false;
  }
});

function onAuthSuccess(data) {
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('dprian_token', data.token);
  localStorage.setItem('dprian_user', JSON.stringify(data.user));
  renderAuthArea();
  closeModal('authModal');
  showToast(`¡Bienvenido/a, ${data.user.name}!`);
}

// ---------- subir ----------

function requireLoginThen(action) {
  if (!state.user) {
    switchAuthTab('login');
    openModal('authModal');
    showToast('Inicia sesión primero');
    return;
  }
  action();
}

$('#heroUploadBtn').addEventListener('click', () => requireLoginThen(() => openModal('uploadModal')));
$('#emptyUploadBtn') && $('#emptyUploadBtn').addEventListener('click', () => requireLoginThen(() => openModal('uploadModal')));
$('#heroExploreBtn').addEventListener('click', () => {
  $('#gallery').scrollIntoView({ behavior: 'smooth' });
});

const dropzone = $('#dropzone');
const fileInput = $('#fileInput');
const dropzoneText = $('#dropzoneText');

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) {
    dropzone.classList.add('has-file');
    dropzoneText.textContent = `Listo: ${fileInput.files[0].name}`;
  }
});
['dragover', 'dragenter'].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('has-file'); });
});
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  if (e.dataTransfer.files[0]) {
    fileInput.files = e.dataTransfer.files;
    dropzoneText.textContent = `Listo: ${e.dataTransfer.files[0].name}`;
  }
});

$('#uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  const errBox = $('#uploadError');
  errBox.hidden = true;

  if (!file) {
    errBox.textContent = 'Elige una foto o video primero';
    errBox.hidden = false;
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('event', $('#eventInput').value.trim());
  formData.append('eventDate', $('#eventDateInput').value);
  formData.append('caption', $('#captionInput').value.trim());

  const btn = $('#uploadSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Subiendo...';

  try {
    await api('/posts', { method: 'POST', body: formData });
    showToast('¡Recuerdo agregado al muro! 🎉');
    closeModal('uploadModal');
    $('#uploadForm').reset();
    dropzone.classList.remove('has-file');
    dropzoneText.textContent = 'Arrastra una foto o video, o haz clic para elegir';
    await loadEvents();
    await loadPosts();
  } catch (err) {
    errBox.textContent = err.message;
    errBox.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Subir al muro';
  }
});

// ---------- filtros ----------

let searchDebounce;
$('#searchInput').addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(loadPosts, 350);
});
$('#eventFilter').addEventListener('change', loadPosts);
$('#fromDate').addEventListener('change', loadPosts);
$('#toDate').addEventListener('change', loadPosts);
$('#clearFiltersBtn').addEventListener('click', () => {
  $('#searchInput').value = '';
  $('#eventFilter').value = '';
  $('#fromDate').value = '';
  $('#toDate').value = '';
  loadPosts();
});

async function loadEvents() {
  try {
    const events = await api('/posts/events');
    state.events = events;
    const sE2 = document.getElementById("statEvents"); if (sE2) sE2.textContent = events.length || "0";
    const select = $('#eventFilter');
    const current = select.value;
    select.innerHTML = '<option value="">Todos los eventos</option>' +
      events.map((ev) => `<option value="${escapeHtml(ev)}">${escapeHtml(ev)}</option>`).join('');
    select.value = current;
  } catch (err) {
    console.error(err);
  }
}

async function loadPosts() {
  const params = new URLSearchParams();
  const search = $('#searchInput').value.trim();
  const event = $('#eventFilter').value;
  const from = $('#fromDate').value;
  const to = $('#toDate').value;
  if (search) params.set('search', search);
  if (event) params.set('event', event);
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  try {
    const posts = await api('/posts?' + params.toString());
    state.posts = posts;
    renderWall();
    renderHeroCollage();
  } catch (err) {
    showToast('No se pudo cargar el muro: ' + err.message);
  }
}

// ---------- render del muro ----------

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderWall() {
  // update hero stats
  const sP = document.getElementById("statPosts"); if (sP) sP.textContent = state.posts.length || "0";
  const sE = document.getElementById("statEvents"); if (sE) sE.textContent = state.events.length || "0";
  const grid = $('#wallGrid');
  const empty = $('#wallEmpty');

  if (!state.posts.length) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  grid.innerHTML = state.posts.map((post, i) => `
    <article class="polaroid" tabindex="0" data-id="${post._id}" role="button" aria-label="Ver publicación">
      <div class="tape"></div>
      <div class="frame">
        ${post.type === 'video'
          ? `<video src="${post.url}" muted preload="metadata"></video><span class="video-badge">▶ VIDEO</span>`
          : `<img src="${post.url}" alt="${escapeHtml(post.caption || post.event)}" loading="lazy" />`}
      </div>
      <p class="caption">${escapeHtml(post.caption) || '<em>Sin descripción</em>'}</p>
      <div class="meta">
        <span class="event-tag">${escapeHtml(post.event)}</span>
        <span>${formatDate(post.eventDate)}</span>
      </div>
    </article>
  `).join('');

  $all('.polaroid').forEach((card) => {
    card.addEventListener('click', () => openLightbox(card.dataset.id));
    card.addEventListener('keypress', (e) => { if (e.key === 'Enter') openLightbox(card.dataset.id); });
  });
}

function renderHeroCollage() {
  const collage = $('#heroCollage');
  const sample = state.posts.filter((p) => p.type === 'image').slice(0, 6);
  if (!sample.length) { collage.innerHTML = ''; return; }

  const positions = [
    { top: '8%', left: '6%', rot: '-8deg' },
    { top: '55%', left: '3%', rot: '6deg' },
    { top: '12%', right: '5%', rot: '9deg' },
    { top: '58%', right: '7%', rot: '-7deg' },
    { top: '2%', left: '40%', rot: '-4deg' },
    { top: '70%', left: '42%', rot: '5deg' },
  ];

  collage.innerHTML = sample.map((post, i) => {
    const pos = positions[i] || positions[0];
    const style = Object.entries(pos).map(([k, v]) => k === 'rot' ? `transform: rotate(${v})` : `${k}: ${v}`).join('; ');
    return `<div class="pin" style="${style}"><img src="${post.url}" alt="" /></div>`;
  }).join('');
}

// ---------- lightbox ----------

function openLightbox(id) {
  const post = state.posts.find((p) => p._id === id);
  if (!post) return;

  const isOwner = state.user && post.uploader === state.user.id;

  // Generar nombre de descarga limpio
  const ext = post.type === 'video' ? 'mp4' : 'jpg';
  const filename = `dprian-fanfest_${escapeHtml(post.event).replace(/\s+/g, '-')}_${post._id.slice(-6)}.${ext}`;

  $('#lightboxBody').innerHTML = `
    <div class="frame-full">
      ${post.type === 'video'
        ? `<video src="${post.url}" controls autoplay></video>`
        : `<img src="${post.url}" alt="${escapeHtml(post.caption || post.event)}" />`}
    </div>
    <div class="lightbox-meta">
      <span>Subido por <strong>${escapeHtml(post.uploaderName)}</strong></span>
      <span>${formatDate(post.eventDate)}</span>
    </div>
    <p class="lightbox-caption">${escapeHtml(post.caption) || '<em>Sin descripción</em>'}</p>
    <span class="event-tag-lb"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> ${escapeHtml(post.event)}</span>
    <div class="lightbox-actions">
      <button class="btn btn-ghost" id="downloadBtn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Descargar
      </button>
      ${isOwner ? `<button class="btn-danger-ghost" id="deletePostBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Borrar publicación</button>` : ''}
    </div>
  `;

  // Descarga: fetch como blob para forzar descarga en vez de abrir en nueva pestaña
  $('#downloadBtn').addEventListener('click', async () => {
    const btn = $('#downloadBtn');
    btn.textContent = 'Descargando…';
    btn.disabled = true;
    try {
      const res = await fetch(post.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('¡Descarga iniciada! ');
    } catch {
      // Fallback: abrir en nueva pestaña
      window.open(post.url, '_blank');
      showToast('Abriendo en nueva pestaña…');
    } finally {
      btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Descargar';
      btn.disabled = false;
    }
  });

  if (isOwner) {
    $('#deletePostBtn').addEventListener('click', () => deletePost(post._id));
  }

  openModal('lightboxModal');
}

async function deletePost(id) {
  if (!confirm('¿Seguro que quieres borrar esta publicación? No se puede deshacer.')) return;
  try {
    await api('/posts/' + id, { method: 'DELETE' });
    closeModal('lightboxModal');
    showToast('Publicación eliminada');
    await loadEvents();
    await loadPosts();
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

// ---------- arranque ----------

renderAuthArea();
loadEvents();
loadPosts();