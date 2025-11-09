# 🚀 HRX ODOO - Deployment Guide

Complete guide to set up and run the HRX ODOO system on any machine.

---

## 📋 Prerequisites

### Required Software:
1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
3. **Git** - [Download](https://git-scm.com/)

### Verify Installation:
```bash
node --version    # Should show v18.x or higher
npm --version     # Should show 9.x or higher
psql --version    # Should show 14.x or higher
git --version     # Should show 2.x or higher
```

---

## 🔧 Step 1: Clone the Repository

```bash
git clone https://github.com/HarshS3/hrx_odoo.git
cd hrx_odoo
```

---

## 🗄️ Step 2: Set Up Database

### 2.1 Create PostgreSQL Database

**On Windows (PowerShell/CMD):**
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hrx_odoo;

# Create user (optional - for security)
CREATE USER hrx_admin WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hrx_odoo TO hrx_admin;

# Exit
\q
```

**On Linux/Mac (Terminal):**
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Then run the same SQL commands as above
```

### 2.2 Run Schema Migration

```bash
cd backend

# Run the schema to create all tables
psql -U postgres -d hrx_odoo -f schema.sql

# Or if using custom user:
psql -U hrx_admin -d hrx_odoo -f schema.sql
```

---

## ⚙️ Step 3: Configure Environment

### 3.1 Backend Configuration

Create `.env` file in `backend/` directory:

```bash
cd backend
```

Create file `.env` with following content:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hrx_odoo
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (Change this to a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Optional - for payslip emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Face Recognition Service (Optional)
FACE_SERVICE_URL=http://localhost:5001
```

### 3.2 Frontend Configuration

Create `.env` file in `frontend/` directory:

```bash
cd ../frontend
```

Create file `.env` with following content:

```env
# API Base URL
VITE_API_URL=http://localhost:5000/api

# Face Recognition Service (Optional)
VITE_FACE_SERVICE_URL=http://localhost:5001
```

---

## 📦 Step 4: Install Dependencies

### 4.1 Backend Dependencies

```bash
cd backend
npm install
```

**Required packages will be installed:**
- express
- pg (PostgreSQL client)
- bcrypt (password hashing)
- jsonwebtoken (JWT authentication)
- cors
- dotenv
- pdfkit (PDF generation)
- nodemailer (email service)
- And more...

### 4.2 Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Required packages will be installed:**
- React
- Vite
- Redux Toolkit
- Tailwind CSS
- Lucide React (icons)
- And more...

---

## 🌱 Step 5: Seed the Database

Run the seeding script to populate the database with sample data:

```bash
cd backend
node scripts/seedDatabase.js
```

**This will create:**
- ✅ 1 Company (Tech Solutions Inc.)
- ✅ 8 Users (admin, hr, payroll, 5 employees)
- ✅ 4 Departments
- ✅ 8 Employee records
- ✅ 8 Salary structures
- ✅ 7 Salary components
- ✅ 4 Leave types
- ✅ 32 Leave allocations
- ✅ Sample attendance records for current month

**Default Login Credentials:**
```
Email: admin@techsolutions.com
Password: password123
Role: admin
```

**Other Users:**
```
hr@techsolutions.com - password123 (HR Manager)
payroll@techsolutions.com - password123 (Payroll Officer)
john.doe@techsolutions.com - password123 (Employee)
jane.smith@techsolutions.com - password123 (Employee)
mike.johnson@techsolutions.com - password123 (Employee)
sarah.williams@techsolutions.com - password123 (Employee)
david.brown@techsolutions.com - password123 (Employee)
```

---

## 🚀 Step 6: Run the Application

### Option 1: Run Both Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server will start on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Application will open on: `http://localhost:5173`

### Option 2: Use Batch Scripts (Windows)

From the root directory:

```bash
# Start all services
start-all.bat
```

---

## ✅ Step 7: Verify Installation

1. **Open browser** and go to: `http://localhost:5173`

2. **Login** with admin credentials:
   - Email: `admin@techsolutions.com`
   - Password: `password123`

3. **Check features:**
   - ✅ Dashboard loads
   - ✅ Employee directory shows 8 employees
   - ✅ Attendance page shows current month data
   - ✅ Leave management works
   - ✅ Payroll section accessible

---

## 🔄 Optional: Facial Recognition Setup

If you want to use facial recognition for attendance:

### 1. Install Python Dependencies

```bash
cd python
pip install -r requirements.txt
```

### 2. Start Face Recognition Service

```bash
cd python
python faceRecognition.py
```

Service will start on: `http://localhost:5001`

---

## 🐛 Troubleshooting

### Database Connection Error

**Error:** "Cannot connect to database"

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   # Windows
   net start postgresql-x64-14
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Verify `.env` credentials match PostgreSQL setup

3. Check if database exists:
   ```bash
   psql -U postgres -l
   ```

### Port Already in Use

**Error:** "Port 5000 is already in use"

**Solution:**
1. Change port in `backend/.env`:
   ```env
   PORT=5001
   ```

2. Update frontend `.env`:
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

### Module Not Found

**Error:** "Cannot find module..."

**Solution:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Schema Already Exists

**Error:** "relation already exists"

**Solution:**
```bash
# Drop and recreate database
psql -U postgres

DROP DATABASE hrx_odoo;
CREATE DATABASE hrx_odoo;
\q

# Re-run schema
cd backend
psql -U postgres -d hrx_odoo -f schema.sql
```

---

## 📊 Database Backup & Restore

### Backup Database

```bash
pg_dump -U postgres hrx_odoo > backup.sql
```

### Restore Database

```bash
psql -U postgres -d hrx_odoo < backup.sql
```

---

## 🔐 Security Recommendations

**For Production Deployment:**

1. **Change JWT Secret:**
   - Generate strong random string for `JWT_SECRET`

2. **Use Strong Database Password:**
   - Don't use default PostgreSQL password

3. **Enable HTTPS:**
   - Use SSL certificates for production

4. **Update CORS Settings:**
   - In `backend/index.js`, restrict CORS to your domain

5. **Change Default User Passwords:**
   - After first login, change all default passwords

---

## 📚 Additional Resources

- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Node.js Documentation:** https://nodejs.org/docs/
- **React Documentation:** https://react.dev/
- **Vite Documentation:** https://vitejs.dev/

---

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review console logs for error messages
3. Verify all prerequisites are installed correctly
4. Ensure all environment variables are set properly

---

## 📝 Notes

- Default password for all users is `password123` - **Change in production!**
- Database schema supports multi-company setup
- Attendance tracking uses weekday logic (Mon-Fri)
- Payroll calculates dynamically based on attendance
- Leave allocations are per calendar year

---

**🎉 You're all set! Happy coding!**
