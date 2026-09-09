# Contact form setup

## Current: Vercel API + Turnstile + Google Apps Script

`/contact` posts JSON via **client-side `fetch`** to the same-origin Vercel serverless route **`/api/contact`** (`api/contact.js`). That route:

1. Requires `TURNSTILE_SECRET_KEY` (see below)
2. Verifies the Cloudflare Turnstile token
3. Quietly accepts honeypot spam (`_honey` filled → `{ success: true }`)
4. Forwards the lead to the Apps Script web app as `Content-Type: text/plain;charset=utf-8` + `JSON.stringify(payload)` (GAS-friendly)

**Client target:** `/api/contact` (not the Apps Script URL). Stay-on-page UX: **Message received.** / guide copy / `?sent=1` / `?intent=guide`.

### Cloudflare Turnstile (live in code)

- **In-form widget:** script `https://challenges.cloudflare.com/turnstile/v0/api.js` + `<div class="cf-turnstile" data-sitekey="…">`
- **Site key (public — safe in client / docs):** `0x4AAAAAAEt2HmKQ3KeAiFMb`
- **Secret:** set on Vercel only — never commit

**Brian must set Vercel env `TURNSTILE_SECRET_KEY`** (Production **and** Preview) to the secret from the Cloudflare Turnstile widget, then **redeploy**. Without it, `/api/contact` returns `500 { success: false, message: "Server misconfigured" }`.

Local / docs stub: see `.env.example` (`TURNSTILE_SECRET_KEY=`). Code reads `process.env.TURNSTILE_SECRET_KEY` at runtime on Vercel — do not hardcode the secret.

### Apps Script forward URL

`https://script.google.com/macros/s/AKfycbYF4Cf_SVqf2PsD7EtsjuccxpfV_dtoaMX2Pq1V0vozXZS6wNF0g8FSxsnbjQGHpsga/exec`

Payload fields forwarded: `name`, `email`, `interest`, `interest_label`, `message`, `intent`, `page`, `user_agent`, `_subject`, `_honey`.

- **Sheet:** https://docs.google.com/spreadsheets/d/10KdSwXTahYxNlomDD-f_0lHCaapRMucNiioFCD8dXqg/edit
- **TO:** `support@beerspodcast.com`
- **CC:** `brian@beerspodcast.com` (handled by the script)
- Honeypot: empty `_honey` field (spam submissions are ignored with a quiet success)
- Success UI: on-page after AJAX success (also supports `?sent=1` deep links / guide `?intent=guide`)

### Formsubmit (retired)

Formsubmit.co is no longer used (no leave-site captcha, no `formsubmit.co` URL, no `_next` / `_cc` / `_template` / `_captcha` fields).

### Direct Apps Script from the browser (retired as default)

The contact page no longer uses the Apps Script `/exec` URL as the client default. Verification and forwarding go through `/api/contact`.

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
5. Confirm `/exec` URL matches the forward URL in `api/contact.js`
