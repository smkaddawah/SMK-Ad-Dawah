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
                            <td><button class="btn btn-sm btn-info text-white fw-bold" onclick="tampilkanRiwayat('${s.nisn}')"><i class="fa-solid fa-eye me-1"></i>Lihat Riwayat</button></td>
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
    
    // Memanggil fungsi dari script.js
    if (typeof tampilkanPreviewRekap === 'function' && typeof unduhPDFRekap === 'function') {
        await tampilkanPreviewRekap(namaKelas, "Semua Bulan");
        unduhPDFRekap(namaKelas, "Semua Bulan");
    } else {
        showAlertBS("Error", "Fungsi cetak rekap belum tersedia di script utama.", "error");
    }
}

// ================= FUNGSI BARU: LIHAT RIWAYAT SISWA UNTUK WALI KELAS =================
async function tampilkanRiwayat(nisn) {
    // Hapus modal lama jika ada agar tidak menumpuk
    let oldModal = document.getElementById("modalDynamicRiwayat");
    if(oldModal) oldModal.remove();

    // Buat HTML Modal
    let modalHTML = `
    <div class="modal fade" id="modalDynamicRiwayat" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content rounded-4 border-0">
                <div class="modal-header bg-info text-white">
                    <h5 class="modal-title fw-bold"><i class="fa-solid fa-clock-rotate-left me-2"></i>Riwayat Pelanggaran: ${nisn}</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle text-center">
                            <thead class="table-light"><tr><th>Tanggal</th><th>Pelanggaran & Kronologi</th><th>Poin</th><th>Pelapor</th><th>Bukti</th></tr></thead>
                            <tbody id="tbDynamicRiwayat">
                                <tr><td colspan="5" class="text-center py-4"><i class="fa-solid fa-spinner fa-spin me-2"></i>Memuat riwayat...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    
    // Masukkan modal ke dalam body dan tampilkan
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    let modalInstance = new bootstrap.Modal(document.getElementById("modalDynamicRiwayat"));
    modalInstance.show();

    // Ambil data riwayat
    const res = await panggilAPI({ aksi: "get_riwayat", nisn: nisn });
    const tb = document.getElementById("tbDynamicRiwayat");
    
    if (res.status === "sukses" && res.data.length > 0) {
        tb.innerHTML = res.data.map(r => `
          <tr>
            <td>${new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
            <td class="text-start"><b>${r.namaPelanggaran}</b><br><small class="text-muted">${r.keterangan || '-'}</small></td>
            <td><span class="badge bg-danger">+${r.bobot}</span></td>
            <td>${r.pelapor}</td>
            <td>${r.bukti && (String(r.bukti).startsWith('data:image') || String(r.bukti).startsWith('http')) ? `<a href="${r.bukti}" target="_blank" class="btn btn-sm btn-outline-success fw-bold"><i class="fa-solid fa-image"></i> Foto</a>` : '<span class="text-muted small">Tidak ada</span>'}</td>
          </tr>
        `).join("");
    } else {
        tb.innerHTML = "<tr><td colspan='5' class='text-center text-muted py-4'>Siswa ini belum memiliki catatan pelanggaran.</td></tr>";
    }
}

// ================= FUNGSI ABSENSI KHUSUS WALI KELAS =================
async function loadAbsensiWaliKelas() {
    const tglMulai = document.getElementById("waliAbsenStart").value;
    const tglAkhir = document.getElementById("waliAbsenEnd").value;
    const tb = document.getElementById("tbAbsenWali");

    if(!tglMulai || !tglAkhir) { showAlertBS("Perhatian", "Pilih rentang tanggal terlebih dahulu!", "warning"); return; }
    
    tb.innerHTML = '<tr><td colspan="6" class="py-4"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data absensi...</td></tr>';

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
                <td class="text-success fw-bold">${d.waktu_masuk || '-'}</td>
                <td class="text-danger fw-bold">${d.waktu_pulang || '-'}</td>
                <td><span class="badge bg-${d.waktu_pulang ? 'success' : 'primary'}">${d.waktu_pulang ? 'Selesai' : 'Hadir'}</span></td>
            </tr>
        `).join("");
    } else {
        tb.innerHTML = '<tr><td colspan="6" class="text-muted py-4">Tidak ada data absensi di tanggal tersebut.</td></tr>';
    }
}

// ================= REVISI: CETAK PDF TEKS ASLI + KOP SURAT =================
function cetakPDFAbsensiWali() {
    const area = document.getElementById("areaCetakAbsenWali");
    if(area.innerHTML.includes("Tidak ada data") || area.innerHTML.includes("Pilih tanggal")) {
        showAlertBS("Perhatian", "Tampilkan data absensi terlebih dahulu sebelum cetak PDF!", "warning"); return;
    }

    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF.API.autoTable) {
        showAlertBS("Memuat Mesin PDF...", "Sedang menyiapkan modul Teks Asli...", "info");
        let script1 = document.createElement("script"); script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script1.onload = () => {
            let script2 = document.createElement("script"); script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js";
            script2.onload = () => eksekusiCetakAbsenWali(); document.head.appendChild(script2);
        };
        document.head.appendChild(script1);
    } else { eksekusiCetakAbsenWali(); }

    function eksekusiCetakAbsenWali() {
        showAlertBS("Menyimpan PDF", "Memproses laporan absensi (Teks Asli)...", "info");
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        let tglMulai = document.getElementById("waliAbsenStart").value;
        let tglAkhir = document.getElementById("waliAbsenEnd").value;
        
        // Memuat Kop Surat
        let imgKop = new Image(); imgKop.crossOrigin = "Anonymous"; imgKop.src = "https://i.ibb.co.com/LXG3HPx2/kop.png";
        
        let prosesPDF = function() {
            // Tulis Kop Surat di Halaman 1 Saja
            try { doc.addImage(imgKop, 'PNG', 15, 10, 180, 25); doc.setLineWidth(0.6); doc.line(15, 37, 195, 37); } catch(e) {}
            
            doc.setFont("times", "bold"); doc.setFontSize(13);
            doc.text(`REKAPITULASI ABSENSI KELAS: ${globalKelasWali}`, 105, 46, { align: "center" });
            doc.setFontSize(10); doc.setFont("times", "normal");
            doc.text(`Periode: ${tglMulai} s/d ${tglAkhir}`, 105, 52, { align: "center" });

            // Generate Tabel Teks Asli (Bisa diblok & di-copy)
            doc.autoTable({
                html: '#areaCetakAbsenWali table',
                startY: 58, theme: 'grid',
                styles: { font: 'times', fontSize: 10, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, halign: 'center', valign: 'middle' },
                headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
                columnStyles: { 2: { halign: 'left' } } // Kolom Nama Siswa rata kiri
            });
            
            doc.save(`Absensi_Kelas_${globalKelasWali}.pdf`);
        };
        
        if (imgKop.complete) prosesPDF(); else { imgKop.onload = prosesPDF; imgKop.onerror = prosesPDF; }
    }
}