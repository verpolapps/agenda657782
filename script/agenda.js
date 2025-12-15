// script/agenda.js
import { getCategoryData, saveData, listenCategory, saveCache, loadCache, getNextNumber } from "./db.js";

// mapping kategori ke id element dan label
const categories = {
  'ketua-masuk': { path: 'ketua_masuk', form: 'form-ketua-masuk', saveBtn: 'save-ketua-masuk', table: 'table-ketua-masuk', noField: 'no-agenda-ketua-masuk' },
  'ketua-keluar': { path: 'ketua_keluar', form: 'form-ketua-keluar', saveBtn: 'save-ketua-keluar', table: 'table-ketua-keluar', noField: 'no-agenda-ketua-keluar' },
  'sekretaris-masuk': { path: 'sekretaris_masuk', form: 'form-sekretaris-masuk', saveBtn: 'save-sekretaris-masuk', table: 'table-sekretaris-masuk', noField: 'no-agenda-sekretaris-masuk' },
  'sekretaris-keluar': { path: 'sekretaris_keluar', form: 'form-sekretaris-keluar', saveBtn: 'save-sekretaris-keluar', table: 'table-sekretaris-keluar', noField: 'no-agenda-sekretaris-keluar' },
  'nota-dinas': { path: 'nota_dinas', form: 'form-nodin', saveBtn: 'save-nodin', table: 'table-nodin', noField: 'no-nodin' }
};

// Util: render table rows given array of items
function renderTableById(tableId, rows) {
  const t = document.getElementById(tableId);
  if (!t) return;
  let html = '<thead><tr><th>No</th><th>Nomor</th><th>Tanggal</th><th>Pengirim/Penerima</th><th>Perihal</th><th>Aksi</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    const pengirim = r.pengirim || r.penerima || r.divisi || '-';
    html += `<tr data-id="${r._id || ''}"><td>${i+1}</td><td>${r.nomor || '-'}</td><td>${r.tanggal || '-'}</td><td>${pengirim}</td><td>${r.perihal || '-'}</td><td><button class="btn btn-sm btn-outline-primary btn-view" data-id="${r._id || ''}">Lihat</button></td></tr>`;
  });
  html += '</tbody>';
  t.innerHTML = html;
}

// Convert firebase map -> array with _id
function mapToArray(map) {
  if (!map) return [];
  return Object.entries(map).map(([k, v]) => ({ _id: k, ...v })).sort((a,b) => {
    // sort by nomor numeric if present
    const na = Number(a.nomor) || 0, nb = Number(b.nomor) || 0;
    return na - nb;
  });
}

// Load cache first, then realtime listen to Firebase
function attachTableSync(tabKey) {
  const info = categories[tabKey];
  if (!info) return;
  const cacheKey = 'cache_' + info.path;
  const cached = loadCache(cacheKey);
  if (cached && cached.length) renderTableById(info.table, cached);

  // realtime
  listenCategory(info.path, (data) => {
    const arr = mapToArray(data);
    saveCache(cacheKey, arr);
    renderTableById(info.table, arr);
  });
}

// Set next number into the noField (non-blocking)
async function setNextNumberFor(tabKey) {
  const info = categories[tabKey];
  if (!info) return;
  const fld = document.getElementById(info.noField);
  if (!fld) return;
  try {
    const next = await getNextNumber(info.path);
    fld.value = next;
  } catch(e) {
    console.error("setNextNumberFor error", e);
    // fallback: try fetch existing and +1
    try {
      const snapshot = await getCategorySnapshot(info.path);
      const arr = mapToArray(snapshot);
      const max = arr.reduce((m,x)=>Math.max(m, Number(x.nomor||0)),0);
      fld.value = max+1;
    } catch(e2) {
      fld.value = '';
    }
  }
}

// helper to fetch once
async function getCategorySnapshot(path) {
  return await getCategoryData(path);
}

// Hook sidebar navigation (data-tab attribute)
function initTabNavigation() {
  document.querySelectorAll('#sidebar .nav-link[data-tab]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.getAttribute('data-tab');
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('d-none'));
      const pane = document.getElementById(tab);
      if (pane) pane.classList.remove('d-none');
      // set nomor and attach table sync
      if (categories[tab]) {
        setNextNumberFor(tab);
        attachTableSync(tab);
      }
    });
  });
  // trigger default active (dashboard already)
}

// Attach save handlers for forms
function initSaveHandlers() {
  Object.keys(categories).forEach(tabKey => {
    const info = categories[tabKey];
    const btn = document.getElementById(info.saveBtn);
    const form = document.getElementById(info.form);
    if (!btn || !form) return;
    btn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      // collect fields generically based on form inputs
      const inputs = form.querySelectorAll('input, select, textarea');
      const payload = {};
      inputs.forEach(inp => {
        if (inp.type === 'file') return; // skip file upload handling here
        payload[inp.id || inp.name] = inp.value;
      });
      // ensure nomor is fresh: we will increment counter and use it
      try {
        const nomor = await getNextNumber(info.path);
        payload.nomor = String(nomor);
      } catch(e) {
        console.error("Gagal mendapatkan nomor unik", e);
        alert('Gagal mendapatkan nomor unik. Coba lagi.');
        return;
      }
      payload.timestamp = Date.now();
      payload.createdBy = document.getElementById('user-name') ? document.getElementById('user-name').innerText : 'local';

      try {
        await saveData(info.path, payload);
        alert('Data berhasil disimpan.');
        // refresh number for next entry
        setNextNumberFor(tabKey);
      } catch(e) {
        console.error("save error", e);
        alert('Gagal menyimpan data.');
      }
    });
  });
}


// -------------------------
// File preview in modal
// -------------------------
function showFilePreview(url, filename) {
  const container = document.getElementById('filePreviewContent');
  if (!container) return;
  container.innerHTML = '';
  // determine type by extension
  const ext = (filename || url).split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','bmp','webp'].includes(ext)) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = filename || 'Lampiran';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    container.appendChild(img);
  } else if (ext === 'pdf') {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.height = '80vh';
    iframe.frameBorder = 0;
    container.appendChild(iframe);
  } else {
    // provide download link for unknown types
    const a = document.createElement('a');
    a.href = url;
    a.innerText = 'Download Lampiran';
    a.className = 'btn btn-primary';
    a.target = '_blank';
    container.appendChild(a);
  }
  // show modal using bootstrap
  const modalEl = document.getElementById('filePreviewModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

// attach click handlers for view buttons using event delegation
document.addEventListener('click', function(e){
  const btn = e.target.closest('.btn-view');
  if (!btn) return;
  const tr = btn.closest('tr');
  if (!tr) return;
  const id = btn.getAttribute('data-id');
  const table = tr.closest('table');
  // find data from cache by table id
  if (!table) return;
  const tableId = table.id;
  // map table id to category path used in cache key
  const mapping = {
    'table-ketua-masuk':'ketua_masuk',
    'table-ketua-keluar':'ketua_keluar',
    'table-sekretaris-masuk':'sekretaris_masuk',
    'table-sekretaris-keluar':'sekretaris_keluar',
    'table-nodin':'nota_dinas'
  };
  const cat = mapping[tableId];
  if (!cat) return;
  const cacheKey = 'cache_' + cat;
  const arr = loadCache(cacheKey) || [];
  const item = arr.find(x=>x._id === id);
  if (!item) {
    // as fallback try to fetch from firebase map
    console.warn('Item not in cache, cannot preview');
    return;
  }
  if (item.lampiran_url) showFilePreview(item.lampiran_url, item.lampiran_nama || '');
  else alert('Tidak ada lampiran untuk entry ini.');
});

// -------------------------
// Search and Year Filter
// -------------------------
function getUniqueYearsFromCache(path) {
  const cacheKey = 'cache_' + path;
  const arr = loadCache(cacheKey) || [];
  const years = new Set();
  arr.forEach(it=>{
    if (it.tanggal) {
      const y = (new Date(it.tanggal)).getFullYear();
      if (!isNaN(y)) years.add(y);
    } else if (it.timestamp) {
      const y = (new Date(it.timestamp)).getFullYear();
      if (!isNaN(y)) years.add(y);
    }
  });
  return Array.from(years).sort((a,b)=>b-a);
}

function populateYearFilter() {
  const sel = document.getElementById('yearFilter');
  if (!sel) return;
  // collect from all categories
  const allYears = new Set();
  Object.values(categories).forEach(c=> {
    const ys = getUniqueYearsFromCache(c.path);
    ys.forEach(y=>allYears.add(y));
  });
  // clear and add options
  sel.innerHTML = '<option value="">Semua Tahun</option>';
  Array.from(allYears).sort((a,b)=>b-a).forEach(y=>{
    const opt = document.createElement('option');
    opt.value = y;
    opt.innerText = y;
    sel.appendChild(opt);
  });
}

function applySearchAndFilterToRender(originalArray, tableId) {
  const q = (document.getElementById('globalSearch')?.value || '').toLowerCase().trim();
  const year = (document.getElementById('yearFilter')?.value || '');
  let filtered = originalArray.filter(item=>{
    let ok = true;
    if (q) {
      const combined = ((item.nomor||'') + ' ' + (item.perihal||'') + ' ' + (item.pengirim||item.penerima||'') ).toLowerCase();
      ok = combined.indexOf(q) !== -1;
    }
    if (ok && year) {
      const y = item.tanggal ? new Date(item.tanggal).getFullYear() : (item.timestamp ? new Date(item.timestamp).getFullYear() : null);
      ok = String(y) === String(year);
    }
    return ok;
  });
  renderTableById(tableId, filtered);
}

// attach search/filter events (debounced)
function debounce(fn, wait=250){
  let t;
  return function(...args){
    clearTimeout(t);
    t = setTimeout(()=>fn.apply(this,args), wait);
  };
}

const debouncedApply = debounce(()=>{
  // re-render currently visible table only
  document.querySelectorAll('table[id^="table-"]').forEach(table=>{
    const cacheKey = 'cache_' + ( { 'table-ketua-masuk':'ketua_masuk','table-ketua-keluar':'ketua_keluar','table-sekretaris-masuk':'sekretaris_masuk','table-sekretaris-keluar':'sekretaris_keluar','table-nodin':'nota_dinas' }[table.id] );
    const arr = loadCache(cacheKey) || [];
    applySearchAndFilterToRender(arr, table.id);
  });
}, 200);

document.addEventListener('input', function(e){
  if (e.target && (e.target.id === 'globalSearch')) debouncedApply();
});
document.getElementById('yearFilter')?.addEventListener('change', function(e){
  debouncedApply();
});
document.getElementById('clearFilters')?.addEventListener('click', function(e){
  const g = document.getElementById('globalSearch'); if (g) g.value='';
  const y = document.getElementById('yearFilter'); if (y) y.value='';
  debouncedApply();
});

// repopulate year filter whenever caches update - override attachTableSync to call populateYearFilter after saveCache
const _orig_saveCache = window.saveCache || null;
// Monkey patch internal saveCache (we have saveCache imported from db.js; ensure global exists)
if (typeof window.saveCache === 'function') {
  const originalSaveCache = window.saveCache;
  window.saveCache = function(k,v){
    originalSaveCache(k,v);
    populateYearFilter();
  };
}
// initial populate
document.addEventListener('DOMContentLoaded', populateYearFilter);


// Initialize all
function init() {
  initTabNavigation();
  initSaveHandlers();
  // Pre-attach tables for visibility if needed
  Object.keys(categories).forEach(k => attachTableSync(k));
}

// DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
