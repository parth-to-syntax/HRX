# 🚀 HRX ODOO - Quick Start Guide

## One-Minute Setup

### 1️⃣ Install Prerequisites
- Node.js (v18+): https://nodejs.org/
- PostgreSQL (v14+): https://www.postgresql.org/download/

### 2️⃣ Clone & Setup
```bash
git clone https://github.com/HarshS3/hrx_odoo.git
cd hrx_odoo

# Run setup script
# Windows:
setup.bat

# Linux/Mac:
chmod +x setup.sh
./setup.sh
```

### 3️⃣ Create Database
```sql
-- Login to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE hrx_odoo;
\q
```

### 4️⃣ Configure Environment

**Create `backend/.env`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hrx_odoo
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5000
JWT_SECRET=change-this-secret-key
```

**Create `frontend/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

### 5️⃣ Initialize Database
```bash
cd backend

# Run schema
psql -U postgres -d hrx_odoo -f schema.sql

# Seed data
node scripts/seedDatabase.js
```

### 6️⃣ Start Application
```bash
# Windows:
start-all.bat

# OR manually:
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 7️⃣ Login
Open browser: `http://localhost:5173`

**Credentials:**
```
Email: admin@techsolutions.com
Password: password123
```

---

## 🎯 Default Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@techsolutions.com | password123 | Admin |
| hr@techsolutions.com | password123 | HR Manager |
| payroll@techsolutions.com | password123 | Payroll Officer |
| john.doe@techsolutions.com | password123 | Employee |
| jane.smith@techsolutions.com | password123 | Employee |

---

## 📊 What Gets Created

- ✅ 1 Company
- ✅ 8 Users (admin, hr, payroll, 5 employees)
- ✅ 4 Departments (Engineering, HR, Finance, Marketing)
- ✅ 8 Salary Structures (₹45K - ₹80K/month)
- ✅ 4 Leave Types (CL, SL, EL, ML)
- ✅ Sample Attendance Data (current month)

---

## 🔧 Common Commands

### Database
```bash
# Backup
pg_dump -U postgres hrx_odoo > backup.sql

# Restore
psql -U postgres -d hrx_odoo < backup.sql

# Reset (drop & recreate)
psql -U postgres
DROP DATABASE hrx_odoo;
CREATE DATABASE hrx_odoo;
\q
```

### Development
```bash
# Backend
cd backend
npm run dev          # Start dev server
npm run seed         # Seed database

# Frontend
cd frontend
npm run dev          # Start dev server
npm run build        # Production build
```

---

## 🐛 Troubleshooting

### Port 5000 in use?
Change in `backend/.env`:
```env
PORT=5001
```
Update `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001/api
```

### Can't connect to database?
1. Check PostgreSQL is running
2. Verify credentials in `.env`
3. Check database exists: `psql -U postgres -l`

### Dependencies error?
```bash
# Clean install
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Features

- ✅ **Employee Management** - Add, edit, view employees
- ✅ **Attendance Tracking** - Check-in/out, view history
- ✅ **Leave Management** - Apply, approve leaves
- ✅ **Payroll Processing** - Generate payslips, calculate salary
- ✅ **Department Management** - Organize teams
- ✅ **Salary Structure** - Configure components, deductions
- ✅ **Role-Based Access** - Admin, HR, Payroll, Employee
- ✅ **PDF Export** - Download payslips
- ✅ **Email Integration** - Send payslips via email

---

## 🔐 Security Notes

**⚠️ IMPORTANT for Production:**
1. Change `JWT_SECRET` to a strong random string
2. Change all default passwords
3. Use strong database credentials
4. Enable HTTPS
5. Restrict CORS origins

---

## 📞 Need Help?

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review console logs for errors
3. Verify all environment variables are set
4. Ensure PostgreSQL is running

---

**Happy coding! 🎉**
