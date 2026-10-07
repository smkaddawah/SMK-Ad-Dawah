// ================= LOGIKA CETAK KARTU (MURNI SUPABASE) =================
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
    const kat = document.getElementById("cetakQrKategori").value; 
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
            query = query.in('role', ['guru', 'walikelas']).order('nama_lengkap', { ascending: true });
        }

        const { data: targetData, error } = await query;

        if (error) throw error;

        if (!targetData || targetData.length === 0) {
            area.innerHTML = '<div class="col-12 text-center text-danger py-5">Data tidak ditemukan di database Supabase.</div>';
            return;
        }

        let semuaKartuHTML = "";
        targetData.forEach((user) => {
            // Judul Header menyesuaikan Role
            let titleKartu = user.role === 'siswa' ? "KARTU PELAJAR" : "KARTU IDENTITAS GURU";

            // Logika Ketentuan Kartu Pelajar / Guru (Margin, padding, dan line-height dirapatkan)
            let ketentuanHTML = "";
            if (user.role === 'siswa') {
                ketentuanHTML = `
                    <div class="text-start flex-grow-1 d-flex flex-column px-1" style="font-size: 0.5rem; line-height: 1.25; position: relative; z-index: 2;">
                        <ol class="ps-3 pe-1 mb-0 flex-grow-1" style="text-align: justify;">
                            <li class="pb-1">Kartu Pelajar wajib dibawa dan digunakan selama berada di lingkungan sekolah.</li>
                            <li class="pb-1">Kartu Pelajar merupakan identitas resmi siswa SMK Addawah Jakarta dan tidak boleh dipindahtangankan.</li>
                            <li class="pb-1">Kartu Pelajar wajib dijaga dengan baik dan tidak boleh dicoret, dilipat, atau dirusak.</li>
                            <li class="pb-1">Kartu Pelajar wajib ditunjukkan apabila diminta oleh guru, tenaga kependidikan, atau petugas sekolah.</li>
                            <li class="pb-1">Apabila Kartu Pelajar hilang, siswa wajib segera melapor kepada pihak sekolah dan dikenakan biaya penggantian sebesar Rp 100.000.</li>
                            <li>Apabila kartu ini hilang, bagi yang menemukan diharapkan mengembalikan ke sekolah.</li>
                        </ol>
                        <div class="text-center fst-italic mt-auto mb-1 fw-bold text-success" style="font-size: 0.5rem; line-height: 1.1;">“Jaga Kartu Pelajar, Jaga Identitas dan Tanggung Jawab sebagai Siswa.”</div>
                    </div>
                `;
            } else {
                ketentuanHTML = `
                    <div class="text-start flex-grow-1 d-flex flex-column px-1" style="font-size: 0.5rem; line-height: 1.25; position: relative; z-index: 2;">
                        <ol class="ps-3 pe-1 mb-0 flex-grow-1" style="text-align: justify;">
                            <li class="pb-1">Kartu Identitas Guru wajib dibawa dan digunakan selama berada di lingkungan sekolah.</li>
                            <li class="pb-1">Kartu Identitas Guru merupakan identitas resmi Dewan Guru SMK Addawah Jakarta dan tidak boleh dipindahtangankan.</li>
                            <li class="pb-1">Kartu Identitas Guru wajib dijaga dengan baik dan tidak boleh dicoret, dilipat, atau dirusak.</li>
                            <li class="pb-1">Kartu Identitas Guru wajib ditunjukkan apabila diperlukan untuk kepentingan administrasi atau identifikasi.</li>
                            <li class="pb-1">Apabila Kartu Identitas Guru hilang, wajib segera melapor kepada pihak sekolah dan dikenakan biaya penggantian sebesar Rp50.000.</li>
                            <li>Apabila kartu ini hilang, bagi yang menemukan diharapkan mengembalikan ke sekolah.</li>
                        </ol>
                        <div class="text-center fst-italic mt-auto mb-1 fw-bold text-success" style="font-size: 0.5rem; line-height: 1.1;">"Identitas, Profesionalitas, dan Integritas dalam Menjalankan Tugas."</div>
                    </div>
                `;
            }

            // Render Desain Kartu Belakang dengan penambahan Watermark Logo
            semuaKartuHTML += `
                <div class="col-auto mb-2" style="page-break-inside: avoid; break-inside: avoid;">
                    <div class="card border border-dark border-2 rounded-3 p-2 text-center bg-white shadow-sm d-flex flex-column" style="width: 54mm; height: 86mm; box-sizing: border-box; position: relative; overflow: hidden; z-index: 1;">
                        
                        <!-- Watermark Logo Transparan -->
                        <img src="assets/img/logo.png" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 75%; opacity: 0.12; z-index: 0;" alt="Watermark">

                        <!-- Header -->
                        <div class="fw-bold text-dark mb-2 border-bottom border-dark pb-2" style="font-size: 0.85rem; line-height: 1.2; position: relative; z-index: 2;">
                            ${titleKartu}<br><span class="text-success" style="font-size: 0.75rem;">SMK AD-DA'WAH</span>
                        </div>
                        
                        <!-- Area Ketentuan Mengisi Penuh Sisa Kartu -->
                        ${ketentuanHTML}
                        
                    </div>
                </div>
            `;
        });

        area.innerHTML = `<div class="row justify-content-center g-2">${semuaKartuHTML}</div>`;

    } catch (error) {
        console.error("Error Supabase Cetak Kartu:", error);
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
    
    // Konfigurasi PDF yang diperbarui dengan Anti-Terpotong (Pagebreak avoid-all)
    const opt = {
        margin:       10, // Margin aman kertas A4
        filename:     `Bagian_Belakang_Kartu_${document.getElementById("cetakQrKategori").value}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 10, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] } 
    };
    
    html2pdf().set(opt).from(area).save();
}
