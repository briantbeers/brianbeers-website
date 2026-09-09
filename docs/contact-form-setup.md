# Contact form setup

## Current: Google Apps Script (live)

`/contact` submits via **client-side `fetch`** (stay on page for **Message received.** UX) to the deployed Apps Script web app:

`https://script.google.com/macros/s/AKfycbYF4Cf_SVqf2PsD7EtsjuccxpfV_dtoaMX2Pq1V0vozXZS6wNF0g8FSxsnbjQGHpsga/exec`

CORS-friendly POST: `Content-Type: text/plain;charset=utf-8` with `JSON.stringify(payload)` so the browser skips preflight. The script reads `e.postData.contents`.

Payload fields: `name`, `email`, `interest`, optional `interest_label`, `message`, `intent`, `page` (current URL), `_honey` (honeypot), optional `_subject`.

- **Sheet:** https://docs.google.com/spreadsheets/d/10KdSwXTahYxNlomDD-f_0lHCaapRMucNiioFCD8dXqg/edit
- **TO:** `support@beerspodcast.com`
- **CC:** `brian@beerspodcast.com` (handled by the script)
- Honeypot: empty `_honey` field (spam submissions are ignored with a quiet success)
- Success UI: on-page after AJAX success (also supports `?sent=1` deep links / guide `?intent=guide`)
- Default endpoint is hardcoded in `src/pages/contact.astro`; override with `PUBLIC_CONTACT_ENDPOINT` (Astro / Vercel env) if needed

### Formsubmit (retired)

Formsubmit.co is no longer used (no leave-site captcha, no `formsubmit.co` URL, no `_next` / `_cc` / `_template` / `_captcha` fields).

### Turnstile (TODO)

Cloudflare Turnstile (in-form captcha) is **not** wired yet — no keys. Add next when keys are available.

## Sheet columns

Expected header order:

`Timestamp`, `Name`, `Email`, `Interest`, `Message`, `Intent`, `Page URL`, `User Agent`

## Apps Script source

Reference copy of what’s deployed: [`scripts/contact-form-apps-script.js`](../scripts/contact-form-apps-script.js)

Behavior:

1. Accept JSON (`text/plain` or `application/json`) or form-urlencoded `doPost`
2. Ignore honeypot (`_honey` / `website`) with a quiet success
3. `appendRow` on the bound sheet (column order above)
4. `MailApp.sendEmail` to `support@beerspodcast.com`, CC `brian@beerspodcast.com`, `replyTo` = submitter

### Redeploy steps (manual — only if changing the script)

1. Open the sheet → **Extensions → Apps Script**
2. Paste the contents of `scripts/contact-form-apps-script.js`
3. Adjust `SHEET_NAME` if the tab is not `Leads`
4. **Deploy → Manage deployments → Edit → New version** (or New deployment → Web app)
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Confirm `/exec` URL matches the site default / `PUBLIC_CONTACT_ENDPOINT`
