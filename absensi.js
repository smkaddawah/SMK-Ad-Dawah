// ================= LOGIKA ABSENSI (GENERATE QR & SCANNER) =================
let html5QrcodeScanner = null;

// Dipanggil saat Siswa/Guru berhasil login
async function initDashboardAbsensi(user) {
    let wadahQR = user.role === 'siswa' ? "qrCodeSiswa" : "qrCodeGuru";
    let lblNama = user.role === 'siswa' ? "lblNamaSiswaQR" : "lblNamaGuruQR";
    let lblId = user.role === 'siswa' ? "lblNisnSiswaQR" : "lblIdGuruQR";
    
    document.getElementById(lblNama).innerText = user.nama;
    document.getElementById(lblId).innerText = user.identitas;
    if(user.role === 'siswa') document.getElementById("lblKelasSiswaQR").innerText = user.kelas;

    // Bersihkan QR lama (jika ada) lalu buat baru
    document.getElementById(wadahQR).innerHTML = "";
    new QRCode(document.getElementById(wadahQR), {
        text: user.identitas, // QR berisi NISN / ID Guru
        width: 150, height: 150
    });

    // Cek status hari ini
    const res = await panggilAPI({ aksi: "get_absen_hari_ini", username: user.identitas });
    let statusBox = document.getElementById(user.role === 'siswa' ? "statusAbsenSiswa" : "statusAbsenGuru");
    
    if (res.data) {
        if (res.data.waktu_pulang) {
            statusBox.className = "alert alert-success py-2 mb-0 fw-bold";
            statusBox.innerHTML = `Selesai Absen Masuk & Pulang <br><small>(${res.data.waktu_masuk} - ${res.data.waktu_pulang})</small>`;
        } else {
            statusBox.className = "alert alert-primary py-2 mb-0 fw-bold";
            statusBox.innerHTML = `Absen Masuk Berhasil <br><small>(${res.data.waktu_masuk}) - Jangan lupa untuk absen pulang!</small>`;
        }
    }

    loadRiwayatAbsenPersonal(user.identitas, user.role);
}

async function loadRiwayatAbsenPersonal(username, role) {
    const tb = document.getElementById(role === 'siswa' ? "tbRiwayatAbsenSiswa" : "tbRiwayatAbsenGuru");
    const res = await panggilAPI({ aksi: "get_log_absen_personal", username: username });
    if(res.status === "sukses" && res.data.length > 0) {
        tb.innerHTML = res.data.map(d => `
            <tr>
                <td>${new Date(d.tanggal).toLocaleDateString('id-ID')}</td>
                <td class="text-success fw-bold">${d.waktu_masuk || '-'}</td>
                <td class="text-danger fw-bold">${d.waktu_pulang || 'Belum'}</td>
                <td><span class="badge bg-${d.waktu_pulang ? 'success' : 'warning'}">${d.waktu_pulang ? 'Selesai' : 'Sedang Hadir'}</span></td>
            </tr>
        `).join("");
    } else {
        tb.innerHTML = "<tr><td colspan='4' class='text-center text-muted'>Belum ada data kehadiran.</td></tr>";
    }
}

// ================= ADMIN: FUNGSI SCANNER (KAMERA & USB) =================
function mulaiKamera() {
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, /* verbose= */ false);
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        document.getElementById("btnMulaiKamera").style.display = "none";
    }
}

function onScanFailure(error) { /* Abaikan error frame */ }

// Ketika Kamera berhasil membaca QR
function onScanSuccess(decodedText, decodedResult) {
    // Beri jeda/hentikan sementara agar tidak scan berulang kali dengan cepat
    html5QrcodeScanner.pause();
    prosesScanQR(decodedText);
    setTimeout(() => { html5QrcodeScanner.resume(); }, 3000); // Resume setelah 3 detik
}

// Ketika USB Scanner membaca (Enter)
function handleUSBScanner(e) {
    if(e.key === 'Enter') {
        e.preventDefault();
        prosesScanQR(e.target.value);
        e.target.value = ''; // Kosongkan input
    }
}

// Fungsi untuk membunyikan suara beep sukses
function bunyikanBeep() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.type = 'sine'; // Suara jernih
    oscillator.frequency.value = 800; // Nada beep (800 Hz)
    
    gainNode.gain.setValueAtTime(1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15); // Durasi beep 0.15 detik
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.15);
}

// Fungsi Proses Scan (Diperbarui dengan Beep)
async function prosesScanQR(usernameScanned) {
    const boxStatus = document.getElementById("scanStatusResult");
    boxStatus.className = "alert alert-warning py-2 fw-bold mb-0";
    boxStatus.innerText = "Mencari data...";

    const res = await panggilAPI({ aksi: "catat_absen", username: usernameScanned });
    
    if(res.status === "sukses") {
        document.getElementById("scanNamaResult").innerText = res.user.nama;
        document.getElementById("scanIdResult").innerText = res.user.username;
        document.getElementById("scanKelasResult").innerText = res.user.kelas || "Guru";
        
        if (res.kondisi === "masuk") {
            boxStatus.className = "alert alert-success py-2 fw-bold mb-0 text-wrap";
            boxStatus.innerHTML = `Masuk Berhasil<br><small>${res.waktu}</small>`;
            bunyikanBeep(); // <--- BEEP BERBUNYI DI SINI
        } else if (res.kondisi === "pulang") {
            boxStatus.className = "alert alert-primary py-2 fw-bold mb-0 text-wrap";
            boxStatus.innerHTML = `Pulang Berhasil<br><small>${res.waktu}</small>`;
            bunyikanBeep(); // <--- BEEP BERBUNYI DI SINI
        } else if (res.kondisi === "sudah_absen") {
            boxStatus.className = "alert alert-danger py-2 fw-bold mb-0 text-wrap";
            boxStatus.innerText = "Siswa/Guru sudah melakukan absensi masuk & pulang hari ini.";
        }
        loadLogAbsenAdminHariIni();
    } else {
        document.getElementById("scanNamaResult").innerText = "TIDAK DITEMUKAN";
        document.getElementById("scanIdResult").innerText = usernameScanned;
        document.getElementById("scanKelasResult").innerText = "-";
        boxStatus.className = "alert alert-danger py-2 fw-bold mb-0";
        boxStatus.innerText = res.pesan;
    }
}

async function loadLogAbsenAdminHariIni() {
    const tb = document.getElementById("tbLogAbsenAdmin");
    const res = await panggilAPI({ aksi: "get_log_absen_hari_ini" });
    if(res.status === "sukses" && res.data.length > 0) {
        tb.innerHTML = res.data.map(d => `
            <tr>
                <td><span class="text-success">${d.waktu_masuk || '-'}</span> / <span class="text-danger">${d.waktu_pulang || '-'}</span></td>
                <td><b>${d.nama}</b><br><small class="text-muted">${d.username}</small></td>
                <td><span class="badge bg-${d.role === 'guru' ? 'primary' : 'secondary'}">${d.kelas || 'Guru'}</span></td>
                <td>${d.waktu_pulang ? '<span class="text-primary"><i class="fa-solid fa-check-double"></i> Selesai</span>' : '<span class="text-success"><i class="fa-solid fa-arrow-right-to-bracket"></i> Masuk</span>'}</td>
            </tr>
        `).join("");
    } else {
        tb.innerHTML = "<tr><td colspan='4' class='text-center text-muted'>Belum ada yang absen hari ini.</td></tr>";
    }
}