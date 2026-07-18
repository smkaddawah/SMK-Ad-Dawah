const SPREADSHEET_ID = "121L93ipvshYrh1lRDB9LvBHxoBJdRpR3kZTYw1ZUsh8"; // [cite: 1]
const ID_FOLDER_BUKTI = "12vEz8bjenfvCcSlBWpF65pxuut3Ve6nJ"; // [cite: 4]

// ================= FUNGSI PEMAKSA IZIN DRIVE =================
function paksaIzinDrivePenuh() {
  var root = DriveApp.getRootFolder();
  var fileTmp = root.createFile("TEMP_IZIN_ADDAWAH.txt", "Izin berhasil dibuka!"); // [cite: 2]
  fileTmp.setTrashed(true);
  Logger.log("BERHASIL! Akun Anda telah memberikan izin penuh untuk menulis ke Google Drive.");
} // [cite: 3]

// FUNGSI TES KONEKSI & PANCINGAN IZIN MENULIS FILE
function testKoneksiFolder() {
  try {
    var folder = DriveApp.getFolderById(ID_FOLDER_BUKTI);
    var fileTes = folder.createFile("Tes_Koneksi.txt", "Sistem E-Tertib Ad-Da'Wah berhasil terhubung!"); // [cite: 5]
    Logger.log("SUKSES TOTAL! File tes berhasil dibuat di folder: " + folder.getName()); // [cite: 6]
    Logger.log("URL File Tes: " + fileTes.getUrl());
  } catch (err) {
    Logger.log("GAGAL: " + err.toString()); // [cite: 7]
  }
}

// FUNGSI PEMPROSES UPLOAD FOTO (HANYA ADA 1 FUNGSI BERSIH)
function simpanFotoKeDrive(dataBase64, nisn) {
  try {
    if (!dataBase64 || dataBase64 === "Tidak ada bukti foto" || !String(dataBase64).includes("base64,")) {
      return "Tidak ada bukti foto"; //
    }
    
    var folder = DriveApp.getFolderById(ID_FOLDER_BUKTI); //
    var splitData = dataBase64.split(","); //
    var tipeFile = splitData[0].match(/:(.*?);/)[1]; //
    var dataMurni = Utilities.base64Decode(splitData[1]); //
    
    var ekstensi = tipeFile.split("/")[1] || "jpg"; //
    var namaFile = "Bukti_" + String(nisn).replace(/[^a-zA-Z0-9]/g, "_") + "_" + new Date().getTime() + "." + ekstensi; //
    
    var blob = Utilities.newBlob(dataMurni, tipeFile, namaFile); //
    var file = folder.createFile(blob); //
    
    // --- DI SINI PERBAIKANNYA: Isolasi fitur sharing ---
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); //
    } catch (errSharing) {
      // Jika diblokir oleh kebijakan email sekolah, abaikan saja & biarkan folder induk yang mengatur hak aksesnya
      Logger.log("Sharing file dilewati karena batasan kebijakan domain: " + errSharing.toString());
    }
    
    // Kode akan langsung melompat ke sini dan sukses mengirimkan link ke Spreadsheet!
    return file.getUrl(); //
  } catch (e) {
    return "Gagal Upload Foto: " + e.toString(); //
  }
}

// ================= ROUTER UTAMA WEB API =================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var aksi = data.aksi; // [cite: 16]
    
    if (aksi === "login") return prosesLogin(data);
    if (aksi === "lapor") return tambahLaporan(data); // [cite: 17]
    if (aksi === "kenaikan_kelas") return prosesTahunBaru();
    if (aksi === "get_pending") return getLaporanPending(); // [cite: 18]
    if (aksi === "verifikasi") return verifikasiLaporan(data);
    if (aksi === "import_siswa") return importDataSiswa(data); // [cite: 19]
    if (aksi === "get_stats") return getDashboardStats();
    if (aksi === "get_kamus") return getKamusPelanggaran(); // [cite: 20]
    if (aksi === "get_riwayat") return getRiwayatSiswa(data);
    if (aksi === "get_all_siswa") return getAllSiswa(); // [cite: 21]
    if (aksi === "get_form_data") return getFormData();
    if (aksi === "add_siswa_manual") return addSiswaManual(data); // [cite: 22]
    if (aksi === "edit_siswa") return editSiswa(data);
    if (aksi === "hapus_siswa") return hapusSiswa(data); // [cite: 23]
    if (aksi === "hapus_laporan") return hapusLaporan(data);
    if (aksi === "edit_laporan") return editLaporan(data); // [cite: 24]
    if (aksi === "get_rekap_laporan") return getRekapLaporan(data);
    
    return cetakJson({ status: "gagal", pesan: "Aksi tidak dikenali" });
  } catch (error) {
    return cetakJson({ status: "error", pesan: error.toString() }); // [cite: 24]
  }
}

// ================= FUNGSI BANTUAN: HITUNG POIN DARI LOG =================
function hitungTotalPoinSiswa(nisnTarget, dataLog) {
  var total = 0;
  var targetBersih = String(nisnTarget || "").replace(/['"]/g, '').replace(/^0+/, '').trim(); // [cite: 25]
  
  for (var i = 1; i < dataLog.length; i++) {
    var nisnLog = String(dataLog[i][2] || "").replace(/['"]/g, '').replace(/^0+/, '').trim(); // [cite: 26]
    var status = String(dataLog[i][7] || "").trim(); // [cite: 27]
    if (nisnLog === targetBersih && status === "Disetujui") {
      var teksPoin = String(dataLog[i][9] || "0").replace(/[^0-9]/g, '');
      total += parseInt(teksPoin, 10) || 0; // [cite: 27]
    }
  }
  return total; // 
}

// ================= 1. FUNGSI LOGIN =================
function prosesLogin(req) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetUser = ss.getSheetByName("User");
  var dataUser = sheetUser.getDataRange().getValues(); // [cite: 36]
  
  for (var i = 1; i < dataUser.length; i++) {
    if (dataUser[i][0].toString() === req.username && dataUser[i][1].toString() === req.password && dataUser[i][3].toString().toLowerCase() === req.role) {
      if (req.role === "siswa") {
        var sheetLog = ss.getSheetByName("Log_Pelanggaran");
        var dataLog = sheetLog.getDataRange().getValues(); // [cite: 37]
        var totalPoin = hitungTotalPoinSiswa(dataUser[i][0], dataLog);
        
        return cetakJson({ status: "sukses", role: "siswa", identitas: dataUser[i][0].toString(), nama: dataUser[i][2], kelas: dataUser[i][4], poin: totalPoin }); // [cite: 38]
      }
      return cetakJson({ status: "sukses", role: req.role, identitas: dataUser[i][0].toString(), nama: dataUser[i][2] }); // [cite: 39]
    }
  }
  return cetakJson({ status: "gagal", pesan: "Username, Password, atau Peran tidak sesuai!" }); // [cite: 40]
}

// ================= 2. FUNGSI LAPOR (FIX NISN TEXT & DRIVE) =================
function tambahLaporan(req) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetLog = ss.getSheetByName("Log_Pelanggaran"); // [cite: 41]
  var idLog = "LOG-" + new Date().getTime();
  var tanggalSekarang = new Date();
  
  var bulan = tanggalSekarang.getMonth();
  var tahun = tanggalSekarang.getFullYear(); // [cite: 42]
  var tahunPelajaran = (bulan >= 6) ? (tahun + "/" + (tahun + 1)) : ((tahun - 1) + "/" + tahun); // [cite: 43]
  
  var sheetKamus = ss.getSheetByName("Kamus_Pelanggaran");
  var dataKamus = sheetKamus.getDataRange().getValues(); // [cite: 44]
  var poinPelanggaran = 0;
  var kodeTarget = String(req.kode || "").trim().toUpperCase(); // [cite: 45]
  
  for (var k = 1; k < dataKamus.length; k++) {
    if (String(dataKamus[k][0] || "").trim().toUpperCase() === kodeTarget) {
      var teksBobot = String(dataKamus[k][2] || "0").replace(/[^0-9]/g, '');
      poinPelanggaran = parseInt(teksBobot, 10) || 0; // [cite: 46]
      break;
    }
  }
  
  var urlFotoDrive = simpanFotoKeDrive(req.bukti, req.nisn);
  
  // KUNCI FIX NISN: Tambahkan petik tunggal (') di depan agar angka 00 tidak hilang di Sheet!
  var nisnFormatTeks = "'" + String(req.nisn || "").replace(/['"]/g, '').trim();
  
  sheetLog.appendRow([
    idLog, 
    tanggalSekarang, 
    nisnFormatTeks, // <-- NISN aman sebagai Teks Murni sekarang!
    req.kode, 
    req.keterangan, 
    urlFotoDrive, 
    req.pelapor, 
    "Pending",
    tahunPelajaran,
    poinPelanggaran
  ]);
  return cetakJson({ status: "sukses" }); // 
}

// ================= 3. AMBIL DATA MASTER FORM =================
// ================= 3. AMBIL DATA MASTER FORM =================
function getFormData() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var dataUser = ss.getSheetByName("User").getDataRange().getValues();
  var dataKamus = ss.getSheetByName("Kamus_Pelanggaran").getDataRange().getValues();
  
  var daftarKelas = [];
  var daftarSiswa = [];
  var daftarKamus = [];
  
  for (var i = 1; i < dataUser.length; i++) {
    if (String(dataUser[i][3] || "").toLowerCase().trim() === "siswa") {
      var kelas = String(dataUser[i][4] || "").trim();
      if (kelas && daftarKelas.indexOf(kelas) === -1) daftarKelas.push(kelas);
      
      daftarSiswa.push({
        nisn: String(dataUser[i][0] || "").trim(),
        nama: String(dataUser[i][2] || "").trim(),
        kelas: kelas
      });
    }
  }
  daftarKelas.sort();
  
  for (var k = 1; k < dataKamus.length; k++) {
    daftarKamus.push({
      kode: String(dataKamus[k][0] || "").trim(),
      nama: String(dataKamus[k][1] || "").trim(),
      bobot: String(dataKamus[k][2] || "0").replace(/[^0-9]/g, ''),
      sanksi: String(dataKamus[k][3] || "-").trim() // <-- TAMBAHAN BACA KOLOM D (SANKSI)
    });
  }
  
  return cetakJson({ status: "sukses", kelas: daftarKelas, siswa: daftarSiswa, kamus: daftarKamus });
}

// ================= 4. AMBIL LAPORAN PENDING =================
function getLaporanPending() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var dataLog = ss.getSheetByName("Log_Pelanggaran").getDataRange().getValues(); // [cite: 55]
  var dataKamus = ss.getSheetByName("Kamus_Pelanggaran").getDataRange().getValues();
  var dataUser = ss.getSheetByName("User").getDataRange().getValues(); // [cite: 56]
  
  var mapKamus = {}; // [cite: 57]
  for (var k = 1; k < dataKamus.length; k++) {
    mapKamus[String(dataKamus[k][0]).trim().toUpperCase()] = dataKamus[k][1]; // [cite: 58]
  }
  
  var mapSiswa = {};
  for (var u = 1; u < dataUser.length; u++) {
    var nisnBersih = String(dataUser[u][0] || "").replace(/['"]/g, '').replace(/^0+/, '').trim();
    mapSiswa[nisnBersih] = { nama: dataUser[u][2], kelas: dataUser[u][4] };
  }
  
  var pending = [];
  for (var i = 1; i < dataLog.length; i++) {
    if (dataLog[i][7] === "Pending") { 
      var kode = String(dataLog[i][3] || "").trim().toUpperCase();
      var nisnLogBersih = String(dataLog[i][2] || "").replace(/['"]/g, '').replace(/^0+/, '').trim(); // [cite: 59]
      var infoSiswa = mapSiswa[nisnLogBersih] || { nama: "Siswa Tidak Dikenal", kelas: "-" }; // [cite: 60]
      pending.push({
        idLog: dataLog[i][0],
        tanggal: dataLog[i][1],
        nisn: dataLog[i][2],
        namaSiswa: infoSiswa.nama,
        kelas: infoSiswa.kelas,
        kode: kode,
        namaPelanggaran: mapKamus[kode] || "Pelanggaran Umum",
        keterangan: dataLog[i][4],
        bukti: dataLog[i][5],
        pelapor: dataLog[i][6]
      }); // [cite: 61]
    }
  }
  return cetakJson({ status: "sukses", data: pending }); // [cite: 62]
}

// ================= 5. VERIFIKASI LAPORAN =================
function verifikasiLaporan(req) {
  var sheetLog = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Log_Pelanggaran");
  var dataLog = sheetLog.getDataRange().getValues(); // [cite: 63]
  var targetIdLog = String(req.idLog || "").trim();
  
  for (var i = 1; i < dataLog.length; i++) {
    if (String(dataLog[i][0] || "").trim() === targetIdLog) {
      sheetLog.getRange(i + 1, 8).setValue(req.keputusan); // [cite: 64]
      return cetakJson({ status: "sukses" });
    }
  }
  return cetakJson({ status: "gagal", pesan: "ID Laporan tidak ditemukan" }); // [cite: 65]
}

// ================= GANTI BAGIAN HITUNG GRAFIK DI DALAM FUNGSI getStats() =================
function getDashboardStats() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var dataLog = ss.getSheetByName("Log_Pelanggaran").getDataRange().getValues();
  var dataUser = ss.getSheetByName("User").getDataRange().getValues();
  
  var totalSiswa = 0;
  var siswaKritis = 0;
  var perKelas = {};
  
  for (var u = 1; u < dataUser.length; u++) {
    if (String(dataUser[u][3] || "").toLowerCase().trim() === "siswa") {
      totalSiswa++;
      var kls = String(dataUser[u][4] || "").trim();
      if (kls) perKelas[kls] = (perKelas[kls] || 0);
      var poin = parseInt(dataUser[u][5]) || 0;
      if (poin >= 50) siswaKritis++; // Siswa yang mencapai SP 1 ke atas
    }
  }
  
  var pending = 0;
  var mapHari = {};
  
  // Siapkan wadah tanggal untuk 7 Hari Terakhir agar grafik selalu terisi rapi
  var namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
  for (var h = 6; h >= 0; h--) {
    var d = new Date();
    d.setDate(d.getDate() - h);
    var labelHari = d.getDate() + " " + namaBulan[d.getMonth()];
    mapHari[labelHari] = 0;
  }
  
  for (var i = 1; i < dataLog.length; i++) {
    if (dataLog[i][7] === "Pending") pending++;
    if (dataLog[i][7] === "Disetujui") {
      // Hitung per kelas
      var nisnLog = String(dataLog[i][2] || "").replace(/['"]/g, '').replace(/^0+/, '').trim();
      for (var u = 1; u < dataUser.length; u++) {
        var nisnUser = String(dataUser[u][0] || "").replace(/['"]/g, '').replace(/^0+/, '').trim();
        if (nisnUser === nisnLog) {
          var k = String(dataUser[u][4] || "").trim();
          if (k) perKelas[k] = (perKelas[k] || 0) + 1;
          break;
        }
      }
      // Hitung grafik per hari
      var tglLog = new Date(dataLog[i][1]);
      if (!isNaN(tglLog.getTime())) {
        var lbl = tglLog.getDate() + " " + namaBulan[tglLog.getMonth()];
        if (mapHari[lbl] !== undefined) {
          mapHari[lbl]++;
        } else {
          // Jika kejadian di luar 7 hari terakhir, tetap masukkan ke object grafik
          mapHari[lbl] = (mapHari[lbl] || 0) + 1;
        }
      }
    }
  }
  
  return cetakJson({
    status: "sukses",
    totalSiswa: totalSiswa,
    laporanPending: pending,
    siswaKritis: siswaKritis,
    perKelas: perKelas,
    grafikLabel: Object.keys(mapHari),
    grafikData: Object.values(mapHari)
  });
}

// ================= 7. FULL CRUD MANAGEMENT =================
function addSiswaManual(req) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("User");
  var nisnTeks = "'" + String(req.nisn || "").trim();
  sheet.appendRow([nisnTeks, req.password, req.nama, "siswa", req.kelas]); // [cite: 77]
  return cetakJson({ status: "sukses" });
}

function editSiswa(req) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("User");
  var data = sheet.getDataRange().getValues(); // [cite: 78]
  var targetNisn = String(req.nisnLama || "").trim(); // [cite: 79]
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || "").trim() === targetNisn) {
      var nisnBaruTeks = "'" + String(req.nisnBaru || "").trim();
      sheet.getRange(i + 1, 1).setValue(nisnBaruTeks); // [cite: 80]
      sheet.getRange(i + 1, 2).setValue(req.password);
      sheet.getRange(i + 1, 3).setValue(req.nama);
      sheet.getRange(i + 1, 5).setValue(req.kelas);
      return cetakJson({ status: "sukses" }); // [cite: 81]
    }
  }
  return cetakJson({ status: "gagal", pesan: "Siswa tidak ditemukan" }); // [cite: 82]
}

function hapusSiswa(req) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("User");
  var data = sheet.getDataRange().getValues(); // [cite: 83]
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || "").trim() === String(req.nisn || "").trim()) {
      sheet.deleteRow(i + 1); // [cite: 84]
      return cetakJson({ status: "sukses" });
    }
  }
  return cetakJson({ status: "gagal", pesan: "Siswa tidak ditemukan" }); // [cite: 85]
}

function hapusLaporan(req) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Log_Pelanggaran");
  var data = sheet.getDataRange().getValues(); // [cite: 86]
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || "").trim() === String(req.idLog || "").trim()) {
      sheet.deleteRow(i + 1); // [cite: 87]
      return cetakJson({ status: "sukses" });
    }
  }
  return cetakJson({ status: "gagal", pesan: "Laporan tidak ditemukan" }); // [cite: 88]
}

function editLaporan(req) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Log_Pelanggaran");
  var data = sheet.getDataRange().getValues(); // [cite: 89]
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || "").trim() === String(req.idLog || "").trim()) {
      sheet.getRange(i + 1, 4).setValue(req.kode); // [cite: 90]
      sheet.getRange(i + 1, 5).setValue(req.keterangan);
      return cetakJson({ status: "sukses" });
    }
  }
  return cetakJson({ status: "gagal", pesan: "Laporan tidak ditemukan" }); // [cite: 91]
}

// ================= 8. KENAIKAN KELAS & UTILITY =================
function prosesTahunBaru() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("User");
  var data = sheet.getDataRange().getValues(); // [cite: 92]
  var updateData = []; // [cite: 93]
  for (var i = 1; i < data.length; i++) {
    var role = data[i][3].toString().toLowerCase(); // [cite: 93]
    var kelasLama = data[i][4];
    if (role === "siswa") {
      var kelasBaru = kelasLama.toString().toUpperCase(); // [cite: 94]
      if (kelasBaru.indexOf("XII") > -1) { kelasBaru = "LULUS"; } 
      else if (kelasBaru.indexOf("XI") > -1) { kelasBaru = kelasBaru.replace("XI", "XII"); // [cite: 95]
      } 
      else if (kelasBaru.indexOf("X") > -1) { kelasBaru = kelasBaru.replace("X", "XI"); // [cite: 96]
      }
      updateData.push([kelasBaru]); 
    } else { updateData.push([kelasLama]); // [cite: 97]
    }
  }
  if (updateData.length > 0) { sheet.getRange(2, 5, updateData.length, 1).setValues(updateData); } // [cite: 98]
  return cetakJson({ status: "sukses" });
}

function importDataSiswa(req) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("User");
  var dataSiswa = req.dataSiswa; 
  var dataToAppend = []; // [cite: 99]
  for (var i = 0; i < dataSiswa.length; i++) {
    var nisnFormat = "'" + String(dataSiswa[i].nisn).trim();
    dataToAppend.push([nisnFormat, dataSiswa[i].password, dataSiswa[i].nama, "siswa", dataSiswa[i].kelas]); // [cite: 100]
  }
  if (dataToAppend.length > 0) { sheet.getRange(sheet.getLastRow() + 1, 1, dataToAppend.length, 5).setValues(dataToAppend); // [cite: 101]
  }
  return cetakJson({ status: "sukses", jumlah: dataToAppend.length });
}

function cetakJson(obj) { 
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); // [cite: 102]
}

function getKamusPelanggaran() {
  var data = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Kamus_Pelanggaran").getDataRange().getValues();
  var daftar = [];
  for (var i = 1; i < data.length; i++) { 
    daftar.push({ 
      kode: String(data[i][0] || "").trim(), 
      nama: String(data[i][1] || "").trim(), 
      bobot: String(data[i][2] || "0").replace(/[^0-9]/g, ''),
      sanksi: String(data[i][3] || "-").trim() // <-- TAMBAHAN BACA KOLOM D (SANKSI)
    });
  }
  return cetakJson({ status: "sukses", data: daftar });
}

function getRiwayatSiswa(req) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var dataLog = ss.getSheetByName("Log_Pelanggaran").getDataRange().getValues(); // [cite: 105]
  var dataKamus = ss.getSheetByName("Kamus_Pelanggaran").getDataRange().getValues();
  var mapKamus = {}; // [cite: 106]
  for (var k = 1; k < dataKamus.length; k++) { 
    mapKamus[String(dataKamus[k][0]).trim().toUpperCase()] = { nama: dataKamus[k][1], bobot: dataKamus[k][2] }; // [cite: 107]
  }
  var targetBersih = String(req.nisn || "").replace(/['"]/g, '').replace(/^0+/, '').trim();
  var riwayat = [];
  for (var i = 1; i < dataLog.length; i++) {
    var nisnLog = String(dataLog[i][2] || "").replace(/['"]/g, '').replace(/^0+/, '').trim();
    if (nisnLog === targetBersih && dataLog[i][7] === "Disetujui") { // [cite: 108]
      var kode = String(dataLog[i][3] || "").trim().toUpperCase(); // [cite: 109]
      var info = mapKamus[kode] || { nama: dataLog[i][4] || "Pelanggaran Umum", bobot: dataLog[i][9] || 10 }; // [cite: 110]
      riwayat.push({ tanggal: dataLog[i][1], namaPelanggaran: info.nama, bobot: dataLog[i][9] || info.bobot, pelapor: dataLog[i][6], bukti: dataLog[i][5], tahunPelajaran: dataLog[i][8] || "-" }); // [cite: 111]
    }
  }
  return cetakJson({ status: "sukses", data: riwayat });
}

function getAllSiswa() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var dataUser = ss.getSheetByName("User").getDataRange().getValues(); // [cite: 112]
  var dataLog = ss.getSheetByName("Log_Pelanggaran").getDataRange().getValues();
  var siswa = []; // [cite: 113]
  for (var i = 1; i < dataUser.length; i++) {
    if (String(dataUser[i][3] || "").toLowerCase().trim() === "siswa") {
      siswa.push({ nisn: dataUser[i][0].toString(), nama: dataUser[i][2], kelas: dataUser[i][4], password: dataUser[i][1], poin: hitungTotalPoinSiswa(dataUser[i][0], dataLog) }); // [cite: 114]
    }
  }
  return cetakJson({ status: "sukses", data: siswa });
}

// ================= AMBIL DATA REKAP LAPORAN PER KELAS & BULAN =================
function getRekapLaporan(req) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var dataLog = ss.getSheetByName("Log_Pelanggaran").getDataRange().getValues(); //
  var dataKamus = ss.getSheetByName("Kamus_Pelanggaran").getDataRange().getValues(); //
  var dataUser = ss.getSheetByName("User").getDataRange().getValues(); //
  
  var mapKamus = {};
  for (var k = 1; k < dataKamus.length; k++) {
    mapKamus[String(dataKamus[k][0]).trim().toUpperCase()] = dataKamus[k][1];
  }
  
  var mapSiswa = {};
  for (var u = 1; u < dataUser.length; u++) {
    var nisnBersih = String(dataUser[u][0] || "").replace(/['"]/g, '').replace(/^0+/, '').trim(); //
    mapSiswa[nisnBersih] = { nama: dataUser[u][2], kelas: String(dataUser[u][4] || "").trim() };
  }
  
  var targetKelas = String(req.kelas || "").trim();
  var targetBulan = String(req.bulan || "").trim(); // misal: "Juli"
  var namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  var rekap = [];
  for (var i = 1; i < dataLog.length; i++) {
    if (dataLog[i][7] === "Disetujui") { // Hanya mengambil pelanggaran yang sudah disetujui
      var nisnLogBersih = String(dataLog[i][2] || "").replace(/['"]/g, '').replace(/^0+/, '').trim(); //
      var infoSiswa = mapSiswa[nisnLogBersih] || { nama: "Siswa Tidak Dikenal", kelas: "-" }; //
      
      if (infoSiswa.kelas === targetKelas) {
        var tgl = new Date(dataLog[i][1]);
        var bulanLog = !isNaN(tgl.getTime()) ? namaBulan[tgl.getMonth()] : "-"; //
        
        // Jika memilih "Semua Bulan", maka tampilkan semua log di kelas tersebut
        if (targetBulan === "" || targetBulan === "Semua Bulan" || bulanLog === targetBulan) {
          var kode = String(dataLog[i][3] || "").trim().toUpperCase(); //
          rekap.push({
            tanggal: dataLog[i][1], //
            nisn: dataLog[i][2], //
            namaSiswa: infoSiswa.nama,
            kelas: infoSiswa.kelas,
            kode: kode,
            namaPelanggaran: mapKamus[kode] || "Pelanggaran Umum", //
            keterangan: dataLog[i][4] || "-", //
            bukti: dataLog[i][5] || "-", //
            poin: dataLog[i][9] || 0 //
          });
        }
      }
    }
  }
  return cetakJson({ status: "sukses", data: rekap });
}