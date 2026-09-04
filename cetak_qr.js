// ================= LOGIKA CETAK KARTU QR (MURNI SUPABASE) =================
function filterCetakQr() {
    const kat = document.getElementById("cetakQrKategori").value;
    const wadahKelas = document.getElementById("wadahCetakQrKelas");
    const selKelas = document.getElementById("cetakQrKelas");
    
    if (kat === "siswa") {
        wadahKelas.style.display = "block";
        selKelas.innerHTML = '<option value="">-- Semua Kelas --</option>' + (typeof dataMaster !== 'undefined' && dataMaster.kelas ? dataMaster.kelas.map(k => `<option value="${k}">${k}</option>`).join("") : "");
    } else {
        wadahKelas.style.display = "none";
    }
}

async function tampilkanPreviewKartuQR() {
    const area = document.getElementById("areaCetakKartuQR");
    const kat = document.getElementById("cetakQrKategori").value; // 'siswa' atau 'guru'
    const kls = document.getElementById("cetakQrKelas").value;
    
    area.innerHTML = '<div class="col-12 text-center py-5"><i class="fa-solid fa-spinner fa-spin fa-2x text-primary"></i><br>Menyiapkan kartu dari Supabase...</div>';
    
    try {
        let query = supabaseClient.from('users').select('*');
        
        if (kat === "siswa") {
            query = query.eq('role', 'siswa');
            if (kls !== "") {
                query = query.eq('kelas', kls);
            }
            query = query.order('nama_lengkap', { ascending: true });
        } else {
            // Tarik GURU dan WALI KELAS sekaligus langsung dari Supabase!
            query = query.in('role', ['guru', 'walikelas']).order('nama_lengkap', { ascending: true });
        }

        const { data: targetData, error } = await query;

        if (error) throw error;

        if (!targetData || targetData.length === 0) {
            area.innerHTML = '<div class="col-12 text-center text-danger py-5">Data tidak ditemukan di database Supabase.</div>';
            return;
        }

        // 1. Kumpulkan semua desain kartu ke dalam variabel teks
        let semuaKartuHTML = "";
        targetData.forEach((user, i) => {
            let namaTampil = user.nama_lengkap || user.username;
            
            let labelRole = "SISWA";
            if (user.role === 'guru') labelRole = 'GURU / STAFF';
            if (user.role === 'walikelas') labelRole = 'WALI KELAS';
            
            let qrText = String(user.username).replace(/'/g, "").trim();

            semuaKartuHTML += `
                <div class="col-auto">
                    <div class="card border border-dark border-2 rounded-3 p-3 text-center bg-white shadow-sm" style="width: 250px; height: 380px; position: relative;">
                        <h6 class="fw-bold text-dark mb-0 border-bottom border-dark pb-2">KARTU ABSENSI<br><small class="text-success">SMK AD-DA'WAH</small></h6>
                        <div class="d-flex justify-content-center my-3">
                            <div id="qrPrint_${i}" style="padding: 10px; border: 2px solid #ccc; border-radius: 10px; background-color: #fff; width: 144px; height: 144px;"></div>
                        </div>
                        <h5 class="fw-bold text-dark mb-0" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${namaTampil}">${namaTampil}</h5>
                        <p class="text-muted small mb-0">${labelRole}</p>
                        <p class="fw-bold text-danger mb-0">${qrText}</p>
                        ${user.kelas && user.role === 'siswa' ? `<p class="badge bg-secondary mb-0 mt-2">${user.kelas}</p>` : ''}
                    </div>
                </div>
            `;
        });

        // 2. Tampilkan semua kartu ke layar
        area.innerHTML = `<div class="row justify-content-center g-3">${semuaKartuHTML}</div>`;

        // 3. Render Barcode QR Code
        setTimeout(() => {
            targetData.forEach((user, i) => {
                const qrWadah = document.getElementById(`qrPrint_${i}`);
                if (qrWadah) {
                    qrWadah.innerHTML = ""; 
                    let qrText = String(user.username).replace(/'/g, "").trim();
                    new QRCode(qrWadah, { 
                        text: qrText, 
                        width: 120, 
                        height: 120 
                    });
                }
            });
        }, 250); 

    } catch (error) {
        console.error("Error Supabase Cetak QR:", error);
        area.innerHTML = `<div class="col-12 text-center text-danger py-5">Gagal memuat data: ${error.message}</div>`;
    }
}

function downloadPDFKartuQR() {
    const area = document.getElementById("areaCetakKartuQR");
    if(area.innerHTML.includes("Silakan pilih") || area.innerHTML.includes("Data tidak ditemukan")) {
        if(typeof showAlertBS === 'function') {
            showAlertBS("Perhatian", "Tampilkan data kartu terlebih dahulu!", "warning");
        } else {
            alert("Tampilkan data kartu terlebih dahulu!");
        }
        return; 
    }
    
    if(typeof showAlertBS === 'function') {
        showAlertBS("Menyimpan PDF", "Harap tunggu, proses generate PDF memerlukan waktu...", "info");
    }
    
    const opt = {
        margin:       10,
        filename:     `Kartu_QR_${document.getElementById("cetakQrKategori").value}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(area).save();
}       