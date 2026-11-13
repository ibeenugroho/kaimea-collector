/**
 * KAIMEA Collector — Google Sheets receiver (Google Apps Script).
 *
 * Setup (once):
 *  1. Create a Google Sheet, then Extensions → Apps Script. Paste this whole file into Code.gs.
 *  2. Project Settings (gear icon) → Script properties → add TEAM_KEY = a long secret you choose.
 *  3. Deploy → New deployment → type "Web app"; Execute as: Me; Who has access: Anyone.
 *  4. Copy the Web app URL (ends in /exec) into config.js (SHEET_ENDPOINT) together with the TEAM_KEY.
 * After editing this script later, use Deploy → Manage deployments → Edit → New version, so the URL stays the same.
 */

var SHEET_NAME = "readings";
var ID_COL = 1; // record_id is always column A

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: "bad JSON" });
  }
  var key = PropertiesService.getScriptProperties().getProperty("TEAM_KEY");
  if (!key || body.key !== key) return json_({ ok: false, error: "wrong team key" });

  if (body.action === "ping") return json_({ ok: true, sheet: SpreadsheetApp.getActive().getName() });
  if (body.action !== "append") return json_({ ok: false, error: "unknown action" });

  var records = body.records || [];
  var columns = body.columns || [];
  if (!records.length) return json_({ ok: true, accepted: [] });

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return json_({ ok: false, error: "busy, retry" });
  try {
    var sh = sheet_(columns);
    var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

    // Add any new column the app sends (e.g. after an app update) without breaking old rows.
    var missing = columns.filter(function (c) { return headers.indexOf(c) < 0; });
    if (missing.length) {
      sh.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]).setFontWeight("bold");
      headers = headers.concat(missing);
    }

    // Record IDs already in the sheet, so a resend never creates a duplicate row.
    var existing = {};
    var last = sh.getLastRow();
    if (last > 1) {
      sh.getRange(2, ID_COL, last - 1, 1).getValues().forEach(function (r) { existing[r[0]] = true; });
    }

    var now = new Date();
    var rows = [], accepted = [];
    records.forEach(function (rec) {
      var id = String(rec.record_id || "");
      if (!id) return;
      accepted.push(id); // already present counts as accepted
      if (existing[id]) return;
      existing[id] = true;
      rows.push(headers.map(function (h) {
        if (h === "received_at") return now;
        var v = rec[h];
        if (v === null || v === undefined) return "";
        if (typeof v === "string" && /^[=+\-@]/.test(v) && isNaN(Number(v))) return "'" + v; // block formula injection
        return v;
      }));
    });
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
    return json_({ ok: true, accepted: accepted, added: rows.length });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, service: "KAIMEA Collector receiver" });
}

function sheet_(columns) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    var headers = ["record_id", "received_at"].concat(columns.filter(function (c) { return c !== "record_id"; }));
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
