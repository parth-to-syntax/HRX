# Payroll System Integration - Complete Guide

## 🎯 Overview

The payroll system is now fully integrated with dynamic backend data. It handles payrun creation, payslip generation, salary computation based on attendance and leaves, and provides comprehensive reporting.

## 🔄 Complete Workflow

### 1. **Payrun Creation** (Admin/Payroll)
- Click "New Payrun" button in Payroll page
- Select Period Month and Year
- System creates payrun for all employees
- Automatically generates payslips for each employee

### 2. **Payslip Generation** (Automatic)
- For each employee with salary structure:
  - Fetches monthly attendance data (present + leave days)
  - Calculates payable days based on attendance
  - Applies proration factor if employee didn't work full month
  - Computes earnings and deductions
  - Creates payslip with all components

### 3. **Salary Computation Logic**

#### Base Calculation:
```javascript
Expected Working Days = countExpectedWorkingDaysInMonth(year, month, working_days_per_week)
Payable Days = min(present_days + leave_days, expected_working_days)
Proration Factor = payable_days / expected_working_days
Base Wage = monthly_wage × proration_factor
```

#### Components:
- **Earnings:**
  - Monthly Wage (prorated)
  - Custom components (percentage or fixed)
  
- **Deductions:**
  - PF Employee (percentage of base)
  - PF Employer (percentage of base)
  - Professional Tax (fixed override)
  - Custom deduction components

#### Final Calculation:
```javascript
Gross Wage = Sum of all earnings
Total Deductions = Sum of all deductions
Net Wage = Gross Wage - Total Deductions
Employer Cost = Gross Wage + PF Employer
```

## 📊 Frontend Features

### Dashboard View (Admin/Payroll)
- **Employer Cost Chart**: Monthly/Annual view
- **Employee Count Chart**: Monthly/Annual view
- **Warnings**: Missing bank accounts, managers, etc.
- **Payrun List**: All payruns with click to view details

### Payrun Details View
- List of all employees in the payrun
- Employee-wise breakdown:
  - Employer Cost
  - Basic Wage
  - Gross Wage
  - Net Wage
  - Status (Generated/Validated/Cancelled)

### Payslip Detailed View
- **Worked Days Tab:**
  - Attendance days
  - Paid time off (approved leaves)
  - Total with amount breakdown

- **Salary Computation Tab:**
  - Earnings (all components with rate and amount)
  - Deductions (all components with rate and amount)
  - Gross, Total Deductions, Net Amount

### Employee View
- Employees see their own payslips only
- Can view detailed breakdown
- Can download PDF payslips

## 🖥️ API Endpoints

### Payrun Management
- `POST /payroll/payruns` - Create new payrun
- `GET /payroll/payruns` - List all payruns (paginated)
- `GET /payroll/payruns/:id` - Get specific payrun
- `PATCH /payroll/payruns/:id/validate` - Validate payrun

### Payslip Management
- `GET /payroll/payruns/:id/payslips` - List payslips for payrun (paginated)
- `GET /payroll/payslips/:id` - Get specific payslip with components
- `PATCH /payroll/payslips/:id/validate` - Validate payslip
- `PATCH /payroll/payslips/:id/cancel` - Cancel payslip
- `PATCH /payroll/payslips/:id/recompute` - Recompute payslip
- `GET /payroll/payslips/:id/pdf` - Download payslip PDF

### Employee APIs
- `GET /payroll/my-payslips` - Employee's own payslips (paginated)

### Reports
- `GET /payroll/reports/employer-cost?year=2025` - Employer cost report
- `GET /payroll/reports/employee-count?year=2025` - Employee count report
- `GET /payroll/yearly/:employee_id/pdf?year=2025` - Yearly salary PDF

## 🔧 Backend Implementation

### Database Schema

#### `salary_structure` table
- `employee_id` - References employee
- `monthly_wage` - Base monthly salary
- `yearly_wage` - Auto-calculated (monthly × 12)
- `working_days_per_week` - Usually 5 (Mon-Fri)
- `break_hours` - Daily break hours
- `pf_employee_rate` - PF percentage for employee (default 12%)
- `pf_employer_rate` - PF percentage for employer (default 12%)
- `professional_tax_override` - Fixed professional tax amount

#### `salary_components` table
- `employee_id` - References employee
- `name` - Component name (e.g., "House Rent Allowance")
- `computation_type` - 'fixed' or 'percentage'
- `value` - Percentage or fixed amount
- `is_deduction` - true for deductions, false for earnings

#### `payruns` table
- `company_id` - References company
- `period_month` - 1-12
- `period_year` - Year
- `employee_count` - Total employees in payrun
- `total_employer_cost` - Sum of all employer costs
- `status` - 'completed', 'validated'
- `created_by` - User who created payrun

#### `payslips` table
- `payrun_id` - References payrun
- `employee_id` - References employee
- `payable_days` - Total days to pay for
- `total_worked_days` - Present days
- `total_leaves` - Approved leave days
- `basic_wage` - Prorated monthly wage
- `gross_wage` - Total earnings
- `net_wage` - After deductions
- `status` - 'generated', 'validated', 'cancelled'

#### `payslip_components` table
- `payslip_id` - References payslip
- `component_name` - Name of earning/deduction
- `amount` - Calculated amount
- `is_deduction` - true/false

### Key Backend Functions

#### `computePayslipForEmployee(empId, year, month)`
- Fetches salary structure
- Gets attendance counts (present, leave)
- Calculates expected working days
- Applies proration
- Computes all earnings and deductions
- Returns complete payslip data

#### `createPayrun(req, res)`
- Creates payrun for all employees in company
- For each employee:
  - Computes payslip
  - Inserts payslip record
  - Inserts all components
- Updates payrun totals

#### `getPayslip(req, res)`
- Fetches payslip with employee names
- Includes all components
- Calculates absent days
- Returns earnings and deductions summary

## 🔐 Permissions

- **Admin/Payroll**:
  - Create payruns
  - View all payruns and payslips
  - Validate/cancel payslips
  - Recompute payslips
  - View reports
  - Download any payslip

- **Employee**:
  - View own payslips only
  - Download own payslips
  - Cannot create or modify payruns

## 📱 Frontend Components

### PayrollPage.jsx
- **State Management**:
  - `payruns` - List of all payruns with employees
  - `selectedPayrun` - Currently selected payrun
  - `selectedEmployee` - Currently selected employee for detail view
  - `employerCostData` - Chart data
  - `employeeCountData` - Chart data
  - `loading` - Loading state

- **Dynamic Data Loading**:
  - Loads on mount via `loadData()`
  - Fetches payruns with nested payslips
  - For each payslip, fetches full details with components
  - Groups by payrun for display

- **Modal Components**:
  - Create Payrun Modal (month/year selection)
  - Payslip Detail Modal (worked days & salary computation tabs)

## ✅ Integration with Attendance & Leaves

### How It Works:
1. **Attendance System** tracks:
   - Present days (check-in/out)
   - Leave days (approved leaves)
   - Absent days (no check-in, no leave)

2. **Payroll System** reads:
   - `total_worked_days` = Present days from attendance
   - `total_leaves` = Approved leave days from attendance
   - `payable_days` = Present + Leave (capped at expected working days)

3. **Salary Calculation**:
   - If employee worked 20 days, on leave 2 days in 22-day month:
     - Payable days = 22
     - Gets full month salary
   
   - If employee worked 15 days, on leave 0 days in 22-day month:
     - Payable days = 15
     - Gets (15/22) × monthly wage

4. **Leave Types Impact**:
   - **Paid leaves** (Sick, Casual): Counted in payable days
   - **Unpaid leaves**: NOT counted in payable days (reduces salary)

## 🚀 Testing the System

### Step 1: Create Salary Structure (Admin)
```javascript
// Via EmployeeDirectory -> Edit Employee -> Salary tab
// Or directly in database for testing:
INSERT INTO salary_structure (employee_id, monthly_wage, working_days_per_week, pf_employee_rate, pf_employer_rate)
VALUES ('employee-uuid', 50000, 5, 12, 12);
```

### Step 2: Add Salary Components (Optional)
```javascript
INSERT INTO salary_components (employee_id, name, computation_type, value, is_deduction)
VALUES 
  ('employee-uuid', 'House Rent Allowance', 'percentage', 50, false),
  ('employee-uuid', 'Transport Allowance', 'fixed', 2000, false);
```

### Step 3: Mark Attendance
- Employees check in/out for the month
- HR approves leave requests
- System tracks present and leave days

### Step 4: Create Payrun
- Go to Payroll page
- Click "New Payrun"
- Select month and year
- Click "Create Payrun"
- System generates payslips for all employees

### Step 5: View Payslips
- Click on payrun to view employee list
- Click on employee to view detailed payslip
- Verify worked days, earnings, deductions
- Download PDF if needed

## 📈 Reports

### Employer Cost Report
- Shows monthly employer cost for the year
- Includes PF employer contribution
- Used for budgeting and financial planning

### Employee Count Report
- Shows employee count per month
- Tracks company growth
- Useful for HR analytics

## 🎨 UI Features

### Dynamic Charts
- Recharts library for visualizations
- Toggle between monthly/annual views
- Responsive design

### Animated Transitions
- Framer Motion for smooth transitions
- Slide-in animations for modals
- Professional feel

### Status Badges
- Color-coded status (Generated/Validated/Cancelled)
- Clear visual feedback

### PDF Downloads
- Professional payslip PDFs
- Yearly salary reports
- Includes all components

## 🔍 Future Enhancements

- [ ] Bulk payslip validation
- [ ] Email payslips to employees
- [ ] Tax calculation (TDS)
- [ ] Bonus/incentive management
- [ ] Payroll approval workflow
- [ ] Integration with banking systems
- [ ] Export to accounting software

## 📝 Notes

- Payslips are auto-generated based on current attendance data
- Recompute feature allows updating payslips if attendance changes
- Validation locks payslip (prevents further modifications)
- Professional tax is company/state-specific (currently fixed override)
- PF rates are configurable per employee (default 12% each)
