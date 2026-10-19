// ================= LOGIKA REKAP ABSENSI MATRIKS (ADMIN) =================

// Variabel global untuk menyimpan data matriks yang siap dicetak
window.matriksAbsensiAktif = null;

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

// Helper untuk format bulan ke Bahasa Indonesia
const getNamaBulanIndo = (bulanAngka) => {
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return bulan[parseInt(bulanAngka) - 1] || "";
}

async function tampilkanRekapAbsen() {
    const tipe = document.getElementById("filterTipeRekapAbsen").value;
    const kat = document.getElementById("filterAbsenKategori").value;
    const kls = document.getElementById("filterAbsenKelas").value;
    
    let start = "", end = "", teksJudul = "", thn = "", bl = "";

    if (tipe === "harian") {
        start = document.getElementById("inputAbsenHarian").value; end = start;
        if(!start) return showAlertBS("Perhatian", "Pilih tanggal harian!", "warning");
        teksJudul = `Tanggal: ${new Date(start).toLocaleDateString('id-ID')}`;
    } else if (tipe === "mingguan") {
        start = document.getElementById("inputAbsenStart").value; end = document.getElementById("inputAbsenEnd").value;
        if(!start || !end) return showAlertBS("Perhatian", "Pilih rentang tanggal mulai dan akhir!", "warning");
        teksJudul = `Periode: ${start} s/d ${end}`;
    } else if (tipe === "bulanan") {
        let bln = document.getElementById("inputAbsenBulan").value; 
        if(!bln) return showAlertBS("Perhatian", "Pilih bulan!", "warning");
        thn = bln.split("-")[0]; bl = bln.split("-")[1];
        start = `${thn}-${bl}-01`;
        let lastDay = new Date(thn, bl, 0).getDate();
        end = `${thn}-${bl}-${lastDay}`;
        teksJudul = `Bulan ${getNamaBulanIndo(bl)} ${thn}`;
    }

    const tbContainer = document.querySelector(".table-responsive");
    tbContainer.innerHTML = '<div class="text-center py-5"><i class="fa-solid fa-spinner fa-spin fs-2 text-success"></i><br>Menyiapkan Matriks Absensi...</div>';

    const res = await panggilAPI({ aksi: "get_rekap_absensi", startDate: start, endDate: end, kelas: kls, roleTujuan: kat });

    if (res.status === "sukses" && res.data.length > 0) {
        // --- 1. BANGUN STRUKTUR MATRIKS & CEK HARI MINGGU ---
        let startD = new Date(start);
        let endD = new Date(end);
        let jumlahHari = Math.round((endD - startD) / (1000 * 60 * 60 * 24)) + 1;
        
        let tglArray = [];
        for(let i=0; i<jumlahHari; i++) {
            let tempD = new Date(startD);
            tempD.setDate(startD.getDate() + i);
            tglArray.push({ 
                full: tempD.toISOString().split('T')[0], 
                tgl: tempD.getDate(),
                hariMinggu: tempD.getDay() === 0 // 0 berarti Hari Minggu
            });
        }

        // --- 2. KELOMPOKKAN DATA PER SISWA ---
        let rekapSiswa = {};
        res.data.forEach(d => {
            let idUser = d.username;
            if(!rekapSiswa[idUser]) {
                rekapSiswa[idUser] = { 
                    nisn: d.username, nama: d.nama, kelas: d.kelas || '-', 
                    absen: {}, total: { H:0, S:0, I:0, A:0 } 
                };
            }
            
            let tglLog = d.tanggal.split('T')[0];
            let objHari = tglArray.find(t => t.full === tglLog);
            let isMinggu = objHari ? objHari.hariMinggu : false;

            // JANGAN hitung absensi (terutama Alpa) di hari Minggu
            if (!isMinggu) {
                let stat = 'A';
                if (d.status_hadir === 'S' || d.status_hadir === 'SAKIT') stat = 'S';
                else if (d.status_hadir === 'I' || d.status_hadir === 'IZIN') stat = 'I';
                else if (d.status_hadir === 'H' || d.waktu_masuk) stat = 'H';
                
                rekapSiswa[idUser].absen[tglLog] = stat;
                rekapSiswa[idUser].total[stat]++;
            }
        });

        let dataMatriks = Object.values(rekapSiswa).sort((a,b) => a.nama.localeCompare(b.nama));
        window.matriksAbsensiAktif = { data: dataMatriks, hari: tglArray, judul: teksJudul, kategori: kat, kelas: kls };

        // --- 3. RENDER TABEL HTML (PREVIEW) ---
        document.getElementById("subjudulLaporanAbsen").innerHTML = `<b>REKAPITULASI KEHADIRAN ${tipe.toUpperCase()}</b><br>${teksJudul} | Kelas: ${kls || 'Semua Kelas'}`;
        document.getElementById("headerKopAbsen").style.display = "block";

        let theadHTML = `
            <tr class="align-middle" style="background-color: #0b5ed7; color: white;">
                <th style="width: 30px;">No</th>
                <th style="min-width: 90px;">NISN</th>
                <th style="min-width: 180px;">Nama Siswa</th>
                <th>Kls</th>`;
        
        tglArray.forEach(t => { 
            // Header tanggal merah jika hari minggu
            let warnaBulan = t.hariMinggu ? 'color: #ffcccc;' : '';
            theadHTML += `<th style="width:25px; padding: 5px; ${warnaBulan}">${t.tgl}</th>`; 
        });
        theadHTML += `<th class="bg-success">H</th><th class="bg-info">S</th><th class="bg-warning text-dark">I</th><th class="bg-danger">A</th></tr>`;

        let tbodyHTML = "";
        dataMatriks.forEach((s, idx) => {
            tbodyHTML += `<tr>
                <td>${idx+1}</td>
                <td class="text-start">${s.nisn}</td>
                <td class="text-start fw-bold" style="font-size: 0.85rem;">${s.nama}</td>
                <td>${s.kelas}</td>`;
            
            tglArray.forEach(t => {
                if (t.hariMinggu) {
                    // Fill Hitam Pekat untuk Hari Minggu
                    tbodyHTML += `<td style="background-color: #343a40; border-color: #343a40;"></td>`;
                } else {
                    let stat = s.absen[t.full];
                    let bg = "";
                    if(stat==='H') bg = "text-success fw-bold";
                    else if(stat==='S') bg = "text-info fw-bold";
                    else if(stat==='I') bg = "text-warning fw-bold";
                    else if(stat==='A') bg = "text-danger fw-bold";
                    tbodyHTML += `<td class="${bg}">${stat || '-'}</td>`;
                }
            });

            tbodyHTML += `
                <td class="fw-bold text-success bg-light">${s.total.H}</td>
                <td class="fw-bold text-info bg-light">${s.total.S}</td>
                <td class="fw-bold text-warning bg-light">${s.total.I}</td>
                <td class="fw-bold text-danger bg-light">${s.total.A}</td>
            </tr>`;
        });

        tbContainer.innerHTML = `
        <table class="table table-bordered table-sm table-hover align-middle mb-0 text-center" id="tabelRekapAbsenSistem" style="font-size: 0.8rem;">
            <thead>${theadHTML}</thead>
            <tbody id="tbRekapAbsenAdmin">${tbodyHTML}</tbody>
        </table>`;
        
    } else {
        document.getElementById("headerKopAbsen").style.display = "none";
        tbContainer.innerHTML = '<div class="alert alert-warning text-center fw-bold m-3">Tidak ada data kehadiran pada filter yang dipilih.</div>';
        window.matriksAbsensiAktif = null;
    }
}

function cariDiTabelAbsen() {
    let input = document.getElementById("pencarianTabelAbsen").value.toLowerCase();
    let trs = document.querySelectorAll("#tbRekapAbsenAdmin tr");
    trs.forEach(tr => {
        let teksBaris = tr.innerText.toLowerCase();
        tr.style.display = teksBaris.includes(input) ? "" : "none";
    });
}



function downloadPDFAbsensiAdmin() {
    if(!window.matriksAbsensiAktif) {
        showAlertBS("Perhatian", "Tampilkan data yang valid dengan mengklik Cari terlebih dahulu!", "warning"); return;
    }

    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF.API.autoTable) {
        showAlertBS("Memuat Mesin PDF...", "Sedang menyiapkan modul...", "info");
        let script1 = document.createElement("script"); script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script1.onload = () => {
            let script2 = document.createElement("script"); script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js";
            script2.onload = () => eksekusiCetakMatriksPDF(); document.head.appendChild(script2);
        };
        document.head.appendChild(script1);
    } else { eksekusiCetakMatriksPDF(); }

    function eksekusiCetakMatriksPDF() {
        showAlertBS("Menyimpan PDF", "Memproses laporan matriks absensi...", "info");
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'legal'); 
        
        let mData = window.matriksAbsensiAktif;
        let imgKop = new Image(); imgKop.crossOrigin = "Anonymous"; imgKop.src = "https://i.ibb.co.com/LXG3HPx2/kop.png";
        
        let prosesPDF = function() {
            try { doc.addImage(imgKop, 'PNG', 15, 10, 325, 38); doc.setLineWidth(0.8); doc.line(15, 52, 340, 52); } catch(e) {}
            
            doc.setFont("times", "bold"); doc.setFontSize(14);
            let tipeJudul = document.getElementById("filterTipeRekapAbsen").value.toUpperCase();
            doc.text(`REKAPITULASI KEHADIRAN ${tipeJudul}`, 177.5, 62, { align: "center" });
            doc.setFontSize(11); doc.setFont("times", "normal");
            doc.text(`${mData.judul}   |   Kelas: ${mData.kelas || 'Semua Kelas'}`, 177.5, 68, { align: "center" });

            let headTbl = [["No", "NISN", "Nama Siswa", "Kls"]];
            mData.hari.forEach(t => headTbl[0].push(t.tgl.toString()));
            headTbl[0].push("H", "S", "I", "A");

            let bodyTbl = [];
            mData.data.forEach((s, idx) => {
                let row = [idx+1, s.nisn, s.nama, s.kelas];
                mData.hari.forEach(t => {
                    if (t.hariMinggu) row.push("");
                    else row.push(s.absen[t.full] || "-");
                });
                row.push(s.total.H, s.total.S, s.total.I, s.total.A);
                bodyTbl.push(row);
            });

            doc.autoTable({
                head: headTbl,
                body: bodyTbl,
                startY: 75, 
                theme: 'grid',
                styles: { font: 'times', fontSize: 7, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, halign: 'center', cellPadding: 1 },
                headStyles: { fillColor: [11, 94, 215], textColor: [255,255,255], fontStyle: 'bold', fontSize: 7.5 },
                columnStyles: { 2: { halign: 'left', cellWidth: 35 }, 1: { halign: 'left', cellWidth: 18 } },
                
                // --- PERBAIKAN: Gunakan didParseCell untuk memanipulasi warna background ---
                didParseCell: function(data) {
                    let totalCols = data.table.columns.length;
                    
                    if (data.section === 'head' && data.row.index === 0) {
                        if(data.column.index === totalCols-4) data.cell.styles.fillColor = [25, 135, 84]; 
                        if(data.column.index === totalCols-3) data.cell.styles.fillColor = [13, 202, 240]; 
                        if(data.column.index === totalCols-2) data.cell.styles.fillColor = [255, 193, 7]; 
                        if(data.column.index === totalCols-1) data.cell.styles.fillColor = [220, 53, 69]; 
                        
                        // Font hari minggu jadi merah muda
                        if (data.column.index >= 4 && data.column.index < totalCols - 4) {
                            let colTglIdx = data.column.index - 4;
                            if (mData.hari[colTglIdx].hariMinggu) data.cell.styles.textColor = [255, 150, 150];
                        }
                    }

                    if (data.section === 'body') {
                        // Warnai Fill Hitam Gelap di sel PDF untuk Hari Minggu
                        if (data.column.index >= 4 && data.column.index < totalCols - 4) {
                            let colTglIdx = data.column.index - 4;
                            if (mData.hari[colTglIdx].hariMinggu) {
                                data.cell.styles.fillColor = [52, 58, 64]; 
                            }
                        }
                    }
                }
            });
            
            doc.save(`Rekap_Absensi_${mData.judul.replace(/\s/g, "_")}.pdf`);
            
            showAlertBS("Berhasil", "File PDF berhasil diunduh.", "success");
            setTimeout(() => {
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }, 1000); 
        };
        
        if (imgKop.complete) prosesPDF(); else { imgKop.onload = prosesPDF; imgKop.onerror = prosesPDF; }
    }
}

async function downloadExcelAbsensiAdmin() {
    if(!window.matriksAbsensiAktif) {
        showAlertBS("Perhatian", "Tampilkan data yang valid dengan mengklik Cari terlebih dahulu!", "warning"); return;
    }
    
    showAlertBS("Memproses Excel...", "Mengunduh file Excel...", "info");
    
    let table = document.getElementById("tabelRekapAbsenSistem");
    let html = table.outerHTML;
    
    // Konversi warna CSS menjadi inline untuk dibaca Excel, termasuk kolom gelap Hari Minggu
    html = html.replace(/class="bg-success"/g, 'style="background-color: #198754; color: white;"');
    html = html.replace(/class="bg-info"/g, 'style="background-color: #0dcaf0; color: white;"');
    html = html.replace(/class="bg-warning text-dark"/g, 'style="background-color: #ffc107; color: black;"');
    html = html.replace(/class="bg-danger"/g, 'style="background-color: #dc3545; color: white;"');
    
    let template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Rekap_Absensi</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body>
        <h2 style="text-align:center;">LAPORAN ABSENSI YAYASAN AD-DA'WAH</h2>
        <h4 style="text-align:center;">${window.matriksAbsensiAktif.judul} | Kelas: ${window.matriksAbsensiAktif.kelas || 'Semua'}</h4>
        ${html}
    </body>
    </html>`;
    
    let blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = `Rekap_Absensi_${window.matriksAbsensiAktif.judul.replace(/\s/g, "_")}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showAlertBS("Berhasil", "File Excel berhasil diunduh.", "success");
    setTimeout(() => {
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }, 1000);
}



