import { pool } from '../db.js';

async function seedLeaveAllocationsForAll() {
  try {
    console.log('🌱 Allocating leaves to all employees...\n');

    // Get all employees with role 'employee'
    const employeesResult = await pool.query(`
      SELECT e.id, e.first_name, e.last_name, u.role, u.login_id
      FROM employees e
      JOIN users u ON u.id = e.user_id
      WHERE u.role = 'employee'
      ORDER BY e.first_name, e.last_name
    `);

    if (employeesResult.rowCount === 0) {
      console.log('❌ No employees found in the database');
      process.exit(1);
    }

    console.log(`👥 Found ${employeesResult.rowCount} employee(s)\n`);

    // Get all leave types
    const leaveTypesResult = await pool.query('SELECT * FROM leave_types ORDER BY name');
    
    if (leaveTypesResult.rowCount === 0) {
      console.log('❌ No leave types found. Please run seedLeaveTypes.js first.');
      process.exit(1);
    }

    // Allocations configuration
    const allocations = [
      { type: 'Sick Leave', days: 12 },       // 12 sick days per year
      { type: 'Casual Leave', days: 15 },     // 15 casual days per year
      { type: 'Unpaid Leave', days: 30 }      // 30 unpaid days available
    ];

    const validFrom = new Date(new Date().getFullYear(), 0, 1); // Jan 1 of current year
    const validTo = new Date(new Date().getFullYear(), 11, 31); // Dec 31 of current year

    let totalAllocated = 0;
    let totalSkipped = 0;

    // Process each employee
    for (const employee of employeesResult.rows) {
      console.log(`\n👤 ${employee.first_name} ${employee.last_name} (${employee.login_id})`);

      for (const allocation of allocations) {
        // Find the leave type
        const leaveType = leaveTypesResult.rows.find(lt => lt.name === allocation.type);
        
        if (!leaveType) {
          console.log(`   ⚠️  Leave type "${allocation.type}" not found, skipping...`);
          continue;
        }

        // Check if allocation already exists
        const existingAlloc = await pool.query(
          'SELECT * FROM leave_allocations WHERE employee_id = $1 AND leave_type_id = $2',
          [employee.id, leaveType.id]
        );

        if (existingAlloc.rowCount > 0) {
          console.log(`   ⏭️  ${allocation.type}: Already allocated (${existingAlloc.rows[0].allocated_days} days)`);
          totalSkipped++;
          continue;
        }

        // Create allocation
        await pool.query(`
          INSERT INTO leave_allocations 
          (employee_id, leave_type_id, allocated_days, used_days, valid_from, valid_to, notes)
          VALUES ($1, $2, $3, 0, $4, $5, $6)
        `, [
          employee.id,
          leaveType.id,
          allocation.days,
          validFrom,
          validTo,
          `Auto-allocated for ${new Date().getFullYear()}`
        ]);

        console.log(`   ✅ ${allocation.type}: Allocated ${allocation.days} days`);
        totalAllocated++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Leave allocations completed successfully!');
    console.log(`📊 Total: ${totalAllocated} allocations created, ${totalSkipped} skipped (already existed)`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error allocating leaves:', error);
    process.exit(1);
  }
}

seedLeaveAllocationsForAll();
