// =========================================================================
// 1. KONFIGURASI SUPABASE & SISTEM UI/UX BOOTSTRAP 5.3 (MODAL & LOADING)
// =========================================================================
window.supabaseUrl = 'https://rniggtkxtlblpvxaycrl.supabase.co';
window.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuaWdndGt4dGxibHB2eGF5Y3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMTYzNDcsImV4cCI6MjA5OTY5MjM0N30.vo-FGuq_QL5R9WI21jA535txSp1uZDAxzirSEk6eP44';

if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(window.supabaseUrl, window.supabaseKey);
}

// Overlay Loading Penuh & Spinner Tombol
window.showLoadingUI = function(tampil, judul = "Memproses Data...", sub = "Mohon tunggu sebentar...") {
    const el = document.getElementById("globalLoadingOverlay");
    if (!el) return;
    document.getElementById("loadingTitleText").innerText = judul;
    document.getElementById("loadingSubText").innerText = sub;
    el.style.display = tampil ? "flex" : "none";
};

window.setTombolLoading = function(btn, isLoading, teksLoading = "Menyimpan...") {
    if (!btn) return;
    if (isLoading) {
        btn.setAttribute("data-orig-html", btn.innerHTML);
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${teksLoading}`;
    } else {
        btn.disabled = false;
        const orig = btn.getAttribute("data-orig-html");
        if (orig) btn.innerHTML = orig;
    }
};

// Toast Notifikasi Halus
window.showToast = function(pesan, tipe = 'success') {
    const container = document.getElementById("toastContainerApp");
    if (!container) return;
    const warna = tipe === 'success' ? 'bg-success text-white' : (tipe === 'warning' ? 'bg-warning text-dark' : 'bg-danger text-white');
    const icon = tipe === 'success' ? 'fa-circle-check' : (tipe === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-xmark');
    const idToast = 'toast_' + Date.now();

    const html = `
        <div id="${idToast}" class="toast align-items-center ${warna} border-0 shadow-lg rounded-3" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body fw-bold">
                    <i class="fa-solid ${icon} me-2"></i> ${pesan}
                </div>
                <button type="button" class="btn-close ${tipe === 'warning' ? '' : 'btn-close-white'} me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(idToast);
    const bsToast = new bootstrap.Toast(el, { delay: 3500 });
    bsToast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
};

// Sistem Popup Modal Bootstrap 5.3 (Pengganti alert, confirm, prompt bawaan browser)
let bsDialogInstance = null;
function getBsDialog() {
    const el = document.getElementById("bsDialogModal");
    if (!bsDialogInstance) bsDialogInstance = new bootstrap.Modal(el);
    return bsDialogInstance;
}

window.uiAlert = function(judul, pesan, tipe = 'success') {
    return new Promise((resolve) => {
        const iconMap = {
            'success': '<div class="mx-auto bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style="width:64px;height:64px;font-size:2rem;"><i class="fa-solid fa-circle-check"></i></div>',
            'error': '<div class="mx-auto bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style="width:64px;height:64px;font-size:2rem;"><i class="fa-solid fa-circle-xmark"></i></div>',
            'warning': '<div class="mx-auto bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style="width:64px;height:64px;font-size:2rem;"><i class="fa-solid fa-triangle-exclamation"></i></div>'
        };
        document.getElementById("bsDialogIcon").innerHTML = iconMap[tipe] || iconMap['success'];
        document.getElementById("bsDialogTitle").innerText = judul;
        document.getElementById("bsDialogMessage").innerText = pesan;
        document.getElementById("bsDialogInputWrap").classList.add("d-none");

        const btnWrap = document.getElementById("bsDialogButtons");
        btnWrap.innerHTML = `<button type="button" class="btn btn-success fw-bold px-4 rounded-pill" id="bsDialogBtnOk">OK, Mengerti</button>`;
        
        const modal = getBsDialog();
        document.getElementById("bsDialogBtnOk").onclick = () => {
            modal.hide();
            resolve(true);
        };
        modal.show();
    });
};

window.uiConfirm = function(judul, pesan, teksYa = "Ya, Lanjutkan", warnaBtn = "btn-success") {
    return new Promise((resolve) => {
        document.getElementById("bsDialogIcon").innerHTML = '<div class="mx-auto bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style="width:64px;height:64px;font-size:2rem;"><i class="fa-solid fa-circle-question"></i></div>';
        document.getElementById("bsDialogTitle").innerText = judul;
        document.getElementById("bsDialogMessage").innerText = pesan;
        document.getElementById("bsDialogInputWrap").classList.add("d-none");

        const btnWrap = document.getElementById("bsDialogButtons");
        btnWrap.innerHTML = `
            <button type="button" class="btn btn-light border fw-bold px-4 rounded-pill" id="bsDialogBtnCancel">Batal</button>
            <button type="button" class="btn ${warnaBtn} fw-bold px-4 rounded-pill" id="bsDialogBtnYes">${teksYa}</button>
        `;

        const modal = getBsDialog();
        document.getElementById("bsDialogBtnCancel").onclick = () => { modal.hide(); resolve(false); };
        document.getElementById("bsDialogBtnYes").onclick = () => { modal.hide(); resolve(true); };
        modal.show();
    });
};

window.uiPrompt = function(judul, pesan, placeholder = "Ketik di sini...") {
    return new Promise((resolve) => {
        document.getElementById("bsDialogIcon").innerHTML = '<div class="mx-auto bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style="width:64px;height:64px;font-size:1.8rem;"><i class="fa-solid fa-pen-to-square"></i></div>';
        document.getElementById("bsDialogTitle").innerText = judul;
        document.getElementById("bsDialogMessage").innerText = pesan;
        
        const inpWrap = document.getElementById("bsDialogInputWrap");
        const inp = document.getElementById("bsDialogInput");
        inpWrap.classList.remove("d-none");
        inp.value = "";
        inp.placeholder = placeholder;

        const btnWrap = document.getElementById("bsDialogButtons");
        btnWrap.innerHTML = `
            <button type="button" class="btn btn-light border fw-bold px-4 rounded-pill" id="bsDialogBtnCancel">Batal</button>
            <button type="button" class="btn btn-success fw-bold px-4 rounded-pill" id="bsDialogBtnSave">Simpan</button>
        `;

        const modal = getBsDialog();
        document.getElementById("bsDialogBtnCancel").onclick = () => { modal.hide(); resolve(null); };
        document.getElementById("bsDialogBtnSave").onclick = () => {
            const val = inp.value.trim();
            modal.hide();
            resolve(val || null);
        };
        modal.show();
        setTimeout(() => inp.focus(), 300);
    });
};

// Mesin Request Database (Berjalan Halus di Belakang Layar)
window.apiRequest = function(method, tableAndQuery, dataPayload = null, extraPrefer = 'return=representation') {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `${window.supabaseUrl}/rest/v1/${tableAndQuery}`,
            method: method,
            headers: {
                'apikey': window.supabaseKey,
                'Authorization': `Bearer ${window.supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': extraPrefer
            },
            data: dataPayload ? JSON.stringify(dataPayload) : undefined,
            success: function(res) { resolve(res); },
            error: function(xhr) {
                const errMsg = xhr.responseJSON?.message || xhr.responseJSON?.details || xhr.statusText || "Terjadi kesalahan koneksi database";
                reject(new Error(errMsg));
            }
        });
    });
};

// State Global
let currentBendahara = null;
let paymentSettings = {
    school_name: "SMK AD-DA'WAH JAKARTA",
    merchant_name: "SMK Addawah",
    active_tahun_ajaran: "2026/2027",
    static_qris: "00020101021126610014COM.GO-JEK.WWW01189360091437682693650210G7682693650303UMI51440014ID.CO.QRIS.WWW0215ID10266356616340303UMI5204829953033605802ID5911SMK Addawah6013JAKARTA BARAT61051175062070703A0163046227",
    custom_categories: ["PPDB", "Uang Pangkal", "SPP", "Ujian", "Praktikum", "Kegiatan", "Seragam"]
};

let daftarKelasDB = [];
let daftarJurusanDB = [];
let daftarSiswaUsers = [];
let daftarSiswaPPDB = [];
let masterItems = [];
let allInvoices = [];
let allInvoiceDetails = [];
let allTransactions = [];
let selectedInvoicePOS = null;
let selectedMethodPOS = 'CASH';
let chartPemasukanInstance = null;
let lastStrukData = null;
let kategoriAktifForm = "PPDB";
let filterKategoriTabelItem = ""; // Kosong = Tampilkan semua
let isSyncingInvoices = false;

// =========================================================================
// 2. INISIALISASI & PARSER KELAS + JURUSAN DARI TABEL `public.users`
// =========================================================================
document.addEventListener("DOMContentLoaded", async () => {
    const tglEl = document.getElementById("liveTanggalBendahara");
    if (tglEl) {
        tglEl.innerText = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }

    const sesiTersimpan = localStorage.getItem("sesi_addawah");
    if (!sesiTersimpan) {
        window.location.href = "index.html";
        return;
    }

    const userData = JSON.parse(sesiTersimpan);
    if (userData.role !== "bendahara" && userData.role !== "admin") {
        await uiAlert("Akses Ditolak", "Halaman ini khusus untuk Bendahara Sekolah.", "error");
        window.location.href = "index.html";
        return;
    }

    currentBendahara = userData;
    document.getElementById("lblNamaBendahara").innerText = userData.nama_lengkap || userData.nama || userData.username;

    showLoadingUI(true, "Memuat Data Keuangan...", "Menyinkronkan kelas, jurusan, dan tagihan siswa...");
    try {
        await muatPengaturanQRIS();
        await muatKelasDanJurusanDariUsers();
        await refreshSemuaData();
    } finally {
        showLoadingUI(false);
    }
});

window.keluarBendahara = async function() {
    const yakin = await uiConfirm("Keluar Aplikasi", "Apakah Anda yakin ingin keluar dari Sistem Keuangan Bendahara?", "Ya, Keluar", "btn-danger");
    if (yakin) {
        localStorage.removeItem("sesi_addawah");
        window.location.href = "index.html";
    }
};

window.switchMenuBendahara = function(menuId, el) {
    document.querySelectorAll('.menu-section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('.nav-item-b').forEach(nav => nav.classList.remove('active'));
    
    const target = document.getElementById(`sec_${menuId}`);
    if (target) target.style.display = 'block';
    if (el) el.classList.add('active');

    const mapJudul = {
        'dashboard': 'Dashboard Bendahara',
        'kasir': 'Kasir Pembayaran Siswa',
        'items': 'Master Item Pembayaran',
        'tagihan': 'Daftar Tagihan & Piutang Siswa',
        'riwayat': 'Riwayat Transaksi & Verifikasi',
        'tunggakan': 'Daftar Tunggakan Siswa',
        'laporan': 'Laporan Keuangan & Audit Log',
        'pengaturan': 'Pengaturan Merchant QRIS'
    };
    document.getElementById("judulHalamanBendahara").innerText = mapJudul[menuId] || 'Dashboard Bendahara';

    if (menuId === 'kasir') isiDropdownSiswaPOS();
    if (menuId === 'items') hitungPreviewTargetSiswa();
    if (menuId === 'laporan') muatLaporanDanAudit();
};

/**
 * Memisahkan Tingkat dan Jurusan secara cerdas dari kolom `kelas` di tabel `public.users`.
 * Contoh: "X AK" -> tingkat: "X", jurusan: "AK"
 *         "XI AK" -> tingkat: "XI", jurusan: "AK"
 *         "XII AK 1" -> tingkat: "XII", jurusan: "AK"
 * Sehingga "X AK", "XI AK", "XII AK" semuanya dikenali sebagai jurusan "AK".
 */
function parseKelasDanJurusan(namaKelasRaw) {
    if (!namaKelasRaw || typeof namaKelasRaw !== 'string') {
        return { kelasLengkap: '', tingkat: '', jurusan: '' };
    }
    const clean = namaKelasRaw.trim().replace(/\s+/g, ' ');
    if (!clean || clean === '-') {
        return { kelasLengkap: '', tingkat: '', jurusan: '' };
    }
    const parts = clean.split(' ');
    const tingkat = parts[0].toUpperCase();
    let jurusan = '';
    if (parts.length >= 2) {
        jurusan = parts[1].toUpperCase();
    } else {
        jurusan = tingkat;
    }
    return {
        kelasLengkap: clean,
        tingkat: tingkat,
        jurusan: jurusan
    };
}

async function muatKelasDanJurusanDariUsers() {
    const setKelas = new Set();
    const setJurusan = new Set();

    try {
        // 1. Tarik seluruh siswa dari tabel public.users
        const allUsers = await apiRequest('GET', 'users?select=username,nama_lengkap,role,kelas,no_hp,nama_ayah,nama_ibu,foto_profil&order=nama_lengkap.asc');
        if (Array.isArray(allUsers)) {
            daftarSiswaUsers = allUsers.filter(u => u.role && u.role.toLowerCase() === 'siswa');
            daftarSiswaUsers.forEach(u => {
                const parsed = parseKelasDanJurusan(u.kelas);
                if (parsed.kelasLengkap) setKelas.add(parsed.kelasLengkap);
                if (parsed.jurusan) setJurusan.add(parsed.jurusan);
            });
        }

        // 2. Tarik juga siswa baru dari ppdb_siswa yang sudah Disetujui Admin
        const ppdbKls = await apiRequest('GET', 'ppdb_siswa?select=*&status_pendaftaran=eq.Disetujui&order=nama_lengkap.asc');
        if (Array.isArray(ppdbKls)) {
            daftarSiswaPPDB = ppdbKls;
            ppdbKls.forEach(p => {
                const parsed = parseKelasDanJurusan(p.kelas_tujuan);
                if (parsed.kelasLengkap) setKelas.add(parsed.kelasLengkap);
                if (p.jurusan && p.jurusan.trim() !== '') setJurusan.add(p.jurusan.trim().toUpperCase());
                else if (parsed.jurusan) setJurusan.add(parsed.jurusan);
            });
        }
    } catch (e) {
        console.error("Gagal memuat kelas & jurusan dari users:", e);
    }

    daftarKelasDB = Array.from(setKelas).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
    daftarJurusanDB = Array.from(setJurusan).sort((a, b) => a.localeCompare(b, 'id'));

    // 1. Render Dropdown Global Filter Kelas
    const selGlobalKls = document.getElementById("globalFilterKelas");
    if (selGlobalKls) {
        const valLama = selGlobalKls.value;
        selGlobalKls.innerHTML = `<option value="">Semua Kelas</option>` +
            daftarKelasDB.map(k => `<option value="${k}">${k}</option>`).join('');
        selGlobalKls.value = valLama;
    }

    // 2. Render Dropdown Global Filter Jurusan (Murni dari Database Users!)
    const selGlobalJur = document.getElementById("globalFilterJurusan");
    if (selGlobalJur) {
        const valLama = selGlobalJur.value;
        selGlobalJur.innerHTML = `<option value="">Semua Jurusan</option>` +
            daftarJurusanDB.map(j => `<option value="${j}">Jurusan ${j}</option>`).join('');
        selGlobalJur.value = valLama;
    }

    // 3. Render Dropdown Filter Kelas di Kasir POS, Tagihan, Tunggakan & Modal Input Tagihan
    const opsiSemuaKelasHtml = `<option value="">Semua Kelas</option>` +
        daftarKelasDB.map(k => `<option value="${k}">${k}</option>`).join('');

    ["filterKelasPOS", "filterKelasTagihan", "filterKelasTunggakan"].forEach(idSelect => {
        const el = document.getElementById(idSelect);
        if (el) {
            const valLama = el.value;
            el.innerHTML = opsiSemuaKelasHtml;
            el.value = valLama;
        }
    });

    const selPiutangKls = document.getElementById("piutangKelas");
    if (selPiutangKls) {
        selPiutangKls.innerHTML = daftarKelasDB.map(k => `<option value="${k}">${k}</option>`).join('');
    }

    // 4. Render Checkbox Target Kelas di Form Item Pembayaran
    const wadahCbKelas = document.getElementById("wadahCheckboxKelasDinamis");
    if (wadahCbKelas) {
        let htmlKls = `
            <div class="form-check">
                <input class="form-check-input cb-target-kelas" type="checkbox" value="Semua" id="cbKlsSemua" checked onchange="saatKlikCbTarget(this, '.cb-target-kelas')">
                <label class="form-check-label fw-bold text-success" for="cbKlsSemua">Semua Kelas</label>
            </div>`;
        daftarKelasDB.forEach((k, idx) => {
            htmlKls += `
            <div class="form-check">
                <input class="form-check-input cb-target-kelas" type="checkbox" value="${k}" id="cbKls_${idx}" onchange="saatKlikCbTarget(this, '.cb-target-kelas')">
                <label class="form-check-label" for="cbKls_${idx}">${k}</label>
            </div>`;
        });
        wadahCbKelas.innerHTML = htmlKls;
    }

    // 5. Render Checkbox Target Jurusan di Form Item Pembayaran (Murni dari Database Users!)
    const wadahCbJurusan = document.getElementById("wadahCheckboxJurusanDinamis");
    if (wadahCbJurusan) {
        let htmlJur = `
            <div class="form-check">
                <input class="form-check-input cb-target-jurusan" type="checkbox" value="Semua" id="cbJurSemua" checked onchange="saatKlikCbTarget(this, '.cb-target-jurusan')">
                <label class="form-check-label fw-bold text-success" for="cbJurSemua">Semua Jurusan</label>
            </div>`;
        daftarJurusanDB.forEach((j, idx) => {
            htmlJur += `
            <div class="form-check">
                <input class="form-check-input cb-target-jurusan" type="checkbox" value="${j}" id="cbJur_${idx}" onchange="saatKlikCbTarget(this, '.cb-target-jurusan')">
                <label class="form-check-label" for="cbJur_${idx}">${j}</label>
            </div>`;
        });
        wadahCbJurusan.innerHTML = htmlJur;
    }
}

window.saatKlikCbTarget = function(cbClicked, selector) {
    const allCbs = Array.from(document.querySelectorAll(selector));
    const cbSemua = allCbs.find(c => c.value === 'Semua');

    if (cbClicked.value === 'Semua') {
        if (cbClicked.checked) {
            allCbs.forEach(c => { if (c.value !== 'Semua') c.checked = false; });
        }
    } else {
        if (cbClicked.checked && cbSemua) {
            cbSemua.checked = false;
        }
        // Jika tidak ada satu pun yang dicentang, otomatis centang 'Semua'
        const adaCentang = allCbs.some(c => c.checked);
        if (!adaCentang && cbSemua) cbSemua.checked = true;
    }
    hitungPreviewTargetSiswa();
};

// =========================================================================
// 3. FUNGSI PENCOCOKAN AKURAT SISWA DENGAN TARGET KELAS & JURUSAN ITEM
// =========================================================================
function apakahSiswaCocokDenganTarget(targetKelasStr, targetJurusanStr, kelasSiswaRaw) {
    const parsed = parseKelasDanJurusan(kelasSiswaRaw);
    if (!parsed.kelasLengkap) return false;

    const klsUpper = parsed.kelasLengkap.toUpperCase();
    const tingkatUpper = parsed.tingkat.toUpperCase();
    const jurusanUpper = parsed.jurusan.toUpperCase();

    const arrTargetKls = (targetKelasStr || 'Semua').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const arrTargetJur = (targetJurusanStr || 'Semua').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    // Cek kecocokan kelas (Cocok jika pilih 'SEMUA', atau cocok nama kelas persis misal 'X AK', atau cocok tingkat 'X')
    const kelasCocok = arrTargetKls.includes('SEMUA') || arrTargetKls.includes(klsUpper) || arrTargetKls.includes(tingkatUpper);

    // Cek kecocokan jurusan (Cocok jika pilih 'SEMUA', atau jurusan siswa misal 'AK' ada di daftar target jurusan)
    const jurusanCocok = arrTargetJur.includes('SEMUA') || arrTargetJur.includes(jurusanUpper);

    return kelasCocok && jurusanCocok;
}

window.hitungPreviewTargetSiswa = function() {
    const klsNodes = Array.from(document.querySelectorAll('.cb-target-kelas:checked')).map(c => c.value);
    const jurNodes = Array.from(document.querySelectorAll('.cb-target-jurusan:checked')).map(c => c.value);
    const isWajib = document.getElementById("itemWajib")?.value === 'true';

    const targetKlsStr = klsNodes.length > 0 ? klsNodes.join(', ') : 'Semua';
    const targetJurStr = jurNodes.length > 0 ? jurNodes.join(', ') : 'Semua';

    const semuaSiswa = gabungkanSemuaSiswaSekolah();
    const cocok = semuaSiswa.filter(s => apakahSiswaCocokDenganTarget(targetKlsStr, targetJurStr, s.kelas));

    const elTeks = document.getElementById("teksPreviewTargetSiswa");
    const elBdg = document.getElementById("badgePreviewKelasTarget");
    if (elTeks && elBdg) {
        if (!isWajib) {
            elTeks.innerHTML = `Item Opsional: <b>Tidak ditagihkan otomatis</b> (${cocok.length} siswa cocok)`;
            elBdg.innerText = "Opsional";
        } else {
            elTeks.innerHTML = `Otomatis diterapkan ke: <b>${cocok.length} Siswa</b>`;
            elBdg.innerText = `${targetKlsStr} | Jurusan: ${targetJurStr}`;
        }
    }
};

// =========================================================================
// 4. KATEGORI PEMBAYARAN & FILTER OTOMATIS NAMA ITEM
// =========================================================================
function renderPillKategoriDinamis() {
    const wadah = document.getElementById("wadahPillKategori");
    if (!wadah) return;

    const listKat = Array.isArray(paymentSettings.custom_categories) && paymentSettings.custom_categories.length > 0
        ? paymentSettings.custom_categories
        : ["PPDB", "Uang Pangkal", "SPP", "Ujian", "Praktikum", "Kegiatan", "Seragam"];

    if (!listKat.includes(kategoriAktifForm)) kategoriAktifForm = listKat[0];
    document.getElementById("itemKategori").value = kategoriAktifForm;

    wadah.innerHTML = listKat.map(kat => `
        <span class="pill-kategori ${kat === kategoriAktifForm ? 'active' : ''}" onclick="pilihPillKategori('${kat.replace(/'/g, "\\'")}')">
            ${kat}
        </span>
    `).join('');

    // Isi juga dropdown kategori di Modal Input Tagihan / Piutang
    const selPiutangKat = document.getElementById("piutangKategori");
    if (selPiutangKat) {
        selPiutangKat.innerHTML = `<option value="SEMUA">-- Semua Kategori --</option>` +
            listKat.map(k => `<option value="${k}">${k}</option>`).join('');
    }

    perbaruiSaranNamaItem(kategoriAktifForm);
}

window.pilihPillKategori = function(kat) {
    kategoriAktifForm = kat;
    document.getElementById("itemKategori").value = kat;
    filterKategoriTabelItem = kat; // Filter tabel kanan sesuai kategori yang diklik
    renderPillKategoriDinamis();
    renderMasterItems();

    // Jika sedang tidak mode edit, bantu isi awalan nama item atau tampilkan saran item di kategori tersebut
    const editId = document.getElementById("itemEditId").value;
    const inpNama = document.getElementById("itemNama");
    if (!editId && inpNama) {
        const itemDiKategoriIni = masterItems.filter(i => i.kategori === kat);
        if (itemDiKategoriIni.length === 1 && !inpNama.value.trim()) {
            inpNama.value = itemDiKategoriIni[0].nama_item;
        } else {
            inpNama.placeholder = `Ketik nama item ${kat} (Contoh: ${kat} 2026/2027)...`;
        }
    }
};

window.tampilkanSemuaKategoriTabel = function() {
    filterKategoriTabelItem = "";
    renderMasterItems();
};

function perbaruiSaranNamaItem(kat) {
    const dl = document.getElementById("datalistItemSaran");
    if (!dl) return;
    const cocok = masterItems.filter(i => !kat || i.kategori === kat);
    dl.innerHTML = cocok.map(i => `<option value="${i.nama_item}">${formatRupiah(i.nominal)} (${i.target_kelas})</option>`).join('');
}

window.tambahKategoriBaru = async function() {
    const baru = await uiPrompt("Tambah Kategori Baru", "Masukkan nama kategori pembayaran baru (contoh: PKL, Kunjungan Industri, Ekstrakurikuler):", "Nama Kategori...");
    if (!baru) return;

    let listKat = Array.isArray(paymentSettings.custom_categories)
        ? [...paymentSettings.custom_categories]
        : ["PPDB", "Uang Pangkal", "SPP", "Ujian", "Praktikum", "Kegiatan", "Seragam"];

    if (!listKat.includes(baru)) {
        showLoadingUI(true, "Menyimpan Kategori...", "Menambahkan kategori baru ke sistem...");
        try {
            listKat.push(baru);
            paymentSettings.custom_categories = listKat;
            await apiRequest('PATCH', 'payment_settings?id=eq.1', { custom_categories: listKat });
            showToast(`Kategori "${baru}" berhasil ditambahkan!`);
        } finally {
            showLoadingUI(false);
        }
    }
    pilihPillKategori(baru);
};

// =========================================================================
// 5. SIMPAN / EDIT ITEM PEMBAYARAN & OTOMATIS TERAPKAN KE SISWA TARGET
// =========================================================================
window.resetFormMasterItem = function() {
    document.getElementById("formMasterItem").reset();
    document.getElementById("itemEditId").value = "";
    document.getElementById("judulFormItem").innerHTML = '<i class="fa-solid fa-plus-circle text-success me-2"></i>Buat Item Pembayaran';
    document.getElementById("btnSubmitMasterItem").innerHTML = '<i class="fa-solid fa-floppy-disk me-1"></i> Simpan & Terapkan';
    document.getElementById("btnSubmitMasterItem").className = 'btn btn-success w-50 fw-bold shadow-sm';
    document.getElementById("cardFormMasterItem").classList.remove("form-edit-highlight");

    document.querySelectorAll('.cb-target-kelas').forEach(cb => cb.checked = (cb.value === 'Semua'));
    document.querySelectorAll('.cb-target-jurusan').forEach(cb => cb.checked = (cb.value === 'Semua'));
    hitungPreviewTargetSiswa();
};

window.simpanMasterItem = async function(e) {
    e.preventDefault();
    const editId = document.getElementById("itemEditId").value.trim();
    const btnSubmit = document.getElementById("btnSubmitMasterItem");

    const klsNodes = Array.from(document.querySelectorAll('.cb-target-kelas:checked')).map(c => c.value);
    const jurNodes = Array.from(document.querySelectorAll('.cb-target-jurusan:checked')).map(c => c.value);

    const payload = {
        nama_item: document.getElementById("itemNama").value.trim(),
        kategori: document.getElementById("itemKategori").value.trim(),
        nominal: Number(document.getElementById("itemNominal").value),
        jenis_pembayaran: document.getElementById("itemJenis").value,
        tahun_ajaran: document.getElementById("itemTahunAjaran").value.trim(),
        target_kelas: klsNodes.length > 0 ? klsNodes.join(', ') : 'Semua',
        target_jurusan: jurNodes.length > 0 ? jurNodes.join(', ') : 'Semua',
        tgl_mulai: document.getElementById("itemTglMulai").value || null,
        tgl_jatuh_tempo: document.getElementById("itemTglTempo").value || null,
        keterangan: document.getElementById("itemKeterangan").value.trim(),
        is_wajib: document.getElementById("itemWajib").value === 'true',
        status_aktif: true,
        created_by: currentBendahara ? currentBendahara.username : 'bendahara'
    };

    setTombolLoading(btnSubmit, true, "Menyimpan...");
    showLoadingUI(true, "Menyimpan Item Pembayaran...", `Menyimpan "${payload.nama_item}" dan menyinkronkan tagihan ke kelas target...`);

    try {
        let savedItem = null;

        if (editId) {
            const lama = masterItems.find(x => String(x.id) === String(editId));
            const resUpd = await apiRequest('PATCH', `payment_items?id=eq.${editId}`, payload);
            savedItem = Array.isArray(resUpd) ? resUpd[0] : payload;
            savedItem.id = editId;

            // Update nama, kategori, dan jatuh tempo pada tagihan siswa yang sudah ada untuk item ini
            await apiRequest('PATCH', `invoice_details?item_id=eq.${editId}`, {
                nama_item: payload.nama_item,
                kategori: payload.kategori,
                tgl_jatuh_tempo: payload.tgl_jatuh_tempo
            });

            // Update nominal pada tagihan yang belum dibayar sama sekali (jumlah_dibayar = 0)
            const detailsBelumBayar = await apiRequest('GET', `invoice_details?item_id=eq.${editId}&jumlah_dibayar=eq.0`);
            for (const det of (detailsBelumBayar || [])) {
                await apiRequest('PATCH', `invoice_details?id=eq.${det.id}`, {
                    nominal_tagihan: payload.nominal,
                    sisa_item: payload.nominal
                });
            }

            await catatAudit('UBAH_ITEM_PEMBAYARAN', 'payment_items', editId, lama, payload);
        } else {
            const resBaru = await apiRequest('POST', 'payment_items', [payload]);
            savedItem = Array.isArray(resBaru) ? resBaru[0] : resBaru;
            await catatAudit('BUAT_ITEM_PEMBAYARAN', 'payment_items', savedItem?.id, null, payload);
        }

        // OTOMATIS DISTRIBUSIKAN ITEM INI HANYA KE SISWA YANG COCOK DENGAN TARGET KELAS & JURUSAN
        let jumlahDiterapkan = 0;
        let jumlahDibersihkan = 0;
        if (savedItem && savedItem.id) {
            const hasilDistribusi = await distribusikanItemKeSiswaTarget(savedItem);
            jumlahDiterapkan = hasilDistribusi.diterapkan;
            jumlahDibersihkan = hasilDistribusi.dibersihkan;
        }

        resetFormMasterItem();
        await refreshSemuaData();
        showLoadingUI(false);

        await uiAlert(
            "Berhasil Disimpan!",
            `Item "${payload.nama_item}" (${formatRupiah(payload.nominal)}) telah disimpan.\n` +
            `• Target Kelas: ${payload.target_kelas}\n` +
            `• Target Jurusan: ${payload.target_jurusan}\n` +
            `• Otomatis diterapkan ke ${jumlahDiterapkan} siswa yang sesuai.` +
            (jumlahDibersihkan > 0 ? `\n• Dihapus otomatis dari ${jumlahDibersihkan} siswa di luar target kelas.` : ''),
            "success"
        );
    } catch (err) {
        showLoadingUI(false);
        await uiAlert("Gagal Menyimpan", err.message, "error");
    } finally {
        setTombolLoading(btnSubmit, false);
    }
};

/**
 * Mendistribusikan 1 Item Pembayaran secara akurat ke siswa yang cocok dengan Target Kelas & Jurusan,
 * sekaligus menghapus tagihan belum dibayar pada siswa yang TIDAK cocok jika sebelumnya salah masuk.
 */
async function distribusikanItemKeSiswaTarget(itemObj) {
    let diterapkan = 0;
    let dibersihkan = 0;

    // Pastikan semua siswa di database sudah memiliki header invoice
    await sinkronisasiTagihanKeSiswaTarget(true);

    const semuaInv = await apiRequest('GET', `student_invoices?select=*&tahun_ajaran=eq.${encodeURIComponent(itemObj.tahun_ajaran)}`);
    const existingDetails = await apiRequest('GET', `invoice_details?select=*&item_id=eq.${itemObj.id}`);
    const mapDetByInv = new Map();
    (existingDetails || []).forEach(d => mapDetByInv.set(d.invoice_id, d));

    for (const inv of (semuaInv || [])) {
        if (inv.status_tagihan === 'Dibatalkan') continue;

        const cocok = apakahSiswaCocokDenganTarget(itemObj.target_kelas, itemObj.target_jurusan, inv.kelas);
        const detAda = mapDetByInv.get(inv.id);

        if (cocok && itemObj.is_wajib && itemObj.status_aktif) {
            if (!detAda) {
                try {
                    await apiRequest('POST', 'invoice_details', [{
                        invoice_id: inv.id,
                        item_id: itemObj.id,
                        nama_item: itemObj.nama_item,
                        kategori: itemObj.kategori,
                        nominal_tagihan: Number(itemObj.nominal),
                        jumlah_dibayar: 0,
                        sisa_item: Number(itemObj.nominal),
                        tgl_jatuh_tempo: itemObj.tgl_jatuh_tempo || null,
                        status_item: 'Belum Bayar'
                    }]);
                    await rekalkulasiHeaderInvoice(inv.id);
                    diterapkan++;
                } catch (e) { console.warn(e); }
            } else {
                await rekalkulasiHeaderInvoice(inv.id);
                diterapkan++;
            }
        } else if (!cocok && detAda && Number(detAda.jumlah_dibayar) === 0) {
            // Jika siswa ini TIDAK cocok dengan target kelas/jurusan item, dan belum membayar, hapus rincian yang salah sasaran!
            try {
                await apiRequest('DELETE', `invoice_details?id=eq.${detAda.id}`);
                await rekalkulasiHeaderInvoice(inv.id);
                dibersihkan++;
            } catch (e) { console.warn(e); }
        }
    }

    return { diterapkan, dibersihkan };
}

function renderMasterItems() {
    const tb = document.getElementById("tbMasterItems");
    if (!tb) return;

    const btnResetFilter = document.getElementById("btnResetFilterTabelItem");
    const subJudul = document.getElementById("subJudulFilterItem");

    let listTampil = masterItems;
    if (filterKategoriTabelItem) {
        listTampil = masterItems.filter(i => i.kategori === filterKategoriTabelItem);
        if (btnResetFilter) btnResetFilter.classList.remove("d-none");
        if (subJudul) subJudul.innerHTML = `Menampilkan item pada kategori: <b class="text-success">${filterKategoriTabelItem}</b> (${listTampil.length} item)`;
    } else {
        if (btnResetFilter) btnResetFilter.classList.add("d-none");
        if (subJudul) subJudul.innerText = `Menampilkan seluruh kategori item pembayaran (${masterItems.length} item)`;
    }

    if (listTampil.length === 0) {
        tb.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Belum ada item pembayaran ${filterKategoriTabelItem ? 'pada kategori <b>' + filterKategoriTabelItem + '</b>' : ''}. Silakan buat di formulir sebelah kiri.</td></tr>`;
        return;
    }

    tb.innerHTML = listTampil.map(it => {
        const bdgAktif = it.status_aktif
            ? '<span class="badge bg-success">Aktif</span>'
            : '<span class="badge bg-secondary">Nonaktif</span>';

        return `<tr>
            <td>
                <b class="text-dark">${it.nama_item}</b><br>
                <span class="badge bg-success bg-opacity-10 text-success border border-success">${it.kategori}</span>
                <small class="text-muted">${it.jenis_pembayaran}</small>
            </td>
            <td class="fw-bold text-success">${formatRupiah(it.nominal)}</td>
            <td>
                <span class="badge bg-light text-dark border mb-1">Kelas: ${it.target_kelas}</span><br>
                <span class="badge bg-light text-dark border">Jurusan: ${it.target_jurusan}</span>
            </td>
            <td>${it.tgl_jatuh_tempo ? `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger">${it.tgl_jatuh_tempo}</span>` : '-'}</td>
            <td>${bdgAktif}</td>
            <td class="text-center">
                <button type="button" class="btn btn-sm btn-warning fw-bold me-1" onclick="editMasterItem('${it.id}')" title="Edit Item">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary me-1" onclick="toggleAktifItem('${it.id}', ${!it.status_aktif})" title="Aktif/Nonaktif">
                    <i class="fa-solid fa-power-off"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="hapusMasterItem('${it.id}')" title="Hapus Item">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

window.editMasterItem = function(id) {
    const it = masterItems.find(x => String(x.id) === String(id));
    if (!it) return;

    document.getElementById("itemEditId").value = it.id;
    document.getElementById("judulFormItem").innerHTML = `<i class="fa-solid fa-pen-to-square text-warning me-2"></i>Edit Item: ${it.nama_item}`;
    
    if (it.kategori && !paymentSettings.custom_categories.includes(it.kategori)) {
        paymentSettings.custom_categories.push(it.kategori);
    }
    kategoriAktifForm = it.kategori || "PPDB";
    document.getElementById("itemKategori").value = kategoriAktifForm;
    renderPillKategoriDinamis();

    document.getElementById("itemNama").value = it.nama_item || "";
    document.getElementById("itemNominal").value = it.nominal || 0;
    document.getElementById("itemJenis").value = it.jenis_pembayaran || "Sekali Bayar";
    document.getElementById("itemTahunAjaran").value = it.tahun_ajaran || "2026/2027";
    document.getElementById("itemWajib").value = String(it.is_wajib !== false);
    document.getElementById("itemTglMulai").value = it.tgl_mulai || "";
    document.getElementById("itemTglTempo").value = it.tgl_jatuh_tempo || "";
    document.getElementById("itemKeterangan").value = it.keterangan || "";

    const targetKlsArr = (it.target_kelas || 'Semua').split(',').map(s => s.trim());
    document.querySelectorAll('.cb-target-kelas').forEach(cb => {
        cb.checked = targetKlsArr.includes(cb.value);
    });

    const targetJurArr = (it.target_jurusan || 'Semua').split(',').map(s => s.trim());
    document.querySelectorAll('.cb-target-jurusan').forEach(cb => {
        cb.checked = targetJurArr.includes(cb.value);
    });

    hitungPreviewTargetSiswa();

    const btn = document.getElementById("btnSubmitMasterItem");
    btn.innerHTML = '<i class="fa-solid fa-check-double me-1"></i> Simpan Perubahan';
    btn.className = 'btn btn-warning text-dark w-50 fw-bold shadow-sm';

    const card = document.getElementById("cardFormMasterItem");
    card.classList.add("form-edit-highlight");
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast(`Mode Edit aktif untuk "${it.nama_item}"`, 'warning');
};

window.toggleAktifItem = async function(id, statusBaru) {
    showLoadingUI(true, "Memperbarui Status Item...");
    try {
        await apiRequest('PATCH', `payment_items?id=eq.${id}`, { status_aktif: statusBaru });
        await refreshSemuaData();
        showToast(`Status item diubah menjadi ${statusBaru ? 'Aktif' : 'Nonaktif'}.`);
    } catch (e) {
        await uiAlert("Gagal", e.message, "error");
    } finally {
        showLoadingUI(false);
    }
};

window.hapusMasterItem = async function(id) {
    const it = masterItems.find(x => String(x.id) === String(id));
    if (!it) return;

    const yakin = await uiConfirm(
        "Hapus Item Pembayaran",
        `Apakah Anda yakin ingin menghapus item "${it.nama_item}"? Tagihan siswa yang belum dibayar pada item ini juga akan ikut dibersihkan.`,
        "Ya, Hapus",
        "btn-danger"
    );
    if (!yakin) return;

    showLoadingUI(true, "Menghapus Item...", `Menghapus "${it.nama_item}" dari sistem...`);
    try {
        // Hapus rincian tagihan yang belum dibayar untuk item ini agar total tagihan siswa ikut bersih
        const detBelum = await apiRequest('GET', `invoice_details?item_id=eq.${id}&jumlah_dibayar=eq.0`);
        await apiRequest('DELETE', `invoice_details?item_id=eq.${id}&jumlah_dibayar=eq.0`);
        await apiRequest('DELETE', `payment_items?id=eq.${id}`);

        for (const d of (detBelum || [])) {
            await rekalkulasiHeaderInvoice(d.invoice_id);
        }

        await catatAudit('HAPUS_ITEM_PEMBAYARAN', 'payment_items', id, it, null);
        if (document.getElementById("itemEditId").value === id) resetFormMasterItem();
        await refreshSemuaData();
        showLoadingUI(false);
        showToast(`Item "${it.nama_item}" berhasil dihapus!`);
    } catch (e) {
        showLoadingUI(false);
        await uiAlert("Gagal Menghapus", e.message, "error");
    }
};

// =========================================================================
// 6. ALGORITMA QRIS DINAMIS (CRC16 CCITT)
// =========================================================================
function crc16ccitt(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generateDynamicQris(staticQris, amount) {
    if (!staticQris) return "";
    let cleanQris = staticQris.trim();
    let basePayload = cleanQris.slice(0, -4);
    basePayload = basePayload.replace('010211', '010212');
    basePayload = basePayload.replace(/54\d{2}\d+(?=5802ID)/, '');
    
    const amountStr = Math.round(Number(amount)).toString();
    const tag54 = '54' + amountStr.length.toString().padStart(2, '0') + amountStr;
    
    const splitIndex = basePayload.indexOf('5802ID');
    if (splitIndex === -1) return cleanQris;

    const newPayload = basePayload.slice(0, splitIndex) + tag54 + basePayload.slice(splitIndex);
    return newPayload + crc16ccitt(newPayload);
}

function renderQrisDinamisPOS(nominal) {
    const wadah = document.getElementById("wadahQrisDinamis");
    document.getElementById("qrisTampilHarga").innerText = formatRupiah(nominal);
    wadah.innerHTML = "";

    if (!nominal || nominal <= 0) {
        wadah.innerHTML = '<span class="text-muted small">Pilih item tagihan terlebih dahulu</span>';
        return;
    }

    const dynamicStr = generateDynamicQris(paymentSettings.static_qris, nominal);
    try {
        new QRCode(wadah, {
            text: dynamicStr,
            width: 220,
            height: 220,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.L
        });
    } catch (err) {
        wadah.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(dynamicStr)}" width="220" height="220" alt="QRIS">`;
    }
}

// =========================================================================
// 7. SINKRONISASI DATA TAGIHAN DENGAN TARGET KELAS & JURUSAN
// =========================================================================
function formatRupiah(angka) {
    return "Rp " + Number(angka || 0).toLocaleString('id-ID');
}

async function catatAudit(aksi, entitas, entitasId, sebelum, sesudah) {
    try {
        await apiRequest('POST', 'financial_audit_logs', [{
            aksi,
            entitas,
            entitas_id: String(entitasId || '-'),
            nilai_sebelum: sebelum || {},
            nilai_sesudah: sesudah || {},
            dilakukan_oleh: currentBendahara ? (currentBendahara.nama_lengkap || currentBendahara.username) : 'Bendahara'
        }]);
    } catch (e) { console.error("Audit log error:", e); }
}

window.refreshSemuaData = async function() {
    const thn = document.getElementById("globalFilterTahun").value;
    const fKls = document.getElementById("globalFilterKelas").value;
    const fJur = document.getElementById("globalFilterJurusan").value;

    try {
        const items = await apiRequest('GET', 'payment_items?select=*&order=created_at.desc');
        masterItems = items || [];
        renderMasterItems();
        perbaruiSaranNamaItem(kategoriAktifForm);

        await sinkronisasiTagihanKeSiswaTarget(true);

        const invs = await apiRequest('GET', 'student_invoices?select=*&order=created_at.desc');
        allInvoices = (invs || []).filter(i => {
            const parsed = parseKelasDanJurusan(i.kelas);
            const jurSiswa = parsed.jurusan || (i.jurusan || '').toUpperCase();
            const cocokThn = !thn || !i.tahun_ajaran || i.tahun_ajaran === thn;
            const cocokKls = !fKls || (parsed.kelasLengkap.toUpperCase() === fKls.toUpperCase());
            const cocokJur = !fJur || (jurSiswa === fJur.toUpperCase());
            return cocokThn && cocokKls && cocokJur;
        });

        const details = await apiRequest('GET', 'invoice_details?select=*&order=created_at.asc');
        allInvoiceDetails = details || [];

        const trxs = await apiRequest('GET', 'payment_transactions?select=*&order=tanggal_transaksi.desc');
        allTransactions = (trxs || []).filter(t => {
            const parsed = parseKelasDanJurusan(t.kelas);
            const jurSiswa = parsed.jurusan || (t.jurusan || '').toUpperCase();
            const cocokKls = !fKls || (parsed.kelasLengkap.toUpperCase() === fKls.toUpperCase());
            const cocokJur = !fJur || (jurSiswa === fJur.toUpperCase());
            return cocokKls && cocokJur;
        });

        const pendingCount = allTransactions.filter(t => t.status_transaksi === 'Pending').length;
        const bdg = document.getElementById("badgePendingQris");
        if (bdg) {
            bdg.innerText = pendingCount;
            bdg.classList.toggle('d-none', pendingCount === 0);
        }

        renderDashboardAnalitik();
        renderTabelTagihanSiswa();
        renderTabelRiwayat();
        renderTabelTunggakan();
        isiDropdownSiswaPOS();
        hitungPreviewTargetSiswa();
    } catch (err) {
        console.error("Refresh data error:", err);
    }
};

window.sinkronisasiTagihanKeSiswaTarget = async function(silent = false) {
    if (isSyncingInvoices) return;
    isSyncingInvoices = true;

    if (!silent) showLoadingUI(true, "Menyinkronkan Data Siswa...", "Mencocokkan kelas dan jurusan siswa dengan item pembayaran...");

    try {
        const thnAktif = document.getElementById("globalFilterTahun")?.value || '2026/2027';

        const existingInvs = await apiRequest('GET', 'student_invoices?select=id,no_invoice,ppdb_id,username_siswa,kelas');
        const setExistUsername = new Set();
        const setExistPpdb = new Set();
        const setExistNoInv = new Set();

        (existingInvs || []).forEach(e => {
            if (e.username_siswa) setExistUsername.add(String(e.username_siswa).trim().toLowerCase());
            if (e.ppdb_id) setExistPpdb.add(String(e.ppdb_id));
            if (e.no_invoice) setExistNoInv.add(String(e.no_invoice).trim().toUpperCase());
        });

        let baruCount = 0;

        // 1. Siswa dari ppdb_siswa yang sudah Disetujui
        const ppdbApproved = await apiRequest('GET', 'ppdb_siswa?select=*&status_pendaftaran=eq.Disetujui');
        for (const s of (ppdbApproved || [])) {
            const identitasLogin = String(s.nik || s.nisn || s.no_pendaftaran).trim();
            if (setExistPpdb.has(String(s.id)) || setExistUsername.has(identitasLogin.toLowerCase())) continue;

            const kelas = s.kelas_tujuan || `X ${s.jurusan || 'TKJ'} 1`;
            const parsed = parseKelasDanJurusan(kelas);
            const jurusan = s.jurusan || parsed.jurusan || 'TKJ';
            const thn = s.tahun_ajaran || thnAktif;

            const itemCocok = masterItems.filter(it => it.status_aktif && it.is_wajib && it.tahun_ajaran === thn && apakahSiswaCocokDenganTarget(it.target_kelas, it.target_jurusan, kelas));
            const totalAwal = itemCocok.reduce((sum, it) => sum + Number(it.nominal || 0), 0);
            const tempoTerdekat = itemCocok.filter(i => i.tgl_jatuh_tempo).map(i => i.tgl_jatuh_tempo).sort()[0] || null;

            let noInv = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
            while (setExistNoInv.has(noInv.toUpperCase())) {
                noInv = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
            }

            try {
                const resInv = await apiRequest('POST', 'student_invoices', [{
                    no_invoice: noInv,
                    ppdb_id: s.id,
                    username_siswa: identitasLogin,
                    nisn: s.nisn || identitasLogin,
                    nik: s.nik || identitasLogin,
                    no_pendaftaran: s.no_pendaftaran,
                    nama_siswa: s.nama_lengkap,
                    kelas: kelas,
                    jurusan: jurusan,
                    tahun_ajaran: thn,
                    no_hp: s.no_hp || '',
                    nama_wali: s.nama_ayah || s.nama_ibu || '-',
                    total_tagihan: totalAwal,
                    total_dibayar: 0,
                    sisa_tagihan: totalAwal,
                    tgl_jatuh_tempo: tempoTerdekat,
                    status_tagihan: 'Belum Bayar'
                }]);

                const newInv = Array.isArray(resInv) ? resInv[0] : resInv;
                if (newInv && newInv.id) {
                    setExistUsername.add(identitasLogin.toLowerCase());
                    setExistPpdb.add(String(s.id));
                    setExistNoInv.add(noInv.toUpperCase());

                    if (itemCocok.length > 0) {
                        const rincian = itemCocok.map(it => ({
                            invoice_id: newInv.id,
                            item_id: it.id,
                            nama_item: it.nama_item,
                            kategori: it.kategori,
                            nominal_tagihan: Number(it.nominal),
                            jumlah_dibayar: 0,
                            sisa_item: Number(it.nominal),
                            tgl_jatuh_tempo: it.tgl_jatuh_tempo || null,
                            status_item: 'Belum Bayar'
                        }));
                        await apiRequest('POST', 'invoice_details', rincian);
                    }
                    baruCount++;
                }
            } catch (errInsert) { console.warn(errInsert.message); }
        }

        // 2. Siswa aktif dari tabel public.users (role = siswa)
        const siswaAktifDB = await apiRequest('GET', 'users?select=username,nama_lengkap,kelas,no_hp,nama_ayah,nama_ibu&role=eq.siswa');
        for (const u of (siswaAktifDB || [])) {
            const uname = String(u.username || '').trim();
            if (!uname || setExistUsername.has(uname.toLowerCase())) continue;

            const parsed = parseKelasDanJurusan(u.kelas);
            if (!parsed.kelasLengkap) continue;

            const kelas = parsed.kelasLengkap;
            const jurusan = parsed.jurusan;

            const itemCocok = masterItems.filter(it => it.status_aktif && it.is_wajib && it.tahun_ajaran === thnAktif && apakahSiswaCocokDenganTarget(it.target_kelas, it.target_jurusan, kelas));
            const totalAwal = itemCocok.reduce((sum, it) => sum + Number(it.nominal || 0), 0);
            const tempoTerdekat = itemCocok.filter(i => i.tgl_jatuh_tempo).map(i => i.tgl_jatuh_tempo).sort()[0] || null;

            let noInv = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
            while (setExistNoInv.has(noInv.toUpperCase())) {
                noInv = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
            }

            try {
                const resInv = await apiRequest('POST', 'student_invoices', [{
                    no_invoice: noInv,
                    username_siswa: uname,
                    nisn: uname,
                    nik: uname,
                    nama_siswa: u.nama_lengkap,
                    kelas: kelas,
                    jurusan: jurusan,
                    tahun_ajaran: thnAktif,
                    no_hp: u.no_hp || '',
                    nama_wali: u.nama_ayah || u.nama_ibu || '-',
                    total_tagihan: totalAwal,
                    total_dibayar: 0,
                    sisa_tagihan: totalAwal,
                    tgl_jatuh_tempo: tempoTerdekat,
                    status_tagihan: 'Belum Bayar'
                }]);

                const newInv = Array.isArray(resInv) ? resInv[0] : resInv;
                if (newInv && newInv.id) {
                    setExistUsername.add(uname.toLowerCase());
                    setExistNoInv.add(noInv.toUpperCase());

                    if (itemCocok.length > 0) {
                        const rincian = itemCocok.map(it => ({
                            invoice_id: newInv.id,
                            item_id: it.id,
                            nama_item: it.nama_item,
                            kategori: it.kategori,
                            nominal_tagihan: Number(it.nominal),
                            jumlah_dibayar: 0,
                            sisa_item: Number(it.nominal),
                            tgl_jatuh_tempo: it.tgl_jatuh_tempo || null,
                            status_item: 'Belum Bayar'
                        }));
                        await apiRequest('POST', 'invoice_details', rincian);
                    }
                    baruCount++;
                }
            } catch (errInsert) { console.warn(errInsert.message); }
        }

        if (!silent) {
            await muatKelasDanJurusanDariUsers();
            await refreshSemuaData();
            showLoadingUI(false);
            showToast(`Data siswa dan tagihan berhasil disinkronkan (${baruCount} data baru).`);
        }
    } catch (e) {
        if (!silent) showLoadingUI(false);
        console.error("Sinkronisasi error:", e);
    } finally {
        isSyncingInvoices = false;
    }
};

// =========================================================================
// 8. RENDER DASHBOARD ANALITIK & TABEL JATUH TEMPO
// =========================================================================
function dapatkanTanggalJatuhTempoItem(detailRow, invRow) {
    if (detailRow && detailRow.tgl_jatuh_tempo) return detailRow.tgl_jatuh_tempo;
    if (detailRow && detailRow.item_id) {
        const itMaster = masterItems.find(m => String(m.id) === String(detailRow.item_id));
        if (itMaster && itMaster.tgl_jatuh_tempo) return itMaster.tgl_jatuh_tempo;
    }
    if (invRow && invRow.tgl_jatuh_tempo) return invRow.tgl_jatuh_tempo;
    return null;
}

function renderDashboardAnalitik() {
    const aktifInvs = allInvoices.filter(i => i.status_tagihan !== 'Dibatalkan');
    const invDenganTagihan = aktifInvs.filter(i => Number(i.total_tagihan) > 0);
    const lunasCount = invDenganTagihan.filter(i => Number(i.sisa_tagihan) <= 0).length;
    const belumCount = invDenganTagihan.filter(i => Number(i.sisa_tagihan) > 0).length;
    const totalPiutang = aktifInvs.reduce((sum, i) => sum + Number(i.sisa_tagihan || 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = todayStr.slice(0, 7);

    const trxBerhasil = allTransactions.filter(t => t.status_transaksi === 'Berhasil');
    const masukHariIni = trxBerhasil
        .filter(t => t.tanggal_transaksi && t.tanggal_transaksi.startsWith(todayStr))
        .reduce((sum, t) => sum + Number(t.total_bayar || 0), 0);

    const masukBulanIni = trxBerhasil
        .filter(t => t.tanggal_transaksi && t.tanggal_transaksi.startsWith(currentMonth))
        .reduce((sum, t) => sum + Number(t.total_bayar || 0), 0);

    document.getElementById("statTotalSiswaTagihan").innerText = invDenganTagihan.length;
    document.getElementById("statSiswaLunas").innerText = lunasCount;
    document.getElementById("statSiswaBelum").innerText = belumCount;
    document.getElementById("statMasukHariIni").innerText = formatRupiah(masukHariIni);
    document.getElementById("statMasukBulanIni").innerText = formatRupiah(masukBulanIni);
    document.getElementById("statTotalPiutang").innerText = formatRupiah(totalPiutang);

    const tbTerbaru = document.getElementById("tbDashTransaksiTerbaru");
    if (allTransactions.length === 0) {
        tbTerbaru.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Belum ada transaksi tercatat.</td></tr>';
    } else {
        tbTerbaru.innerHTML = allTransactions.slice(0, 6).map(t => {
            const jam = new Date(t.tanggal_transaksi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const bdgMetode = t.metode_pembayaran === 'QRIS'
                ? '<span class="badge bg-primary bg-opacity-10 text-primary border border-primary"><i class="fa-solid fa-qrcode me-1"></i>QRIS</span>'
                : '<span class="badge bg-success bg-opacity-10 text-success border border-success"><i class="fa-solid fa-money-bill me-1"></i>Cash</span>';
            const bdgStat = t.status_transaksi === 'Berhasil'
                ? '<span class="badge bg-success">Berhasil</span>'
                : (t.status_transaksi === 'Pending' ? '<span class="badge bg-warning text-dark">Pending</span>' : '<span class="badge bg-danger">Batal</span>');

            return `<tr>
                <td class="text-muted fw-bold">${jam}</td>
                <td class="fw-bold text-dark">${t.nama_siswa}</td>
                <td>${t.kelas}</td>
                <td class="fw-bold text-success">${formatRupiah(t.total_bayar)}</td>
                <td>${bdgMetode}</td>
                <td>${bdgStat}</td>
            </tr>`;
        }).join('');
    }

    const tbTempo = document.getElementById("tbDashJatuhTempo");
    const mapInv = {};
    allInvoices.forEach(i => mapInv[i.id] = i);

    let listJatuhTempo = [];
    allInvoiceDetails.forEach(d => {
        const inv = mapInv[d.invoice_id];
        if (!inv || inv.status_tagihan === 'Dibatalkan' || Number(d.sisa_item) <= 0) return;

        const tglTempo = dapatkanTanggalJatuhTempoItem(d, inv);
        listJatuhTempo.push({
            inv,
            nama_item: d.nama_item,
            sisa_item: Number(d.sisa_item),
            tgl_jatuh_tempo: tglTempo
        });
    });

    listJatuhTempo.sort((a, b) => {
        if (a.tgl_jatuh_tempo && b.tgl_jatuh_tempo) return new Date(a.tgl_jatuh_tempo) - new Date(b.tgl_jatuh_tempo);
        if (a.tgl_jatuh_tempo) return -1;
        if (b.tgl_jatuh_tempo) return 1;
        return b.sisa_item - a.sisa_item;
    });

    if (listJatuhTempo.length === 0) {
        tbTempo.innerHTML = '<tr><td colspan="6" class="text-center py-3 text-muted">Tidak ada tagihan belum lunas saat ini.</td></tr>';
    } else {
        tbTempo.innerHTML = listJatuhTempo.slice(0, 8).map(row => {
            let badgeTempo = '<span class="badge bg-secondary">Tanpa Batas Tanggal</span>';
            if (row.tgl_jatuh_tempo) {
                const selisihHari = Math.ceil((new Date(row.tgl_jatuh_tempo) - new Date(todayStr)) / 86400000);
                if (selisihHari < 0) {
                    badgeTempo = `<span class="badge bg-danger">Lewat ${Math.abs(selisihHari)} Hari (${row.tgl_jatuh_tempo})</span>`;
                } else if (selisihHari === 0) {
                    badgeTempo = `<span class="badge bg-danger">Hari Ini (${row.tgl_jatuh_tempo})</span>`;
                } else if (selisihHari <= 7) {
                    badgeTempo = `<span class="badge bg-warning text-dark">${selisihHari} Hari Lagi (${row.tgl_jatuh_tempo})</span>`;
                } else {
                    badgeTempo = `<span class="badge bg-info text-dark">${row.tgl_jatuh_tempo}</span>`;
                }
            }

            return `<tr>
                <td class="fw-bold text-dark">${row.inv.nama_siswa}<br><small class="text-muted">ID: ${row.inv.username_siswa}</small></td>
                <td><span class="badge bg-light text-dark border">${row.inv.kelas}</span></td>
                <td class="fw-bold">${row.nama_item}</td>
                <td class="fw-bold text-danger">${formatRupiah(row.sisa_item)}</td>
                <td>${badgeTempo}</td>
                <td>
                    <button class="btn btn-sm btn-success fw-bold" onclick="bukaKasirUntukSiswa('${row.inv.id}')">
                        <i class="fa-solid fa-cash-register me-1"></i> Bayar
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    renderGrafikPemasukan();
}

window.renderGrafikPemasukan = function() {
    const periode = document.getElementById("filterGrafikPeriode").value;
    const trxSah = allTransactions.filter(t => t.status_transaksi === 'Berhasil');
    let labels = [];
    let values = [];

    if (periode === 'harian') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const iso = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
            const sum = trxSah.filter(t => t.tanggal_transaksi.startsWith(iso)).reduce((a, b) => a + Number(b.total_bayar), 0);
            values.push(sum);
        }
    } else if (periode === 'mingguan') {
        for (let w = 3; w >= 0; w--) {
            labels.push(`Minggu -${w}`);
            const now = new Date();
            const start = new Date(now.getTime() - ((w + 1) * 7 * 86400000));
            const end = new Date(now.getTime() - (w * 7 * 86400000));
            const sum = trxSah.filter(t => {
                const dt = new Date(t.tanggal_transaksi);
                return dt >= start && dt <= end;
            }).reduce((a, b) => a + Number(b.total_bayar), 0);
            values.push(sum);
        }
    } else if (periode === 'bulanan') {
        const namaBln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        const yr = new Date().getFullYear();
        namaBln.forEach((b, idx) => {
            labels.push(b);
            const prefix = `${yr}-${String(idx + 1).padStart(2, '0')}`;
            const sum = trxSah.filter(t => t.tanggal_transaksi.startsWith(prefix)).reduce((a, b) => a + Number(b.total_bayar), 0);
            values.push(sum);
        });
    } else {
        const years = ['2025', '2026', '2027'];
        years.forEach(y => {
            labels.push(y);
            const sum = trxSah.filter(t => t.tanggal_transaksi.startsWith(y)).reduce((a, b) => a + Number(b.total_bayar), 0);
            values.push(sum);
        });
    }

    const ctx = document.getElementById("chartPemasukanBendahara").getContext("2d");
    if (chartPemasukanInstance) chartPemasukanInstance.destroy();
    chartPemasukanInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Pemasukan (Rp)',
                data: values,
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.14)',
                fill: true,
                tension: 0.35,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
};

// =========================================================================
// 9. KASIR PEMBAYARAN POS
// =========================================================================
function gabungkanSemuaSiswaSekolah() {
    const mapGabung = new Map();

    allInvoices.forEach(inv => {
        if (inv.status_tagihan === 'Dibatalkan') return;
        const key = String(inv.username_siswa).trim().toLowerCase();
        const parsed = parseKelasDanJurusan(inv.kelas);
        mapGabung.set(key, {
            key,
            invoice_id: inv.id,
            username_siswa: inv.username_siswa,
            nisn: inv.nisn || inv.username_siswa,
            nama_siswa: inv.nama_siswa,
            kelas: parsed.kelasLengkap || inv.kelas,
            jurusan: parsed.jurusan || inv.jurusan,
            no_pendaftaran: inv.no_pendaftaran || '',
            sisa_tagihan: Number(inv.sisa_tagihan || 0)
        });
    });

    daftarSiswaUsers.forEach(u => {
        const key = String(u.username || '').trim().toLowerCase();
        if (!key || mapGabung.has(key)) return;
        const parsed = parseKelasDanJurusan(u.kelas);
        if (!parsed.kelasLengkap) return;
        mapGabung.set(key, {
            key,
            invoice_id: null,
            username_siswa: String(u.username).trim(),
            nisn: String(u.username).trim(),
            nama_siswa: u.nama_lengkap,
            kelas: parsed.kelasLengkap,
            jurusan: parsed.jurusan,
            no_pendaftaran: '',
            sisa_tagihan: 0
        });
    });

    daftarSiswaPPDB.forEach(p => {
        const idLogin = String(p.nik || p.nisn || p.no_pendaftaran).trim();
        const key = idLogin.toLowerCase();
        if (!key || mapGabung.has(key)) return;
        const kls = p.kelas_tujuan || `X ${p.jurusan || 'TKJ'} 1`;
        const parsed = parseKelasDanJurusan(kls);
        mapGabung.set(key, {
            key,
            invoice_id: null,
            ppdb_id: p.id,
            username_siswa: idLogin,
            nisn: p.nisn || idLogin,
            nama_siswa: p.nama_lengkap,
            kelas: parsed.kelasLengkap || kls,
            jurusan: p.jurusan || parsed.jurusan,
            no_pendaftaran: p.no_pendaftaran || '',
            sisa_tagihan: 0
        });
    });

    return Array.from(mapGabung.values()).sort((a, b) => (a.nama_siswa || '').localeCompare(b.nama_siswa || '', 'id'));
}

window.isiDropdownSiswaPOS = function() {
    const selSiswa = document.getElementById("selectSiswaPOS");
    if (!selSiswa) return;

    const filterKls = document.getElementById("filterKelasPOS")?.value || "";
    const semuaSiswa = gabungkanSemuaSiswaSekolah();
    const tersaring = semuaSiswa.filter(s => !filterKls || s.kelas.toUpperCase() === filterKls.toUpperCase());

    selSiswa.innerHTML = `<option value="">-- Pilih Nama Siswa (${tersaring.length} Siswa) --</option>` +
        tersaring.map(s => {
            const infoTagihan = s.sisa_tagihan > 0 ? ` — Tagihan: ${formatRupiah(s.sisa_tagihan)}` : '';
            return `<option value="${s.username_siswa}">${s.nama_siswa} (${s.kelas})${infoTagihan}</option>`;
        }).join('');
};

window.pilihSiswaDariDropdownPOS = async function(usernameSiswa) {
    if (!usernameSiswa) return;
    await pastikanDanBukaSiswaPOS(usernameSiswa);
};

window.cariSiswaUntukPOS = function() {
    const kw = document.getElementById("inputCariSiswaPOS").value.toLowerCase().trim();
    const filterKls = document.getElementById("filterKelasPOS")?.value || "";
    const wadah = document.getElementById("hasilCariSiswaPOS");

    if (!kw && !filterKls) {
        wadah.innerHTML = "";
        return;
    }

    const semuaSiswa = gabungkanSemuaSiswaSekolah();
    const cocok = semuaSiswa.filter(s => {
        const klsOk = !filterKls || s.kelas.toUpperCase() === filterKls.toUpperCase();
        const kwOk = !kw || (s.nama_siswa + " " + s.username_siswa + " " + s.nisn + " " + s.kelas).toLowerCase().includes(kw);
        return klsOk && kwOk;
    });

    if (cocok.length === 0) {
        wadah.innerHTML = `<div class="list-group-item text-muted small py-2">Siswa tidak ditemukan.</div>`;
        return;
    }

    wadah.innerHTML = cocok.slice(0, 10).map(s => `
        <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onclick="pastikanDanBukaSiswaPOS('${s.username_siswa.replace(/'/g, "\\'")}')">
            <div>
                <b class="text-dark">${s.nama_siswa}</b> <span class="badge bg-success ms-1">${s.kelas}</span><br>
                <small class="text-muted">ID/NIK: <b>${s.username_siswa}</b></small>
            </div>
            <span class="badge ${s.sisa_tagihan > 0 ? 'bg-danger' : 'bg-secondary'}">${s.sisa_tagihan > 0 ? formatRupiah(s.sisa_tagihan) : 'Pilih'}</span>
        </button>
    `).join('');
};

window.pastikanDanBukaSiswaPOS = async function(usernameSiswa) {
    document.getElementById("hasilCariSiswaPOS").innerHTML = "";
    const semuaSiswa = gabungkanSemuaSiswaSekolah();
    const target = semuaSiswa.find(s => String(s.username_siswa).toLowerCase() === String(usernameSiswa).toLowerCase());
    if (!target) return;

    showLoadingUI(true, "Memuat Tagihan Siswa...", `Membuka data tagihan ${target.nama_siswa}...`);
    try {
        if (target.invoice_id) {
            await pilihSiswaPOS(target.invoice_id);
            return;
        }

        const cekDb = await apiRequest('GET', `student_invoices?select=*&username_siswa=eq.${encodeURIComponent(target.username_siswa)}&limit=1`);
        if (Array.isArray(cekDb) && cekDb.length > 0) {
            await pilihSiswaPOS(cekDb[0].id);
            return;
        }

        const thnAktif = document.getElementById("globalFilterTahun")?.value || '2026/2027';
        const itemCocok = masterItems.filter(it => it.status_aktif && it.is_wajib && it.tahun_ajaran === thnAktif && apakahSiswaCocokDenganTarget(it.target_kelas, it.target_jurusan, target.kelas));
        const totalAwal = itemCocok.reduce((sum, it) => sum + Number(it.nominal || 0), 0);
        const noInv = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

        const resNew = await apiRequest('POST', 'student_invoices', [{
            no_invoice: noInv,
            ppdb_id: target.ppdb_id || null,
            username_siswa: target.username_siswa,
            nisn: target.nisn,
            nik: target.username_siswa,
            no_pendaftaran: target.no_pendaftaran || null,
            nama_siswa: target.nama_siswa,
            kelas: target.kelas,
            jurusan: target.jurusan,
            tahun_ajaran: thnAktif,
            total_tagihan: totalAwal,
            total_dibayar: 0,
            sisa_tagihan: totalAwal,
            status_tagihan: 'Belum Bayar'
        }]);

        const newInv = Array.isArray(resNew) ? resNew[0] : resNew;
        if (newInv && newInv.id) {
            if (itemCocok.length > 0) {
                const rincian = itemCocok.map(it => ({
                    invoice_id: newInv.id,
                    item_id: it.id,
                    nama_item: it.nama_item,
                    kategori: it.kategori,
                    nominal_tagihan: Number(it.nominal),
                    jumlah_dibayar: 0,
                    sisa_item: Number(it.nominal),
                    tgl_jatuh_tempo: it.tgl_jatuh_tempo || null,
                    status_item: 'Belum Bayar'
                }));
                await apiRequest('POST', 'invoice_details', rincian);
            }
            await refreshSemuaData();
            await pilihSiswaPOS(newInv.id);
        }
    } finally {
        showLoadingUI(false);
    }
};

window.bukaKasirUntukSiswa = async function(invoiceId) {
    switchMenuBendahara('kasir', document.querySelectorAll('.nav-item-b')[1]);
    showLoadingUI(true, "Membuka Kasir...");
    try {
        await pilihSiswaPOS(invoiceId);
    } finally {
        showLoadingUI(false);
    }
};

window.pilihSiswaPOS = async function(invoiceId) {
    document.getElementById("hasilCariSiswaPOS").innerHTML = "";
    const resInv = await apiRequest('GET', `student_invoices?select=*&id=eq.${invoiceId}`);
    const inv = Array.isArray(resInv) ? resInv[0] : null;
    if (!inv) return;

    selectedInvoicePOS = inv;
    const selDropdown = document.getElementById("selectSiswaPOS");
    if (selDropdown) selDropdown.value = inv.username_siswa;

    document.getElementById("cardDetailSiswaPOS").style.display = "block";
    document.getElementById("posInisialSiswa").innerText = (inv.nama_siswa || 'S').charAt(0).toUpperCase();
    document.getElementById("posNamaSiswa").innerText = inv.nama_siswa;
    document.getElementById("posInfoSiswa").innerText = `ID/NIK: ${inv.username_siswa} | Kelas: ${inv.kelas} | Jurusan: ${parseKelasDanJurusan(inv.kelas).jurusan}`;
    document.getElementById("posNoInvoice").innerText = inv.no_invoice;

    const details = await apiRequest('GET', `invoice_details?select=*&invoice_id=eq.${invoiceId}&order=created_at.asc`);
    const tb = document.getElementById("tbItemKasirPOS");

    if (!details || details.length === 0) {
        tb.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Siswa ini belum memiliki item tagihan. Klik <b>"+ Tambah Tagihan Khusus Siswa Ini"</b> di atas.</td></tr>';
    } else {
        tb.innerHTML = details.map(d => {
            const isLunas = Number(d.sisa_item) <= 0;
            const tglTempo = dapatkanTanggalJatuhTempoItem(d, inv);
            return `<tr class="${isLunas ? 'table-success opacity-75' : ''}">
                <td class="text-center">
                    <input type="checkbox" class="form-check-input cb-item-pos" data-id="${d.id}" data-nama="${d.nama_item}" data-kategori="${d.kategori}" data-sisa="${d.sisa_item}" ${isLunas ? 'disabled' : 'checked'} onchange="hitungTotalPOS()">
                </td>
                <td>
                    <b>${d.nama_item}</b><br>
                    <small class="text-muted">${d.kategori} ${tglTempo ? '• Jatuh Tempo: ' + tglTempo : ''}</small>
                </td>
                <td class="text-end">${formatRupiah(d.nominal_tagihan)}</td>
                <td class="text-end text-success">${formatRupiah(d.jumlah_dibayar)}</td>
                <td class="text-end fw-bold text-danger">${formatRupiah(d.sisa_item)}</td>
                <td>
                    <input type="number" class="form-control form-control-sm fw-bold text-end input-nominal-pos" id="inpBayar_${d.id}" value="${isLunas ? 0 : d.sisa_item}" max="${d.sisa_item}" min="0" ${isLunas ? 'disabled' : ''} oninput="hitungTotalPOS()">
                </td>
            </tr>`;
        }).join('');
    }

    hitungTotalPOS();
};

window.hitungTotalPOS = function() {
    let total = 0;
    document.querySelectorAll('.cb-item-pos:checked').forEach(cb => {
        const id = cb.getAttribute('data-id');
        const maxSisa = Number(cb.getAttribute('data-sisa'));
        const inp = document.getElementById(`inpBayar_${id}`);
        let val = Number(inp.value || 0);
        if (val > maxSisa) { val = maxSisa; inp.value = maxSisa; }
        if (val < 0) { val = 0; inp.value = 0; }
        total += val;
    });

    document.getElementById("posTotalBayar").innerText = formatRupiah(total);
    document.getElementById("posTotalBayar").setAttribute('data-total', total);

    if (selectedMethodPOS === 'QRIS') {
        renderQrisDinamisPOS(total);
    } else {
        hitungKembalianPOS();
    }
};

window.pilihMetodePOS = function(metode) {
    selectedMethodPOS = metode;
    document.getElementById("cardMethodCash").classList.toggle('active', metode === 'CASH');
    document.getElementById("cardMethodQris").classList.toggle('active', metode === 'QRIS');
    document.getElementById("areaPosCash").style.display = metode === 'CASH' ? 'block' : 'none';
    document.getElementById("areaPosQris").style.display = metode === 'QRIS' ? 'block' : 'none';

    const total = Number(document.getElementById("posTotalBayar").getAttribute('data-total') || 0);
    if (metode === 'QRIS') {
        renderQrisDinamisPOS(total);
    }
};

window.hitungKembalianPOS = function() {
    const total = Number(document.getElementById("posTotalBayar").getAttribute('data-total') || 0);
    const diterima = Number(document.getElementById("posUangDiterima").value || 0);
    const kembali = diterima - total;
    document.getElementById("posUangKembalian").innerText = kembali >= 0 ? formatRupiah(kembali) : "Uang Kurang!";
};

window.prosesTransaksiPOS = async function() {
    if (!selectedInvoicePOS) {
        await uiAlert("Pilih Siswa", "Silakan pilih siswa yang akan melakukan pembayaran terlebih dahulu.", "warning");
        return;
    }

    const totalBayar = Number(document.getElementById("posTotalBayar").getAttribute('data-total') || 0);
    if (totalBayar <= 0) {
        await uiAlert("Nominal Kosong", "Pilih minimal 1 item tagihan dengan nominal pembayaran lebih dari Rp 0.", "warning");
        return;
    }

    let uangDiterima = totalBayar;
    let kembalian = 0;

    if (selectedMethodPOS === 'CASH') {
        uangDiterima = Number(document.getElementById("posUangDiterima").value || 0);
        if (uangDiterima < totalBayar) {
            await uiAlert(
                "Uang Diterima Kurang",
                `Uang tunai yang diterima (${formatRupiah(uangDiterima)}) kurang dari Total Pembayaran (${formatRupiah(totalBayar)}).\n\nJika siswa ingin mencicil, silakan ubah angka pada kolom 'Dibayar Sekarang' di tabel rincian item.`,
                "warning"
            );
            return;
        }
        kembalian = uangDiterima - totalBayar;
    }

    const itemDibayarList = [];
    document.querySelectorAll('.cb-item-pos:checked').forEach(cb => {
        const id = cb.getAttribute('data-id');
        const nominal = Number(document.getElementById(`inpBayar_${id}`).value || 0);
        if (nominal > 0) {
            itemDibayarList.push({
                invoice_detail_id: id,
                nama_item: cb.getAttribute('data-nama'),
                kategori: cb.getAttribute('data-kategori'),
                nominal_dibayar: nominal
            });
        }
    });

    let statusTrx = 'Berhasil';
    if (selectedMethodPOS === 'QRIS') {
        statusTrx = document.getElementById("posStatusQrisPilihan")?.value || 'Berhasil';
    }

    const yakin = await uiConfirm(
        "Konfirmasi Pembayaran",
        `Proses pembayaran ${selectedMethodPOS} atas nama ${selectedInvoicePOS.nama_siswa} sebesar ${formatRupiah(totalBayar)}?`,
        "Ya, Proses Sekarang",
        "btn-success"
    );
    if (!yakin) return;

    const noTrx = `TRX-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${Math.floor(100000 + Math.random() * 900000)}`;
    const petugas = currentBendahara ? (currentBendahara.nama_lengkap || currentBendahara.username) : 'Bendahara';
    const ket = document.getElementById("posKeterangan").value.trim() || (selectedMethodPOS === 'QRIS' ? 'Pembayaran QRIS' : 'Pembayaran Tunai');

    const btn = document.getElementById("btnEksekusiPOS");
    setTombolLoading(btn, true, "Memproses Transaksi...");
    showLoadingUI(true, "Menyimpan Transaksi...", "Mencatat pembayaran dan memperbarui saldo tagihan siswa...");

    try {
        const resTrx = await apiRequest('POST', 'payment_transactions', [{
            no_transaksi: noTrx,
            invoice_id: selectedInvoicePOS.id,
            username_siswa: selectedInvoicePOS.username_siswa,
            nisn: selectedInvoicePOS.nisn,
            nama_siswa: selectedInvoicePOS.nama_siswa,
            kelas: selectedInvoicePOS.kelas,
            jurusan: selectedInvoicePOS.jurusan,
            tahun_ajaran: selectedInvoicePOS.tahun_ajaran,
            total_bayar: totalBayar,
            uang_diterima: uangDiterima,
            kembalian: kembalian,
            metode_pembayaran: selectedMethodPOS,
            status_transaksi: statusTrx,
            petugas: petugas,
            sumber_pembayaran: 'Kasir Sekolah',
            keterangan: ket
        }]);

        const trxHeader = Array.isArray(resTrx) ? resTrx[0] : resTrx;

        const detailPayload = itemDibayarList.map(it => ({
            transaction_id: trxHeader.id,
            invoice_detail_id: it.invoice_detail_id,
            nama_item: it.nama_item,
            kategori: it.kategori,
            nominal_dibayar: it.nominal_dibayar
        }));
        await apiRequest('POST', 'payment_transaction_details', detailPayload);

        if (selectedMethodPOS === 'QRIS') {
            const qrisPayload = generateDynamicQris(paymentSettings.static_qris, totalBayar);
            await apiRequest('POST', 'payment_gateway_logs', [{
                transaction_id: trxHeader.id,
                no_transaksi: noTrx,
                nominal: totalBayar,
                qris_payload: qrisPayload,
                status_qris: statusTrx === 'Berhasil' ? 'Approved' : 'Pending',
                verified_by: statusTrx === 'Berhasil' ? petugas : null,
                verified_at: statusTrx === 'Berhasil' ? new Date().toISOString() : null
            }]);
        }

        if (statusTrx === 'Berhasil') {
            await terapkanPotonganTagihan(trxHeader.id, selectedInvoicePOS.id);
        }

        await catatAudit('TRANSAKSI_KASIR_' + statusTrx.toUpperCase(), 'payment_transactions', noTrx, null, { totalBayar, metode: selectedMethodPOS });

        document.getElementById("posUangDiterima").value = "";
        document.getElementById("posKeterangan").value = "";
        await refreshSemuaData();
        await pilihSiswaPOS(selectedInvoicePOS.id);
        showLoadingUI(false);

        showToast(`Transaksi ${noTrx} berhasil disimpan!`);
        tampilkanStrukModal(trxHeader, itemDibayarList);

    } catch (err) {
        showLoadingUI(false);
        await uiAlert("Gagal Menyimpan Transaksi", err.message, "error");
    } finally {
        setTombolLoading(btn, false);
    }
};

async function terapkanPotonganTagihan(transactionId, invoiceId) {
    const trxDetails = await apiRequest('GET', `payment_transaction_details?select=*&transaction_id=eq.${transactionId}`);
    for (const td of (trxDetails || [])) {
        const resDet = await apiRequest('GET', `invoice_details?select=*&id=eq.${td.invoice_detail_id}`);
        const invDet = Array.isArray(resDet) ? resDet[0] : null;
        if (invDet) {
            const dibayarBaru = Number(invDet.jumlah_dibayar) + Number(td.nominal_dibayar);
            const sisaBaru = Math.max(0, Number(invDet.nominal_tagihan) - dibayarBaru);
            const statusItem = sisaBaru <= 0 ? 'Lunas' : 'Cicilan';

            await apiRequest('PATCH', `invoice_details?id=eq.${invDet.id}`, {
                jumlah_dibayar: dibayarBaru,
                sisa_item: sisaBaru,
                status_item: statusItem
            });
        }
    }
    await rekalkulasiHeaderInvoice(invoiceId);

    const resInv = await apiRequest('GET', `student_invoices?select=*&id=eq.${invoiceId}`);
    const invUpd = Array.isArray(resInv) ? resInv[0] : null;
    if (invUpd && invUpd.ppdb_id) {
        await apiRequest('PATCH', `ppdb_siswa?id=eq.${invUpd.ppdb_id}`, {
            status_pembayaran: invUpd.status_tagihan
        });
    }
}

async function rekalkulasiHeaderInvoice(invoiceId) {
    const details = await apiRequest('GET', `invoice_details?select=*&invoice_id=eq.${invoiceId}&status_item=neq.Dibatalkan`);
    const list = details || [];
    const totalTagihan = list.reduce((a, b) => a + Number(b.nominal_tagihan), 0);
    const totalDibayar = list.reduce((a, b) => a + Number(b.jumlah_dibayar), 0);
    const sisaTagihan = Math.max(0, totalTagihan - totalDibayar);

    const todayStr = new Date().toISOString().split('T')[0];
    let adaLewatTempo = false;
    let tempoTerdekat = null;

    list.forEach(d => {
        const tgl = dapatkanTanggalJatuhTempoItem(d, null);
        if (Number(d.sisa_item) > 0 && tgl) {
            if (!tempoTerdekat || tgl < tempoTerdekat) tempoTerdekat = tgl;
            if (tgl < todayStr) adaLewatTempo = true;
        }
    });

    let statusBaru = 'Belum Bayar';
    if (totalTagihan > 0 && sisaTagihan <= 0) statusBaru = 'Lunas';
    else if (adaLewatTempo && sisaTagihan > 0) statusBaru = 'Jatuh Tempo';
    else if (totalDibayar > 0 && sisaTagihan > 0) statusBaru = 'Cicilan';

    await apiRequest('PATCH', `student_invoices?id=eq.${invoiceId}`, {
        total_tagihan: totalTagihan,
        total_dibayar: totalDibayar,
        sisa_tagihan: sisaTagihan,
        tgl_jatuh_tempo: tempoTerdekat,
        status_tagihan: statusBaru
    });
}

// =========================================================================
// 10. TAGIHAN SISWA & FORM INPUT TAGIHAN/PIUTANG (TERINTEGRASI MASTER ITEM)
// =========================================================================
window.renderTabelTagihanSiswa = function() {
    const tb = document.getElementById("tbDaftarTagihanSiswa");
    if (!tb) return;

    const kw = (document.getElementById("cariTagihanSiswa")?.value || "").toLowerCase();
    const fKls = document.getElementById("filterKelasTagihan")?.value || "";
    const fStat = document.getElementById("filterStatusTagihan")?.value || "";

    const filtered = allInvoices.filter(inv => {
        const cocokKw = (inv.nama_siswa + " " + inv.username_siswa + " " + inv.no_invoice + " " + inv.kelas).toLowerCase().includes(kw);
        const cocokKls = !fKls || (inv.kelas && inv.kelas.trim().toUpperCase() === fKls.trim().toUpperCase());
        const cocokStat = !fStat || inv.status_tagihan === fStat;
        return cocokKw && cocokKls && cocokStat;
    });

    if (filtered.length === 0) {
        tb.innerHTML = '<tr><td colspan="8" class="py-4 text-muted">Tidak ada data tagihan siswa yang cocok dengan filter.</td></tr>';
        return;
    }

    tb.innerHTML = filtered.map(inv => {
        let bdg = '<span class="badge bg-danger">Belum Bayar</span>';
        if (inv.status_tagihan === 'Lunas') bdg = '<span class="badge bg-success">Lunas</span>';
        else if (inv.status_tagihan === 'Cicilan') bdg = '<span class="badge bg-warning text-dark">Cicilan</span>';
        else if (inv.status_tagihan === 'Jatuh Tempo') bdg = '<span class="badge bg-danger"><i class="fa-solid fa-bell me-1"></i>Jatuh Tempo</span>';
        else if (inv.status_tagihan === 'Dibatalkan') bdg = '<span class="badge bg-secondary">Dibatalkan</span>';

        const parsed = parseKelasDanJurusan(inv.kelas);

        return `<tr>
            <td class="fw-bold text-secondary">${inv.no_invoice}</td>
            <td class="text-start">
                <b class="text-dark">${inv.nama_siswa}</b><br>
                <small class="text-muted">ID Login: <b>${inv.username_siswa}</b></small>
            </td>
            <td>
                <span class="badge bg-success bg-opacity-10 text-success border border-success">${inv.kelas}</span>
                <small class="text-muted d-block">Jurusan: ${parsed.jurusan || inv.jurusan}</small>
            </td>
            <td class="fw-bold">${formatRupiah(inv.total_tagihan)}</td>
            <td class="fw-bold text-success">${formatRupiah(inv.total_dibayar)}</td>
            <td class="fw-bold text-danger">${formatRupiah(inv.sisa_tagihan)}</td>
            <td>${bdg}</td>
            <td>
                <button class="btn btn-sm btn-success fw-bold me-1" onclick="bukaKasirUntukSiswa('${inv.id}')">
                    <i class="fa-solid fa-cash-register me-1"></i> Kasir
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="batalkanTagihanSiswa('${inv.id}', '${inv.nama_siswa.replace(/'/g, "\\'")}')" title="Batalkan Tagihan">
                    <i class="fa-solid fa-ban"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
};

window.bukaModalTambahTagihanIndividu = function() {
    if (!selectedInvoicePOS) return;
    bukaModalPiutangManual(selectedInvoicePOS.username_siswa);
};

window.bukaModalPiutangManual = function(preselectUsername = "") {
    const semuaSiswa = gabungkanSemuaSiswaSekolah();
    const selSiswa = document.getElementById("piutangPilihSiswaDb");
    if (selSiswa) {
        selSiswa.innerHTML = `<option value="">-- Pilih Siswa Terdaftar --</option>` +
            semuaSiswa.map(u => `<option value="${u.username_siswa}">${u.nama_siswa} (${u.kelas}) - ID: ${u.username_siswa}</option>`).join('');
    }

    renderPillKategoriDinamis();
    filterDropdownItemBerdasarkanKategori();

    if (preselectUsername) {
        selSiswa.value = preselectUsername;
        isiOtomatisSiswaPiutang(preselectUsername);
    } else {
        document.getElementById("piutangUsername").value = "";
        document.getElementById("piutangNama").value = "";
        document.getElementById("piutangNamaItem").value = "";
        document.getElementById("piutangTotalAwal").value = 0;
        document.getElementById("piutangSudahBayar").value = 0;
        document.getElementById("piutangSisa").value = 0;
    }

    new bootstrap.Modal(document.getElementById("modalPiutangManual")).show();
};

// Saat kategori dipilih di Modal Tagihan/Piutang, otomatis tampilkan daftar Nama Item Pembayaran dari kategori tersebut!
window.filterDropdownItemBerdasarkanKategori = function() {
    const kat = document.getElementById("piutangKategori")?.value || "SEMUA";
    const selItem = document.getElementById("piutangPilihMasterItem");
    if (!selItem) return;

    const cocok = masterItems.filter(i => kat === "SEMUA" || i.kategori === kat);
    selItem.innerHTML = `<option value="">-- Pilih Nama Item Pembayaran (${cocok.length} Item Tersedia) --</option>` +
        cocok.map(i => `<option value="${i.id}">${i.nama_item} — ${formatRupiah(i.nominal)} (${i.kategori})</option>`).join('');

    // Jika hanya ada 1 item di kategori tersebut, langsung pilihkan otomatis agar user tidak repot
    if (cocok.length === 1) {
        selItem.value = cocok[0].id;
        pilihMasterItemUntukPiutang(cocok[0].id);
    }
};

window.pilihMasterItemUntukPiutang = function(itemId) {
    const it = masterItems.find(x => String(x.id) === String(itemId));
    if (!it) return;
    document.getElementById("piutangKategori").value = it.kategori;
    document.getElementById("piutangNamaItem").value = it.nama_item;
    document.getElementById("piutangTotalAwal").value = Number(it.nominal || 0);
    document.getElementById("piutangJatuhTempo").value = it.tgl_jatuh_tempo || "";
    hitungSisaPiutangManual();
};

window.isiOtomatisSiswaPiutang = function(username) {
    const semuaSiswa = gabungkanSemuaSiswaSekolah();
    const s = semuaSiswa.find(u => String(u.username_siswa).toLowerCase() === String(username).toLowerCase());
    if (!s) return;
    document.getElementById("piutangUsername").value = s.username_siswa;
    document.getElementById("piutangNama").value = s.nama_siswa;
    if (s.kelas) document.getElementById("piutangKelas").value = s.kelas;
};

window.hitungSisaPiutangManual = function() {
    const tot = Number(document.getElementById("piutangTotalAwal").value || 0);
    const byr = Number(document.getElementById("piutangSudahBayar").value || 0);
    document.getElementById("piutangSisa").value = Math.max(0, tot - byr);
};

window.simpanPiutangManual = async function() {
    const username = document.getElementById("piutangUsername").value.trim();
    const nama = document.getElementById("piutangNama").value.trim();
    const kelas = document.getElementById("piutangKelas").value;
    const itemMasterId = document.getElementById("piutangPilihMasterItem").value || null;
    const namaItem = document.getElementById("piutangNamaItem").value.trim();
    const kategoriPilihan = document.getElementById("piutangKategori").value;
    const kategori = kategoriPilihan === "SEMUA" ? "Lainnya" : kategoriPilihan;
    const tglTempo = document.getElementById("piutangJatuhTempo").value || null;
    const totalAwal = Number(document.getElementById("piutangTotalAwal").value || 0);
    const sudahBayar = Number(document.getElementById("piutangSudahBayar").value || 0);
    const sisa = Math.max(0, totalAwal - sudahBayar);
    const thn = document.getElementById("globalFilterTahun").value || "2026/2027";

    if (!username || !nama || !namaItem || totalAwal <= 0) {
        await uiAlert("Data Belum Lengkap", "Mohon pilih siswa, pilih/isi Nama Item Tagihan, dan pastikan Total Tagihan Awal lebih dari Rp 0.", "warning");
        return;
    }

    const btn = document.getElementById("btnSimpanPiutangManual");
    setTombolLoading(btn, true, "Menyimpan...");
    showLoadingUI(true, "Menyimpan Tagihan Siswa...", `Menambahkan "${namaItem}" ke tagihan ${nama}...`);

    try {
        const parsed = parseKelasDanJurusan(kelas);
        const jurusan = parsed.jurusan || 'TKJ';

        const cekInv = await apiRequest('GET', `student_invoices?select=*&username_siswa=eq.${encodeURIComponent(username)}&limit=1`);
        let inv = Array.isArray(cekInv) && cekInv.length > 0 ? cekInv[0] : null;

        if (!inv) {
            const noInv = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
            const resNew = await apiRequest('POST', 'student_invoices', [{
                no_invoice: noInv,
                username_siswa: username,
                nisn: username,
                nik: username,
                nama_siswa: nama,
                kelas: kelas,
                jurusan: jurusan,
                tahun_ajaran: thn,
                total_tagihan: 0,
                total_dibayar: 0,
                sisa_tagihan: 0,
                status_tagihan: 'Belum Bayar'
            }]);
            inv = Array.isArray(resNew) ? resNew[0] : resNew;
        }

        const statusItem = sisa <= 0 ? 'Lunas' : (sudahBayar > 0 ? 'Cicilan' : 'Belum Bayar');
        await apiRequest('POST', 'invoice_details', [{
            invoice_id: inv.id,
            item_id: itemMasterId,
            nama_item: namaItem,
            kategori: kategori,
            nominal_tagihan: totalAwal,
            jumlah_dibayar: sudahBayar,
            sisa_item: sisa,
            tgl_jatuh_tempo: tglTempo,
            status_item: statusItem
        }]);

        await rekalkulasiHeaderInvoice(inv.id);
        await catatAudit('TAMBAH_TAGIHAN_SISWA', 'student_invoices', inv.no_invoice, null, { nama, namaItem, totalAwal, sudahBayar, sisa });

        bootstrap.Modal.getInstance(document.getElementById("modalPiutangManual")).hide();
        await refreshSemuaData();
        if (selectedInvoicePOS && selectedInvoicePOS.id === inv.id) {
            await pilihSiswaPOS(inv.id);
        }
        showLoadingUI(false);
        showToast(`Tagihan "${namaItem}" berhasil ditambahkan untuk ${nama}!`);
    } catch (err) {
        showLoadingUI(false);
        await uiAlert("Gagal Menyimpan", err.message, "error");
    } finally {
        setTombolLoading(btn, false);
    }
};

window.batalkanTagihanSiswa = async function(invId, nama) {
    const alasan = await uiPrompt("Batalkan Tagihan Siswa", `Masukkan alasan pembatalan tagihan untuk siswa ${nama}:`, "Alasan pembatalan...");
    if (!alasan) return;

    showLoadingUI(true, "Membatalkan Tagihan...");
    try {
        await apiRequest('PATCH', `student_invoices?id=eq.${invId}`, { status_tagihan: 'Dibatalkan', alasan_batal: alasan });
        await catatAudit('BATALKAN_TAGIHAN', 'student_invoices', invId, null, { alasan });
        await refreshSemuaData();
        showLoadingUI(false);
        showToast("Tagihan siswa telah dibatalkan.", "warning");
    } catch (e) {
        showLoadingUI(false);
        await uiAlert("Gagal", e.message, "error");
    }
};

// Download Format & Import Excel Piutang Berjalan
window.downloadTemplatePiutang = function() {
    const contohKelas = daftarKelasDB[0] || "X AK";
    const parsed = parseKelasDanJurusan(contohKelas);
    const contohData = [
        {
            "Username_atau_NIK": "3173012345670001",
            "NISN": "0081234567",
            "Nama_Siswa": "Ahmad Fauzi",
            "Kelas": contohKelas,
            "Jurusan": parsed.jurusan || "AK",
            "Tahun_Ajaran": "2026/2027",
            "Nama_Item_Tagihan": "Sisa Uang Pangkal",
            "Kategori": "Uang Pangkal",
            "Total_Tagihan": 2000000,
            "Sudah_Dibayar": 1200000,
            "Tgl_Jatuh_Tempo": "2026-12-20"
        }
    ];

    const ws = XLSX.utils.json_to_sheet(contohData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Piutang");
    XLSX.writeFile(wb, "Format_Import_Piutang_SMK_Addawah.xlsx");
};

window.importExcelPiutang = function(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            if (!rows || rows.length === 0) {
                await uiAlert("File Kosong", "File Excel yang dipilih kosong atau tidak sesuai format.", "warning");
                return;
            }

            const yakin = await uiConfirm(
                "Import Data Piutang",
                `Ditemukan ${rows.length} baris data piutang siswa di dalam file Excel. Proses import sekarang?`,
                "Ya, Import Sekarang",
                "btn-success"
            );
            if (!yakin) { input.value = ""; return; }

            showLoadingUI(true, "Mengimpor Data Piutang...", `Memproses ${rows.length} baris data tagihan siswa...`);

            let berhasilCount = 0;
            for (const r of rows) {
                const username = String(r.Username_atau_NIK || r.NIK || r.Username || "").trim();
                const nama = String(r.Nama_Siswa || "").trim();
                const kelas = String(r.Kelas || daftarKelasDB[0] || "X AK").trim();
                const parsed = parseKelasDanJurusan(kelas);
                const jurusan = String(r.Jurusan || parsed.jurusan || "AK").trim();
                const thn = String(r.Tahun_Ajaran || document.getElementById("globalFilterTahun").value || "2026/2027").trim();
                const namaItem = String(r.Nama_Item_Tagihan || "Piutang Berjalan").trim();
                const kategori = String(r.Kategori || "SPP").trim();
                const totalTagihan = Number(r.Total_Tagihan || 0);
                const sudahDibayar = Number(r.Sudah_Dibayar || 0);
                const sisaItem = Math.max(0, totalTagihan - sudahDibayar);
                const tglTempo = r.Tgl_Jatuh_Tempo ? String(r.Tgl_Jatuh_Tempo).trim() : null;

                if (!username || !nama || totalTagihan <= 0) continue;

                const cekInv = await apiRequest('GET', `student_invoices?select=*&username_siswa=eq.${encodeURIComponent(username)}&limit=1`);
                let inv = Array.isArray(cekInv) && cekInv.length > 0 ? cekInv[0] : null;

                if (!inv) {
                    const noInv = `INV-MIG-${Math.floor(100000 + Math.random() * 900000)}`;
                    const resNew = await apiRequest('POST', 'student_invoices', [{
                        no_invoice: noInv,
                        username_siswa: username,
                        nisn: String(r.NISN || username),
                        nik: username,
                        nama_siswa: nama,
                        kelas: kelas,
                        jurusan: jurusan,
                        tahun_ajaran: thn,
                        total_tagihan: 0,
                        total_dibayar: 0,
                        sisa_tagihan: 0,
                        status_tagihan: 'Belum Bayar'
                    }]);
                    inv = Array.isArray(resNew) ? resNew[0] : resNew;
                }

                if (inv && inv.id) {
                    const statusItem = sisaItem <= 0 ? 'Lunas' : (sudahDibayar > 0 ? 'Cicilan' : 'Belum Bayar');
                    await apiRequest('POST', 'invoice_details', [{
                        invoice_id: inv.id,
                        nama_item: namaItem,
                        kategori: kategori,
                        nominal_tagihan: totalTagihan,
                        jumlah_dibayar: sudahDibayar,
                        sisa_item: sisaItem,
                        tgl_jatuh_tempo: tglTempo,
                        status_item: statusItem
                    }]);
                    await rekalkulasiHeaderInvoice(inv.id);
                    berhasilCount++;
                }
            }

            await catatAudit('IMPORT_EXCEL_PIUTANG', 'student_invoices', 'BATCH', null, { jumlah_baris: berhasilCount });
            input.value = "";
            await muatKelasDanJurusanDariUsers();
            await refreshSemuaData();
            showLoadingUI(false);
            await uiAlert("Import Selesai!", `Berhasil mengimpor ${berhasilCount} data piutang siswa ke dalam sistem.`, "success");
        } catch (err) {
            showLoadingUI(false);
            await uiAlert("Gagal Mengimpor Excel", err.message, "error");
        }
    };
    reader.readAsArrayBuffer(file);
};

// =========================================================================
// 11. CETAK STRUK PROFESIONAL (58mm, 80mm, A4 & PDF)
// =========================================================================
function tampilkanStrukModal(trx, items) {
    lastStrukData = { trx, items };
    renderHTMLStruk();
    new bootstrap.Modal(document.getElementById("modalStrukPembayaran")).show();
}

function renderHTMLStruk() {
    if (!lastStrukData) return;
    const { trx, items } = lastStrukData;
    const tglJam = new Date(trx.tanggal_transaksi).toLocaleString('id-ID');

    const rowsHtml = items.map(it => `
        <tr>
            <td style="padding: 3px 0;">${it.nama_item}</td>
            <td style="text-align: right; padding: 3px 0; font-weight: bold;">${formatRupiah(it.nominal_dibayar)}</td>
        </tr>
    `).join('');

    document.getElementById("areaCetakStruk").innerHTML = `
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
            <img src="https://i.ibb.co.com/Ngh0x6Rr/Addawah-300x.png" width="44" style="margin-bottom: 4px;"><br>
            <strong style="font-size: 14px;">${paymentSettings.school_name}</strong><br>
            <span style="font-size: 10px;">BUKTI PEMBAYARAN RESMI SISWA</span>
        </div>
        <table style="width: 100%; font-size: 11px; margin-bottom: 8px;">
            <tr><td>No. Transaksi</td><td>: <b>${trx.no_transaksi}</b></td></tr>
            <tr><td>Tanggal</td><td>: ${tglJam}</td></tr>
            <tr><td>Nama Siswa</td><td>: <b>${trx.nama_siswa}</b></td></tr>
            <tr><td>ID / NISN</td><td>: ${trx.username_siswa}</td></tr>
            <tr><td>Kelas</td><td>: ${trx.kelas}</td></tr>
            <tr><td>Metode</td><td>: ${trx.metode_pembayaran} (${trx.status_transaksi})</td></tr>
        </table>
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 8px;">
            <table style="width: 100%; font-size: 11px;">
                <thead>
                    <tr style="border-bottom: 1px solid #ddd;">
                        <th style="text-align: left;">Rincian Item</th>
                        <th style="text-align: right;">Nominal</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
        <table style="width: 100%; font-size: 12px; font-weight: bold; margin-bottom: 10px;">
            <tr><td>TOTAL BAYAR</td><td style="text-align: right;">${formatRupiah(trx.total_bayar)}</td></tr>
            <tr><td>UANG DITERIMA</td><td style="text-align: right;">${formatRupiah(trx.uang_diterima)}</td></tr>
            <tr><td>KEMBALIAN</td><td style="text-align: right;">${formatRupiah(trx.kembalian)}</td></tr>
        </table>
        <div style="font-size: 10px; text-align: center; margin-top: 12px;">
            <div>Keterangan: ${trx.keterangan || '-'}</div>
            <div style="margin-top: 8px;">Petugas Bendahara:<br><br><b>(${trx.petugas})</b></div>
            <div style="margin-top: 8px; color: #555;">Terima kasih. Simpan struk ini sebagai bukti pembayaran yang sah.</div>
        </div>
    `;
}

window.ubahUkuranStruk = function(ukuran, btn) {
    document.querySelectorAll('#modalStrukPembayaran .btn-outline-success').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const area = document.getElementById("areaCetakStruk");
    if (ukuran === '58mm') area.className = 'struk-thermal-58';
    else if (ukuran === '80mm') area.className = 'struk-thermal-80';
    else area.className = 'struk-a4';
};

window.cetakStrukWindow = function() {
    const content = document.getElementById("areaCetakStruk").outerHTML;
    const win = window.open('', '_blank', 'width=450,height=650');
    win.document.write(`<html><head><title>Cetak Struk</title></head><body onload="window.print();">${content}</body></html>`);
    win.document.close();
};

window.unduhPDFStruk = function() {
    const el = document.getElementById("areaCetakStruk");
    html2pdf().from(el).save(`Struk_${lastStrukData?.trx?.no_transaksi || 'Pembayaran'}.pdf`);
};

// =========================================================================
// 12. RIWAYAT TRANSAKSI, VERIFIKASI, TUNGGAKAN, LAPORAN & PENGATURAN QRIS
// =========================================================================
window.renderTabelRiwayat = function() {
    const tb = document.getElementById("tbRiwayatTransaksi");
    if (!tb) return;

    const kw = (document.getElementById("filterRiwayatCari")?.value || "").toLowerCase();
    const dStart = document.getElementById("filterRiwayatStart")?.value || "";
    const dEnd = document.getElementById("filterRiwayatEnd")?.value || "";
    const fMet = document.getElementById("filterRiwayatMetode")?.value || "";
    const fStat = document.getElementById("filterRiwayatStatus")?.value || "";

    const filtered = allTransactions.filter(t => {
        const cocokKw = (t.nama_siswa + " " + t.no_transaksi + " " + t.username_siswa).toLowerCase().includes(kw);
        const tgl = t.tanggal_transaksi ? t.tanggal_transaksi.split('T')[0] : "";
        const cocokStart = !dStart || tgl >= dStart;
        const cocokEnd = !dEnd || tgl <= dEnd;
        const cocokMet = !fMet || t.metode_pembayaran === fMet;
        const cocokStat = !fStat || t.status_transaksi === fStat;
        return cocokKw && cocokStart && cocokEnd && cocokMet && cocokStat;
    });

    if (filtered.length === 0) {
        tb.innerHTML = '<tr><td colspan="9" class="py-4 text-muted">Tidak ada riwayat transaksi yang cocok.</td></tr>';
        return;
    }

    tb.innerHTML = filtered.map(t => {
        const tglJam = new Date(t.tanggal_transaksi).toLocaleString('id-ID');
        let bdgStat = '<span class="badge bg-success">Berhasil</span>';
        if (t.status_transaksi === 'Pending') bdgStat = '<span class="badge bg-warning text-dark">⏳ Menunggu Verifikasi</span>';
        else if (t.status_transaksi === 'Refund') bdgStat = '<span class="badge bg-danger">Dibatalkan / Refund</span>';

        const btnBukti = t.bukti_bayar_url
            ? `<button class="btn btn-sm btn-info text-white fw-bold" onclick="lihatBuktiBayarOrtu('${t.id}')"><i class="fa-solid fa-image me-1"></i>Lihat</button>`
            : '<span class="text-muted small">-</span>';

        const btnApproveQris = t.status_transaksi === 'Pending'
            ? `<button class="btn btn-sm btn-success fw-bold me-1" onclick="approveQrisPending('${t.id}')"><i class="fa-solid fa-check"></i> Setujui</button>`
            : '';

        const btnRefund = t.status_transaksi === 'Berhasil'
            ? `<button class="btn btn-sm btn-outline-danger ms-1" onclick="prosesRefundTransaksi('${t.id}')" title="Batalkan / Refund"><i class="fa-solid fa-rotate-left"></i></button>`
            : '';

        return `<tr>
            <td class="fw-bold">${t.no_transaksi}</td>
            <td>${tglJam}</td>
            <td class="text-start fw-bold">${t.nama_siswa}<br><small class="text-muted">${t.username_siswa}</small></td>
            <td>${t.kelas}</td>
            <td class="fw-bold text-success">${formatRupiah(t.total_bayar)}</td>
            <td>
                <span class="badge ${t.metode_pembayaran === 'QRIS' ? 'bg-primary' : 'bg-success'}">${t.metode_pembayaran}</span><br>
                <small class="text-muted">${t.sumber_pembayaran || 'Kasir Sekolah'}</small>
            </td>
            <td>${btnBukti}</td>
            <td>${bdgStat}</td>
            <td>
                ${btnApproveQris}
                <button class="btn btn-sm btn-outline-dark" onclick="cetakUlangTransaksi('${t.id}')" title="Cetak Struk"><i class="fa-solid fa-print"></i></button>
                ${btnRefund}
            </td>
        </tr>`;
    }).join('');
};

window.lihatBuktiBayarOrtu = function(trxId) {
    const trx = allTransactions.find(t => t.id === trxId);
    if (!trx || !trx.bukti_bayar_url) return;

    document.getElementById("imgPreviewBuktiOrtu").src = trx.bukti_bayar_url;
    const areaAksi = document.getElementById("aksiVerifikasiBuktiOrtu");
    if (trx.status_transaksi === 'Pending') {
        areaAksi.innerHTML = `
            <button class="btn btn-success fw-bold w-100 py-2" onclick="bootstrap.Modal.getInstance(document.getElementById('modalPreviewBuktiOrtu')).hide(); approveQrisPending('${trx.id}')">
                <i class="fa-solid fa-check-double me-1"></i> Setujui & Sahkan Pembayaran Ini (${formatRupiah(trx.total_bayar)})
            </button>
        `;
    } else {
        areaAksi.innerHTML = `<span class="badge bg-success fs-6">Transaksi Ini Sudah Disahkan</span>`;
    }
    new bootstrap.Modal(document.getElementById("modalPreviewBuktiOrtu")).show();
};

window.approveQrisPending = async function(trxId) {
    const trx = allTransactions.find(t => t.id === trxId);
    if (!trx) return;

    const yakin = await uiConfirm(
        "Verifikasi & Setujui Pembayaran",
        `Pastikan dana sebesar ${formatRupiah(trx.total_bayar)} atas nama ${trx.nama_siswa} sudah masuk di aplikasi GoPay Merchant sekolah. Sahkan sekarang?`,
        "Ya, Sahkan Lunas",
        "btn-success"
    );
    if (!yakin) return;

    showLoadingUI(true, "Mengesahkan Pembayaran...", "Memperbarui status transaksi dan memotong sisa tagihan siswa...");
    try {
        const petugas = currentBendahara ? (currentBendahara.nama_lengkap || currentBendahara.username) : 'Bendahara';
        await apiRequest('PATCH', `payment_transactions?id=eq.${trxId}`, { status_transaksi: 'Berhasil', petugas: petugas });
        await apiRequest('PATCH', `payment_gateway_logs?transaction_id=eq.${trxId}`, { status_qris: 'Approved', verified_by: petugas, verified_at: new Date().toISOString() });

        await terapkanPotonganTagihan(trxId, trx.invoice_id);
        await catatAudit('APPROVE_PEMBAYARAN', 'payment_transactions', trx.no_transaksi, { status: 'Pending' }, { status: 'Berhasil' });

        await refreshSemuaData();
        showLoadingUI(false);
        showToast("Pembayaran berhasil disahkan!");
    } catch (e) {
        showLoadingUI(false);
        await uiAlert("Gagal", e.message, "error");
    }
};

window.cetakUlangTransaksi = async function(trxId) {
    const trx = allTransactions.find(t => t.id === trxId);
    if (!trx) return;
    showLoadingUI(true, "Memuat Struk...");
    try {
        const items = await apiRequest('GET', `payment_transaction_details?select=*&transaction_id=eq.${trxId}`);
        tampilkanStrukModal(trx, items || []);
    } finally {
        showLoadingUI(false);
    }
};

window.prosesRefundTransaksi = async function(trxId) {
    const trx = allTransactions.find(t => t.id === trxId);
    if (!trx) return;

    const alasan = await uiPrompt(
        "Pembatalan / Refund Transaksi",
        `Masukkan alasan pembatalan untuk transaksi ${trx.no_transaksi} (${trx.nama_siswa} - ${formatRupiah(trx.total_bayar)}):`,
        "Ketik alasan pembatalan..."
    );
    if (!alasan) return;

    showLoadingUI(true, "Memproses Pembatalan Transaksi...", "Mengembalikan saldo tagihan siswa...");
    try {
        const petugas = currentBendahara ? (currentBendahara.nama_lengkap || currentBendahara.username) : 'Bendahara';
        const trxDetails = await apiRequest('GET', `payment_transaction_details?select=*&transaction_id=eq.${trxId}`);
        for (const td of (trxDetails || [])) {
            const resDet = await apiRequest('GET', `invoice_details?select=*&id=eq.${td.invoice_detail_id}`);
            const invDet = Array.isArray(resDet) ? resDet[0] : null;
            if (invDet) {
                const dibayarBaru = Math.max(0, Number(invDet.jumlah_dibayar) - Number(td.nominal_dibayar));
                const sisaBaru = Number(invDet.nominal_tagihan) - dibayarBaru;
                const statusBaru = dibayarBaru <= 0 ? 'Belum Bayar' : 'Cicilan';
                await apiRequest('PATCH', `invoice_details?id=eq.${invDet.id}`, {
                    jumlah_dibayar: dibayarBaru,
                    sisa_item: sisaBaru,
                    status_item: statusBaru
                });
            }
        }

        await apiRequest('PATCH', `payment_transactions?id=eq.${trxId}`, { status_transaksi: 'Refund', keterangan: `REFUND: ${alasan}` });
        await apiRequest('POST', 'payment_refunds', [{
            transaction_id: trxId,
            no_transaksi: trx.no_transaksi,
            nominal_refund: trx.total_bayar,
            alasan: alasan,
            diotorisasi_oleh: petugas
        }]);

        await rekalkulasiHeaderInvoice(trx.invoice_id);
        await catatAudit('REFUND_TRANSAKSI', 'payment_transactions', trx.no_transaksi, { status: 'Berhasil' }, { status: 'Refund', alasan });

        await refreshSemuaData();
        showLoadingUI(false);
        showToast("Transaksi berhasil dibatalkan dan tagihan dikembalikan.", "warning");
    } catch (e) {
        showLoadingUI(false);
        await uiAlert("Gagal", e.message, "error");
    }
};

// Mengelompokkan seluruh item tunggakan berdasarkan siswa (1 Siswa = 1 Baris, Tanpa Duplikat Nama)
function kumpulkanDataTunggakanPerSiswa() {
    const fKls = document.getElementById("filterKelasTunggakan")?.value || "";
    const kw = (document.getElementById("cariTunggakanSiswa")?.value || "").toLowerCase().trim();
    const todayStr = new Date().toISOString().split('T')[0];

    const mapInv = {};
    allInvoices.forEach(i => {
        if (i.status_tagihan !== 'Dibatalkan') mapInv[i.id] = i;
    });

    const grupSiswa = new Map();

    allInvoiceDetails.forEach(d => {
        const inv = mapInv[d.invoice_id];
        if (!inv || Number(d.sisa_item) <= 0) return;

        // Filter Kelas
        if (fKls && inv.kelas.trim().toUpperCase() !== fKls.trim().toUpperCase()) return;

        const keySiswa = String(inv.username_siswa).trim().toLowerCase();
        const tglTempo = dapatkanTanggalJatuhTempoItem(d, inv);
        const isLewat = tglTempo && tglTempo < todayStr;

        if (!grupSiswa.has(keySiswa)) {
            grupSiswa.set(keySiswa, {
                invoice_id: inv.id,
                username_siswa: inv.username_siswa,
                nama_siswa: inv.nama_siswa,
                kelas: inv.kelas,
                items: [],
                total_tagihan_gabungan: 0,
                total_dibayar_gabungan: 0,
                total_sisa_gabungan: 0,
                ada_terlambat: false
            });
        }

        const dataGrup = grupSiswa.get(keySiswa);
        dataGrup.items.push({
            nama_item: d.nama_item,
            kategori: d.kategori,
            nominal_tagihan: Number(d.nominal_tagihan || 0),
            jumlah_dibayar: Number(d.jumlah_dibayar || 0),
            sisa_item: Number(d.sisa_item || 0),
            tgl_jatuh_tempo: tglTempo,
            is_lewat: isLewat
        });

        dataGrup.total_tagihan_gabungan += Number(d.nominal_tagihan || 0);
        dataGrup.total_dibayar_gabungan += Number(d.jumlah_dibayar || 0);
        dataGrup.total_sisa_gabungan += Number(d.sisa_item || 0);
        if (isLewat) dataGrup.ada_terlambat = true;
    });

    let hasil = Array.from(grupSiswa.values());

    // Filter Pencarian (Nama Siswa, NIK, atau Nama Item)
    if (kw) {
        hasil = hasil.filter(g => {
            const gabunganNamaItem = g.items.map(it => it.nama_item + " " + it.kategori).join(" ");
            return (g.nama_siswa + " " + g.username_siswa + " " + g.kelas + " " + gabunganNamaItem).toLowerCase().includes(kw);
        });
    }

    // Urutkan berdasarkan Kelas lalu Nama Siswa
    return hasil.sort((a, b) => {
        const cmpKls = (a.kelas || '').localeCompare(b.kelas || '', 'id', { numeric: true });
        if (cmpKls !== 0) return cmpKls;
        return (a.nama_siswa || '').localeCompare(b.nama_siswa || '', 'id');
    });
}

window.renderTabelTunggakan = function() {
    const tb = document.getElementById("tbPiutangTunggakan");
    if (!tb) return;

    const listGrup = kumpulkanDataTunggakanPerSiswa();

    if (listGrup.length === 0) {
        tb.innerHTML = '<tr><td colspan="9" class="py-4 text-success fw-bold">Tidak ada tunggakan siswa pada filter kelas ini.</td></tr>';
        return;
    }

    tb.innerHTML = listGrup.map((g, idx) => {
        const rincianHtml = g.items.map((it, i) => `
            <div class="d-flex justify-content-between align-items-center py-1 ${i < g.items.length - 1 ? 'border-bottom' : ''}">
                <div>
                    <span class="fw-bold text-dark">${i + 1}. ${it.nama_item}</span>
                    <span class="badge bg-secondary bg-opacity-10 text-secondary border ms-1">${it.kategori}</span>
                    ${it.tgl_jatuh_tempo ? `<small class="d-block ${it.is_lewat ? 'text-danger fw-bold' : 'text-muted'}" style="font-size:0.72rem;">Tempo: ${it.tgl_jatuh_tempo}</small>` : ''}
                </div>
                <div class="text-end ms-2" style="font-size: 0.78rem;">
                    <span class="text-muted">Tagihan: ${formatRupiah(it.nominal_tagihan)}</span> |
                    <span class="text-success">Dibayar: ${formatRupiah(it.jumlah_dibayar)}</span> |
                    <b class="text-danger">Sisa: ${formatRupiah(it.sisa_item)}</b>
                </div>
            </div>
        `).join('');

        const bdgStatus = g.ada_terlambat
            ? `<span class="badge bg-danger">Lewat Jatuh Tempo (${g.items.length} Item)</span>`
            : `<span class="badge bg-warning text-dark">Belum Lunas (${g.items.length} Item)</span>`;

        return `<tr>
            <td class="fw-bold text-muted">${idx + 1}</td>
            <td class="text-start">
                <b class="text-dark">${g.nama_siswa}</b><br>
                <small class="text-muted">ID: ${g.username_siswa}</small>
            </td>
            <td><span class="badge bg-light text-dark border fw-bold">${g.kelas}</span></td>
            <td class="text-start">${rincianHtml}</td>
            <td class="fw-bold">${formatRupiah(g.total_tagihan_gabungan)}</td>
            <td class="text-success fw-bold">${formatRupiah(g.total_dibayar_gabungan)}</td>
            <td class="fw-bolder text-danger fs-6 bg-danger bg-opacity-10">${formatRupiah(g.total_sisa_gabungan)}</td>
            <td>${bdgStatus}</td>
            <td>
                <button class="btn btn-sm btn-success fw-bold" onclick="bukaKasirUntukSiswa('${g.invoice_id}')">
                    <i class="fa-solid fa-cash-register me-1"></i> Bayar
                </button>
            </td>
        </tr>`;
    }).join('');
};

// Fungsi Download PDF Rekap Tunggakan Per Kelas (Tanpa Duplikat Nama)
window.downloadPDFRekapTunggakanKelas = async function() {
    const listGrup = kumpulkanDataTunggakanPerSiswa();
    if (listGrup.length === 0) {
        await uiAlert("Data Kosong", "Tidak ada data tunggakan siswa untuk dicetak pada kelas yang dipilih.", "warning");
        return;
    }

    const kelasTerpilih = document.getElementById("filterKelasTunggakan")?.value || "Semua Kelas";
    const thnAjaran = document.getElementById("globalFilterTahun")?.value || "2026/2027";
    const tglCetak = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    showLoadingUI(true, "Menyiapkan PDF Rekap Tunggakan...", `Menyusun laporan tunggakan kelas ${kelasTerpilih}...`);

    let grandTotalTagihan = 0;
    let grandTotalDibayar = 0;
    let grandTotalSisa = 0;

    const barisTabelHtml = listGrup.map((g, index) => {
        grandTotalTagihan += g.total_tagihan_gabungan;
        grandTotalDibayar += g.total_dibayar_gabungan;
        grandTotalSisa += g.total_sisa_gabungan;

        const subTabelItem = g.items.map((it, idxIt) => `
            <div style="display:flex; justify-content:space-between; padding: 3px 0; ${idxIt < g.items.length - 1 ? 'border-bottom:1px dashed #cbd5e1;' : ''}">
                <span><b>${idxIt + 1}. ${it.nama_item}</b> (${it.kategori})</span>
                <span>Tagihan: ${formatRupiah(it.nominal_tagihan)} | Dibayar: ${formatRupiah(it.jumlah_dibayar)} | <b style="color:#dc2626;">Sisa: ${formatRupiah(it.sisa_item)}</b></span>
            </div>
        `).join('');

        return `
            <tr>
                <td style="border:1px solid #334155; padding:6px; text-align:center;">${index + 1}</td>
                <td style="border:1px solid #334155; padding:6px;">
                    <b>${g.nama_siswa}</b><br>
                    <span style="font-size:10px; color:#475569;">ID/NIK: ${g.username_siswa}</span>
                </td>
                <td style="border:1px solid #334155; padding:6px; text-align:center; font-weight:bold;">${g.kelas}</td>
                <td style="border:1px solid #334155; padding:6px; font-size:10.5px;">${subTabelItem}</td>
                <td style="border:1px solid #334155; padding:6px; text-align:right;">${formatRupiah(g.total_tagihan_gabungan)}</td>
                <td style="border:1px solid #334155; padding:6px; text-align:right; color:#15803d;">${formatRupiah(g.total_dibayar_gabungan)}</td>
                <td style="border:1px solid #334155; padding:6px; text-align:right; font-weight:bold; color:#dc2626; background:#fef2f2;">${formatRupiah(g.total_sisa_gabungan)}</td>
            </tr>
        `;
    }).join('');

    const elemenPDF = document.createElement("div");
    elemenPDF.style.padding = "20px";
    elemenPDF.style.fontFamily = "Arial, sans-serif";
    elemenPDF.style.fontSize = "11px";
    elemenPDF.style.color = "#0f172a";
    elemenPDF.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #0f5132; padding-bottom:10px; margin-bottom:14px;">
            <div style="display:flex; align-items:center; gap:12px;">
                <img src="https://i.ibb.co.com/Ngh0x6Rr/Addawah-300x.png" style="width:50px; height:auto;">
                <div>
                    <h3 style="margin:0; font-size:16px; color:#0f5132;">${paymentSettings.school_name}</h3>
                    <div style="font-size:12px; font-weight:bold;">REKAPITULASI TUNGGAKAN SISWA PER KELAS</div>
                    <div style="font-size:11px; color:#475569;">Kelas: <b>${kelasTerpilih}</b> | Tahun Ajaran: <b>${thnAjaran}</b></div>
                </div>
            </div>
            <div style="text-align:right; font-size:11px;">
                <div>Tanggal Cetak: <b>${tglCetak}</b></div>
                <div>Jumlah Siswa Menunggak: <b>${listGrup.length} Siswa</b></div>
            </div>
        </div>

        <table style="width:100%; border-collapse:collapse; margin-bottom:15px;">
            <thead>
                <tr style="background:#0f5132; color:#ffffff; font-size:11px;">
                    <th style="border:1px solid #334155; padding:7px; width:30px;">No</th>
                    <th style="border:1px solid #334155; padding:7px; text-align:left; width:150px;">Nama Siswa</th>
                    <th style="border:1px solid #334155; padding:7px; width:65px;">Kelas</th>
                    <th style="border:1px solid #334155; padding:7px; text-align:left;">Rincian Item Belum Lunas (Tagihan | Dibayar | Sisa per Item)</th>
                    <th style="border:1px solid #334155; padding:7px; text-align:right; width:95px;">Total Tagihan</th>
                    <th style="border:1px solid #334155; padding:7px; text-align:right; width:95px;">Sudah Dibayar</th>
                    <th style="border:1px solid #334155; padding:7px; text-align:right; width:110px;">Jumlah Sisa Gabungan</th>
                </tr>
            </thead>
            <tbody>
                ${barisTabelHtml}
            </tbody>
            <tfoot>
                <tr style="background:#f1f5f9; font-weight:bold; font-size:11.5px;">
                    <td colspan="4" style="border:1px solid #334155; padding:8px; text-align:right;">GRAND TOTAL TUNGGAKAN (${kelasTerpilih.toUpperCase()}) :</td>
                    <td style="border:1px solid #334155; padding:8px; text-align:right;">${formatRupiah(grandTotalTagihan)}</td>
                    <td style="border:1px solid #334155; padding:8px; text-align:right; color:#15803d;">${formatRupiah(grandTotalDibayar)}</td>
                    <td style="border:1px solid #334155; padding:8px; text-align:right; color:#dc2626; font-size:12.5px;">${formatRupiah(grandTotalSisa)}</td>
                </tr>
            </tfoot>
        </table>

        <div style="display:flex; justify-content:flex-end; margin-top:25px;">
            <div style="text-align:center; width:200px;">
                <div>Jakarta, ${tglCetak}</div>
                <div>Bendahara Sekolah,</div>
                <br><br><br>
                <b>(${currentBendahara ? (currentBendahara.nama_lengkap || currentBendahara.username) : 'Bendahara'})</b>
            </div>
        </div>
    `;

    const namaFile = `Rekap_Tunggakan_${kelasTerpilih.replace(/\s+/g, '_')}_${thnAjaran.replace('/', '-')}.pdf`;

    try {
        await html2pdf().set({
            margin: 10,
            filename: namaFile,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).from(elemenPDF).save();

        showLoadingUI(false);
        showToast(`PDF Rekap Tunggakan (${kelasTerpilih}) berhasil diunduh!`);
    } catch (err) {
        showLoadingUI(false);
        await uiAlert("Gagal Membuat PDF", err.message, "error");
    }
};

async function muatLaporanDanAudit() {
    const { data: detailSah } = await window.supabaseClient
        .from('payment_transaction_details')
        .select('*, payment_transactions!inner(status_transaksi, kelas, jurusan, metode_pembayaran)')
        .eq('payment_transactions.status_transaksi', 'Berhasil');

    const mapKat = {};
    (detailSah || []).forEach(d => {
        const k = d.kategori || 'Lainnya';
        mapKat[k] = (mapKat[k] || 0) + Number(d.nominal_dibayar || 0);
    });

    const tbKat = document.getElementById("tbRekapPerKategori");
    tbKat.innerHTML = Object.keys(mapKat).map(k => `<tr><td class="fw-bold">${k}</td><td class="text-end fw-bold text-success">${formatRupiah(mapKat[k])}</td></tr>`).join('') || '<tr><td colspan="2" class="text-center text-muted">Belum ada data</td></tr>';

    const trxSah = allTransactions.filter(t => t.status_transaksi === 'Berhasil');
    const totalCash = trxSah.filter(t => t.metode_pembayaran === 'CASH').reduce((a, b) => a + Number(b.total_bayar), 0);
    const totalQris = trxSah.filter(t => t.metode_pembayaran === 'QRIS').reduce((a, b) => a + Number(b.total_bayar), 0);

    document.getElementById("tbRekapPerJurusanMetode").innerHTML = `
        <tr><td>Metode Tunai (CASH)</td><td class="text-end fw-bold text-success">${formatRupiah(totalCash)}</td></tr>
        <tr><td>Metode QRIS Dinamis</td><td class="text-end fw-bold text-primary">${formatRupiah(totalQris)}</td></tr>
        <tr class="table-light"><td class="fw-bold">TOTAL PEMASUKAN SAH</td><td class="text-end fw-bolder fs-6 text-success">${formatRupiah(totalCash + totalQris)}</td></tr>
    `;

    const logs = await apiRequest('GET', 'financial_audit_logs?select=*&order=waktu.desc&limit=50');
    document.getElementById("tbAuditLogs").innerHTML = (logs || []).map(l => `
        <tr>
            <td>${new Date(l.waktu).toLocaleString('id-ID')}</td>
            <td class="fw-bold">${l.dilakukan_oleh}</td>
            <td><span class="badge bg-success">${l.aksi}</span></td>
            <td>${l.entitas}</td>
            <td><code class="small">${JSON.stringify(l.nilai_sesudah)}</code></td>
        </tr>
    `).join('');
}

async function muatPengaturanQRIS() {
    try {
        const res = await apiRequest('GET', 'payment_settings?select=*&id=eq.1');
        const data = Array.isArray(res) ? res[0] : null;
        if (data) {
            paymentSettings = {
                ...paymentSettings,
                ...data,
                custom_categories: Array.isArray(data.custom_categories) && data.custom_categories.length > 0
                    ? data.custom_categories
                    : paymentSettings.custom_categories
            };
        }
    } catch (e) { console.warn(e); }
    document.getElementById("setMerchantName").value = paymentSettings.merchant_name || "SMK Addawah";
    document.getElementById("setStaticQris").value = paymentSettings.static_qris || "";
    renderPillKategoriDinamis();
}

window.simpanPengaturanQRIS = async function() {
    const merchant = document.getElementById("setMerchantName").value.trim();
    const qris = document.getElementById("setStaticQris").value.trim();
    if (!qris) {
        await uiAlert("QRIS Kosong", "Kode string QRIS Statis tidak boleh kosong.", "warning");
        return;
    }

    const btn = document.getElementById("btnSimpanQris");
    setTombolLoading(btn, true, "Menyimpan...");
    showLoadingUI(true, "Menyimpan Pengaturan QRIS...");

    try {
        paymentSettings.merchant_name = merchant;
        paymentSettings.static_qris = qris;

        await apiRequest('PATCH', 'payment_settings?id=eq.1', {
            merchant_name: merchant,
            static_qris: qris,
            custom_categories: paymentSettings.custom_categories,
            updated_by: currentBendahara ? currentBendahara.username : 'bendahara'
        });

        showLoadingUI(false);
        await uiAlert("Tersimpan!", "Pengaturan Merchant QRIS Statis berhasil diperbarui.", "success");
    } catch (e) {
        showLoadingUI(false);
        await uiAlert("Gagal Menyimpan", e.message, "error");
    } finally {
        setTombolLoading(btn, false);
    }
};

window.scanFileQrisStatis = function(input) {
    if (!input.files || !input.files[0]) return;
    showLoadingUI(true, "Membaca Kode QRIS dari Gambar...");
    const html5QrCode = new Html5Qrcode("readerQrisStatis");
    html5QrCode.scanFile(input.files[0], true)
        .then(decodedText => {
            showLoadingUI(false);
            document.getElementById("setStaticQris").value = decodedText;
            uiAlert("Berhasil Dibaca!", "Kode QRIS Statis berhasil diekstrak dari gambar. Klik tombol 'Simpan Pengaturan QRIS' untuk menyimpan.", "success");
        })
        .catch(err => {
            showLoadingUI(false);
            uiAlert("Gagal Membaca QR", "Pastikan gambar kode QR terlihat jelas: " + err, "error");
        });
};

window.mulaiKameraQrisStatis = function() {
    const html5QrCode = new Html5Qrcode("readerQrisStatis");
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 200 },
        (decodedText) => {
            document.getElementById("setStaticQris").value = decodedText;
            html5QrCode.stop();
            uiAlert("QRIS Terbaca!", "Kode QRIS Statis berhasil di-scan! Klik 'Simpan Pengaturan QRIS'.", "success");
        },
        () => {}
    );
};

// Export Excel
window.exportExcelTagihan = function() {
    const rows = allInvoices.map(i => ({
        "No Invoice": i.no_invoice,
        "Nama Siswa": i.nama_siswa,
        "ID Login / NIK": i.username_siswa,
        "Kelas": i.kelas,
        "Jurusan": parseKelasDanJurusan(i.kelas).jurusan || i.jurusan,
        "Total Tagihan": i.total_tagihan,
        "Sudah Dibayar": i.total_dibayar,
        "Sisa Tagihan": i.sisa_tagihan,
        "Jatuh Tempo": i.tgl_jatuh_tempo || '-',
        "Status": i.status_tagihan
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tagihan_Siswa");
    XLSX.writeFile(wb, "Daftar_Tagihan_Siswa_SMK_Addawah.xlsx");
};

window.exportExcelRiwayat = function() {
    const rows = allTransactions.map(t => ({
        "No Transaksi": t.no_transaksi,
        "Tanggal": new Date(t.tanggal_transaksi).toLocaleString('id-ID'),
        "Nama Siswa": t.nama_siswa,
        "Kelas": t.kelas,
        "Total Bayar": t.total_bayar,
        "Metode": t.metode_pembayaran,
        "Sumber": t.sumber_pembayaran || 'Kasir Sekolah',
        "Status": t.status_transaksi,
        "Petugas": t.petugas,
        "Keterangan": t.keterangan
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat_Transaksi");
    XLSX.writeFile(wb, "Riwayat_Transaksi_Bendahara.xlsx");
};

window.exportExcelTunggakan = function() {
    const listGrup = kumpulkanDataTunggakanPerSiswa();
    const rows = listGrup.map((g, idx) => ({
        "No": idx + 1,
        "Nama Siswa": g.nama_siswa,
        "ID Login / NIK": g.username_siswa,
        "Kelas": g.kelas,
        "Rincian Item Belum Lunas": g.items.map(it => `${it.nama_item} (Tagihan: ${it.nominal_tagihan}, Dibayar: ${it.jumlah_dibayar}, Sisa: ${it.sisa_item})`).join(" | "),
        "Total Tagihan (Gabungan)": g.total_tagihan_gabungan,
        "Sudah Dibayar (Gabungan)": g.total_dibayar_gabungan,
        "Jumlah Sisa Tunggakan (Gabungan)": g.total_sisa_gabungan
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap_Tunggakan");
    XLSX.writeFile(wb, "Rekap_Tunggakan_Siswa_SMK_Addawah.xlsx");
};