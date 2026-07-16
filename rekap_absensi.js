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

function downloadPDFAbsensiAdmin() {
    const area = document.getElementById("areaCetakRekapAbsen");
    if(area.innerText.includes("Silakan atur filter") || area.innerText.includes("Tidak ada data")) {
        showAlertBS("Perhatian", "Tampilkan data yang valid terlebih dahulu!", "warning"); return;
    }
    
    document.getElementById("headerKopAbsen").style.display = "block"; // Munculkan Kop Surat
    showAlertBS("Memproses PDF", "Harap tunggu...", "info");
    
    const opt = {
        margin: 10,
        filename: `Rekap_Absensi.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(area).save().then(() => {
        document.getElementById("headerKopAbsen").style.display = "none"; // Sembunyikan Kop Surat setelah selesai
    });
}