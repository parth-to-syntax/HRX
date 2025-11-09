import nodemailer from 'nodemailer';
import { pool } from '../db.js';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 1000 * 60,   // 1 min
  greetingTimeout: 1000 * 30,     // 30 sec
  socketTimeout: 1000 * 60 
  });
};

/**
 * Send payslip email to a single employee
 */
export async function sendPayslipEmail(employeeId, payslipId) {
  try {
    // Get employee and payslip details
    const payslipQuery = await pool.query(
      `SELECT 
        p.*,
        e.first_name,
        e.last_name,
        e.email,
        pr.period_month,
        pr.period_year,
        c.name as company_name
       FROM payslips p
       JOIN employees e ON e.id = p.employee_id
       JOIN payruns pr ON pr.id = p.payrun_id
       JOIN companies c ON c.id = e.company_id
       WHERE p.id = $1`,
      [payslipId]
    );

    if (!payslipQuery.rowCount) {
      throw new Error('Payslip not found');
    }

    const payslip = payslipQuery.rows[0];
    const employeeEmail = payslip.email;

    if (!employeeEmail) {
      throw new Error(`No email found for employee ${payslip.first_name} ${payslip.last_name}`);
    }

    // Get payslip components
    const componentsQuery = await pool.query(
      `SELECT component_name, amount, is_deduction
       FROM payslip_components
       WHERE payslip_id = $1
       ORDER BY is_deduction, component_name`,
      [payslipId]
    );

    const earnings = componentsQuery.rows.filter(c => !c.is_deduction);
    const deductions = componentsQuery.rows.filter(c => c.is_deduction);

    // Create email content
    const monthName = getMonthName(payslip.period_month);
    const subject = `Payslip for ${monthName} ${payslip.period_year} - ${payslip.company_name}`;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .section { margin-bottom: 20px; background: white; padding: 15px; border-radius: 6px; }
    .section-title { font-weight: bold; color: #4F46E5; margin-bottom: 10px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; }
    .total-row { font-weight: bold; background: #f9fafb; }
    .amount { text-align: right; }
    .footer { margin-top: 20px; padding: 15px; text-align: center; color: #6b7280; font-size: 12px; }
    .earnings { color: #059669; }
    .deductions { color: #DC2626; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Payslip</h1>
      <p>${monthName} ${payslip.period_year}</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">Employee Details</div>
        <table>
          <tr><td><strong>Name:</strong></td><td>${payslip.first_name} ${payslip.last_name}</td></tr>
          <tr><td><strong>Company:</strong></td><td>${payslip.company_name}</td></tr>
          <tr><td><strong>Pay Period:</strong></td><td>${monthName} ${payslip.period_year}</td></tr>
          <tr><td><strong>Payable Days:</strong></td><td>${payslip.payable_days}</td></tr>
          <tr><td><strong>Worked Days:</strong></td><td>${payslip.total_worked_days}</td></tr>
          <tr><td><strong>Leave Days:</strong></td><td>${payslip.total_leaves}</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title earnings">Earnings</div>
        <table>
          <thead>
            <tr><th>Component</th><th class="amount">Amount (₹)</th></tr>
          </thead>
          <tbody>
            ${earnings.map(e => `
              <tr>
                <td>${e.component_name}</td>
                <td class="amount">${Number(e.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td>Gross Salary</td>
              <td class="amount earnings">₹ ${Number(payslip.gross_wage).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title deductions">Deductions</div>
        <table>
          <thead>
            <tr><th>Component</th><th class="amount">Amount (₹)</th></tr>
          </thead>
          <tbody>
            ${deductions.map(d => `
              <tr>
                <td>${d.component_name}</td>
                <td class="amount">${Number(d.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td>Total Deductions</td>
              <td class="amount deductions">₹ ${deductions.reduce((sum, d) => sum + Number(d.amount), 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Summary</div>
        <table>
          <tr><td><strong>Gross Salary:</strong></td><td class="amount">₹ ${Number(payslip.gross_wage).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
          <tr><td><strong>Total Deductions:</strong></td><td class="amount">₹ ${deductions.reduce((sum, d) => sum + Number(d.amount), 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td></tr>
          <tr class="total-row">
            <td><strong>Net Salary:</strong></td>
            <td class="amount" style="color: #059669; font-size: 18px;">₹ ${Number(payslip.net_wage).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>This is a system-generated email. Please do not reply.</p>
        <p>For any queries, contact your HR department.</p>
        <p>© ${new Date().getFullYear()} ${payslip.company_name}. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${payslip.company_name} Payroll" <${process.env.SMTP_USER}>`,
      to: employeeEmail,
      subject: subject,
      html: emailBody
    });

    console.log(`✅ Payslip email sent to ${employeeEmail} - Message ID: ${info.messageId}`);
    
    return {
      success: true,
      email: employeeEmail,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('❌ Error sending payslip email:', error);
    throw error;
  }
}

/**
 * Send payslips for all employees in a payrun
 */
export async function sendPayslipsForPayrun(payrunId) {
  try {
    console.log(`📧 Starting to send payslips for payrun: ${payrunId}`);

    // Get all payslips for this payrun
    const payslipsQuery = await pool.query(
      `SELECT p.id, p.employee_id, e.first_name, e.last_name, e.email
       FROM payslips p
       JOIN employees e ON e.id = p.employee_id
       WHERE p.payrun_id = $1 AND p.status != 'cancelled'`,
      [payrunId]
    );

    if (!payslipsQuery.rowCount) {
      return {
        success: false,
        message: 'No payslips found for this payrun',
        sent: 0,
        failed: 0
      };
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    // Send emails to all employees
    for (const payslip of payslipsQuery.rows) {
      try {
        await sendPayslipEmail(payslip.employee_id, payslip.id);
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          employee: `${payslip.first_name} ${payslip.last_name}`,
          email: payslip.email,
          error: error.message
        });
      }
    }

    console.log(`✅ Payslip distribution complete: ${results.sent} sent, ${results.failed} failed`);

    return {
      success: true,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors
    };

  } catch (error) {
    console.error('❌ Error sending payslips for payrun:', error);
    throw error;
  }
}

/**
 * Send payslips for the latest payrun of the current month
 */
export async function sendMonthlyPayslips(companyId) {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    console.log(`📅 Sending monthly payslips for ${getMonthName(currentMonth)} ${currentYear}`);

    // Get the latest payrun for current month
    const payrunQuery = await pool.query(
      `SELECT id, period_month, period_year
       FROM payruns
       WHERE company_id = $1 AND period_month = $2 AND period_year = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [companyId, currentMonth, currentYear]
    );

    if (!payrunQuery.rowCount) {
      console.log(`⚠️ No payrun found for ${getMonthName(currentMonth)} ${currentYear}`);
      return {
        success: false,
        message: `No payrun found for ${getMonthName(currentMonth)} ${currentYear}`
      };
    }

    const payrun = payrunQuery.rows[0];
    return await sendPayslipsForPayrun(payrun.id);

  } catch (error) {
    console.error('❌ Error in sendMonthlyPayslips:', error);
    throw error;
  }
}

// Helper function
function getMonthName(month) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
}
