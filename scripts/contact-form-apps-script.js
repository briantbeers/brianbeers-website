/**
 * Google Apps Script — Contact form webhook (Sheet + email)
 *
 * Bound to sheet:
 * https://docs.google.com/spreadsheets/d/10KdSwXTahYxNlomDD-f_0lHCaapRMucNiioFCD8dXqg/edit
 *
 * Deploy later as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 * Then set PUBLIC_CONTACT_ENDPOINT to the /exec URL (or paste into Vercel env).
 *
 * Accepts JSON or form-urlencoded POST. Honeypot field: _honey (or website).
 * Appends a row and emails support@beerspodcast.com (cc brian@beerspodcast.com).
 */

var TO_EMAIL = 'support@beerspodcast.com';
var CC_EMAIL = 'brian@beerspodcast.com';
var SHEET_NAME = 'Leads'; // rename if your tab differs; falls back to first sheet

function doPost(e) {
  try {
    var data = parseBody_(e);

    // Honeypot — silently succeed so bots think it worked
    if (String(data._honey || data.website || '').trim()) {
      return json_({ success: true, ignored: true });
    }

    var name = String(data.name || '').trim();
    var email = String(data.email || '').trim();
    var interest = String(data.interest || data.interest_label || '').trim();
    var message = String(data.message || '').trim();
    var intent = String(data.intent || '').trim();
    var page = String(data.page || data._url || '').trim();
    var subject =
      String(data._subject || '').trim() ||
      ('[brianbeers.com] Contact — ' + (interest || 'general'));

    if (!email) {
      return json_({ success: false, message: 'Email is required' }, 400);
    }

    var when = new Date();
    appendLeadRow_([when, name, email, interest, intent, message, page]);

    var body =
      'New contact from brianbeers.com\n\n' +
      'When: ' +
      when.toISOString() +
      '\n' +
      'Name: ' +
      name +
      '\n' +
      'Email: ' +
      email +
      '\n' +
      'Interest: ' +
      interest +
      '\n' +
      'Intent: ' +
      intent +
      '\n' +
      'Page: ' +
      page +
      '\n\n' +
      'Message:\n' +
      message +
      '\n';

    MailApp.sendEmail({
      to: TO_EMAIL,
      cc: CC_EMAIL,
      subject: subject,
      body: body,
      replyTo: email,
    });

    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, message: String(err) }, 500);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    'brianbeers.com contact webhook — POST JSON or form fields'
  ).setMimeType(ContentService.MimeType.TEXT);
}

function parseBody_(e) {
  var out = {};
  if (!e) return out;

  if (e.postData && e.postData.type && String(e.postData.type).indexOf('application/json') !== -1) {
    try {
      out = JSON.parse(e.postData.contents || '{}') || {};
    } catch (ignore) {
      out = {};
    }
  }

  if (e.parameter) {
    Object.keys(e.parameter).forEach(function (k) {
      if (out[k] === undefined) out[k] = e.parameter[k];
    });
  }

  return out;
}

function appendLeadRow_(row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  sheet.appendRow(row);
}

function json_(obj, status) {
  // Apps Script web apps don't set HTTP status easily on all runtimes;
  // clients should check the JSON success flag.
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}
