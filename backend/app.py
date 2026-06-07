import os
import urllib.request
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, Response
from backend.parser import parse_file, generate_export

FRONTEND_DIR = str(Path(__file__).parent.parent / 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')


@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/api/upload', methods=['POST'])
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
def process_blob():
    """Process a file already uploaded to Vercel Blob. Receives the blob URL, fetches, parses, deletes."""
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({'error': 'Invalid request body'}), 400

    blob_url = body.get('url', '').strip()
    filename = body.get('filename', 'upload.xlsx').strip()

    if not blob_url:
        return jsonify({'error': 'No blob URL provided'}), 400

    # Only allow HTTPS URLs to the Vercel Blob public store.
    # Blocks: file://, http://, SSRF to internal hosts, encoded-slash bypass (%2F in host),
    # user-info bypass (user@host), IP literals, and subdomain-confusion attacks.
    ALLOWED_BLOB_SUFFIX = '.public.blob.vercel-storage.com'
    try:
        from urllib.parse import urlparse
        parsed = urlparse(blob_url)
        hostname = parsed.hostname or ''
        if (
            parsed.scheme != 'https'
            or not hostname
            or '%' in hostname                               # reject any percent-encoding in host
            or '@' in blob_url.split('//')[1].split('/')[0]  # reject user-info
            or not hostname.endswith(ALLOWED_BLOB_SUFFIX)
        ):
            return jsonify({'error': 'Invalid file URL'}), 400
    except Exception:
        return jsonify({'error': 'Invalid file URL'}), 400

    # Fetch the file from Vercel Blob (public store — no auth header needed)
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
        # Delete the blob — we don't need it anymore
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
                pass  # Cleanup failure is non-fatal

    return jsonify({
        'summary': data['summary'],
        'stories': data['stories'],
        'top_channels': data['top_channels'],
        'top_markets': data['top_markets'],
        'date_range': data['date_range'],
    })


@app.route('/api/export', methods=['POST'])
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
