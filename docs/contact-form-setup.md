# Contact + Intro form setup

## Current: Vercel API + Turnstile + Google Apps Script

`/contact` and `/intro` post JSON via **client-side `fetch`** to the same-origin Vercel serverless route **`/api/contact`** (`api/contact.js`). That route:

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

**Contact payload fields:** `name`, `email`, `interest`, `interest_label`, `message`, `intent`, `page`, `user_agent`, `_subject`, `_honey`.

**Intro payload fields:** `form: "intro"` (or `intent: "intro"`), `name`, `email`, `phone`, `zip`, `franchisor`, `message`, `page`, `user_agent`, `_subject`, `_honey`.

- **Sheet:** https://docs.google.com/spreadsheets/d/10KdSwXTahYxNlomDD-f_0lHCaapRMucNiioFCD8dXqg/edit
- **TO:** `support@beerspodcast.com`
- **CC:** `brian@beerspodcast.com` (handled by the script)
- Honeypot: empty `_honey` field (spam submissions are ignored with a quiet success)
- Success UI: on-page after AJAX success (also supports `?sent=1` deep links / guide `?intent=guide`)

### Formsubmit (retired)

Formsubmit.co is no longer used (no leave-site captcha, no `formsubmit.co` URL, no `_next` / `_cc` / `_template` / `_captcha` fields).

### Direct Apps Script from the browser (retired as default)

The contact and intro pages no longer use the Apps Script `/exec` URL as the client default. Verification and forwarding go through `/api/contact`.

## Sheet tabs

### Leads (contact — unchanged)

Expected header order:

`Timestamp`, `Name`, `Email`, `Interest`, `Message`, `Intent`, `Page URL`, `User Agent`

### Intro (franchisor intro — **Brian must create this tab**)

1. Open the sheet above
2. Add a new tab named exactly **`Intro`**
3. Put these headers in row 1 (same order):

`Timestamp`, `Name`, `Email`, `Phone`, `Zip`, `Franchisor`, `Message`, `Page URL`, `User Agent`

Intro email subject: `[brianbeers.com] Intro — {franchisor}`. Contact / Leads behavior is unchanged when `form` / `intent` is not `intro`.

## Apps Script source

Reference copy of what’s deployed: [`scripts/contact-form-apps-script.js`](../scripts/contact-form-apps-script.js)

Behavior:

1. Accept JSON (`text/plain` or `application/json`) or form-urlencoded `doPost`
2. Ignore honeypot (`_honey` / `website`) with a quiet success
3. If `form === "intro"` or `intent === "intro"` → append on **Intro** tab + intro email; otherwise append on **Leads** (contact)
4. `MailApp.sendEmail` to `support@beerspodcast.com`, CC `brian@beerspodcast.com`, `replyTo` = submitter

### Redeploy steps (manual — required after Intro support lands)

1. Create the **Intro** tab with the headers above (same spreadsheet)
2. Open the sheet → **Extensions → Apps Script**
3. Paste the contents of `scripts/contact-form-apps-script.js`
4. Adjust `SHEET_NAME` / `INTRO_SHEET_NAME` only if your tab names differ
5. **Deploy → Manage deployments → Edit → New version** (or New deployment → Web app)
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Confirm `/exec` URL matches the forward URL in `api/contact.js` (if the URL changes, update `api/contact.js` and redeploy the site)

Until the Intro tab exists and the script is redeployed, intro submissions may fail at Apps Script even if Turnstile + `/api/contact` succeed.
