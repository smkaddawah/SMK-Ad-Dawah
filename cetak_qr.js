// ================= LOGIKA CETAK KARTU QR =================
function filterCetakQr() {
    const kat = document.getElementById("cetakQrKategori").value;
    const wadahKelas = document.getElementById("wadahCetakQrKelas");
    const selKelas = document.getElementById("cetakQrKelas");
    
    if (kat === "siswa") {
        wadahKelas.style.display = "block";
        selKelas.innerHTML = '<option value="">-- Semua Kelas --</option>' + (dataMaster.kelas ? dataMaster.kelas.map(k => `<option value="${k}">${k}</option>`).join("") : "");
    } else {
        wadahKelas.style.display = "none";
    }
}

async function tampilkanPreviewKartuQR() {
    const area = document.getElementById("areaCetakKartuQR");
    const kat = document.getElementById("cetakQrKategori").value;
    const kls = document.getElementById("cetakQrKelas").value;
    
    area.innerHTML = '<div class="col-12 text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br>Menyiapkan kartu...</div>';
    
    const res = await panggilAPI({ aksi: "get_all_users_qr" });
    if (res.status === "sukses") {
        let targetData = res.data.filter(u => u.role === kat);
        if (kat === "siswa" && kls !== "") {
            targetData = targetData.filter(u => u.kelas === kls);
        }

        if (targetData.length === 0) {
            area.innerHTML = '<div class="col-12 text-center text-danger py-5">Data tidak ditemukan.</div>';
            return;
        }

        // 1. REVISI: Kumpulkan semua desain kartu ke dalam satu variabel teks dulu
        let semuaKartuHTML = "";
        targetData.forEach((user, i) => {
            semuaKartuHTML += `
                <div class="col-auto">
                    <div class="card border border-dark border-2 rounded-3 p-3 text-center bg-white shadow-sm" style="width: 250px; height: 380px; position: relative;">
                        <h6 class="fw-bold text-dark mb-0 border-bottom border-dark pb-2">KARTU ABSENSI<br><small class="text-success">SMK AD-DA'WAH</small></h6>
                        <div class="d-flex justify-content-center my-3">
                            <div id="qrPrint_${i}" style="padding: 10px; border: 2px solid #ccc; border-radius: 10px; background-color: #fff;"></div>
                        </div>
                        <h5 class="fw-bold text-dark mb-0" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${user.nama}">${user.nama}</h5>
                        <p class="text-muted small mb-0">${user.role === 'guru' ? 'GURU / STAFF' : 'SISWA'}</p>
                        <p class="fw-bold text-danger mb-0">${user.username}</p>
                        ${user.kelas ? `<p class="badge bg-secondary mb-0 mt-2">${user.kelas}</p>` : ''}
                    </div>
                </div>
            `;
        });

        // 2. Tampilkan semua kartu ke layar secara serentak
        area.innerHTML = semuaKartuHTML;

        // 3. REVISI: Beri jeda waktu (setTimeout) agar HTML selesai dimuat browser, baru gambar QR-nya
        setTimeout(() => {
            targetData.forEach((user, i) => {
                const qrWadah = document.getElementById(`qrPrint_${i}`);
                if (qrWadah) {
                    qrWadah.innerHTML = ""; // Bersihkan agar tidak numpuk
                    new QRCode(qrWadah, { 
                        text: user.username, 
                        width: 120, 
                        height: 120 
                    });
                }
            });
        }, 150); // Jeda 150 milidetik
    }
}

function downloadPDFKartuQR() {
    const area = document.getElementById("areaCetakKartuQR");
    if(area.innerHTML.includes("Silakan pilih") || area.innerHTML.includes("Data tidak")) {
        showAlertBS("Perhatian", "Tampilkan data kartu terlebih dahulu!", "warning"); return;
    }
    showAlertBS("Menyimpan PDF", "Harap tunggu, proses generate PDF memerlukan waktu...", "info");
    
    const opt = {
        margin:       10,
        filename:     `Kartu_QR_${document.getElementById("cetakQrKategori").value}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(area).save();
}