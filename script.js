// ================= 1. INJEKSI CSS TEMA HIJAU & RESPONSIF HP =================
const styleHijauKustom = document.createElement('style');
styleHijauKustom.innerHTML = `
  :root {
    --primary-green: #155132;
  }
  .bg-primary-green { background-color: var(--primary-green) !important; }
  .text-primary-green { color: var(--primary-green) !important; }
  .btn-primary-green {
    background-color: var(--primary-green) !important;
    color: white !important;
    border: none;
    transition: background-color 0.2s;
  }
  .btn-primary-green:hover { background-color: #0d3621 !important; color: white !important; }
  
  /* KUNCI UKURAN GRAFIK AGAR TIDAK MELAR RAKSASA KE BAWAH */
  #chartPelanggaran {
    max-height: 260px !important;
    width: 100% !important;
  }
  
  /* PENYESUAIAN KHUSUS LAYAR HP (RESPONSIF MOBILE) */
  @media (max-width: 768px) {
    .card-stat { margin-bottom: 10px; }
    .table-responsive { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
    table { font-size: 0.85rem; }
    .btn { font-size: 0.85rem; padding: 0.375rem 0.75rem; }
    h3, h4 { font-size: 1.3rem; }
    .modal-dialog { margin: 0.5rem; }
  }
`;
document.head.appendChild(styleHijauKustom);

// ================= 2. KONFIGURASI KONEKSI SUPABASE =================
const SUPABASE_URL = "https://uzbetawwsxvqnerlrmpw.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YmV0YXd3c3h2cW5lcmxybXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjE5ODksImV4cCI6MjA5OTQzNzk4OX0.pRwm8K-OezmfW1tXYQQD7tONEtDWPJqt4-SqmaUSUAw"; 

// Menggunakan nama variabel 'db' agar aman & tidak bentrok
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let dataMaster = { kelas: [], siswa: [], kamus: [] };
let myChart = null;
let globalPendingData = []; 

// ================= 3. MESIN PANGGIL API (POWERED BY SUPABASE) =================
async function panggilAPI(payload) {
  try {
    // LOGIN
    if (payload.aksi === "login") {
      const { data, error } = await db
        .from('data_user')
        .select('*')
        .eq('Username', String(payload.u).trim())
        .eq('Password', String(payload.p).trim())
        .maybeSingle();
        
      if (error || !data) return { status: "gagal", pesan: "Username atau Password salah!" };
      return {
        status: "sukses",
        role: data.Role,
        nama: data.Nama_Lengkap,
        nisn: data.Username,
        poin: data.Total_Poin || 0,
        kelas: data.Kelas || "-"
      };
    }

    // AMBIL DATA MASTER
    if (payload.aksi === "get_master") {
      const { data: siswa } = await db.from('data_user').select('*').eq('Role', 'siswa').order('Nama_Lengkap');
      const { data: kamus } = await db.from('kamus_pelanggaran').select('*').order('Kode');

      const mappedSiswa = (siswa || []).map(s => ({
        nisn: s.Username, nama: s.Nama_Lengkap, kelas: s.Kelas, poin: s.Total_Poin || 0
      }));

      // Klasifikasi otomatis Kategori berdasarkan huruf depan Kode (A, B, C, dst)
      const mappedKamus = (kamus || []).map(k => {
        let huruf = k.Kode.charAt(0).toUpperCase();
        let kat = "Pelanggaran Umum";
        if (["A", "B"].includes(huruf)) kat = "Kedisiplinan & Kehadiran";
        else if (["C", "D"].includes(huruf)) kat = "Kerapian Atribut & Tugas";
        else if (["E", "F", "G"].includes(huruf)) kat = "Kebersihan, Etika & Rokok";
        else if (["H", "I", "J", "K", "L"].includes(huruf)) kat = "Pelanggaran Berat / Pidana";
        
        return { kode: k.Kode, kategori: kat, nama: k.Jenis_Pelanggaran, poin: k.Bobot || 0, sanksi: k.Tindakan || "-" };
      });

      const kelasSet = new Set(mappedSiswa.map(s => s.kelas).filter(k => k && k !== "-"));
      return { status: "sukses", data: { siswa: mappedSiswa, kamus: mappedKamus, kelas: Array.from(kelasSet).sort() } };
    }

    // AMBIL ANTREAN (PENDING)
    if (payload.aksi === "get_pending") {
      const { data: logs } = await db.from('log_pelanggaran').select('*').eq('Status', 'Pending').order('Tanggal', { ascending: false });
      const { data: allSiswa } = await db.from('data_user').select('Username, Nama_Lengkap, Kelas');
      const { data: allKamus } = await db.from('kamus_pelanggaran').select('Kode, Jenis_Pelanggaran');

      const mapS = {}, mapK = {};
      (allSiswa || []).forEach(s => mapS[s.Username] = { nama: s.Nama_Lengkap, kelas: s.Kelas });
      (allKamus || []).forEach(k => mapK[k.Kode] = k.Jenis_Pelanggaran);

      const mappedPending = (logs || []).map(l => ({
        id_log: l.ID_Log, tgl: l.Tanggal, nisn: l.NISN,
        namaSiswa: mapS[l.NISN]?.nama || "Siswa Tidak Dikenal", kelas: mapS[l.NISN]?.kelas || "-",
        kode: l.Kode_Pelanggaran, namaPelanggaran: mapK[l.Kode_Pelanggaran] || "Pelanggaran",
        poin: l.Poin || 0, ket: l.Keterangan || "-", bukti: l.Bukti_Link || "Tidak ada bukti foto", pelapor: l.Pelapor || "-"
      }));
      return { status: "sukses", data: mappedPending };
    }

    // AMBIL REKAP RESMI (DISETUJUI)
    if (payload.aksi === "get_rekap") {
      const { data: logs } = await db.from('log_pelanggaran').select('*').eq('Status', 'Disetujui').order('Tanggal', { ascending: false });
      const { data: allSiswa } = await db.from('data_user').select('Username, Nama_Lengkap, Kelas');
      const { data: allKamus } = await db.from('kamus_pelanggaran').select('Kode, Jenis_Pelanggaran, Tindakan');

      const mapS = {}, mapK = {};
      (allSiswa || []).forEach(s => mapS[s.Username] = { nama: s.Nama_Lengkap, kelas: s.Kelas });
      (allKamus || []).forEach(k => mapK[k.Kode] = { nama: k.Jenis_Pelanggaran, sanksi: k.Tindakan });

      const mappedRekap = (logs || []).map(l => ({
        id_log: l.ID_Log, tanggal: l.Tanggal, nisn: l.NISN,
        namaSiswa: mapS[l.NISN]?.nama || "Siswa Tidak Dikenal", kelas: mapS[l.NISN]?.kelas || "-",
        kode: l.Kode_Pelanggaran, namaPelanggaran: mapK[l.Kode_Pelanggaran]?.nama || "-",
        poin: l.Poin || 0, sanksi: mapK[l.Kode_Pelanggaran]?.sanksi || "-",
        keterangan: l.Keterangan || "-", bukti: l.Bukti_Link || "Tidak ada bukti foto", pelapor: l.Pelapor || "-"
      }));
      return { status: "sukses", data: mappedRekap };
    }

    // KIRIM LAPORAN (+ UPLOAD FOTO KE SUPABASE STORAGE)
    if (payload.aksi === "lapor") {
      let urlFoto = "Tidak ada bukti foto";
      if (payload.bukti && payload.bukti.startsWith("data:image")) {
        try {
          const res = await fetch(payload.bukti);
          const blob = await res.blob();
          const fileName = `foto_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
          // Upload ke bucket 'bukti-pelanggaran'
          const { error: upErr } = await db.storage.from('bukti-pelanggaran').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
          if (!upErr) {
            const { data: urlData } = db.storage.from('bukti-pelanggaran').getPublicUrl(fileName);
            urlFoto = urlData.publicUrl;
          } else {
            console.error("Gagal Upload Storage:", upErr.message);
          }
        } catch (e) { console.log("Upload foto gagal, pakai default."); }
      } else if (payload.bukti && payload.bukti.startsWith("http")) {
        urlFoto = payload.bukti;
      }

      const { error } = await db.from('log_pelanggaran').insert([{
        ID_Log: payload.id_log || `LOG-${Date.now()}`, Tanggal: payload.tgl, NISN: payload.nisn,
        Kode_Pelanggaran: payload.kode, Keterangan: payload.ket, Bukti_Link: urlFoto,
        Pelapor: payload.pelapor, Status: 'Pending', Tahun_Ajaran: '2026/2027', Poin: payload.poin || 0
      }]);
      if (error) return { status: "gagal", pesan: error.message };
      return { status: "sukses", pesan: "Laporan berhasil dikirim!" };
    }

    // VERIFIKASI & OTOMATIS HITUNG POIN
    if (payload.aksi === "verifikasi") {
      if (payload.status === "Hapus") {
        await db.from('log_pelanggaran').delete().eq('ID_Log', payload.id_log);
      } else {
        if (payload.status === "Disetujui") {
          const { data: log } = await db.from('log_pelanggaran').select('NISN, Poin').eq('ID_Log', payload.id_log).single();
          if (log) {
            const { data: u } = await db.from('data_user').select('Total_Poin').eq('Username', log.NISN).single();
            await db.from('data_user').update({ Total_Poin: (u?.Total_Poin || 0) + (log.Poin || 0) }).eq('Username', log.NISN);
          }
        }
        await db.from('log_pelanggaran').update({ Status: payload.status }).eq('ID_Log', payload.id_log);
      }
      return { status: "sukses" };
    }

    // APPROVE ALL
    if (payload.aksi === "approve_all") {
      const { data: pending } = await db.from('log_pelanggaran').select('*').eq('Status', 'Pending');
      if (pending && pending.length > 0) {
        const poinMap = {};
        pending.forEach(l => poinMap[l.NISN] = (poinMap[l.NISN] || 0) + (l.Poin || 0));
        for (const nisn in poinMap) {
          const { data: u } = await db.from('data_user').select('Total_Poin').eq('Username', nisn).single();
          await db.from('data_user').update({ Total_Poin: (u?.Total_Poin || 0) + poinMap[nisn] }).eq('Username', nisn);
        }
        await db.from('log_pelanggaran').update({ Status: 'Disetujui' }).eq('Status', 'Pending');
      }
      return { status: "sukses", pesan: "Semua antrean berhasil disetujui!" };
    }

    // EDIT LAPORAN
    if (payload.aksi === "edit_lapor") {
      const { data: k } = await db.from('kamus_pelanggaran').select('Bobot').eq('Kode', payload.kode).single();
      await db.from('log_pelanggaran').update({
        Kode_Pelanggaran: payload.kode, Keterangan: payload.ket, Poin: k?.Bobot || 0
      }).eq('ID_Log', payload.id_log);
      return { status: "sukses" };
    }

    // SIMPAN SISWA MANUAL
    if (payload.aksi === "simpan_siswa") {
      const { data: ex } = await db.from('data_user').select('Username').eq('Username', payload.nisn).maybeSingle();
      if (ex) {
        await db.from('data_user').update({ Nama_Lengkap: payload.nama, Kelas: payload.kelas }).eq('Username', payload.nisn);
      } else {
        await db.from('data_user').insert([{
          Username: payload.nisn, Password: payload.p || '123456', Nama_Lengkap: payload.nama, Role: 'siswa', Kelas: payload.kelas, Total_Poin: 0
        }]);
      }
      return { status: "sukses" };
    }

    // HAPUS SISWA
    if (payload.aksi === "hapus_siswa") {
      await db.from('data_user').delete().eq('Username', payload.nisn);
      return { status: "sukses" };
    }

    // RESET TAHUN AJARAN
    if (payload.aksi === "reset_tahun") {
      await db.from('log_pelanggaran').delete().neq('ID_Log', 'placeholder');
      await db.from('data_user').update({ Total_Poin: 0 }).eq('Role', 'siswa');
      return { status: "sukses" };
    }

  } catch (err) {
    console.error("Database Error:", err);
    return { status: "gagal", pesan: err.message };
  }
}

// ================= 4. KOMPONEN MODAL ALERT & KONFIRMASI =================
function showAlertBS(title, message, iconType = "success") {
  document.getElementById("alertTitleBS").innerText = title;
  document.getElementById("alertTextBS").innerText = message;
  const iconEl = document.getElementById("alertIconBS");
  iconEl.className = "fa-solid fs-1 mb-3";
  if (iconType === "success") iconEl.classList.add("fa-circle-check", "text-success");
  else if (iconType === "warning") iconEl.classList.add("fa-triangle-exclamation", "text-warning");
  else if (iconType === "danger") iconEl.classList.add("fa-circle-xmark", "text-danger");
  else iconEl.classList.add("fa-circle-info", "text-info");
  
  const modal = new bootstrap.Modal(document.getElementById("modalAlertBS"));
  modal.show();
}

let confirmCallback = null;
function showConfirmBS(message, callback) {
  document.getElementById("confirmTextBS").innerText = message;
  confirmCallback = callback;
  const modal = new bootstrap.Modal(document.getElementById("modalConfirmBS"));
  modal.show();
}

document.addEventListener("DOMContentLoaded", () => {
  const btnYes = document.getElementById("btnConfirmYesBS");
  if (btnYes) {
    btnYes.addEventListener("click", () => {
      const modalEl = document.getElementById("modalConfirmBS");
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      if (confirmCallback) confirmCallback();
    });
  }
});

// ================= 5. MANAJEMEN SISTEM AUTHENTIKASI =================
async function handleLogin(event) {
  event.preventDefault();
  const role = document.getElementById("loginRole").value;
  const user = document.getElementById("loginUser").value;
  const pass = document.getElementById("loginPass").value;
  
  const btnLogin = document.getElementById("btnLogin");
  btnLogin.disabled = true;
  btnLogin.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i>Memverifikasi...`;
  
  const res = await panggilAPI({ aksi: "login", u: user, p: pass });
  btnLogin.disabled = false;
  btnLogin.innerHTML = `<i class="fa-solid fa-right-to-bracket me-2"></i>Masuk ke Sistem`;
  
  if (res.status === "sukses") {
    if (res.role.toLowerCase() !== role.toLowerCase()) {
      showAlertBS("Gagal Masuk", "Akses ditolak! Role yang dipilih tidak sesuai dengan kredensial akun.", "warning");
      return;
    }
    
    currentUser = res;
    document.getElementById("txtNamaUser").innerText = res.nama;
    document.getElementById("userBadge").style.setProperty("display", "flex", "important");
    document.getElementById("loginSection").style.display = "none";
    
    if (role === "siswa") {
      document.getElementById("siswaSection").style.display = "block";
      initSiswaDashboard();
    } else if (role === "guru") {
      document.getElementById("guruSection").style.display = "block";
      initGuruDashboard();
    } else if (role === "admin") {
      document.getElementById("adminSection").style.display = "block";
      initAdminDashboard();
    }
  } else {
    showAlertBS("Gagal", res.pesan, "danger");
  }
}

function logout() {
  currentUser = null;
  document.getElementById("userBadge").style.setProperty("display", "none", "important");
  document.getElementById("siswaSection").style.display = "none";
  document.getElementById("guruSection").style.display = "none";
  document.getElementById("adminSection").style.display = "none";
  document.getElementById("loginSection").style.display = "flex";
  document.getElementById("formLogin").reset();
}

// ================= 6. DASHBOARD PORTAL SISWA =================
async function initSiswaDashboard() {
  document.getElementById("siswaPoin").innerText = currentUser.poin;
  const statusBadge = document.getElementById("siswaStatus");
  const poin = currentUser.poin;
  
  if (poin < 50) {
    statusBadge.innerText = "Aman (Berkelakuan Baik)";
    statusBadge.className = "badge bg-success fs-6 px-3 py-2 rounded-pill";
  } else if (poin < 75) {
    statusBadge.innerText = "Surat Peringatan 1 (SP 1)";
    statusBadge.className = "badge bg-warning text-dark fs-6 px-3 py-2 rounded-pill";
  } else if (poin < 100) {
    statusBadge.innerText = "Surat Peringatan 2 (SP 2)";
    statusBadge.className = "badge bg-danger fs-6 px-3 py-2 rounded-pill";
  } else {
    statusBadge.innerText = "Surat Peringatan 3 (SP 3 - Kritis)";
    statusBadge.className = "badge bg-dark fs-6 px-3 py-2 rounded-pill";
  }
  
  const tbody = document.getElementById("tbRiwayatSiswa");
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3"><i class="fa-solid fa-spinner fa-spin me-2"></i>Memuat riwayat...</td></tr>`;
  
  const res = await panggilAPI({ aksi: "get_rekap" });
  if (res.status === "sukses") {
    const dataSiswa = res.data.filter(d => d.nisn === currentUser.nisn);
    tbody.innerHTML = "";
    if (dataSiswa.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Bersih! Tidak ada riwayat catatan pelanggaran.</td></tr>`;
    } else {
      dataSiswa.forEach(r => {
        let tglIndo = new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        let buktiHtml = "-";
        if (r.bukti && r.bukti.startsWith("http")) {
          buktiHtml = `<a href="${r.bukti}" target="_blank" class="btn btn-sm btn-outline-success px-2 py-0"><i class="fa-solid fa-image"></i> Lihat</a>`;
        }
        tbody.innerHTML += `
          <tr>
            <td>${tglIndo}</td>
            <td><b>${r.kode}</b> - ${r.namaPelanggaran}<br><small class="text-muted">Kronologi: ${r.keterangan}</small></td>
            <td><span class="badge bg-danger">+${r.poin}</span></td>
            <td>${r.pelapor}</td>
            <td>${buktiHtml}</td>
          </tr>
        `;
      });
    }
  } else {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">Gagal memuat data riwayat dari server.</td></tr>`;
  }
}

// ================= 7. DASHBOARD PORTAL GURU & ADMIN (FORM BERTINGKAT) =================
async function initGuruDashboard() {
  const wadah = document.getElementById("wadahFormLaporGuru");
  wadah.innerHTML = `<div class="text-center py-4"><i class="fa-solid fa-spinner fa-spin fs-3 text-primary-green mb-2"></i><br>Menyiapkan form...</div>`;
  
  const res = await panggilAPI({ aksi: "get_master" });
  if (res.status === "sukses") {
    dataMaster = res.data;
    renderFormLapor("wadahFormLaporGuru", "guru");
  } else {
    wadah.innerHTML = `<div class="alert alert-danger">Gagal mengambil data master dari server.</div>`;
  }
}

function renderFormLapor(targetId, rolePengirim) {
  const wadah = document.getElementById(targetId);
  const suffix = rolePengirim === "admin" ? "Admin" : "Guru";
  
  // Ambil daftar Kategori unik
  const kategoriSet = new Set(dataMaster.kamus.map(k => k.kategori));
  let opsiKategori = `<option value="">-- 1. Pilih Kategori Pelanggaran --</option>`;
  Array.from(kategoriSet).sort().forEach(kat => {
    opsiKategori += `<option value="${kat}">${kat}</option>`;
  });
  
  let opsiKelas = `<option value="">-- Pilih Kelas --</option>`;
  dataMaster.kelas.forEach(k => { opsiKelas += `<option value="${k}">${k}</option>`; });
  
  wadah.innerHTML = `
    <form id="formLapor${suffix}" onsubmit="submitFormLapor(event, '${rolePengirim}')">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label fw-bold">Pilih Kelas</label>
          <select class="form-select rounded-3" id="laporKelas${suffix}" onchange="updateDropdownSiswa('${suffix}')" required>
            ${opsiKelas}
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">Nama Siswa</label>
          <select class="form-select rounded-3" id="laporSiswa${suffix}" required disabled>
            <option value="">-- Pilih Kelas Terlebih Dahulu --</option>
          </select>
        </div>
        
        <div class="col-md-6">
          <label class="form-label fw-bold">Kategori Pelanggaran</label>
          <select class="form-select rounded-3 border-success" id="laporKategori${suffix}" onchange="updateDropdownPelanggaran('${suffix}')" required>
            ${opsiKategori}
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">Jenis Pelanggaran (Anak Kategori)</label>
          <select class="form-select rounded-3" id="laporKode${suffix}" required disabled>
            <option value="">-- Pilih Kategori Terlebih Dahulu --</option>
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label fw-bold">Tanggal Kejadian</label>
          <input type="date" class="form-control rounded-3" id="laporTgl${suffix}" value="${new Date().toISOString().split('T')[0]}" required>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-bold">Bukti Foto (Opsional)</label>
          <input type="file" class="form-control rounded-3" id="laporFile${suffix}" accept="image/*" onchange="previewFotoLapor('${suffix}')">
          <img id="imgPreview${suffix}" class="preview-img mt-2" alt="Pratinjau Foto" style="max-height: 150px; display: none;">
        </div>
        <div class="col-12">
          <label class="form-label fw-bold">Kronologi / Keterangan Tambahan</label>
          <textarea class="form-control rounded-3" id="laporKet${suffix}" rows="3" placeholder="Jelaskan detail kejadian..." required></textarea>
        </div>
        <div class="col-12 text-end mt-3">
          <button type="submit" class="btn btn-primary-green px-4 py-2 rounded-3 fw-bold shadow-sm" id="btnSubmitLapor${suffix}">
            <i class="fa-solid fa-paper-plane me-2"></i>Kirim Laporan Pelanggaran
          </button>
        </div>
      </div>
    </form>
  `;
}

function updateDropdownSiswa(suffix) {
  const kelas = document.getElementById(`laporKelas${suffix}`).value;
  const selectSiswa = document.getElementById(`laporSiswa${suffix}`);
  
  if (!kelas) {
    selectSiswa.innerHTML = `<option value="">-- Pilih Kelas Terlebih Dahulu --</option>`;
    selectSiswa.disabled = true;
    return;
  }
  
  let html = `<option value="">-- Pilih Nama Siswa --</option>`;
  dataMaster.siswa.filter(s => s.kelas === kelas).forEach(s => {
    html += `<option value="${s.nisn}">${s.nama} (${s.nisn})</option>`;
  });
  selectSiswa.innerHTML = html;
  selectSiswa.disabled = false;
}

// LOGIKA FILTER KATEGORI -> JENIS PELANGGARAN
function updateDropdownPelanggaran(suffix) {
  const kat = document.getElementById(`laporKategori${suffix}`).value;
  const selectKode = document.getElementById(`laporKode${suffix}`);
  
  if (!kat) {
    selectKode.innerHTML = `<option value="">-- Pilih Kategori Terlebih Dahulu --</option>`;
    selectKode.disabled = true;
    return;
  }
  
  let html = `<option value="">-- 2. Pilih Aturan Pelanggaran --</option>`;
  dataMaster.kamus.filter(k => k.kategori === kat).forEach(k => {
    html += `<option value="${k.kode}" data-poin="${k.poin}">[${k.kode}] ${k.nama} (+${k.poin} Poin)</option>`;
  });
  selectKode.innerHTML = html;
  selectKode.disabled = false;
}

function previewFotoLapor(suffix) {
  const fileInput = document.getElementById(`laporFile${suffix}`);
  const preview = document.getElementById(`imgPreview${suffix}`);
  const file = fileInput.files[0];
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    preview.src = "";
    preview.style.display = "none";
  }
}

async function submitFormLapor(event, rolePengirim) {
  event.preventDefault();
  const suffix = rolePengirim === "admin" ? "Admin" : "Guru";
  
  const selectSiswa = document.getElementById(`laporSiswa${suffix}`);
  const selectKode = document.getElementById(`laporKode${suffix}`);
  const tgl = document.getElementById(`laporTgl${suffix}`).value;
  const ket = document.getElementById(`laporKet${suffix}`).value;
  const preview = document.getElementById(`imgPreview${suffix}`);
  
  const btn = document.getElementById(`btnSubmitLapor${suffix}`);
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i>Mengirim...`;
  
  const poin = parseInt(selectKode.options[selectKode.selectedIndex].getAttribute("data-poin")) || 0;
  
  const payload = {
    aksi: "lapor",
    tgl: tgl,
    nisn: selectSiswa.value,
    kode: selectKode.value,
    poin: poin,
    ket: ket,
    pelapor: currentUser.nama,
    bukti: preview.src || "Tidak ada bukti foto"
  };
  
  const res = await panggilAPI(payload);
  btn.disabled = false;
  btn.innerHTML = `<i class="fa-solid fa-paper-plane me-2"></i>Kirim Laporan Pelanggaran`;
  
  if (res.status === "sukses") {
    showAlertBS("Berhasil", "Laporan dikirim! Menunggu persetujuan verifikasi tim Kesiswaan.", "success");
    document.getElementById(`formLapor${suffix}`).reset();
    preview.src = "";
    preview.style.display = "none";
    document.getElementById(`laporSiswa${suffix}`).disabled = true;
    document.getElementById(`laporKode${suffix}`).disabled = true;
    if (rolePengirim === "admin") refreshAdminDashboard();
  } else {
    showAlertBS("Gagal", res.pesan, "danger");
  }
}

// ================= 8. PANEL KONTROL ADMIN (DASHBOARD & TABS) =================
function switchAdminTab(tabId, judul) {
  document.getElementById("judulMenuAktif").innerText = judul;
  
  const tabs = ["tabStats", "tabVerif", "tabLapor", "tabSiswa", "tabKamus", "tabRekap"];
  tabs.forEach(t => document.getElementById(t).style.display = "none");
  
  document.getElementById(`tab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).style.display = "block";
  
  document.querySelectorAll("#adminTabs .nav-link").forEach(l => l.classList.remove("active"));
  event.currentTarget.classList.add("active");
  
  const offcanvasEl = document.getElementById("slidePanelAdmin");
  const instance = bootstrap.Offcanvas.getInstance(offcanvasEl);
  if (instance) instance.hide();
  
  if (tabId === "stats") refreshAdminDashboard();
  if (tabId === "verif") loadPending();
  if (tabId === "siswa") filterTabelSiswa();
  if (tabId === "kamus") renderTableKamus();
  if (tabId === "rekap") persiapkanMenuRekap();
}

async function initAdminDashboard() {
  const res = await panggilAPI({ aksi: "get_master" });
  if (res.status === "sukses") {
    dataMaster = res.data;
    
    let optionsSiswa = '<option value="">-- Tampilkan Semua Kelas --</option>';
    let optionsRekap = '<option value="">-- Pilih Kelas --</option>';
    dataMaster.kelas.forEach(k => {
      optionsSiswa += `<option value="${k}">${k}</option>`;
      optionsRekap += `<option value="${k}">${k}</option>`;
    });
    document.getElementById("filterSiswaKelas").innerHTML = optionsSiswa;
    document.getElementById("filterRekapKelas").innerHTML = optionsRekap;
    
    renderFormLapor("wadahFormLaporAdmin", "admin");
    refreshAdminDashboard();
  }
}

async function refreshAdminDashboard() {
  const mRes = await panggilAPI({ aksi: "get_master" });
  if (mRes.status === "sukses") dataMaster = mRes.data;
  
  document.getElementById("statTotalSiswa").innerText = dataMaster.siswa.length;
  document.getElementById("statKritis").innerText = dataMaster.siswa.filter(s => s.poin >= 100).length;
  
  const pRes = await panggilAPI({ aksi: "get_pending" });
  document.getElementById("statPending").innerText = pRes.status === "sukses" ? pRes.data.length : 0;
  if (pRes.status === "sukses") globalPendingData = pRes.data;

  const rRes = await panggilAPI({ aksi: "get_rekap" });
  const wadahKelas = document.getElementById("wadahCardKelas");
  wadahKelas.innerHTML = "";
  
  if (rRes.status === "sukses") {
    const approvedLogs = rRes.data;
    const mapCount = {};
    dataMaster.kelas.forEach(k => mapCount[k] = 0);
    approvedLogs.forEach(l => { if (mapCount[l.kelas] !== undefined) mapCount[l.kelas]++; });
    
    dataMaster.kelas.forEach(k => {
      wadahKelas.innerHTML += `
        <div class="col-6 col-md-3">
          <div class="p-3 border rounded-3 bg-light text-center shadow-sm">
            <span class="fw-bold d-block text-dark">${k}</span>
            <span class="badge bg-success mt-1">${mapCount[k]} Kasus</span>
          </div>
        </div>
      `;
    });
    renderChartRealtime(approvedLogs);
  }
}

function renderChartRealtime(logs) {
  const ctx = document.getElementById('chartPelanggaran');
  if (!ctx) return;
  
  const datesMap = {};
  [...logs].reverse().forEach(l => {
    let key = new Date(l.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    datesMap[key] = (datesMap[key] || 0) + 1;
  });
  
  const labels = Object.keys(datesMap).slice(-10);
  const values = labels.map(lbl => datesMap[lbl]);
  
  if (myChart) myChart.destroy();
  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length > 0 ? labels : ["Kosong"],
      datasets: [{
        label: 'Tren Pelanggaran',
        data: values.length > 0 ? values : [0],
        borderColor: '#155132',
        backgroundColor: 'rgba(21, 81, 50, 0.08)',
        tension: 0.25,
        fill: true,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Digabungkan dengan CSS max-height: 260px agar pas
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

// ================= 9. ANTREAN VERIFIKASI (PENDING PANEL) =================
async function loadPending() {
  const tbody = document.getElementById("tbPending");
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4"><i class="fa-solid fa-spinner fa-spin me-2"></i>Memuat data antrean...</td></tr>`;
  
  const res = await panggilAPI({ aksi: "get_pending" });
  if (res.status === "sukses") {
    globalPendingData = res.data;
    tbody.innerHTML = "";
    if (globalPendingData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-success fw-bold"><i class="fa-solid fa-square-check me-2"></i>Antrean Bersih! Tidak ada laporan tertunda.</td></tr>`;
      return;
    }
    globalPendingData.forEach(r => {
      let tgl = new Date(r.tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      let img = r.bukti.startsWith("http") ? `<a href="${r.bukti}" target="_blank" class="btn btn-sm btn-outline-success py-0 px-2 fw-bold"><i class="fa-solid fa-image"></i> Lihat</a>` : "Tidak ada foto";
      tbody.innerHTML += `
        <tr>
          <td><small>${tgl}</small></td>
          <td><b>${r.namaSiswa}</b><br><small class="text-muted">${r.kelas} | ${r.nisn}</small></td>
          <td><span class="badge bg-dark mb-1">${r.kode} - ${r.namaPelanggaran}</span><br><small>Keterangan: ${r.ket}</small></td>
          <td><small>${r.pelapor}</small></td>
          <td>${img}</td>
          <td>
            <div class="d-flex gap-1">
              <button class="btn btn-sm btn-success py-1" onclick="verifikasiLaporan('${r.id_log}', 'Disetujui')" title="Setujui"><i class="fa-solid fa-check"></i></button>
              <button class="btn btn-sm btn-warning py-1 text-dark" onclick="bukaModalEditLapor('${r.id_log}', '${r.kode}', '${r.ket.replace(/'/g, "\\'")}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-sm btn-danger py-1" onclick="verifikasiLaporan('${r.id_log}', 'Hapus')" title="Tolak/Hapus"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    });
  }
}

async function verifikasiLaporan(idLog, statusAksi) {
  let msg = statusAksi === "Disetujui" ? "Setujui laporan ini? Poin otomatis diakumulasikan ke siswa." : "Hapus/Tolak laporan pelanggaran ini?";
  showConfirmBS(msg, async () => {
    const res = await panggilAPI({ aksi: "verifikasi", id_log: idLog, status: statusAksi });
    if (res.status === "sukses") { loadPending(); refreshAdminDashboard(); }
  });
}

async function setujuiSemuaLaporan() {
  if (!globalPendingData.length) return showAlertBS("Info", "Antrean kosong.", "info");
  showConfirmBS("Setujui seluruh antrean pelaporan secara massal sekaligus?", async () => {
    const res = await panggilAPI({ aksi: "approve_all" });
    if (res.status === "sukses") { loadPending(); refreshAdminDashboard(); }
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
  const ket = document.getElementById("editKetLapor").value;
  const res = await panggilAPI({ aksi: "edit_lapor", id_log: idLog, kode: kode, ket: ket });
  if (res.status === "sukses") {
    bootstrap.Modal.getInstance(document.getElementById("modalEditLapor")).hide();
    loadPending();
  }
}

// ================= 10. KELOLA & MONITORING DATA SISWA =================
function filterTabelSiswa() {
  const fKelas = document.getElementById("filterSiswaKelas").value;
  const fSp = document.getElementById("filterSiswaSP").value;
  const tbody = document.getElementById("tbAllSiswa");
  tbody.innerHTML = "";
  
  let filtered = [...dataMaster.siswa];
  if (fKelas) filtered = filtered.filter(s => s.kelas === fKelas);
  if (fSp) {
    filtered = filtered.filter(s => {
      if (fSp === "Aman") return s.poin < 50;
      if (fSp === "SP 1") return s.poin >= 50 && s.poin < 75;
      if (fSp === "SP 2") return s.poin >= 75 && s.poin < 100;
      return s.poin >= 100;
    });
  }
  
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">Siswa tidak ditemukan.</td></tr>`;
    return;
  }
  
  filtered.forEach(s => {
    let sp = "Aman", bc = "bg-success";
    if (s.poin >= 50 && s.poin < 75) { sp = "SP 1"; bc = "bg-warning text-dark"; }
    else if (s.poin >= 75 && s.poin < 100) { sp = "SP 2"; bc = "bg-danger"; }
    else if (s.poin >= 100) { sp = "SP 3 (Kritis)"; bc = "bg-dark"; }
    
    tbody.innerHTML += `
      <tr>
        <td><b>${s.nisn}</b></td>
        <td>${s.nama}</td>
        <td><span class="badge bg-secondary">${s.kelas}</span></td>
        <td><span class="text-danger fw-bold">${s.poin} Poin</span></td>
        <td><span class="badge ${bc}">${sp}</span></td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-info px-2 py-0" onclick="bukaModalSiswa('edit', '${s.nisn}', '${s.nama.replace(/'/g, "\\'")}', '${s.kelas}')"><i class="fa-solid fa-user-pen"></i></button>
            <button class="btn btn-sm btn-outline-danger px-2 py-0" onclick="hapusSiswa('${s.nisn}')"><i class="fa-solid fa-user-minus"></i></button>
          </div>
        </td>
      </tr>
    `;
  });
}

function resetFilterSiswa() {
  document.getElementById("filterSiswaKelas").value = "";
  document.getElementById("filterSiswaSP").value = "";
  filterTabelSiswa();
}

function bukaModalSiswa(mode, nisn="", nama="", kelas="") {
  document.getElementById("judulModalSiswa").innerText = mode === "tambah" ? "Tambah Siswa Baru" : "Edit Biodata Siswa";
  document.getElementById("editNisnLama").value = nisn;
  document.getElementById("formNisn").value = nisn;
  document.getElementById("formNisn").disabled = mode === "edit";
  document.getElementById("formNama").value = nama;
  document.getElementById("formKelas").value = kelas;
  new bootstrap.Modal(document.getElementById("modalSiswa")).show();
}

async function simpanSiswaManual() {
  const nisn = document.getElementById("formNisn").value;
  const nama = document.getElementById("formNama").value;
  const kelas = document.getElementById("formKelas").value.trim().toUpperCase();
  
  if (!nisn || !nama || !kelas) return showAlertBS("Peringatan", "Form harus diisi lengkap!", "warning");
  
  const res = await panggilAPI({ aksi: "simpan_siswa", nisn: nisn, nama: nama, kelas: kelas });
  if (res.status === "sukses") {
    bootstrap.Modal.getInstance(document.getElementById("modalSiswa")).hide();
    const mRes = await panggilAPI({ aksi: "get_master" });
    if (mRes.status === "sukses") dataMaster = mRes.data;
    filterTabelSiswa();
    refreshAdminDashboard();
  }
}

async function hapusSiswa(nisn) {
  showConfirmBS(`Hapus data profil siswa dengan NISN ${nisn} secara permanen?`, async () => {
    const res = await panggilAPI({ aksi: "hapus_siswa", nisn: nisn });
    if (res.status === "sukses") {
      const mRes = await panggilAPI({ aksi: "get_master" });
      if (mRes.status === "sukses") dataMaster = mRes.data;
      filterTabelSiswa();
      refreshAdminDashboard();
    }
  });
}

async function prosesTahunBaru() {
  showConfirmBS("PERINGATAN UTAMA: Transisi Tahun Ajaran Baru akan menghapus seluruh rekaman log pelanggaran dan mengembalikan poin siswa ke 0!", async () => {
    const res = await panggilAPI({ aksi: "reset_tahun" });
    if (res.status === "sukses") {
      const mRes = await panggilAPI({ aksi: "get_master" });
      if (mRes.status === "sukses") dataMaster = mRes.data;
      filterTabelSiswa();
      refreshAdminDashboard();
    }
  });
}

// ================= 11. REKAPAN KAMUS PELANGGARAN =================
function renderTableKamus() {
  const tbody = document.getElementById("tbKamus");
  tbody.innerHTML = "";
  dataMaster.kamus.forEach(k => {
    tbody.innerHTML += `<tr><td><span class="badge bg-secondary">${k.kode}</span></td><td><b>${k.nama}</b></td><td><span class="text-danger fw-bold">+${k.poin}</span></td><td><small>${k.sanksi}</small></td></tr>`;
  });
}

// ================= 12. FITUR REKAP & PRATINJAU PDF KELAS =================
function persiapkanMenuRekap() {
    let selectKelas = document.getElementById("filterRekapKelas");
    selectKelas.innerHTML = '<option value="">-- Pilih Kelas --</option>';
    dataMaster.kelas.forEach(k => { selectKelas.innerHTML += `<option value="${k}">${k}</option>`; });

    const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    let blnSekarang = bulanIndo[new Date().getMonth()];
    document.getElementById("filterRekapBulan").value = blnSekarang;
    
    document.getElementById("tglCetakSekarang").innerText = `${new Date().getDate()} ${blnSekarang} ${new Date().getFullYear()}`;
    document.getElementById("lblRekapTahun").innerText = new Date().getFullYear();
    tampilkanPreviewRekap();
}

async function tampilkanPreviewRekap() {
    let kelasPilih = document.getElementById("filterRekapKelas").value;
    let bulanPilih = document.getElementById("filterRekapBulan").value;
    
    document.getElementById("lblRekapKelas").innerText = kelasPilih || "...";
    document.getElementById("lblttdKelas").innerText = kelasPilih || "...";
    document.getElementById("lblRekapBulan").innerText = bulanPilih || "...";
    
    let tbody = document.getElementById("tbRekapSiswaPDF");
    tbody.innerHTML = "";

    if (!kelasPilih) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Silakan pilih kelas terlebih dahulu pada filter di atas...</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="fa-solid fa-spinner fa-spin me-2"></i>Mengambil data rekapan resmi dari server...</td></tr>';

    try {
        const res = await panggilAPI({ aksi: "get_rekap" });
        
        if (res.status === "sukses" && res.data.length > 0) {
            const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            
            let filteredData = res.data.filter(item => item.kelas === kelasPilih);
            if (bulanPilih !== "Semua Bulan") {
                filteredData = filteredData.filter(item => {
                    let blnName = bulanIndo[new Date(item.tanggal).getMonth()];
                    return blnName === bulanPilih;
                });
            }

            if (filteredData.length > 0) {
                tbody.innerHTML = "";
                let no = 1;
                filteredData.forEach(r => {
                    let tglIndo = new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                    let linkFoto = r.bukti.startsWith('http') ? `<a href="${r.bukti}" target="_blank" style="color: #0f5132; text-decoration: underline; font-weight: bold;">[ Lihat Foto ]</a>` : '-';
                    
                    tbody.innerHTML += `
                        <tr>
                            <td class="text-center" style="border:1px solid #000 !important;">${no++}</td>
                            <td style="border:1px solid #000 !important;">${tglIndo}</td>
                            <td style="border:1px solid #000 !important;"><b>${r.namaSiswa}</b><br><small>NISN: ${r.nisn}</small></td>
                            <td style="border:1px solid #000 !important;"><b>${r.kode}</b> - ${r.namaPelanggaran}<br><small>Kronologi: ${r.keterangan}</small></td>
                            <td class="text-center fw-bold text-danger" style="border:1px solid #000 !important;">+${r.poin}</td>
                            <td class="text-center" style="border:1px solid #000 !important;">${linkFoto}</td>
                        </tr>
                    `;
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-success fw-bold"><i class="fa-solid fa-face-smile me-2"></i>Alhamdulillah, tidak ada catatan pelanggaran pada periode ini.</td></tr>`;
            }
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger">Gagal memuat rincian laporan dari server.</td></tr>';
    }
}

function unduhPDFRekap() {
    let kelasPilih = document.getElementById("filterRekapKelas").value;
    let bulanPilih = document.getElementById("filterRekapBulan").value;

    if (!kelasPilih) {
        showAlertBS("Perhatian!", "Harap pilih kelas terlebih dahulu sebelum mengunduh PDF!", "warning");
        return;
    }

    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF.API.autoTable) {
        showAlertBS("Memuat Modul Cetak...", "Sedang menyiapkan modul unduhan resolusi tinggi...", "info");
        let script1 = document.createElement("script");
        script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script1.onload = function() {
            let script2 = document.createElement("script");
            script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js";
            script2.onload = function() { eksekusiCetakVektor(); };
            document.head.appendChild(script2);
        };
        document.head.appendChild(script1);
    } else {
        eksekusiCetakVektor();
    }

    function eksekusiCetakVektor() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        let tglSekarang = document.getElementById("tglCetakSekarang").innerText;
        let ttdKelas = document.getElementById("lblttdKelas").innerText;
        let namaFile = `Rekap_Disiplin_Kelas_${kelasPilih.replace(/[^a-zA-Z0-9]/g, '_')}_${bulanPilih}.pdf`;

        let tempTable = document.createElement("table");
        tempTable.id = "tableVektorTemp";
        tempTable.style.display = "none";
        tempTable.innerHTML = `
            <thead><tr><th>No</th><th>Tanggal</th><th>Nama Siswa (NISN)</th><th>Pelanggaran & Kronologi</th><th>Poin</th><th>Bukti Foto</th></tr></thead>
            <tbody>${document.getElementById("tbRekapSiswaPDF").innerHTML}</tbody>
        `;
        document.body.appendChild(tempTable);

        let imgKop = new Image();
        imgKop.crossOrigin = "Anonymous";
        imgKop.src = "https://i.ibb.co.com/LXG3HPx2/kop.png";

        let prosesRenderPDF = function(gambarKopSukses) {
            if (gambarKopSukses) {
                try {
                    doc.addImage(imgKop, 'PNG', 12, 10, 273, 32);
                    doc.setLineWidth(0.6); doc.line(12, 44, 285, 44);
                } catch(e) {}
            }

            doc.setFont("times", "bold"); doc.setFontSize(13);
            doc.text("REKAPITULASI AKUMULASI POIN PELANGGARAN SISWA", 148.5, 51, { align: "center" });
            doc.setFontSize(10.5);
            doc.text(`KELAS: ${kelasPilih} | PERIODE BULAN: ${bulanPilih.toUpperCase()} 2026`, 148.5, 57, { align: "center" });

            doc.autoTable({
                html: '#tableVektorTemp', startY: 63,
                margin: { top: 15, right: 12, bottom: 45, left: 12 },
                theme: 'grid',
                styles: { font: 'times', fontSize: 9.5, textColor: [0,0,0], lineColor: [0,0,0], lineWidth: 0.2, valign: 'middle', cellPadding: 2.5 },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 12 },
                    1: { halign: 'center', cellWidth: 28 },
                    2: { cellWidth: 55 },
                    3: { cellWidth: 100 },
                    4: { halign: 'center', cellWidth: 20, textColor: [220, 53, 69], fontStyle: 'bold' },
                    5: { halign: 'center', cellWidth: 58 }
                },
                didParseCell: function(data) {
                    if (data.section === 'body' && data.column.index === 5) {
                        let el = data.cell.raw;
                        if (el && el.querySelector && el.querySelector('a')) {
                            data.cell.styles.textColor = [15, 81, 50]; data.cell.styles.fontStyle = 'bold';
                        }
                    }
                },
                didDrawCell: function(data) {
                    if (data.section === 'body' && data.column.index === 5) {
                        let el = data.cell.raw;
                        if (el && el.querySelector) {
                            let link = el.querySelector('a');
                            if (link && link.href) doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: link.href });
                        }
                    }
                }
            });

            let finalY = doc.lastAutoTable.finalY + 12;
            if (finalY > 165) { doc.addPage(); finalY = 25; }

            doc.setFont("times", "normal"); doc.setFontSize(10.5);
            doc.text(`Mengetahui,`, 55, finalY, { align: "center" });
            doc.setFont("times", "bold"); doc.text(`Wali Kelas ${ttdKelas}`, 55, finalY + 6, { align: "center" });
            doc.setFont("times", "normal"); doc.text(`( ............................................ )`, 55, finalY + 28, { align: "center" });
            doc.setFontSize(9); doc.text(`NIP / NUPTK.`, 55, finalY + 33, { align: "center" });

            doc.setFontSize(10.5); doc.text(`Jakarta, ${tglSekarang}`, 240, finalY, { align: "center" });
            doc.setFont("times", "bold"); doc.text(`Guru BK / Kesiswaan`, 240, finalY + 6, { align: "center" });
            doc.setFont("times", "normal"); doc.text(`( ............................................ )`, 240, finalY + 28, { align: "center" });
            doc.setFontSize(9); doc.text(`NIP / NUPTK.`, 240, finalY + 33, { align: "center" });

            tempTable.remove();
            doc.save(namaFile);
        };

        if (imgKop.complete) prosesRenderPDF(true);
        else {
            imgKop.onload = function() { prosesRenderPDF(true); };
            imgKop.onerror = function() { prosesRenderPDF(false); };
        }
    }
}