// ================= LOGIKA REKAP ABSENSI (ADMIN) =================

function aturInputRekapAbsen() {
    const tipe = document.getElementById("filterTipeRekapAbsen").value;
    const kat = document.getElementById("filterAbsenKategori").value;
    
    // Tampilan Input Tanggal
    document.getElementById("wrapAbsenHarian").style.display = tipe === 'harian' ? 'block' : 'none';
    document.getElementById("wrapAbsenRentang").style.display = tipe === 'mingguan' ? 'block' : 'none';
    document.getElementById("wrapAbsenBulanan").style.display = tipe === 'bulanan' ? 'block' : 'none';

    // Tampilan Filter Kelas
    const wrapKelas = document.getElementById("wrapAbsenKelas");
    const selKelas = document.getElementById("filterAbsenKelas");
    if (kat === "siswa") {
        wrapKelas.style.display = "block";
        if (selKelas.options.length <= 1) { // Load option kelas jika belum ada
            selKelas.innerHTML = '<option value="">Semua Kelas</option>' + (dataMaster.kelas ? dataMaster.kelas.map(k => `<option value="${k}">${k}</option>`).join("") : "");
        }
    } else {
        wrapKelas.style.display = "none";
        selKelas.value = "";
    }
}

async function tampilkanRekapAbsen() {
    const tipe = document.getElementById("filterTipeRekapAbsen").value;
    const kat = document.getElementById("filterAbsenKategori").value;
    const kls = document.getElementById("filterAbsenKelas").value;
    
    let start = "", end = "", teksJudul = "";

    if (tipe === "harian") {
        start = document.getElementById("inputAbsenHarian").value;
        end = start;
        if(!start) return showAlertBS("Perhatian", "Pilih tanggal harian!", "warning");
        teksJudul = `Tanggal: ${new Date(start).toLocaleDateString('id-ID')}`;
    } else if (tipe === "mingguan") {
        start = document.getElementById("inputAbsenStart").value;
        end = document.getElementById("inputAbsenEnd").value;
        if(!start || !end) return showAlertBS("Perhatian", "Pilih rentang tanggal mulai dan akhir!", "warning");
        teksJudul = `Periode: ${start} s/d ${end}`;
    } else if (tipe === "bulanan") {
        let bln = document.getElementById("inputAbsenBulan").value; // Format: YYYY-MM
        if(!bln) return showAlertBS("Perhatian", "Pilih bulan!", "warning");
        let thn = bln.split("-")[0]; let bl = bln.split("-")[1];
        start = `${thn}-${bl}-01`;
        let lastDay = new Date(thn, bl, 0).getDate();
        end = `${thn}-${bl}-${lastDay}`;
        teksJudul = `Bulan: ${bl} Tahun ${thn}`;
    }

    const tb = document.getElementById("tbRekapAbsenAdmin");
    tb.innerHTML = '<tr><td colspan="7"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</td></tr>';

    const res = await panggilAPI({ aksi: "get_rekap_absensi", startDate: start, endDate: end, kelas: kls, roleTujuan: kat });

    if (res.status === "sukses" && res.data.length > 0) {
        document.getElementById("subjudulLaporanAbsen").innerHTML = `${teksJudul}<br>Kategori: ${kat.toUpperCase()} ${kls ? ' | KELAS: ' + kls : ''}`;
        
        tb.innerHTML = res.data.map((d, i) => `
            <tr>
                <td>${i+1}</td>
                <td>${new Date(d.tanggal).toLocaleDateString('id-ID')}</td>
                <td>${d.username}</td>
                <td class="text-start fw-bold">${d.nama}</td>
                <td>${d.kelas || '-'}</td>
                <td class="text-success">${d.waktu_masuk || '-'}</td>
                <td class="text-danger">${d.waktu_pulang || '-'}</td>
            </tr>
        `).join("");
    } else {
        tb.innerHTML = '<tr><td colspan="7" class="text-danger fw-bold py-3">Tidak ada data kehadiran pada filter yang dipilih.</td></tr>';
    }
}

function cariDiTabelAbsen() {
    let input = document.getElementById("pencarianTabelAbsen").value.toLowerCase();
    let trs = document.querySelectorAll("#tbRekapAbsenAdmin tr");
    trs.forEach(tr => {
        if(tr.cells.length > 1) { // Pastikan bukan row kosong/loading
            let teksBaris = tr.innerText.toLowerCase();
            tr.style.display = teksBaris.includes(input) ? "" : "none";
        }
    });
}

// ================= PERBAIKAN PDF & EXCEL ABSENSI ADMIN =================
function downloadPDFAbsensiAdmin() {
    const tb = document.getElementById("tbRekapAbsenAdmin");
    if(tb.innerText.includes("Silakan atur filter") || tb.innerText.includes("Tidak ada data")) {
        showAlertBS("Perhatian", "Tampilkan data yang valid terlebih dahulu!", "warning"); return;
    }

    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF.API.autoTable) {
        showAlertBS("Memuat Mesin PDF...", "Sedang menyiapkan modul Teks Asli...", "info");
        let script1 = document.createElement("script"); script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script1.onload = () => {
            let script2 = document.createElement("script"); script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js";
            script2.onload = () => eksekusiCetakAbsenAdmin(); document.head.appendChild(script2);
        };
        document.head.appendChild(script1);
    } else { eksekusiCetakAbsenAdmin(); }

    function eksekusiCetakAbsenAdmin() {
        showAlertBS("Menyimpan PDF", "Memproses laporan absensi (Teks Asli)...", "info");
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape agar lebih luas
        let subjudul = document.getElementById("subjudulLaporanAbsen").innerText.replace(/\n/g, " - ");
        
        let imgKop = new Image(); imgKop.crossOrigin = "Anonymous"; imgKop.src = "https://i.ibb.co.com/LXG3HPx2/kop.png";
        
        let prosesPDF = function() {
            try { doc.addImage(imgKop, 'PNG', 12, 10, 273, 32); doc.setLineWidth(0.6); doc.line(12, 44, 285, 44); } catch(e) {}
            
            doc.setFont("times", "bold"); doc.setFontSize(13);
            doc.text("LAPORAN REKAPITULASI ABSENSI", 148.5, 52, { align: "center" });
            doc.setFontSize(10); doc.setFont("times", "normal");
            doc.text(subjudul, 148.5, 58, { align: "center" });

            doc.autoTable({
                html: '#tabelRekapAbsenSistem',
                startY: 64, theme: 'grid',
                styles: { font: 'times', fontSize: 9.5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.2, halign: 'center', valign: 'middle' },
                headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
                columnStyles: { 3: { halign: 'left' } } 
            });
            
            doc.save("Rekap_Absensi_Admin.pdf");
        };
        
        if (imgKop.complete) prosesPDF(); else { imgKop.onload = prosesPDF; imgKop.onerror = prosesPDF; }
    }
}

async function downloadExcelAbsensiAdmin() {
    const tipe = document.getElementById("filterTipeRekapAbsen").value;
    const kat = document.getElementById("filterAbsenKategori").value;
    const kls = document.getElementById("filterAbsenKelas").value;
    
    let start = "", end = "", teksJudul = "";
    if (tipe === "harian") {
        start = document.getElementById("inputAbsenHarian").value; end = start;
        teksJudul = `Tanggal: ${new Date(start).toLocaleDateString('id-ID')}`;
    } else if (tipe === "mingguan") {
        start = document.getElementById("inputAbsenStart").value; end = document.getElementById("inputAbsenEnd").value;
        teksJudul = `Periode: ${start} s/d ${end}`;
    } else if (tipe === "bulanan") {
        let bln = document.getElementById("inputAbsenBulan").value; 
        let thn = bln.split("-")[0]; let bl = bln.split("-")[1];
        start = `${thn}-${bl}-01`; let lastDay = new Date(thn, bl, 0).getDate(); end = `${thn}-${bl}-${lastDay}`;
        teksJudul = `Bulan: ${bl} Tahun ${thn}`;
    }

    if(!start) return showAlertBS("Perhatian", "Atur filter tanggal terlebih dahulu!", "warning");
    showAlertBS("Memproses Excel...", "Menyiapkan data absensi...", "info");

    const res = await panggilAPI({ aksi: "get_rekap_absensi", startDate: start, endDate: end, kelas: kls, roleTujuan: kat });
    
    if (res.status === "sukses" && res.data.length > 0) {
        let headers = ["No", "Tanggal", "ID/NISN", "Nama Lengkap", "Kelas", "Masuk", "Pulang", "Status"];
        let dataArr = res.data.map((d, i) => [
            i + 1, new Date(d.tanggal).toLocaleDateString('id-ID'), d.username, d.nama, d.kelas || "-", 
            d.waktu_masuk || "Belum Absen", d.waktu_pulang || "Belum Absen",
            (d.waktu_masuk && d.waktu_pulang) ? "Selesai" : (d.waktu_masuk ? "Hanya Masuk" : "Tidak Hadir / Alpa")
        ]);
        
        let judulAsli = `LAPORAN ABSENSI - ${teksJudul.toUpperCase()} - ${kat.toUpperCase()} ${kls ? 'KELAS ' + kls : ''}`;
        unduhExcelLengkap(dataArr, headers, "Rekap_Absensi_Admin", judulAsli, [2]);
    }
}