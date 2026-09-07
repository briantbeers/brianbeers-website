# Contact form setup

## Current: email via Formsubmit (live)

`/contact` uses a **normal form POST** (not AJAX) to:

`https://formsubmit.co/support@beerspodcast.com`

Formsubmit’s built-in captcha is enabled (we do **not** send `_captcha: false`). After the visitor completes the captcha on Formsubmit’s intermediate page, Formsubmit redirects back to `_next` (`/contact?sent=1`, and `&intent=guide` when applicable). The contact page then hides the form and shows **Message received.** (or the guide thanks variant).

Fields posted: `name`, `email`, `interest`, `message`, optional `intent`, plus Formsubmit controls `_next`, `_cc`, `_subject`, `_template`, `_honey`.

- **TO:** `support@beerspodcast.com`
- **CC:** `brian@beerspodcast.com` (`_cc`)
- Honeypot: empty `_honey` field (spam submissions are ignored)
- Success UI: driven by `?sent=1` after Formsubmit redirect (no on-page AJAX)
- Activation / captcha / delivery errors surface on Formsubmit’s own pages

### First-submission activation

Formsubmit requires a one-time confirmation: the **first** real submission to a new recipient triggers an activation email to `support@beerspodcast.com`. Check that inbox (and spam) for the **Activate Form** link and click it before further messages are delivered. Until then, Formsubmit shows its activation messaging on its own pages.

Optional override: set `PUBLIC_CONTACT_ENDPOINT` (Astro / Vercel env) to any POST URL. When unset, the site defaults to the Formsubmit URL above (non-AJAX, without `/ajax/`). Use this later for the Apps Script `/exec` URL — captcha rules differ for that backend.

## Sheet (already exists)

Leads spreadsheet:

https://docs.google.com/spreadsheets/d/10KdSwXTahYxNlomDD-f_0lHCaapRMucNiioFCD8dXqg/edit

Sheet logging is **not** wired from the live form yet. Email-only is intentional for now.

## Later: Apps Script (Sheet + email in one place)

Full script body: [`scripts/contact-form-apps-script.js`](../scripts/contact-form-apps-script.js)

Planned behavior:

1. Accept JSON or form-urlencoded `doPost`
2. Ignore honeypot (`_honey` / `website`) with a quiet success
3. `appendRow` on the bound sheet (timestamp, name, email, interest, intent, message, page)
4. `MailApp.sendEmail` to `support@beerspodcast.com`, CC `brian@beerspodcast.com`, `replyTo` = submitter

### Deploy steps (manual — do not invent credentials)

1. Open the sheet → **Extensions → Apps Script**
2. Paste the contents of `scripts/contact-form-apps-script.js`
3. Adjust `SHEET_NAME` if the tab is not `Leads`
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the `/exec` URL
6. Set Vercel env `PUBLIC_CONTACT_ENDPOINT` to that URL (and redeploy), **or** hardcode via the same env locally
7. Optionally keep Formsubmit as fallback by leaving the env unset

After that switch, one endpoint handles Sheet logging and email together; Formsubmit can be retired.
