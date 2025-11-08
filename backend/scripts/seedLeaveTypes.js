import { pool } from '../db.js';

async function seedLeaveTypes() {
  try {
    console.log('🌱 Seeding leave types...');

    // Clear existing data in reverse order of dependencies
    await pool.query('DELETE FROM leave_requests');
    console.log('   Cleared existing leave requests');
    
    await pool.query('DELETE FROM leave_allocations');
    console.log('   Cleared existing leave allocations');
    
    await pool.query('DELETE FROM leave_types');
    console.log('   Cleared existing leave types');

    // Insert the 3 leave types
    const leaveTypes = [
      { name: 'Sick Leave', is_paid: true },
      { name: 'Casual Leave', is_paid: true },
      { name: 'Unpaid Leave', is_paid: false }
    ];

    for (const type of leaveTypes) {
      const { rows } = await pool.query(
        'INSERT INTO leave_types (name, is_paid) VALUES ($1, $2) RETURNING *',
        [type.name, type.is_paid]
      );
      console.log(`   ✅ Created: ${rows[0].name} (${rows[0].is_paid ? 'Paid' : 'Unpaid'})`);
    }

    console.log('✅ Leave types seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding leave types:', error);
    process.exit(1);
  }
}

seedLeaveTypes();
