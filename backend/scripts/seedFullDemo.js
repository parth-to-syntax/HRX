// Seed a full demo dataset across the schema for quick end-to-end testing.
// Safe to run multiple times (idempotent upserts where possible).
import 'dotenv/config'
import bcrypt from 'bcrypt'
import { pool } from '../db.js'

function monthRange(year, month){
  const start = new Date(Date.UTC(year, month-1, 1))
  const end = new Date(Date.UTC(year, month, 0))
  return { start, end }
}

async function upsertCompany(name){
  const { rows } = await pool.query(
    'INSERT INTO companies (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id',
    [name]
  )
  return rows[0].id
}

async function upsertUser(login_id, role, company_id, password){
  const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS||'10',10))
  const { rows } = await pool.query(
    `INSERT INTO users (login_id, password_hash, role, company_id, is_first_login)
     VALUES ($1,$2,$3,$4,false)
     ON CONFLICT (login_id) DO UPDATE SET role=EXCLUDED.role RETURNING id`,
    [login_id, hash, role, company_id]
  )
  return rows[0].id
}

async function upsertDepartment(company_id, name){
  const { rows } = await pool.query(
    `INSERT INTO departments (company_id, name) VALUES ($1,$2)
     ON CONFLICT (company_id, name) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
    [company_id, name]
  )
  return rows[0].id
}

async function upsertEmployeeForUser({ user_id, company_id, department_id, first_name, last_name, email }){
  // ensure single row per user
  const q = await pool.query('SELECT id FROM employees WHERE user_id=$1', [user_id])
  if (q.rowCount){
    const { rows } = await pool.query(
      `UPDATE employees SET first_name=$2,last_name=$3,email=$4,company_id=$5,department_id=$6
       WHERE user_id=$1 RETURNING id`,
      [user_id, first_name, last_name, email, company_id, department_id]
    )
    return rows[0].id
  }
  const { rows } = await pool.query(
    `INSERT INTO employees (user_id, company_id, department_id, first_name, last_name, email, date_of_joining)
     VALUES ($1,$2,$3,$4,$5,$6, NOW()::date) RETURNING id`,
    [user_id, company_id, department_id, first_name, last_name, email]
  )
  return rows[0].id
}

async function upsertSalaryStructure(employee_id, monthly_wage){
  const { rows } = await pool.query(
    `INSERT INTO salary_structure (employee_id, monthly_wage, working_days_per_week, pf_employee_rate, pf_employer_rate)
     VALUES ($1,$2,5,12,12)
     ON CONFLICT (employee_id) DO UPDATE SET monthly_wage=EXCLUDED.monthly_wage, working_days_per_week=5, updated_at=NOW()
     RETURNING id`,
    [employee_id, monthly_wage]
  )
  return rows[0].id
}

async function upsertComponent(employee_id, name, computation_type, value, is_deduction){
  // naive upsert by (employee_id, name)
  const exists = await pool.query('SELECT id FROM salary_components WHERE employee_id=$1 AND name=$2', [employee_id, name])
  if (exists.rowCount){
    await pool.query('UPDATE salary_components SET computation_type=$1, value=$2, is_deduction=$3 WHERE id=$4', [computation_type, value, !!is_deduction, exists.rows[0].id])
    return exists.rows[0].id
  }
  const { rows } = await pool.query(
    `INSERT INTO salary_components (employee_id, name, computation_type, value, amount, is_deduction)
     VALUES ($1,$2,$3,$4,NULL,$5) RETURNING id`,
    [employee_id, name, computation_type, value, !!is_deduction]
  )
  return rows[0].id
}

async function seedLeaveTypes(){
  const types = [
    { name:'Sick Leave', is_paid: true },
    { name:'Casual Leave', is_paid: true },
    { name:'Unpaid Leave', is_paid: false }
  ]
  for (const t of types){
    await pool.query(
      `INSERT INTO leave_types (name, is_paid) VALUES ($1,$2)
       ON CONFLICT (name) DO UPDATE SET is_paid=EXCLUDED.is_paid`, [t.name, t.is_paid]
    )
  }
}

async function allocateLeavesForEmployee(employee_id){
  const year = new Date().getFullYear()
  const valid_from = new Date(Date.UTC(year,0,1))
  const valid_to = new Date(Date.UTC(year,11,31))
  const lt = await pool.query('SELECT id, name FROM leave_types')
  const defaults = { 'Sick Leave':12, 'Casual Leave':15, 'Unpaid Leave':30 }
  for (const r of lt.rows){
    const exists = await pool.query('SELECT 1 FROM leave_allocations WHERE employee_id=$1 AND leave_type_id=$2', [employee_id, r.id])
    if (!exists.rowCount){
      await pool.query(
        `INSERT INTO leave_allocations (employee_id, leave_type_id, allocated_days, used_days, valid_from, valid_to, notes)
         VALUES ($1,$2,$3,0,$4,$5,$6)`,
        [employee_id, r.id, defaults[r.name]||10, valid_from, valid_to, `Seed ${year}`]
      )
    }
  }
}

async function seedAttendanceForEmployee(employee_id, year, month){
  const { start, end } = monthRange(year, month)
  // Simple pattern: Mon-Fri present, 2 paid leaves, 1 absence
  const days = []
  for (let d=new Date(start); d<=end; d.setUTCDate(d.getUTCDate()+1)){
    const dow = d.getUTCDay() // 0 Sun
    if (dow===0 || dow===6) continue // skip weekends
    days.push(new Date(d))
  }
  // First 2 working days as leave
  const leaveDays = new Set(days.slice(0,2).map(x=>x.toISOString().slice(0,10)))
  // Next 1 working day as absent
  const absentDay = days[2]?.toISOString().slice(0,10)
  for (const d of days){
    const dateStr = d.toISOString().slice(0,10)
    const status = leaveDays.has(dateStr) ? 'leave' : (dateStr===absentDay ? 'absent' : 'present')
    await pool.query(
      `INSERT INTO attendance (employee_id, date, status, work_hours)
       VALUES ($1,$2,$3,8)
       ON CONFLICT (employee_id, date) DO NOTHING`,
      [employee_id, dateStr, status]
    )
  }
}

async function createPayrun(company_id, created_by, period_month, period_year){
  // idempotent: reuse existing payrun for company/period if present
  const existing = await pool.query(
    'SELECT id FROM payruns WHERE company_id=$1 AND period_month=$2 AND period_year=$3 LIMIT 1',
    [company_id, period_month, period_year]
  )
  if (existing.rowCount){
    console.log(`ℹ️  Reusing existing payrun for ${period_month}/${period_year}`)
    return existing.rows[0].id
  }
  const pr = await pool.query(
    `INSERT INTO payruns (company_id, period_month, period_year, employee_count, total_employer_cost, created_by, status)
     VALUES ($1,$2,$3,0,0,$4,'completed') RETURNING id`,
    [company_id, period_month, period_year, created_by]
  )
  return pr.rows[0].id
}

async function main(){
  try{
    const companyName = process.env.SEED_COMPANY_NAME || 'Demo Company'
    const passwords = {
      admin: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
      hr: process.env.SEED_HR_PASSWORD || 'Hr@12345',
      payroll: process.env.SEED_PAYROLL_PASSWORD || 'Payroll@123',
      employee: process.env.SEED_EMP_PASSWORD || 'Emp@12345'
    }
    const year = new Date().getFullYear()
    const month = new Date().getMonth()+1

    const companyId = await upsertCompany(companyName)
    const deptId = await upsertDepartment(companyId, 'Engineering')

    // Users
    const adminId = await upsertUser('OIADMI000000','admin',companyId,passwords.admin)
    const hrId = await upsertUser('OIHR00000001','hr',companyId,passwords.hr)
    const payrollId = await upsertUser('OIPAY0000001','payroll',companyId,passwords.payroll)
    const emp1Id = await upsertUser('OIEMP0000001','employee',companyId,passwords.employee)
    const emp2Id = await upsertUser('OIEMP0000002','employee',companyId,passwords.employee)
    const emp3Id = await upsertUser('OIEMP0000003','employee',companyId,passwords.employee)

    // Employees
    const e1 = await upsertEmployeeForUser({ user_id: emp1Id, company_id: companyId, department_id: deptId, first_name:'Alice', last_name:'Singh', email:'alice@example.com' })
    const e2 = await upsertEmployeeForUser({ user_id: emp2Id, company_id: companyId, department_id: deptId, first_name:'Bob', last_name:'Kumar', email:'bob@example.com' })
    const e3 = await upsertEmployeeForUser({ user_id: emp3Id, company_id: companyId, department_id: deptId, first_name:'Charlie', last_name:'Patel', email:'charlie@example.com' })

    // Salary structures
    await upsertSalaryStructure(e1, 40000)
    await upsertSalaryStructure(e2, 55000)
    await upsertSalaryStructure(e3, 70000)

    // Components
    await upsertComponent(e1, 'HRA', 'percentage', 40, false)
    await upsertComponent(e1, 'Conveyance', 'fixed', 1200, false)
    await upsertComponent(e2, 'HRA', 'percentage', 40, false)
    await upsertComponent(e2, 'Conveyance', 'fixed', 1200, false)
    await upsertComponent(e3, 'HRA', 'percentage', 40, false)
    await upsertComponent(e3, 'Conveyance', 'fixed', 1600, false)

    // Leaves
    await seedLeaveTypes()
    await allocateLeavesForEmployee(e1)
    await allocateLeavesForEmployee(e2)
    await allocateLeavesForEmployee(e3)

    // Attendance this month
    await seedAttendanceForEmployee(e1, year, month)
    await seedAttendanceForEmployee(e2, year, month)
    await seedAttendanceForEmployee(e3, year, month)

    // Create payrun and compute payslips via controller logic-like flow
    const payrunId = await createPayrun(companyId, adminId, month, year)

  // Insert (or update) payslips by recomputing like controller does (idempotent)
    const employees = [e1, e2, e3]
    let employeeCount = 0
    let totalEmployerCost = 0
    // pull compute from DB like controller: we reuse SQL here for brevity
    for (const empId of employees){
      // get salary structure
      const s = await pool.query('SELECT monthly_wage, working_days_per_week, pf_employee_rate, pf_employer_rate, professional_tax_override FROM salary_structure WHERE employee_id=$1', [empId])
      if (!s.rowCount) continue
      // present/leave counts
      const start = `${year}-${String(month).padStart(2,'0')}-01`
      const endDate = new Date(Date.UTC(year, month, 0))
      const end = `${year}-${String(month).padStart(2,'0')}-${String(endDate.getUTCDate()).padStart(2,'0')}`
      const c = await pool.query(`SELECT status, COUNT(*)::int AS c FROM attendance WHERE employee_id=$1 AND date BETWEEN $2 AND $3 GROUP BY status`, [empId, start, end])
      let present=0, leave=0
      for (const r of c.rows){ if (r.status==='present') present=r.c; else if (r.status==='leave') leave=r.c }
      // expected working days (Mon-Fri)
      const expected = (()=>{ const startD=new Date(Date.UTC(year, month-1,1)); const endD=new Date(Date.UTC(year, month,0)); let cnt=0; for(let d=new Date(startD); d<=endD; d.setUTCDate(d.getUTCDate()+1)){ const dw=d.getUTCDay(); if (dw>=1 && dw<=5) cnt++ } return cnt })()
      const payable = Math.min(present+leave, expected)
      const base = Number(s.rows[0].monthly_wage) * (expected? payable/expected : 1)
      // components
      const comps = await pool.query('SELECT name, computation_type, value, is_deduction FROM salary_components WHERE employee_id=$1', [empId])
      const earnings = [{ name:'Monthly Wage', amount: base, is_deduction:false }]
      const deductions = []
      for (const c of comps.rows){
        const val = c.computation_type==='percentage' ? (base*Number(c.value))/100.0 : Number(c.value)
        if (c.is_deduction) deductions.push({ name:c.name, amount: val })
        else earnings.push({ name:c.name, amount: val })
      }
      const pfEmp = s.rows[0].pf_employee_rate != null ? (base*Number(s.rows[0].pf_employee_rate))/100.0 : 0
      const pfEmpr = s.rows[0].pf_employer_rate != null ? (base*Number(s.rows[0].pf_employer_rate))/100.0 : 0
      if (pfEmp) deductions.push({ name:'PF Employee', amount: pfEmp })
      const pt = s.rows[0].professional_tax_override != null ? Number(s.rows[0].professional_tax_override) : 0
      if (pt) deductions.push({ name:'Professional Tax', amount: pt })
      const gross = earnings.reduce((a,b)=>a+b.amount,0)
      const totalDed = deductions.reduce((a,b)=>a+b.amount,0)
      const net = gross - totalDed
      const employerCost = gross + pfEmpr

      // Upsert payslip per (payrun, employee)
      const existingPs = await pool.query(
        'SELECT id FROM payslips WHERE payrun_id=$1 AND employee_id=$2 LIMIT 1',
        [payrunId, empId]
      )
      let slipId
      if (existingPs.rowCount){
        slipId = existingPs.rows[0].id
        await pool.query(
          `UPDATE payslips SET payable_days=$1, total_worked_days=$2, total_leaves=$3, basic_wage=$4, gross_wage=$5, net_wage=$6, status='generated' WHERE id=$7`,
          [payable, present, leave, base, gross, net, slipId]
        )
        await pool.query('DELETE FROM payslip_components WHERE payslip_id=$1', [slipId])
      } else {
        const ps = await pool.query(
          `INSERT INTO payslips (payrun_id, employee_id, payable_days, total_worked_days, total_leaves, basic_wage, gross_wage, net_wage, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'generated') RETURNING id`,
          [payrunId, empId, payable, present, leave, base, gross, net]
        )
        slipId = ps.rows[0].id
      }
      for (const e of earnings){ await pool.query(`INSERT INTO payslip_components (payslip_id, component_name, amount, is_deduction) VALUES ($1,$2,$3,false)`, [slipId, e.name, e.amount]) }
      for (const d of deductions){ await pool.query(`INSERT INTO payslip_components (payslip_id, component_name, amount, is_deduction) VALUES ($1,$2,$3,true)`, [slipId, d.name, d.amount]) }
      employeeCount++; totalEmployerCost += employerCost
    }
    await pool.query('UPDATE payruns SET employee_count=$1, total_employer_cost=$2 WHERE id=$3', [employeeCount, totalEmployerCost, payrunId])

    console.log('✅ Seed complete')
    console.log('Login IDs: OIADMI000000 (admin), OIHR00000001 (hr), OIPAY0000001 (payroll), OIEMP0000001/2/3 (employee)')
    console.log('All passwords default to environment or Admin@123 / Hr@12345 / Payroll@123 / Emp@12345')
    process.exit(0)
  }catch(e){
    console.error('❌ Seed error:', e)
    process.exit(1)
  }
}

main()
