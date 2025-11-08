import { pool } from '../db.js';

async function seedLeaveAllocations() {
  try {
    console.log('🌱 Allocating leaves to a random employee...');

    // Get a random employee (preferably with role 'employee')
    const employeeResult = await pool.query(`
      SELECT e.id, e.first_name, e.last_name, u.role, u.login_id
      FROM employees e
      JOIN users u ON u.id = e.user_id
      WHERE u.role = 'employee'
      ORDER BY RANDOM()
      LIMIT 1
    `);

    if (employeeResult.rowCount === 0) {
      console.log('❌ No employees found in the database');
      process.exit(1);
    }

    const employee = employeeResult.rows[0];
    console.log(`\n👤 Selected Employee: ${employee.first_name} ${employee.last_name} (${employee.login_id})`);

    // Get all leave types
    const leaveTypesResult = await pool.query('SELECT * FROM leave_types ORDER BY name');
    
    if (leaveTypesResult.rowCount === 0) {
      console.log('❌ No leave types found. Please run seedLeaveTypes.js first.');
      process.exit(1);
    }

    console.log(`\n📋 Found ${leaveTypesResult.rowCount} leave types\n`);

    // Allocate days for each leave type
    const allocations = [
      { type: 'Sick Leave', days: 12 },       // 12 sick days per year
      { type: 'Casual Leave', days: 15 },     // 15 casual days per year
      { type: 'Unpaid Leave', days: 30 }      // 30 unpaid days available
    ];

    const validFrom = new Date(new Date().getFullYear(), 0, 1); // Jan 1 of current year
    const validTo = new Date(new Date().getFullYear(), 11, 31); // Dec 31 of current year

    for (const allocation of allocations) {
      // Find the leave type
      const leaveType = leaveTypesResult.rows.find(lt => lt.name === allocation.type);
      
      if (!leaveType) {
        console.log(`⚠️  Leave type "${allocation.type}" not found, skipping...`);
        continue;
      }

      // Check if allocation already exists
      const existingAlloc = await pool.query(
        'SELECT * FROM leave_allocations WHERE employee_id = $1 AND leave_type_id = $2',
        [employee.id, leaveType.id]
      );

      if (existingAlloc.rowCount > 0) {
        console.log(`   ⏭️  ${allocation.type}: Already allocated (${existingAlloc.rows[0].allocated_days} days)`);
        continue;
      }

      // Create allocation
      const result = await pool.query(`
        INSERT INTO leave_allocations 
        (employee_id, leave_type_id, allocated_days, used_days, valid_from, valid_to, notes)
        VALUES ($1, $2, $3, 0, $4, $5, $6)
        RETURNING *
      `, [
        employee.id,
        leaveType.id,
        allocation.days,
        validFrom,
        validTo,
        `Auto-allocated for ${new Date().getFullYear()}`
      ]);

      console.log(`   ✅ ${allocation.type}: Allocated ${allocation.days} days (Valid: ${validFrom.toLocaleDateString()} - ${validTo.toLocaleDateString()})`);
    }

    console.log('\n✨ Leave allocations completed successfully!');
    console.log(`\n📊 Summary for ${employee.first_name} ${employee.last_name}:`);
    
    // Show final summary
    const summary = await pool.query(`
      SELECT lt.name, lt.is_paid, la.allocated_days, la.used_days, 
             (la.allocated_days - la.used_days) as available_days
      FROM leave_allocations la
      JOIN leave_types lt ON lt.id = la.leave_type_id
      WHERE la.employee_id = $1
      ORDER BY lt.name
    `, [employee.id]);

    summary.rows.forEach(row => {
      console.log(`   • ${row.name} (${row.is_paid ? 'Paid' : 'Unpaid'}): ${row.available_days}/${row.allocated_days} days available`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error allocating leaves:', error);
    process.exit(1);
  }
}

seedLeaveAllocations();
