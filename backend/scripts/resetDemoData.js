// Reset (delete) demo data created by seedFullDemo.js. Be VERY careful in production.
// This deletes all tenant data for the Demo Company only.
import 'dotenv/config'
import { pool } from '../db.js'

async function main(){
  try {
    const companyName = process.env.SEED_COMPANY_NAME || 'Demo Company'
    const c = await pool.query('SELECT id FROM companies WHERE name=$1', [companyName])
    if (!c.rowCount){
      console.log('No demo company found; nothing to reset.')
      process.exit(0)
    }
    const companyId = c.rows[0].id
    console.log(`Resetting demo data for company: ${companyName} (${companyId})`)

    // Order matters (foreign keys)
    await pool.query('DELETE FROM payslip_components USING payslips p JOIN payruns pr ON pr.id=p.payrun_id WHERE p.payslip_id = payslip_components.payslip_id AND pr.company_id=$1', [companyId])
    await pool.query('DELETE FROM payslips USING payruns pr WHERE payslips.payrun_id=pr.id AND pr.company_id=$1', [companyId])
    await pool.query('DELETE FROM payruns WHERE company_id=$1', [companyId])

    await pool.query('DELETE FROM attendance USING employees e WHERE attendance.employee_id=e.id AND e.company_id=$1', [companyId])
    await pool.query('DELETE FROM leave_allocations USING employees e WHERE leave_allocations.employee_id=e.id AND e.company_id=$1', [companyId])
    await pool.query('DELETE FROM leave_requests USING employees e WHERE leave_requests.employee_id=e.id AND e.company_id=$1', [companyId])

    // salary components & structures
    await pool.query('DELETE FROM salary_components USING employees e WHERE salary_components.employee_id=e.id AND e.company_id=$1', [companyId])
    await pool.query('DELETE FROM salary_structure USING employees e WHERE salary_structure.employee_id=e.id AND e.company_id=$1', [companyId])

    // employees & users except keep company itself
    // Remove users tied to employees first
    await pool.query('DELETE FROM employees WHERE company_id=$1', [companyId])
    await pool.query('DELETE FROM departments WHERE company_id=$1', [companyId])

    // Delete non-admin users of this company (optional keep admin)
    await pool.query("DELETE FROM users WHERE company_id=$1 AND role!='admin'", [companyId])

    // Optionally clear leave types only if not used by other companies
    // In demo scenario we keep them (they can be shared) so skip.

    console.log('✅ Reset finished.')
    process.exit(0)
  } catch (e) {
    console.error('❌ Reset error:', e)
    process.exit(1)
  }
}

main()
