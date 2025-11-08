import { pool } from '../db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running facial recognition migration...');
    
    const migrationSQL = readFileSync(
      join(__dirname, '..', 'migrations', '2025-11-09_facial_recognition.sql'),
      'utf8'
    );
    
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Created tables:');
    console.log('   - face_enrollments');
    console.log('   - face_checkin_logs');
    
    // Verify tables were created
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('face_enrollments', 'face_checkin_logs')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Verification:');
    rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
