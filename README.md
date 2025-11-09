# HRX - Human Resource Management System

Modern HRMS with facial recognition attendance, automated payroll, and complete employee management.

**📁 [Project Resources & Documentation](https://drive.google.com/drive/u/0/folders/1rXy-fVDjCxwq9upabgJWAKxo2WtZnvA4)**

## Features

### Employee Management
- Complete employee profiles with auto-generated OI format login IDs
- Department hierarchy and manager assignments
- Skills, certifications, and document management
- Role-based access control (Admin, HR, Payroll, Employee)

### Facial Recognition Attendance
- Real-time face detection and verification
- Webcam-based check-in/check-out system
- Automated absence marking for missing records
- Work hours, breaks, and overtime tracking

### Leave Management
- Multiple leave types with configurable paid/unpaid status
- HR-managed leave allocations with balance tracking
- Employee self-service leave requests
- Approval workflow integration with attendance

### Payroll Processing
- Automated monthly payrun generation
- Attendance-based salary proration
- Configurable earnings and deductions
- PF calculation (employee + employer contributions)
- Professional tax support
- PDF payslip generation and yearly reports
- Employer cost analytics

### Security
- JWT authentication with httpOnly cookies
- Bcrypt password hashing
- First-login password reset
- Token-based password recovery
- Multi-company data isolation

## Tech Stack

**Backend**
- Node.js + Express.js (ES Modules)
- PostgreSQL database
- JWT + bcrypt authentication
- Face-api.js for facial recognition
- PDFKit for payslip generation
- Nodemailer for emails
- Cloudinary for file storage

**Frontend**
- React 18 + Vite
- Redux Toolkit for state management
- Material-UI + Tailwind CSS
- Recharts for analytics
- Framer Motion for animations
- Face-api.js + MediaPipe
- Axios for API calls

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- npm or yarn
- Webcam (for facial recognition)

## Installation

### Clone the Repository
```bash
git clone <repository-url>
cd master
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration (see Configuration section)

# Initialize database
node scripts/initDatabase.js

# Seed admin user
npm run seed:admin
# Note: Save the generated admin credentials

# Optional: Seed demo data
npm run seed:full

# Start backend server
npm run dev
```

Backend runs on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

Frontend runs on `http://localhost:5173`

### Python Service (Optional)

```bash
cd python

# Install dependencies
pip install -r requirements.txt

# Run the face recognition service
python faceRecognition.py
```

## Configuration

### Backend Environment Variables (.env)

```env
# Server
PORT=3001

# PostgreSQL Database
DATABASE_URL=postgres://username:password@localhost:5432/database_name

# Authentication
JWT_SECRET=your_secret_key_here
BCRYPT_ROUNDS=10

# SMTP (Optional - for password reset emails)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
SMTP_FROM=no-reply@hrx.local
RESET_TEST_EMAIL=team@hrx.local

# CORS (Optional)
CORS_ORIGIN=http://localhost:5173

# Admin Seeding (Optional)
SEED_COMPANY_NAME=Demo Company
SEED_ADMIN_LOGIN=OIADMI000000
SEED_ADMIN_PASSWORD=admin123
```

### Database Setup

The application uses PostgreSQL. The schema includes:
- Companies
- Users & Authentication
- Employees & Departments
- Attendance Records
- Leave Types, Allocations & Requests
- Salary Structure & Components
- Payruns & Payslips
- Access Rights
- Password Reset Tokens
- Facial Recognition Data

Schema is automatically initialized with `IF NOT EXISTS` clauses, making it safe to run multiple times.

## Usage

### Default Admin Credentials
After running `npm run seed:admin`:
- Login ID: `OIADMI000000`
- Password: `admin123` (or randomly generated if not specified)

### User Roles

**Admin** - Full system access including employee management, departments, access rights, and all payroll operations

**HR** - Employee onboarding, leave allocations, attendance monitoring, and basic employee management

**Payroll** - Payrun generation, payslip validation, and salary structure management

**Employee** - Self-service portal for profile viewing, attendance marking, leave applications, and payslip access

### Login ID Format
Auto-generated in format: `OI{FirstInitial}{LastInitial}{Year}{Serial}`

Example: John Doe joining in 2025 as 5th employee → `OIJD25000005`

## Payroll Calculation

### Salary Components
1. **Monthly Wage**: Base salary
2. **Custom Components**: Configurable earnings/deductions
   - Fixed amount or percentage-based
   - Examples: HRA, Transport, Medical, Bonuses

### Proration Formula
```
Payable Days = MIN(Present Days + Leave Days, Expected Working Days)
Proration Factor = Payable Days / Expected Working Days
Prorated Base = Monthly Wage × Proration Factor
```

### Deductions
- **PF Employee**: Configurable % (default 12%)
- **PF Employer**: Configurable % (default 12%)
- **Professional Tax**: Override amount per employee
- **Custom Deductions**: As configured in salary components

### Net Salary
```
Gross Salary = Sum of all earnings
Total Deductions = Sum of all deductions
Net Salary = Gross Salary - Total Deductions
Employer Cost = Prorated Monthly Wage
```

### Working Days Calculation
- Configurable working days per week (5/6/7 days)
- Automatically calculates expected working days in month
- Respects weekends based on configuration

## Project Structure

```
master/
├── backend/
│   ├── controllers/          # Business logic
│   │   ├── adminController.js
│   │   ├── attendanceController.js
│   │   ├── authController.js
│   │   ├── employeesController.js
│   │   ├── faceController.js
│   │   ├── leaveController.js
│   │   ├── payrollController.js
│   │   └── salaryController.js
│   ├── middleware/           # Authentication middleware
│   ├── migrations/           # Database migrations
│   ├── models/              # Face recognition models
│   ├── routes/              # API routes
│   ├── scripts/             # Utility scripts
│   │   ├── initDatabase.js
│   │   ├── seedAdmin.js
│   │   ├── seedFullDemo.js
│   │   └── resetDemoData.js
│   ├── utils/               # Helper utilities
│   ├── db.js                # Database configuration
│   ├── index.js             # Application entry point
│   ├── schema.sql           # Database schema
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── models/          # Face recognition models
│   ├── src/
│   │   ├── api/             # API client modules
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── redux/           # Redux store & slices
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
├── python/                  # Python face recognition service
│   ├── faceRecognition.py
│   ├── requirements.txt
│   └── Dockerfile
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/register` - Register employee (admin/hr only)
- `POST /auth/public-signup` - Public employee signup
- `POST /auth/reset-first-password` - First-time password reset
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/apply-reset` - Apply password reset
- `POST /auth/change-password` - Change password (authenticated)

### Employees
- `GET /employees` - List employees (paginated)
- `GET /employees/:id` - Get employee details
- `POST /employees` - Create employee
- `PUT /employees/:id` - Update employee
- `DELETE /employees/:id` - Delete employee
- `GET /employees/me` - Get current user's employee profile

### Attendance
- `GET /attendance` - List attendance records
- `GET /attendance/:id` - Get attendance record
- `POST /attendance` - Mark attendance
- `PUT /attendance/:id` - Update attendance
- `POST /attendance/checkin` - Check-in (facial recognition)
- `POST /attendance/checkout` - Check-out

### Leaves
- `GET /leaves/types` - List leave types
- `POST /leaves/types` - Create leave type (admin)
- `GET /leaves/allocations` - List leave allocations
- `POST /leaves/allocations` - Create allocation (hr/admin)
- `GET /leaves/requests` - List leave requests
- `POST /leaves/requests` - Create leave request
- `PUT /leaves/requests/:id` - Update leave request status

### Payroll
- `POST /payroll/payruns` - Create payrun
- `GET /payroll/payruns` - List payruns
- `GET /payroll/payruns/:id` - Get payrun details
- `GET /payroll/payruns/:id/payslips` - List payslips for payrun
- `GET /payroll/payslips/:id` - Get payslip details
- `GET /payroll/payslips/:id/pdf` - Download payslip PDF
- `POST /payroll/payslips/:id/recompute` - Recompute payslip
- `GET /payroll/my-payslips` - Employee's own payslips
- `GET /payroll/analytics/employer-cost` - Monthly employer cost
- `GET /payroll/analytics/employee-count` - Monthly employee count

### Salary
- `GET /salary/structure/:employee_id` - Get salary structure
- `POST /salary/structure` - Create/Update salary structure
- `GET /salary/components/:employee_id` - Get salary components
- `POST /salary/components` - Add salary component
- `DELETE /salary/components/:id` - Delete component

### Admin
- `GET /admin/companies` - List companies
- `POST /admin/companies` - Create company
- `GET /admin/departments` - List departments
- `POST /admin/departments` - Create department
- `GET /admin/access-rights` - Get access rights
- `POST /admin/access-rights` - Configure access rights

### Face Recognition
- `POST /face/register` - Register face descriptor
- `POST /face/verify` - Verify face against stored descriptor
- `GET /face/descriptor/:employee_id` - Get face descriptor

## How It Works

### Facial Recognition Attendance
1. Employee registers their face (one-time)
2. System captures face descriptor using face-api.js
3. Stores descriptor in database
4. During check-in, system captures live face
5. Compares with stored descriptor
6. Marks attendance if match confidence > threshold
7. Records check-in/check-out timestamps

### Automated Absence Marking
- Runs hourly in background
- Checks previous day's attendance
- Employees without attendance record AND without approved leave
- Automatically marked as absent
- Ensures complete attendance data

### Leave Integration
- Approved leaves count as paid days in payroll
- Leave days included in payable days calculation
- Leave balance auto-updated on approval
- Prevents double-marking (attendance + leave)

### Multi-tenant Architecture
- All data scoped by company_id
- Users belong to one company
- Company-level access control
- Isolated payroll processing per company

## Available Scripts

### Backend
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run seed:admin   # Seed admin user
npm run seed:full    # Seed complete demo data
npm run reset:full   # Reset and reseed demo data
```

### Frontend
```bash
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Docker Support

The project includes Dockerfile for the Python face recognition service:

```bash
cd python
docker build -t hrx-face-service .
docker run -p 5000:5000 hrx-face-service
```

## Testing

Integration tests are documented in:
- `PAYROLL_INTEGRATION_TEST_GUIDE.md` - Payroll testing guide
- `frontend/ATTENDANCE_STATUS_GUIDE.md` - Attendance status guide
- `frontend/QUICKSTART.md` - Quick start guide

## Security

- Passwords hashed with bcrypt
- JWT tokens stored in httpOnly cookies
- CORS configured for specific origins
- Role-based access control (RBAC)
- SQL injection prevention via parameterized queries
- XSS protection via React's default escaping

## Deployment

### Backend
1. Set production environment variables
2. Enable trust proxy if behind reverse proxy
3. Set secure: true for cookies (HTTPS)
4. Configure CORS_ORIGIN for production domain
5. Use connection pooling for database
6. Run migrations before deployment

### Frontend
1. Build production bundle: `npm run build`
2. Serve from `dist/` folder
3. Configure API base URL
4. Enable HTTPS
5. Set up CDN for static assets (optional)

### Database
1. Create PostgreSQL database
2. Run schema initialization
3. Configure connection pooling
4. Set up backups
5. Enable SSL connections (recommended)

## Batch Scripts (Windows)

- `install-facial-recognition.bat` - Install face recognition dependencies
- `start-all.bat` - Start all services
- `start-face-service.bat` - Start only face recognition service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Authors

HRX Development Team

## Known Issues

- Facial recognition requires good lighting conditions
- Face models need to be downloaded on first run
- Email functionality requires SMTP configuration
- Single face registration per employee
- Time zone handling assumes UTC

## Support

Create an issue in the repository for questions or bug reports.

## Roadmap

- Mobile app for attendance
- Advanced biometric integration
- Enhanced analytics dashboard
- Document management system
- Performance review module
- Recruitment workflow
- Time tracking & project allocation
- Expense management
- Multi-language support
- Dark mode
