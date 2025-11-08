import { pool } from '../db.js';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

// Configure Cloudinary (add these to your .env file)
// CLOUDINARY_CLOUD_NAME=your_cloud_name
// CLOUDINARY_API_KEY=your_api_key
// CLOUDINARY_API_SECRET=your_api_secret
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Python face recognition service URL
const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL || 'http://localhost:5001';

/**
 * Compare two face images using Python face recognition service
 * @param {string} enrolledPhotoUrl - Cloudinary URL of enrolled face
 * @param {string} checkInPhotoUrl - Cloudinary URL of check-in photo
 * @returns {Promise<{isMatch: boolean, confidence: number}>}
 */
async function compareFaces(enrolledPhotoUrl, checkInPhotoUrl) {
  try {
    console.log('Calling Python face service for comparison...');
    
    const response = await fetch(`${FACE_SERVICE_URL}/compare-faces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enrolledPhotoUrl,
        checkInPhotoUrl
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Face service error');
    }
    
    const result = await response.json();
    console.log('Face comparison result:', result);
    
    return {
      isMatch: result.isMatch,
      confidence: result.confidence,
      message: result.message
    };
  } catch (error) {
    console.error('Face comparison error:', error);
    throw error;
  }
}

async function getEmployeeByUser(userId) {
  const { rows } = await pool.query('SELECT id, company_id FROM employees WHERE user_id=$1 LIMIT 1', [userId]);
  return rows.length ? rows[0] : null;
}

/**
 * @route   POST /face/enroll
 * @desc    Enroll employee face photo for recognition
 * @access  Authenticated (Employee enrolls their own face)
 * @body    { photoDataUrl: string, qualityScore?: number }
 */
export async function enrollFace(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });

    const { photoDataUrl, qualityScore } = req.body;
    
    if (!photoDataUrl) {
      return res.status(400).json({ error: 'Photo data is required' });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(photoDataUrl, {
      folder: `face-enrollment/${emp.company_id}`,
      public_id: `employee_${emp.id}_${Date.now()}`,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:best' }
      ]
    });

    // Deactivate previous enrollments
    await pool.query(
      'UPDATE face_enrollments SET is_active = FALSE WHERE employee_id = $1 AND is_active = TRUE',
      [emp.id]
    );

    // Insert new enrollment
    const { rows } = await pool.query(
      `INSERT INTO face_enrollments 
       (employee_id, face_photo_url, cloudinary_public_id, quality_score, enrolled_by) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [emp.id, uploadResult.secure_url, uploadResult.public_id, qualityScore || null, req.user.id]
    );

    res.status(201).json({
      success: true,
      enrollment: rows[0],
      message: 'Face enrolled successfully'
    });

  } catch (error) {
    console.error('Face enrollment error:', error);
    res.status(500).json({ error: 'Failed to enroll face photo' });
  }
}

/**
 * @route   GET /face/enrollment/me
 * @desc    Get current user's face enrollment status
 * @access  Authenticated
 */
export async function getMyEnrollment(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });

    const { rows } = await pool.query(
      `SELECT id, face_photo_url, quality_score, enrolled_at, is_active 
       FROM face_enrollments 
       WHERE employee_id = $1 AND is_active = TRUE
       ORDER BY enrolled_at DESC
       LIMIT 1`,
      [emp.id]
    );

    if (rows.length === 0) {
      return res.json({ enrolled: false, enrollment: null });
    }

    res.json({ enrolled: true, enrollment: rows[0] });

  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment' });
  }
}

/**
 * @route   POST /face/checkin
 * @desc    Check-in using facial recognition
 * @access  Authenticated
 * @body    { photoDataUrl: string, date?: string }
 */
export async function checkInWithFace(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });

    const { photoDataUrl, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    if (!photoDataUrl) {
      return res.status(400).json({ error: 'Photo data is required' });
    }

    // *** CRITICAL: Verify user has active face enrollment ***
    const enrollmentCheck = await pool.query(
      `SELECT id, face_photo_url FROM face_enrollments 
       WHERE employee_id = $1 AND is_active = TRUE
       LIMIT 1`,
      [emp.id]
    );

    if (enrollmentCheck.rowCount === 0) {
      return res.status(400).json({ 
        error: 'No face enrollment found',
        details: 'Please enroll your face in Profile → Security before using face check-in'
      });
    }

    const enrolledPhotoUrl = enrollmentCheck.rows[0].face_photo_url;

    // Additional safety: Check if photo seems reasonable
    const photoSizeKB = photoDataUrl.length / 1024;
    if (photoSizeKB < 10 || photoSizeKB > 5000) {
      return res.status(400).json({
        error: 'Invalid photo',
        details: 'Photo size must be between 10KB and 5MB'
      });
    }

    // Upload check-in photo to Cloudinary for comparison
    let checkInPhotoUrl;
    try {
      const uploadResult = await cloudinary.uploader.upload(photoDataUrl, {
        folder: `face-checkins/${emp.company_id}/${targetDate}`,
        public_id: `checkin_${emp.id}_${Date.now()}`,
        resource_type: 'image',
        transformation: [{ width: 400, height: 400, crop: 'fill' }]
      });
      checkInPhotoUrl = uploadResult.secure_url;
    } catch (uploadError) {
      console.error('Failed to upload check-in photo:', uploadError);
      return res.status(500).json({
        error: 'Upload failed',
        details: 'Failed to upload check-in photo. Please try again.'
      });
    }

    // *** PERFORM ACTUAL FACE COMPARISON using Python service ***
    let comparisonResult;
    try {
      comparisonResult = await compareFaces(enrolledPhotoUrl, checkInPhotoUrl);
      console.log(`Face match for employee ${emp.id}: ${(comparisonResult.confidence * 100).toFixed(2)}% - Match: ${comparisonResult.isMatch}`);
    } catch (error) {
      console.error('Face comparison failed:', error);
      
      // Log failed attempt
      await pool.query(
        `INSERT INTO face_checkin_logs 
         (employee_id, success, confidence_score, temp_photo_url, error_reason) 
         VALUES ($1, FALSE, $2, $3, $4)`,
        [emp.id, 0, checkInPhotoUrl, `Face comparison service error: ${error.message}`]
      );
      
      return res.status(500).json({
        error: 'Face comparison failed',
        details: 'Unable to verify face. Please try again.'
      });
    }

    // Check if faces match
    if (!comparisonResult.isMatch) {
      // Log failed attempt
      await pool.query(
        `INSERT INTO face_checkin_logs 
         (employee_id, success, confidence_score, temp_photo_url, error_reason) 
         VALUES ($1, FALSE, $2, $3, $4)`,
        [emp.id, comparisonResult.confidence, checkInPhotoUrl, comparisonResult.message]
      );

      return res.status(400).json({ 
        error: 'Face verification failed',
        details: `${comparisonResult.message}. Confidence: ${(comparisonResult.confidence * 100).toFixed(1)}%. Please ensure good lighting and try again.`
      });
    }

    // Validation passed - proceeding with check-in
    console.log(`✅ Face verified for employee ${emp.id} - Confidence: ${(comparisonResult.confidence * 100).toFixed(2)}%`);

    // Check if it's a weekday
    const dateObj = new Date(targetDate);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ error: 'Cannot check in on weekends' });
    }

    // Check for approved leave
    const leaveCheck = await pool.query(
      'SELECT id FROM attendance WHERE employee_id=$1 AND date=$2 AND status=$3',
      [emp.id, targetDate, 'leave']
    );
    if (leaveCheck.rowCount > 0) {
      return res.status(400).json({ error: 'Cannot check in on a day with approved leave' });
    }

    // Check if already checked in
    const existing = await pool.query(
      'SELECT id, check_in, status FROM attendance WHERE employee_id=$1 AND date=$2',
      [emp.id, targetDate]
    );

    let attendanceRecord;
    if (existing.rowCount && existing.rows[0].check_in) {
      // Already checked in
      attendanceRecord = existing.rows[0];
    } else if (existing.rowCount) {
      // Update existing record
      const { rows } = await pool.query(
        "UPDATE attendance SET check_in = NOW(), status = 'present' WHERE id=$1 RETURNING *",
        [existing.rows[0].id]
      );
      attendanceRecord = rows[0];
    } else {
      // Create new record
      const { rows } = await pool.query(
        "INSERT INTO attendance (employee_id, date, check_in, status) VALUES ($1, $2, NOW(), 'present') RETURNING *",
        [emp.id, targetDate]
      );
      attendanceRecord = rows[0];
    }

    // Log successful check-in with ACTUAL face match score
    await pool.query(
      `INSERT INTO face_checkin_logs 
       (employee_id, attendance_id, success, confidence_score, temp_photo_url) 
       VALUES ($1, $2, TRUE, $3, $4)`,
      [emp.id, attendanceRecord.id, comparisonResult.confidence, checkInPhotoUrl]
    );

    res.json({
      success: true,
      attendance: attendanceRecord,
      confidenceScore: comparisonResult.confidence,
      matchPercentage: (comparisonResult.confidence * 100).toFixed(1),
      message: `Checked in successfully! Face match: ${(comparisonResult.confidence * 100).toFixed(1)}%`
    });

  } catch (error) {
    console.error('Face check-in error:', error);
    res.status(500).json({ error: 'Failed to process face check-in' });
  }
}

/**
 * @route   DELETE /face/enrollment/me
 * @desc    Delete current user's face enrollment
 * @access  Authenticated
 */
export async function deleteMyEnrollment(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });

    // Get current enrollment to delete from Cloudinary
    const { rows } = await pool.query(
      'SELECT cloudinary_public_id FROM face_enrollments WHERE employee_id=$1 AND is_active=TRUE',
      [emp.id]
    );

    if (rows.length > 0 && rows[0].cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(rows[0].cloudinary_public_id);
      } catch (cloudError) {
        console.warn('Failed to delete from Cloudinary:', cloudError);
      }
    }

    // Deactivate enrollment
    await pool.query(
      'UPDATE face_enrollments SET is_active = FALSE WHERE employee_id=$1',
      [emp.id]
    );

    res.json({ success: true, message: 'Face enrollment deleted' });

  } catch (error) {
    console.error('Delete enrollment error:', error);
    res.status(500).json({ error: 'Failed to delete enrollment' });
  }
}

/**
 * @route   GET /face/stats/me
 * @desc    Get face check-in statistics for current user
 * @access  Authenticated
 */
export async function getMyFaceStats(req, res) {
  try {
    const emp = await getEmployeeByUser(req.user.id);
    if (!emp) return res.status(404).json({ error: 'Employee profile not found' });

    const { rows } = await pool.query(
      `SELECT 
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE success = TRUE) as successful,
        COUNT(*) FILTER (WHERE success = FALSE) as failed,
        AVG(confidence_score) FILTER (WHERE success = TRUE) as avg_confidence,
        MAX(attempted_at) FILTER (WHERE success = TRUE) as last_success
       FROM face_checkin_logs
       WHERE employee_id = $1
       AND attempted_at >= NOW() - INTERVAL '30 days'`,
      [emp.id]
    );

    res.json({
      stats: {
        totalAttempts: parseInt(rows[0].total_attempts) || 0,
        successful: parseInt(rows[0].successful) || 0,
        failed: parseInt(rows[0].failed) || 0,
        avgConfidence: parseFloat(rows[0].avg_confidence) || 0,
        lastSuccess: rows[0].last_success
      }
    });

  } catch (error) {
    console.error('Get face stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}
