import { pool } from '../db.js';
import PDFDocument from 'pdfkit';
import { sendPayslipsForPayrun, sendPayslipEmail } from '../services/payslipEmailService.js';

function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || 'Unknown';
}

function countExpectedWorkingDaysInMonth(year, month, workingDaysPerWeek = 5) {
  // month: 1-12
  const includeSaturday = workingDaysPerWeek >= 6;
  const includeSunday = workingDaysPerWeek >= 7;
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0)); // last day of month
  let count = 0;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.getUTCDay(); // 0 Sun ... 6 Sat
    const isWeekday = day >= 1 && day <= 5;
    const isSat = day === 6;
    const isSun = day === 0;
    if (isWeekday) count++;
    else if (isSat && includeSaturday) count++;
    else if (isSun && includeSunday) count++;
  }
  return count;
}

async function getMonthlyAttendanceCounts(empId, year, month) {
  // Counts of present and leave within month
  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const endDate = new Date(Date.UTC(year, month, 0));
  const end = `${year}-${String(month).padStart(2,'0')}-${String(endDate.getUTCDate()).padStart(2,'0')}`;
  const q = await pool.query(
    `SELECT status, COUNT(*)::int AS c
       FROM attendance
      WHERE employee_id=$1 AND date BETWEEN $2 AND $3
      GROUP BY status`,
    [empId, start, end]
  );
  let present = 0, leave = 0;
  for (const r of q.rows) {
    if (r.status === 'present') present = Number(r.c);
    else if (r.status === 'leave') leave = Number(r.c);
  }
  return { present, leave };
}

async function computePayslipForEmployee(empId, year, month) {
  // Returns {earnings:[], deductions:[], gross, net, employerCost}
  const salQ = await pool.query('SELECT * FROM salary_structure WHERE employee_id=$1', [empId]);
  if (!salQ.rowCount) return null;
  const s = salQ.rows[0];
  // Attendance-based proration
  const { present, leave } = await getMonthlyAttendanceCounts(empId, year, month);
  const expectedWorking = countExpectedWorkingDaysInMonth(year, month, s.working_days_per_week || 5);
  const payableDays = Math.min(present + leave, expectedWorking);
  const prorateFactor = expectedWorking > 0 ? (payableDays / expectedWorking) : 1;
  const base = Number(s.monthly_wage) * prorateFactor;
  const compsQ = await pool.query('SELECT * FROM salary_components WHERE employee_id=$1', [empId]);
  const earnings = [{ name: 'Monthly Wage', amount: base, is_deduction: false }];
  const deductions = [];
  for (const c of compsQ.rows) {
    let amt = 0;
    if (c.computation_type === 'percentage') {
      amt = (base * Number(c.value)) / 100.0;
    } else {
      amt = Number(c.value);
    }
    if (c.is_deduction) deductions.push({ name: c.name, amount: amt, is_deduction: true });
    else earnings.push({ name: c.name, amount: amt, is_deduction: false });
  }
  // PF & PT
  const pfEmp = s.pf_employee_rate != null ? (base * Number(s.pf_employee_rate)) / 100.0 : 0;
  const pfEmpr = s.pf_employer_rate != null ? (base * Number(s.pf_employer_rate)) / 100.0 : 0;
  if (pfEmp) deductions.push({ name: 'PF Employee', amount: pfEmp, is_deduction: true });
  const pt = s.professional_tax_override != null ? Number(s.professional_tax_override) : 0;
  if (pt) deductions.push({ name: 'Professional Tax', amount: pt, is_deduction: true });

  const gross = earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const net = gross - totalDeductions;
  
  // Employer Cost = Monthly Wage (prorated basic salary)
  const employerCost = base;

  return { earnings, deductions, gross, net, employerCost, counts: { payableDays, present, leave, expectedWorking } };
}

export async function createPayrun(req, res) {
  const client = await pool.connect();
  try {
    const { period_month, period_year } = req.body || {};
    const companyId = req.user.company_id;
    const role = req.user.role;
    if (!['admin','payroll'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    if (!period_month || !period_year) return res.status(400).json({ error: 'period_month and period_year required' });

    // Check if payrun already exists for this period
    const existingPayrun = await client.query(
      'SELECT id, status FROM payruns WHERE company_id=$1 AND period_month=$2 AND period_year=$3 LIMIT 1',
      [companyId, period_month, period_year]
    );
    
    if (existingPayrun.rowCount > 0) {
      return res.status(409).json({ 
        error: 'Payrun already exists',
        message: `A payrun for ${getMonthName(period_month)} ${period_year} already exists.`,
        existingPayrunId: existingPayrun.rows[0].id,
        status: existingPayrun.rows[0].status
      });
    }

    await client.query('BEGIN');
    const employeesQ = await client.query('SELECT id FROM employees WHERE company_id=$1', [companyId]);
    
    // Validation: Check which employees don't have salary structures
    const employeesWithoutSalary = [];
    for (const row of employeesQ.rows) {
      const salQ = await client.query('SELECT id FROM salary_structure WHERE employee_id=$1', [row.id]);
      if (!salQ.rowCount) {
        const empInfoQ = await client.query('SELECT first_name, last_name, email FROM employees WHERE id=$1', [row.id]);
        if (empInfoQ.rowCount) {
          const emp = empInfoQ.rows[0];
          employeesWithoutSalary.push({
            id: row.id,
            name: `${emp.first_name} ${emp.last_name}`,
            email: emp.email
          });
        }
      }
    }

    let employeeCount = 0;
    let totalEmployerCost = 0;

    const payrunQ = await client.query(
      `INSERT INTO payruns (company_id, period_month, period_year, employee_count, total_employer_cost, created_by, status)
       VALUES ($1,$2,$3,0,0,$4,'completed')
       RETURNING id`,
      [companyId, period_month, period_year, req.user.id]
    );
    const payrunId = payrunQ.rows[0].id;

    for (const row of employeesQ.rows) {
      const empId = row.id;
      const result = await computePayslipForEmployee(empId, period_year, period_month);
      if (!result) continue; // no salary structure; skip
      const { earnings, deductions, gross, net, employerCost, counts } = result;

      // Insert payslip
      const slipQ = await client.query(
        `INSERT INTO payslips (payrun_id, employee_id, payable_days, total_worked_days, total_leaves, basic_wage, gross_wage, net_wage, employer_cost, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'generated') RETURNING id`,
        [payrunId, empId, counts.payableDays, counts.present, counts.leave, earnings.find(e=>e.name==='Monthly Wage')?.amount || 0, gross, net, employerCost]
      );
      const payslipId = slipQ.rows[0].id;
      // Components
      for (const e of earnings) {
        await client.query(
          `INSERT INTO payslip_components (payslip_id, component_name, amount, is_deduction) VALUES ($1,$2,$3,$4)`,
          [payslipId, e.name, e.amount, false]
        );
      }
      for (const d of deductions) {
        await client.query(
          `INSERT INTO payslip_components (payslip_id, component_name, amount, is_deduction) VALUES ($1,$2,$3,$4)`,
          [payslipId, d.name, d.amount, true]
        );
      }
      employeeCount += 1;
      totalEmployerCost += employerCost;
    }

    await client.query('UPDATE payruns SET employee_count=$1, total_employer_cost=$2 WHERE id=$3', [employeeCount, totalEmployerCost, payrunId]);
    await client.query('COMMIT');
    
    // Return response with warnings if some employees were skipped
    const response = { 
      id: payrunId, 
      employee_count: employeeCount, 
      total_employer_cost: totalEmployerCost, 
      period_month, 
      period_year 
    };
    
    if (employeesWithoutSalary.length > 0) {
      response.warnings = {
        employees_without_salary: employeesWithoutSalary,
        message: `${employeesWithoutSalary.length} employee(s) were skipped because they don't have salary structures defined.`
      };
    }
    
    res.status(201).json(response);
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch(_) {}
    console.error(e);
    res.status(500).json({ error: 'Failed to create payrun' });
  } finally {
    client.release();
  }
}

export async function listPayruns(req, res) {
  try {
    const companyId = req.user.company_id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '20', 10)));
    const offset = (page - 1) * pageSize;
    const countQ = await pool.query('SELECT COUNT(*)::int AS c FROM payruns WHERE company_id=$1', [companyId]);
    const total = countQ.rows[0].c;
    const q = await pool.query('SELECT * FROM payruns WHERE company_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [companyId, pageSize, offset]);
    res.json({ items: q.rows, page, pageSize, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch payruns' });
  }
}

export async function getPayrun(req, res) {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const { rows } = await pool.query('SELECT * FROM payruns WHERE id=$1 AND company_id=$2', [id, companyId]);
    if (!rows.length) return res.status(404).json({ error: 'Payrun not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch payrun' });
  }
}

export async function listPayslipsForPayrun(req, res) {
  try {
    const { id } = req.params; // payrun id
    const companyId = req.user.company_id;
    // Verify payrun belongs to company
    const pr = await pool.query('SELECT id, period_month, period_year FROM payruns WHERE id=$1 AND company_id=$2', [id, companyId]);
    if (!pr.rowCount) return res.status(404).json({ error: 'Payrun not found' });
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '20', 10)));
    const offset = (page - 1) * pageSize;
    const countQ = await pool.query('SELECT COUNT(*)::int AS c FROM payslips WHERE payrun_id=$1', [id]);
    const total = countQ.rows[0].c;
    
    // Join with employees to get names
    const slipsQ = await pool.query(
      `SELECT p.*, e.first_name, e.last_name 
       FROM payslips p
       JOIN employees e ON e.id = p.employee_id
       WHERE p.payrun_id=$1 
       ORDER BY p.id ASC 
       LIMIT $2 OFFSET $3`, 
      [id, pageSize, offset]
    );
    
    // Compute absent days per slip
    const year = pr.rows[0].period_year;
    const month = pr.rows[0].period_month;
    const empIds = slipsQ.rows.map(r => r.employee_id);
    const wsQ = await pool.query('SELECT employee_id, working_days_per_week FROM salary_structure WHERE employee_id = ANY($1)', [empIds]);
    const wdwMap = new Map(wsQ.rows.map(r => [r.employee_id, r.working_days_per_week || 5]));
    const items = slipsQ.rows.map(slip => {
      const wdw = wdwMap.get(slip.employee_id) || 5;
      const expected = countExpectedWorkingDaysInMonth(year, month, wdw);
      const present = Number(slip.total_worked_days || 0);
      const leave = Number(slip.total_leaves || 0);
      const absent_days = Math.max(0, expected - (present + leave));
      const employee_name = `${slip.first_name || ''} ${slip.last_name || ''}`.trim();
      return { ...slip, absent_days, expected_working_days: expected, employee_name };
    });
    res.json({ items, page, pageSize, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
}

export async function getPayslip(req, res) {
  try {
    const { id } = req.params; // payslip id
    // Fetch payslip and ensure same company
    const ps = await pool.query(
      `SELECT p.*, e.company_id, e.first_name, e.last_name, pr.period_month, pr.period_year
         FROM payslips p
         JOIN employees e ON e.id = p.employee_id
         JOIN payruns pr ON pr.id = p.payrun_id
        WHERE p.id=$1`,
      [id]
    );
    if (!ps.rowCount) return res.status(404).json({ error: 'Payslip not found' });
    if (ps.rows[0].company_id !== req.user.company_id) return res.status(403).json({ error: 'Forbidden' });
    // Only admins/payroll can view any payslip; employees can only view their own
    if (req.user.role === 'employee') {
      const me = await pool.query('SELECT id FROM employees WHERE user_id=$1', [req.user.id]);
      if (!me.rowCount || me.rows[0].id !== ps.rows[0].employee_id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    const comps = await pool.query('SELECT component_name, amount, is_deduction FROM payslip_components WHERE payslip_id=$1', [id]);
    const slip = ps.rows[0];
    // Provide a simple computation summary for frontend printing if needed
    const earnings = comps.rows.filter(c => !c.is_deduction);
    const deductions = comps.rows.filter(c => c.is_deduction);
    // Compute absent days (not stored): expectedWorking - (present + leave)
    const wdwQ = await pool.query('SELECT working_days_per_week FROM salary_structure WHERE employee_id=$1', [slip.employee_id]);
    const wdw = wdwQ.rowCount ? (wdwQ.rows[0].working_days_per_week || 5) : 5;
    const expected = countExpectedWorkingDaysInMonth(slip.period_year, slip.period_month, wdw);
    const present = Number(slip.total_worked_days || 0);
    const leave = Number(slip.total_leaves || 0);
    const absent_days = Math.max(0, expected - (present + leave));
    
    // Add employee name to response
    const employee_name = `${slip.first_name || ''} ${slip.last_name || ''}`.trim();
    
    res.json({ 
      payslip: { ...slip, absent_days, expected_working_days: expected, employee_name }, 
      components: comps.rows, 
      summary: { earnings, deductions } 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch payslip' });
  }
}

export async function validatePayrun(req, res) {
  try {
    const { id } = req.params;
    // Ensure payrun belongs to company
    const pr = await pool.query('UPDATE payruns SET status=$1 WHERE id=$2 AND company_id=$3 RETURNING id, status', ['validated', id, req.user.company_id]);
    if (!pr.rowCount) return res.status(404).json({ error: 'Payrun not found' });
    res.json(pr.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to validate payrun' });
  }
}

export async function validatePayslip(req, res) {
  try {
    const { id } = req.params;
    const ps = await pool.query(
      `UPDATE payslips p SET status='validated'
         FROM employees e
        WHERE p.id=$1 AND e.id = p.employee_id AND e.company_id=$2
        RETURNING p.id, p.status`,
      [id, req.user.company_id]
    );
    if (!ps.rowCount) return res.status(404).json({ error: 'Payslip not found' });
    res.json(ps.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to validate payslip' });
  }
}

export async function cancelPayslip(req, res) {
  try {
    const { id } = req.params;
    const ps = await pool.query(
      `UPDATE payslips p SET status='cancelled'
         FROM employees e
        WHERE p.id=$1 AND e.id = p.employee_id AND e.company_id=$2
        RETURNING p.id, p.status`,
      [id, req.user.company_id]
    );
    if (!ps.rowCount) return res.status(404).json({ error: 'Payslip not found' });
    res.json(ps.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to cancel payslip' });
  }
}

export async function recomputePayslip(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    // Load payslip and payrun
    const psQ = await client.query(
      `SELECT p.*, e.company_id, pr.period_month, pr.period_year, p.payrun_id
         FROM payslips p
         JOIN employees e ON e.id = p.employee_id
         JOIN payruns pr ON pr.id = p.payrun_id
        WHERE p.id=$1`,
      [id]
    );
    if (!psQ.rowCount) return res.status(404).json({ error: 'Payslip not found' });
    const ps = psQ.rows[0];
    if (ps.company_id !== req.user.company_id) return res.status(403).json({ error: 'Forbidden' });

    await client.query('BEGIN');
    const result = await computePayslipForEmployee(ps.employee_id, ps.period_year, ps.period_month);
    if (!result) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Salary structure missing' });
    }
    const { earnings, deductions, gross, net, employerCost, counts } = result;

    // Update payslip core fields
    await client.query(
      `UPDATE payslips SET payable_days=$1, total_worked_days=$2, total_leaves=$3, basic_wage=$4, gross_wage=$5, net_wage=$6, employer_cost=$7, status='generated' WHERE id=$8`,
      [counts.payableDays, counts.present, counts.leave, earnings.find(e=>e.name==='Monthly Wage')?.amount || 0, gross, net, employerCost, id]
    );
    // Replace components
    await client.query('DELETE FROM payslip_components WHERE payslip_id=$1', [id]);
    for (const e of earnings) {
      await client.query(
        `INSERT INTO payslip_components (payslip_id, component_name, amount, is_deduction) VALUES ($1,$2,$3,$4)`,
        [id, e.name, e.amount, false]
      );
    }
    for (const d of deductions) {
      await client.query(
        `INSERT INTO payslip_components (payslip_id, component_name, amount, is_deduction) VALUES ($1,$2,$3,$4)`,
        [id, d.name, d.amount, true]
      );
    }

    // CRITICAL FIX: Recalculate payrun totals after recomputing payslip
    const payrunId = ps.payrun_id;
    
    // Recalculate all payslips in this payrun to get accurate totals
    const allPayslipsQ = await client.query(
      `SELECT id, employee_id FROM payslips WHERE payrun_id=$1 AND status != 'cancelled'`,
      [payrunId]
    );
    
    let totalEmployerCost = 0;
    for (const slip of allPayslipsQ.rows) {
      const slipResult = await computePayslipForEmployee(slip.employee_id, ps.period_year, ps.period_month);
      if (slipResult) {
        totalEmployerCost += slipResult.employerCost;
      }
    }
    
    const employeeCount = allPayslipsQ.rowCount;
    await client.query(
      'UPDATE payruns SET employee_count=$1, total_employer_cost=$2 WHERE id=$3',
      [employeeCount, totalEmployerCost, payrunId]
    );

    await client.query('COMMIT');
    res.json({ id, status: 'generated', payrun_totals_updated: true });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch(_) {}
    console.error(e);
    res.status(500).json({ error: 'Failed to recompute payslip' });
  } finally {
    client.release();
  }
}

// Generate a PDF for a single payslip
export async function getPayslipPdf(req, res) {
  try {
    const { id } = req.params;
    const ps = await pool.query(
      `SELECT p.*, e.company_id, e.first_name, e.last_name, e.email, pr.period_month, pr.period_year
         FROM payslips p
         JOIN employees e ON e.id = p.employee_id
         JOIN payruns pr ON pr.id = p.payrun_id
        WHERE p.id=$1`,
      [id]
    );
    if (!ps.rowCount) return res.status(404).json({ error: 'Payslip not found' });
    const slip = ps.rows[0];
    if (slip.company_id !== req.user.company_id) return res.status(403).json({ error: 'Forbidden' });
    if (req.user.role === 'employee') {
      const me = await pool.query('SELECT id FROM employees WHERE user_id=$1', [req.user.id]);
      if (!me.rowCount || me.rows[0].id !== slip.employee_id) return res.status(403).json({ error: 'Forbidden' });
    }
    const comps = await pool.query('SELECT component_name, amount, is_deduction FROM payslip_components WHERE payslip_id=$1', [id]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${id}.pdf`);
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    
    // Modern Header with gradient-like background (purple/blue theme)
    doc.rect(0, 0, doc.page.width, 120).fill('#6366f1');
    doc.fillColor('#ffffff')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('💰 PAYSLIP', 50, 35, { align: 'center' });
    
    doc.fontSize(11)
       .font('Helvetica')
       .text(`Period: ${String(slip.period_month).padStart(2,'0')}/${slip.period_year}`, 50, 75, { align: 'center' });
    
    // Status badge
    const statusColor = slip.status === 'validated' ? '#10b981' : slip.status === 'cancelled' ? '#ef4444' : '#f59e0b';
    doc.fontSize(10)
       .fillColor('#ffffff')
       .text(`● ${slip.status.toUpperCase()}`, 50, 95, { align: 'center' });
    
    // Reset to black text
    doc.fillColor('#000000');
    
    // Employee Info Section
    doc.moveDown(4);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#6366f1')
       .text('EMPLOYEE INFORMATION', 50);
    
    doc.moveDown(0.5);
    doc.strokeColor('#e5e7eb')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    
    doc.moveDown(0.8);
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#374151')
       .text(`Name: ${slip.first_name || ''} ${slip.last_name || ''}`, 50);
    doc.text(`Email: ${slip.email || ''}`);
    doc.text(`Generated: ${new Date(slip.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    
    // Attendance Summary Box
    doc.moveDown(1.5);
    doc.rect(50, doc.y, doc.page.width - 100, 80)
       .fillAndStroke('#f0f9ff', '#3b82f6');
    
    const boxY = doc.y + 15;
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#1e40af')
       .text('ATTENDANCE SUMMARY', 60, boxY);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#374151')
       .text(`Payable Days: ${slip.payable_days || 0}`, 60, boxY + 25);
    doc.text(`Worked Days: ${slip.total_worked_days || 0}`, 220, boxY + 25);
    doc.text(`Leave Days: ${slip.total_leaves || 0}`, 380, boxY + 25);
    
    doc.y += 95;
    
    // Earnings Section
    doc.moveDown(1.5);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#10b981')
       .text('✓ EARNINGS', 50);
    
    doc.moveDown(0.5);
    doc.strokeColor('#10b981')
       .lineWidth(2)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    
    doc.moveDown(0.8);
    const earnings = comps.rows.filter(c => !c.is_deduction);
    if (earnings.length === 0) {
      doc.fontSize(10)
         .font('Helvetica-Oblique')
         .fillColor('#9ca3af')
         .text('No earnings components', 60);
    } else {
      earnings.forEach(c => {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#374151')
           .text(`${c.component_name}`, 60, doc.y, { continued: true })
           .font('Helvetica-Bold')
           .fillColor('#10b981')
           .text(`₹${Number(c.amount).toFixed(2)}`, { align: 'right' });
        doc.moveDown(0.5);
      });
    }
    
    // Deductions Section
    doc.moveDown(1.5);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#ef4444')
       .text('✗ DEDUCTIONS', 50);
    
    doc.moveDown(0.5);
    doc.strokeColor('#ef4444')
       .lineWidth(2)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    
    doc.moveDown(0.8);
    const deductions = comps.rows.filter(c => c.is_deduction);
    if (deductions.length === 0) {
      doc.fontSize(10)
         .font('Helvetica-Oblique')
         .fillColor('#9ca3af')
         .text('No deductions', 60);
    } else {
      deductions.forEach(c => {
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#374151')
           .text(`${c.component_name}`, 60, doc.y, { continued: true })
           .font('Helvetica-Bold')
           .fillColor('#ef4444')
           .text(`₹${Number(c.amount).toFixed(2)}`, { align: 'right' });
        doc.moveDown(0.5);
      });
    }
    
    // Summary Section with colored boxes
    doc.moveDown(2);
    
    // Gross Wage Box
    doc.rect(50, doc.y, (doc.page.width - 100) / 2 - 10, 60)
       .fillAndStroke('#fef3c7', '#f59e0b');
    const grossY = doc.y + 15;
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#92400e')
       .text('GROSS WAGE', 60, grossY, { width: (doc.page.width - 100) / 2 - 30, align: 'center' });
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#f59e0b')
       .text(`₹${Number(slip.gross_wage).toFixed(2)}`, 60, grossY + 22, { width: (doc.page.width - 100) / 2 - 30, align: 'center' });
    
    // Net Wage Box
    doc.rect((doc.page.width / 2) + 10, grossY - 15, (doc.page.width - 100) / 2 - 10, 60)
       .fillAndStroke('#d1fae5', '#10b981');
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#065f46')
       .text('NET WAGE', (doc.page.width / 2) + 20, grossY, { width: (doc.page.width - 100) / 2 - 30, align: 'center' });
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#10b981')
       .text(`₹${Number(slip.net_wage).toFixed(2)}`, (doc.page.width / 2) + 20, grossY + 22, { width: (doc.page.width - 100) / 2 - 30, align: 'center' });
    
    // Footer
    doc.y = doc.page.height - 80;
    doc.fontSize(8)
       .font('Helvetica-Oblique')
       .fillColor('#9ca3af')
       .text('This is a computer-generated payslip. No signature required.', 50, doc.y, { align: 'center', width: doc.page.width - 100 });
    doc.text(`Generated on ${new Date().toLocaleString('en-US')}`, { align: 'center', width: doc.page.width - 100 });
    
    doc.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate payslip PDF' });
  }
}

// Yearly salary PDF for an employee (gross/net monthly breakdown)
export async function getEmployeeYearSalaryPdf(req, res) {
  try {
    const { employee_id } = req.params;
    const year = parseInt(req.query.year, 10);
    if (!year) return res.status(400).json({ error: 'year query param required' });
    // Employee access restriction
    if (req.user.role === 'employee') {
      const me = await pool.query('SELECT id FROM employees WHERE user_id=$1', [req.user.id]);
      if (!me.rowCount || me.rows[0].id !== employee_id) return res.status(403).json({ error: 'Forbidden' });
    }
    // Verify employee belongs to company
    const emp = await pool.query('SELECT id, first_name, last_name, email, company_id FROM employees WHERE id=$1', [employee_id]);
    if (!emp.rowCount) return res.status(404).json({ error: 'Employee not found' });
    if (emp.rows[0].company_id !== req.user.company_id) return res.status(403).json({ error: 'Forbidden' });

    const payslips = await pool.query(
      `SELECT period_month, gross_wage, net_wage, payable_days, total_worked_days, total_leaves
         FROM payslips p
         JOIN payruns pr ON pr.id = p.payrun_id
        WHERE p.employee_id=$1 AND pr.period_year=$2
        ORDER BY pr.period_month ASC`,
      [employee_id, year]
    );
    const totalGross = payslips.rows.reduce((s,r)=>s+Number(r.gross_wage),0);
    const totalNet = payslips.rows.reduce((s,r)=>s+Number(r.net_wage),0);
    const totalWorked = payslips.rows.reduce((s,r)=>s+Number(r.total_worked_days||0),0);
    const totalLeave = payslips.rows.reduce((s,r)=>s+Number(r.total_leaves||0),0);

    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`attachment; filename=salary_${employee_id}_${year}.pdf`);
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    
    // Modern Header with gradient background (teal/green theme for yearly report)
    doc.rect(0, 0, doc.page.width, 140).fill('#0d9488');
    doc.fillColor('#ffffff')
       .fontSize(30)
       .font('Helvetica-Bold')
       .text('📊 ANNUAL SALARY REPORT', 50, 30, { align: 'center' });
    
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text(year, 50, 75, { align: 'center' });
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 110, { align: 'center' });
    
    // Reset to black text
    doc.fillColor('#000000');
    
    // Employee Info Section
    doc.moveDown(5);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#0d9488')
       .text('EMPLOYEE INFORMATION', 50);
    
    doc.moveDown(0.5);
    doc.strokeColor('#e5e7eb')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    
    doc.moveDown(0.8);
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#374151')
       .text(`Name: ${emp.rows[0].first_name || ''} ${emp.rows[0].last_name || ''}`, 50);
    doc.text(`Email: ${emp.rows[0].email || ''}`);
    doc.text(`Employee ID: ${employee_id}`);
    
    // Summary Cards Section
    doc.moveDown(2);
    
    // Total Gross Box
    const cardY = doc.y;
    const cardWidth = (doc.page.width - 140) / 3;
    
    doc.rect(50, cardY, cardWidth, 70)
       .fillAndStroke('#fef3c7', '#f59e0b');
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#92400e')
       .text('TOTAL GROSS', 60, cardY + 15, { width: cardWidth - 20, align: 'center' });
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#f59e0b')
       .text(`₹${totalGross.toFixed(2)}`, 60, cardY + 35, { width: cardWidth - 20, align: 'center' });
    
    // Total Net Box
    doc.rect(65 + cardWidth, cardY, cardWidth, 70)
       .fillAndStroke('#d1fae5', '#10b981');
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#065f46')
       .text('TOTAL NET', 75 + cardWidth, cardY + 15, { width: cardWidth - 20, align: 'center' });
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#10b981')
       .text(`₹${totalNet.toFixed(2)}`, 75 + cardWidth, cardY + 35, { width: cardWidth - 20, align: 'center' });
    
    // Total Days Worked Box
    doc.rect(80 + cardWidth * 2, cardY, cardWidth, 70)
       .fillAndStroke('#dbeafe', '#3b82f6');
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#1e3a8a')
       .text('DAYS WORKED', 90 + cardWidth * 2, cardY + 15, { width: cardWidth - 20, align: 'center' });
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#3b82f6')
       .text(`${totalWorked}`, 90 + cardWidth * 2, cardY + 35, { width: cardWidth - 20, align: 'center' });
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#1e3a8a')
       .text(`Leave: ${totalLeave} days`, 90 + cardWidth * 2, cardY + 53, { width: cardWidth - 20, align: 'center' });
    
    doc.y = cardY + 90;
    
    // Monthly Breakdown Section
    doc.moveDown(2);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#0d9488')
       .text('📅 MONTHLY BREAKDOWN', 50);
    
    doc.moveDown(0.5);
    doc.strokeColor('#0d9488')
       .lineWidth(2)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    
    doc.moveDown(1);
    
    // Table Header
    const tableTop = doc.y;
    const colWidths = [60, 90, 90, 70, 70, 70];
    const colX = [50, 110, 200, 290, 360, 430];
    
    doc.rect(50, tableTop, doc.page.width - 100, 25)
       .fill('#f3f4f6');
    
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor('#1f2937')
       .text('MONTH', colX[0] + 5, tableTop + 8)
       .text('GROSS', colX[1] + 5, tableTop + 8)
       .text('NET', colX[2] + 5, tableTop + 8)
       .text('PAYABLE', colX[3] + 5, tableTop + 8)
       .text('WORKED', colX[4] + 5, tableTop + 8)
       .text('LEAVE', colX[5] + 5, tableTop + 8);
    
    doc.y = tableTop + 30;
    
    // Month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Table Rows
    if (payslips.rows.length === 0) {
      doc.fontSize(10)
         .font('Helvetica-Oblique')
         .fillColor('#9ca3af')
         .text('No payslips found for this year', 60, doc.y + 10);
    } else {
      payslips.rows.forEach((r, idx) => {
        const rowY = doc.y;
        const rowColor = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
        
        doc.rect(50, rowY, doc.page.width - 100, 22)
           .fill(rowColor);
        
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#374151')
           .text(monthNames[r.period_month - 1] || r.period_month, colX[0] + 5, rowY + 6)
           .fillColor('#f59e0b')
           .font('Helvetica-Bold')
           .text(`₹${Number(r.gross_wage).toFixed(2)}`, colX[1] + 5, rowY + 6)
           .fillColor('#10b981')
           .text(`₹${Number(r.net_wage).toFixed(2)}`, colX[2] + 5, rowY + 6)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text(`${r.payable_days || 0}`, colX[3] + 5, rowY + 6)
           .text(`${r.total_worked_days || 0}`, colX[4] + 5, rowY + 6)
           .fillColor('#ef4444')
           .text(`${r.total_leaves || 0}`, colX[5] + 5, rowY + 6);
        
        doc.y = rowY + 22;
      });
    }
    
    // Footer
    doc.y = doc.page.height - 80;
    doc.fontSize(8)
       .font('Helvetica-Oblique')
       .fillColor('#9ca3af')
       .text('This is a computer-generated annual salary report.', 50, doc.y, { align: 'center', width: doc.page.width - 100 });
    doc.text(`Confidential - For ${emp.rows[0].first_name} ${emp.rows[0].last_name} only`, { align: 'center', width: doc.page.width - 100 });
    
    doc.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate yearly salary PDF' });
  }
}

export async function monthlyEmployerCost(req, res) {
  try {
    const year = parseInt(req.query.year, 10);
    if (!year) return res.status(400).json({ error: 'year query param required' });
    const { rows } = await pool.query(
      `SELECT period_month, total_employer_cost
         FROM payruns
        WHERE company_id=$1 AND period_year=$2
        ORDER BY period_month`,
      [req.user.company_id, year]
    );
    // Normalize to 12 months
    const data = Array.from({length:12}, (_,i)=>({ month: i+1, employer_cost: 0 }));
    rows.forEach(r=>{ data[r.period_month-1].employer_cost = Number(r.total_employer_cost); });
    res.json({ year, months: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch employer cost' });
  }
}

export async function monthlyEmployeeCount(req, res) {
  try {
    const year = parseInt(req.query.year, 10);
    if (!year) return res.status(400).json({ error: 'year query param required' });
    const months = [];
    for (let m=1; m<=12; m++) {
      const lastDay = new Date(Date.UTC(year, m, 0)).toISOString().slice(0,10);
      const q = await pool.query(
        `SELECT COUNT(*)::int AS c FROM employees WHERE company_id=$1 AND date_of_joining <= $2`,
        [req.user.company_id, lastDay]
      );
      months.push({ month: m, employee_count: q.rows[0].c });
    }
    res.json({ year, months });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch employee counts' });
  }
}

export async function listMyPayslips(req, res) {
  try {
    const userId = req.user.id;
    const empQ = await pool.query('SELECT id FROM employees WHERE user_id=$1', [userId]);
    if (!empQ.rowCount) return res.status(404).json({ error: 'Employee profile not found' });
    const employeeId = empQ.rows[0].id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '20', 10)));
    const offset = (page - 1) * pageSize;
    const countQ = await pool.query('SELECT COUNT(*)::int AS c FROM payslips WHERE employee_id=$1', [employeeId]);
    const total = countQ.rows[0].c;
    // join payruns to get period for absent computation
    const q = await pool.query(
      `SELECT p.*, pr.period_month, pr.period_year
         FROM payslips p
         JOIN payruns pr ON pr.id = p.payrun_id
        WHERE p.employee_id=$1
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3`,
      [employeeId, pageSize, offset]
    );
    // compute expected/absent per slip
    const wdwQ = await pool.query('SELECT working_days_per_week FROM salary_structure WHERE employee_id=$1', [employeeId]);
    const wdw = wdwQ.rowCount ? (wdwQ.rows[0].working_days_per_week || 5) : 5;
    const items = q.rows.map(slip => {
      const expected = countExpectedWorkingDaysInMonth(slip.period_year, slip.period_month, wdw);
      const present = Number(slip.total_worked_days || 0);
      const leave = Number(slip.total_leaves || 0);
      const absent_days = Math.max(0, expected - (present + leave));
      return { ...slip, absent_days, expected_working_days: expected };
    });
    res.json({ items, page, pageSize, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch my payslips' });
  }
}

/**
 * Send payslip emails for a specific payrun
 * Admin/HR/Payroll can trigger this
 */
export async function sendPayrunEmails(req, res) {
  try {
    const { id } = req.params; // payrun id
    const role = req.user.role;
    
    // Only admin, hr, and payroll can send emails
    if (!['admin', 'hr', 'payroll'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Verify payrun belongs to user's company
    const payrunQuery = await pool.query(
      'SELECT id, company_id, period_month, period_year FROM payruns WHERE id=$1',
      [id]
    );

    if (!payrunQuery.rowCount) {
      return res.status(404).json({ error: 'Payrun not found' });
    }

    const payrun = payrunQuery.rows[0];
    
    if (payrun.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Send emails
    const result = await sendPayslipsForPayrun(id);

    if (result.success) {
      res.json({
        message: 'Payslip emails sent successfully',
        sent: result.sent,
        failed: result.failed,
        errors: result.errors
      });
    } else {
      res.status(400).json({
        error: result.message
      });
    }

  } catch (error) {
    console.error('Error sending payrun emails:', error);
    res.status(500).json({ error: 'Failed to send payslip emails' });
  }
}

/**
 * Send payslip email to a single employee
 * Admin/HR/Payroll can trigger this
 */
export async function sendSinglePayslipEmail(req, res) {
  try {
    const { id } = req.params; // payslip id
    const role = req.user.role;
    
    // Only admin, hr, and payroll can send emails
    if (!['admin', 'hr', 'payroll'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Verify payslip belongs to user's company
    const payslipQuery = await pool.query(
      `SELECT p.id, p.employee_id, e.company_id
       FROM payslips p
       JOIN employees e ON e.id = p.employee_id
       WHERE p.id=$1`,
      [id]
    );

    if (!payslipQuery.rowCount) {
      return res.status(404).json({ error: 'Payslip not found' });
    }

    const payslip = payslipQuery.rows[0];
    
    if (payslip.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Send email
    const result = await sendPayslipEmail(payslip.employee_id, id);

    res.json({
      message: 'Payslip email sent successfully',
      email: result.email,
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Error sending payslip email:', error);
    res.status(500).json({ 
      error: 'Failed to send payslip email',
      details: error.message 
    });
  }
}
