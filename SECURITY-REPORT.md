# Security Report — RVN Usage Tracker

**Date:** June 7, 2026  
**URL:** https://rvn-usage-tracker.vercel.app  
**Stack:** Flask/Python (Vercel serverless) + Vanilla JS frontend + Vercel Blob  

---

## Summary

Two rounds of security testing were conducted against the live production URL. All identified vulnerabilities have been fixed and deployed. The remaining exposure is limited to passive information disclosure inherent to a public-facing internal tool.

---

## Findings and Status

### Critical — Fixed

#### SSRF / LFI via unvalidated URL in `/api/process`
**What it was:** The `/api/process` endpoint accepted a `url` parameter and passed it directly to `urllib.request.urlopen()` with no validation. This allowed:
- Reading local server files via `file:///etc/passwd` (LFI confirmed)
- Fetching internal network resources (SSRF)

**Fix:** Strict allowlist — only HTTPS URLs to `*.public.blob.vercel-storage.com` are accepted. Additional guards block percent-encoded slashes in the hostname (`%2F` bypass) and user-info injection (`user@host` bypass).

```python
ALLOWED_BLOB_SUFFIX = '.public.blob.vercel-storage.com'
parsed = urlparse(blob_url)
hostname = parsed.hostname or ''
if (
    parsed.scheme != 'https'
    or not hostname
    or '%' in hostname
    or '@' in blob_url.split('//')[1].split('/')[0]
    or not hostname.endswith(ALLOWED_BLOB_SUFFIX)
):
    return jsonify({'error': 'Invalid file URL'}), 400
```

---

#### Cross-user data leak via `/api/export`
**What it was:** `/api/export` was a GET endpoint that read from a module-level `_current_data` dict. Because Vercel reuses warm function instances across requests, a second user hitting `/api/export` would receive the previous user's Reuters broadcast data.

**Fix:** `/api/export` is now a stateless POST endpoint. The client sends its own story data in the request body; the server has no persistent state between requests.

---

### High — Fixed

#### Path traversal in blob token endpoint
**What it was:** `/api/blob-upload` issued upload tokens without validating the requested filename. A request with `pathname: "../../etc/passwd"` received a valid token.

An initial fix stripped the path separators and issued a token for the bare filename — still wrong, as it silently issued a token for an arbitrary name. The correct fix rejects outright.

**Fix:** Hard reject on any `/`, `\`, or filenames that don't match `^[\w\-]+\.(csv|xlsx)$`.

```javascript
if (/[/\\]/.test(pathname) || !/^[\w\-]+\.(csv|xlsx)$/i.test(pathname)) {
    res.status(400).json({ error: 'Invalid file name. Only .csv and .xlsx files are accepted.' });
    return;
}
```

---

#### Missing security headers
**What it was:** No `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, or `Referrer-Policy` headers were set.

**Fix:** Added to `vercel.json` via the `headers` block (requires `rewrites`, not `routes` — Vercel silently ignores `headers` when `routes` is present):

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://blob.vercel-storage.com https://*.public.blob.vercel-storage.com; font-src 'self'; object-src 'none'; frame-ancestors 'none'` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

Note: `style-src 'unsafe-inline'` is required because the frontend sets inline `style=` attributes on dynamically generated HTML elements. All JavaScript is in an external file, so `script-src 'self'` is strict.

---

### Medium — Fixed

#### Blob store abuse (no upload size cap)
**What it was:** The blob token endpoint issued tokens with no `maximumSizeInBytes` constraint. Anyone with the URL could upload a file up to Vercel Blob's per-file maximum (500 MB), repeated with different filenames, inflating storage costs.

**Fix:** `maximumSizeInBytes: 20971520` (20 MB) added to the token config. This is enforced server-side by Vercel Blob — the PUT is rejected before the data lands. 20 MB is generous for any real Teletrax export (a 12-hour Reuters export of ~56k rows is under 10 MB).

---

#### Non-dict JSON body causes 500 on `/api/process` and `/api/export`
**What it was:** Passing a JSON array or scalar as the request body caused Flask to crash with a 500 error, leaking an internal traceback.

**Fix:** Both endpoints now guard with `isinstance(body, dict)` before any field access, returning 400 on malformed input.

---

### Resolved — Authentication added (2026-06-09)

The app now requires Microsoft / Azure AD SSO via MSAL auth code flow. All routes apart from `/auth/*` are protected by a `login_required` decorator; unauthenticated `/api/*` calls return 401 JSON, browser navigation redirects to `/auth/login`. UPN domain is restricted to `thomsonreuters.com`, `reuters.com`, `tr.com`.

Session cookies are `Secure; HttpOnly; SameSite=Lax`. Only the user identity and the MSAL `auth_flow` (minus `auth_uri`) are stored in the cookie — no access token, keeping the payload under the 4KB cookie limit.

#### Information disclosure via HTML/JS source
Passive recon from the public URL reveals:
- Reuters uses Teletrax for broadcast monitoring (from help text in `index.html`)
- The tool runs on Vercel (`server: Vercel` response header, `x-vercel-id`)
- The full API architecture and endpoint names (readable in `app.js`)
- The Vercel Blob store ID `Wu7t55j7ojJBLHfF` (hardcoded as a fallback URL in `app.js`)

None of this constitutes a vulnerability on its own. The Blob store ID is not a credential — all files in the public store are already publicly readable by URL. No API keys, tokens, or internal hostnames are present in any client-facing file.

---

## Current Security Posture

| Area | Status |
|---|---|
| SSRF / LFI | ✅ Blocked — strict HTTPS allowlist on blob URL |
| Path traversal | ✅ Blocked — filename regex at token endpoint |
| Cross-user data leak | ✅ Fixed — stateless export, no server-side state |
| Security headers | ✅ Set — CSP, X-Frame-Options, nosniff, Referrer-Policy |
| HSTS | ✅ Present — Vercel sets `strict-transport-security` by default |
| Upload size cap | ✅ 20 MB enforced at Vercel Blob token level |
| Input validation | ✅ All JSON bodies guarded against non-dict input |
| `BLOB_READ_WRITE_TOKEN` exposure | ✅ Never logged, never returned in any response |
| Authentication | ✅ Azure AD SSO — domain-restricted to Thomson Reuters staff (added 2026-06-09) |
| Rate limiting | ⚠️ None — Vercel plan limits apply but no per-IP throttling |

---

## Files Modified

| File | Change |
|---|---|
| `backend/app.py` | URL allowlist for SSRF; `isinstance` guards; stateless POST export |
| `api/blob-upload.js` | Filename validation; `maximumSizeInBytes` cap |
| `vercel.json` | Security headers; `routes` → `rewrites` to unblock header delivery |
| `frontend/app.js` | Export button changed from GET to POST with client-supplied data |
