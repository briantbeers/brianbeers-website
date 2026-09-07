# Contact form setup

## Current: email via Formsubmit (live)

`/contact` posts via AJAX to:

`https://formsubmit.co/ajax/support@beerspodcast.com`

Fields sent: `name`, `email`, `interest`, `interest_label`, `message`, optional `intent`, `page`, plus Formsubmit controls `_cc`, `_subject`, `_template`, `_captcha`, `_honey`.

- **TO:** `support@beerspodcast.com`
- **CC:** `brian@beerspodcast.com` (`_cc`)
- Honeypot: empty `_honey` field (spam submissions are ignored)
- Soft success/error UI on the page (no `alert()`)

### First-submission activation

Formsubmit requires a one-time confirmation: the **first** real submission to a new recipient triggers an activation email to `support@beerspodcast.com`. Check that inbox (and spam) for the **Activate Form** link and click it before further messages are delivered.

Until activation is confirmed, Formsubmit often returns HTTP 200 with `{ success: "false", message: "…needs Activation…" }`. The contact page surfaces that as a clear form error (not a success state) telling visitors the team must confirm once via email, then retry. After the Activate link is clicked, submissions deliver normally.

Optional override: set `PUBLIC_CONTACT_ENDPOINT` (Astro / Vercel env) to any POST URL. When unset, the site defaults to the Formsubmit AJAX endpoint above. Use this later for the Apps Script `/exec` URL.

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
