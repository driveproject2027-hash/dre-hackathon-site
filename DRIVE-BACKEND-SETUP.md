# Google Drive / Sheets Backend Setup (Free Alternative to Supabase)

Registrations from the homepage are stored in a **Google Sheet** via a **Google Apps Script Web App**. Free, unlimited, and you can watch registrations live in Drive.

## 1. Create the Google Sheet

1. Go to <https://sheets.new> and rename it **"DRE Hackathon Registrations"**
2. In row 1, add these headers (columns A–M):

   ```
   reg_id | team_name | team_lead | lead_email | lead_phone | lead_org | city | state | chosen_ps | ps_title | why_reason | skills | created_at
   ```

## 2. Add the Apps Script

1. In the Sheet: **Extensions → Apps Script**
2. Delete the sample code and paste the contents of **`apps-script-backend.txt`** (in this project)
3. Save (Ctrl/Cmd+S)

## 3. Deploy as a Web App

1. **Deploy → New deployment → ⚙ (Select type) → Web app**
2. Configure:
   - **Execute as:** Me
   - **Who has access:** Anyone
3. Click **Deploy** → sign in / **Allow** the permission prompt (it only touches your own Sheet)
4. Copy the **Web app URL** — it looks like:

   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

## 4. Plug the URL into the site

Paste that URL in **every** file that talks to the backend (keep them in sync):

- `app.js` → top of file → `const BACKEND_URL = "..."` (main site form)
- `registration.html` → `const WEB_APP_URL = "..."` (standalone registration page)
- `admin-dashboard.html` → `const WEB_APP_URL = "..."` (organizer dashboard)
- `admin.html` → in its script block → `const BACKEND_URL = "..."` (older dashboard; optional)

## 5. Test it

1. Register a team on <http://localhost:4242> (or <http://localhost:4242/registration.html>) — the sheet gets a new row
2. Open <http://localhost:4242/admin-dashboard.html> — the team appears (search, state filter, sortable columns, CSV export)
3. Or just open the Google Sheet in Drive and see rows arrive live

## Notes

- **Duplicate guard:** the script rejects a second registration with the same email.
- **CORS-free:** the site POSTs as a plain form (`application/x-www-form-urlencoded`), which avoids Apps Script's CORS quirks.
- **Re-deploy after edits:** if you ever change the Apps Script code, use **Deploy → Manage deployments → Edit → New version** (the URL stays the same).
- `supabase-setup.sql` can be deleted — it was the earlier Supabase option.
