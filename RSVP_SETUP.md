# RSVP → Google Sheet setup

This site sends RSVPs to your Google Sheet through a Google Apps Script web app. A normal Sheet edit URL cannot be written to securely from the browser.

**Target spreadsheet ID:** `15aaEF6TaqceACBlZZJigG_RjZpHSL-zU8CORFGEi_f0`  
**Worksheet name:** `RSVP`  
**Script source in this repo:** `google-apps-script/Code.gs`

## Steps

1. Open the Google Sheet:  
   https://docs.google.com/spreadsheets/d/15aaEF6TaqceACBlZZJigG_RjZpHSL-zU8CORFGEi_f0/edit

2. In the Sheet menu choose **Extensions → Apps Script**.

3. Delete any placeholder code in `Code.gs`, then paste the full contents of `google-apps-script/Code.gs` from this project.

4. Click **Save** (disk icon) and name the project if prompted (e.g. `Wedding RSVP`).

5. Click **Deploy → New deployment**.

6. Click the gear / type selector and choose **Web app**.

7. Configure:
   - **Description:** `RSVP endpoint` (optional)
   - **Execute as:** Me (your Google account)
   - **Who has access:** Anyone (or “Anyone with the link”, depending on the Google UI)

8. Click **Deploy**. Authorize the script when Google asks (Review permissions → choose your account → Advanced → Go to … → Allow).

9. Copy the **Web app URL** that ends in `/exec`  
   Example shape: `https://script.google.com/macros/s/XXXXXXXX/exec`

10. In the project root, create a `.env` file (or edit yours) with:

```env
VITE_RSVP_ENDPOINT=https://script.google.com/macros/s/XXXXXXXX/exec
```

11. Restart the Vite dev server (or rebuild for production) so the env var is picked up.

12. Open the invitation site, submit a test RSVP, and confirm a new row appears on the **RSVP** sheet with headers:

| Timestamp | Name | Attendance | Guest Count | Phone | Song Request | Message | Submission ID | Page URL | User Agent |

## Notes

- If you change the script later, use **Deploy → Manage deployments → Edit → New version** so the same `/exec` URL keeps working.
- The frontend only shows the flower success state after a JSON body with `"success": true`.
- Without `VITE_RSVP_ENDPOINT`, the form shows a clear configuration error instead of a fake success.
- Health check: open the `/exec` URL in a browser; you should see JSON like `{"ok":true,"service":"wedding-rsvp",...}`.
