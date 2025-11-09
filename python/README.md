# Face Recognition Service

Python Flask service for facial recognition using the `face_recognition` library.

## 🚀 Quick Start

### 1. Install Dependencies

**Windows:**
```bash
pip install dlib_bin-19.24.6-cp38-cp38-win_amd64.whl
pip install -r requirements.txt
```

**Linux/Mac:**
```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=members
PORT=5001
```

Get credentials from: https://cloudinary.com/console

### 3. Run Service

```bash
python faceRecognition.py
```

Service will start on: `http://localhost:5001`

## 📡 API Endpoints

### GET `/test`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "message": "Face Recognition API is running",
  "time": "2025-11-09T10:30:00.000Z"
}
```

### POST `/compare-faces`
Compare two face images

**Request Body:**
```json
{
  "enrolledPhotoUrl": "https://res.cloudinary.com/...",
  "checkInPhotoUrl": "https://res.cloudinary.com/..."
}
```

**Response:**
```json
{
  "success": true,
  "isMatch": true,
  "confidence": 92.5,
  "faceDistance": 0.075,
  "message": "Faces match with 92.5% confidence"
}
```

## 🔧 Configuration

### Adjust Match Tolerance

**File:** `faceRecognition.py` (line ~223)

```python
tolerance = 0.6  # Default: 60% threshold

# More strict (fewer false positives):
tolerance = 0.5

# More lenient (fewer false negatives):
tolerance = 0.7
```

### Change Port

In `.env`:
```env
PORT=5001  # Change to any available port
```

## 🐛 Troubleshooting

### dlib Installation Failed (Windows)

Use pre-compiled wheel:
```bash
pip install dlib_bin-19.24.6-cp38-cp38-win_amd64.whl
```

### face_recognition Installation Failed

Install dependencies first:
```bash
pip install cmake
pip install dlib
pip install face_recognition
```

### Service Won't Start

Check if port 5001 is already in use:
```bash
# Windows
netstat -ano | findstr :5001

# Linux/Mac
lsof -i :5001
```

## 📦 Dependencies

- **Flask** - Web framework
- **Flask-Cors** - Cross-origin requests
- **face_recognition** - Face detection and comparison
- **dlib** - Machine learning algorithms
- **Pillow** - Image processing
- **numpy** - Numerical operations
- **cloudinary** - Image storage
- **requests** - HTTP client

## 🔐 Security

**Production Recommendations:**
1. Enable HTTPS
2. Add API key authentication
3. Rate limit requests
4. Use environment variables for all secrets
5. Enable CORS only for trusted origins

## 📝 Notes

- Requires Python 3.8+
- Recommended: Use virtual environment
- Face images should be at least 200x200px
- Best results with well-lit, frontal face photos
- Processing time: ~0.5-1 second per comparison

## 📞 Support

For integration with Node.js backend, see: `../FACE_RECOGNITION_GUIDE.md`
