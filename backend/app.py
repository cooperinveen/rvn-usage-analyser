import os
import json
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, Response
from backend.parser import parse_file, generate_export

FRONTEND_DIR = str(Path(__file__).parent.parent / 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')

# In-memory store for the current session's parsed data (one dataset at a time)
_current_data = {}


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

    _current_data.clear()
    _current_data.update(data)

    # Return everything except the full detections list (too large for initial load)
    # Detections are fetched per-story via /api/story/<slug>
    stories_light = []
    for s in data['stories']:
        stories_light.append({k: v for k, v in s.items() if k != 'detections'})

    return jsonify({
        'summary': data['summary'],
        'stories': stories_light,
        'top_channels': data['top_channels'],
        'top_markets': data['top_markets'],
        'date_range': data['date_range'],
    })


@app.route('/api/story/<path:slug>', methods=['GET'])
def get_story(slug):
    if not _current_data:
        return jsonify({'error': 'No data loaded. Please upload a file first.'}), 404

    for story in _current_data.get('stories', []):
        if story['slug'] == slug:
            return jsonify(story)

    return jsonify({'error': 'Story not found'}), 404


@app.route('/api/export', methods=['GET'])
def export_summary():
    if not _current_data:
        return jsonify({'error': 'No data loaded'}), 404

    xlsx_bytes = generate_export(_current_data['stories'])
    return Response(
        xlsx_bytes,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename="reuters-usage-summary.xlsx"'}
    )


@app.route('/api/status', methods=['GET'])
def status():
    if _current_data:
        return jsonify({
            'loaded': True,
            'summary': _current_data.get('summary', {}),
            'date_range': _current_data.get('date_range', {}),
        })
    return jsonify({'loaded': False})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, port=port)
