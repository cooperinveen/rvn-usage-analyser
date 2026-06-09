import os
import secrets
import logging
import traceback
import urllib.request
from functools import wraps
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, Response, session, redirect
from backend.parser import parse_file, generate_export

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

FRONTEND_DIR = str(Path(__file__).parent.parent / 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
app.secret_key = os.environ.get('FLASK_SECRET_KEY', secrets.token_hex(32))

# Trust Vercel's proxy so session cookies are marked Secure correctly
from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

IS_PRODUCTION = os.environ.get('VERCEL') == '1'
app.config.update(
    SESSION_COOKIE_SECURE=IS_PRODUCTION,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
)

# ── Auth helpers ──────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('user'):
            if request.path.startswith('/api/'):
                return jsonify({'error': 'Not authenticated'}), 401
            return redirect('/auth/login')
        return f(*args, **kwargs)
    return decorated


# ── Static / frontend ─────────────────────────────────────────────────────────

@app.route('/')
@login_required
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


# ── Auth routes ───────────────────────────────────────────────────────────────

@app.route('/auth/login')
def auth_login():
    if session.get('user'):
        logger.info('[auth/login] user already in session, redirecting to /')
        return redirect('/')
    from backend import auth
    try:
        flow = auth.get_auth_flow()
    except Exception as e:
        logger.error(f'[auth/login] get_auth_flow failed: {type(e).__name__}: {e}\n{traceback.format_exc()}')
        return redirect('/auth/login?error=auth_failed&where=login_flow')
    auth_uri = flow.pop('auth_uri')  # strip before storing — auth_uri can push session cookie over 4KB limit
    session['auth_flow'] = flow
    logger.info(f'[auth/login] flow created, session keys after store: {list(session.keys())}')
    return redirect(auth_uri)


@app.route('/auth/callback')
def auth_callback():
    from backend import auth
    logger.info(f'[auth/callback] entry — query keys: {list(request.args.keys())}, session keys: {list(session.keys())}')

    if 'error' in request.args:
        err = request.args.get('error', '')
        err_desc = request.args.get('error_description', '')
        logger.error(f'[auth/callback] microsoft returned error: {err} — {err_desc}')
        return redirect('/auth/login?error=auth_failed&where=ms_error')

    flow = session.pop('auth_flow', None)
    if not flow:
        logger.error('[auth/callback] no auth_flow in session — cookie missing or session reset')
        return redirect('/auth/login?error=session_expired')

    try:
        result = auth.handle_callback(flow, dict(request.args))
    except Exception as e:
        logger.error(f'[auth/callback] handle_callback failed: {type(e).__name__}: {e}\n{traceback.format_exc()}')
        return redirect('/auth/login?error=auth_failed&where=token_exchange')

    try:
        user = auth.get_user_info(result['access_token'])
    except Exception as e:
        logger.error(f'[auth/callback] get_user_info failed: {type(e).__name__}: {e}\n{traceback.format_exc()}')
        return redirect('/auth/login?error=auth_failed&where=graph_me')

    upn = user.get('userPrincipalName', '')
    logger.info(f'[auth/callback] graph returned upn={upn!r} displayName={user.get("displayName", "")!r}')

    if not auth.is_allowed_domain(upn):
        logger.error(f'[auth/callback] domain not allowed: upn={upn!r}')
        return redirect('/auth/login?error=unauthorized_domain')

    session['user'] = {
        'name': user.get('displayName', ''),
        'email': upn,
    }
    logger.info(f'[auth/callback] login success for {upn}')
    return redirect('/')


@app.route('/auth/debug')
def auth_debug():
    """TEMPORARY diagnostic endpoint — remove after SSO is fixed."""
    return jsonify({
        'session_keys': list(session.keys()),
        'has_flow': 'auth_flow' in session,
        'has_user': 'user' in session,
        'env_present': {
            'AZURE_CLIENT_ID': bool(os.environ.get('AZURE_CLIENT_ID')),
            'AZURE_CLIENT_SECRET': bool(os.environ.get('AZURE_CLIENT_SECRET')),
            'AZURE_TENANT_ID': bool(os.environ.get('AZURE_TENANT_ID')),
            'REDIRECT_URI': os.environ.get('REDIRECT_URI', '<unset>'),
            'FLASK_SECRET_KEY': bool(os.environ.get('FLASK_SECRET_KEY')),
            'VERCEL': os.environ.get('VERCEL', '<unset>'),
        },
    })


@app.route('/auth/logout')
def auth_logout():
    session.clear()
    return redirect('/auth/login')


@app.route('/api/me')
@login_required
def api_me():
    return jsonify(session['user'])


# ── Upload / process / export (all require login) ─────────────────────────────

@app.route('/api/upload', methods=['POST'])
@login_required
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'No file selected'}), 400

    filename = f.filename.lower()
    if not (filename.endswith('.csv') or filename.endswith('.xlsx')):
        return jsonify({'error': 'Please upload a .csv or .xlsx file exported from Teletrax'}), 400

    file_bytes = f.read()
    if len(file_bytes) == 0:
        return jsonify({'error': 'The uploaded file is empty'}), 400

    try:
        data = parse_file(file_bytes, f.filename)
    except ValueError as e:
        return jsonify({'error': str(e)}), 422
    except Exception as e:
        return jsonify({'error': f'Could not parse file: {str(e)}'}), 500

    return jsonify({
        'summary': data['summary'],
        'stories': data['stories'],
        'top_channels': data['top_channels'],
        'top_markets': data['top_markets'],
        'date_range': data['date_range'],
    })


@app.route('/api/process', methods=['POST'])
@login_required
def process_blob():
    """Process a file already uploaded to Vercel Blob. Receives the blob URL, fetches, parses, deletes."""
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({'error': 'Invalid request body'}), 400

    blob_url = body.get('url', '').strip()
    filename = body.get('filename', 'upload.xlsx').strip()

    if not blob_url:
        return jsonify({'error': 'No blob URL provided'}), 400

    ALLOWED_BLOB_SUFFIX = '.public.blob.vercel-storage.com'
    try:
        from urllib.parse import urlparse
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
    except Exception:
        return jsonify({'error': 'Invalid file URL'}), 400

    try:
        req = urllib.request.Request(blob_url)
        with urllib.request.urlopen(req, timeout=120) as resp:
            file_bytes = resp.read()
    except Exception as e:
        return jsonify({'error': f'Could not fetch uploaded file: {str(e)}'}), 500

    if len(file_bytes) == 0:
        return jsonify({'error': 'The uploaded file is empty'}), 400

    try:
        data = parse_file(file_bytes, filename)
    except ValueError as e:
        return jsonify({'error': str(e)}), 422
    except Exception as e:
        return jsonify({'error': f'Could not parse file: {str(e)}'}), 500
    finally:
        blob_token = os.environ.get('BLOB_READ_WRITE_TOKEN', '')
        if blob_url and blob_token:
            try:
                del_req = urllib.request.Request(
                    blob_url,
                    method='DELETE',
                    headers={'Authorization': f'Bearer {blob_token}'}
                )
                urllib.request.urlopen(del_req, timeout=10)
            except Exception:
                pass

    return jsonify({
        'summary': data['summary'],
        'stories': data['stories'],
        'top_channels': data['top_channels'],
        'top_markets': data['top_markets'],
        'date_range': data['date_range'],
    })


@app.route('/api/export', methods=['POST'])
@login_required
def export_summary():
    """Generate XLSX from stories supplied by the client — no server-side state."""
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({'error': 'Invalid request body'}), 400

    stories = body.get('stories')
    if not isinstance(stories, list) or len(stories) == 0:
        return jsonify({'error': 'No stories provided'}), 400

    try:
        xlsx_bytes = generate_export(stories)
    except Exception as e:
        return jsonify({'error': f'Could not generate export: {str(e)}'}), 500

    return Response(
        xlsx_bytes,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename="reuters-usage-summary.xlsx"'}
    )


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, port=port)
