import { pool } from '../db.js';

/**
 * Fix joining_serial inconsistencies
 * This script will:
 * 1. Find all duplicate joining_serial values for the same year
 * 2. Reassign unique serial numbers
 * 3. Update joining_counters to match the actual max serial
 */
async function fixJoiningSerials() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔍 Checking for duplicate joining serials...');
    
    // Temporarily drop the unique constraint
    console.log('⚠️  Temporarily dropping unique constraint...');
    await client.query('DROP INDEX IF EXISTS uniq_join_year_serial');
    
    // Find all years with employees
    const yearsResult = await client.query(`
      SELECT DISTINCT EXTRACT(YEAR FROM date_of_joining)::int as year 
      FROM employees 
      WHERE date_of_joining IS NOT NULL 
      ORDER BY year
    `);
    
    for (const { year } of yearsResult.rows) {
      console.log(`\n📅 Processing year ${year}...`);
      
      // Get all employees for this year, ordered by id (creation order)
      const employeesResult = await client.query(`
        SELECT id, first_name, last_name, joining_serial, date_of_joining
        FROM employees 
        WHERE EXTRACT(YEAR FROM date_of_joining) = $1
        ORDER BY id ASC
      `, [year]);
      
      console.log(`   Found ${employeesResult.rows.length} employees`);
      
      // Reassign serial numbers sequentially
      let nextSerial = 1;
      
      for (const emp of employeesResult.rows) {
        console.log(`   📝 Assigning serial ${nextSerial} to ${emp.first_name} ${emp.last_name}`);
        
        await client.query(
          'UPDATE employees SET joining_serial = $1 WHERE id = $2',
          [nextSerial, emp.id]
        );
        
        nextSerial++;
      }
      
      // Update the counter for this year
      const maxSerial = nextSerial - 1;
      await client.query(`
        INSERT INTO joining_counters (year, current_serial)
        VALUES ($1, $2)
        ON CONFLICT (year) 
        DO UPDATE SET current_serial = $2, updated_at = NOW()
      `, [year, maxSerial]);
      
      console.log(`   ✅ Updated counter for ${year} to ${maxSerial}`);
    }
    
    // Recreate the unique constraint
    console.log('\n🔧 Recreating unique constraint...');
    await client.query(`
      CREATE UNIQUE INDEX uniq_join_year_serial
      ON employees ((EXTRACT(YEAR FROM date_of_joining)), joining_serial)
    `);
    
    await client.query('COMMIT');
    console.log('\n✅ All joining serials fixed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing joining serials:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixJoiningSerials().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
