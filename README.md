# RVN Usage Tracker

A plain-English dashboard for Reuters broadcast monitoring data. Upload a Teletrax export and instantly see which stories aired, where, how many times, and on which channels — without needing to know how to use Teletrax.

**Live:** https://rvn-usage-tracker.vercel.app

---

## What it does

Teletrax monitors global TV broadcasts and detects when Reuters content airs. Their portal is complex enough that only a handful of people in the company can use it. This tool takes a Teletrax export file and turns it into something any producer can read.

Upload a `.csv` or `.xlsx` export → get:

- **Summary bar** — total stories, airings, channels, countries, air time for the period
- **Story table** — one row per story, sortable by airings/channels/countries/longevity/publish date, with search and region/minimum-airings filters. Each row shows an inline trend sparkline of airings per day across the dataset window.
- **Longevity stat** — for each story whose publish date is ≥24h before the dataset's end, the percentage of airings that happened *after* the first 24 hours from publish. Higher = the story had legs and kept being aired; lower = bursty pickup that died. Producers sort by this to find stories worth a follow-up.
- **Story detail modal** — click any row to see a full-size trend chart, six-card stats grid (airings, channels, countries, days in rotation, total air time, longevity), top channel / top country / average clip length, and a paginated channel breakdown.
- **Insights panel** — top 10 stories, channels, and countries at a glance.
- **Export** — download the aggregated summary as a clean Excel file.

Stories are identified by the Reuters producer-style slug: first 4 digits of the story ID prepended to the slug (e.g. `5890-USA-SCREWWORM/`).

Access is restricted to Thomson Reuters staff via Microsoft / Azure AD SSO.

---

## How to export from Teletrax

1. Log in at **teletrax.com**
2. Go to **Detections → New Report** (or open a saved report)
3. Set your date range and any filters
4. Click **Export** → choose **CSV** or **Excel (.xlsx)**
5. Upload the downloaded file at https://rvn-usage-tracker.vercel.app

Files up to ~50 MB are supported. For best performance, keep exports to 24–72 hours.

---

## Running locally

**Requirements:** Python 3.10+, Node.js 18+

```bash
# Clone and set up Python environment
cd rvn-usage-tracker
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the Flask server
python backend/app.py
```

Open http://localhost:5001. Local mode uses the `/api/upload` endpoint directly (no Vercel Blob needed).

---

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Python / Flask |
| Frontend | Vanilla HTML, CSS, JavaScript — no framework, no build step |
| Deployment | Vercel serverless |
| Large file uploads | Vercel Blob (browser → blob storage → Flask fetch) |
| Branding | Reuters design system (Clario font, TR Orange, Racing Green) |

---

## Project structure

```
api/                  Vercel entry points
  blob-upload.js      Node.js handler — generates signed upload tokens
  index.py            Python entry point (imports Flask app)
backend/
  app.py              Flask routes (/auth/*, /api/process, /api/upload, /api/export, /api/me)
  auth.py             MSAL wrapper for Azure AD auth code flow
  parser.py           Teletrax CSV/XLSX ingestion and aggregation
frontend/
  index.html          Single-page app (requires login)
  login.html          Sign-in screen with Microsoft button (rendered on auth errors)
  style.css           Reuters branding + all layout
  app.js              All client logic
docs/                 Teletrax API reference (local only, gitignored)
requirements.txt      Python dependencies (root-level, required by Vercel)
vercel.json           Routing — blob-upload.js → Node, everything else → Python
```

---

## Deployment

The app is deployed on Vercel. To deploy:

```bash
npm install -g vercel   # first time only
vercel --prod
```

### Environment variables (set in Vercel dashboard)

| Variable | Purpose |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store token — never log or print this |
| `AZURE_CLIENT_ID` | Azure AD app registration client ID |
| `AZURE_CLIENT_SECRET` | The secret **Value** (not the secret ID) from Azure → App registration → Certificates & secrets. Pasting the secret ID instead of the value causes `AADSTS7000215` and a silent redirect loop |
| `AZURE_TENANT_ID` | Reuters tenant ID |
| `REDIRECT_URI` | OAuth callback URL, e.g. `https://rvn-usage-tracker.vercel.app/auth/callback` |
| `FLASK_SECRET_KEY` | Static signing key for session cookies (generate with `python -c "import secrets; print(secrets.token_hex(32))"`) |

### Key constraints

- **4.5 MB serverless body limit** — files are uploaded directly to Vercel Blob by the browser, then fetched by Flask. This bypasses the limit entirely.
- **Stateless instances** — each serverless request may hit a different cold instance. All story data is returned in the upload response and stored in the browser; there are no follow-up server calls for story details.
- **60-second function timeout** — set in `vercel.json`. A 6 MB file (~116k rows) parses in roughly 20–30 seconds on Vercel.
