# 🎭 Face Recognition - Quick Start

## ⚡ 5-Minute Setup

### 1️⃣ Install Python Dependencies
```bash
cd python
pip install -r requirements.txt
```

### 2️⃣ Configure Cloudinary
Create `python/.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5001
```

Also add to `backend/.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FACE_SERVICE_URL=http://localhost:5001
```

### 3️⃣ Start Services
```bash
# Terminal 1 - Python Service
cd python
python faceRecognition.py

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Frontend  
cd frontend
npm run dev
```

**Or use batch file:**
```bash
start-face-service.bat
```

---

## 🎯 Quick Test

### Verify Setup
```bash
cd backend
node scripts/verifyFaceRecognition.js
```

### Test Python Service
```bash
curl http://localhost:5001/test
```

Expected response:
```json
{
  "status": "ok",
  "message": "Face Recognition API is running"
}
```

---

## 📸 Usage

### Enroll Face
1. Login as employee
2. Go to **Profile → Security**
3. Click **"Enable Facial Recognition"**
4. Allow camera access
5. Capture photo (good lighting, face centered)
6. Save

### Check-In with Face
1. Go to **Attendance** page
2. Click **face icon** (🎭)
3. Allow camera access
4. Capture photo
5. Wait for verification (2-3 seconds)
6. Success = Checked in!

---

## 📊 Database

### Check Enrollments
```sql
SELECT e.first_name, e.last_name, f.enrolled_at, f.is_active
FROM face_enrollments f
JOIN employees e ON e.id = f.employee_id
WHERE f.is_active = TRUE;
```

### Check-In Success Rate
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE success = TRUE) as successful,
  ROUND(AVG(confidence_score) * 100, 2) as avg_confidence
FROM face_checkin_logs
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 🐛 Common Issues

### ❌ "Python service not running"
**Solution:**
```bash
cd python
python faceRecognition.py
```

### ❌ "ModuleNotFoundError: No module named 'face_recognition'"
**Solution:**
```bash
pip install face_recognition
# On Windows, if fails:
pip install dlib_bin-19.24.6-cp38-cp38-win_amd64.whl
pip install face_recognition
```

### ❌ "Cloudinary upload failed"
**Solution:**
- Check `.env` files (backend AND python)
- Verify credentials at https://cloudinary.com/console
- Ensure both have same credentials

### ❌ "Face not detected"
**Solution:**
- Improve lighting
- Center face in frame
- Remove glasses/hat
- Ensure only one person in frame

### ❌ "Faces do not match" (but it's the same person)
**Solutions:**
1. Re-enroll with better photo
2. Adjust tolerance in `python/faceRecognition.py`:
   ```python
   tolerance = 0.7  # More lenient (line ~223)
   ```
3. Check confidence score:
   ```sql
   SELECT confidence_score FROM face_checkin_logs 
   ORDER BY created_at DESC LIMIT 5;
   ```

---

## 🔧 Configuration

### Adjust Match Sensitivity

**File:** `python/faceRecognition.py` (line ~223)

```python
# Strict (95%+ confidence)
tolerance = 0.5

# Default (90%+ confidence)  
tolerance = 0.6

# Lenient (85%+ confidence)
tolerance = 0.7
```

### Change Photo Quality

**File:** `backend/controllers/faceController.js`

```javascript
transformation: [
  { width: 400, height: 400, crop: 'fill' },
  { quality: 'auto:best' }  // or 'auto:good', 80, 90, etc.
]
```

---

## 📋 Checklist

Before using face recognition:

- [ ] Python 3.8+ installed
- [ ] Python dependencies installed (`pip install -r requirements.txt`)
- [ ] Cloudinary account created
- [ ] `.env` configured (backend AND python)
- [ ] Database migrations run
- [ ] Python service running on port 5001
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000

---

## 🔐 Security Notes

**⚠️ Important:**
- Face photos contain biometric data
- Use HTTPS in production
- Implement rate limiting on check-in endpoint
- Log failed attempts for security monitoring
- Auto-delete old check-in photos
- Inform employees about data usage

---

## 📈 Performance

**Typical Timings:**
- Enrollment: 1-2 seconds
- Check-in: 2-3 seconds
- Face comparison: 0.5-1 second

**Success Rates:**
- Good conditions: 95%+
- Normal conditions: 85-90%
- Poor conditions: 60-70%

---

## 🎉 You're Ready!

Face recognition is now integrated. Employees can:
1. Enroll their faces in Profile settings
2. Check-in using facial recognition
3. View check-in history in logs

For detailed information, see: **FACE_RECOGNITION_GUIDE.md**
