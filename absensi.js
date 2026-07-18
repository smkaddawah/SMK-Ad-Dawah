// ================= LOGIKA ABSENSI (GENERATE QR & SCANNER) =================
let html5QrcodeScanner = null;

// Dipanggil saat Siswa/Guru berhasil login
function initDashboardAbsensi(res) {
    // Gunakan try-catch agar kebal error (Anti-Crash)
    try {
        const textNama = document.getElementById("txtQrNama");
        if(textNama) textNama.innerText = res.nama;
        
        const textRole = document.getElementById("txtQrRole");
        if(textRole) textRole.innerText = res.identitas;
        
        const wadah = document.getElementById("qrcode");
        if(wadah && typeof QRCode !== 'undefined') {
            wadah.innerHTML = "";
            new QRCode(wadah, { text: res.identitas, width: 200, height: 200 });
        }
    } catch (e) {
        console.log("Info: Area QR Code tidak ditampilkan untuk role ini.");
    }
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
    
    // HANYA MENGAMBIL GAMBAR DARI HTML (TIDAK BOLEH ADA document.createElement LAGI)
    const imgScan = document.getElementById("fotoScanResult"); 

    if(res.status === "sukses") {
        // Ganti src gambar dengan foto dari database
        if (imgScan) {
            imgScan.src = res.user.foto ? res.user.foto : `https://ui-avatars.com/api/?name=${res.user.nama.replace(/\s/g, '+')}&background=198754&color=fff`;
        }

        // Isi data teks ke HTML
        document.getElementById("scanNamaResult").innerText = res.user.nama;
        document.getElementById("scanIdResult").innerText = res.user.username;
        document.getElementById("scanKelasResult").innerText = res.user.kelas || "Guru";
        
        // Pesan status absen
        if (res.kondisi === "masuk") {
            boxStatus.className = "alert alert-success py-2 fw-bold mb-0 text-wrap";
            boxStatus.innerHTML = `Masuk Berhasil<br><small>${res.waktu}</small>`;
            if(typeof bunyikanBeep === 'function') bunyikanBeep();
        } else if (res.kondisi === "pulang") {
            boxStatus.className = "alert alert-primary py-2 fw-bold mb-0 text-wrap";
            boxStatus.innerHTML = `Pulang Berhasil<br><small>${res.waktu}</small>`;
            if(typeof bunyikanBeep === 'function') bunyikanBeep();
        } else if (res.kondisi === "sudah_absen") {
            boxStatus.className = "alert alert-danger py-2 fw-bold mb-0 text-wrap";
            boxStatus.innerText = "Siswa/Guru sudah absen masuk & pulang hari ini.";
        }
        
        // Segarkan tabel log absen admin
        if(typeof loadLogAbsenAdminHariIni === 'function') loadLogAbsenAdminHariIni();
        
    } else {
        // Jika QR tidak ditemukan di database
        if (imgScan) {
            imgScan.src = "https://ui-avatars.com/api/?name=X&background=dc3545&color=fff";
        }
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