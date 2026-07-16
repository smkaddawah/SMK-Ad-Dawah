// ================= KONFIGURASI SUPABASE =================
const supabaseUrl = 'https://rniggtkxtlblpvxaycrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuaWdndGt4dGxibHB2eGF5Y3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMTYzNDcsImV4cCI6MjA5OTY5MjM0N30.vo-FGuq_QL5R9WI21jA535txSp1uZDAxzirSEk6eP44';
// NAMA VARIABEL DIUBAH MENJADI supabaseClient AGAR TIDAK BENTROK
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let dataMaster = { kelas: [], siswa: [], kamus: [] };
let myChart = null;
let globalPendingData = []; 

// ================= FITUR ANTREAN VERIFIKASI & APPROVE ALL =================

async function loadPending() {
  const tb = document.getElementById("tbPending"); 
  tb.innerHTML = "<tr><td colspan='6' class='text-center py-3'><i class='fa-solid fa-spinner fa-spin me-2'></i>Memuat data...</td></tr>";
  
  try {
    const res = await panggilAPI({ aksi: "get_pending" });
    if (res.status === "sukses" && res.data && res.data.length > 0) {
      tb.innerHTML = res.data.map(d => {
        let tombolFoto = `<span class="text-muted small"><i class="fa-solid fa-image-slash me-1"></i>Tidak ada foto</span>`;
        if (d.bukti && String(d.bukti).startsWith('data:image')) {
          tombolFoto = `<a href="${d.bukti}" target="_blank" class="btn btn-sm btn-outline-success fw-bold"><i class="fa-solid fa-image me-1"></i>Lihat Foto</a>`;
        } else if (d.bukti && String(d.bukti).startsWith('http')) {
          tombolFoto = `<a href="${d.bukti}" target="_blank" class="btn btn-sm btn-outline-success fw-bold"><i class="fa-solid fa-image me-1"></i>Lihat Foto</a>`;
        }

        return `
          <tr>
            <td>${new Date(d.tanggal).toLocaleDateString('id-ID')}</td>
            <td><b>${d.namaSiswa}</b><br><span class="badge bg-secondary">${d.kelas}</span> (${d.nisn})</td>
            <td><span class="badge bg-danger mb-1">${d.kode} - ${d.namaPelanggaran}</span><br><small class="text-muted">${d.keterangan}</small></td>
            <td>${d.pelapor}</td>
            <td>${tombolFoto}</td>
            <td>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-success" onclick="verifikasi('${d.idLog}', 'Disetujui')" title="Setujui"><i class="fa-solid fa-check"></i></button>
                <button class="btn btn-warning text-dark" onclick="verifikasi('${d.idLog}', 'Ditolak')" title="Tolak"><i class="fa-solid fa-xmark"></i></button>
                <button class="btn btn-info text-white" onclick="bukaModalEditLapor('${d.idLog}', '${d.kode}', '${d.keterangan}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-danger" onclick="hapusLaporan('${d.idLog}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    } else { 
      tb.innerHTML = "<tr><td colspan='6' class='text-center text-muted py-3'>Alhamdulillah, tidak ada laporan pending.</td></tr>"; 
    }
  } catch (err) {
    tb.innerHTML = "<tr><td colspan='6' class='text-center text-danger py-3'>Gagal mengambil data antrean dari server.</td></tr>";
  }
}

async function setujuiSemuaLaporan() {
  showAlertBS("Memeriksa Antrean...", "Sedang mengambil daftar antrean terbaru dari server...", "info");
  
  try {
    const res = await panggilAPI({ aksi: "get_pending" });
    
    if (res.status !== "sukses" || !res.data || res.data.length === 0) {
      showAlertBS("Info", "Tidak ada laporan antrean saat ini di sistem.", "info");
      return;
    }
    
    const daftarPending = res.data;
    const jumlah = daftarPending.length;

    showConfirmBS(`Apakah Anda yakin ingin menyetujui ${jumlah} laporan sekaligus? Poin seluruh siswa terkait akan otomatis bertambah!`, async () => {
      
      showAlertBS("Memproses...", `Sedang menyetujui ${jumlah} laporan secara otomatis...`, "info");
      
      let sukses = 0;
      for (let item of daftarPending) {
        let resVerif = await panggilAPI({ aksi: "verifikasi", idLog: item.idLog, keputusan: "Disetujui" });
        if (resVerif.status === "sukses") sukses++;
      }
      
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      showAlertBS("Berhasil!", `Sebanyak ${sukses} dari ${jumlah} laporan antrean telah disetujui!`, "success");
      
      loadPending();
      if (typeof loadStats === 'function') loadStats();
    });

  } catch (err) {
    showAlertBS("Error", "Terjadi kesalahan koneksi saat memeriksa antrean.", "error");
  }
}

// ================= SISTEM POPUP MURNI BOOTSTRAP 5 =================
function showAlertBS(judul, pesan, tipe = "success") {
  document.getElementById("alertTitleBS").innerText = judul;
  document.getElementById("alertTextBS").innerText = pesan;
  const icon = document.getElementById("alertIconBS");
  
  if (tipe === "success") {
    icon.className = "fa-solid fa-circle-check text-success fs-1 mb-3";
  } else if (tipe === "error" || tipe === "danger") {
    icon.className = "fa-solid fa-circle-xmark text-danger fs-1 mb-3";
  } else {
    icon.className = "fa-solid fa-circle-exclamation text-warning fs-1 mb-3";
  }
  
  new bootstrap.Modal(document.getElementById("modalAlertBS")).show();
}

function showConfirmBS(pesan, callbackYa) {
  document.getElementById("confirmTextBS").innerText = pesan;
  const modalEl = document.getElementById("modalConfirmBS");
  const modalObj = new bootstrap.Modal(modalEl);
  const btnYes = document.getElementById("btnConfirmYesBS");
  
  const newBtnYes = btnYes.cloneNode(true);
  btnYes.parentNode.replaceChild(newBtnYes, btnYes);
  
  newBtnYes.addEventListener("click", () => {
    modalObj.hide();
    if (typeof callbackYa === "function") callbackYa();
  });
  
  modalObj.show();
}

// ================= 1. INISIALISASI & TEMPLATE FORM LAPOR =================
document.addEventListener("DOMContentLoaded", () => {
  const htmlForm = generateFormLaporanHTML();
  document.getElementById("wadahFormLaporGuru").innerHTML = htmlForm("Guru");
  document.getElementById("wadahFormLaporAdmin").innerHTML = htmlForm("Admin");
  
  setupFileInput("fileBukti_Guru", "preview_Guru", "valBukti_Guru");
  setupFileInput("fileBukti_Admin", "preview_Admin", "valBukti_Admin");

  const sesiTersimpan = localStorage.getItem("sesi_addawah");
  if (sesiTersimpan) {
    try {
      const res = JSON.parse(sesiTersimpan);
      aktifkanTampilanUser(res);
    } catch (e) {
      localStorage.removeItem("sesi_addawah");
    }
  }
});

function generateFormLaporanHTML() {
  return function(idSuffix) {
    return `
      <form onsubmit="kirimLaporan(event, '${idSuffix}')">
        <div class="mb-3">
          <label class="form-label fw-bold text-primary-green">1. Pilih Kelas</label>
          <select class="form-select rounded-3" id="selectKelas_${idSuffix}" onchange="filterSiswaByKelas('${idSuffix}')" required>
            <option value="">-- Pilih Kelas --</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label fw-bold text-primary-green">2. Nama Siswa</label>
          <select class="form-select rounded-3" id="selectSiswa_${idSuffix}" onchange="aktifkanKategori('${idSuffix}')" disabled required>
            <option value="">-- Pilih Siswa (Harus isi Kelas dahulu) --</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label fw-bold text-primary-green">3. Kategori Pelanggaran</label>
          <select class="form-select rounded-3" id="selectKategori_${idSuffix}" onchange="filterPelanggaranByKategori('${idSuffix}')" disabled required>
            <option value="">-- Pilih Kategori (Harus isi Nama Siswa dahulu) --</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label fw-bold text-primary-green">4. Jenis Pelanggaran</label>
          <select class="form-select rounded-3" id="selectKamus_${idSuffix}" onchange="updateDetailPelanggaranOtomatis('${idSuffix}')" disabled required>
            <option value="">-- Pilih Jenis Pelanggaran (Harus isi Kategori dahulu) --</option>
          </select>
        </div>
        <div class="row mb-3">
          <div class="col-4">
            <label class="form-label fw-bold text-primary-green">5a. Poin</label>
            <input type="text" class="form-control rounded-3 bg-light fw-bold text-danger text-center" id="poinLapor_${idSuffix}" placeholder="0" readonly>
          </div>
          <div class="col-8">
            <label class="form-label fw-bold text-primary-green">5b. Sanksi Otomatis</label>
            <input type="text" class="form-control rounded-3 bg-light fw-bold text-dark" id="sanksiLapor_${idSuffix}" placeholder="Sanksi akan muncul otomatis..." readonly>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label fw-bold text-primary-green">6. Keterangan / Kronologi</label>
          <textarea class="form-control rounded-3" id="ket_${idSuffix}" rows="3" placeholder="Jelaskan detail kejadian..." required></textarea>
        </div>
        <div class="mb-4">
          <label class="form-label fw-bold text-primary-green">7. Bukti Foto</label>
          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="btn btn-outline-success w-100 fw-bold d-flex align-items-center justify-content-center py-2" style="cursor: pointer;">
                <i class="fa-solid fa-camera me-2 fs-5"></i> Buka Kamera
                <input type="file" id="cam_${idSuffix}" accept="image/*" capture="environment" style="display: none;" onchange="prosesFotoInput(this, '${idSuffix}')">
              </label>
            </div>
            <div class="col-6">
              <label class="btn btn-outline-secondary w-100 fw-bold d-flex align-items-center justify-content-center py-2" style="cursor: pointer;">
                <i class="fa-solid fa-images me-2 fs-5"></i> Pilih Galeri
                <input type="file" id="gal_${idSuffix}" accept="image/*" style="display: none;" onchange="prosesFotoInput(this, '${idSuffix}')">
              </label>
            </div>
          </div>
          <input type="hidden" id="valBukti_${idSuffix}">
          <img id="preview_${idSuffix}" class="preview-img mx-auto" style="max-height: 200px; display: none; border-radius: 8px; border: 2px dashed #198754; padding: 4px;">
          <div class="form-text small text-muted text-center" id="lblFoto_${idSuffix}">Belum ada foto dipilih.</div>
        </div>
        <button type="submit" class="btn btn-primary-green w-100 py-2.5 rounded-3 fw-bold shadow-sm" id="btnLapor_${idSuffix}"><i class="fa-solid fa-paper-plane me-2"></i>KIRIM LAPORAN</button>
      </form>
    `;
  };
}

function prosesFotoInput(inputEl, idSuffix) {
  const file = inputEl.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = function() {
      document.getElementById(`valBukti_${idSuffix}`).value = reader.result;
      const prev = document.getElementById(`preview_${idSuffix}`);
      prev.src = reader.result;
      prev.style.display = "block";
      document.getElementById(`lblFoto_${idSuffix}`).innerText = `Foto siap dikirim: ${file.name}`;
      document.getElementById(`lblFoto_${idSuffix}`).className = "form-text small text-success fw-bold text-center";
    };
    reader.readAsDataURL(file);
  }
}

function setupFileInput(inputId, previewId, hiddenId) {
  const fileInput = document.getElementById(inputId);
  if (!fileInput) return;
  fileInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = function() {
        document.getElementById(hiddenId).value = reader.result;
        const prev = document.getElementById(previewId);
        prev.src = reader.result;
        prev.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });
}

// ================= 2. FUNGSI LOGIN & NAVIGASI =================
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById("btnLogin");
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Memproses...';
  
  const role = document.getElementById("loginRole").value;
  const username = document.getElementById("loginUser").value;
  const password = document.getElementById("loginPass").value;
  
  try {
    const res = await panggilAPI({ aksi: "login", role, username, password });
    if (res.status === "sukses") {
      localStorage.setItem("sesi_addawah", JSON.stringify(res));
      aktifkanTampilanUser(res);
      showAlertBS("Login Berhasil!", `Selamat datang kembali, ${res.nama}!`, "success");
    } else {
      showAlertBS("Login Gagal!", res.pesan, "error");
    }
  } catch(err) { showAlertBS("Error Server", "Terjadi kesalahan koneksi sistem.", "error"); }
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket me-2"></i>Masuk ke Sistem';
}

function aktifkanTampilanUser(res) {
  currentUser = res;
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("userBadge").style.setProperty("display", "flex", "important");
  document.getElementById("txtNamaUser").innerText = `${res.nama} (${res.role.toUpperCase()})`;
  
  if (res.role === "siswa") {
    document.getElementById("siswaSection").style.display = "block";
    document.getElementById("siswaPoin").innerText = res.poin;
    const bdg = document.getElementById("siswaStatus");
    if (res.poin >= 100) { bdg.className = "badge bg-danger fs-6 px-3 py-2 rounded-pill"; bdg.innerText = "SP 3 / DIKEMBALIKAN"; }
    else if (res.poin >= 75) { bdg.className = "badge bg-warning text-dark fs-6 px-3 py-2 rounded-pill"; bdg.innerText = "SP 2 (Peringatan Keras)"; }
    else if (res.poin >= 50) { bdg.className = "badge bg-warning text-dark fs-6 px-3 py-2 rounded-pill"; bdg.innerText = "SP 1 (Peringatan)"; }
    else { bdg.className = "badge bg-success fs-6 px-3 py-2 rounded-pill"; bdg.innerText = "Aman (Berkelakuan Baik)"; }
    loadRiwayatSiswa(res.identitas);
    initDashboardAbsensi(res);
    switchSiswaTab('profil');
  } else if (res.role === "guru") {
    document.getElementById("guruSection").style.display = "block";
    loadFormDataMaster();
    initDashboardAbsensi(res);
    switchGuruTab('profil');
  } else if (res.role === "admin") {
    document.getElementById("adminSection").style.display = "block";
    loadFormDataMaster();
    loadStats();
  } else if (res.role === "walikelas") {
    document.getElementById("walikelasSection").style.display = "block";
    // Fungsi ini akan kita buat di walikelas.js
    initWaliKelas(res.kelas); 
  }
}

function logout() {
  showConfirmBS("Apakah Anda yakin ingin keluar dari sistem?", () => {
    localStorage.removeItem("sesi_addawah");
    location.reload();
  });
}

function switchAdminTab(tab, judulMenu) {
  if (judulMenu && document.getElementById("judulMenuAktif")) {
    document.getElementById("judulMenuAktif").innerText = judulMenu;
  }

  document.querySelectorAll("#adminTabs .nav-link").forEach(el => el.classList.remove("active"));
  document.querySelectorAll("#adminSection div[id^='tab']").forEach(el => el.style.display = "none");
  
  if (tab === 'stats') { document.querySelector("#adminTabs li:nth-child(1) a").classList.add("active"); document.getElementById("tabStats").style.display = "block"; loadStats(); }
  if (tab === 'verif') { document.querySelector("#adminTabs li:nth-child(2) a").classList.add("active"); document.getElementById("tabVerif").style.display = "block"; loadPending(); }
  if (tab === 'lapor') { document.querySelector("#adminTabs li:nth-child(3) a").classList.add("active"); document.getElementById("tabLapor").style.display = "block"; }
  if (tab === 'siswa') { document.querySelector("#adminTabs li:nth-child(4) a").classList.add("active"); document.getElementById("tabSiswa").style.display = "block"; loadAllSiswa(); }
  if (tab === 'kamus') { document.querySelector("#adminTabs li:nth-child(5) a").classList.add("active"); document.getElementById("tabKamus").style.display = "block"; loadKamus(); }
  // Di dalam fungsi switchAdminTab(tab, judul) { ...
  if (tab === 'rekapabsen') { document.querySelector("#adminTabs li:nth-child(10) a").classList.add("active"); document.getElementById("tabRekapAbsen").style.display = "block"; aturInputRekapAbsen(); }
  if (tab === 'rekap') { 
    document.querySelector("#adminTabs li:nth-child(7) a").classList.add("active"); 
    document.getElementById("tabRekap").style.display = "block"; 
    persiapkanMenuRekap(); 
  }
  if (tab === 'absensi') { document.querySelector("#adminTabs li:nth-child(8) a").classList.add("active"); document.getElementById("tabAbsensi").style.display = "block"; loadLogAbsenAdminHariIni(); }
  if (tab === 'cetakqr') { document.querySelector("#adminTabs li:nth-child(9) a").classList.add("active"); document.getElementById("tabCetakQR").style.display = "block"; filterCetakQr(); }
  if (tab === 'guru') { 
        document.querySelector("#adminTabs li:nth-child(5) a").classList.add("active"); // Sesuaikan angka child jika warnanya tidak nyala
        document.getElementById("tabGuru").style.display = "block"; 
        loadAllGuru(); 
    }

  const slideEl = document.getElementById('slidePanelAdmin');
  const slideInstance = bootstrap.Offcanvas.getInstance(slideEl);
  if (slideInstance) slideInstance.hide();
}

function switchSiswaTab(tab) {
    document.querySelectorAll("#siswaTabs .nav-link").forEach(el => el.classList.remove("active"));
    document.getElementById("siswaTabProfil").style.display = tab === 'profil' ? 'block' : 'none';
    document.getElementById("siswaTabLogAbsen").style.display = tab === 'logabsen' ? 'block' : 'none';
    document.getElementById("siswaTabPelanggaran").style.display = tab === 'pelanggaran' ? 'block' : 'none';
    event.currentTarget.classList.add("active");
}

function switchGuruTab(tab) {
    document.querySelectorAll("#guruTabs .nav-link").forEach(el => el.classList.remove("active"));
    document.getElementById("guruTabProfil").style.display = tab === 'profil' ? 'block' : 'none';
    document.getElementById("guruTabLogAbsen").style.display = tab === 'logabsen' ? 'block' : 'none';
    document.getElementById("guruTabLapor").style.display = tab === 'lapor' ? 'block' : 'none';
    event.currentTarget.classList.add("active");
}

// ================= 3. FILTER BERCABANG (CASCADING DROPDOWN) =================
async function loadFormDataMaster() {
  const res = await panggilAPI({ aksi: "get_form_data" });
  if (res.status === "sukses") {
    dataMaster = res;
    ["Guru", "Admin"].forEach(suf => {
      const selKelas = document.getElementById(`selectKelas_${suf}`);
      if (selKelas) {
        selKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>' + res.kelas.map(k => `<option value="${k}">${k}</option>`).join("");
      }
    });
  }
}

function filterSiswaByKelas(idSuffix) {
  const kelasDipilih = document.getElementById(`selectKelas_${idSuffix}`).value;
  const selectSiswa = document.getElementById(`selectSiswa_${idSuffix}`);
  const selectKategori = document.getElementById(`selectKategori_${idSuffix}`);
  const selectKamus = document.getElementById(`selectKamus_${idSuffix}`);
  const poinLapor = document.getElementById(`poinLapor_${idSuffix}`);
  const sanksiLapor = document.getElementById(`sanksiLapor_${idSuffix}`);
  
  selectSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>'; selectSiswa.disabled = true;
  selectKategori.innerHTML = '<option value="">-- Pilih Kategori (Harus isi Nama Siswa dahulu) --</option>'; selectKategori.disabled = true;
  selectKamus.innerHTML = '<option value="">-- Pilih Jenis Pelanggaran (Harus isi Kategori dahulu) --</option>'; selectKamus.disabled = true;
  poinLapor.value = ""; if (sanksiLapor) sanksiLapor.value = "";
  
  if (!kelasDipilih) return;
  
  const siswaTerfilter = dataMaster.siswa.filter(s => s.kelas === kelasDipilih);
  selectSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>' + 
    siswaTerfilter.map(s => `<option value="${s.nisn}">${s.nisn} - ${s.nama}</option>`).join("");
  selectSiswa.disabled = false;
}

function aktifkanKategori(idSuffix) {
  const nisnDipilih = document.getElementById(`selectSiswa_${idSuffix}`).value;
  const selectKategori = document.getElementById(`selectKategori_${idSuffix}`);
  const selectKamus = document.getElementById(`selectKamus_${idSuffix}`);
  const poinLapor = document.getElementById(`poinLapor_${idSuffix}`);
  const sanksiLapor = document.getElementById(`sanksiLapor_${idSuffix}`);
  
  selectKategori.innerHTML = '<option value="">-- Pilih Kategori --</option>'; selectKategori.disabled = true;
  selectKamus.innerHTML = '<option value="">-- Pilih Jenis Pelanggaran (Harus isi Kategori dahulu) --</option>'; selectKamus.disabled = true;
  poinLapor.value = ""; if (sanksiLapor) sanksiLapor.value = "";
  
  if (!nisnDipilih) return;
  
  const kategoriUnik = [];
  const mapNamaKategori = {
    'A': 'A. Keterlambatan', 'B': 'B. Kehadiran', 'C': 'C. Kegiatan Belajar',
    'D': 'D. Seragam', 'E': 'E. Kepribadian', 'F': 'F. Ketertiban',
    'G': 'G. Merokok', 'H': 'H. Pornografi', 'I': 'I. Senjata Tajam',
    'J': 'J. Narkoba dan Minuman Keras', 'K': 'K. Perkelahian atau Tawuran',
    'L': 'L. Prakerin', 'M': 'M. Intimidasi Atau Ancaman Kekerasan'
  };
  
  dataMaster.kamus.forEach(km => {
    if (km.kode) {
      const hurufAwal = km.kode.trim().charAt(0).toUpperCase();
      if (hurufAwal && !kategoriUnik.includes(hurufAwal)) kategoriUnik.push(hurufAwal);
    }
  });
  
  kategoriUnik.sort();
  selectKategori.innerHTML = '<option value="">-- Pilih Kategori --</option>' + 
    kategoriUnik.map(k => `<option value="${k}">${mapNamaKategori[k] || `Kategori ${k}`}</option>`).join("");
  selectKategori.disabled = false;
}

function filterPelanggaranByKategori(idSuffix) {
  const katDipilih = document.getElementById(`selectKategori_${idSuffix}`).value;
  const selectKamus = document.getElementById(`selectKamus_${idSuffix}`);
  const poinLapor = document.getElementById(`poinLapor_${idSuffix}`);
  const sanksiLapor = document.getElementById(`sanksiLapor_${idSuffix}`);
  
  selectKamus.innerHTML = '<option value="">-- Pilih Jenis Pelanggaran --</option>'; selectKamus.disabled = true;
  poinLapor.value = ""; if (sanksiLapor) sanksiLapor.value = "";
  if (!katDipilih) return;
  
  const kamusTerfilter = dataMaster.kamus.filter(km => km.kode && km.kode.trim().charAt(0).toUpperCase() === katDipilih);
  selectKamus.innerHTML = '<option value="">-- Pilih Jenis Pelanggaran --</option>' + 
    kamusTerfilter.map(km => `<option value="${km.kode}">${km.kode} - ${km.nama}</option>`).join("");
  selectKamus.disabled = false;
}

function updateDetailPelanggaranOtomatis(idSuffix) {
  const kodeDipilih = document.getElementById(`selectKamus_${idSuffix}`).value;
  const poinLapor = document.getElementById(`poinLapor_${idSuffix}`);
  const sanksiLapor = document.getElementById(`sanksiLapor_${idSuffix}`);
  
  if (!kodeDipilih) { poinLapor.value = ""; if (sanksiLapor) sanksiLapor.value = ""; return; }
  
  const itemKamus = dataMaster.kamus.find(km => km.kode === kodeDipilih);
  if (itemKamus) {
    poinLapor.value = itemKamus.bobot + " Poin";
    if (sanksiLapor) sanksiLapor.value = itemKamus.sanksi || "Sanksi sesuai aturan";
  }
}

// ================= 4. KIRIM LAPORAN =================
async function kirimLaporan(e, idSuffix) {
  e.preventDefault();
  const btn = document.getElementById(`btnLapor_${idSuffix}`);
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Mengirim Laporan...';
  
  const nisn = document.getElementById(`selectSiswa_${idSuffix}`).value;
  const kode = document.getElementById(`selectKamus_${idSuffix}`).value;
  const keterangan = document.getElementById(`ket_${idSuffix}`).value;
  const bukti = document.getElementById(`valBukti_${idSuffix}`).value || "Tidak ada bukti foto";
  
  if (!nisn || !kode) {
    showAlertBS("Perhatian!", "Pilih data dengan benar!", "warning");
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane me-2"></i>KIRIM LAPORAN'; 
    return;
  }

  const res = await panggilAPI({ aksi: "lapor", nisn, kode, keterangan, bukti, pelapor: currentUser.nama });
  if (res.status === "sukses") {
    showAlertBS("Berhasil Terkirim!", "Laporan berhasil masuk antrean verifikasi.", "success");
    e.target.reset();
    document.getElementById(`preview_${idSuffix}`).style.display = "none";
    document.getElementById(`selectSiswa_${idSuffix}`).disabled = true;
    document.getElementById(`selectKategori_${idSuffix}`).disabled = true;
    document.getElementById(`selectKamus_${idSuffix}`).disabled = true;
    document.getElementById(`poinLapor_${idSuffix}`).value = "";
    if (document.getElementById(`sanksiLapor_${idSuffix}`)) document.getElementById(`sanksiLapor_${idSuffix}`).value = "";
  } else { showAlertBS("Gagal Mengirim", res.pesan, "error"); }
  
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane me-2"></i>KIRIM LAPORAN';
}

// ================= 5. ADMIN: STATISTIK & KELOLA =================
async function loadStats() {
  const res = await panggilAPI({ aksi: "get_stats" });
  if (res.status === "sukses") {
    document.getElementById("statTotalSiswa").innerText = res.totalSiswa;
    document.getElementById("statPending").innerText = res.laporanPending;
    document.getElementById("statKritis").innerText = res.siswaKritis;
    
    const wadahCard = document.getElementById("wadahCardKelas");
    wadahCard.innerHTML = Object.keys(res.perKelas).map(kls => `
      <div class="col-6 col-md-4">
        <div class="card bg-white border-0 shadow-sm p-3 text-center border-start border-success border-4 rounded-3">
          <span class="text-muted small fw-bold">KELAS ${kls}</span>
          <h3 class="fw-bold text-primary-green my-1">${res.perKelas[kls]}</h3>
          <span class="small text-secondary">Pelanggaran</span>
        </div>
      </div>
    `).join("");
    
    const ctx = document.getElementById("chartPelanggaran").getContext("2d");
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: res.grafikLabel.length ? res.grafikLabel : ["Belum ada data"],
        datasets: [{ label: 'Jumlah Pelanggaran', data: res.grafikData.length ? res.grafikData : [0], borderColor: '#198754', backgroundColor: 'rgba(25,135,84,0.1)', fill: true, tension: 0.3 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }
}

async function verifikasi(idLog, keputusan) {
  showConfirmBS(`Apakah Anda yakin ingin mengubah status laporan ini menjadi "${keputusan}"?`, async () => {
    const res = await panggilAPI({ aksi: "verifikasi", idLog, keputusan });
    if (res.status === "sukses") { showAlertBS("Berhasil", `Laporan telah ${keputusan.toLowerCase()}`, "success"); loadPending(); }
  });
}

async function hapusLaporan(idLog) {
  showConfirmBS("Apakah Anda yakin ingin menghapus laporan ini?", async () => {
    const res = await panggilAPI({ aksi: "hapus_laporan", idLog });
    if (res.status === "sukses") { showAlertBS("Terhapus!", "Laporan berhasil dihapus.", "success"); loadPending(); }
  });
}

function bukaModalEditLapor(idLog, kode, ket) {
  document.getElementById("editIdLog").value = idLog;
  document.getElementById("editKodeLapor").value = kode;
  document.getElementById("editKetLapor").value = ket;
  new bootstrap.Modal(document.getElementById("modalEditLapor")).show();
}

async function simpanEditLaporan() {
  const idLog = document.getElementById("editIdLog").value;
  const kode = document.getElementById("editKodeLapor").value;
  const keterangan = document.getElementById("editKetLapor").value;
  const res = await panggilAPI({ aksi: "edit_laporan", idLog, kode, keterangan });
  if (res.status === "sukses") {
    bootstrap.Modal.getInstance(document.getElementById("modalEditLapor")).hide();
    showAlertBS("Sukses", "Laporan berhasil diperbarui", "success"); loadPending();
  }
}

// ================= 7. ADMIN: KELOLA SISWA =================
let globalDataAllSiswa = [];

async function loadAllSiswa() {
  const tb = document.getElementById("tbAllSiswa"); tb.innerHTML = "<tr><td colspan='7' class='text-center py-3'>Memuat...</td></tr>";
  const res = await panggilAPI({ aksi: "get_all_siswa" });
  if (res.status === "sukses") {
    globalDataAllSiswa = res.data;
    let selectKelas = document.getElementById("filterSiswaKelas");
    if (selectKelas) {
      let kelasUnik = [...new Set(globalDataAllSiswa.map(s => s.kelas))].sort();
      selectKelas.innerHTML = '<option value="">-- Tampilkan Semua Kelas --</option>' + kelasUnik.map(k => `<option value="${k}">${k}</option>`).join("");
    }
    filterTabelSiswa();
  }
}

function filterTabelSiswa() {
  const tb = document.getElementById("tbAllSiswa");
  const fKelas = document.getElementById("filterSiswaKelas").value;
  const fSP = document.getElementById("filterSiswaSP").value;
  
  let siswaTerfilter = globalDataAllSiswa.filter(s => {
    let cocokKelas = fKelas === "" || s.kelas === fKelas;
    let statusSP = "Aman";
    if (s.poin >= 100) statusSP = "SP 3";
    else if (s.poin >= 75) statusSP = "SP 2";
    else if (s.poin >= 50) statusSP = "SP 1";
    let cocokSP = fSP === "" || statusSP === fSP;
    return cocokKelas && cocokSP;
  });
  
  if (siswaTerfilter.length === 0) { tb.innerHTML = "<tr><td colspan='7' class='text-center text-muted py-3'>Tidak ada data siswa yang cocok.</td></tr>"; return; }
  
  tb.innerHTML = siswaTerfilter.map(s => {
    let bdg = '<span class="badge bg-success">Aman</span>';
    let tombolCetakSP = '';
    if (s.poin >= 100) { bdg = '<span class="badge bg-danger">SP 3</span>'; tombolCetakSP = `<button class="btn btn-sm btn-danger fw-bold me-1" onclick="cetakSuratSP('${s.nisn}', '${s.nama}', '${s.kelas}', ${s.poin}, 'SP 3')">SP 3</button>`; }
    else if (s.poin >= 75) { bdg = '<span class="badge bg-warning text-dark">SP 2</span>'; tombolCetakSP = `<button class="btn btn-sm btn-warning text-dark fw-bold me-1" onclick="cetakSuratSP('${s.nisn}', '${s.nama}', '${s.kelas}', ${s.poin}, 'SP 2')">SP 2</button>`; }
    else if (s.poin >= 50) { bdg = '<span class="badge bg-warning text-dark">SP 1</span>'; tombolCetakSP = `<button class="btn btn-sm btn-warning text-dark fw-bold me-1" onclick="cetakSuratSP('${s.nisn}', '${s.nama}', '${s.kelas}', ${s.poin}, 'SP 1')">SP 1</button>`; }
    
    return `<tr>
      <td><input type="checkbox" class="checkbox-siswa" value="${s.nisn}" onclick="updateTombolHapusMassal()"></td>
      <td><b>${s.nisn}</b></td><td>${s.nama}</td><td><span class="badge bg-secondary">${s.kelas}</span></td><td><b class="text-danger">${s.poin}</b></td><td>${bdg}</td>
      <td>
        ${tombolCetakSP}
        <button class="btn btn-sm btn-outline-info me-1" onclick="bukaModalSiswa('edit', '${s.nisn}', '${s.nama}', '${s.kelas}', '${s.password || 123456}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="hapusSiswa('${s.nisn}')"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  }).join("");
}

function resetFilterSiswa() { document.getElementById("filterSiswaKelas").value = ""; document.getElementById("filterSiswaSP").value = ""; filterTabelSiswa(); }

function cetakSuratSP(nisn, nama, kelas, poin, tingkatSP) {
  if (typeof window.jspdf === 'undefined') {
    showAlertBS("Memuat Mesin Vektor...", "Sedang menyiapkan modul cetak surat resmi...", "info");
    let script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = function() { eksekusiCetakSP(nisn, nama, kelas, poin, tingkatSP); };
    document.head.appendChild(script);
  } else { eksekusiCetakSP(nisn, nama, kelas, poin, tingkatSP); }

  function eksekusiCetakSP(nisn, nama, kelas, poin, tingkatSP) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4'); 
    let tglIndo = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    let namaFile = `Surat_Peringatan_${tingkatSP.replace(' ', '_')}_${nama.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    
    let imgKop = new Image(); imgKop.crossOrigin = "Anonymous"; imgKop.src = "https://i.ibb.co.com/LXG3HPx2/kop.png";
    let renderSP = function(kopSukses) {
      if (kopSukses) { try { doc.addImage(imgKop, 'PNG', 15, 10, 180, 25); doc.setLineWidth(0.6); doc.line(15, 37, 195, 37); } catch(e) {} }
      
      doc.setFont("times", "bold"); doc.setFontSize(14);
      doc.text(`SURAT PERINGATAN (${tingkatSP.toUpperCase()})`, 105, 48, { align: "center" });
      doc.setFontSize(11); doc.text(`Nomor: 045 / SP / SMK-AD / ${new Date().getFullYear()}`, 105, 54, { align: "center" });
      
      doc.setFont("times", "normal");
      doc.text("Yang bertanda tangan di bawah ini Kepala Sekolah / Guru BK SMK Ad-Da'Wah Jakarta, memberitahukan kepada Orang Tua / Wali murid dari siswa:", 20, 68, { maxWidth: 170, align: "justify" });
      
      doc.setFont("times", "bold");
      doc.text("Nama Lengkap", 25, 83); doc.text(`:  ${nama}`, 65, 83);
      doc.text("NISN", 25, 90); doc.text(`:  ${nisn}`, 65, 90);
      doc.text("Kelas", 25, 97); doc.text(`:  ${kelas}`, 65, 97);
      doc.text("Total Poin Pelanggaran", 25, 104); doc.setTextColor(220, 53, 69); doc.text(`:  ${poin} Poin`, 65, 104);
      doc.setTextColor(0, 0, 0);
      
      doc.setFont("times", "normal");
      let isiKeterangan = `Sehubungan dengan akumulasi poin pelanggaran tata tertib sekolah yang telah mencapai angka ${poin} Poin, maka melalui surat ini pihak sekolah menerbitkan ${tingkatSP} kepada siswa yang bersangkutan.\n\nKami memohon kerja sama Bapak/Ibu selaku Orang Tua / Wali agar dapat memberikan bimbingan, pengawasan, serta pembinaan lebih lanjut di rumah.`;
      
      if (tingkatSP === "SP 3") isiKeterangan += `\n\nMengingat poin pelanggaran telah melampaui batas maksimal toleransi sekolah (100+ Poin), maka dengan berat hati siswa tersebut KAMI KEMBALIKAN KEPADA ORANG TUA / WALI (DIKELUARKAN).`;
      
      doc.text(isiKeterangan, 20, 118, { maxWidth: 170, align: "justify", lineHeightFactor: 1.5 });
      
      let yTTD = 190;
      doc.text(`Jakarta, ${tglIndo}`, 145, yTTD, { align: "center" });
      doc.text("Mengetahui,", 50, yTTD + 10, { align: "center" }); doc.text("Orang Tua / Wali Murid,", 50, yTTD + 16, { align: "center" }); doc.text("( ............................................ )", 50, yTTD + 45, { align: "center" });
      doc.text("Guru BK / Kesiswaan,", 145, yTTD + 16, { align: "center" }); doc.text("( ............................................ )", 145, yTTD + 45, { align: "center" });
      doc.setFont("times", "bold"); doc.text("Kepala SMK Ad-Da'Wah Jakarta", 105, yTTD + 60, { align: "center" });
      doc.setFont("times", "normal"); doc.text("( ............................................ )", 105, yTTD + 85, { align: "center" });
      
      doc.save(namaFile);
    };
    if (imgKop.complete) renderSP(true); else { imgKop.onload = () => renderSP(true); imgKop.onerror = () => renderSP(false); }
  }
}

function bukaModalSiswa(tipe, nisn="", nama="", kelas="", pass="123456") {
  document.getElementById("judulModalSiswa").innerText = tipe === 'tambah' ? 'Tambah Siswa Manual' : 'Edit Data Siswa';
  document.getElementById("editNisnLama").value = tipe === 'edit' ? nisn : '';
  document.getElementById("formNisn").value = nisn;
  document.getElementById("formNama").value = nama;
  document.getElementById("formKelas").value = kelas;
  document.getElementById("formPassword").value = pass;
  new bootstrap.Modal(document.getElementById("modalSiswa")).show();
}

async function simpanSiswaManual() {
  const nisnLama = document.getElementById("editNisnLama").value;
  const nisnBaru = document.getElementById("formNisn").value;
  const nama = document.getElementById("formNama").value;
  const kelas = document.getElementById("formKelas").value;
  const password = document.getElementById("formPassword").value;
  
  if (!nisnBaru || !nama || !kelas) { showAlertBS("Error", "Semua kolom wajib diisi!", "warning"); return; }
  
  let res;
  if (nisnLama) res = await panggilAPI({ aksi: "edit_siswa", nisnLama, nisnBaru, nama, kelas, password });
  else res = await panggilAPI({ aksi: "add_siswa_manual", nisn: nisnBaru, nama, kelas, password });
  
  if (res.status === "sukses") {
    bootstrap.Modal.getInstance(document.getElementById("modalSiswa")).hide();
    showAlertBS("Berhasil Disimpan!", "Data siswa berhasil diupdate di dalam database.", "success"); loadAllSiswa();
  } else { showAlertBS("Gagal Menyimpan", res.pesan, "error"); }
}

async function hapusSiswa(nisn) {
  showConfirmBS(`Apakah Anda yakin ingin menghapus data siswa dengan NISN ${nisn}?`, async () => {
    const res = await panggilAPI({ aksi: "hapus_siswa", nisn });
    if (res.status === "sukses") { showAlertBS("Terhapus!", "Data siswa berhasil dihapus.", "success"); loadAllSiswa(); }
  });
}

async function prosesTahunBaru() {
  showConfirmBS("Apakah Anda yakin ingin memproses Kenaikan Kelas?", async () => {
    const res = await panggilAPI({ aksi: "kenaikan_kelas" });
    if (res.status === "sukses") { showAlertBS("Sukses Kenaikan Kelas!", "Data siswa berhasil diperbarui.", "success"); loadAllSiswa(); }
  });
}

// ================= 8. FUNGSI LAINNYA =================
async function loadKamus() {
  const tb = document.getElementById("tbKamus"); tb.innerHTML = '<tr><td colspan="4" class="text-center py-3"><i class="fa-solid fa-spinner fa-spin me-2"></i>Memuat Kamus...</td></tr>';
  try {
    const res = await panggilAPI({ aksi: "get_kamus" });
    if (res.status === "sukses" && res.data.length > 0) {
      tb.innerHTML = res.data.map(k => `
        <tr>
          <td class="text-center fw-bold text-primary-green">${k.kode}</td><td class="fw-medium">${k.nama}</td>
          <td class="text-center"><span class="badge bg-danger px-3 py-2 fs-6">+${k.bobot} Poin</span></td>
          <td><span class="badge bg-warning text-dark text-wrap text-start lh-base p-2 w-100"><i class="fa-solid fa-gavel me-1"></i>${k.sanksi || 'Sanksi sesuai aturan'}</span></td>
        </tr>
      `).join("");
    } else { tb.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Data kamus masih kosong.</td></tr>'; }
  } catch (err) { tb.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-3">Gagal mengambil data dari server.</td></tr>'; }
}

async function loadRiwayatSiswa(nisn) {
  const tb = document.getElementById("tbRiwayatSiswa");
  const res = await panggilAPI({ aksi: "get_riwayat", nisn });
  if (res.status === "sukses" && res.data.length > 0) {
    tb.innerHTML = res.data.map(r => `
      <tr>
        <td>${new Date(r.tanggal).toLocaleDateString('id-ID')}</td><td><b>${r.namaPelanggaran}</b></td><td><span class="badge bg-danger">+${r.bobot}</span></td><td>${r.pelapor}</td>
        <td>${r.bukti && r.bukti.startsWith('data:image') ? `<a href="${r.bukti}" target="_blank" class="btn btn-sm btn-outline-success fw-bold"><i class="fa-solid fa-image me-1"></i>Foto</a>` : 'Tidak ada foto'}</td>
      </tr>
    `).join("");
  } else { tb.innerHTML = "<tr><td colspan='5' class='text-center text-muted py-3'>Belum ada riwayat pelanggaran. Pertahankan!</td></tr>"; }
}

// ================= FITUR REKAP PDF TIAP KELAS =================
function persiapkanMenuRekap() {
    let selectKelas = document.getElementById("filterRekapKelas"); selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
    if (dataMaster && dataMaster.kelas && dataMaster.kelas.length > 0) { dataMaster.kelas.forEach(k => { selectKelas.innerHTML += `<option value="${k}">${k}</option>`; }); }
    const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    let blnSekarang = bulanIndo[new Date().getMonth()];
    document.getElementById("filterRekapBulan").value = blnSekarang;
    document.getElementById("tglCetakSekarang").innerText = `${new Date().getDate()} ${blnSekarang} ${new Date().getFullYear()}`;
    document.getElementById("lblRekapTahun").innerText = new Date().getFullYear();
    tampilkanPreviewRekap();
}

async function tampilkanPreviewRekap(kelasOverride, bulanOverride) {
   let kelasPilih = kelasOverride || document.getElementById("filterRekapKelas").value;
    let bulanPilih = bulanOverride || document.getElementById("filterRekapBulan").value;
    document.getElementById("lblRekapKelas").innerText = kelasPilih || "..."; document.getElementById("lblttdKelas").innerText = kelasPilih || "..."; document.getElementById("lblRekapBulan").innerText = bulanPilih || "...";
    let tbody = document.getElementById("tbRekapSiswaPDF"); tbody.innerHTML = "";
    if (!kelasPilih) { tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Silakan pilih kelas terlebih dahulu pada filter di atas...</td></tr>'; return; }
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><i class="fa-solid fa-spinner fa-spin me-2"></i>Mengambil rincian catatan pelanggaran dari server...</td></tr>';
    
    try {
        const res = await panggilAPI({ aksi: "get_rekap_laporan", kelas: kelasPilih, bulan: bulanPilih });
        if (res.status === "sukses" && res.data.length > 0) {
            tbody.innerHTML = "";
            let groupedData = {};
            res.data.forEach(item => {
                if (!groupedData[item.nisn]) groupedData[item.nisn] = { namaSiswa: item.namaSiswa, nisn: item.nisn, totalPoin: 0, logs: [] };
                groupedData[item.nisn].logs.push(item); groupedData[item.nisn].totalPoin += (parseInt(item.poin) || 0);
            });
            let no = 1;
            for (let nisn in groupedData) {
                let siswa = groupedData[nisn]; let jumlahPelanggaran = siswa.logs.length;
                siswa.logs.forEach((r, idx) => {
                    let tglIndo = new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                    let teksBukti = '-'; let buktiClean = String(r.bukti || "").trim();
                    if (buktiClean.startsWith('data:image') || buktiClean.startsWith('http')) teksBukti = `<a href="${buktiClean}" target="_blank" style="color: #0f5132; text-decoration: underline; font-weight: bold;">[ Foto ]</a>`;
                    else if (buktiClean && buktiClean !== "Tidak ada bukti foto") teksBukti = `${buktiClean}`;
                    let cellBase = 'border: 1px solid #000000 !important; padding: 8px 10px !important; background-color: #ffffff !important; font-size: 10.5pt; line-height: 1.4; vertical-align: middle;';
                    let rowHtml = '<tr style="page-break-inside: avoid; background-color: #ffffff;">';
                    if (idx === 0) {
                        rowHtml += `<td class="text-center" style="${cellBase} width: 5%; text-align: center;" rowspan="${jumlahPelanggaran}">${no}</td>`;
                        rowHtml += `<td style="${cellBase} width: 20%;" rowspan="${jumlahPelanggaran}"><b>${siswa.namaSiswa}</b><br><span style="font-size: 8.5pt; color: #444;">NISN: ${siswa.nisn}</span></td>`;
                    }
                    rowHtml += `<td class="text-center" style="${cellBase} width: 12%; text-align: center;">${tglIndo}</td>`;
                    rowHtml += `<td style="${cellBase} width: 35%;"><b>${r.kode} - ${r.namaPelanggaran}</b><br><span style="font-size: 9pt; color: #333;">Kronologi: ${r.keterangan}</span></td>`;
                    rowHtml += `<td class="text-center" style="${cellBase} width: 8%; text-align: center; color: #dc3545; font-weight: bold;">+${r.poin}</td>`;
                    if (idx === 0) {
                        rowHtml += `<td class="text-center" style="${cellBase} width: 10%; text-align: center; background-color: #fffaf0 !important;" rowspan="${jumlahPelanggaran}">
                            <span style="font-size: 13pt; font-weight: bold; color: #b02a37;">${siswa.totalPoin}</span><br><span style="font-size: 7.5pt; color: #666; text-transform: uppercase;">Total Poin</span>
                        </td>`;
                    }
                    rowHtml += `<td class="text-center" style="${cellBase} width: 10%; text-align: center;">${teksBukti}</td></tr>`;
                    tbody.innerHTML += rowHtml;
                });
                no++;
            }
        } else { tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-success fw-bold"><i class="fa-solid fa-face-smile me-2"></i>Tidak ada catatan pelanggaran di kelas ini.</td></tr>`; }
    } catch (err) { tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Gagal memuat rincian laporan dari server.</td></tr>'; }
}

function unduhPDFRekap() {
    let kelasPilih = document.getElementById("filterRekapKelas").value;
    let bulanPilih = document.getElementById("filterRekapBulan").value;

    // UBAH BAGIAN IF INI
    if (!kelasPilih) {
        // Jangan pakai alert di sini agar tidak memicu modal lagi
        console.log("Kelas belum terpilih, mencoba ambil dari teks label...");
        kelasPilih = document.getElementById("lblRekapKelas").innerText;
    }

    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF.API.autoTable) {
        showAlertBS("Memuat Mesin Vektor...", "Sedang menyiapkan modul unduh...", "info");
        let script1 = document.createElement("script"); script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script1.onload = function() {
            let script2 = document.createElement("script"); script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js";
            script2.onload = function() { eksekusiCetakVektor(); }; document.head.appendChild(script2);
        };
        document.head.appendChild(script1);
    } else { eksekusiCetakVektor(); }

    function eksekusiCetakVektor() {
        const { jsPDF } = window.jspdf; const doc = new jsPDF('l', 'mm', 'a4'); 
        let tglSekarang = document.getElementById("tglCetakSekarang").innerText; let ttdKelas = document.getElementById("lblttdKelas").innerText;
        let namaFile = `Rekap_Disiplin_Kelas_${kelasPilih.replace(/[^a-zA-Z0-9]/g, '_')}_${bulanPilih}.pdf`;
        let tempTable = document.createElement("table"); tempTable.id = "tableVektorTemp"; tempTable.style.display = "none";
        tempTable.innerHTML = `<thead><tr><th>No</th><th>Nama Siswa (NISN)</th><th>Tanggal</th><th>Pelanggaran & Kronologi</th><th>Poin</th><th>Total Poin</th><th>Bukti Foto</th></tr></thead><tbody>${document.getElementById("tbRekapSiswaPDF").innerHTML}</tbody>`;
        document.body.appendChild(tempTable);

        let imgKop = new Image(); imgKop.crossOrigin = "Anonymous"; imgKop.src = "https://i.ibb.co.com/LXG3HPx2/kop.png";
        let prosesRenderPDF = function(gambarKopSukses) {
            if (gambarKopSukses) { try { doc.addImage(imgKop, 'PNG', 12, 10, 273, 32); doc.setLineWidth(0.6); doc.line(12, 44, 285, 44); } catch(e) {} }
            doc.setFont("times", "bold"); doc.setFontSize(13); doc.text("REKAPITULASI AKUMULASI POIN PELANGGARAN SISWA", 148.5, 51, { align: "center" });
            doc.setFontSize(10.5); doc.text(`KELAS: ${kelasPilih} | PERIODE BULAN: ${bulanPilih.toUpperCase()} 2026`, 148.5, 57, { align: "center" });

            doc.autoTable({
                html: '#tableVektorTemp', startY: 63, margin: { top: 15, right: 12, bottom: 45, left: 12 }, theme: 'grid',
                styles: { font: 'times', fontSize: 9.5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, valign: 'middle', cellPadding: 2.5 },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
                columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 1: { cellWidth: 52 }, 2: { halign: 'center', cellWidth: 24 }, 3: { cellWidth: 97 }, 4: { halign: 'center', cellWidth: 18, textColor: [220, 53, 69], fontStyle: 'bold' }, 5: { halign: 'center', cellWidth: 25, fillColor: [255, 250, 240], textColor: [176, 42, 55], fontStyle: 'bold' }, 6: { halign: 'center', cellWidth: 45 } }
            });
            let finalY = doc.lastAutoTable.finalY + 12; if (finalY > 165) { doc.addPage(); finalY = 25; }
            doc.setFont("times", "normal"); doc.setFontSize(10.5); doc.text(`Mengetahui,`, 55, finalY, { align: "center" });
            doc.setFont("times", "bold"); doc.text(`Wali Kelas ${ttdKelas}`, 55, finalY + 6, { align: "center" });
            doc.setFont("times", "normal"); doc.text(`( ............................................ )`, 55, finalY + 28, { align: "center" });
            doc.setFontSize(10.5); doc.text(`Jakarta, ${tglSekarang}`, 240, finalY, { align: "center" });
            doc.setFont("times", "bold"); doc.text(`Guru BK / Kesiswaan`, 240, finalY + 6, { align: "center" });
            doc.setFont("times", "normal"); doc.text(`( ............................................ )`, 240, finalY + 28, { align: "center" });
            tempTable.remove(); doc.save(namaFile);
        };
        if (imgKop.complete) { prosesRenderPDF(true); } else { imgKop.onload = function() { prosesRenderPDF(true); }; imgKop.onerror = function() { prosesRenderPDF(false); }; }
    }
}

// ================= FITUR IMPORT / EXPORT EXCEL (SHEETJS) =================

function bukaModalImport() {
    document.getElementById("fileExcelImport").value = "";
    document.getElementById("hasilImport").style.display = "none";
    new bootstrap.Modal(document.getElementById("modalImport")).show();
}

function downloadTemplateExcel() {
    const role = document.getElementById("pilihTemplate").value;
    let data;
    
    if (role === "siswa") {
        data = [
            { username: "0011223344", password: "123", nama_lengkap: "Budi Santoso", kelas: "X-RPL-1" },
            { username: "0011223355", password: "123", nama_lengkap: "Siti Aminah", kelas: "X-RPL-1" }
        ];
    } else if (role === "guru") {
        data = [
            { username: "NIP12345", password: "123", nama_lengkap: "Pak Riyadi" },
            { username: "NIP67890", password: "123", nama_lengkap: "Bu Ratna" }
        ];
    } else if (role === "walikelas") {
        data = [
            { username: "WALI001", password: "123", nama_lengkap: "Pak Ahmad", kelas: "X-RPL-1" },
            { username: "WALI002", password: "123", nama_lengkap: "Bu Siska", kelas: "X-RPL-2" }
        ];
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_" + role);
    XLSX.writeFile(workbook, "Template_Import_" + role.toUpperCase() + ".xlsx");
}

async function prosesImportExcel() {
    const fileInput = document.getElementById("fileExcelImport");
    const role = document.getElementById("importRole").value;
    const btn = document.getElementById("btnProsesImport");

    if (!fileInput.files.length) {
        showAlertBS("Perhatian", "Harap pilih file Excel terlebih dahulu!", "warning");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Memproses...';

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const dataBuffer = new Uint8Array(e.target.result);
            const workbook = XLSX.read(dataBuffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Konversi ke JSON (defval:"" mencegah data kosong jadi hilang)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            // 1. Validasi Data Kosong
            if (jsonData.length === 0) {
                throw new Error("File Excel kosong atau format tidak sesuai!");
            }

            // 2. Validasi Kolom sesuai Role
            let barisValid = [];
            jsonData.forEach((row, index) => {
                let user = String(row.username || "").trim();
                let pass = String(row.password || "").trim();
                let nama = String(row.nama_lengkap || "").trim();
                let kls = String(row.kelas || "").trim();

                // Abaikan jika username atau nama kosong (baris kosong)
                if (user !== "" && nama !== "") {
                    barisValid.push({
                        username: user,
                        password: pass === "" ? "123456" : pass, // Default password
                        nama_lengkap: nama,
                        kelas: role === "guru" ? "0" : kls // Guru paksa ke 0
                    });
                }
            });

            if (barisValid.length === 0) {
                throw new Error("Tidak ada data valid yang ditemukan. Pastikan judul kolom adalah: username, password, nama_lengkap, kelas.");
            }

            // 3. Kirim ke Supabase melalui panggilAPI
            const res = await panggilAPI({ aksi: "import_users", role: role, data: barisValid });

            // 4. Tampilkan Hasil
            document.getElementById("hasilImport").style.display = "block";
            document.getElementById("lblTotal").innerText = res.total;
            document.getElementById("lblSukses").innerText = res.sukses;
            document.getElementById("lblGagal").innerText = res.gagal;

            if (res.status === "sukses") {
                showAlertBS("Import Selesai", `Berhasil memasukkan ${res.sukses} data baru. Data duplikat diabaikan.`, "success");
                if (role === "siswa") loadAllSiswa(); // Refresh tabel siswa jika yang diimport siswa
            } else {
                showAlertBS("Import Selesai dengan Catatan", res.pesan, "warning");
            }

        } catch (error) {
            showAlertBS("Gagal Membaca File", error.message, "error");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-upload me-1"></i> Proses Import';
        }
    };

    reader.readAsArrayBuffer(file);
}

// ================= KELOLA GURU & WALI KELAS =================
let modalGuruInstance;

function aturFormWaliKelas() {
    const role = document.getElementById("guruRole").value;
    const wadahKelas = document.getElementById("wadahGuruKelas");
    const selKelas = document.getElementById("guruKelas");
    
    if (role === "walikelas") {
        wadahKelas.style.display = "block";
        // Isi otomatis dropdown kelas dari dataMaster
        selKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>' + (dataMaster.kelas ? dataMaster.kelas.map(k => `<option value="${k}">${k}</option>`).join("") : "");
    } else {
        wadahKelas.style.display = "none";
        selKelas.value = "";
    }
}

function bukaModalGuru(mode, nip = '', nama = '', role = 'guru', kelas = '', pwd = '123') {
    if (!modalGuruInstance) modalGuruInstance = new bootstrap.Modal(document.getElementById('modalGuru'));
    
    document.getElementById("guruMode").value = mode;
    document.getElementById("judulModalGuru").innerText = mode === 'tambah' ? 'Tambah Data Guru' : 'Edit Data Guru';
    
    document.getElementById("guruId").value = nip;
    document.getElementById("guruId").disabled = mode === 'edit'; // Jika edit, ID tidak boleh diganti
    document.getElementById("guruNama").value = nama;
    document.getElementById("guruRole").value = role;
    document.getElementById("guruPassword").value = pwd;
    
    aturFormWaliKelas();
    
    if (role === 'walikelas') {
        document.getElementById("guruKelas").value = kelas;
    }
    
    modalGuruInstance.show();
}

async function loadAllGuru() {
    const tb = document.getElementById("tbAllGuru");
    tb.innerHTML = "<tr><td colspan='5' class='text-center py-3'><i class='fa-solid fa-spinner fa-spin'></i> Memuat data...</td></tr>";
    
    const res = await panggilAPI({ aksi: "get_all_guru" });
    if (res.status === "sukses" && res.data.length > 0) {
        tb.innerHTML = res.data.map(g => `
            <tr>
                <td><b>${g.username}</b></td>
                <td>${g.nama_lengkap}</td>
                <td><span class="badge bg-${g.role === 'walikelas' ? 'success' : 'primary'}">${g.role === 'walikelas' ? 'Wali Kelas' : 'Guru'}</span></td>
                <td>${g.role === 'walikelas' ? `<span class="badge bg-secondary">${g.kelas}</span>` : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info me-1" onclick="bukaModalGuru('edit', '${g.username}', '${g.nama_lengkap}', '${g.role}', '${g.kelas || ''}', '${g.password}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="hapusGuru('${g.username}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join("");
    } else {
        tb.innerHTML = "<tr><td colspan='5' class='text-center text-muted py-3'>Belum ada data guru.</td></tr>";
    }
}

async function simpanGuru() {
    const mode = document.getElementById("guruMode").value;
    const nip = document.getElementById("guruId").value.trim();
    const nama = document.getElementById("guruNama").value.trim();
    const role = document.getElementById("guruRole").value;
    const pwd = document.getElementById("guruPassword").value.trim();
    const kelas = role === 'walikelas' ? document.getElementById("guruKelas").value : '0'; // default 0 jika bukan wali
    
    if (!nip || !nama || !pwd) { return showAlertBS("Perhatian", "Semua kolom wajib diisi!", "warning"); }
    if (role === 'walikelas' && !kelas) { return showAlertBS("Perhatian", "Wali Kelas wajib memilih kelas!", "warning"); }
    
    const btn = document.getElementById("btnSimpanGuru");
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;
    
    const res = await panggilAPI({ 
        aksi: "simpan_guru", 
        mode: mode, 
        data: { username: nip, nama_lengkap: nama, role: role, kelas: kelas, password: pwd } 
    });
    
    btn.innerHTML = 'Simpan Data';
    btn.disabled = false;
    
    if (res.status === "sukses") {
        modalGuruInstance.hide();
        showAlertBS("Berhasil", res.pesan, "success");
        loadAllGuru();
    } else {
        showAlertBS("Gagal", res.pesan, "error");
    }
}

function hapusGuru(nip) {
    showConfirmBS(`Yakin ingin menghapus data guru dengan ID ${nip}?`, async () => {
        const res = await panggilAPI({ aksi: "hapus_guru", username: nip });
        if (res.status === "sukses") {
            showAlertBS("Berhasil", "Data berhasil dihapus.", "success");
            loadAllGuru();
        } else {
            showAlertBS("Gagal", res.pesan, "error");
        }
    });
}

// ================= 9. ADAPTOR SUPABASE PENGGANTI GOOGLE APPS SCRIPT =================
async function panggilAPI(payload) {
  const aksi = payload.aksi;
  try {
    if (aksi === "import_users") {
      // 1. Ekstrak data dari file Excel (Payload)
      let insertData = payload.data.map(item => ({
          username: String(item.username),
          password: String(item.password),
          nama_lengkap: String(item.nama_lengkap),
          role: payload.role,
          kelas: item.kelas
      }));

      // 2. Cek Duplikasi: Cari username apa saja yang sudah ada di database
      let semuaUsernameDariExcel = insertData.map(u => u.username);
      const { data: existingUsers } = await supabaseClient.from('users').select('username').in('username', semuaUsernameDariExcel);
      
      let existingUsernames = existingUsers ? existingUsers.map(u => u.username) : [];

      // 3. Pisahkan (Saring) data yang belum ada di database
      let dataUntukDisimpan = insertData.filter(u => !existingUsernames.includes(u.username));
      
      let gagalCount = insertData.length - dataUntukDisimpan.length; // Jumlah yang gagal karena duplikat

      // 4. Masukkan data bersih (tanpa duplikat) ke Supabase
      if (dataUntukDisimpan.length > 0) {
          const { error: insErr } = await supabaseClient.from('users').insert(dataUntukDisimpan);
          if (insErr) return { status: "gagal", pesan: insErr.message, total: insertData.length, sukses: 0, gagal: insertData.length };
      }

      return { 
          status: "sukses", 
          total: insertData.length, 
          sukses: dataUntukDisimpan.length, 
          gagal: gagalCount,
          pesan: "Import selesai."
      };
    }
    
    if (aksi === "login") {
      // PERHATIKAN: Variabel supabase diganti menjadi supabaseClient
      const { data, error } = await supabaseClient.from('users')
        .select('*')
        .eq('username', payload.username)
        .eq('password', payload.password)
        .eq('role', payload.role)
        .single();
        
      if (error || !data) return { status: "gagal", pesan: "Username, Password, atau Peran tidak sesuai!" };
      
      let poin = 0;
      if (payload.role === "siswa") {
         const { data: logs } = await supabaseClient.from('log_pelanggaran').select('poin').eq('nisn', payload.username).eq('status', 'Disetujui');
         poin = logs ? logs.reduce((sum, l) => sum + (l.poin || 0), 0) : 0;
      }
      return { status: "sukses", role: payload.role, identitas: data.username, nama: data.nama_lengkap, kelas: data.kelas, poin: poin };
    }

    if (aksi === "get_form_data") {
      const { data: users } = await supabaseClient.from('users').select('*').eq('role', 'siswa');
      const { data: kamus } = await supabaseClient.from('kamus_pelanggaran').select('*');
      
      let kelas = [...new Set((users || []).map(u => u.kelas).filter(Boolean))].sort();
      let siswa = (users || []).map(u => ({ nisn: u.username, nama: u.nama_lengkap, kelas: u.kelas }));
      let kamusList = (kamus || []).map(k => ({ kode: k.kode, nama: k.jenis_pelanggaran, bobot: k.bobot, sanksi: k.tindakan }));
      
      return { status: "sukses", kelas, siswa, kamus: kamusList };
    }

    if (aksi === "lapor") {
      const idLog = "LOG-" + new Date().getTime();
      const tgl = new Date().toISOString();
      const { data: kamusItem } = await supabaseClient.from('kamus_pelanggaran').select('bobot').eq('kode', payload.kode).single();
      const poin = kamusItem ? kamusItem.bobot : 0;
      
      let urlBukti = "Tidak ada bukti foto";

      // === 1. TAMBAHAN UNTUK UPLOAD FOTO KE STORAGE ===
      if (payload.bukti && payload.bukti.startsWith('data:image')) {
        try {
          // Ubah string Base64 dari HTML menjadi file Blob
          const resGambar = await fetch(payload.bukti);
          const blob = await resGambar.blob();
          
          // Buat nama file unik (contoh: bukti_12345_1784116347.jpg)
          const namaFile = `bukti_${payload.nisn}_${new Date().getTime()}.jpg`;
          
          // Upload ke Supabase Storage (Bucket: tempat-naro-foto)
          const { error: uploadError } = await supabaseClient.storage
            .from('tempat-naro-foto')
            .upload(namaFile, blob, { contentType: 'image/jpeg' });
            
          if (uploadError) throw uploadError;
          
          // Ambil link URL publiknya
          const { data: urlData } = supabaseClient.storage.from('tempat-naro-foto').getPublicUrl(namaFile);
          urlBukti = urlData.publicUrl;
          
        } catch (err) {
          return { status: "gagal", pesan: "Upload foto gagal: " + err.message };
        }
      }
      // ==================================================

      // === 2. UBAH BAGIAN INSERT INI ===
      const { error } = await supabaseClient.from('log_pelanggaran').insert([{
        id_log: idLog, tanggal: tgl, nisn: payload.nisn, kode_pelanggaran: payload.kode, keterangan: payload.keterangan,
        bukti_link: urlBukti, // <--- Gunakan variabel urlBukti yang baru
        pelapor: payload.pelapor, status: "Pending", tahun_ajaran: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1), poin: poin
      }]);
      
      if (error) return { status: "gagal", pesan: error.message }; return { status: "sukses" };
    }

    if (aksi === "get_pending") {
      const { data: logs, error } = await supabaseClient.from('log_pelanggaran').select('*').eq('status', 'Pending');
      if (error) throw error;
      const { data: users } = await supabaseClient.from('users').select('username, nama_lengkap, kelas');
      const { data: kamus } = await supabaseClient.from('kamus_pelanggaran').select('kode, jenis_pelanggaran');
      
      let mapSiswa = {}; if(users) users.forEach(u => mapSiswa[u.username] = { nama: u.nama_lengkap, kelas: u.kelas });
      let mapKamus = {}; if(kamus) kamus.forEach(k => mapKamus[k.kode] = k.jenis_pelanggaran);
      
      let pending = (logs || []).map(l => {
         const infoSiswa = mapSiswa[l.nisn] || { nama: "Siswa Tidak Dikenal", kelas: "-" };
         return { idLog: l.id_log, tanggal: l.tanggal, nisn: l.nisn, namaSiswa: infoSiswa.nama, kelas: infoSiswa.kelas, kode: l.kode_pelanggaran, namaPelanggaran: mapKamus[l.kode_pelanggaran] || "Pelanggaran Umum", keterangan: l.keterangan, bukti: l.bukti_link, pelapor: l.pelapor };
      });
      return { status: "sukses", data: pending };
    }

    if (aksi === "verifikasi") {
      const { error } = await supabaseClient.from('log_pelanggaran').update({ status: payload.keputusan }).eq('id_log', payload.idLog);
      if (error) return { status: "gagal", pesan: error.message }; return { status: "sukses" };
    }

    if (aksi === "get_stats") {
       const { data: users } = await supabaseClient.from('users').select('*').eq('role', 'siswa');
       const { data: logs } = await supabaseClient.from('log_pelanggaran').select('*').in('status', ['Pending', 'Disetujui']);
       
       let perKelas = {}; let mapSiswaPoin = {};
       if(users) { users.forEach(u => { perKelas[u.kelas] = 0; mapSiswaPoin[u.username] = { poin: 0, kelas: u.kelas }; }); }
       
       let pending = 0; let mapHari = {}; const namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
       for (let h = 6; h >= 0; h--) { let d = new Date(); d.setDate(d.getDate() - h); mapHari[`${d.getDate()} ${namaBulan[d.getMonth()]}`] = 0; }
       
       if (logs) {
           logs.forEach(l => {
               if (l.status === 'Pending') pending++;
               if (l.status === 'Disetujui') {
                   if (mapSiswaPoin[l.nisn]) { mapSiswaPoin[l.nisn].poin += (l.poin || 0); perKelas[mapSiswaPoin[l.nisn].kelas]++; }
                   let tglLog = new Date(l.tanggal);
                   if (!isNaN(tglLog.getTime())) { let lbl = `${tglLog.getDate()} ${namaBulan[tglLog.getMonth()]}`; if (mapHari[lbl] !== undefined) mapHari[lbl]++; }
               }
           });
       }
       let siswaKritis = Object.values(mapSiswaPoin).filter(s => s.poin >= 50).length;
       for (let k in perKelas) { if(perKelas[k] === 0) delete perKelas[k]; }
       return { status: "sukses", totalSiswa: users ? users.length : 0, laporanPending: pending, siswaKritis: siswaKritis, perKelas: perKelas, grafikLabel: Object.keys(mapHari), grafikData: Object.values(mapHari) };
    }

    if (aksi === "get_kamus") {
      const { data } = await supabaseClient.from('kamus_pelanggaran').select('*');
      return { status: "sukses", data: data ? data.map(k => ({ kode: k.kode, nama: k.jenis_pelanggaran, bobot: k.bobot, sanksi: k.tindakan })) : [] };
    }

    if (aksi === "get_riwayat") {
      const { data: logs } = await supabaseClient.from('log_pelanggaran').select('*').eq('nisn', payload.nisn).eq('status', 'Disetujui');
      const { data: kamus } = await supabaseClient.from('kamus_pelanggaran').select('*');
      let mapKamus = {}; if(kamus) kamus.forEach(k => mapKamus[k.kode] = k.jenis_pelanggaran);
      return { status: "sukses", data: logs ? logs.map(l => ({ tanggal: l.tanggal, namaPelanggaran: mapKamus[l.kode_pelanggaran] || "Pelanggaran Umum", bobot: l.poin, pelapor: l.pelapor, bukti: l.bukti_link, tahunPelajaran: l.tahun_ajaran })) : [] };
    }

    if (aksi === "get_all_siswa") {
      const { data: users } = await supabaseClient.from('users').select('*').eq('role', 'siswa');
      const { data: logs } = await supabaseClient.from('log_pelanggaran').select('nisn, poin').eq('status', 'Disetujui');
      let mapPoin = {}; if(logs) logs.forEach(l => { mapPoin[l.nisn] = (mapPoin[l.nisn] || 0) + (l.poin || 0); });
      return { status: "sukses", data: users ? users.map(u => ({ nisn: u.username, nama: u.nama_lengkap, kelas: u.kelas, password: u.password, poin: mapPoin[u.username] || 0 })) : [] };
    }

    if (aksi === "add_siswa_manual") {
      const { error } = await supabaseClient.from('users').insert([{ username: payload.nisn, password: payload.password, nama_lengkap: payload.nama, role: 'siswa', kelas: payload.kelas }]);
      return error ? { status: "gagal", pesan: error.message } : { status: "sukses" };
    }

    if (aksi === "edit_siswa") {
      const { error } = await supabaseClient.from('users').update({ username: payload.nisnBaru, password: payload.password, nama_lengkap: payload.nama, kelas: payload.kelas }).eq('username', payload.nisnLama);
      return error ? { status: "gagal", pesan: error.message } : { status: "sukses" };
    }

    if (aksi === "hapus_siswa") {
      const { error } = await supabaseClient.from('users').delete().eq('username', payload.nisn);
      return error ? { status: "gagal", pesan: error.message } : { status: "sukses" };
    }

    if (aksi === "hapus_laporan") {
      const { error } = await supabaseClient.from('log_pelanggaran').delete().eq('id_log', payload.idLog);
      return error ? { status: "gagal", pesan: error.message } : { status: "sukses" };
    }

    if (aksi === "edit_laporan") {
      const { error } = await supabaseClient.from('log_pelanggaran').update({ kode_pelanggaran: payload.kode, keterangan: payload.keterangan }).eq('id_log', payload.idLog);
      return error ? { status: "gagal", pesan: error.message } : { status: "sukses" };
    }

    if (aksi === "kenaikan_kelas") {
      const { data: users } = await supabaseClient.from('users').select('*').eq('role', 'siswa');
      if (users) {
         for (let u of users) {
             let k = (u.kelas || "").toUpperCase();
             if (k.includes("XII")) k = "LULUS"; else if (k.includes("XI")) k = k.replace("XI", "XII"); else if (k.includes("X")) k = k.replace("X", "XI");
             await supabaseClient.from('users').update({ kelas: k }).eq('username', u.username);
         }
      }
      return { status: "sukses" };
    }

    if (aksi === "get_rekap_laporan") {
      const { data: logs } = await supabaseClient.from('log_pelanggaran').select('*').eq('status', 'Disetujui');
      const { data: users } = await supabaseClient.from('users').select('*').eq('role', 'siswa');
      const { data: kamus } = await supabaseClient.from('kamus_pelanggaran').select('*');
      
      let mapSiswa = {}; if(users) users.forEach(u => mapSiswa[u.username] = { nama: u.nama_lengkap, kelas: u.kelas });
      let mapKamus = {}; if(kamus) kamus.forEach(k => mapKamus[k.kode] = k.jenis_pelanggaran);
      const namaBulanArr = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      
      let rekap = [];
      if (logs) {
          logs.forEach(l => {
             let info = mapSiswa[l.nisn] || { nama: "Siswa Tidak Dikenal", kelas: "-" };
             if (info.kelas === payload.kelas) {
                let tgl = new Date(l.tanggal); let blnLog = !isNaN(tgl.getTime()) ? namaBulanArr[tgl.getMonth()] : "-";
                if (!payload.bulan || payload.bulan === "Semua Bulan" || blnLog === payload.bulan) {
                    rekap.push({ tanggal: l.tanggal, nisn: l.nisn, namaSiswa: info.nama, kelas: info.kelas, kode: l.kode_pelanggaran, namaPelanggaran: mapKamus[l.kode_pelanggaran] || "Pelanggaran Umum", keterangan: l.keterangan || "-", bukti: l.bukti_link || "-", poin: l.poin || 0 });
                }
             }
          });
      }
      return { status: "sukses", data: rekap };
    }

    if (aksi === "hapus_massal_siswa") {
      const { error } = await supabaseClient.from('users').delete().in('username', payload.daftarNisn);
      return error ? { status: "gagal", pesan: error.message } : { status: "sukses" };
    }
    if (aksi === "get_absen_hari_ini") {
        let tglHariIni = new Date().toISOString().split('T')[0];
        const { data } = await supabaseClient.from('log_absensi')
            .select('*').eq('username', payload.username).eq('tanggal', tglHariIni).single();
        return { status: "sukses", data: data || null };
    }

    if (aksi === "get_log_absen_personal") {
        const { data } = await supabaseClient.from('log_absensi').select('*').eq('username', payload.username).order('tanggal', { ascending: false });
        return { status: "sukses", data: data || [] };
    }

    if (aksi === "get_log_absen_hari_ini") {
        let tglHariIni = new Date().toISOString().split('T')[0];
        const { data: logs } = await supabaseClient.from('log_absensi').select('*').eq('tanggal', tglHariIni).order('waktu_masuk', { ascending: false });
        const { data: users } = await supabaseClient.from('users').select('username, nama_lengkap, kelas');
        let mapUser = {}; if(users) users.forEach(u => mapUser[u.username] = { nama: u.nama_lengkap, kelas: u.kelas });

        let hasil = (logs || []).map(l => ({
            waktu_masuk: l.waktu_masuk, waktu_pulang: l.waktu_pulang, username: l.username, role: l.role,
            nama: mapUser[l.username]?.nama || "-", kelas: mapUser[l.username]?.kelas || "-"
        }));
        return { status: "sukses", data: hasil };
    }

    if (aksi === "get_all_users_qr") {
        const { data } = await supabaseClient.from('users').select('username, nama_lengkap, role, kelas').in('role', ['siswa', 'guru']);
        let hasil = (data || []).map(u => ({ username: u.username, nama: u.nama_lengkap, role: u.role, kelas: u.kelas }));
        return { status: "sukses", data: hasil };
    }

    if (aksi === "catat_absen") {
        let waktuSekarang = new Date().toLocaleTimeString('it-IT'); // Format HH:MM:SS
        let tglHariIni = new Date().toISOString().split('T')[0];

        // Cek apakah user valid
        const { data: userData } = await supabaseClient.from('users').select('*').eq('username', payload.username).single();
        if (!userData) return { status: "gagal", pesan: "QR tidak dikenali (Bukan Siswa/Guru sekolah ini)." };

        // Cek log absensi hari ini
        const { data: logHariIni } = await supabaseClient.from('log_absensi')
            .select('*').eq('username', payload.username).eq('tanggal', tglHariIni).single();

        if (!logHariIni) {
            // Belum absen masuk -> Buat Record Masuk
            await supabaseClient.from('log_absensi').insert([{
                tanggal: tglHariIni, waktu_masuk: waktuSekarang, username: payload.username, role: userData.role
            }]);
            return { status: "sukses", kondisi: "masuk", waktu: waktuSekarang, user: { nama: userData.nama_lengkap, username: userData.username, kelas: userData.kelas } };
        } else if (logHariIni && !logHariIni.waktu_pulang) {
            // Sudah masuk, belum pulang -> Update Record Pulang
            await supabaseClient.from('log_absensi').update({ waktu_pulang: waktuSekarang })
                .eq('id', logHariIni.id);
            return { status: "sukses", kondisi: "pulang", waktu: waktuSekarang, user: { nama: userData.nama_lengkap, username: userData.username, kelas: userData.kelas } };
        } else {
            // Sudah masuk dan pulang
            return { status: "sukses", kondisi: "sudah_absen", user: { nama: userData.nama_lengkap, username: userData.username, kelas: userData.kelas } };
        }
    }

    if (aksi === "get_all_guru") {
            const { data } = await supabaseClient.from('users').select('*').in('role', ['guru', 'walikelas']).order('nama_lengkap', { ascending: true });
            return { status: "sukses", data: data || [] };
        }

        if (aksi === "simpan_guru") {
            if (payload.mode === 'tambah') {
                const { data: cekExist } = await supabaseClient.from('users').select('username').eq('username', payload.data.username).single();
                if (cekExist) return { status: "gagal", pesan: "ID/NIP sudah terdaftar di sistem!" };
                
                const { error } = await supabaseClient.from('users').insert([payload.data]);
                if (error) return { status: "gagal", pesan: error.message };
            } else {
                const { error } = await supabaseClient.from('users').update({
                    nama_lengkap: payload.data.nama_lengkap,
                    role: payload.data.role,
                    kelas: payload.data.kelas,
                    password: payload.data.password
                }).eq('username', payload.data.username);
                if (error) return { status: "gagal", pesan: error.message };
            }
            return { status: "sukses", pesan: "Data guru berhasil disimpan." };
        }

        if (aksi === "hapus_guru") {
            const { error } = await supabaseClient.from('users').delete().eq('username', payload.username);
            if (error) return { status: "gagal", pesan: error.message };
            return { status: "sukses" };
        }

    if (aksi === "get_rekap_absensi") {
            let { startDate, endDate, kelas, roleTujuan } = payload;
            
            // 1. Ambil Log berdasarkan Tanggal
            let queryLog = supabaseClient.from('log_absensi').select('*');
            if (startDate && endDate) queryLog = queryLog.gte('tanggal', startDate).lte('tanggal', endDate);
            const { data: logs } = await queryLog.order('tanggal', { ascending: true });

            if (!logs || logs.length === 0) return { status: "sukses", data: [] };

            // 2. Ambil User untuk menggabungkan Nama dan Kelas
            let queryUser = supabaseClient.from('users').select('username, nama_lengkap, kelas, role');
            if (roleTujuan) queryUser = queryUser.eq('role', roleTujuan);
            if (kelas) queryUser = queryUser.eq('kelas', kelas);
            const { data: users } = await queryUser;

            // 3. Gabungkan Data (Inner Join versi aman)
            let mapUser = {};
            users.forEach(u => mapUser[u.username] = u);

            let hasilFilter = logs
                .filter(l => mapUser[l.username]) // Hanya tampilkan jika usernamenya ada di filter
                .map(l => ({
                    ...l,
                    nama: mapUser[l.username].nama_lengkap,
                    kelas: mapUser[l.username].kelas,
                    role_user: mapUser[l.username].role
                }));

            return { status: "sukses", data: hasilFilter };
        }

    return { status: "gagal", pesan: "Aksi tidak dikenali API" };

  } catch (e) { return { status: "error", pesan: e.message }; }
}

// PASTIKAN FUNGSI INI ADA DI BAGIAN PALING BAWAH SCRIPT.JS ANDA
function toggleSelectAll() {
    const isChecked = document.getElementById("selectAllSiswa").checked;
    document.querySelectorAll(".checkbox-siswa").forEach(cb => cb.checked = isChecked);
    updateTombolHapusMassal();
}

function updateTombolHapusMassal() {
    const adaYangDipilih = document.querySelectorAll(".checkbox-siswa:checked").length > 0;
    document.getElementById("btnHapusMassal").style.display = adaYangDipilih ? "inline-block" : "none";
}

async function hapusTerpilih() {
    const terpilih = Array.from(document.querySelectorAll(".checkbox-siswa:checked")).map(cb => cb.value);
    
    if (terpilih.length === 0) return;

    showConfirmBS(`Yakin ingin menghapus ${terpilih.length} siswa terpilih secara permanen?`, async () => {
        const res = await panggilAPI({ aksi: "hapus_massal_siswa", daftarNisn: terpilih });
        
        if (res.status === "sukses") {
            showAlertBS("Berhasil!", `${terpilih.length} data siswa telah dihapus.`, "success");
            document.getElementById("btnHapusMassal").style.display = "none";
            // Pastikan fungsi loadAllSiswa ada dan tidak error
            loadAllSiswa(); 
        } else {
            showAlertBS("Gagal", res.pesan, "error");
        }
    });
}