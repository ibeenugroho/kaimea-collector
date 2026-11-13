/* KAIMEA Collector — offline-first field data app.
 * Readings are saved on the phone first (IndexedDB, with a localStorage fallback),
 * then sent to Google Sheets whenever there is signal. Each record has a unique ID,
 * so re-sending never creates duplicate rows.
 * Plain ES2017, no framework, no build step, so it runs on old and new Android phones alike.
 */
(function () {
  "use strict";

  var CFG = window.KAIMEA_CONFIG || {};
  var APP_VERSION = CFG.APP_VERSION || "1.0.0";
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  /* ---------- text (Bahasa Indonesia first) ---------- */
  var T = {
    id: {
      sub: "Pengumpul Data", tabForm: "Input baru", tabList: "Data", tabSet: "Pengaturan",
      save: "Simpan", clear: "Kosongkan", saved: "Tersimpan di HP. Akan dikirim saat ada sinyal.",
      savedSync: "Tersimpan dan dikirim.", needReq: "Lengkapi kolom wajib yang berwarna merah.",
      online: "Online", offline: "Offline — data aman di HP", pending: "menunggu kirim", allSent: "semua terkirim",
      syncing: "Mengirim…", syncErr: "Gagal kirim, akan dicoba lagi", noEndpoint: "Alamat Google Sheet belum diisi (Pengaturan)",
      syncNow: "Kirim sekarang", lastSync: "Terakhir terkirim",
      gIdent: "Identitas sampel", gPond: "Kondisi kolam & udang", gWq: "Kualitas air", gWq2: "Opsional / lab", gSigns: "Gejala terlihat", gSamples: "Sampel untuk lab", gNotes: "Catatan",
      collector: "Nama petugas", farm: "Nama tambak", pond: "Kode kolam", sampled: "Waktu sampling",
      gps: "Ambil lokasi GPS", gpsWait: "Mencari lokasi…", gpsNo: "Lokasi tidak tersedia", gpsAcc: "akurasi",
      derived: "Dihitung otomatis", required: "wajib",
      notes: "Catatan lapangan",
      listTitle: "Data tersimpan", total: "Total", pendingN: "Menunggu", sentN: "Terkirim",
      emptyList: "Belum ada data. Isi formulir di tab Input baru.",
      sPending: "Menunggu", sSynced: "Terkirim", del: "Hapus", delQ: "Hapus data yang belum terkirim ini?", edit: "Ubah",
      export: "Unduh cadangan CSV", exported: "File CSV diunduh.",
      setTitle: "Pengaturan", endpoint: "Alamat Web App Google Sheet", key: "Kunci tim", saveSet: "Simpan pengaturan", setSaved: "Pengaturan disimpan.",
      test: "Uji koneksi", testOk: "Koneksi ke Google Sheet berhasil.", testBad: "Koneksi gagal: ",
      storage: "Penyimpanan HP", persisted: "Data dikunci agar tidak dihapus otomatis oleh browser.", notPersisted: "Browser bisa menghapus data jika memori HP penuh. Kirim data secara rutin.",
      install: "Pasang di layar utama", installHint: "Untuk memasang: buka menu browser (⋮) lalu pilih \"Tambahkan ke layar utama\" / \"Install app\".",
      updated: "Aplikasi diperbarui ke versi terbaru.", version: "Versi",
      warnRange: "Nilai di luar kisaran wajar — periksa lagi", editing: "Mengubah data yang belum terkirim",
      cancelEdit: "Batal ubah", confirmClear: "Kosongkan formulir ini?", draft: "Draf dipulihkan.",
      dupTitle: "Pakai lagi identitas terakhir", noData: "Isi minimal satu nilai pengukuran.",
      pickTitle: "Siapa yang memakai aplikasi ini?", pickFarmer: "Saya petambak", pickFarmerSub: "Catat kondisi kolam harian dan lihat tanda bahaya.",
      pickTeam: "Saya tim lapangan KAIMEA", pickTeamSub: "Formulir lengkap: sampel lab, Vibrio, ORP, kode sampel.",
      role: "Mode", roleFarmer: "Petambak", roleTeam: "Tim lapangan", switchRole: "Ganti mode",
      farmerName: "Nama Anda", phone: "No. HP / WhatsApp", optional: "opsional",
      fIdent: "Data kolam", fPond: "Kondisi udang hari ini", fWq: "Pengukuran air", fExtra: "Tambahan (jika diukur)",
      abwHint: "Berat rata-rata (ABW): timbang sampel udang dari anco atau jala (misalnya 50–100 ekor), lalu bagi total berat dengan jumlah ekor. Isi seminggu sekali, mulai sekitar DOC 30, agar KAIMEA bisa memperkirakan berat panen kolam Anda.",
      noTeamKey: "Kunci tim belum diisi (Pengaturan)", connFarmerMissing: "Aplikasi belum terhubung ke KAIMEA. Data aman di HP — hubungi tim KAIMEA.",
      fromConfig: "sudah diatur (biarkan kosong)", keySaved: "•••••••• tersimpan di HP ini", keyEnter: "ketik kunci tim dari koordinator",
      keyNote: "Kunci tim tidak pernah ditampilkan lagi setelah disimpan. Kosongkan kolom untuk tetap memakai kunci yang tersimpan.",
      switchTeamQ: "Mode tim lapangan hanya untuk petugas KAIMEA dan memerlukan kunci tim. Lanjut ganti mode?",
      consentTitle: "Persetujuan berbagi data", consentBody: "Data yang Anda isi (kondisi kolam, kualitas air, lokasi jika diambil, nama dan no. HP) dikirim ke tim KAIMEA untuk analisis kesehatan tambak dan pengembangan layanan. Nama dan no. HP tidak dibagikan ke pihak lain tanpa izin Anda. Anda bisa berhenti kapan saja dengan berhenti mengisi dan meminta tim KAIMEA menghapus data Anda.",
      consentAgree: "Saya setuju data saya dikirim ke KAIMEA", consentGo: "Lanjut", consentNeed: "Centang persetujuan dulu.",
      lOk: "baik", lWarn: "waspada", lBad: "bahaya",
      checkTitle: "Hasil cek air terakhir", checkAllOk: "Semua nilai yang diisi dalam kisaran baik.",
      checkAdvice: "Ini cek kisaran umum, bukan diagnosis penyakit. Jika ada \"bahaya\" atau udang mati bertambah, hubungi tim KAIMEA atau penyuluh Anda.",
      lightsNote: "Lampu hijau/kuning/merah memakai kisaran umum budidaya udang."
    },
    en: {
      sub: "Field Collector", tabForm: "New entry", tabList: "Records", tabSet: "Settings",
      save: "Save", clear: "Clear", saved: "Saved on the phone. It will be sent when there is signal.",
      savedSync: "Saved and sent.", needReq: "Fill in the required fields marked red.",
      online: "Online", offline: "Offline — data is safe on the phone", pending: "waiting to send", allSent: "all sent",
      syncing: "Sending…", syncErr: "Send failed, will retry", noEndpoint: "Google Sheet address not set (Settings)",
      syncNow: "Send now", lastSync: "Last sent",
      gIdent: "Sample identity", gPond: "Pond & shrimp status", gWq: "Water quality", gWq2: "Optional / lab", gSigns: "Visible signs", gSamples: "Samples for the lab", gNotes: "Notes",
      collector: "Collector name", farm: "Farm name", pond: "Pond code", sampled: "Sampling time",
      gps: "Get GPS location", gpsWait: "Finding location…", gpsNo: "Location unavailable", gpsAcc: "accuracy",
      derived: "Calculated automatically", required: "required",
      notes: "Field notes",
      listTitle: "Saved records", total: "Total", pendingN: "Waiting", sentN: "Sent",
      emptyList: "No records yet. Fill in the form on the New entry tab.",
      sPending: "Waiting", sSynced: "Sent", del: "Delete", delQ: "Delete this unsent record?", edit: "Edit",
      export: "Download CSV backup", exported: "CSV file downloaded.",
      setTitle: "Settings", endpoint: "Google Sheet Web App URL", key: "Team key", saveSet: "Save settings", setSaved: "Settings saved.",
      test: "Test connection", testOk: "Connected to the Google Sheet.", testBad: "Connection failed: ",
      storage: "Phone storage", persisted: "Data is protected from automatic browser clean-up.", notPersisted: "The browser may clear data if the phone runs out of space. Send data regularly.",
      install: "Install on home screen", installHint: "To install: open the browser menu (⋮) and choose \"Add to Home screen\" / \"Install app\".",
      updated: "App updated to the latest version.", version: "Version",
      warnRange: "Value outside the usual range — please check", editing: "Editing an unsent record",
      cancelEdit: "Cancel edit", confirmClear: "Clear this form?", draft: "Draft restored.",
      dupTitle: "Reuse last identity", noData: "Enter at least one measurement.",
      pickTitle: "Who is using this app?", pickFarmer: "I am a farmer", pickFarmerSub: "Log daily pond conditions and see warning signs.",
      pickTeam: "I am KAIMEA field team", pickTeamSub: "Full form: lab samples, Vibrio, ORP, sample codes.",
      role: "Mode", roleFarmer: "Farmer", roleTeam: "Field team", switchRole: "Switch mode",
      farmerName: "Your name", phone: "Phone / WhatsApp", optional: "optional",
      fIdent: "Pond details", fPond: "Shrimp today", fWq: "Water readings", fExtra: "Extra (if measured)",
      abwHint: "Average body weight (ABW): weigh a sample of shrimp from the feeding tray or cast net (for example 50–100 shrimp), then divide the total weight by the number of shrimp. Enter it once a week from about DOC 30 so KAIMEA can forecast your pond's harvest weight.",
      noTeamKey: "Team key not set (Settings)", connFarmerMissing: "The app is not connected to KAIMEA yet. Your data is safe on the phone — contact the KAIMEA team.",
      fromConfig: "already set (leave blank)", keySaved: "•••••••• saved on this phone", keyEnter: "type the team key from your coordinator",
      keyNote: "The team key is never shown again once saved. Leave the field blank to keep the saved key.",
      switchTeamQ: "Field-team mode is for KAIMEA staff only and needs the team key. Switch mode anyway?",
      consentTitle: "Data sharing consent", consentBody: "The data you enter (pond condition, water quality, location if taken, name and phone number) is sent to the KAIMEA team for pond health analysis and service development. Your name and phone number are not shared with others without your permission. You can stop at any time by no longer entering data and asking the KAIMEA team to delete your data.",
      consentAgree: "I agree to send my data to KAIMEA", consentGo: "Continue", consentNeed: "Tick the consent box first.",
      lOk: "good", lWarn: "caution", lBad: "danger",
      checkTitle: "Latest water check", checkAllOk: "All values entered are in the good range.",
      checkAdvice: "This is a general range check, not a disease diagnosis. If anything shows \"danger\" or deaths are rising, contact the KAIMEA team or your extension officer.",
      lightsNote: "Green/yellow/red lights use general shrimp-farming ranges."
    }
  };
  var lang = LS.get("kc.lang", "id");
  function t(k) { return (T[lang] && T[lang][k]) || T.en[k] || k; }

  /* ---------- fields ----------
   * [key, label ID, label EN, unit, step, min plausible, max plausible]
   * Keys match the KAIMEA Farm Dashboard engine so data can be fed straight into it.
   */
  var POND = [
    ["area_ha", "Luas kolam", "Pond area", "ha", 0.01, 0.01, 20],
    ["doc", "Umur budidaya (DOC)", "Days of culture (DOC)", "hari/days", 1, 0, 200],
    ["abw_g", "Berat rata-rata (ABW)", "Average body weight (ABW)", "g", 0.1, 0, 60],
    ["density_m2", "Padat tebar", "Stocking density", "ekor/m²", 1, 0, 600],
    ["mortality_n", "Udang mati hari ini", "Dead shrimp today", "ekor/pcs", 1, 0, 100000],
    ["feed_kg", "Pakan hari ini", "Feed today", "kg", 0.1, 0, 2000]
  ];
  var WQ = [
    ["do_min", "DO subuh", "Dawn DO", "mg/L", 0.1, 0, 20],
    ["ph_am", "pH pagi", "pH morning", "", 0.05, 5, 11],
    ["ph_pm", "pH sore", "pH afternoon", "", 0.05, 5, 11],
    ["temp_am", "Suhu pagi", "Temp morning", "°C", 0.1, 15, 40],
    ["temp_pm", "Suhu sore", "Temp afternoon", "°C", 0.1, 15, 40],
    ["salinity", "Salinitas", "Salinity", "ppt", 0.5, 0, 60],
    ["alkalinity", "Alkalinitas", "Alkalinity", "mg/L CaCO₃", 1, 0, 400],
    ["tan", "TAN", "TAN", "mg/L", 0.05, 0, 20],
    ["no2n", "Nitrit-N", "Nitrite-N", "mg/L", 0.05, 0, 20],
    ["depth", "Kedalaman air", "Water depth", "m", 0.05, 0.2, 3],
    ["secchi_cm", "Kecerahan (Secchi)", "Transparency (Secchi)", "cm", 1, 5, 200]
  ];
  var WQ2 = [
    ["h2s", "H₂S", "H₂S", "mg/L", 0.001, 0, 1],
    ["no3n", "Nitrat-N", "Nitrate-N", "mg/L", 1, 0, 500],
    ["soil_orp", "ORP tanah dasar", "Bottom soil ORP", "mV", 1, -500, 500],
    ["cyano_pct", "Porsi alga biru-hijau", "Blue-green algae share", "%", 1, 0, 100],
    ["vibrio_cfu", "Total Vibrio (TCBS)", "Total Vibrio (TCBS)", "CFU/mL", 1, 0, 1e7],
    ["vibrio_green_pct", "Koloni hijau", "Green colonies", "%", 1, 0, 100]
  ];
  var SIGNS = [
    ["empty_gut", "Usus kosong", "Empty gut"],
    ["white_feces", "Kotoran putih", "White feces"],
    ["white_spots", "Bintik putih", "White spots"],
    ["red_body", "Tubuh merah", "Red body"],
    ["white_muscle", "Otot putih/keruh", "White/opaque muscle"],
    ["pale_hepato", "Hepatopankreas pucat", "Pale hepatopancreas"],
    ["soft_shell", "Kulit lembek", "Soft shell"],
    ["slow_growth", "Pertumbuhan lambat", "Slow growth"],
    ["surface_swim", "Berenang di permukaan/tepi", "Swimming at surface/edge"],
    ["low_feed", "Nafsu makan turun", "Lower feed intake"]
  ];
  var SAMPLES = [
    ["sample_water_id", "Kode sampel air", "Water sample code"],
    ["sample_16s_id", "Kode sampel 16S", "16S sample code"],
    ["sample_pcr_id", "Kode sampel PCR/LAMP", "PCR/LAMP sample code"]
  ];
  var NUMERIC = POND.concat(WQ, WQ2);
  var IDENT = ["collector", "farm", "pond_id", "sampled_at"];

  /* Farmer mode shows a shorter form: what a farmer can measure with a basic kit.
   * ABW is included so the growth model can calibrate each pond on its own weekly samplings. */
  function pick(list, keys) { return keys.map(function (k) { var o = null; list.forEach(function (f) { if (f[0] === k) o = f; }); return o; }); }
  var F_POND = pick(POND, ["doc", "abw_g", "mortality_n", "feed_kg"]);
  var F_WQ = pick(WQ, ["do_min", "ph_am", "ph_pm", "temp_am", "temp_pm", "salinity", "depth", "secchi_cm"]);
  var F_EXTRA = pick(WQ, ["tan", "alkalinity", "no2n"]);

  /* Traffic lights: [caution, danger] bounds, the same general ranges as the KAIMEA dashboard (not the risk model). */
  var LIGHTS = {
    do_min: { low: [5.0, 2.0] }, ph_am: { low: [8.0, 7.2], high: [8.6, 9.2] }, ph_pm: { low: [8.0, 7.2], high: [8.6, 9.2] },
    temp_am: { low: [27.5, 24.0], high: [33.0, 35.0] }, temp_pm: { low: [27.5, 24.0], high: [33.0, 35.0] },
    salinity: { low: [15.0, 5.0], high: [32.0, 40.0] }, depth: { low: [1.1, 0.8] }, alkalinity: { low: [100.0, 60.0] },
    no2n: { high: [0.5, 2.0] }, h2s: { high: [0.0025, 0.01] }, ph_swing: { high: [0.5, 1.0] }, temp_swing: { high: [2.0, 4.0] }
  };
  function light(k, v) {
    var L = LIGHTS[k], n = num(v); if (!L || n == null) return null;
    var lv = 0;
    if (L.low) { if (n < L.low[1]) lv = 2; else if (n < L.low[0]) lv = 1; }
    if (L.high) { if (n > L.high[1]) lv = 2; else if (n > L.high[0]) lv = Math.max(lv, 1); }
    return lv;
  }
  function lightPill(lv) {
    if (lv == null) return "";
    var c = ["ok", "warn", "bad"][lv];
    return ' <span class="lt lt-' + c + '">' + esc(t(["lOk", "lWarn", "lBad"][lv])) + "</span>";
  }

  /* Column order sent to the sheet (must match Code.gs HEADERS). */
  var COLUMNS = ["record_id", "app_version", "role", "collector", "phone", "consent_at", "device", "created_at", "updated_at", "sampled_at", "farm", "pond_id",
    "lat", "lng", "gps_acc_m"].concat(POND.map(function (f) { return f[0]; }), WQ.map(function (f) { return f[0]; }),
    ["ph", "ph_swing", "temp_mean", "temp_swing"], WQ2.map(function (f) { return f[0]; }),
    ["signs"], SAMPLES.map(function (f) { return f[0]; }), ["notes"]);

  /* ---------- storage: IndexedDB with localStorage fallback ---------- */
  var store = (function () {
    var DBN = "kaimea-collector", ST = "records", dbp = null;
    function idbOk() { try { return !!window.indexedDB; } catch (e) { return false; } }
    function open() {
      if (dbp) return dbp;
      dbp = new Promise(function (res, rej) {
        var r = indexedDB.open(DBN, 1);
        r.onupgradeneeded = function () { var db = r.result; if (!db.objectStoreNames.contains(ST)) db.createObjectStore(ST, { keyPath: "record_id" }); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
        r.onblocked = function () { rej(new Error("blocked")); };
      });
      return dbp;
    }
    function tx(mode, fn) {
      return open().then(function (db) {
        return new Promise(function (res, rej) {
          var x = db.transaction(ST, mode), s = x.objectStore(ST), out;
          out = fn(s);
          x.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); };
          x.onerror = function () { rej(x.error); };
          x.onabort = function () { rej(x.error || new Error("abort")); };
        });
      });
    }
    var useLS = !idbOk();
    function lsAll() { return LS.get("kc.records", []); }
    function lsPut(rec) { var a = lsAll().filter(function (r) { return r.record_id !== rec.record_id; }); a.push(rec); if (!LS.set("kc.records", a)) throw new Error("storage full"); }
    function fallback(e) { console.warn("IndexedDB failed, using localStorage", e); useLS = true; }
    return {
      put: function (rec) {
        if (useLS) return Promise.resolve().then(function () { lsPut(rec); });
        return tx("readwrite", function (s) { s.put(rec); }).catch(function (e) { fallback(e); lsPut(rec); });
      },
      all: function () {
        if (useLS) return Promise.resolve(lsAll());
        return tx("readonly", function (s) { return s.getAll(); }).then(function (a) { return (a || []).concat(lsAll()); })
          .catch(function (e) { fallback(e); return lsAll(); });
      },
      del: function (id) {
        LS.set("kc.records", lsAll().filter(function (r) { return r.record_id !== id; }));
        if (useLS) return Promise.resolve();
        return tx("readwrite", function (s) { s["delete"](id); }).catch(function () {});
      }
    };
  })();

  /* ---------- helpers ---------- */
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function localDT(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function isoWithOffset(v) { // "2026-11-10T06:30" (phone local) -> ISO with the phone's UTC offset
    if (!v) return "";
    var d = new Date(v); if (isNaN(d)) return v;
    var o = -d.getTimezoneOffset(), sign = o >= 0 ? "+" : "-"; o = Math.abs(o);
    return v + ":00" + sign + pad(Math.floor(o / 60)) + ":" + pad(o % 60);
  }
  function num(v) { if (v === "" || v == null) return null; var n = Number(String(v).replace(",", ".")); return isFinite(n) ? n : null; }
  function round(x, d) { var p = Math.pow(10, d); return Math.round(x * p) / p; }
  function fmtTime(iso) { try { var d = new Date(iso); return isNaN(d) ? iso : d.toLocaleString(lang === "id" ? "id-ID" : "en-GB", { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return iso; } }
  var toastT;
  function toast(msg, ms) { var el = $("toast"); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { el.hidden = true; }, ms || 3200); }
  /* Keys: config.js carries only FARMER_KEY (it is public by nature: anyone with the link can read it).
   * The receiver accepts it for farmer rows only. The TEAM_KEY is never published: each field-team
   * member types it once on their own phone; it is stored there and never displayed again. */
  function settings() {
    var s = LS.get("kc.settings", {});
    return { endpoint: (s.endpoint || CFG.SHEET_ENDPOINT || "").trim(), teamKey: (s.key || "").trim(), farmerKey: (CFG.FARMER_KEY || "").trim() };
  }
  function keyFor(r) { var s = settings(); return r === "team" ? s.teamKey : (s.teamKey || s.farmerKey); }
  function deviceInfo() {
    var ua = navigator.userAgent || "", m = ua.match(/Android [\d.]+;?\s?([^;)]*)/);
    return (m ? "Android " + (ua.match(/Android ([\d.]+)/) || [])[1] + " " + m[1] : ua.slice(0, 60)).trim();
  }

  /* ---------- state ---------- */
  var tab = "form", editingId = null, records = [], syncState = "idle", lastErr = "";
  // Role comes from the link (…/?mode=petambak or ?mode=tim) or the first-run choice.
  var qm = (location.search.match(/[?&]mode=([a-z]+)/i) || [])[1];
  if (qm) { qm = /^(petambak|farmer)$/i.test(qm) ? "farmer" : /^(tim|team)$/i.test(qm) ? "team" : null; if (qm) LS.set("kc.role", qm); }
  var role = LS.get("kc.role", null);
  function isFarmer() { return role === "farmer"; }
  function needsConsent() { return isFarmer() && !LS.get("kc.consent", null); }
  var form = LS.get("kc.draft", null) || blankForm();
  function blankForm(keepIdent) {
    var f = { sampled_at: localDT(new Date()), signs: [] };
    var last = LS.get("kc.lastIdent", {});
    f.collector = last.collector || ""; f.phone = last.phone || "";
    if (keepIdent) { f.farm = last.farm || ""; f.pond_id = ""; }
    return f;
  }
  function saveDraft() { LS.set("kc.draft", form); }

  /* ---------- derived values (same definitions as the KAIMEA dashboard) ---------- */
  function derive(f) {
    var a = num(f.ph_am), p = num(f.ph_pm), ta = num(f.temp_am), tp = num(f.temp_pm), d = {};
    d.ph = a != null ? a : p;                                   // dashboard uses dawn pH
    d.ph_swing = a != null && p != null ? round(Math.abs(p - a), 2) : null;
    d.temp_mean = ta != null && tp != null ? round((ta + tp) / 2, 2) : (ta != null ? ta : tp);
    d.temp_swing = ta != null && tp != null ? round(Math.abs(tp - ta), 2) : null;
    return d;
  }

  /* ---------- render ---------- */
  function render() {
    document.documentElement.lang = lang;
    $("lg-id").setAttribute("aria-pressed", lang === "id"); $("lg-en").setAttribute("aria-pressed", lang === "en");
    $("t-sub").textContent = t("sub");
    $("tab-form").textContent = t("tabForm");
    var pend = records.filter(function (r) { return r._status !== "synced"; }).length;
    $("tab-list").textContent = t("tabList") + (pend ? " (" + pend + ")" : "");
    $("tab-set").textContent = t("tabSet");
    ["form", "list", "set"].forEach(function (k) { $("tab-" + k).setAttribute("aria-selected", tab === k); });
    var gate = !role || (tab === "form" && needsConsent());
    document.querySelector("nav").hidden = !role;
    $("bar").hidden = tab !== "form" || gate;
    $("btn-save").textContent = t("save");
    $("btn-clear").textContent = editingId ? t("cancelEdit") : t("clear");
    renderSync();
    if (!role) renderPicker();
    else if (tab === "form" && needsConsent()) renderConsent();
    else if (tab === "form") renderForm(); else if (tab === "list") renderList(); else renderSettings();
  }

  function renderSync() {
    var pend = records.filter(function (r) { return r._status !== "synced"; }).length;
    var on = navigator.onLine, s = settings(), txt, cls = "dot";
    if (!s.endpoint) { txt = t(isFarmer() ? "connFarmerMissing" : "noEndpoint"); cls += " err"; }
    else if (!keyFor(role || "team")) { txt = t(isFarmer() ? "connFarmerMissing" : "noTeamKey"); cls += " err"; }
    else if (syncState === "syncing") { txt = t("syncing"); cls += " on"; }
    else if (!on) { txt = t("offline"); }
    else if (syncState === "error") { txt = t("syncErr"); cls += " err"; }
    else { txt = t("online"); cls += " on"; }
    txt += " · " + (pend ? pend + " " + t("pending") : t("allSent"));
    var last = LS.get("kc.lastSync", "");
    if (last && !pend) txt += " · " + t("lastSync") + " " + fmtTime(last);
    $("dot").className = cls; $("synctxt").textContent = txt;
  }

  function numField(f) {
    var k = f[0], label = lang === "id" ? f[1] : f[2], v = form[k] == null ? "" : form[k];
    return '<div class="f" data-k="' + k + '"><label for="i-' + k + '">' + esc(label) + (f[3] ? "<small>" + esc(f[3]) + "</small>" : "") +
      '<span class="ltw" id="lt-' + k + '">' + lightPill(light(k, v)) + "</span>" +
      '</label><input id="i-' + k + '" name="' + k + '" inputmode="decimal" type="text" autocomplete="off" value="' + esc(v) + '">' + rangeWarn(f, v) + "</div>";
  }
  function rangeWarn(f, v) {
    var n = num(v);
    if (v !== "" && v != null && n == null) return '<div class="warnmsg">' + esc(t("warnRange")) + "</div>";
    if (n != null && (n < f[5] || n > f[6])) return '<div class="warnmsg">' + esc(t("warnRange")) + " (" + f[5] + "–" + f[6] + ")</div>";
    return "";
  }
  function textField(k, label, req, type) {
    var v = form[k] == null ? "" : form[k];
    return '<div class="f wide"><label for="i-' + k + '">' + esc(label) + (req ? " <small>" + esc(t("required")) + "</small>" : "") + "</label>" +
      '<input id="i-' + k + '" name="' + k + '" type="' + (type || "text") + '" value="' + esc(v) + '"' + (req ? " required" : "") +
      (k === "farm" ? ' list="dl-farm"' : k === "pond_id" ? ' list="dl-pond"' : "") + ' autocomplete="off"></div>';
  }
  function datalists() {
    var farms = {}, ponds = {};
    records.forEach(function (r) { if (r.farm) farms[r.farm] = 1; if (r.pond_id && (!form.farm || r.farm === form.farm)) ponds[r.pond_id] = 1; });
    var opt = function (o) { return Object.keys(o).sort().map(function (x) { return '<option value="' + esc(x) + '">'; }).join(""); };
    return '<datalist id="dl-farm">' + opt(farms) + '</datalist><datalist id="dl-pond">' + opt(ponds) + "</datalist>";
  }

  function renderForm() {
    var d = derive(form), h = "", far = isFarmer();
    if (editingId) h += '<div class="banner warn">' + esc(t("editing")) + "</div>";
    if (far && !editingId) h += checkSummary();
    h += datalists() + '<form id="frm" autocomplete="off" novalidate>';
    h += "<fieldset><legend>" + esc(far ? t("fIdent") : t("gIdent")) + "</legend>" +
      textField("collector", far ? t("farmerName") : t("collector"), true) +
      (far ? textField("phone", t("phone") + " (" + t("optional") + ")", false, "tel") : "") +
      textField("farm", t("farm"), true) + textField("pond_id", t("pond"), true) +
      textField("sampled_at", t("sampled"), true, "datetime-local") +
      '<div class="f wide"><div class="row"><button type="button" id="btn-gps">' + esc(t("gps")) + '</button><span class="gps" id="gpsout">' +
      (form.lat != null ? esc(form.lat + ", " + form.lng + " (" + t("gpsAcc") + " ±" + form.gps_acc_m + " m)") : "") + "</span></div></div></fieldset>";
    if (far) {
      h += "<fieldset><legend>" + esc(t("fWq")) + "</legend>" + F_WQ.map(numField).join("") +
        '<div class="derived" id="derived">' + derivedTxt(d) + '</div><p class="note">' + esc(t("lightsNote")) + "</p></fieldset>";
      h += "<fieldset><legend>" + esc(t("fPond")) + "</legend>" + F_POND.map(numField).join("") +
        '<p class="note">' + esc(t("abwHint")) + "</p></fieldset>";
      h += signsBlock();
      h += "<fieldset><legend>" + esc(t("fExtra")) + "</legend>" + F_EXTRA.map(numField).join("") + "</fieldset>";
    } else {
      h += "<fieldset><legend>" + esc(t("gPond")) + "</legend>" + POND.map(numField).join("") + "</fieldset>";
      h += "<fieldset><legend>" + esc(t("gWq")) + "</legend>" + WQ.map(numField).join("") +
        '<div class="derived" id="derived">' + derivedTxt(d) + "</div></fieldset>";
      h += "<fieldset><legend>" + esc(t("gWq2")) + "</legend>" + WQ2.map(numField).join("") + "</fieldset>";
      h += signsBlock();
      h += "<fieldset><legend>" + esc(t("gSamples")) + "</legend>" + SAMPLES.map(function (s) { return textField(s[0], lang === "id" ? s[1] : s[2], false); }).join("") + "</fieldset>";
    }
    h += "<fieldset><legend>" + esc(t("gNotes")) + '</legend><div class="f wide"><label for="i-notes">' + esc(t("notes")) +
      '</label><textarea id="i-notes" name="notes">' + esc(form.notes || "") + "</textarea></div></fieldset>";
    h += "</form>";
    $("view").innerHTML = h;
    $("frm").addEventListener("input", onInput);
    $("frm").addEventListener("change", onInput);
    $("btn-gps").addEventListener("click", getGPS);
  }
  function signsBlock() {
    return "<fieldset><legend>" + esc(t("gSigns")) + '</legend><div class="chips">' + SIGNS.map(function (s) {
      var on = (form.signs || []).indexOf(s[0]) >= 0;
      return '<label class="chip"><input type="checkbox" name="sign" value="' + s[0] + '"' + (on ? " checked" : "") + ">" + esc(lang === "id" ? s[1] : s[2]) + "</label>";
    }).join("") + "</div></fieldset>";
  }
  /* Farmer feedback: lights for the most recent saved reading. */
  function recordLights(r) {
    var out = [];
    Object.keys(LIGHTS).forEach(function (k) {
      var lv = light(k, r[k]); if (lv) out.push([k, lv, r[k]]);
    });
    return out;
  }
  function labelOf(k) {
    var f = null; NUMERIC.forEach(function (x) { if (x[0] === k) f = x; });
    if (f) return lang === "id" ? f[1] : f[2];
    return { ph_swing: lang === "id" ? "Fluktuasi pH" : "pH swing", temp_swing: lang === "id" ? "Fluktuasi suhu" : "Temp swing" }[k] || k;
  }
  function checkSummary() {
    var r = records[0]; if (!r) return "";
    var bad = recordLights(r), worst = bad.reduce(function (m, x) { return Math.max(m, x[1]); }, 0);
    var h = '<div class="banner ' + (worst === 2 ? "bad" : worst === 1 ? "warn" : "okb") + '"><b>' + esc(t("checkTitle")) + "</b> · " + esc(r.pond_id) + " · " +
      esc(fmtTime(r._sampled_local || r.sampled_at)) + "<br>";
    if (!bad.length) h += esc(t("checkAllOk"));
    else h += bad.map(function (x) { return esc(labelOf(x[0])) + " " + esc(x[2]) + lightPill(x[1]); }).join("<br>");
    if (worst) h += '<div class="note">' + esc(t("checkAdvice")) + "</div>";
    return h + "</div>";
  }
  function renderPicker() {
    $("view").innerHTML = '<h2 style="margin:6px 0 14px;font-size:20px">' + esc(t("pickTitle")) + '</h2><div class="list">' +
      '<button type="button" class="pick" data-role="farmer"><b>' + esc(t("pickFarmer")) + "</b><span>" + esc(t("pickFarmerSub")) + "</span></button>" +
      '<button type="button" class="pick" data-role="team"><b>' + esc(t("pickTeam")) + "</b><span>" + esc(t("pickTeamSub")) + "</span></button></div>";
    Array.prototype.forEach.call(document.querySelectorAll(".pick"), function (b) {
      b.onclick = function () { role = b.getAttribute("data-role"); LS.set("kc.role", role); tab = "form"; render(); };
    });
  }
  function renderConsent() {
    $("view").innerHTML = "<fieldset><legend>" + esc(t("consentTitle")) + '</legend><p style="margin:6px 0 12px">' + esc(t("consentBody")) + "</p>" +
      '<label class="chip" style="border-radius:6px"><input type="checkbox" id="c-ok">' + esc(t("consentAgree")) + "</label>" +
      '<div style="padding-top:12px"><button type="button" class="primary" id="c-go" style="width:100%">' + esc(t("consentGo")) + "</button></div></fieldset>";
    $("c-go").onclick = function () {
      if (!$("c-ok").checked) { toast(t("consentNeed")); return; }
      LS.set("kc.consent", new Date().toISOString()); render();
    };
  }
  function derivedTxt(d) {
    var parts = [];
    if (d.ph_swing != null) parts.push(esc(labelOf("ph_swing")) + " " + d.ph_swing + lightPill(light("ph_swing", d.ph_swing)));
    if (d.temp_mean != null) parts.push((lang === "id" ? "Suhu rata-rata " : "Mean temp ") + d.temp_mean + " °C");
    if (d.temp_swing != null) parts.push(esc(labelOf("temp_swing")) + " " + d.temp_swing + " °C" + lightPill(light("temp_swing", d.temp_swing)));
    return parts.length ? esc(t("derived")) + ": " + parts.join(" · ") : "";
  }
  function onInput(e) {
    var el = e.target;
    if (el.name === "sign") {
      form.signs = Array.prototype.slice.call(document.querySelectorAll('input[name="sign"]:checked')).map(function (x) { return x.value; });
    } else if (el.name) {
      form[el.name] = el.value;
      el.classList.remove("req-miss");
      var spec = null; NUMERIC.forEach(function (f) { if (f[0] === el.name) spec = f; });
      if (spec && e.type === "change") {
        var box = el.parentNode, old = box.querySelector(".warnmsg"); if (old) old.remove();
        var w = rangeWarn(spec, el.value); if (w) box.insertAdjacentHTML("beforeend", w);
      }
      var lt = $("lt-" + el.name); if (lt) lt.innerHTML = lightPill(light(el.name, el.value));
      if (/^(ph_|temp_)/.test(el.name) && $("derived")) $("derived").innerHTML = derivedTxt(derive(form));
    }
    saveDraft();
  }
  function getGPS() {
    var out = $("gpsout");
    if (!navigator.geolocation) { out.textContent = t("gpsNo"); return; }
    out.textContent = t("gpsWait");
    navigator.geolocation.getCurrentPosition(function (p) {
      form.lat = round(p.coords.latitude, 6); form.lng = round(p.coords.longitude, 6); form.gps_acc_m = Math.round(p.coords.accuracy);
      saveDraft(); out.textContent = form.lat + ", " + form.lng + " (" + t("gpsAcc") + " ±" + form.gps_acc_m + " m)";
    }, function () { out.textContent = t("gpsNo"); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  }

  function buildRecord() {
    var d = derive(form), now = new Date().toISOString(), old = null;
    if (editingId) records.forEach(function (r) { if (r.record_id === editingId) old = r; });
    var r = {
      record_id: editingId || uuid(), app_version: APP_VERSION, collector: (form.collector || "").trim(), device: deviceInfo(),
      role: role || "team", phone: isFarmer() ? (form.phone || "").trim() : "", consent_at: isFarmer() ? LS.get("kc.consent", "") : "",
      created_at: old ? old.created_at : now, updated_at: now,
      sampled_at: isoWithOffset(form.sampled_at), _sampled_local: form.sampled_at,
      farm: (form.farm || "").trim(), pond_id: (form.pond_id || "").trim().toUpperCase(),
      lat: form.lat == null ? null : form.lat, lng: form.lng == null ? null : form.lng, gps_acc_m: form.gps_acc_m == null ? null : form.gps_acc_m,
      signs: (form.signs || []).join(";"), notes: (form.notes || "").trim(), _status: "pending"
    };
    NUMERIC.forEach(function (f) { r[f[0]] = num(form[f[0]]); });
    r.ph = d.ph; r.ph_swing = d.ph_swing; r.temp_mean = d.temp_mean; r.temp_swing = d.temp_swing;
    SAMPLES.forEach(function (s) { r[s[0]] = (form[s[0]] || "").trim(); });
    return r;
  }

  function onSave() {
    var miss = IDENT.filter(function (k) { return !String(form[k] || "").trim(); });
    if (miss.length) {
      miss.forEach(function (k) { var el = $("i-" + k); if (el) el.classList.add("req-miss"); });
      var first = $("i-" + miss[0]); if (first) first.focus();
      toast(t("needReq")); return;
    }
    var hasData = NUMERIC.some(function (f) { return num(form[f[0]]) != null; }) || (form.signs || []).length ||
      SAMPLES.some(function (s) { return String(form[s[0]] || "").trim(); }) || String(form.notes || "").trim();
    if (!hasData) { toast(t("noData")); return; }
    var rec = buildRecord();
    $("btn-save").disabled = true;
    store.put(rec).then(function () {
      LS.set("kc.lastIdent", { collector: rec.collector, farm: rec.farm, phone: rec.phone });
      editingId = null; form = blankForm(true); saveDraft();
      return reload();
    }).then(function () {
      toast(t("saved")); window.scrollTo(0, 0); render(); sync();
    }).catch(function (e) {
      toast("Error: " + (e && e.message || e), 6000);
    }).then(function () { $("btn-save").disabled = false; });
  }
  function onClear() {
    if (!editingId && !confirm(t("confirmClear"))) return;
    editingId = null; form = blankForm(true); saveDraft(); render();
  }

  function renderList() {
    var pend = records.filter(function (r) { return r._status !== "synced"; });
    var h = '<div class="stats"><div><span>' + esc(t("total")) + "</span><b>" + records.length + "</b></div><div><span>" + esc(t("pendingN")) +
      "</span><b>" + pend.length + "</b></div><div><span>" + esc(t("sentN")) + "</span><b>" + (records.length - pend.length) + "</b></div></div>";
    if (syncState === "error" && lastErr) h += '<div class="banner bad">' + esc(t("syncErr")) + ": " + esc(lastErr) + "</div>";
    h += '<div class="row" style="margin-bottom:12px"><button type="button" class="primary" id="btn-sync"' + (pend.length ? "" : " disabled") + ">" +
      esc(t("syncNow")) + '</button><button type="button" id="btn-csv"' + (records.length ? "" : " disabled") + ">" + esc(t("export")) + "</button></div>";
    if (!records.length) h += '<div class="empty">' + esc(t("emptyList")) + "</div>";
    else {
      h += '<div class="list">' + records.slice(0, 300).map(function (r) {
        var syn = r._status === "synced", meas = [];
        if (r.do_min != null) meas.push("DO " + r.do_min); if (r.ph != null) meas.push("pH " + r.ph);
        if (r.tan != null) meas.push("TAN " + r.tan); if (r.salinity != null) meas.push("Sal " + r.salinity);
        if (r.abw_g != null) meas.push("ABW " + r.abw_g + " g");
        if (r.signs) meas.push("⚑ " + r.signs.split(";").length);
        var lts = recordLights(r), nb = lts.filter(function (x) { return x[1] === 2; }).length, nw = lts.length - nb;
        return '<div class="rec' + (syn ? " synced" : "") + '"><div class="t"><span>' + esc(r.farm) + " · " + esc(r.pond_id) + '</span><span class="pill ' +
          (syn ? "s" : "p") + '">' + esc(syn ? t("sSynced") : t("sPending")) + '</span></div><div class="m">' + esc(fmtTime(r._sampled_local || r.sampled_at)) +
          " · " + esc(r.collector) + "</div>" + (meas.length ? '<div class="m">' + esc(meas.join(" · ")) + "</div>" : "") +
          (nb || nw ? '<div class="m">' + (nb ? nb + lightPill(2) + " " : "") + (nw ? nw + lightPill(1) : "") + "</div>" : "") +
          (syn ? "" : '<div class="row" style="margin-top:8px"><button type="button" data-edit="' + esc(r.record_id) + '">' + esc(t("edit")) +
            '</button><button type="button" class="danger" data-del="' + esc(r.record_id) + '">' + esc(t("del")) + "</button></div>") + "</div>";
      }).join("") + "</div>";
    }
    $("view").innerHTML = h;
    var bs = $("btn-sync"); if (bs) bs.onclick = function () { sync(true); };
    var bc = $("btn-csv"); if (bc) bc.onclick = exportCSV;
    $("view").onclick = function (e) {
      var id = e.target.getAttribute("data-del"), ed = e.target.getAttribute("data-edit");
      if (id && confirm(t("delQ"))) store.del(id).then(reload).then(render);
      if (ed) startEdit(ed);
    };
  }
  function startEdit(id) {
    var r = null; records.forEach(function (x) { if (x.record_id === id) r = x; });
    if (!r || r._status === "synced") return;
    editingId = id; form = { signs: r.signs ? r.signs.split(";") : [] };
    ["collector", "phone", "farm", "pond_id", "notes", "lat", "lng", "gps_acc_m"].forEach(function (k) { form[k] = r[k]; });
    form.sampled_at = r._sampled_local || String(r.sampled_at || "").slice(0, 16);
    NUMERIC.forEach(function (f) { form[f[0]] = r[f[0]] == null ? "" : String(r[f[0]]); });
    SAMPLES.forEach(function (s) { form[s[0]] = r[s[0]] || ""; });
    saveDraft(); tab = "form"; render(); window.scrollTo(0, 0);
  }
  function exportCSV() {
    var cols = COLUMNS.concat(["_status", "_synced_at"]);
    var q = function (v) { v = v == null ? "" : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var csv = "﻿" + cols.join(",") + "\n" + records.map(function (r) { return cols.map(function (c) { return q(r[c]); }).join(","); }).join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "kaimea-data-" + localDT(new Date()).replace(/[:T]/g, "-") + ".csv";
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast(t("exported"));
  }

  var installEvt = null, persisted = null;
  function renderSettings() {
    var s = LS.get("kc.settings", {}), eff = settings();
    var h = "<fieldset><legend>" + esc(t("role")) + '</legend><div class="row"><b>' + esc(isFarmer() ? t("roleFarmer") : t("roleTeam")) +
      '</b><button type="button" id="s-role">' + esc(t("switchRole")) + "</button></div></fieldset>";
    if (isFarmer()) {
      // Farmers never see connection details. If the app was published without them, say who to contact.
      if (!eff.endpoint || !eff.farmerKey) h += '<div class="banner warn">' + esc(t("connFarmerMissing")) + "</div>";
    } else {
      // Team: saved values are never shown. The address field shows only a phone-level override, the key field stays blank.
      h += "<fieldset><legend>" + esc(t("setTitle")) + "</legend>" +
        '<div class="f wide"><label for="s-ep">' + esc(t("endpoint")) + '</label><input id="s-ep" type="url" inputmode="url" autocomplete="off" placeholder="' +
        esc(CFG.SHEET_ENDPOINT ? t("fromConfig") : "https://script.google.com/macros/s/…/exec") + '" value="' + esc(s.endpoint || "") + '"></div>' +
        '<div class="f wide"><label for="s-key">' + esc(t("key")) + '</label><input id="s-key" type="password" autocomplete="off" placeholder="' +
        esc(eff.teamKey ? t("keySaved") : t("keyEnter")) + '" value=""></div><p class="note">' + esc(t("keyNote")) + "</p>" +
        '<div class="row" style="padding-top:8px"><button type="button" class="primary" id="s-save">' + esc(t("saveSet")) +
        '</button><button type="button" id="s-test"' + (eff.endpoint && eff.teamKey ? "" : " disabled") + ">" + esc(t("test")) + "</button></div></fieldset>";
    }
    h += "<fieldset><legend>" + esc(t("install")) + "</legend>" + (installEvt ? '<button type="button" class="primary" id="s-inst">' + esc(t("install")) + "</button>" :
      '<p class="note">' + esc(t("installHint")) + "</p>") + "</fieldset>";
    h += "<fieldset><legend>" + esc(t("storage")) + '</legend><p class="note">' + esc(persisted ? t("persisted") : t("notPersisted")) + '</p><p class="note">' +
      esc(t("version")) + " " + esc(APP_VERSION) + " · " + esc(deviceInfo()) + "</p></fieldset>";
    $("view").innerHTML = h;
    $("s-role").onclick = function () {
      if (isFarmer() && !confirm(t("switchTeamQ"))) return;
      role = null; LS.set("kc.role", null); tab = "form"; render();
    };
    if ($("s-save")) $("s-save").onclick = function () {
      var k = $("s-key").value.trim();   // blank keeps the key already saved on this phone
      LS.set("kc.settings", { endpoint: $("s-ep").value.trim(), key: k || s.key || "" });
      toast(t("setSaved")); render(); sync();
    };
    var st = $("s-test"); if (st) st.onclick = testConn;
    var si = $("s-inst"); if (si) si.onclick = function () { installEvt.prompt(); installEvt.userChoice.then(function () { installEvt = null; render(); }); };
  }
  function post(body, ms) {
    var s = settings(), ctl = window.AbortController ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, ms || 30000) : null;
    // text/plain avoids a CORS preflight, which Apps Script does not answer.
    return fetch(s.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body), redirect: "follow", signal: ctl ? ctl.signal : undefined })
      .then(function (res) { return res.text().then(function (txt) { var j; try { j = JSON.parse(txt); } catch (e) { throw new Error("HTTP " + res.status + " (not JSON — check the URL and that access is 'Anyone')"); } return j; }); })
      .then(function (j) { if (timer) clearTimeout(timer); if (!j.ok) throw new Error(j.error || "rejected"); return j; },
        function (e) { if (timer) clearTimeout(timer); throw e.name === "AbortError" ? new Error("timeout") : e; });
  }
  function testConn() {
    post({ key: keyFor(role || "team"), action: "ping" }, 20000).then(function () { toast(t("testOk")); }, function (e) { toast(t("testBad") + e.message, 6000); });
  }

  /* ---------- sync ---------- */
  var backoff = 0, nextTry = 0;
  function sync(manual) {
    var s = settings();
    if (syncState === "syncing" || !s.endpoint) { renderSync(); return Promise.resolve(); }
    if (!manual && (!navigator.onLine || Date.now() < nextTry)) { renderSync(); return Promise.resolve(); }
    // Only rows this phone holds a key for are sent; each role's rows go with that role's key.
    var pend = records.filter(function (r) { return r._status !== "synced" && keyFor(r.role || "team"); });
    if (!pend.length) { syncState = "idle"; renderSync(); return Promise.resolve(); }
    syncState = "syncing"; render();
    var chunks = [];
    ["farmer", "team"].forEach(function (rl) {
      var part = pend.filter(function (r) { return (r.role || "team") === rl; });
      for (var i = 0; i < part.length; i += 20) chunks.push({ key: keyFor(rl), rows: part.slice(i, i + 20) });
    });
    var sent = 0;
    return chunks.reduce(function (p, ch) {
      var chunk = ch.rows;
      return p.then(function () {
        var payload = chunk.map(function (r) { var o = {}; COLUMNS.forEach(function (c) { o[c] = r[c] == null ? "" : r[c]; }); return o; });
        return post({ key: ch.key, action: "append", columns: COLUMNS, records: payload }).then(function (j) {
          var ok = {}; (j.accepted || []).forEach(function (id) { ok[id] = 1; });
          var at = new Date().toISOString();
          return Promise.all(chunk.filter(function (r) { return ok[r.record_id]; }).map(function (r) {
            r._status = "synced"; r._synced_at = at; sent++; return store.put(r);
          }));
        });
      });
    }, Promise.resolve()).then(function () {
      syncState = "idle"; lastErr = ""; backoff = 0; nextTry = 0; LS.set("kc.lastSync", new Date().toISOString());
      if (manual && sent) toast(t("savedSync"));
    }, function (e) {
      syncState = "error"; lastErr = e && e.message || String(e);
      backoff = Math.min(backoff ? backoff * 2 : 30000, 15 * 60000); nextTry = Date.now() + backoff;
      if (manual) toast(t("syncErr") + ": " + lastErr, 6000);
    }).then(reload).then(render);
  }

  function reload() {
    return store.all().then(function (a) {
      var seen = {}; records = [];
      a.forEach(function (r) { if (!seen[r.record_id]) { seen[r.record_id] = 1; records.push(r); } });
      records.sort(function (x, y) { return String(y.sampled_at).localeCompare(String(x.sampled_at)); });
    });
  }

  /* ---------- wiring ---------- */
  $("lg-id").onclick = function () { lang = "id"; LS.set("kc.lang", lang); render(); };
  $("lg-en").onclick = function () { lang = "en"; LS.set("kc.lang", lang); render(); };
  ["form", "list", "set"].forEach(function (k) { $("tab-" + k).onclick = function () { tab = k; render(); window.scrollTo(0, 0); }; });
  $("btn-save").onclick = onSave;
  $("btn-clear").onclick = onClear;
  window.addEventListener("online", function () { nextTry = 0; sync(); });
  window.addEventListener("offline", renderSync);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") sync(); });
  setInterval(function () { sync(); }, 60000);
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installEvt = e; if (tab === "set") render(); });

  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then(function (p) { return p || navigator.storage.persist(); }).then(function (p) { persisted = p; }).catch(function () {});
  }
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register("sw.js").catch(function (e) { console.warn("SW", e); });
    navigator.serviceWorker.addEventListener("controllerchange", function () { if (hadController) toast(t("updated")); });
  }
  if (LS.get("kc.draft", null)) {
    var has = NUMERIC.some(function (f) { return form[f[0]] !== undefined && form[f[0]] !== ""; });
    if (has) setTimeout(function () { toast(t("draft")); }, 400);
  }
  reload().then(function () { render(); sync(); });
  window.__kaimea = { sync: sync, records: function () { return records; }, COLUMNS: COLUMNS };
})();
