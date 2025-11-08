# 🚀 Quick Start Guide - WorkZen HRMS

## ✅ Setup Complete!

Your WorkZen HRMS application is now ready to use. The development server is running at:

**http://localhost:5173**

## 🎯 Next Steps

1. **Open the application** in your browser: http://localhost:5173

2. **Login with demo credentials:**
   - **Admin:** john.doe@workzen.com / password123
   - **HR Officer:** jane.smith@workzen.com / password123
   - **Payroll Officer:** mike.johnson@workzen.com / password123
   - **Employee:** sarah.williams@workzen.com / password123

3. **Explore the features:**
   - ✅ Dashboard with analytics and KPI cards
   - ✅ Attendance management (check-in/check-out)
   - ✅ Leave management with approval workflow
   - ✅ Payroll with payslip details
   - ✅ Employee directory with search
   - ✅ Reports & analytics with charts
   - ✅ Settings (Admin only)
   - ✅ User profile management
   - ✅ Dark/Light theme toggle

## 🎨 Features Implemented

### ✨ UI/UX
- Responsive sidebar with collapse functionality
- Top navigation with search, notifications, and profile dropdown
- Dark/Light theme support
- Smooth animations with Framer Motion
- Professional color palette (teal, blue-gray, neutral)

### 🔐 Role-Based Access
- **Admin:** Full access to all features
- **HR Officer:** Employee management, leave approval, reports
- **Payroll Officer:** Payroll management, reports
- **Employee:** Personal dashboard, attendance, leave requests, payslips

### 📊 Data Management
- Redux Toolkit for state management
- Mock JSON data for demonstration
- Real-time updates in the UI
- Persistent user session

### 📱 Responsive Design
- Mobile-friendly layouts
- Tablet-optimized views
- Desktop full-width experience

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📂 Key Files to Customize

- **Color Theme:** `src/index.css` (CSS variables)
- **Routes:** `src/App.jsx`
- **Redux Store:** `src/redux/store.js`
- **Mock Data:** `src/data/*.json`
- **Components:** `src/components/`
- **Pages:** `src/pages/`

## 🎓 Understanding the Structure

### Redux Slices
Each module has its own Redux slice:
- `userSlice.js` - Authentication & user info
- `attendanceSlice.js` - Attendance records
- `leaveSlice.js` - Leave requests & balance
- `payrollSlice.js` - Payslips
- `employeesSlice.js` - Employee directory
- `settingsSlice.js` - System settings

### Protected Routes
Routes are protected based on authentication:
- Unauthenticated users → Redirected to login
- Authenticated users → Access to dashboard and features

### Role-Based UI
Components check user role from Redux:
```javascript
const { currentUser } = useSelector((state) => state.user)
const isAdmin = currentUser?.role === 'Admin'
```

## 🎨 Customization Tips

### Change Primary Color
Edit `src/index.css`:
```css
--primary: 180 70% 45%; /* Teal */
```

### Add New Page
1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add sidebar link in `src/components/layout/Sidebar.jsx`
4. Create Redux slice if needed

### Modify Mock Data
Edit JSON files in `src/data/` to change demo data

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
# Or change port in vite.config.js
```

### Dependencies issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### Dark theme not working
Check browser's localStorage for theme preference

## 📚 Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **Redux Toolkit** - State management
- **React Router v6** - Routing
- **Recharts** - Charts
- **Material UI** - Data grid & components
- **Framer Motion** - Animations
- **Lucide React** - Icons

## 🎉 You're All Set!

The application is fully functional with:
- ✅ 8+ pages implemented
- ✅ Full CRUD operations (simulated)
- ✅ Role-based access control
- ✅ Responsive design
- ✅ Mock data integration
- ✅ Charts and analytics
- ✅ Form validations
- ✅ Theme support

**Enjoy exploring WorkZen HRMS!** 🚀

---

For more details, check `README.md`
