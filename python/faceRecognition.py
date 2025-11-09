from flask import Flask, request, jsonify
import face_recognition
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from flask_cors import CORS
from datetime import datetime
import os, glob
import requests
import cloudinary
import cloudinary.api
import cloudinary.search
from dotenv import load_dotenv
from functools import wraps
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
# Allow both development and production origins
allowed_origins = ['http://localhost:3000', 'http://localhost:5000']
CORS(app, resources={r"/*": {"origins": allowed_origins}}, supports_credentials=True)

# Add request logging
@app.before_request
def log_request_info():
    logger.debug('Request Headers: %s', dict(request.headers))
    logger.debug('Request URL: %s %s', request.method, request.url)
    logger.debug('Request Origin: %s', request.headers.get('Origin'))
    logger.debug('Request Host: %s', request.headers.get('Host'))

@app.after_request
def after_request(response):
    logger.debug('Response Status: %s', response.status)
    logger.debug('Response Headers: %s', dict(response.headers))
    return response

# Increase Flask's maximum content length to 10MB
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True,
)
CLOUDINARY_FOLDER = os.getenv('CLOUDINARY_FOLDER', 'members')  # folder containing member images

def load_faces_from_cloudinary():
    global known_face_encodings, known_face_names
    print('Fetching faces from Cloudinary...')
    try:
        search = cloudinary.search.Search()
        search = search.expression(f"folder:{CLOUDINARY_FOLDER}").with_field("context")
        result = search.max_results(500).execute()
        resources = result.get('resources', [])
        for r in resources:
            url = r.get('secure_url') or r.get('url')
            if not url:
                continue
            try:
                resp = requests.get(url)
                img = Image.open(BytesIO(resp.content))
                img_array = np.array(img)
                encodings = face_recognition.face_encodings(img_array)
                if encodings:
                    known_face_encodings.append(encodings[0])
                    # Determine name: prefer context name, else public_id basename
                    name = r.get('context', {}).get('custom', {}).get('name') if r.get('context') else None
                    if not name:
                        name = os.path.basename(r['public_id'])
                    known_face_names.append(name)
                    print(f"Loaded Cloudinary face: {name}")
            except Exception as err:
                print(f"Failed to process Cloudinary resource {r.get('public_id')}: {err}")
    except Exception as e:
        print(f"Error fetching from Cloudinary: {e}")

# Reset and load
known_face_encodings = []
known_face_names = []
load_faces_from_cloudinary()

# Decorator: logs full traceback on any unhandled error and returns JSON 500
def safe_route(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            app.logger.exception(e)  # prints full traceback to console
            return jsonify({'success': False, 'message': str(e)}), 500
    return wrapper

@app.route('/recognize-face', methods=['POST'])
@safe_route
def recognize_face():
    logger.info('Received face recognition request')
    data = request.get_json(silent=True)
    base64_img = data.get('image') if data else None

    # No image payload
    if not base64_img:
        logger.error('No image provided in request')
        return jsonify({'success': False, 'message': 'No image provided'}), 400

    # Decode base64 (support both data URI and raw string)
    try:
        logger.debug('Decoding base64 image')
        payload = base64_img.split(',')[1] if ',' in base64_img else base64_img
        img_bytes = base64.b64decode(payload)
        img = Image.open(BytesIO(img_bytes)).convert('RGB')  # ensure RGB mode
        logger.debug('Successfully decoded image')
    except Exception as err:
        logger.error('Failed to decode image: %s', err)
        return jsonify({'success': False, 'message': 'Invalid image data'}), 415

    img_array = np.array(img)

    # Detect faces
    logger.debug('Detecting faces in image')
    face_encodings = face_recognition.face_encodings(img_array)
    if not face_encodings:
        logger.info('No face detected in image')
        return jsonify({'success': False, 'message': 'No face detected'}), 404

    # Compare with known encodings
    logger.debug('Comparing with %d known faces', len(known_face_encodings))
    face_encoding = face_encodings[0]
    matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.5)
    name = None
    if True in matches:
        name = known_face_names[matches.index(True)]
        logger.info('Face recognized: %s', name)

    if name:
        recognized = {
            'name': name,
            'lastVisit': datetime.utcnow().isoformat()
        }
        return jsonify({'success': True, 'member': recognized})

    logger.info('Face not recognized')
    return jsonify({'success': False, 'message': 'Face not recognized'}), 404

@app.route('/compare-faces', methods=['POST'])
@safe_route
def compare_faces():
    """
    Compare two face images and return match result with confidence.
    Used by the Node.js backend for face check-in validation.
    
    Request body:
    {
        "enrolledPhotoUrl": "https://cloudinary.../enrolled.jpg",
        "checkInPhotoUrl": "https://cloudinary.../checkin.jpg"
    }
    
    Response:
    {
        "success": true,
        "isMatch": true,
        "confidence": 0.85,
        "message": "Face match successful"
    }
    """
    logger.info('Received face comparison request')
    data = request.get_json(silent=True)
    
    if not data:
        logger.error('No data provided in request')
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    enrolled_url = data.get('enrolledPhotoUrl')
    checkin_url = data.get('checkInPhotoUrl')
    
    if not enrolled_url or not checkin_url:
        logger.error('Missing required URLs: enrolled=%s, checkin=%s', bool(enrolled_url), bool(checkin_url))
        return jsonify({'success': False, 'message': 'Both enrolledPhotoUrl and checkInPhotoUrl are required'}), 400
    
    try:
        # Download and process enrolled photo
        logger.debug('Downloading enrolled photo from: %s', enrolled_url)
        try:
            enrolled_resp = requests.get(enrolled_url, timeout=10)
            enrolled_resp.raise_for_status()
        except requests.exceptions.RequestException as e:
            logger.error('Failed to download enrolled photo: %s', str(e))
            return jsonify({
                'success': False,
                'isMatch': False,
                'message': f'Failed to download enrolled photo: {str(e)}'
            }), 500
        
        try:
            enrolled_img = Image.open(BytesIO(enrolled_resp.content)).convert('RGB')
        except Exception as e:
            logger.error('Failed to decode enrolled image: %s', str(e))
            return jsonify({
                'success': False,
                'isMatch': False,
                'message': f'Invalid enrolled image format: {str(e)}'
            }), 500
        
        enrolled_array = np.array(enrolled_img)
        logger.debug('Enrolled image loaded: shape=%s', enrolled_array.shape)
        
        # Download and process check-in photo
        logger.debug('Downloading check-in photo from: %s', checkin_url)
        try:
            checkin_resp = requests.get(checkin_url, timeout=10)
            checkin_resp.raise_for_status()
        except requests.exceptions.RequestException as e:
            logger.error('Failed to download check-in photo: %s', str(e))
            return jsonify({
                'success': False,
                'isMatch': False,
                'message': f'Failed to download check-in photo: {str(e)}'
            }), 500
        
        try:
            checkin_img = Image.open(BytesIO(checkin_resp.content)).convert('RGB')
        except Exception as e:
            logger.error('Failed to decode check-in image: %s', str(e))
            return jsonify({
                'success': False,
                'isMatch': False,
                'message': f'Invalid check-in image format: {str(e)}'
            }), 500
        
        checkin_array = np.array(checkin_img)
        logger.debug('Check-in image loaded: shape=%s', checkin_array.shape)
        
        # Get face encodings
        logger.debug('Encoding enrolled face')
        try:
            enrolled_encodings = face_recognition.face_encodings(enrolled_array)
        except Exception as e:
            logger.error('Failed to encode enrolled face: %s', str(e))
            return jsonify({
                'success': False,
                'isMatch': False,
                'message': f'Failed to process enrolled face: {str(e)}'
            }), 500
        
        if not enrolled_encodings:
            logger.warning('No face detected in enrolled photo')
            return jsonify({
                'success': False,
                'isMatch': False,
                'message': 'No face detected in enrolled photo. Please re-enroll with a clear face photo.'
            }), 200
        
        logger.debug('Encoding check-in face')
        try:
            checkin_encodings = face_recognition.face_encodings(checkin_array)
        except Exception as e:
            logger.error('Failed to encode check-in face: %s', str(e))
            return jsonify({
                'success': False,
                'isMatch': False,
                'message': f'Failed to process check-in face: {str(e)}'
            }), 500
        
        if not checkin_encodings:
            logger.warning('No face detected in check-in photo')
            return jsonify({
                'success': False,
                'isMatch': False,
                'message': 'No face detected in check-in photo. Please ensure your face is clearly visible and well-lit.'
            }), 200
        
        # Compare faces
        enrolled_encoding = enrolled_encodings[0]
        checkin_encoding = checkin_encodings[0]
        
        logger.debug('Comparing face encodings')
        
        # Get face distance (lower is better, 0.6 is default threshold)
        face_distance = face_recognition.face_distance([enrolled_encoding], checkin_encoding)[0]
        
        # Convert distance to confidence (inverse relationship)
        # distance of 0 = 100% confidence, distance of 1 = 0% confidence
        confidence = 1 - face_distance
        
        # Check if faces match (tolerance of 0.6)
        tolerance = 0.6
        is_match = face_distance <= tolerance
        
        logger.info('Face comparison result: match=%s, distance=%.4f, confidence=%.4f', 
                   is_match, face_distance, confidence)
        
        return jsonify({
            'success': True,
            'isMatch': is_match,
            'confidence': round(confidence, 4),
            'faceDistance': round(face_distance, 4),
            'message': 'Face match successful' if is_match else 'Faces do not match'
        })
        
    except Exception as err:
        logger.exception('Unexpected error comparing faces')
        return jsonify({
            'success': False,
            'isMatch': False,
            'message': f'Unexpected error comparing faces: {str(err)}'
        }), 500

@app.route('/refresh-faces', methods=['POST'])
@safe_route
def refresh_faces():
    try:
        global known_face_encodings, known_face_names
        known_face_encodings = []
        known_face_names = []
        load_faces_from_cloudinary()
        return jsonify({'success': True, 'count': len(known_face_names)})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/test', methods=['GET'])
def test():
    logger.info('Test endpoint hit')
    return jsonify({
        'status': 'ok',
        'message': 'Face Recognition API is running',
        'time': datetime.utcnow().isoformat(),
        'allowed_origins': allowed_origins
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))
    logger.info('Starting Face Recognition service on port %d', port)
    app.run(host='0.0.0.0', port=port, debug=True, threaded=True)