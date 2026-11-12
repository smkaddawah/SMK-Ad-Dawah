// =================================================================
// 1. KONFIGURASI SUPABASE (ANTI ERROR INITIALIZATION)
// =================================================================
// Menggunakan 'window' agar variabel langsung bersifat global dan tidak bentrok
window.supabaseUrl = 'https://rniggtkxtlblpvxaycrl.supabase.co';
window.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuaWdndGt4dGxibHB2eGF5Y3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMTYzNDcsImV4cCI6MjA5OTY5MjM0N30.vo-FGuq_QL5R9WI21jA535txSp1uZDAxzirSEk6eP44';

// Mengecek jika client belum dibuat, maka buat baru
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(window.supabaseUrl, window.supabaseKey);
}

// =================================================================
// 2. LOGIKA PENDAFTARAN PPDB SMK AD-DA'WAH
// =================================================================
window.submitPPDB = async function(event) {
    event.preventDefault(); // Mencegah halaman refresh

    // Validasi Persetujuan
    const setuju = document.getElementById("ppdbSetuju").checked;
    if (!setuju) {
        alert("Anda harus menyetujui surat pernyataan di Bagian G terlebih dahulu!");
        return;
    }

    // Ubah tombol jadi loading
    const btn = document.getElementById("btnSubmitPPDB");
    const teksLama = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Mengunggah Data & Foto...';
    btn.disabled = true;

    try {
        // Generate Nomor Pendaftaran Otomatis (Format: PPDB-26-[Bulan]-[4 Angka Random])
        const date = new Date();
        const bulan = String(date.getMonth() + 1).padStart(2, '0');
        const randomNum = Math.floor(1000 + Math.random() * 9000); 
        const noPendaftaran = `PPDB-26-${bulan}-${randomNum}`;

        // Proses Upload Foto ke Supabase Storage (tempat-naro-foto)
        const fileInput = document.getElementById('ppdbFoto');
        const file = fileInput.files[0];
        let fotoUrl = "";

        if (file) {
            // Validasi ukuran maksimal 2MB
            if (file.size > 2 * 1024 * 1024) {
                throw new Error("Ukuran foto terlalu besar. Maksimal 2 MB!");
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `ppdb_${noPendaftaran}_${new Date().getTime()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
                .from('tempat-naro-foto')
                .upload(fileName, file, { contentType: file.type });

            if (uploadError) throw new Error("Gagal mengunggah foto: " + uploadError.message);
            
            // Dapatkan link publik foto
            const { data: publicUrlData } = window.supabaseClient.storage.from('tempat-naro-foto').getPublicUrl(fileName);
            fotoUrl = publicUrlData.publicUrl;
        }

        // Kumpulkan Semua Data Formulir
        const payload = {
            no_pendaftaran: noPendaftaran,
            jurusan: jurusanPilih,
            kelas_tujuan: `X ${jurusanPilih} 1`,
            tahun_ajaran: '2026/2027',
            no_pendaftaran: noPendaftaran,
            nama_lengkap: document.getElementById('ppdbNama').value.trim(),
            nama_panggilan: document.getElementById('ppdbPanggilan').value.trim(),
            jenis_kelamin: document.getElementById('ppdbJk').value,
            agama: document.getElementById('ppdbAgama').value,
            nisn: document.getElementById('ppdbNisn').value.trim(),
            nik: document.getElementById('ppdbNik').value.trim(),
            tempat_lahir: document.getElementById('ppdbTempatLahir').value.trim(),
            tanggal_lahir: document.getElementById('ppdbTglLahir').value,
            kewarganegaraan: document.getElementById('ppdbWn').value,
            anak_ke: document.getElementById('ppdbAnakKe').value ? parseInt(document.getElementById('ppdbAnakKe').value) : null,
            jml_saudara: document.getElementById('ppdbJmlSdr').value ? parseInt(document.getElementById('ppdbJmlSdr').value) : null,
            hobi: document.getElementById('ppdbHobi').value.trim(),
            cita_cita: document.getElementById('ppdbCita').value.trim(),
            alamat_lengkap: document.getElementById('ppdbAlamat').value.trim(),
            no_hp: document.getElementById('ppdbHp').value.trim(),
            email: document.getElementById('ppdbEmail').value.trim(),
            jarak_sekolah: document.getElementById('ppdbJarak').value.trim(),
            tinggal_bersama: document.getElementById('ppdbTinggal').value,
            gol_darah: document.getElementById('ppdbDarah').value,
            tinggi_badan: document.getElementById('ppdbTb').value ? parseInt(document.getElementById('ppdbTb').value) : null,
            berat_badan: document.getElementById('ppdbBb').value ? parseInt(document.getElementById('ppdbBb').value) : null,
            riwayat_penyakit: document.getElementById('ppdbPenyakit').value.trim(),
            asal_sekolah: document.getElementById('ppdbAsalSekolah').value.trim(),
            npsn_asal: document.getElementById('ppdbNpsn').value.trim(),
            tahun_lulus: document.getElementById('ppdbThnLulus').value.trim(),
            alamat_sekolah_asal: document.getElementById('ppdbAlamatSekolah').value.trim(),
            no_ijazah: document.getElementById('ppdbIjazah').value.trim(),
            no_peserta_ujian: document.getElementById('ppdbNoUjian').value.trim(),
            nama_ayah: document.getElementById('ppdbNamaAyah').value.trim(),
            pendidikan_ayah: document.getElementById('ppdbPddkAyah').value.trim(),
            pekerjaan_ayah: document.getElementById('ppdbPekerjaanAyah').value.trim(),
            no_hp_ayah: document.getElementById('ppdbHpAyah').value.trim(),
            nama_ibu: document.getElementById('ppdbNamaIbu').value.trim(),
            pendidikan_ibu: document.getElementById('ppdbPddkIbu').value.trim(),
            pekerjaan_ibu: document.getElementById('ppdbPekerjaanIbu').value.trim(),
            no_hp_ibu: document.getElementById('ppdbHpIbu').value.trim(),
            foto_siswa: fotoUrl,
            status_pendaftaran: 'Menunggu',
            status_pembayaran: 'Belum Bayar'
        };

        // Kirim (Insert) ke Tabel Supabase
        const { error: dbError } = await window.supabaseClient.from('ppdb_siswa').insert([payload]);

        if (dbError) {
            if (dbError.code === '23505') {
                throw new Error("Gagal! NISN tersebut sudah digunakan untuk mendaftar sebelumnya.");
            }
            throw new Error("Gagal menyimpan ke database: " + dbError.message);
        }

        // Tampilkan Hasil ke Layar
        document.getElementById("txtNomorPendaftaran").innerText = noPendaftaran;
        const modal = new bootstrap.Modal(document.getElementById('modalBuktiPPDB'));
        modal.show();
        document.getElementById("formPPDB").reset(); // Bersihkan form

    } catch (error) {
        alert(error.message);
        console.error("PPDB Error:", error);
    } finally {
        // Kembalikan Tombol seperti semula
        btn.innerHTML = teksLama;
        btn.disabled = false;
    }
};