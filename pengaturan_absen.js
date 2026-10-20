// ==============================================================
// LOGIKA PENGATURAN ABSENSI (JADWAL & HARI LIBUR)
// ==============================================================

// --- 1. DOWNLOAD TEMPLATE JADWAL ---
function downloadTemplateJadwal() {
    let ws_data = [
        ["Hari", "Kode_Guru", "Jam_Ke", "Kelas"],
        ["SENIN", "5", 2, "X AK"],
        ["SENIN", "15A", 3, "XI TKJ"],
        ["SELASA", "4B", 1, "XII PM PKL"]
    ];
    if(typeof XLSX === 'undefined') return showAlertBS("Error", "Library Excel belum termuat", "error");
    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal");
    XLSX.writeFile(wb, "Template_Jadwal_Mengajar.xlsx");
}

// --- 2. UPLOAD & IMPORT EXCEL KE DATAaBASE ---
function prosesUploadJadwal() {
    let fileUpload = document.getElementById("fileUploadJadwal");
    if (!fileUpload.files || fileUpload.files.length === 0) { return showAlertBS("Perhatian", "Pilih file Excel jadwal terlebih dahulu!", "warning"); }
    if (typeof XLSX === 'undefined') return showAlertBS("Error", "Sistem Excel belum siap.", "error");

    let file = fileUpload.files[0];
    let reader = new FileReader();

    reader.onload = function(e) {
        showAlertBS("Memproses...", "Membaca file Excel...", "info");
        try {
            let data = new Uint8Array(e.target.result);
            let workbook = XLSX.read(data, { type: 'array' });
            let firstSheetName = workbook.SheetNames[0];
            let worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON
            let jsonData = XLSX.utils.sheet_to_json(worksheet);
            if(jsonData.length === 0) return showAlertBS("Gagal", "File Excel kosong.", "error");

            // Validasi Header (Harus sama dengan kolom database)
            let firstRow = jsonData[0];
            if (!("Hari" in firstRow) || !("Kode_Guru" in firstRow) || !("Jam_Ke" in firstRow) || !("Kelas" in firstRow)) {
                return showAlertBS("Gagal", "Format kolom salah! Harus ada kolom: Hari, Kode_Guru, Jam_Ke, Kelas", "error");
            }

            // Standarisasi Key untuk Supabase
            let cleanData = jsonData.map(r => ({
                hari: (r.Hari || "").toString().toUpperCase().trim(),
                kode_guru: (r.Kode_Guru || "").toString().trim(),
                jam_ke: parseInt(r.Jam_Ke) || 1,
                kelas: (r.Kelas || "").toString().trim()
            })).filter(r => r.hari && r.kode_guru && r.kelas);

            // Eksekusi: Hapus Semua Data Lama -> Masukkan Data Baru
            showConfirmBS(`Ditemukan ${cleanData.length} baris jadwal. Mengimport data ini akan mereset jadwal lama. Lanjutkan?`, async () => {
                showAlertBS("Menyimpan...", "Mentransfer ke database...", "info");
                
                // 1. Hapus isi tabel
                const { error: errDel } = await supabaseClient.from('jadwal_mengajar').delete().neq('id_jadwal', 0); 
                
                // 2. Insert Batch
                const { error: errIns } = await supabaseClient.from('jadwal_mengajar').insert(cleanData);

                if (errIns) {
                    console.log(errIns);
                    showAlertBS("Gagal", "Gagal menyimpan jadwal ke database.", "error");
                } else {
                    showAlertBS("Berhasil", "Jadwal mengajar berhasil diperbarui!", "success");
                    fileUpload.value = "";
                    loadPreviewJadwal();
                }
            });
        } catch(err) {
            showAlertBS("Gagal", "Terjadi kesalahan saat membaca file.", "error");
        }
    };
    reader.readAsArrayBuffer(file);
}

// --- 3. PREVIEW JADWAL ---
async function loadPreviewJadwal() {
    let hariF = document.getElementById("filterHariJadwal").value;
    let tb = document.getElementById("tbPreviewJadwal");
    tb.innerHTML = '<tr><td colspan="4" class="py-4"><i class="fa-solid fa-spinner fa-spin text-primary"></i></td></tr>';

    try {
        const { data, error } = await supabaseClient.from('jadwal_mengajar').select('*').eq('hari', hariF).order('jam_ke', { ascending: true });
        if (error) throw error;

        if (data && data.length > 0) {
            tb.innerHTML = data.map(d => `<tr><td class="fw-bold">${d.hari}</td><td class="text-primary fw-bold">${d.kode_guru}</td><td>${d.jam_ke}</td><td>${d.kelas}</td></tr>`).join("");
        } else {
            tb.innerHTML = `<tr><td colspan="4" class="py-4 text-muted">Tidak ada jadwal di hari ${hariF}.</td></tr>`;
        }
    } catch (e) {
        tb.innerHTML = '<tr><td colspan="4" class="py-4 text-danger">Gagal memuat jadwal.</td></tr>';
    }
}

// --- 4. MANAJEMEN HARI LIBUR ---
async function loadDataLibur() {
    let tb = document.getElementById("tbHariLibur");
    tb.innerHTML = '<tr><td colspan="4" class="py-3 text-center"><i class="fa-solid fa-spinner fa-spin text-primary"></i></td></tr>';
    
    try {
        const { data, error } = await supabaseClient.from('hari_libur').select('*').order('tanggal', { ascending: false });
        if (!error && data.length > 0) {
            tb.innerHTML = data.map(d => {
                let badge = d.target === 'semua' ? 'bg-success' : (d.target === 'siswa' ? 'bg-primary' : 'bg-warning text-dark');
                let tgtText = d.target === 'ptk' ? 'Guru' : d.target;
                return `<tr>
                    <td class="fw-bold">${new Date(d.tanggal).toLocaleDateString('id-ID')}</td>
                    <td>${d.keterangan}</td>
                    <td><span class="badge ${badge} text-capitalize">${tgtText}</span></td>
                    <td><button class="btn btn-sm btn-outline-danger py-0" onclick="hapusLibur(${d.id_libur})"><i class="fa-solid fa-trash"></i></button></td>
                </tr>`;
            }).join("");
        } else {
            tb.innerHTML = '<tr><td colspan="4" class="py-3 text-center text-muted">Belum ada hari libur.</td></tr>';
        }
    } catch(e) { tb.innerHTML = '<tr><td colspan="4" class="text-danger text-center">Gagal memuat.</td></tr>'; }
}

async function simpanHariLibur() {
    let tgl = document.getElementById("inputTglLibur").value;
    let ket = document.getElementById("inputKetLibur").value;
    let tgt = document.getElementById("inputTargetLibur").value;

    if(!tgl || !ket) return showAlertBS("Perhatian", "Tanggal dan Keterangan wajib diisi!", "warning");

    showAlertBS("Menyimpan...", "Menyimpan hari libur...", "info");
    const { error } = await supabaseClient.from('hari_libur').insert([{ tanggal: tgl, keterangan: ket, target: tgt }]);
    if (error) showAlertBS("Gagal", "Gagal menyimpan.", "error");
    else {
        showAlertBS("Berhasil", "Hari libur ditambahkan.", "success");
        document.getElementById("inputTglLibur").value = ""; document.getElementById("inputKetLibur").value = "";
        loadDataLibur();
    }
}

async function hapusLibur(idLibur) {
    showConfirmBS("Yakin hapus libur ini?", async () => {
        const { error } = await supabaseClient.from('hari_libur').delete().eq('id_libur', idLibur);
        if(!error) loadDataLibur();
    });
}

// --- 5. MANAJEMEN JAM MASUK SISWA ---
async function loadSettingJamSiswa() {
    try {
        const { data, error } = await supabaseClient.from('pengaturan_sekolah').select('*');
        if (!error && data) {
            data.forEach(item => {
                if(item.key === 'jam_masuk_siswa') document.getElementById('setJamMasukSiswa').value = item.value;
                if(item.key === 'jam_pulang_siswa') document.getElementById('setJamPulangSiswa').value = item.value;
                if(item.key === 'toleransi_terlambat_menit') document.getElementById('setToleransiSiswa').value = item.value;
            });
        }
    } catch(e) { console.error("Gagal muat jam siswa:", e); }
}

async function simpanJamSiswa() {
    let jamMasuk = document.getElementById('setJamMasukSiswa').value;
    let jamPulang = document.getElementById('setJamPulangSiswa').value;
    let toleransi = document.getElementById('setToleransiSiswa').value || "5";

    if(!jamMasuk || !jamPulang) return showAlertBS("Perhatian", "Jam Masuk dan Jam Pulang wajib diisi!", "warning");

    showAlertBS("Menyimpan...", "Memperbarui jam siswa...", "info");

    const updates = [
        { key: 'jam_masuk_siswa', value: jamMasuk },
        { key: 'jam_pulang_siswa', value: jamPulang },
        { key: 'toleransi_terlambat_menit', value: toleransi }
    ];

    const { error } = await supabaseClient.from('pengaturan_sekolah').upsert(updates);
    if(error) {
        showAlertBS("Gagal", "Gagal menyimpan jam siswa.", "error");
    } else {
        showAlertBS("Berhasil", "Pengaturan Jam Masuk Siswa berhasil disimpan!", "success");
    }
}