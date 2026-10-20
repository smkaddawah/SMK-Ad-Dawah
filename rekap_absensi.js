// ========================================================
// REKAP ABSENSI GLOBAL (DASHBOARD & MODE CETAK)
// ========================================================
let semesterAktif = 'ganjil'; 
window.matriksAbsensiAktif = null;

const getNamaBulanIndo = (bulan) => ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][parseInt(bulan)-1] || "";

// HELPER: Paksa parsing tanggal sesuai Waktu Lokal (Bukan UTC) agar Hari Ini tidak dianggap masa depan
const parseLocal = (dateStr) => {
    if (!dateStr) return new Date();
    let [y, m, d] = dateStr.split('T')[0].split('-');
    return new Date(y, m - 1, d);
}

// ================= FITUR TAHUN AJARAN & KELAS (ADMIN) =================
async function loadPilihanTahunAjaran() {
    try {
        const { data, error } = await supabaseClient.from('tahun_ajaran_absensi').select('*').order('nama_tahun', { ascending: false });
        if (!error && data && data.length > 0) {
            let options = data.map(ta => `<option value="${ta.nama_tahun.substring(0, 4)}">${ta.nama_tahun}</option>`).join("");
            document.getElementById("dashTahun").innerHTML = options; document.getElementById("inputAbsenTahun").innerHTML = options;
        } else {
            let fallback = `<option value="2026">2026 / 2027</option>`;
            document.getElementById("dashTahun").innerHTML = fallback; document.getElementById("inputAbsenTahun").innerHTML = fallback;
        }
    } catch (err) {}
}

async function loadPilihanKelas() {
    try {
        const { data, error } = await supabaseClient.from('users').select('kelas').eq('role', 'siswa').not('kelas', 'is', null);
        if (!error && data) {
            let cls = [...new Set(data.map(i => i.kelas))].sort();
            document.getElementById("filterAbsenKelas").innerHTML = '<option value="">Semua Kelas</option>' + cls.map(k => `<option value="${k}">${k}</option>`).join("");
        }
    } catch (e) {}
}

function bukaModalTahun() {
    document.getElementById("inputTahunBaru").value = "";
    new bootstrap.Modal(document.getElementById('modalTambahTahun')).show();
}

// PERBAIKAN: Modal Cleanup pada fungsi Tambah & Hapus
async function simpanTahunAjaranBaru() {
    let namaTahun = document.getElementById("inputTahunBaru").value.trim();
    if (!namaTahun || !namaTahun.includes("/")) return showAlertBS("Perhatian", "Format harus memuat tanda miring (Contoh: 2027/2028)", "warning");
    
    showAlertBS("Menyimpan...", "Menambahkan ke database...", "info");
    const { error } = await supabaseClient.from('tahun_ajaran_absensi').insert([{ nama_tahun: namaTahun }]);
    
    // Paksa hilangkan efek Freeze abu-abu
    setTimeout(() => { document.querySelectorAll('.modal-backdrop').forEach(el => el.remove()); document.body.classList.remove('modal-open'); document.body.style.overflow = ''; document.body.style.paddingRight = ''; }, 800);

    if (error) showAlertBS("Gagal", "Terjadi kesalahan saat menyimpan.", "error");
    else {
        let modalEl = document.getElementById('modalTambahTahun');
        let modalInst = bootstrap.Modal.getInstance(modalEl);
        if(modalInst) modalInst.hide();
        
        showAlertBS("Berhasil", "Tahun Ajaran baru ditambahkan.", "success");
        loadPilihanTahunAjaran();
    }
}

async function hapusTahunAjaran() {
    let sel = document.getElementById("dashTahun");
    if(sel.options.length === 0) return;
    let teksTahun = sel.options[sel.selectedIndex].text;
    
    showConfirmBS(`Yakin ingin menghapus Tahun Ajaran <b>${teksTahun}</b>?`, async () => {
        showAlertBS("Menghapus...", "Mohon tunggu...", "info");
        const { error } = await supabaseClient.from('tahun_ajaran_absensi').delete().eq('nama_tahun', teksTahun);
        
        // Paksa hilangkan efek Freeze abu-abu
        setTimeout(() => { document.querySelectorAll('.modal-backdrop').forEach(el => el.remove()); document.body.classList.remove('modal-open'); document.body.style.overflow = ''; document.body.style.paddingRight = ''; }, 800);

        if (error) showAlertBS("Gagal", "Gagal menghapus data.", "error");
        else { showAlertBS("Berhasil", "Tahun Ajaran dihapus.", "success"); loadPilihanTahunAjaran(); }
    });
}

// ================= CORE ENGINE: TARIK SEMUA USER & KALKULASI ALPA =================
// ================= CORE ENGINE: TARIK SEMUA USER & KALKULASI ALPA =================
async function getMesinDataAbsensi(start, end, kat, kls) {
    let qUser = supabaseClient.from('users').select('*');
    if (kat === 'siswa') {
        qUser = qUser.eq('role', 'siswa');
        if (kls) qUser = qUser.eq('kelas', kls);
    } else { qUser = qUser.in('role', ['guru', 'walikelas', 'staf']); } // staf juga ikut ditarik
    
    const { data: allUsers } = await qUser;
    if (!allUsers || allUsers.length === 0) return null;

    // === 1. TARIK DATA HARI LIBUR & JADWAL GURU DARI DATABASE ===
    const { data: dataLibur } = await supabaseClient.from('hari_libur').select('*').gte('tanggal', start).lte('tanggal', end);
    const listLibur = dataLibur || [];

    let listJadwal = [];
    if (kat !== 'siswa') {
        const { data: dataJadwal } = await supabaseClient.from('jadwal_mengajar').select('*');
        listJadwal = dataJadwal || [];
    }

    // === 2. BENTUK ARRAY TANGGAL & CEK STATUS LIBUR ===
    let startD = parseLocal(start); let endD = parseLocal(end);
    let today = new Date(); today.setHours(0,0,0,0);
    let tglArray = []; let loopD = new Date(startD);
    const namaHariArr = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

    while (loopD <= endD) {
        let isMinggu = loopD.getDay() === 0;
        let isMasaDepan = loopD > today; 
        let tglFull = loopD.getFullYear() + '-' + String(loopD.getMonth() + 1).padStart(2, '0') + '-' + String(loopD.getDate()).padStart(2, '0');
        let namaHari = namaHariArr[loopD.getDay()];

        // Cek Status Hari Libur (Berdasarkan Target)
        let isLibur = false;
        let matchLibur = listLibur.find(l => l.tanggal === tglFull);
        if (matchLibur) {
            if (matchLibur.target === 'semua') isLibur = true;
            else if (matchLibur.target === 'siswa' && kat === 'siswa') isLibur = true;
            else if (matchLibur.target === 'ptk' && kat !== 'siswa') isLibur = true;
        }

        tglArray.push({
            full: tglFull, tgl: loopD.getDate(), hariMinggu: isMinggu, isMasaDepan: isMasaDepan, isLibur: isLibur, namaHari: namaHari
        });
        loopD.setDate(loopD.getDate() + 1);
    }

    // === 3. INJEKSI DEFAULT STATUS ABSENSI KE MASING-MASING USER ===
    let rekapUser = {};
    allUsers.forEach(u => {
        rekapUser[u.username] = {
            nisn: u.username, nama: u.nama_lengkap || u.nama || 'Tanpa Nama', kelas: u.kelas || '-', role: u.role, absen: {}, total: { H:0, S:0, I:0, A:0 }
        };
        
        let kodeBersih = (u.username || "").toString().replace(/[a-zA-Z]/g, ''); // Hapus huruf untuk kode guru (4A -> 4)

        tglArray.forEach(t => { 
            // Jika Minggu, Hari Libur, atau Masa Depan -> Set "-"
            if (t.hariMinggu || t.isMasaDepan || t.isLibur) {
                rekapUser[u.username].absen[t.full] = '-';
            } else {
                // Jika Hari Efektif
                if (kat !== 'siswa') {
                    // Khusus PTK: Cek punya jadwal mengajar atau tidak di hari ini
                    let adaJadwal = listJadwal.some(j => j.hari === t.namaHari && (j.kode_guru === u.username || j.kode_guru === kodeBersih));
                    rekapUser[u.username].absen[t.full] = adaJadwal ? 'A' : '-'; // 'A' jika ada jadwal, '-' jika bebas tugas
                } else {
                    rekapUser[u.username].absen[t.full] = 'A'; // Siswa wajib hadir
                }
            }
        });
    });

    // === 4. TIMPA DENGAN DATA ABSEN REAL DARI DATABASE ===
    const res = await panggilAPI({ aksi: "get_rekap_absensi", startDate: start, endDate: end, roleTujuan: kat });
    if (res.status === "sukses" && res.data) {
        res.data.forEach(d => {
            if (rekapUser[d.username]) {
                let logDate = d.tanggal.split('T')[0];
                let objTgl = tglArray.find(t => t.full === logDate);
                if (objTgl) {
                    let stat = 'A';
                    if (d.status_hadir === 'S' || d.status_hadir === 'SAKIT') stat = 'S';
                    else if (d.status_hadir === 'I' || d.status_hadir === 'IZIN') stat = 'I';
                    else if (d.status_hadir === 'H' || d.waktu_masuk) stat = 'H';
                    
                    // Kunci Rapat: Jangan biarkan log Alpa (A) menimpa hari Bebas Tugas (-)
                    let statusSaatIni = rekapUser[d.username].absen[logDate];
                    if (statusSaatIni === '-' && stat === 'A') return; 
                    
                    rekapUser[d.username].absen[logDate] = stat;
                }
            }
        });
    }

    // === 5. HITUNG REKAP TOTAL ===
    Object.values(rekapUser).forEach(u => {
        Object.values(u.absen).forEach(s => {
            if(s==='H') u.total.H++; if(s==='S') u.total.S++; if(s==='I') u.total.I++; if(s==='A') u.total.A++;
        });
    });

    // Urutkan berdasarkan Nama (Khusus PTK Wali kelas diurutkan beda)
    let sortedUsers = Object.values(rekapUser).sort((a,b) => {
        if (kat !== 'siswa') {
            if (a.role === 'guru' && b.role === 'walikelas') return -1;
            if (a.role === 'walikelas' && b.role === 'guru') return 1;
        }
        return a.nama.localeCompare(b.nama);
    });

    return { users: sortedUsers, tglArray: tglArray };
}

// Variabel Global untuk Modal Detail
window.rawDashboardUsers = [];

// ================= LAYAR 1: DASHBOARD =================
function aturFilterDashboard() {
    const t = document.getElementById("dashTipe").value;
    document.getElementById("dashWrapTahun").style.display = t === 'tahunan' ? 'block' : 'none';
    document.getElementById("dashWrapBulan").style.display = t === 'bulanan' ? 'block' : 'none';
    document.getElementById("dashWrapRentang").style.display = t === 'rentang' ? 'block' : 'none';
    document.getElementById("wrapTabsSemester").style.display = t === 'tahunan' ? 'block' : 'none';
}

function pilihSemesterDash(sem) {
    semesterAktif = sem;
    document.getElementById('tabGanjil').className = `nav-link fw-bold px-0 border-0 ${sem === 'ganjil' ? 'active text-primary' : 'text-muted'}`;
    document.getElementById('tabGanjil').style.borderBottom = sem === 'ganjil' ? '3px solid #0d6efd' : '3px solid transparent';
    document.getElementById('tabGenap').className = `nav-link fw-bold px-0 border-0 ${sem === 'genap' ? 'active text-primary' : 'text-muted'}`;
    document.getElementById('tabGenap').style.borderBottom = sem === 'genap' ? '3px solid #0d6efd' : '3px solid transparent';
    loadDashboard();
}

async function loadDashboard() {
    const tipe = document.getElementById("dashTipe").value;
    const kat = document.getElementById("dashKategori").value;
    const tb = document.getElementById("tbTahunanAbsen");
    
    let startD = "", endD = "";
    if (tipe === 'tahunan') {
        const thn = document.getElementById("dashTahun").value;
        if (semesterAktif === 'ganjil') { startD = `${thn}-07-01`; endD = `${thn}-12-31`; } 
        else { startD = `${parseInt(thn)+1}-01-01`; endD = `${parseInt(thn)+1}-06-30`; }
    } else if (tipe === 'bulanan') {
        let bln = document.getElementById("dashBulan").value; 
        if(!bln) return showAlertBS("Perhatian", "Pilih bulan!", "warning");
        let thn = bln.split("-")[0]; let bl = bln.split("-")[1];
        startD = `${thn}-${bl}-01`; endD = `${thn}-${bl}-${new Date(thn, bl, 0).getDate()}`;
    } else if (tipe === 'rentang') {
        startD = document.getElementById("dashStart").value; endD = document.getElementById("dashEnd").value;
        if(!startD || !endD) return showAlertBS("Perhatian", "Pilih rentang!", "warning");
    }

    tb.innerHTML = '<tr><td colspan="11" class="py-5 text-center"><i class="fa-solid fa-spinner fa-spin fs-3 text-primary mb-2"></i><br>Mengkalkulasi data...</td></tr>';

    let coreData = await getMesinDataAbsensi(startD, endD, kat, "");
    if (!coreData) { tb.innerHTML = '<tr><td colspan="11" class="py-4 text-center text-danger fw-bold">Data tidak ditemukan.</td></tr>'; return; }

    window.rawDashboardUsers = coreData.users; // Simpan untuk Modal Detail

    let tH=0, tS=0, tI=0, tA=0, dashGroup = {};
    
    coreData.users.forEach(u => {
        tH += u.total.H; tS += u.total.S; tI += u.total.I; tA += u.total.A;
        let key = (kat === 'siswa') ? u.kelas : u.nama;
        if (!dashGroup[key]) dashGroup[key] = { H:0, S:0, I:0, A:0, count:0 };
        dashGroup[key].H += u.total.H; dashGroup[key].S += u.total.S; dashGroup[key].I += u.total.I; dashGroup[key].A += u.total.A;
        dashGroup[key].count++;
    });

    let gTot = tH + tS + tI + tA || 1;
    document.getElementById("cardJmlH").innerText = tH.toLocaleString('id-ID'); document.getElementById("cardPctH").innerText = ((tH/gTot)*100).toFixed(1) + "%";
    document.getElementById("cardJmlS").innerText = tS.toLocaleString('id-ID'); document.getElementById("cardPctS").innerText = ((tS/gTot)*100).toFixed(1) + "%";
    document.getElementById("cardJmlI").innerText = tI.toLocaleString('id-ID'); document.getElementById("cardPctI").innerText = ((tI/gTot)*100).toFixed(1) + "%";
    document.getElementById("cardJmlA").innerText = tA.toLocaleString('id-ID'); document.getElementById("cardPctA").innerText = ((tA/gTot)*100).toFixed(1) + "%";

    document.getElementById("thGrupNama").innerText = (kat === 'siswa') ? "Kelas" : "Nama PTK";
    document.getElementById("thGrupJml").innerText = (kat === 'siswa') ? "Jml Siswa / Aksi" : "Role";

    let htmlTabel = "";
    Object.keys(dashGroup).sort().forEach((k, idx) => {
        let g = dashGroup[k]; let sTot = g.H + g.S + g.I + g.A || 1;
        
        // Tambahkan tombol detail khusus untuk mode Siswa
        let info3 = (kat === 'siswa') 
            ? `<div class="d-flex align-items-center justify-content-between px-2"><span>${g.count} Siswa</span> <button class="btn btn-sm btn-outline-primary py-0" onclick="lihatDetailSiswaDash('${k}')">Detail</button></div>` 
            : `<span class="badge bg-secondary">PTK</span>`;
            
        htmlTabel += `
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td class="text-muted fw-bold">${idx + 1}</td><td class="text-start fw-bold text-dark">${k}</td><td class="border-end p-1">${info3}</td>
            <td class="text-success">${g.H}</td><td class="border-end text-success" style="background-color: #f6fdf9;"><small>${((g.H/sTot)*100).toFixed(1)}%</small></td>
            <td class="text-danger">${g.S}</td><td class="border-end text-danger" style="background-color: #fffafb;"><small>${((g.S/sTot)*100).toFixed(1)}%</small></td>
            <td style="color: #d97706;">${g.I}</td><td class="border-end" style="color: #d97706; background-color: #fffdf5;"><small>${((g.I/sTot)*100).toFixed(1)}%</small></td>
            <td style="color: #7e22ce;">${g.A}</td><td style="color: #7e22ce; background-color: #fdfcff;"><small>${((g.A/sTot)*100).toFixed(1)}%</small></td>
        </tr>`;
    });
    tb.innerHTML = htmlTabel || '<tr><td colspan="11" class="py-4 text-center text-muted">Belum ada data.</td></tr>';
}

// ================= LAYAR 2: MODE CETAK =================
function bukaModeCetak() { document.getElementById("layarDashboardAbsen").style.display = "none"; document.getElementById("layarCetakAbsen").style.display = "block"; aturInputCetak(); }
function tutupModeCetak() { document.getElementById("layarCetakAbsen").style.display = "none"; document.getElementById("layarDashboardAbsen").style.display = "block"; window.matriksAbsensiAktif = null; }

function aturInputCetak() {
    const tipe = document.getElementById("filterTipeRekapAbsen").value; const kat = document.getElementById("filterAbsenKategori").value;
    document.getElementById("wrapAbsenHarian").style.display = tipe === 'harian' ? 'block' : 'none'; document.getElementById("wrapAbsenRentang").style.display = tipe === 'mingguan' ? 'block' : 'none'; document.getElementById("wrapAbsenBulanan").style.display = tipe === 'bulanan' ? 'block' : 'none'; document.getElementById("wrapAbsenTahunan").style.display = tipe === 'tahunan' ? 'block' : 'none';
    const wrapKls = document.getElementById("wrapAbsenKelas");
    if (kat === "siswa") { wrapKls.style.display = "block"; if (document.getElementById("filterAbsenKelas").options.length <= 1) loadPilihanKelas(); } 
    else { wrapKls.style.display = "none"; document.getElementById("filterAbsenKelas").value = ""; }
}

async function tampilkanRekapCetak() {
    const tipe = document.getElementById("filterTipeRekapAbsen").value; const kat = document.getElementById("filterAbsenKategori").value; const kls = document.getElementById("filterAbsenKelas").value;
    let start = "", end = "", judul = "";

    if (tipe === "harian") { start = document.getElementById("inputAbsenHarian").value; end = start; if(!start) return showAlertBS("Perhatian", "Pilih tanggal!", "warning"); judul = `Tanggal: ${new Date(start).toLocaleDateString('id-ID')}`; } 
    else if (tipe === "mingguan") { start = document.getElementById("inputAbsenStart").value; end = document.getElementById("inputAbsenEnd").value; if(!start||!end) return showAlertBS("Perhatian", "Pilih rentang!", "warning"); judul = `Periode: ${start} s/d ${end}`; } 
    else if (tipe === "bulanan") { let bln = document.getElementById("inputAbsenBulan").value; if(!bln) return showAlertBS("Perhatian", "Pilih bulan!", "warning"); let t = bln.split("-")[0]; let b = bln.split("-")[1]; start = `${t}-${b}-01`; end = `${t}-${b}-${new Date(t, b, 0).getDate()}`; judul = `Bulan ${getNamaBulanIndo(b)} ${t}`; } 
    else if (tipe === "tahunan") { let thn = document.getElementById("inputAbsenTahun").value; start = `${thn}-07-01`; end = `${parseInt(thn)+1}-06-30`; judul = `Tahun Ajaran: ${thn} / ${parseInt(thn)+1}`; }

    const wadahTabel = document.getElementById("wadahTabelCetak");
    wadahTabel.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fs-2 text-success"></i><br>Menyiapkan Laporan Cetak...</div>';

    let coreData = await getMesinDataAbsensi(start, end, kat, kls);
    if (!coreData) { document.getElementById("headerKopAbsen").style.display = "none"; wadahTabel.innerHTML = '<div class="alert alert-warning text-center fw-bold m-3">Tidak ada data.</div>'; window.matriksAbsensiAktif = null; return; }

    window.matriksAbsensiAktif = { data: coreData.users, hari: coreData.tglArray, judul: judul, kategori: kat, kelas: kls, isTahunan: (tipe === 'tahunan') };

    document.getElementById("subjudulLaporanAbsen").innerHTML = `<b>REKAPITULASI KEHADIRAN ${tipe.toUpperCase()}</b><br>${judul} | ${kat === 'siswa' ? 'Kelas: '+(kls||'Semua') : 'PTK'}`;
    document.getElementById("headerKopAbsen").style.display = "block";

    let theadHTML = `<tr class="align-middle" style="background-color: #0b5ed7; color: white;"><th style="width: 30px;">No</th><th style="min-width: 90px;">NIP/NISN</th><th style="min-width: 180px;">Nama</th><th>${kat==='siswa' ? 'Kls' : 'Role'}</th>`;
    if (tipe !== 'tahunan') {
        coreData.tglArray.forEach(t => { let clr = t.hariMinggu ? 'color: #ffcccc;' : ''; theadHTML += `<th style="width:25px; padding: 5px; ${clr}">${t.tgl}</th>`; });
    }
    theadHTML += `<th class="bg-success">H</th><th class="bg-info">S</th><th class="bg-warning text-dark">I</th><th class="bg-danger">A</th></tr>`;

    let tbodyHTML = "";
    coreData.users.forEach((s, idx) => {
        let colRole = kat === 'siswa' ? s.kelas : (s.role==='walikelas'?'Wali':'Guru');
        tbodyHTML += `<tr><td>${idx+1}</td><td class="text-start">${s.nisn}</td><td class="text-start fw-bold" style="font-size: 0.85rem;">${s.nama}</td><td>${colRole}</td>`;
        if (tipe !== 'tahunan') {
            coreData.tglArray.forEach(t => {
                if (t.hariMinggu) tbodyHTML += `<td style="background-color: #343a40;"></td>`;
                else {
                    let st = s.absen[t.full]; let bg = "";
                    if(st==='H') bg="text-success fw-bold"; else if(st==='S') bg="text-info fw-bold"; else if(st==='I') bg="text-warning fw-bold"; else if(st==='A') bg="text-danger fw-bold"; else bg="text-muted";
                    tbodyHTML += `<td class="${bg}">${st}</td>`;
                }
            });
        }
        tbodyHTML += `<td class="fw-bold text-success bg-light">${s.total.H}</td><td class="fw-bold text-info bg-light">${s.total.S}</td><td class="fw-bold text-warning bg-light">${s.total.I}</td><td class="fw-bold text-danger bg-light">${s.total.A}</td></tr>`;
    });

    wadahTabel.innerHTML = `<table class="table table-bordered table-sm table-hover align-middle mb-0 text-center" id="tabelRekapAbsenSistem" style="font-size: 0.8rem;"><thead>${theadHTML}</thead><tbody id="tbRekapAbsenAdmin">${tbodyHTML}</tbody></table>`;
}

function cariDiTabelAbsen() {
    let inp = document.getElementById("pencarianTabelAbsen").value.toLowerCase();
    document.querySelectorAll("#tbRekapAbsenAdmin tr").forEach(tr => { tr.style.display = tr.innerText.toLowerCase().includes(inp) ? "" : "none"; });
}

function downloadPDFAbsensiAdmin() {
    if(!window.matriksAbsensiAktif) { showAlertBS("Perhatian", "Preview data dulu!", "warning"); return; }
    if (typeof window.jspdf === 'undefined') {
        let s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        s.onload = () => { let s2 = document.createElement("script"); s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"; s2.onload = () => eksekusiPDF(); document.head.appendChild(s2); }; document.head.appendChild(s);
    } else { eksekusiPDF(); }

    function eksekusiPDF() {
        showAlertBS("Menyimpan PDF", "Memproses laporan...", "info");
        const { jsPDF } = window.jspdf; let mData = window.matriksAbsensiAktif;
        const doc = new jsPDF(mData.isTahunan ? 'p' : 'l', 'mm', 'legal'); 
        
        let img = new Image(); img.crossOrigin = "Anonymous"; img.src = "https://i.ibb.co.com/LXG3HPx2/kop.png";
        let pdfProc = function() {
            try { 
                if(mData.isTahunan) { doc.addImage(img, 'PNG', 10, 10, 195, 23); doc.setLineWidth(0.8); doc.line(10, 35, 205, 35); }
                else { doc.addImage(img, 'PNG', 15, 10, 325, 38); doc.setLineWidth(0.8); doc.line(15, 52, 340, 52); }
            } catch(e) {}
            
            let wC = mData.isTahunan ? 107.5 : 177.5; let yH = mData.isTahunan ? 45 : 62;
            doc.setFont("times", "bold"); doc.setFontSize(14); doc.text(`REKAPITULASI KEHADIRAN`, wC, yH, { align: "center" });
            doc.setFontSize(11); doc.setFont("times", "normal"); doc.text(`${mData.judul} | ${mData.kategori==='siswa' ? 'Kelas: '+(mData.kelas||'Semua') : 'PTK'}`, wC, yH+6, { align: "center" });

            let colRoleLabel = mData.kategori === 'siswa' ? "Kls" : "Role";
            let headTbl = [["No", "NIP/NISN", "Nama", colRoleLabel]];
            if (!mData.isTahunan) mData.hari.forEach(t => headTbl[0].push(t.tgl.toString()));
            headTbl[0].push("H", "S", "I", "A");

            let bodyTbl = [];
            mData.data.forEach((s, idx) => {
                let colRole = mData.kategori === 'siswa' ? s.kelas : (s.role==='walikelas'?'Wali':'Guru');
                let row = [idx+1, s.nisn, s.nama, colRole];
                if (!mData.isTahunan) { mData.hari.forEach(t => { if (t.hariMinggu) row.push(""); else row.push(s.absen[t.full]); }); }
                row.push(s.total.H, s.total.S, s.total.I, s.total.A); bodyTbl.push(row);
            });

            doc.autoTable({
                head: headTbl, body: bodyTbl, startY: yH+12, theme: 'grid',
                styles: { font: 'times', fontSize: mData.isTahunan ? 9 : 7, textColor: [0,0,0], lineColor: [0,0,0], lineWidth: 0.1, halign: 'center' },
                headStyles: { fillColor: [11, 94, 215], textColor: [255,255,255], fontStyle: 'bold' },
                columnStyles: { 2: { halign: 'left', cellWidth: mData.isTahunan ? 70 : 35 } },
                didParseCell: function(data) {
                    let totalCols = data.table.columns.length;
                    if (data.section === 'head' && data.row.index === 0) {
                        if(data.column.index === totalCols-4) data.cell.styles.fillColor = [25, 135, 84]; 
                        if(data.column.index === totalCols-3) data.cell.styles.fillColor = [13, 202, 240]; 
                        if(data.column.index === totalCols-2) data.cell.styles.fillColor = [255, 193, 7]; 
                        if(data.column.index === totalCols-1) data.cell.styles.fillColor = [220, 53, 69]; 
                        if (!mData.isTahunan && data.column.index >= 4 && data.column.index < totalCols - 4) {
                            if (mData.hari[data.column.index - 4].hariMinggu) data.cell.styles.textColor = [255, 150, 150];
                        }
                    }
                    if (!mData.isTahunan && data.section === 'body' && data.column.index >= 4 && data.column.index < totalCols - 4) {
                        if (mData.hari[data.column.index - 4].hariMinggu) data.cell.styles.fillColor = [52, 58, 64]; 
                    }
                }
            });
            doc.save(`Rekap_${mData.judul.replace(/\s/g, "_")}.pdf`);
            showAlertBS("Berhasil", "PDF diunduh.", "success");
            setTimeout(() => { document.querySelectorAll('.modal-backdrop').forEach(el => el.remove()); document.body.classList.remove('modal-open'); }, 1000); 
        };
        if (img.complete) pdfProc(); else { img.onload = pdfProc; img.onerror = pdfProc; }
    }
}

async function downloadExcelAbsensiAdmin() {
    if(!window.matriksAbsensiAktif) { showAlertBS("Perhatian", "Preview data dulu!", "warning"); return; }
    showAlertBS("Memproses Excel...", "Mengunduh file...", "info");
    
    let html = document.getElementById("tabelRekapAbsenSistem").outerHTML;
    html = html.replace(/class="bg-success"/g, 'style="background-color: #198754; color: white;"');
    html = html.replace(/class="bg-info"/g, 'style="background-color: #0dcaf0; color: white;"');
    html = html.replace(/class="bg-warning text-dark"/g, 'style="background-color: #ffc107; color: black;"');
    html = html.replace(/class="bg-danger"/g, 'style="background-color: #dc3545; color: white;"');
    
    let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"></head><body><h2 style="text-align:center;">LAPORAN ABSENSI AD-DA'WAH</h2><h4 style="text-align:center;">${window.matriksAbsensiAktif.judul} | ${window.matriksAbsensiAktif.kategori==='siswa' ? 'Kelas: '+(window.matriksAbsensiAktif.kelas||'Semua') : 'PTK'}</h4>${html}</body></html>`;
    
    let blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    let a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `Rekap_${window.matriksAbsensiAktif.judul.replace(/\s/g, "_")}.xls`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showAlertBS("Berhasil", "Excel diunduh.", "success");
    setTimeout(() => { document.querySelectorAll('.modal-backdrop').forEach(el => el.remove()); document.body.classList.remove('modal-open'); }, 1000);
}

function lihatDetailSiswaDash(namaKelas) {
    document.getElementById("judulDetailKelas").innerText = namaKelas;
    let html = "";
    let filterSiswa = window.rawDashboardUsers.filter(u => u.kelas === namaKelas);
    
    filterSiswa.forEach((s, idx) => {
        html += `
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td>${idx + 1}</td>
            <td class="text-start">${s.nisn}</td>
            <td class="text-start fw-bold text-dark">${s.nama}</td>
            <td class="text-success fw-bold bg-light">${s.total.H}</td>
            <td class="text-danger fw-bold bg-light">${s.total.S}</td>
            <td class="text-warning text-dark fw-bold bg-light">${s.total.I}</td>
            <td class="fw-bold bg-light" style="color: #7e22ce;">${s.total.A}</td>
        </tr>`;
    });
    
    document.getElementById("tbDetailSiswaDashboard").innerHTML = html;
    new bootstrap.Modal(document.getElementById('modalDetailKelas')).show();
}