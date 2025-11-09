import { pool } from '../db.js';
import bcrypt from 'bcrypt';

/**
 * Complete Database Seeding Script
 * This script populates the database with sample data for testing/demo purposes
 * Run with: node scripts/seedDatabase.js
 */

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting database seeding...\n');
    
    // ========================================
    // 1. CREATE COMPANY
    // ========================================
    console.log('📦 Creating company...');
    const companyResult = await client.query(`
      INSERT INTO companies (name, email, phone, address, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, ['Tech Solutions Inc.', 'admin@techsolutions.com', '+1-555-0100', '123 Business Street, Tech City, TC 12345']);
    
    const companyId = companyResult.rows[0].id;
    console.log(`✅ Company created: ${companyId}\n`);

    // ========================================
    // 2. CREATE USERS
    // ========================================
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      { email: 'admin@techsolutions.com', role: 'admin', name: 'Admin User' },
      { email: 'hr@techsolutions.com', role: 'hr', name: 'HR Manager' },
      { email: 'payroll@techsolutions.com', role: 'payroll', name: 'Payroll Officer' },
      { email: 'john.doe@techsolutions.com', role: 'employee', name: 'John Doe' },
      { email: 'jane.smith@techsolutions.com', role: 'employee', name: 'Jane Smith' },
      { email: 'mike.johnson@techsolutions.com', role: 'employee', name: 'Mike Johnson' },
      { email: 'sarah.williams@techsolutions.com', role: 'employee', name: 'Sarah Williams' },
      { email: 'david.brown@techsolutions.com', role: 'employee', name: 'David Brown' },
    ];

    const userIds = {};
    
    for (const user of users) {
      const result = await client.query(`
        INSERT INTO users (email, password, role, company_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
        RETURNING id
      `, [user.email, hashedPassword, user.role, companyId]);
      
      userIds[user.email] = result.rows[0].id;
      console.log(`  ✓ User created: ${user.name} (${user.role})`);
    }
    console.log(`✅ ${users.length} users created\n`);

    // ========================================
    // 3. CREATE DEPARTMENTS
    // ========================================
    console.log('🏢 Creating departments...');
    const departments = [
      { name: 'Engineering', description: 'Software Development Team' },
      { name: 'Human Resources', description: 'HR and Administration' },
      { name: 'Finance', description: 'Finance and Accounting' },
      { name: 'Marketing', description: 'Marketing and Sales' },
    ];

    const deptIds = {};
    
    for (const dept of departments) {
      const result = await client.query(`
        INSERT INTO departments (name, description, company_id, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (company_id, name) DO UPDATE SET description = EXCLUDED.description
        RETURNING id
      `, [dept.name, dept.description, companyId]);
      
      deptIds[dept.name] = result.rows[0].id;
      console.log(`  ✓ Department: ${dept.name}`);
    }
    console.log(`✅ ${departments.length} departments created\n`);

    // ========================================
    // 4. CREATE EMPLOYEES
    // ========================================
    console.log('👨‍💼 Creating employees...');
    const employees = [
      {
        user_id: userIds['admin@techsolutions.com'],
        first_name: 'Admin',
        last_name: 'User',
        department: 'Engineering',
        position: 'System Administrator',
        joining_serial: 1,
        date_of_joining: '2023-01-15',
        phone: '+1-555-0101',
      },
      {
        user_id: userIds['hr@techsolutions.com'],
        first_name: 'HR',
        last_name: 'Manager',
        department: 'Human Resources',
        position: 'HR Manager',
        joining_serial: 2,
        date_of_joining: '2023-02-01',
        phone: '+1-555-0102',
      },
      {
        user_id: userIds['payroll@techsolutions.com'],
        first_name: 'Payroll',
        last_name: 'Officer',
        department: 'Finance',
        position: 'Payroll Officer',
        joining_serial: 3,
        date_of_joining: '2023-02-15',
        phone: '+1-555-0103',
      },
      {
        user_id: userIds['john.doe@techsolutions.com'],
        first_name: 'John',
        last_name: 'Doe',
        department: 'Engineering',
        position: 'Senior Software Engineer',
        joining_serial: 4,
        date_of_joining: '2023-03-01',
        phone: '+1-555-0104',
      },
      {
        user_id: userIds['jane.smith@techsolutions.com'],
        first_name: 'Jane',
        last_name: 'Smith',
        department: 'Engineering',
        position: 'Software Engineer',
        joining_serial: 5,
        date_of_joining: '2023-04-01',
        phone: '+1-555-0105',
      },
      {
        user_id: userIds['mike.johnson@techsolutions.com'],
        first_name: 'Mike',
        last_name: 'Johnson',
        department: 'Marketing',
        position: 'Marketing Manager',
        joining_serial: 6,
        date_of_joining: '2023-05-01',
        phone: '+1-555-0106',
      },
      {
        user_id: userIds['sarah.williams@techsolutions.com'],
        first_name: 'Sarah',
        last_name: 'Williams',
        department: 'Finance',
        position: 'Accountant',
        joining_serial: 7,
        date_of_joining: '2023-06-01',
        phone: '+1-555-0107',
      },
      {
        user_id: userIds['david.brown@techsolutions.com'],
        first_name: 'David',
        last_name: 'Brown',
        department: 'Engineering',
        position: 'Junior Developer',
        joining_serial: 8,
        date_of_joining: '2023-07-01',
        phone: '+1-555-0108',
      },
    ];

    const employeeIds = {};
    
    for (const emp of employees) {
      const result = await client.query(`
        INSERT INTO employees (
          user_id, company_id, department_id, first_name, last_name, 
          email, phone, position, joining_serial, date_of_joining, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (user_id) DO UPDATE SET 
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name
        RETURNING id
      `, [
        emp.user_id,
        companyId,
        deptIds[emp.department],
        emp.first_name,
        emp.last_name,
        users.find(u => u.email.includes(emp.first_name.toLowerCase()))?.email,
        emp.phone,
        emp.position,
        emp.joining_serial,
        emp.date_of_joining,
      ]);
      
      employeeIds[emp.first_name] = result.rows[0].id;
      console.log(`  ✓ Employee: ${emp.first_name} ${emp.last_name} - ${emp.position}`);
    }
    console.log(`✅ ${employees.length} employees created\n`);

    // ========================================
    // 5. CREATE SALARY STRUCTURES
    // ========================================
    console.log('💰 Creating salary structures...');
    const salaries = [
      { employee: 'Admin', monthly_wage: 80000, pf_employee: 12, pf_employer: 12, pt: 200 },
      { employee: 'HR', monthly_wage: 60000, pf_employee: 12, pf_employer: 12, pt: 200 },
      { employee: 'Payroll', monthly_wage: 55000, pf_employee: 12, pf_employer: 12, pt: 200 },
      { employee: 'John', monthly_wage: 75000, pf_employee: 12, pf_employer: 12, pt: 200 },
      { employee: 'Jane', monthly_wage: 60000, pf_employee: 12, pf_employer: 12, pt: 200 },
      { employee: 'Mike', monthly_wage: 55000, pf_employee: 12, pf_employer: 12, pt: 200 },
      { employee: 'Sarah', monthly_wage: 50000, pf_employee: 12, pf_employer: 12, pt: 200 },
      { employee: 'David', monthly_wage: 45000, pf_employee: 12, pf_employer: 12, pt: 200 },
    ];

    for (const sal of salaries) {
      await client.query(`
        INSERT INTO salary_structure (
          employee_id, monthly_wage, working_days_per_week, break_hours,
          pf_employee_rate, pf_employer_rate, professional_tax_override, created_at
        )
        VALUES ($1, $2, 5, 1, $3, $4, $5, NOW())
        ON CONFLICT (employee_id) DO UPDATE SET
          monthly_wage = EXCLUDED.monthly_wage,
          pf_employee_rate = EXCLUDED.pf_employee_rate,
          pf_employer_rate = EXCLUDED.pf_employer_rate,
          professional_tax_override = EXCLUDED.professional_tax_override
      `, [employeeIds[sal.employee], sal.monthly_wage, sal.pf_employee, sal.pf_employer, sal.pt]);
      
      console.log(`  ✓ Salary: ${sal.employee} - ₹${sal.monthly_wage.toLocaleString()}/month`);
    }
    console.log(`✅ ${salaries.length} salary structures created\n`);

    // ========================================
    // 6. CREATE SALARY COMPONENTS
    // ========================================
    console.log('💵 Creating salary components...');
    const components = [
      { employee: 'John', name: 'HRA', type: 'percentage', value: 40, is_deduction: false },
      { employee: 'John', name: 'Travel Allowance', type: 'fixed', value: 3000, is_deduction: false },
      { employee: 'Jane', name: 'HRA', type: 'percentage', value: 40, is_deduction: false },
      { employee: 'Jane', name: 'Travel Allowance', type: 'fixed', value: 2500, is_deduction: false },
      { employee: 'Mike', name: 'HRA', type: 'percentage', value: 35, is_deduction: false },
      { employee: 'Sarah', name: 'HRA', type: 'percentage', value: 35, is_deduction: false },
      { employee: 'David', name: 'HRA', type: 'percentage', value: 30, is_deduction: false },
    ];

    for (const comp of components) {
      await client.query(`
        INSERT INTO salary_components (employee_id, name, computation_type, value, is_deduction)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [employeeIds[comp.employee], comp.name, comp.type, comp.value, comp.is_deduction]);
      
      console.log(`  ✓ Component: ${comp.employee} - ${comp.name}`);
    }
    console.log(`✅ ${components.length} salary components created\n`);

    // ========================================
    // 7. CREATE LEAVE TYPES
    // ========================================
    console.log('🏖️ Creating leave types...');
    const leaveTypes = [
      { name: 'Casual Leave', code: 'CL', days_per_year: 12, description: 'For personal matters' },
      { name: 'Sick Leave', code: 'SL', days_per_year: 12, description: 'For illness' },
      { name: 'Earned Leave', code: 'EL', days_per_year: 18, description: 'Earned/Privilege leave' },
      { name: 'Maternity Leave', code: 'ML', days_per_year: 180, description: 'For maternity' },
    ];

    const leaveTypeIds = {};
    
    for (const lt of leaveTypes) {
      const result = await client.query(`
        INSERT INTO leave_types (name, code, days_per_year, description, company_id, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (company_id, code) DO UPDATE SET 
          name = EXCLUDED.name,
          days_per_year = EXCLUDED.days_per_year
        RETURNING id
      `, [lt.name, lt.code, lt.days_per_year, lt.description, companyId]);
      
      leaveTypeIds[lt.code] = result.rows[0].id;
      console.log(`  ✓ Leave Type: ${lt.name} (${lt.code}) - ${lt.days_per_year} days/year`);
    }
    console.log(`✅ ${leaveTypes.length} leave types created\n`);

    // ========================================
    // 8. CREATE LEAVE ALLOCATIONS
    // ========================================
    console.log('📊 Creating leave allocations...');
    const currentYear = new Date().getFullYear();
    let allocationCount = 0;
    
    for (const empName in employeeIds) {
      for (const code in leaveTypeIds) {
        const leaveType = leaveTypes.find(lt => lt.code === code);
        await client.query(`
          INSERT INTO leave_allocations (employee_id, leave_type_id, year, total_days, used_days, created_at)
          VALUES ($1, $2, $3, $4, 0, NOW())
          ON CONFLICT (employee_id, leave_type_id, year) DO UPDATE SET
            total_days = EXCLUDED.total_days
        `, [employeeIds[empName], leaveTypeIds[code], currentYear, leaveType.days_per_year]);
        
        allocationCount++;
      }
    }
    console.log(`✅ ${allocationCount} leave allocations created\n`);

    // ========================================
    // 9. CREATE SAMPLE ATTENDANCE (Current Month)
    // ========================================
    console.log('📅 Creating sample attendance for current month...');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentMonthYear = today.getFullYear();
    const firstDayOfMonth = new Date(currentMonthYear, currentMonth, 1);
    const currentDay = today.getDate();
    
    let attendanceCount = 0;
    
    // Create attendance for each employee for working days up to today
    for (const empName in employeeIds) {
      for (let day = 1; day <= currentDay; day++) {
        const date = new Date(currentMonthYear, currentMonth, day);
        const dayOfWeek = date.getDay();
        
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        const dateStr = date.toISOString().split('T')[0];
        
        // Randomly determine status: 90% present, 5% leave, 5% absent
        const random = Math.random();
        let status = 'present';
        let checkIn = null;
        let checkOut = null;
        let workHours = null;
        let extraHours = null;
        
        if (random > 0.95) {
          status = 'absent';
        } else if (random > 0.90) {
          status = 'leave';
        } else {
          // Present - add check in/out times
          const inHour = 9 + Math.floor(Math.random() * 2); // 9-10 AM
          const inMinute = Math.floor(Math.random() * 60);
          checkIn = new Date(date);
          checkIn.setHours(inHour, inMinute, 0);
          
          const outHour = 17 + Math.floor(Math.random() * 3); // 5-7 PM
          const outMinute = Math.floor(Math.random() * 60);
          checkOut = new Date(date);
          checkOut.setHours(outHour, outMinute, 0);
          
          // Calculate work hours (minus 1 hour break)
          const totalHours = (checkOut - checkIn) / (1000 * 60 * 60) - 1;
          workHours = Math.max(0, totalHours).toFixed(2);
          extraHours = Math.max(0, totalHours - 8).toFixed(2);
        }
        
        await client.query(`
          INSERT INTO attendance (employee_id, date, check_in, check_out, work_hours, extra_hours, break_hours, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, 1, $7, NOW())
          ON CONFLICT (employee_id, date) DO UPDATE SET
            status = EXCLUDED.status,
            check_in = EXCLUDED.check_in,
            check_out = EXCLUDED.check_out,
            work_hours = EXCLUDED.work_hours,
            extra_hours = EXCLUDED.extra_hours
        `, [employeeIds[empName], dateStr, checkIn, checkOut, workHours, extraHours, status]);
        
        attendanceCount++;
      }
    }
    console.log(`✅ ${attendanceCount} attendance records created\n`);

    // ========================================
    // 10. COMMIT TRANSACTION
    // ========================================
    await client.query('COMMIT');
    
    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`  - Company: 1`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Departments: ${departments.length}`);
    console.log(`  - Employees: ${employees.length}`);
    console.log(`  - Salary Structures: ${salaries.length}`);
    console.log(`  - Salary Components: ${components.length}`);
    console.log(`  - Leave Types: ${leaveTypes.length}`);
    console.log(`  - Leave Allocations: ${allocationCount}`);
    console.log(`  - Attendance Records: ${attendanceCount}`);
    console.log('\n🔑 Login Credentials:');
    console.log('  Email: admin@techsolutions.com');
    console.log('  Password: password123');
    console.log('  Role: admin\n');
    console.log('  Other users: hr@techsolutions.com, payroll@techsolutions.com, john.doe@techsolutions.com');
    console.log('  All passwords: password123\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('✅ Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  });
