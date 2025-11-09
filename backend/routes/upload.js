import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure avatars directory exists
const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
  console.log('✅ Created avatars directory');
}

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'));
    }
  }
});

/**
 * POST /upload/avatar
 * Upload user avatar
 */
router.post('/avatar', authRequired, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const avatarUrl = `/avatars/${req.file.filename}`;

    // Get old avatar to delete it
    const oldAvatarQuery = await pool.query(
      'SELECT avatar_url FROM employees WHERE id = $1',
      [userId]
    );

    // Update employee avatar_url in database
    const result = await pool.query(
      'UPDATE employees SET avatar_url = $1 WHERE id = $2 RETURNING id, avatar_url, first_name, last_name',
      [avatarUrl, userId]
    );

    if (result.rows.length === 0) {
      // Clean up uploaded file if employee not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete old avatar file if it exists and is not a URL
    if (oldAvatarQuery.rows[0]?.avatar_url && !oldAvatarQuery.rows[0].avatar_url.startsWith('http')) {
      const oldFilePath = path.join(__dirname, '..', 'public', oldAvatarQuery.rows[0].avatar_url);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log('🗑️ Deleted old avatar:', oldFilePath);
        } catch (e) {
          console.error('Failed to delete old avatar:', e);
        }
      }
    }

    console.log(`✅ Avatar uploaded for employee ${userId}: ${avatarUrl}`);

    res.json({
      success: true,
      avatar_url: avatarUrl,
      message: 'Avatar uploaded successfully',
      employee: result.rows[0]
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to clean up file:', e);
      }
    }

    console.error('Avatar upload error:', error);
    
    if (error.message.includes('Only image files')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to upload avatar',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * DELETE /upload/avatar
 * Remove user avatar
 */
router.delete('/avatar', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current avatar to delete the file
    const currentAvatarQuery = await pool.query(
      'SELECT avatar_url FROM employees WHERE id = $1',
      [userId]
    );

    // Remove avatar_url from database
    const result = await pool.query(
      'UPDATE employees SET avatar_url = NULL WHERE id = $1 RETURNING id, first_name, last_name',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete avatar file if it exists and is not a URL
    if (currentAvatarQuery.rows[0]?.avatar_url && !currentAvatarQuery.rows[0].avatar_url.startsWith('http')) {
      const filePath = path.join(__dirname, '..', 'public', currentAvatarQuery.rows[0].avatar_url);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('🗑️ Deleted avatar file:', filePath);
        } catch (e) {
          console.error('Failed to delete avatar file:', e);
        }
      }
    }

    console.log(`✅ Avatar removed for employee ${userId}`);

    res.json({
      success: true,
      message: 'Avatar removed successfully',
      employee: result.rows[0]
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete avatar',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
