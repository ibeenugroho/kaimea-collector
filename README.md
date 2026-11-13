# KAIMEA Collector

An offline-first Android app (installable web app). It records pond water quality, pond and shrimp status, visible disease signs, and lab sample codes. Readings are saved on the phone first and sent to a Google Sheet whenever there is signal.

## What it does

- **Works with no signal.** The app opens offline after the first visit, and every reading is stored on the phone (IndexedDB) until it is sent.
- **No duplicates.** Each reading has a unique ID. If the connection drops halfway through sending, the resend is ignored for rows already in the sheet.
- **Sends automatically** when the phone comes back online, when the app is reopened, every minute while it is open, and on demand ("Kirim sekarang").
- **Never loses a half-filled form.** The form is saved as a draft on every keystroke.
- **Same parameters as the KAIMEA Farm Dashboard** (dawn DO, pH, TAN, salinity, alkalinity, nitrite, depth, H₂S, nitrate, soil ORP, blue-green algae share). It also adds pH and temperature in the morning and afternoon, and works out pH swing, mean temperature and temperature swing exactly as the dashboard does.
- **Field-team extras:** GPS, density, pond area, Secchi, Vibrio count, ten visible signs, and sample codes for water, 16S and PCR/LAMP.
- **Range warnings** flag values that look like typing mistakes but never block saving.
- Bilingual (Bahasa Indonesia / English), light and dark mode, large touch targets, and a CSV backup download.
- Plain JavaScript with no framework, so it runs on Chrome for Android from about 2018 onward and on any modern browser.

## Two modes, one app
| | Farmer (`?mode=petambak`) | Field team (`?mode=tim`) |
|---|---|---|
| Form | Short: DO, pH and temperature (morning and afternoon), salinity, depth, Secchi, DOC, **ABW (weekly, with a how-to-weigh hint)**, deaths, feed, signs; TAN, alkalinity and nitrite if measured | Full: adds density, area, H₂S, nitrate, soil ORP, blue-green algae, Vibrio, lab sample codes |
| Consent | Must agree before the first entry; the consent time is sent with every row | Not asked |
| Feedback | Green/yellow/red light on each value, plus a "latest water check" card after saving | Same lights |
| Connection settings | Hidden when `config.js` is filled in | Visible |

Share the link with the mode in it (for example `https://<user>.github.io/<repo>/?mode=petambak`). Without a mode, the app asks on first open. The mode can be switched under Pengaturan.

The lights use the same general ranges as the KAIMEA dashboard (for example dawn DO below 5 is caution and below 2 is danger). They are **not** the KAIMEA risk model, so the engine formulas stay private.

In the sheet, the `role` column (`farmer` / `team`) tells the two apart, and farmers' rows also carry `phone` and `consent_at`. ABW goes to the existing `abw_g` column for both modes, so the sheet needs no change.

## Setup (about 15 minutes)

### 1. Google Sheet receiver
1. Create a new Google Sheet (for example "KAIMEA field data").
2. **Extensions → Apps Script**. Replace the contents of `Code.gs` with `google-apps-script/Code.gs`, then save.
3. **Project Settings → Script properties → Add property:** `TEAM_KEY` = a long random secret.
4. **Deploy → New deployment →** type *Web app*, *Execute as: Me*, *Who has access: Anyone*. Authorise when asked.
5. Copy the **Web app URL** (it ends in `/exec`).

The first reading creates a `readings` tab with one column per field. If a later app version adds fields, new columns are added automatically.

### 2. Configure the app
Open `config.js` and fill in `SHEET_ENDPOINT` (the `/exec` URL) and `TEAM_KEY`. **For farmers this is required**, because they should never have to type a URL or key. If you leave them blank, team phones can enter them under **Pengaturan**.

### 3. Host it (HTTPS is required for offline mode)
**GitHub Pages:** create a repository, upload every file in this folder, then go to **Settings → Pages → Deploy from branch (main, / root)**. The app is served at `https://<user>.github.io/<repo>/`.

Netlify Drop (drag the folder onto app.netlify.com/drop) or Cloudflare Pages also work.

> Note: `config.js` holds the team key in plain text. Anyone with the app URL can send rows to the sheet, but cannot read it. Keep the repository private if your plan allows Pages on private repos, or leave `config.js` blank and enter the key on each phone. You can rotate the key at any time in Script properties.

### 4. Install on each phone
Open the link in Chrome, wait for it to load fully once (this caches it for offline use), then choose **⋮ → Install app / Add to Home screen**. After that it opens like a normal app, even without signal.

## Publishing updates
1. Change the files.
2. Bump `CACHE` in `sw.js` (for example `kaimea-collector-v1.0.1`) and `APP_VERSION` in `config.js`.
3. Upload. Phones pick up the new version the next time they open the app with signal. Unsent readings are kept.

## Turning it into a Play Store APK later
The app already meets the requirements for a Trusted Web Activity. Use **PWABuilder** (pwabuilder.com) or **Bubblewrap** with your GitHub Pages URL to produce a signed Android package, then upload it to Google Play. No code changes are needed.

## Panduan singkat petambak
1. Buka link dari tim KAIMEA di Chrome, lalu pilih ⋮ → **Instal aplikasi**.
2. Baca dan centang **persetujuan berbagi data**, lalu tekan **Lanjut** (hanya sekali).
3. Setiap pagi dan sore, isi **Nama, Nama tambak, Kode kolam**, lalu nilai yang Anda ukur. Kolom kosong boleh dibiarkan.
4. **Seminggu sekali** (mulai sekitar DOC 30), isi **Berat rata-rata (ABW)**: timbang 50–100 ekor dari anco atau jala, lalu bagi total berat dengan jumlah ekor. Dengan ini KAIMEA bisa memperkirakan berat panen kolam Anda.
5. Label **baik / waspada / bahaya** muncul di samping setiap nilai. Setelah **Simpan**, kotak "Hasil cek air terakhir" merangkum hasilnya.
6. Data terkirim otomatis saat ada sinyal. Jika ada **bahaya** atau udang mati bertambah, hubungi tim KAIMEA.

## Panduan singkat petugas lapangan
1. Buka aplikasi KAIMEA di layar utama HP.
2. Isi **Nama petugas, Nama tambak, Kode kolam, Waktu sampling** (wajib). Tekan **Ambil lokasi GPS** jika di kolam.
3. Isi nilai yang diukur. Kolom kosong boleh dibiarkan. Tanda kuning berarti nilai tidak biasa, jadi periksa lagi.
4. Tekan **Simpan**. Data tersimpan di HP walaupun tidak ada sinyal.
5. Di tab **Data**, status *Menunggu* berarti belum terkirim, dan *Terkirim* berarti sudah masuk Google Sheet. Saat ada sinyal, data terkirim otomatis atau tekan **Kirim sekarang**.
6. Jangan hapus data browser atau aplikasi Chrome sebelum semua data berstatus *Terkirim*. Untuk cadangan, tekan **Unduh cadangan CSV**.
