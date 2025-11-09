import cron from 'node-cron';
import { pool } from '../db.js';
import { sendMonthlyPayslips } from './payslipEmailService.js';

/**
 * Initialize cron jobs
 */
export function initCronJobs() {
  console.log('🕐 Initializing cron jobs...');

  // Send payslips on the last day of every month at 11:59 PM
  // Cron format: second minute hour day month weekday
  // '59 23 L * *' would be ideal but node-cron doesn't support 'L'
  // So we'll run daily and check if it's the last day
  
  cron.schedule('59 23 * * *', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if tomorrow is the 1st (meaning today is the last day of month)
    if (tomorrow.getDate() === 1) {
      console.log('📅 Last day of month detected - sending payslips...');
      await sendPayslipsToAllCompanies();
    }
  });

  // Alternative: Send on a specific day (e.g., 28th of every month)
  cron.schedule('0 0 28 * *', async () => {
    console.log('📅 28th of month - sending payslips...');
    await sendPayslipsToAllCompanies();
  });

  console.log('✅ Cron jobs initialized');
  console.log('   - Monthly payslip emails: Every month on the 28th at midnight');
  console.log('   - End of month check: Daily at 11:59 PM');
}

/**
 * Send payslips to all companies
 */
async function sendPayslipsToAllCompanies() {
  try {
    // Get all active companies
    const companiesQuery = await pool.query('SELECT id, name FROM companies');
    
    console.log(`📧 Sending payslips for ${companiesQuery.rows.length} companies`);

    for (const company of companiesQuery.rows) {
      try {
        console.log(`\n📨 Processing company: ${company.name}`);
        const result = await sendMonthlyPayslips(company.id);
        
        if (result.success) {
          console.log(`✅ ${company.name}: ${result.sent} payslips sent successfully`);
          if (result.failed > 0) {
            console.log(`⚠️ ${company.name}: ${result.failed} payslips failed`);
            console.log('Errors:', result.errors);
          }
        } else {
          console.log(`⚠️ ${company.name}: ${result.message}`);
        }
      } catch (error) {
        console.error(`❌ Error processing company ${company.name}:`, error.message);
      }
    }

    console.log('\n✅ Monthly payslip distribution complete\n');
  } catch (error) {
    console.error('❌ Error in sendPayslipsToAllCompanies:', error);
  }
}

/**
 * Manual trigger for testing (can be called from API endpoint)
 */
export async function triggerMonthlyPayslipsManually(companyId) {
  console.log('🔧 Manual trigger: Sending monthly payslips');
  return await sendMonthlyPayslips(companyId);
}
