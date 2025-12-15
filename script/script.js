// =============================
//  AGENDA SURAT DIGITAL (FINAL)
//  Penomoran otomatis berbasis data terakhir
//  Admin boleh memberi nomor manual (misal 2.1)
//  Nomor selanjutnya tetap integer
// =============================

// ---- GLOBAL ----
const today = new Date().toISOString().split("T")[0];
let users = {};
let currentUser = null;
let charts = {};
let selectedChartYear = new Date().getFullYear();

// ---- STORAGE HELPERS ----
function loadUsers() {
    const saved = localStorage.getItem("app_users");
    if (saved) users = JSON.parse(saved);
}

function readList(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
}
function writeList(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
}

// -------------------------------------------------
//  PENOMORAN OTOMATIS BERDASARKAN DATA TERAKHIR
// -------------------------------------------------
function getNextAgendaNumber(key, fieldName) {
    const list = readList(key);
    if (list.length === 0) return "1";

    let last = 0;

    list.forEach(item => {
        let num = item[fieldName];
        if (!num) return;

        // Jika admin membuat 2.1 → ambil 2
        if (String(num).includes(".")) {
            num = String(num).split(".")[0];
        }

        num = parseInt(num);

        if (!isNaN(num) && num > last) {
            last = num;
        }
    });

    return String(last + 1);
}

// auto check login
// 
// AUTO SESSION CHECK + TIMEOUT (30 minutes)
window.addEventListener("load", () => {
    loadUsers();

    const cur = localStorage.getItem("app_current");
    const loginTime = localStorage.getItem("app_login_time");

    const SESSION_LIMIT = 30 * 60 * 1000; // 30 menit

    if (!cur || !users[cur]) {
        return location.href = "login.html";
    }

    if (!loginTime || (Date.now() - loginTime) > SESSION_LIMIT) {
        localStorage.removeItem("app_current");
        localStorage.removeItem("app_login_time");
        alert("Session berakhir, silakan login ulang");
        return location.href = "login.html";
    }

    currentUser = cur;
    startApp();
});


//auto login update

// AUTO SESSION CHECK + TIMEOUT (30 minutes)
window.addEventListener("load", () => {
    loadUsers();

    const cur = localStorage.getItem("app_current");
    const loginTime = localStorage.getItem("app_login_time");

    const SESSION_LIMIT = 30 * 60 * 1000; // 30 menit

    if (!cur || !users[cur]) {
        return location.href = "login.html";
    }

    if (!loginTime || (Date.now() - loginTime) > SESSION_LIMIT) {
        localStorage.removeItem("app_current");
        localStorage.removeItem("app_login_time");
        alert("Session berakhir, silakan login ulang");
        return location.href = "login.html";
    }

    currentUser = cur;
    startApp();
});


//tanpa login saat dibuka
// 
// AUTO SESSION CHECK + TIMEOUT (30 minutes)
window.addEventListener("load", () => {
    loadUsers();

    const cur = localStorage.getItem("app_current");
    const loginTime = localStorage.getItem("app_login_time");

    const SESSION_LIMIT = 30 * 60 * 1000; // 30 menit

    if (!cur || !users[cur]) {
        return location.href = "login.html";
    }

    if (!loginTime || (Date.now() - loginTime) > SESSION_LIMIT) {
        localStorage.removeItem("app_current");
        localStorage.removeItem("app_login_time");
        alert("Session berakhir, silakan login ulang");
        return location.href = "login.html";
    }

    currentUser = cur;
    startApp();
});


// ---- MULAI APLIKASI ----
function startApp() {
    document.getElementById("user-name").textContent = currentUser;
    document.getElementById("user-role").textContent = users[currentUser].role;
    document.getElementById("judul").textContent =users[currentUser].nama;

    if (users[currentUser].role === "admin") {
        document.getElementById("btn-manage-user").classList.remove("d-none");
    }
//     const userNama = users[currentUser].nama || currentUser;
// document.getElementById("user-name").textContent = "Selamat datang, " + userNama;

    bindUI();
    populateYearFilter();
    renderAll();
}

// ---- LOGOUT ----
document.getElementById("btn-logout").addEventListener("click", () => {
    if (confirm("Logout?")) {
        localStorage.removeItem("app_current");
        location.href = "login.html";
    }
});

// ---- SIDEBAR RESPONSIVE ----
document.getElementById("btn-toggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("hidden");
});

// ---- TAB SWITCHING ----
document.querySelectorAll('#sidebar .nav-link[data-tab]').forEach(a => {
    a.addEventListener("click", () => {
        document.querySelectorAll("#sidebar .nav-link").forEach(el => el.classList.remove("active"));
        a.classList.add("active");

        const tab = a.dataset.tab;
        document.querySelectorAll(".tab-pane").forEach(p => p.classList.add("d-none"));
        document.getElementById(tab).classList.remove("d-none");

        renderAll();
        if (window.innerWidth < 992) {
            document.getElementById("sidebar").classList.add("hidden");
        }
    });
});

// ---- KELOLA USER REDIRECT ----
document.getElementById("btn-manage-user").addEventListener("click", () => {
    location.href = "kelola_user.html";
});

// -------------------------
//   UI Binding + Penomoran
// -------------------------
function bindUI() {
    document.querySelectorAll('input[type="date"]').forEach(inp => inp.value = today);

    // Set nomor awal otomatis berdasarkan data terakhir
    setInitialNumbers();

    // Admin double-click untuk edit nomor
    document.querySelectorAll(".no-agenda").forEach(input => {
        input.addEventListener("dblclick", function () {
            if (users[currentUser].role === "admin") {
                this.readOnly = false;
                this.classList.add("manual");
                this.focus();
            }
        });
    });

    // numeric-only untuk masuk
    document.querySelectorAll(".numeric-only").forEach(inp => {
        inp.addEventListener("input", () => {
            inp.value = inp.value.replace(/[^0-9]/g, "");
        });
    });

    // keluar / nodin bisa titik jika manual
    document.querySelectorAll(".keluar-nodin").forEach(inp => {
        inp.addEventListener("input", () => {
            if (inp.classList.contains("manual")) {
                inp.value = inp.value.replace(/[^0-9.]/g, "");
            } else {
                inp.value = inp.value.replace(/[^0-9]/g, "");
            }
        });
    });
}

// set nomor awal berdasarkan data terakhir
function setInitialNumbers() {
    if (document.getElementById("no-agenda-ketua-masuk"))
        document.getElementById("no-agenda-ketua-masuk").value =
            getNextAgendaNumber("ketua-masuk", "no_agenda");

    if (document.getElementById("no-agenda-sekretaris-masuk"))
        document.getElementById("no-agenda-sekretaris-masuk").value =
            getNextAgendaNumber("sekretaris-masuk", "no_agenda");

    if (document.getElementById("no-agenda-ketua-keluar"))
        document.getElementById("no-agenda-ketua-keluar").value =
            getNextAgendaNumber("ketua-keluar", "no_agenda");

    if (document.getElementById("no-agenda-sekretaris-keluar"))
        document.getElementById("no-agenda-sekretaris-keluar").value =
            getNextAgendaNumber("sekretaris-keluar", "no_agenda");

    if (document.getElementById("no-nodin"))
        document.getElementById("no-nodin").value =
            getNextAgendaNumber("nota-dinas", "no_nodin");
}

// ---- READ FILE ----
function readFileAsDataURL(file, cb) {
    if (!file) return cb(null);
    const reader = new FileReader();
    reader.onload = () => cb(reader.result);
    reader.readAsDataURL(file);
}

// -----------------------------------------------------
//            SIMPAN DATA MASUK / KELUAR / NODIN
// -----------------------------------------------------

// === Ketua Masuk ===
document.getElementById("save-ketua-masuk").addEventListener("click", (e) => {
    e.preventDefault();

    const no = document.getElementById("no-agenda-ketua-masuk").value;

    const data = {
        id: Date.now(),
        no_agenda: no,
        tgl_agenda: document.getElementById("tgl-ketua-masuk").value,
        pengirim: document.getElementById("pengirim-ketua").value,
        no_surat: document.getElementById("no-surat-ketua").value,
        tgl_surat: document.getElementById("tgl-surat-ketua").value,
        perihal: document.getElementById("perihal-ketua-masuk").value,
        by: currentUser,
        updated: new Date().toLocaleString()
    };

    if (!data.pengirim || !data.no_surat || !data.perihal) {
        return alert("Semua field wajib diisi");
    }

    const file = document.getElementById("file-ketua-masuk").files[0];

    readFileAsDataURL(file, (res) => {
        if (res) data.file = res;
        push("ketua-masuk", data);
        e.target.closest("form").reset();

        document.getElementById("no-agenda-ketua-masuk").value =
            getNextAgendaNumber("ketua-masuk", "no_agenda");
    });
});
// === Sekretaris Masuk ===
document.getElementById("save-sekretaris-masuk").addEventListener("click", (e) => {
    e.preventDefault();

    const no = document.getElementById("no-agenda-sekretaris-masuk").value;

    const data = {
        id: Date.now(),
        no_agenda: no,
        tgl_agenda: document.getElementById("tgl-sekretaris-masuk").value,
        pengirim: document.getElementById("pengirim-sekretaris").value,
        no_surat: document.getElementById("no-surat-sekretaris").value,
        tgl_surat: document.getElementById("tgl-surat-sekretaris").value,
        perihal: document.getElementById("perihal-sekretaris-masuk").value,
        by: currentUser,
        updated: new Date().toLocaleString()
    };

    if (!data.pengirim || !data.no_surat || !data.perihal) {
        return alert("Semua field wajib diisi");
    }

    const file = document.getElementById("file-sekretaris-masuk").files[0];

    readFileAsDataURL(file, (res) => {
        if (res) data.file = res;
        push("sekretaris-masuk", data);
        e.target.closest("form").reset();

        document.getElementById("no-agenda-sekretaris-masuk").value =
            getNextAgendaNumber("sekretaris-masuk", "no_agenda");
    });
});

// === Ketua Keluar ===
document.getElementById("save-ketua-keluar").addEventListener("click", (e) => {
    e.preventDefault();

    const no = document.getElementById("no-agenda-ketua-keluar").value;

    const data = {
        id: Date.now(),
        no_agenda: no,
        tgl: document.getElementById("tgl-ketua-keluar").value,
        penerima: document.getElementById("penerima-ketua").value,
        perihal: document.getElementById("perihal-ketua-keluar").value,
        by: currentUser,
        updated: new Date().toLocaleString()
    };

    if (!data.penerima || !data.perihal) {
        return alert("Semua field wajib diisi");
    }

    const file = document.getElementById("file-ketua-keluar").files[0];

    readFileAsDataURL(file, (res) => {
        if (res) data.file = res;
        push("ketua-keluar", data);
        e.target.closest("form").reset();

        document.getElementById("no-agenda-ketua-keluar").value =
            getNextAgendaNumber("ketua-keluar", "no_agenda");
    });
});

// === Sekretaris Keluar ===
document.getElementById("save-sekretaris-keluar").addEventListener("click", (e) => {
    e.preventDefault();

    const no = document.getElementById("no-agenda-sekretaris-keluar").value;

    const data = {
        id: Date.now(),
        no_agenda: no,
        tgl: document.getElementById("tgl-sekretaris-keluar").value,
        penerima: document.getElementById("penerima-sekretaris").value,
        perihal: document.getElementById("perihal-sekretaris-keluar").value,
        by: currentUser,
        updated: new Date().toLocaleString()
    };

    if (!data.penerima || !data.perihal) {
        return alert("Semua field wajib diisi");
    }

    const file = document.getElementById("file-sekretaris-keluar").files[0];

    readFileAsDataURL(file, (res) => {
        if (res) data.file = res;
        push("sekretaris-keluar", data);
        e.target.closest("form").reset();

        document.getElementById("no-agenda-sekretaris-keluar").value =
            getNextAgendaNumber("sekretaris-keluar", "no_agenda");
    });
});

// === Nota Dinas ===
document.getElementById("save-nodin").addEventListener("click", (e) => {
    e.preventDefault();

    const no = document.getElementById("no-nodin").value;

    const data = {
        id: Date.now(),
        no_nodin: no,
        tgl: document.getElementById("tgl-nodin").value,
        div: document.getElementById("divisi-nodin").value,
        perihal: document.getElementById("perihal-nodin").value,
        by: currentUser,
        updated: new Date().toLocaleString()
    };

    if (!data.div || !data.perihal) return alert("Semua field wajib diisi");

    const file = document.getElementById("file-nodin").files[0];

    readFileAsDataURL(file, (res) => {
        if (res) data.file = res;
        push("nota-dinas", data);
        e.target.closest("form").reset();

        document.getElementById("no-nodin").value =
            getNextAgendaNumber("nota-dinas", "no_nodin");
    });
});

// ---- PUSH DATA ----
function push(key, entry) {
    const arr = readList(key);
    arr.unshift(entry);
    writeList(key, arr);
    renderAll();
    toast("Data disimpan");
}

// -------------------------------------
//          RENDER SEMUA TABEL
// -------------------------------------
function renderAll() {
    renderSummary();
    renderTables();
    renderCharts(selectedChartYear);
    renderSummaryTable();
}

function renderTables() {
    renderTableInstansi("ketua-masuk","table-ketua-masuk");

    renderTableInstansi("sekretaris-masuk","table-sekretaris-masuk");

    renderTableInstansi("ketua-keluar","table-ketua-keluar");

    renderTableInstansi("sekretaris-keluar","table-sekretaris-keluar");

    renderTableInstansi("nota-dinas","table-nodin");
}


// ========== ADDED BY BUILD: Instansi table renderer, preview, date formatter ==========
function formatDateDDMMYY(input) {
    if (!input) return '';
    try {
        if (String(input).match(/^\d+$/)) {
            const d = new Date(Number(input));
            return pad(d.getDate()) + '/' + pad(d.getMonth()+1) + '/' + String(d.getFullYear()).slice(-2);
        }
        const d = new Date(input);
        if (isNaN(d)) return input;
        return pad(d.getDate()) + '/' + pad(d.getMonth()+1) + '/' + String(d.getFullYear()).slice(-2);
    } catch (e) { return input; }
}
function pad(n){ return String(n).padStart(2,'0'); }

function showFilePreview(url, filename) {
    const container = document.getElementById('filePreviewContent');
    if (!container) return;
    container.innerHTML = '';
    const ext = (filename || url).split('.').pop().toLowerCase();
    if (url.startsWith('data:')) {
        if (url.indexOf('pdf') !== -1) {
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.style.width = '100%';
            iframe.style.height = '80vh';
            iframe.frameBorder = 0;
            container.appendChild(iframe);
        } else if (url.indexOf('image') !== -1) {
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            container.appendChild(img);
        } else {
            const a = document.createElement('a');
            a.href = url;
            a.innerText = 'Download Lampiran';
            a.className = 'btn btn-primary';
            a.target = '_blank';
            container.appendChild(a);
        }
    } else {
        if (['pdf'].includes(ext)) {
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.style.width = '100%';
            iframe.style.height = '80vh';
            iframe.frameBorder = 0;
            container.appendChild(iframe);
        } else if (['jpg','jpeg','png','gif','webp','bmp'].includes(ext)) {
            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            container.appendChild(img);
        } else {
            const a = document.createElement('a');
            a.href = url;
            a.innerText = 'Download Lampiran';
            a.className = 'btn btn-primary';
            a.target = '_blank';
            container.appendChild(a);
        }
    }
    const modalEl = document.getElementById('filePreviewModal');
    if (modalEl) {
        const bs = new bootstrap.Modal(modalEl);
        bs.show();
    }
}

function downloadItem(key, id) {
    const item = readList(key).find(x => x.id == id);
    if (!item) return alert("Data tidak ditemukan");
    if (!item.file) return alert("Tidak ada file");
    const a = document.createElement("a");
    a.href = item.file;
    const suggested = (item.no_agenda || item.no_nodin || item.no || id) + (item.file_name ? ('-' + item.file_name) : '');
    a.download = suggested;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function renderTableInstansi(key, tableId) {
    const data = readList(key) || [];
    let cols = [];
    if (key === "ketua-masuk" || key === "sekretaris-masuk") {
        cols = ["no_agenda","tgl_agenda","no_surat","tgl_surat","pengirim","perihal"];
    } else if (key === "ketua-keluar" || key === "sekretaris-keluar") {
        cols = ["no_agenda","tgl","penerima","perihal"];
    } else if (key === "nota-dinas") {
        cols = ["no_nodin","tgl","div","perihal"];
    } else {
        const first = data[0] || {};
        cols = Object.keys(first).slice(0,6);
    }

    const labels = {
        no_agenda: "NO AGENDA",
        tgl_agenda: "TGL AGENDA",
        no_surat: "NO SURAT",
        tgl_surat: "TGL SURAT",
        pengirim: "PENGIRIM",
        penerima: "PENERIMA",
        perihal: "PERIHAL",
        no_nodin: "NO NODIN",
        tgl: "TGL",
        div: "DIVISI"
    };
    const ths = ['<th style="width:60px">NO</th>'].concat(cols.map(c=>`<th>${labels[c]||String(c).toUpperCase()}</th>`))
        .concat(['<th style="width:120px">FILE</th>','<th>BY</th>','<th>UPDATED</th>','<th style="width:160px">AKSI</th>']).join("");

    const rows = data.map((item, idx) => {
        const tds = cols.map(c => {
            let val = item[c] || "";
            if (c.startsWith('tgl') || c==='tgl') val = formatDateDDMMYY(val);
            return `<td>${val}</td>`;
        }).join("");
        const fileCol = item.file
            ? `<div class="d-flex gap-1 justify-content-center"><button class="btn btn-sm btn-outline-primary" onclick="showFilePreview('${item.file.replace(/'/g,"\\'")}', '${(item.file_name||'lampiran').replace(/'/g,"\\'")}')">Preview</button><button class="btn btn-sm btn-primary" onclick="downloadItem('${key}', ${item.id})">Unduh</button></div>`
            : `<span class="badge bg-danger">TIDAK ADA</span>`;
        const by = item.by || item.createdBy || item.user || '';
        const updated = item.updated || '';
        const aksi = `<div class="d-flex gap-1 justify-content-center">
            <button class="btn btn-sm btn-secondary" onclick="openEditModal('${key}', ${item.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteItem('${key}', ${item.id})">Hapus</button>
        </div>`;
        return `<tr>
            ${tds}
            <td class="text-center">${fileCol}</td>
            <td class="text-center">${by}</td>
            <td class="text-center">${updated}</td>
            <td class="text-center">${aksi}</td>
        </tr>`;
    }).join("");

    const tableEl = document.getElementById(tableId);
    if (tableEl) {
        tableEl.innerHTML = `<thead><tr>${ths}</tr></thead><tbody>${rows || `<tr><td colspan="${cols.length+5}" class="text-center small text-muted">Belum ada data</td></tr>`}</tbody>`;
    }
}
// ---- DOWNLOAD FILE ----
function downloadItem(key, id) {
    const item = readList(key).find(x => x.id == id);
    if (!item) return alert("Data tidak ditemukan");
    if (!item.file) return alert("Tidak ada file");

    const a = document.createElement("a");
    a.href = item.file;
    a.download = (item.no_agenda || item.no_nodin || "file") + ".bin";
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// ---- DELETE DATA ----
function deleteItem(key, id) {
    if (!confirm("Hapus data?")) return;

    const arr = readList(key).filter(x => x.id != id);
    writeList(key, arr);
    renderAll();
    toast("Data dihapus");
}

// -------------------------------------
//             EDIT DATA
// -------------------------------------
function openEditModal(key, id) {
    const arr = readList(key);
    const item = arr.find(x => x.id == id);
    if (!item) return alert("Data tidak ditemukan");

    const body = document.getElementById("modal-edit-body");
    body.innerHTML = "";

    // === MASUK ===
    if (key === "ketua-masuk" || key === "sekretaris-masuk") {
        body.innerHTML = `
            <input type="hidden" id="edit-key" value="${key}">
            <input type="hidden" id="edit-id" value="${id}">

            <label>Nomor Agenda</label>
            <input id="edit-no_agenda" class="form-control mb-2 ${users[currentUser].role === "admin" ? "keluar-nodin manual" : "numeric-only"}"
                   value="${item.no_agenda}" ${users[currentUser].role === "admin" ? "" : "readonly"}>

            <label>Tanggal Agenda</label>
            <input type="date" id="edit-tgl_agenda" class="form-control mb-2" value="${item.tgl_agenda || today}">

            <label>Pengirim</label>
            <input id="edit-pengirim" class="form-control mb-2" value="${item.pengirim}">

            <label>Nomor Surat</label>
            <input id="edit-no_surat" class="form-control mb-2" value="${item.no_surat}">

            <label>Tanggal Surat</label>
            <input type="date" id="edit-tgl_surat" class="form-control mb-2" value="${item.tgl_surat}">

            <label>Perihal</label>
            <input id="edit-perihal" class="form-control mb-3" value="${item.perihal}">

            <label>File (opsional)</label>
            <input type="file" id="edit-file" class="form-control">
        `;
    }

    // === KELUAR ===
    else if (key === "ketua-keluar" || key === "sekretaris-keluar") {
        body.innerHTML = `
            <input type="hidden" id="edit-key" value="${key}">
            <input type="hidden" id="edit-id" value="${id}">

            <label>Nomor Agenda</label>
            <input id="edit-no_agenda" class="form-control mb-2 keluar-nodin"
                   value="${item.no_agenda}" ${users[currentUser].role === "admin" ? "" : "readonly"}>

            <label>Tanggal</label>
            <input type="date" id="edit-tgl" class="form-control mb-2" value="${item.tgl}">

            <label>Penerima</label>
            <input id="edit-penerima" class="form-control mb-2" value="${item.penerima}">

            <label>Perihal</label>
            <input id="edit-perihal" class="form-control mb-3" value="${item.perihal}">

            <label>File (opsional)</label>
            <input type="file" id="edit-file" class="form-control">
        `;
    }

    // === NODIN ===
    else if (key === "nota-dinas") {
        body.innerHTML = `
            <input type="hidden" id="edit-key" value="${key}">
            <input type="hidden" id="edit-id" value="${id}">

            <label>Nomor Nodin</label>
            <input id="edit-no_nodin" class="form-control mb-2 keluar-nodin"
                   value="${item.no_nodin}" ${users[currentUser].role === "admin" ? "" : "readonly"}>

            <label>Tanggal</label>
            <input type="date" id="edit-tgl" class="form-control mb-2" value="${item.tgl}">

            <label>Divisi</label>
            <input id="edit-div" class="form-control mb-2" value="${item.div}">

            <label>Perihal</label>
            <input id="edit-perihal" class="form-control mb-3" value="${item.perihal}">

            <label>File (opsional)</label>
            <input type="file" id="edit-file" class="form-control">
        `;
    }

    new bootstrap.Modal(document.getElementById("modalEdit")).show();
}

// ---- SUBMIT EDIT ----
document.getElementById("form-edit").addEventListener("submit", (e) => {
    e.preventDefault();

    const key = document.getElementById("edit-key").value;
    const id = Number(document.getElementById("edit-id").value);
    const arr = readList(key);
    const idx = arr.findIndex(i => i.id === id);
    const item = arr[idx];

    function saveAndExit() {
        arr[idx] = item;
        writeList(key, arr);
        renderAll();

        bootstrap.Modal.getInstance(document.getElementById("modalEdit")).hide();
        toast("Perubahan disimpan");
    }

    // === MASUK ===
    if (key === "ketua-masuk" || key === "sekretaris-masuk") {
        item.no_agenda = document.getElementById("edit-no_agenda").value;
        item.tgl_agenda = document.getElementById("edit-tgl_agenda").value;
        item.pengirim = document.getElementById("edit-pengirim").value;
        item.no_surat = document.getElementById("edit-no_surat").value;
        item.tgl_surat = document.getElementById("edit-tgl_surat").value;
        item.perihal = document.getElementById("edit-perihal").value;
    }

    // === KELUAR ===
    else if (key === "ketua-keluar" || key === "sekretaris-keluar") {
        item.no_agenda = document.getElementById("edit-no_agenda").value;
        item.tgl = document.getElementById("edit-tgl").value;
        item.penerima = document.getElementById("edit-penerima").value;
        item.perihal = document.getElementById("edit-perihal").value;
    }

    // === NODIN ===
    else if (key === "nota-dinas") {
        item.no_nodin = document.getElementById("edit-no_nodin").value;
        item.tgl = document.getElementById("edit-tgl").value;
        item.div = document.getElementById("edit-div").value;
        item.perihal = document.getElementById("edit-perihal").value;
    }

    // ==== FILE ====
    const file = document.getElementById("edit-file").files[0];

    if (file) {
        const r = new FileReader();
        r.onload = () => {
            item.file = r.result;
            item.updated = new Date().toLocaleString();
            saveAndExit();
        };
        r.readAsDataURL(file);
    } else {
        item.updated = new Date().toLocaleString();
        saveAndExit();
    }
});

function filterByYear(arr, field, year) {
    return arr.filter(d => d[field] && String(d[field]).startsWith(String(year)));
}
// -------------------------------------
//            RINGKASAN DASHBOARD
// -------------------------------------


function summaryCard(title, count, icon) {
    return `
    <div class="col-6 col-md-3 mb-2">
        <div class="p-3 bg-white border rounded h-100">
            <div class="d-flex align-items-center">
                <div class="me-3 text-primary"><i class="fa ${icon} fa-2x"></i></div>
                <div>
                    <div class="small text-muted">${title}</div>
                    <div class="h5 mb-0">${count}</div>
                </div>
            </div>
        </div>
    </div>`;
}

// -------------------------------------
//        TABEL RINGKASAN DASHBOARD
// -------------------------------------
function renderSummaryTable() {
    const items = [
        ["ketua-masuk", "Masuk Ketua"],
        ["ketua-keluar", "Keluar Ketua"],
        ["sekretaris-masuk", "Masuk Sekretaris"],
        ["sekretaris-keluar", "Keluar Sekretaris"],
        ["nota-dinas", "Nota Dinas"]
    ];

    let rows = items.map(([key, label]) => {
        return `
        <tr>
            <td>${label}</td>
            <td>${getCountByYear(key, selectedChartYear)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="exportTableToXLSX('${key}','${label.replace(/\s/g,'_')}')">
                    Export
                </button>
            </td>
        </tr>`;
    }).join("");

    document.getElementById("table-summary").innerHTML = `
        <thead><tr><th>Kategori</th><th>Jumlah</th><th>Aksi</th></tr></thead>
        <tbody>${rows}</tbody>
    `;
}

// -------------------------------------
//                CHARTS
// -------------------------------------

function populateYearFilter() {
    // small delay to ensure DOM elements in hidden tabs are available in all browsers
    setTimeout(() => {
        const sel = document.getElementById("filter-year");
        if (!sel) return;

        const now = new Date().getFullYear();
        sel.innerHTML = "";

        for (let y = now; y >= now - 10; y--) {
            sel.innerHTML += `<option value="${y}">${y}</option>`;
        }

        sel.value = selectedChartYear;

        // remove previous handlers to avoid duplicates
        sel.onchange = null;
        sel.addEventListener("change", () => {
            selectedChartYear = Number(sel.value);
            // update all dashboard parts
            renderCharts(selectedChartYear);
            renderSummary();
            renderSummaryTable();
        });
    }, 20);
}

function renderCharts(year) {
    const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];

    function countPerMonth(key, field) {
        const arr = readList(key);
        return months.map((_, i) => {
            const month = String(i + 1).padStart(2, "0");
            return arr.filter(d => String(d[field]).startsWith(`${year}-${month}`)).length;
        });
    }

    // MASUK & KELUAR
    const masukKetua = countPerMonth("ketua-masuk", "tgl_agenda");
    const masukSekre = countPerMonth("sekretaris-masuk", "tgl_agenda");
    const keluarKetua = countPerMonth("ketua-keluar", "tgl");
    const keluarSekre = countPerMonth("sekretaris-keluar", "tgl");

    const ctx = document.getElementById("chartSurat").getContext("2d");

    if (charts.surat) charts.surat.destroy();

    charts.surat = new Chart(ctx, {
        type: "bar",
        data: {
            labels: months,
            datasets: [
                { label: "Ketua Masuk", data: masukKetua },
                { label: "Sekretaris Masuk", data: masukSekre },
                { label: "Ketua Keluar", data: keluarKetua },
                { label: "Sekretaris Keluar", data: keluarSekre }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" },
                title: { display: true, text: `Statistik Surat Tahun ${year}` }
            }
        }
    });

    // CHART NODIN
    const nodin = readList("nota-dinas");
    const dist = { "Sekretaris": 0, "KUL": 0, "Rendatin": 0, "Tekhum": 0, "SDM Parmas": 0 };

    nodin.forEach(d => {
        if (d.tgl && d.tgl.startsWith(String(year)) && dist[d.div] !== undefined) {
            dist[d.div]++;
        }
    });

    const ctx2 = document.getElementById("chartNodin").getContext("2d");

    if (charts.nodin) charts.nodin.destroy();

    charts.nodin = new Chart(ctx2, {
        type: "doughnut",
        data: {
            labels: Object.keys(dist),
            datasets: [{ data: Object.values(dist) }]
        },
        options: {
            plugins: {
                legend: { position: "bottom" },
                title: { display: true, text: `Distribusi Nota Dinas ${year}` }
            }
        }
    });
}

// -------------------------------------
//           EXPORT EXCEL
// -------------------------------------
function exportTableToXLSX(key, filename) {
    const data = readList(key);
    if (!data.length) return alert("Tidak ada data");

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename + ".xlsx");
}

window.exportTableToXLSX = exportTableToXLSX;

// -------------------------------------
//           CHANGE PASSWORD
// -------------------------------------
// document.getElementById("btn-change-pass").addEventListener("click", () => {
//     new bootstrap.Modal(document.getElementById("modalChangePass")).show();
// });

document.getElementById("form-change-pass").addEventListener("submit", (e) => {
    e.preventDefault();

    const oldp = document.getElementById("old-pass").value;
    const newp = document.getElementById("new-pass").value;
    const conf = document.getElementById("confirm-pass").value;

    if (users[currentUser].pass !== oldp) return alert("Password lama salah");
    if (newp !== conf) return alert("Konfirmasi tidak cocok");

    users[currentUser].pass = newp;
    localStorage.setItem("app_users", JSON.stringify(users));

    bootstrap.Modal.getInstance(document.getElementById("modalChangePass")).hide();
    toast("Password diperbarui");
});

// -------------------------------------
//           TOAST MESSAGE
// -------------------------------------
function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast-msg";
    el.textContent = msg;

    document.body.appendChild(el);

    setTimeout(() => el.classList.add("show"), 10);
    setTimeout(() => el.classList.remove("show"), 2000);
    setTimeout(() => el.remove(), 2500);
}

// ===== FIXED SUMMARY =====
function renderSummary() {
    const y = selectedChartYear;

    const km = filterByYear(readList("ketua-masuk"), "tgl_agenda", y).length;
    const sm = filterByYear(readList("sekretaris-masuk"), "tgl_agenda", y).length;
    const ks = filterByYear(readList("ketua-keluar"), "tgl", y).length;
    const ss = filterByYear(readList("sekretaris-keluar"), "tgl", y).length;
    const nd = filterByYear(readList("nota-dinas"), "tgl", y).length;

    const html = `
        ${summaryCard("Ketua Masuk", km, "fa-inbox")}
        ${summaryCard("Ketua Keluar", ks, "fa-paper-plane")}
        ${summaryCard("Sekretaris Masuk", sm, "fa-inbox")}
        ${summaryCard("Sekretaris Keluar", ss, "fa-paper-plane")}
        ${summaryCard("Nota Dinas", nd, "fa-file-alt")}
    `;

    const el = document.getElementById("summary-cards");
    if (el) el.innerHTML = html;
}

function getCountByYear(key, year) {
    const data = readList(key) || [];
    if (key === "ketua-masuk" || key === "sekretaris-masuk") {
        return filterByYear(data, "tgl_agenda", year).length;
    }
    if (key === "ketua-keluar" || key === "sekretaris-keluar" || key === "nota-dinas") {
        return filterByYear(data, "tgl", year).length;
    }
    return 0;
}

function renderSummaryTable() {
    const items = [
        ["ketua-masuk", "Masuk Ketua"],
        ["ketua-keluar", "Keluar Ketua"],
        ["sekretaris-masuk", "Masuk Sekretaris"],
        ["sekretaris-keluar", "Keluar Sekretaris"],
        ["nota-dinas", "Nota Dinas"]
    ];

    let rows = items.map(([key, label]) => `
        <tr>
            <td>${label}</td>
            <td>${getCountByYear(key, selectedChartYear)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="exportTableToXLSX('${key}','${label.replace(/\s/g,'_')}')">
                    Export
                </button>
            </td>
        </tr>
    `).join("");

    const el = document.getElementById("table-summary");
    if (el) {
        el.innerHTML = `<thead><tr><th>Kategori</th><th>Jumlah</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody>`;
    }
}

console.log("Agenda Surat Digital — Script Loaded");