/**
 * Google Apps Script — Contact form webhook (Sheet + email)
 *
 * LIVE — bound to sheet:
 * https://docs.google.com/spreadsheets/d/10KdSwXTahYxNlomDD-f_0lHCaapRMucNiioFCD8dXqg/edit
 *
 * Web app /exec (Anyone / Execute as Me):
 * https://script.google.com/macros/s/AKfycbYF4Cf_SVqf2PsD7EtsjuccxpfV_dtoaMX2Pq1V0vozXZS6wNF0g8FSxsnbjQGHpsga/exec
 *
 * This file documents what’s deployed. Do not invent a new deployment from here
 * unless intentionally updating the live script in the Apps Script editor.
 *
 * Accepts JSON (text/plain or application/json) or form-urlencoded POST.
 * Site posts text/plain JSON to skip CORS preflight; parse e.postData.contents.
 * Honeypot field: _honey (or website).
 * Appends a row and emails support@beerspodcast.com (cc brian@beerspodcast.com).
 *
 * Sheet columns:
 * Timestamp | Name | Email | Interest | Message | Intent | Page URL | User Agent
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
    var interest = String(data.interest_label || data.interest || '').trim();
    var message = String(data.message || '').trim();
    var intent = String(data.intent || '').trim();
    var page = String(data.page || data._url || '').trim();
    var userAgent = String(data.user_agent || data.userAgent || '').trim();
    var subject =
      String(data._subject || '').trim() ||
      ('[brianbeers.com] Contact — ' + (interest || 'general'));

    if (!email) {
      return json_({ success: false, message: 'Email is required' }, 400);
    }

    var when = new Date();
    // Timestamp, Name, Email, Interest, Message, Intent, Page URL, User Agent
    appendLeadRow_([when, name, email, interest, message, intent, page, userAgent]);

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

  // Prefer JSON from postData (application/json or text/plain CORS trick)
  if (e.postData && e.postData.contents) {
    var type = String(e.postData.type || '');
    var raw = e.postData.contents;
    if (
      type.indexOf('application/json') !== -1 ||
      type.indexOf('text/plain') !== -1 ||
      (raw && raw.charAt(0) === '{')
    ) {
      try {
        out = JSON.parse(raw || '{}') || {};
      } catch (ignore) {
        out = {};
      }
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
