// ================= LOGIKA WALI KELAS TERBARU =================
let globalKelasWali = "";

function switchWaliTab(tab) {
    document.querySelectorAll("#walikelasTabs .nav-link").forEach(el => el.classList.remove("active"));
    document.getElementById("waliTabSiswa").style.display = tab === 'siswa' ? 'block' : 'none';
    document.getElementById("waliTabAbsensi").style.display = tab === 'absensi' ? 'block' : 'none';
    event.currentTarget.classList.add("active");
}

async function initWaliKelas(namaKelas) {
    globalKelasWali = namaKelas;
    document.getElementById("namaKelasWaliBadge").innerText = "Kelas: " + namaKelas;
    document.getElementById("lblKelasAbsenWali").innerText = namaKelas;
    
    // Tombol export poin
    const wadah = document.getElementById("wadahDataWali");
    wadah.innerHTML = `
        <div class="mb-3">
            <button class="btn btn-danger btn-sm" onclick="exportPdfWaliKelas('${namaKelas}')">
                <i class="fa-solid fa-file-pdf me-1"></i> Export PDF Poin Kelas ${namaKelas}
            </button>
        </div>
        <div id="tabelSiswaWali"></div>
    `;
    
    // Set default tanggal hari ini di tab absensi
    const hariIni = new Date().toISOString().split('T')[0];
    document.getElementById("waliAbsenStart").value = hariIni;
    document.getElementById("waliAbsenEnd").value = hariIni;

    loadSiswaWali(namaKelas);
    switchWaliTab('siswa'); // Set default tab
}

async function loadSiswaWali(namaKelas) {
    const wadah = document.getElementById("tabelSiswaWali");
    wadah.innerHTML = "<p>Memuat data...</p>";

    const res = await panggilAPI({ aksi: "get_all_siswa" });
    if (res.status === "sukses") {
        const siswaKelas = res.data.filter(s => s.kelas === namaKelas);
        wadah.innerHTML = `
            <table class="table table-hover align-middle">
                <thead class="table-light"><tr><th>NISN</th><th>Nama</th><th>Poin</th><th>Aksi</th></tr></thead>
                <tbody>
                    ${siswaKelas.map(s => `
                        <tr>
                            <td>${s.nisn}</td>
                            <td>${s.nama}</td>
                            <td><span class="badge bg-danger">${s.poin}</span></td>
                            <td><button class="btn btn-sm btn-info text-white" onclick="tampilkanRiwayat('${s.nisn}')">Lihat Riwayat</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

async function exportPdfWaliKelas(namaKelas) {
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    showAlertBS("Mengunduh...", "Sedang menyiapkan PDF Poin untuk kelas " + namaKelas + "...", "info");
    await tampilkanPreviewRekap(namaKelas, "Semua Bulan");
    unduhPDFRekap(namaKelas, "Semua Bulan");
}

// FUNGSI ABSENSI KHUSUS WALI KELAS
async function loadAbsensiWaliKelas() {
    const tglMulai = document.getElementById("waliAbsenStart").value;
    const tglAkhir = document.getElementById("waliAbsenEnd").value;
    const tb = document.getElementById("tbAbsenWali");

    if(!tglMulai || !tglAkhir) { showAlertBS("Perhatian", "Pilih rentang tanggal terlebih dahulu!", "warning"); return; }
    
    tb.innerHTML = '<tr><td colspan="6"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data absensi...</td></tr>';

    const res = await panggilAPI({ 
        aksi: "get_rekap_absensi", 
        startDate: tglMulai, 
        endDate: tglAkhir, 
        kelas: globalKelasWali, 
        roleTujuan: 'siswa' 
    });

    if (res.status === "sukses" && res.data.length > 0) {
        tb.innerHTML = res.data.map(d => `
            <tr>
                <td>${new Date(d.tanggal).toLocaleDateString('id-ID')}</td>
                <td>${d.username}</td>
                <td class="text-start fw-bold">${d.nama}</td>
                <td class="text-success">${d.waktu_masuk || '-'}</td>
                <td class="text-danger">${d.waktu_pulang || '-'}</td>
                <td><span class="badge bg-${d.waktu_pulang ? 'success' : 'primary'}">${d.waktu_pulang ? 'Selesai' : 'Hadir'}</span></td>
            </tr>
        `).join("");
    } else {
        tb.innerHTML = '<tr><td colspan="6" class="text-muted">Tidak ada data absensi di tanggal tersebut.</td></tr>';
    }
}

function cetakPDFAbsensiWali() {
    const area = document.getElementById("areaCetakAbsenWali");
    if(area.innerHTML.includes("Tidak ada data") || area.innerHTML.includes("Pilih tanggal")) {
        showAlertBS("Perhatian", "Tampilkan data absensi terlebih dahulu sebelum cetak PDF!", "warning"); return;
    }
    showAlertBS("Menyimpan PDF", "Memproses laporan absensi...", "info");
    const opt = {
        margin: 10,
        filename: `Absensi_${globalKelasWali}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(area).save();
}