# 🧑‍💼 WorkZen HRMS - Human Resource Management System

A modern, full-featured HRMS built with **React**, **Vite**, **Tailwind CSS v4**, **ShadCN UI**, **Material UI**, and **Redux Toolkit**.

## 🚀 Features

- **Role-based Access Control** (Admin, HR Officer, Payroll Officer, Employee)
- **Dashboard & Analytics** with interactive charts
- **Attendance Management** with check-in/check-out functionality
- **Leave Management** with approval workflow
- **Payroll Management** with payslip generation
- **Employee Directory** with advanced search and filters
- **Reports & Analytics** with exportable data
- **Settings Panel** for system configuration
- **User Profile** management
- **Dark/Light Theme** toggle
- **Responsive Design** for all devices

## 🛠️ Tech Stack

- **Frontend Framework:** React 18 with Vite
- **Styling:** Tailwind CSS v4
- **UI Components:** ShadCN UI + Material UI
- **State Management:** Redux Toolkit
- **Routing:** React Router DOM v6
- **Charts:** Recharts + MUI Charts
- **Animations:** Framer Motion
- **Icons:** Lucide React

## 📦 Installation

1. **Clone or navigate to the project directory:**

```bash
cd /Users/parthsrivastava/Desktop/HRMS
```

2. **Install dependencies:**

```bash
npm install
```

3. **Start the development server:**

```bash
npm run dev
```

4. **Open your browser and visit:**

```
http://localhost:5173
```

## 👤 Demo Credentials

Use these credentials to log in and explore different user roles:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | john.doe@workzen.com | password123 |
| **HR Officer** | jane.smith@workzen.com | password123 |
| **Payroll Officer** | mike.johnson@workzen.com | password123 |
| **Employee** | sarah.williams@workzen.com | password123 |

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx       # Main layout wrapper
│   │   ├── Sidebar.jsx         # Collapsible sidebar navigation
│   │   └── Navbar.jsx          # Top navigation bar
│   └── ui/
│       ├── card.jsx            # Card component
│       ├── button.jsx          # Button component
│       ├── input.jsx           # Input component
│       ├── badge.jsx           # Badge component
│       ├── table.jsx           # Table component
│       └── StatCard.jsx        # Statistics card component
├── pages/
│   ├── LoginPage.jsx           # Login page
│   ├── Dashboard.jsx           # Main dashboard
│   ├── AttendancePage.jsx      # Attendance management
│   ├── LeavePage.jsx           # Leave management
│   ├── PayrollPage.jsx         # Payroll management
│   ├── EmployeeDirectory.jsx   # Employee listing
│   ├── ReportsAnalytics.jsx    # Reports and charts
│   ├── SettingsPage.jsx        # System settings
│   └── UserProfile.jsx         # User profile page
├── redux/
│   ├── store.js                # Redux store configuration
│   └── slices/
│       ├── userSlice.js        # User state management
│       ├── attendanceSlice.js  # Attendance state
│       ├── leaveSlice.js       # Leave state
│       ├── payrollSlice.js     # Payroll state
│       ├── employeesSlice.js   # Employees state
│       └── settingsSlice.js    # Settings state
├── data/
│   ├── employees.json          # Mock employee data
│   ├── attendance.json         # Mock attendance records
│   ├── leaves.json             # Mock leave requests
│   └── payroll.json            # Mock payroll data
├── lib/
│   └── utils.js                # Utility functions
├── App.jsx                     # Main app component with routing
├── main.jsx                    # App entry point
└── index.css                   # Global styles with Tailwind
```

## 🎨 Color Palette

The application uses a professional color scheme avoiding purple:

- **Primary:** Teal (#0d9488)
- **Secondary:** Blue-gray
- **Background:** Neutral gray (#f5f6f7)
- **Accents:** Slate tones
- **Success:** Teal-500
- **Warning:** Yellow-500
- **Error:** Red-500

## 🔐 Role-Based Features

### Admin
- Full access to all modules
- Manage all employees, attendance, leaves, and payroll
- Access to settings and system configuration
- View comprehensive reports and analytics

### HR Officer
- Manage employee directory
- Approve/reject leave requests
- View attendance records
- Access reports and analytics

### Payroll Officer
- View and manage payroll
- Generate payslips
- Access payroll reports
- View employee information

### Employee
- View personal dashboard
- Mark attendance (check-in/check-out)
- Apply for leave
- View own payslips
- Update profile information

## 📊 Key Modules

### 1. Dashboard
- KPI cards showing key metrics
- Attendance trends chart
- Leave distribution pie chart
- Quick action buttons
- Recent activity feed

### 2. Attendance Management
- Check-in/check-out functionality
- Monthly attendance logs
- Status tracking (Present, Late, Absent)
- Export attendance reports

### 3. Leave Management
- Leave balance display
- Apply for leave with date range
- Leave request approval/rejection
- Status filtering (Pending, Approved, Rejected)

### 4. Payroll
- View payslips with detailed breakdown
- Download payslip functionality
- Payroll history
- Earnings and deductions summary

### 5. Employee Directory
- Searchable employee list
- Material UI DataGrid
- Employee profile details
- Department and role filters

### 6. Reports & Analytics
- Attendance trend analysis
- Payroll summary charts
- Leave statistics
- Exportable reports
- Date range and department filters

### 7. Settings (Admin Only)
- Roles and permissions management
- Leave policies configuration
- Payroll settings
- Holiday calendar

### 8. User Profile
- Edit personal information
- Change password
- View employment details

## 🌓 Theme Support

The application supports both light and dark themes:
- Toggle theme from the top navigation bar
- Persistent theme preference
- Smooth theme transitions

## 📱 Responsive Design

- **Mobile:** Slide-in sidebar, optimized layout
- **Tablet:** Compact navigation, adjusted grid layouts
- **Desktop:** Full sidebar, multi-column layouts

## 🚀 Build for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` folder.

## 📝 License

This project is created for educational and demonstration purposes.

---

**Developed for the Odoo Hackathon** 🏆
