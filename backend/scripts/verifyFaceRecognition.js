/**
 * Face Recognition Integration Verification Script
 * 
 * This script checks if face recognition is properly configured:
 * - Database tables exist
 * - Environment variables are set
 * - Python service is running
 * - Cloudinary is accessible
 */

const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`)
};

async function verifyFaceRecognition() {
  log.section('Face Recognition Integration Verification');
  
  let allChecks = true;

  // 1. Check Database Connection
  log.section('1. Database Connection');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await pool.query('SELECT NOW()');
    log.success('Database connection successful');
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    allChecks = false;
    return;
  }

  // 2. Check Required Tables
  log.section('2. Database Tables');
  
  const tables = ['face_enrollments', 'face_checkin_logs'];
  for (const table of tables) {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        log.success(`Table '${table}' exists`);
        
        // Get row count
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = countResult.rows[0].count;
        log.info(`  └─ ${count} record(s)`);
      } else {
        log.error(`Table '${table}' does not exist`);
        allChecks = false;
      }
    } catch (error) {
      log.error(`Failed to check table '${table}': ${error.message}`);
      allChecks = false;
    }
  }

  // 3. Check Environment Variables
  log.section('3. Environment Variables');
  
  const requiredEnvVars = [
    { name: 'CLOUDINARY_CLOUD_NAME', desc: 'Cloudinary Cloud Name' },
    { name: 'CLOUDINARY_API_KEY', desc: 'Cloudinary API Key' },
    { name: 'CLOUDINARY_API_SECRET', desc: 'Cloudinary API Secret' },
    { name: 'FACE_SERVICE_URL', desc: 'Python Face Service URL' }
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar.name]) {
      const value = envVar.name.includes('SECRET') || envVar.name.includes('KEY') 
        ? '***' + process.env[envVar.name].slice(-4)
        : process.env[envVar.name];
      log.success(`${envVar.desc}: ${value}`);
    } else {
      log.error(`${envVar.desc} (${envVar.name}) is not set`);
      allChecks = false;
    }
  }

  // 4. Check Python Service
  log.section('4. Python Face Recognition Service');
  
  const faceServiceUrl = process.env.FACE_SERVICE_URL || 'http://localhost:5001';
  
  try {
    const response = await axios.get(`${faceServiceUrl}/test`, {
      timeout: 5000
    });
    
    if (response.data.status === 'ok') {
      log.success('Python service is running');
      log.info(`  └─ URL: ${faceServiceUrl}`);
      log.info(`  └─ Message: ${response.data.message}`);
    } else {
      log.error('Python service responded but status is not ok');
      allChecks = false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log.error('Python service is not running');
      log.warning('  └─ Start it with: cd python && python faceRecognition.py');
    } else if (error.code === 'ETIMEDOUT') {
      log.error('Python service request timed out');
    } else {
      log.error(`Python service check failed: ${error.message}`);
    }
    allChecks = false;
  }

  // 5. Check Cloudinary Configuration
  log.section('5. Cloudinary Configuration');
  
  try {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Try to get account details
    const result = await cloudinary.api.ping();
    log.success('Cloudinary configuration valid');
    log.info(`  └─ Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    log.info(`  └─ Status: ${result.status}`);
  } catch (error) {
    log.error(`Cloudinary configuration invalid: ${error.message}`);
    allChecks = false;
  }

  // 6. Check Face Enrollments
  log.section('6. Face Enrollments Status');
  
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = TRUE) as active,
        COUNT(*) FILTER (WHERE is_active = FALSE) as inactive
      FROM face_enrollments
    `);
    
    const stats = result.rows[0];
    log.info(`Total enrollments: ${stats.total}`);
    log.info(`  ├─ Active: ${stats.active}`);
    log.info(`  └─ Inactive: ${stats.inactive}`);
    
    if (parseInt(stats.total) === 0) {
      log.warning('No face enrollments found. Employees need to enroll their faces.');
    }
  } catch (error) {
    log.error(`Failed to check enrollments: ${error.message}`);
  }

  // 7. Check Face Check-in Logs
  log.section('7. Face Check-in Statistics');
  
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE success = TRUE) as successful,
        COUNT(*) FILTER (WHERE success = FALSE) as failed,
        ROUND(AVG(confidence_score) * 100, 2) as avg_confidence
      FROM face_checkin_logs
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);
    
    const stats = result.rows[0];
    log.info(`Last 30 days:`);
    log.info(`  ├─ Total attempts: ${stats.total}`);
    log.info(`  ├─ Successful: ${stats.successful}`);
    log.info(`  ├─ Failed: ${stats.failed}`);
    
    if (stats.total > 0) {
      const successRate = ((stats.successful / stats.total) * 100).toFixed(2);
      log.info(`  ├─ Success rate: ${successRate}%`);
      log.info(`  └─ Avg confidence: ${stats.avg_confidence || 0}%`);
    }
    
    if (parseInt(stats.total) === 0) {
      log.warning('No face check-in attempts found.');
    }
  } catch (error) {
    log.error(`Failed to check check-in logs: ${error.message}`);
  }

  // 8. Check API Routes
  log.section('8. API Routes Registration');
  
  log.info('The following face recognition routes should be available:');
  log.info('  ├─ POST /api/face/enroll');
  log.info('  ├─ GET  /api/face/enrollment/me');
  log.info('  ├─ POST /api/face/checkin');
  log.info('  └─ DELETE /api/face/enrollment/me');
  log.warning('  └─ Verify these are registered in backend/index.js');

  // Final Summary
  log.section('Verification Summary');
  
  if (allChecks) {
    log.success('All checks passed! Face recognition is properly configured. ✨');
    console.log('\n📝 Next Steps:');
    console.log('  1. Ensure Python service is running: cd python && python faceRecognition.py');
    console.log('  2. Employees can enroll: Profile → Security → Enable Facial Recognition');
    console.log('  3. Check-in with face: Attendance page → Face icon');
  } else {
    log.error('Some checks failed. Please review the errors above.');
    console.log('\n📋 Common Solutions:');
    console.log('  • Run migrations: npm run migrate');
    console.log('  • Set environment variables in .env file');
    console.log('  • Start Python service: cd python && python faceRecognition.py');
    console.log('  • Check Cloudinary credentials at https://cloudinary.com/console');
  }

  await pool.end();
}

// Run verification
verifyFaceRecognition().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
