# RSVP via Google Forms (recommended)

Easiest working setup: guests fill a Google Form. Responses land in a Google Sheet automatically. No Apps Script deploy needed.

## 1. Create the form

1. Open [Google Forms](https://forms.google.com) → **Blank form**
2. Title it e.g. **Maryam & Ahmed RSVP**
3. Add questions that match the invite (suggested):

| Question | Type |
|----------|------|
| Your Name | Short answer (Required) |
| Will you attend? | Multiple choice: Joyfully yes / Regretfully no |
| Number of guests | Multiple choice: 1 / 2 / 3 / 4 |
| Phone number | Short answer |
| Song request | Short answer |
| A message for us | Paragraph |

4. Click **Responses** → link / create a Sheet if you want a spreadsheet of replies (optional but useful).

5. Click **Send** → **Link** icon → copy the form link  
   Example: `https://docs.google.com/forms/d/e/XXXX/viewform?usp=sf_link`

6. Turn it into an **embed** URL by ensuring it ends with `viewform?embedded=true`:

```text
https://docs.google.com/forms/d/e/XXXX/viewform?embedded=true
```

(Replace `XXXX` with your real form id. If the link has `?usp=sf_link`, replace that query with `?embedded=true`.)

## 2. Add the URL to the website

### Local

Create a `.env` file in the project root:

```env
VITE_GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/XXXX/viewform?embedded=true
```

Restart `npm run dev`.

### Cloudflare Pages

1. Pages project → **Settings** → **Environment variables**
2. Add **Production** (and Preview if you want):
   - Name: `VITE_GOOGLE_FORM_URL`
   - Value: your embed URL
3. **Redeploy** the site (Vite bakes env vars in at build time)

## 3. Test

1. Open the invite → RSVP → **Open the Doors**
2. Fill the embedded form → Submit
3. Confirm the response appears under the form’s **Responses** (and Sheet, if linked)

## Notes

- The site keeps the door animation; the form itself is Google’s embed inside your design.
- Guests can also use **Open form in a new tab** if the iframe is awkward on their phone.
- Without `VITE_GOOGLE_FORM_URL`, the RSVP section shows a clear “not configured” message instead of a broken form.

---

## Optional: Apps Script (advanced)

The repo still includes `google-apps-script/Code.gs` if you later want a fully custom HTML form posting to your Sheet. Google Forms is simpler for most wedding invites.
