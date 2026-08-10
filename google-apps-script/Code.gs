/**
 * Wedding RSVP → Google Sheet
 *
 * Spreadsheet ID: 15aaEF6TaqceACBlZZJigG_RjZpHSL-zU8CORFGEi_f0
 * Sheet name: RSVP
 *
 * Deploy: Extensions → Apps Script → paste this file → Deploy → Web app
 * (See RSVP_SETUP.md in the project root.)
 */

var SPREADSHEET_ID = '15aaEF6TaqceACBlZZJigG_RjZpHSL-zU8CORFGEi_f0';
var SHEET_NAME = 'RSVP';
var HEADERS = [
  'Timestamp',
  'Name',
  'Attendance',
  'Guest Count',
  'Phone',
  'Song Request',
  'Message',
  'Submission ID',
  'Page URL',
  'User Agent',
];

function doGet() {
  return jsonResponse_({
    ok: true,
    service: 'wedding-rsvp',
    sheet: SHEET_NAME,
  });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return jsonResponse_({ success: false, error: 'Server busy. Please try again.' }, 429);
  }

  try {
    var payload = parsePayload_(e);
    var validated = validatePayload_(payload);

    var sheet = getOrCreateSheet_();
    ensureHeaders_(sheet);

    if (validated.submissionId && isDuplicate_(sheet, validated.submissionId)) {
      return jsonResponse_({
        success: true,
        duplicate: true,
        submissionId: validated.submissionId,
        message: 'Already recorded',
      });
    }

    sheet.appendRow([
      validated.timestamp,
      validated.name,
      validated.attendance,
      validated.guestCount,
      validated.phone,
      validated.song,
      validated.message,
      validated.submissionId,
      validated.pageUrl,
      validated.userAgent,
    ]);

    var row = sheet.getLastRow();
    return jsonResponse_({
      success: true,
      submissionId: validated.submissionId,
      row: row,
    });
  } catch (err) {
    return jsonResponse_({
      success: false,
      error: String(err && err.message ? err.message : err),
    }, 400);
  } finally {
    lock.releaseLock();
  }
}

function parsePayload_(e) {
  var params = (e && e.parameter) || {};
  var postData = e && e.postData && e.postData.contents;

  if (postData) {
    var type = (e.postData.type || '').toLowerCase();
    if (type.indexOf('application/json') !== -1) {
      try {
        var parsed = JSON.parse(postData);
        return merge_(params, parsed);
      } catch (err) {
        // fall through to form params
      }
    }
  }

  return params;
}

function merge_(a, b) {
  var out = {};
  var k;
  for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) out[k] = a[k];
  for (k in b) if (Object.prototype.hasOwnProperty.call(b, k)) out[k] = b[k];
  return out;
}

function validatePayload_(raw) {
  var name = sanitize_(raw.name || raw.Name, 120);
  if (!name) throw new Error('Name is required.');

  var attendance = sanitize_(raw.attendance || raw.Attendance, 40).toLowerCase();
  if (attendance !== 'yes' && attendance !== 'no') {
    attendance = attendance.indexOf('no') !== -1 ? 'no' : 'yes';
  }

  var guestRaw = raw.guestCount != null ? raw.guestCount : raw.guests;
  var guestCount = parseInt(String(guestRaw == null ? '1' : guestRaw), 10);
  if (isNaN(guestCount) || guestCount < 1) guestCount = 1;
  if (guestCount > 20) guestCount = 20;

  return {
    timestamp: sanitize_(raw.timestamp, 80) || new Date().toISOString(),
    name: name,
    attendance: attendance,
    guestCount: guestCount,
    phone: sanitize_(raw.phone || raw.Phone, 60),
    song: sanitize_(raw.song || raw.songRequest || raw['Song Request'], 200),
    message: sanitize_(raw.message || raw.Message, 1000),
    submissionId: sanitize_(raw.submissionId || raw.submission_id, 80),
    pageUrl: sanitize_(raw.pageUrl || raw.page_url || raw.url, 500),
    userAgent: sanitize_(raw.userAgent || raw.user_agent, 400),
  };
}

function sanitize_(value, maxLen) {
  var s = String(value == null ? '' : value).replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (s.length > maxLen) s = s.substring(0, maxLen);
  return s;
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    return;
  }
  var first = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (!first[0] || String(first[0]).toLowerCase().indexOf('timestamp') === -1) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
}

function isDuplicate_(sheet, submissionId) {
  if (!submissionId) return false;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var idCol = 8; // Submission ID
  var values = sheet.getRange(2, idCol, lastRow, idCol).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === submissionId) return true;
  }
  return false;
}

function jsonResponse_(obj, status) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  // Note: Apps Script web apps do not support setting arbitrary HTTP status
  // codes via ContentService; the body carries success/error instead.
  return output;
}
