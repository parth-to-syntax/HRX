# Payslip Email Automation Guide

## Overview

The system now supports automated monthly payslip distribution via email with two methods:
1. **Automated Cron Jobs** - Automatically sends payslips at the end of each month
2. **Manual Trigger** - Admin/HR/Payroll officers can send emails on-demand via a button

---

## Features

### ✉️ Email Content
Each payslip email includes:
- **Employee Details**: Name, company, pay period
- **Attendance Summary**: Payable days, worked days, approved leaves
- **Earnings Breakdown**: All salary components (Basic, HRA, Special Allowance, etc.)
- **Deductions Breakdown**: All deductions (PF Employee, Professional Tax, Income Tax, etc.)
- **Summary Section**: 
  - Gross Wage (total earnings)
  - Total Deductions
  - Net Salary (large, highlighted amount)
- **Professional HTML Styling**: Color-coded tables, responsive design, company branding

### 🤖 Automated Sending (Cron Jobs)

The system runs **two cron schedules** to ensure payslips are sent at month-end:

1. **Daily Check at 11:59 PM**
   - Runs every night at 23:59
   - Checks if tomorrow is the 1st of the month
   - If yes, triggers email sending for all companies
   - Schedule: `'59 23 * * *'`

2. **Fixed 28th Send**
   - Runs at midnight on the 28th of every month
   - Guaranteed fallback for shorter months
   - Schedule: `'0 0 28 * *'`

### 📧 Manual Sending

**Who Can Send:**
- Admin
- HR Officer
- Payroll Officer

**How to Send:**
1. Navigate to **Payroll** → **Payrun** tab
2. Click on a payrun to view details
3. Click the **"Send Payslip Emails"** button (blue, with mail icon)
4. System sends emails to all employees in that payrun
5. Toast notification shows success/failure count

**API Endpoints:**
- `POST /api/payroll/payruns/:id/send-emails` - Send all payslips for a payrun
- `POST /api/payroll/payslips/:id/send-email` - Send single payslip (future use)

---

## Configuration

### Environment Variables

Add these to your `.env` file (already configured in your project):

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account → Security
   - Under "2-Step Verification", click "App passwords"
   - Select "Mail" and your device
   - Copy the 16-character password
3. **Update .env**:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # 16-char app password
   ```

### Other SMTP Providers

**Outlook/Office365:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

---

## Technical Architecture

### File Structure

```
backend/
├── services/
│   ├── payslipEmailService.js   # Email generation & sending
│   └── cronService.js            # Cron job scheduling
├── controllers/
│   └── payrollController.js      # API endpoints (Lines 641-731)
├── routes/
│   └── payroll.js                # Email routes
└── index.js                      # Cron initialization

frontend/
├── src/
│   ├── api/
│   │   └── payroll.js            # Email API functions
│   └── pages/
│       └── PayrollPage.jsx       # "Send Emails" button
```

### Email Service Functions

**`payslipEmailService.js`:**
- `createTransporter()` - Configures nodemailer with SMTP
- `sendPayslipEmail(employeeId, payslipId)` - Sends single email
- `sendPayslipsForPayrun(payrunId)` - Batch sends for entire payrun
- `sendMonthlyPayslips(companyId)` - Gets latest payrun and sends

**`cronService.js`:**
- `initCronJobs()` - Initializes both cron schedules
- `sendPayslipsToAllCompanies()` - Iterates through all companies
- `triggerMonthlyPayslipsManually(companyId)` - Manual trigger wrapper

---

## Email Template

### HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Professional inline CSS */
    body { font-family: Arial, sans-serif; }
    .header { background: #3b82f6; color: white; }
    .earnings { color: #16a34a; }      /* Green */
    .deductions { color: #dc2626; }    /* Red */
    .net-salary { font-size: 24px; color: #16a34a; }
  </style>
</head>
<body>
  <div class="header">
    <h1>COMPANY NAME</h1>
    <h2>Payslip for MONTH YEAR</h2>
  </div>
  
  <div class="employee-details">
    <p><strong>Employee:</strong> John Doe</p>
    <p><strong>Pay Period:</strong> 01 Jan - 31 Jan 2025</p>
    <p><strong>Payable Days:</strong> 22</p>
    <p><strong>Worked Days:</strong> 20</p>
    <p><strong>Approved Leaves:</strong> 2</p>
  </div>
  
  <table class="earnings-table">
    <thead>
      <tr>
        <th>Earnings Component</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Basic Salary</td><td>₹ 30,000</td></tr>
      <tr><td>HRA</td><td>₹ 12,000</td></tr>
      <!-- ... more components -->
    </tbody>
  </table>
  
  <table class="deductions-table">
    <!-- Deductions ... -->
  </table>
  
  <div class="summary">
    <p><strong>Gross Wage:</strong> ₹ 50,000</p>
    <p><strong>Total Deductions:</strong> ₹ 5,000</p>
    <h2 class="net-salary">Net Salary: ₹ 45,000</h2>
  </div>
  
  <div class="footer">
    <p>This is a system-generated payslip.</p>
    <p>For queries, contact HR: hr@company.com</p>
  </div>
</body>
</html>
```

---

## How It Works

### Automatic Flow

```
1. Cron Job Trigger (Daily 11:59 PM or 28th 12:00 AM)
   ↓
2. Check if it's month-end
   ↓
3. Query all companies from database
   ↓
4. For each company:
   ↓
5. Get latest payrun for current month
   ↓
6. Get all payslips for that payrun
   ↓
7. For each payslip (non-cancelled):
   ↓
8. Query employee email and payslip details
   ↓
9. Generate HTML email with earnings/deductions
   ↓
10. Send via SMTP (nodemailer)
   ↓
11. Log success/failure
   ↓
12. Continue to next employee
```

### Manual Flow

```
1. User clicks "Send Payslip Emails" button
   ↓
2. Frontend: POST /api/payroll/payruns/:id/send-emails
   ↓
3. Backend: Validate role (Admin/HR/Payroll only)
   ↓
4. Backend: Verify payrun belongs to user's company
   ↓
5. Backend: Call sendPayslipsForPayrun(payrunId)
   ↓
6. Iterate through all payslips in payrun
   ↓
7. Send email for each employee
   ↓
8. Track sent/failed counts
   ↓
9. Return result: { message, sent, failed, errors }
   ↓
10. Frontend: Show toast notification with counts
```

---

## Testing

### Manual Test

1. **Configure SMTP**: Update `.env` with your email credentials
2. **Restart Server**: `npm run dev` in backend directory
3. **Check Logs**: Server should show "Cron jobs initialized."
4. **Create Payrun**: Go to Payroll → New Payrun
5. **Generate Payslips**: System auto-generates for all employees
6. **Send Emails**: Click "Send Payslip Emails" button
7. **Verify**: Check employee inboxes for payslip emails

### Cron Test

To test cron without waiting for month-end:

**Option 1: Manual Trigger**
```javascript
// In backend/services/cronService.js, temporarily add:
setTimeout(() => {
  console.log('Manual cron test...');
  sendPayslipsToAllCompanies();
}, 10000); // Sends after 10 seconds
```

**Option 2: Change Schedule**
```javascript
// Change cron schedule to every minute for testing:
cron.schedule('* * * * *', () => {
  // Test code...
});
```

### Email Delivery Troubleshooting

**Issue: Emails not sending**
- ✅ Check `.env` has correct SMTP credentials
- ✅ Verify Gmail App Password (if using Gmail)
- ✅ Check server logs for errors
- ✅ Ensure employees have valid email addresses
- ✅ Check spam/junk folders

**Issue: Cron not running**
- ✅ Verify `initCronJobs()` is called in `index.js`
- ✅ Check server logs for "Cron jobs initialized."
- ✅ Ensure server is running continuously (not restarting)

**Issue: Permission Denied**
- ✅ Verify user role is Admin/HR/Payroll
- ✅ Check `rolesAllowed` middleware in routes

---

## Security Considerations

### Email Security
- ✅ Uses TLS encryption (SMTP port 587)
- ✅ App passwords instead of plain passwords (Gmail)
- ✅ Environment variables for credentials (not hardcoded)

### Access Control
- ✅ Role-based authorization (Admin/HR/Payroll only)
- ✅ Company validation (users can only send for their company)
- ✅ Payrun/payslip ownership verification

### Data Privacy
- ⚠️ Emails contain sensitive salary information
- ⚠️ Ensure SMTP connection is secure (TLS)
- ⚠️ Consider encryption for email attachments (future)
- ⚠️ Comply with data protection regulations (GDPR, etc.)

---

## Future Enhancements

### Planned Features
- [ ] **Email Delivery Tracking**: Database table to log sent emails
- [ ] **Retry Failed Emails**: Queue system for failed sends
- [ ] **PDF Attachments**: Attach payslip PDF to email
- [ ] **Customizable Templates**: Company-specific email templates
- [ ] **Email Preferences**: Employees can opt-out or choose frequency
- [ ] **Multi-language Support**: Emails in employee's preferred language
- [ ] **Email Analytics**: Open rates, delivery rates
- [ ] **Batch Limits**: Rate limiting to avoid SMTP throttling

### Performance Optimization
- [ ] Queue-based sending (Bull/Agenda) for large companies
- [ ] Concurrent email sending with Promise.all batching
- [ ] Redis caching for frequently used data
- [ ] Email template pre-compilation

---

## Support

### Common Questions

**Q: When are payslips sent automatically?**
A: At the end of each month (detected at 11:59 PM daily) or on the 28th at midnight.

**Q: Can I send payslips before month-end?**
A: Yes! Use the "Send Payslip Emails" button in the Payrun detail view (Admin/HR/Payroll only).

**Q: What if an email fails to send?**
A: The system tracks failed emails and logs errors. Check server console for details. Failed emails are returned in the API response.

**Q: Can employees download payslips?**
A: Yes, employees can view and download their payslips from the Employee Portal.

**Q: How do I change the email template?**
A: Edit `backend/services/payslipEmailService.js` → `sendPayslipEmail()` function → HTML template section.

**Q: Can I use a different email provider?**
A: Yes! Update SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in `.env` with your provider's settings.

---

## Changelog

### v1.0.0 (Current)
- ✅ Automated monthly cron jobs (dual schedules)
- ✅ Manual email sending via button (Admin/HR/Payroll)
- ✅ Professional HTML email templates
- ✅ Earnings and deductions breakdown
- ✅ Role-based access control
- ✅ Company-level isolation
- ✅ Error tracking and reporting

---

## Contact

For technical support or feature requests, contact the development team.

**System Requirements:**
- Node.js 18+
- PostgreSQL 14+
- nodemailer 6.9+
- node-cron 3.0+

**Dependencies:**
```json
{
  "nodemailer": "^6.9.x",
  "node-cron": "^3.0.3"
}
```

---

**Last Updated:** January 2025  
**Version:** 1.0.0
