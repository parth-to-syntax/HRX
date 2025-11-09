# Caching Implementation Guide (Without Redis)

## 🚀 Caching Strategies for Your HRMS Application

This guide shows how to implement **efficient caching** without Redis, using **in-memory caching** and **lightweight libraries**.

---

## 📊 What Should Be Cached?

Based on your application, here are the best candidates:

### ✅ **High-Value Cache Targets**

1. **User Authentication** - JWT token validation, user roles
2. **Employee Data** - Frequently accessed employee profiles
3. **Salary Components** - Rarely change, frequently read
4. **Leave Types** - Static data, perfect for caching
5. **Company Settings** - Low change frequency
6. **Access Control Rules** - Checked on every request
7. **Payroll Calculations** - Expensive computations
8. **Attendance Summaries** - Aggregated data

### ❌ **Don't Cache**

- Real-time attendance check-in/out
- Password reset tokens (security risk)
- Active sessions (if distributed system)
- Frequently changing data (defeats purpose)

---

## 🎯 Solution 1: Node-Cache (Recommended)

### Why Node-Cache?
- ✅ Simple, lightweight (no dependencies)
- ✅ TTL (Time To Live) support
- ✅ Automatic cleanup
- ✅ Statistics and monitoring
- ✅ Perfect for single-server deployments

### Installation

```bash
cd backend
npm install node-cache
```

### Implementation

**Create `backend/utils/cache.js`:**

```javascript
import NodeCache from 'node-cache';

// Create cache instances with different TTLs
export const userCache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Better performance, careful with mutations
  deleteOnExpire: true
});

export const employeeCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60
});

export const salaryCache = new NodeCache({
  stdTTL: 3600, // 1 hour (salary components rarely change)
  checkperiod: 600
});

export const leaveTypeCache = new NodeCache({
  stdTTL: 7200, // 2 hours (leave types are very static)
  checkperiod: 1800
});

export const companyCache = new NodeCache({
  stdTTL: 1800, // 30 minutes
  checkperiod: 300
});

// Generic cache with configurable TTL
export const appCache = new NodeCache({
  stdTTL: 300, // Default 5 minutes
  checkperiod: 120
});

// Cache statistics (for monitoring)
export function getCacheStats() {
  return {
    user: userCache.getStats(),
    employee: employeeCache.getStats(),
    salary: salaryCache.getStats(),
    leaveType: leaveTypeCache.getStats(),
    company: companyCache.getStats(),
    app: appCache.getStats()
  };
}

// Clear all caches (useful for admin operations)
export function clearAllCaches() {
  userCache.flushAll();
  employeeCache.flushAll();
  salaryCache.flushAll();
  leaveTypeCache.flushAll();
  companyCache.flushAll();
  appCache.flushAll();
  console.log('✅ All caches cleared');
}

// Clear specific company data (when company settings change)
export function clearCompanyCache(companyId) {
  const keys = [
    `company:${companyId}`,
    `employees:${companyId}:*`,
    `salary:${companyId}:*`,
    `payroll:${companyId}:*`
  ];
  
  keys.forEach(pattern => {
    // Get all keys matching pattern
    const matchingKeys = appCache.keys().filter(key => 
      key.startsWith(pattern.replace('*', ''))
    );
    matchingKeys.forEach(key => appCache.del(key));
  });
  
  console.log(`✅ Cleared cache for company ${companyId}`);
}

// Event listeners for debugging
if (process.env.NODE_ENV === 'development') {
  userCache.on('set', (key, value) => {
    console.log(`📦 Cache SET: ${key}`);
  });
  
  userCache.on('expired', (key, value) => {
    console.log(`⏰ Cache EXPIRED: ${key}`);
  });
}

export default appCache;
```

---

## 💡 Usage Examples

### 1. **Caching Leave Types**

**Update `backend/controllers/leaveController.js`:**

```javascript
import { leaveTypeCache } from '../utils/cache.js';

export async function listLeaveTypes(req, res) {
  try {
    const cacheKey = 'leave_types:all';
    
    // Try to get from cache first
    const cached = leaveTypeCache.get(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT: leave types');
      return res.json(cached);
    }
    
    console.log('❌ Cache MISS: leave types');
    
    // Fetch from database
    const { rows } = await pool.query(
      'SELECT id, name, is_paid FROM leave_types ORDER BY name ASC'
    );
    
    // Store in cache
    leaveTypeCache.set(cacheKey, rows);
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createLeaveType(req, res) {
  try {
    const { name, is_paid } = req.body;
    
    const { rows } = await pool.query(
      'INSERT INTO leave_types (name, is_paid) VALUES ($1,$2) RETURNING id, name, is_paid',
      [name, !!is_paid]
    );
    
    // Invalidate cache after creating new leave type
    leaveTypeCache.del('leave_types:all');
    console.log('🗑️ Invalidated leave types cache');
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

### 2. **Caching Employee Data**

**Update `backend/controllers/employeesController.js`:**

```javascript
import { employeeCache } from '../utils/cache.js';

export async function getMyProfile(req, res) {
  try {
    const userId = req.user.id;
    const cacheKey = `employee:profile:${userId}`;
    
    // Check cache
    const cached = employeeCache.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: employee profile ${userId}`);
      return res.json(cached);
    }
    
    console.log(`❌ Cache MISS: employee profile ${userId}`);
    
    // Fetch from database
    const profile = await getMyProfile(userId); // Your existing function
    
    // Cache for 5 minutes
    employeeCache.set(cacheKey, profile);
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateMyProfile(req, res) {
  try {
    const userId = req.user.id;
    
    // Update database
    const updated = await updateMyProfile(userId, req.body);
    
    // Invalidate cache
    employeeCache.del(`employee:profile:${userId}`);
    console.log(`🗑️ Invalidated cache for employee ${userId}`);
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

### 3. **Caching Salary Components**

**Update `backend/controllers/salaryController.js`:**

```javascript
import { salaryCache } from '../utils/cache.js';

export async function listComponents(req, res) {
  try {
    const { employee_id } = req.params;
    const companyId = req.user.company_id;
    const cacheKey = `salary:components:${employee_id}`;
    
    // Check cache
    const cached = salaryCache.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: salary components ${employee_id}`);
      return res.json(cached);
    }
    
    console.log(`❌ Cache MISS: salary components ${employee_id}`);
    
    // Verify employee belongs to company
    const empQ = await pool.query(
      'SELECT id FROM employees WHERE id=$1 AND company_id=$2',
      [employee_id, companyId]
    );
    if (!empQ.rows.length) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Fetch salary structure
    const salQ = await pool.query(
      'SELECT * FROM salary_structure WHERE employee_id=$1',
      [employee_id]
    );
    
    const compsQ = await pool.query(
      'SELECT * FROM salary_components WHERE employee_id=$1',
      [employee_id]
    );
    
    const result = {
      structure: salQ.rows[0] || null,
      components: compsQ.rows
    };
    
    // Cache for 1 hour (salary rarely changes)
    salaryCache.set(cacheKey, result, 3600);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateStructure(req, res) {
  try {
    const { employee_id } = req.params;
    
    // Update database
    const updated = await updateSalaryStructure(employee_id, req.body);
    
    // Invalidate related caches
    salaryCache.del(`salary:components:${employee_id}`);
    salaryCache.del(`salary:structure:${employee_id}`);
    employeeCache.del(`employee:profile:${employee_id}`);
    
    console.log(`🗑️ Invalidated salary cache for employee ${employee_id}`);
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

### 4. **Caching Access Control Rules**

**Update `backend/utils/access.js`:**

```javascript
import { appCache } from './cache.js';

export async function getUserRights(userId) {
  const cacheKey = `access:rights:${userId}`;
  
  // Check cache first
  const cached = appCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch from database
  const { rows } = await pool.query(
    `SELECT u.role, c.settings 
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.id = $1`,
    [userId]
  );
  
  if (!rows.length) return DEFAULT_RIGHTS;
  
  const user = rows[0];
  const role = (user.role || 'employee').toLowerCase();
  const customRights = user.settings?.rights || {};
  
  const rights = {
    ...DEFAULT_RIGHTS[role],
    ...customRights
  };
  
  // Cache for 10 minutes
  appCache.set(cacheKey, rights, 600);
  
  return rights;
}

// Clear user rights cache when role changes
export function invalidateUserRights(userId) {
  appCache.del(`access:rights:${userId}`);
  console.log(`🗑️ Invalidated access rights for user ${userId}`);
}
```

---

### 5. **Caching Payroll Calculations**

**Update `backend/controllers/payrollController.js`:**

```javascript
import { appCache } from '../utils/cache.js';

async function computePayslipForEmployee(empId, month, year) {
  const cacheKey = `payroll:computed:${empId}:${year}-${month}`;
  
  // Check cache (payslip calculations are expensive)
  const cached = appCache.get(cacheKey);
  if (cached) {
    console.log(`✅ Cache HIT: payslip computation ${empId} ${year}-${month}`);
    return cached;
  }
  
  console.log(`❌ Cache MISS: payslip computation ${empId} ${year}-${month}`);
  
  // Your existing calculation logic
  const salary = await getSalaryStructure(empId);
  const attendance = await getAttendance(empId, month, year);
  const leaves = await getLeaves(empId, month, year);
  
  // Complex calculations...
  const result = {
    basicWage,
    grossWage,
    netWage,
    employerCost,
    // ... all computed values
  };
  
  // Cache for 30 minutes (until recompute is triggered)
  appCache.set(cacheKey, result, 1800);
  
  return result;
}

export async function recomputePayslip(req, res) {
  try {
    const { id } = req.params;
    
    // Get payslip details
    const ps = await pool.query('SELECT * FROM payslips WHERE id=$1', [id]);
    const payslip = ps.rows[0];
    
    // Clear cache before recomputing
    const cacheKey = `payroll:computed:${payslip.employee_id}:${payslip.period_year}-${payslip.period_month}`;
    appCache.del(cacheKey);
    
    // Recompute
    const computed = await computePayslipForEmployee(
      payslip.employee_id,
      payslip.period_month,
      payslip.period_year
    );
    
    // Update database
    await pool.query(
      'UPDATE payslips SET basic_wage=$1, gross_wage=$2, net_wage=$3 WHERE id=$4',
      [computed.basicWage, computed.grossWage, computed.netWage, id]
    );
    
    res.json({ message: 'Payslip recomputed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## 🔧 Solution 2: LRU Cache (For Memory-Constrained Environments)

If you're worried about memory usage, use **LRU Cache** (Least Recently Used):

### Installation

```bash
npm install lru-cache
```

### Implementation

**Create `backend/utils/lruCache.js`:**

```javascript
import { LRUCache } from 'lru-cache';

// LRU Cache with size limit
export const employeeLRU = new LRUCache({
  max: 500, // Maximum 500 items
  maxSize: 5000, // 5KB per item roughly
  sizeCalculation: (value, key) => {
    return JSON.stringify(value).length;
  },
  ttl: 1000 * 60 * 5, // 5 minutes
  allowStale: false,
  updateAgeOnGet: true, // Reset TTL on access
  updateAgeOnHas: false
});

export const salaryLRU = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1 hour
});

// Usage is same as node-cache
employeeLRU.set('key', value);
const data = employeeLRU.get('key');
employeeLRU.delete('key');
```

---

## 📦 Solution 3: Memory-Efficient JSON Caching

For large datasets (like attendance records), use file-based caching:

**Create `backend/utils/fileCache.js`:**

```javascript
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), '.cache');

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// Generate cache key hash
function getCacheFilePath(key) {
  const hash = crypto.createHash('md5').update(key).digest('hex');
  return path.join(CACHE_DIR, `${hash}.json`);
}

export async function setFileCache(key, data, ttlSeconds = 300) {
  await ensureCacheDir();
  
  const cacheData = {
    data,
    expiresAt: Date.now() + (ttlSeconds * 1000),
    key // Store original key for debugging
  };
  
  const filePath = getCacheFilePath(key);
  await fs.writeFile(filePath, JSON.stringify(cacheData), 'utf8');
}

export async function getFileCache(key) {
  try {
    const filePath = getCacheFilePath(key);
    const content = await fs.readFile(filePath, 'utf8');
    const cacheData = JSON.parse(content);
    
    // Check if expired
    if (Date.now() > cacheData.expiresAt) {
      await fs.unlink(filePath); // Delete expired cache
      return null;
    }
    
    return cacheData.data;
  } catch (err) {
    if (err.code === 'ENOENT') return null; // Cache miss
    throw err;
  }
}

export async function deleteFileCache(key) {
  try {
    const filePath = getCacheFilePath(key);
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

export async function clearFileCache() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    await Promise.all(
      files.map(file => fs.unlink(path.join(CACHE_DIR, file)))
    );
    console.log('✅ File cache cleared');
  } catch (err) {
    console.error('Error clearing file cache:', err);
  }
}

// Usage example: Cache large attendance reports
export async function getAttendanceReport(companyId, month, year) {
  const cacheKey = `attendance:report:${companyId}:${year}-${month}`;
  
  // Try cache first
  const cached = await getFileCache(cacheKey);
  if (cached) {
    console.log('✅ File cache HIT');
    return cached;
  }
  
  // Generate report (expensive operation)
  const report = await generateAttendanceReport(companyId, month, year);
  
  // Cache for 24 hours
  await setFileCache(cacheKey, report, 86400);
  
  return report;
}
```

---

## 🎯 Middleware for Automatic Caching

**Create `backend/middleware/cacheMiddleware.js`:**

```javascript
import { appCache } from '../utils/cache.js';

// Automatic response caching middleware
export function cacheResponse(ttl = 300) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate cache key from URL and query params
    const cacheKey = `response:${req.originalUrl}`;
    
    // Check cache
    const cached = appCache.get(cacheKey);
    if (cached) {
      console.log(`✅ Response cache HIT: ${req.originalUrl}`);
      return res.json(cached);
    }
    
    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Cache successful responses only
      if (res.statusCode === 200) {
        appCache.set(cacheKey, data, ttl);
        console.log(`📦 Cached response: ${req.originalUrl}`);
      }
      return originalJson(data);
    };
    
    next();
  };
}

// Usage in routes
// router.get('/leave-types', cacheResponse(3600), listLeaveTypes);
```

---

## 📊 Cache Monitoring Dashboard

**Create `backend/routes/admin.js` endpoint:**

```javascript
import { getCacheStats, clearAllCaches } from '../utils/cache.js';

// GET /admin/cache/stats - View cache statistics
router.get('/cache/stats', authRequired, rolesAllowed('admin'), (req, res) => {
  const stats = getCacheStats();
  
  const summary = Object.entries(stats).map(([name, data]) => ({
    cache: name,
    keys: data.keys,
    hits: data.hits,
    misses: data.misses,
    hitRate: data.hits / (data.hits + data.misses) || 0,
    ksize: data.ksize,
    vsize: data.vsize
  }));
  
  res.json({
    caches: summary,
    totalKeys: summary.reduce((sum, c) => sum + c.keys, 0),
    averageHitRate: summary.reduce((sum, c) => sum + c.hitRate, 0) / summary.length
  });
});

// POST /admin/cache/clear - Clear all caches
router.post('/cache/clear', authRequired, rolesAllowed('admin'), (req, res) => {
  clearAllCaches();
  res.json({ message: 'All caches cleared successfully' });
});
```

---

## 🔄 Cache Invalidation Strategies

### 1. **Time-based (TTL)**
```javascript
// Expires automatically after TTL
appCache.set('key', value, 300); // 5 minutes
```

### 2. **Event-based (Manual)**
```javascript
// Invalidate when data changes
async function updateEmployee(id, data) {
  await pool.query('UPDATE employees SET ... WHERE id=$1', [id]);
  employeeCache.del(`employee:profile:${id}`);
  appCache.del(`employee:salary:${id}`);
}
```

### 3. **Tag-based (Grouped Invalidation)**
```javascript
// Clear all employee-related caches
function clearEmployeeCaches(employeeId) {
  const patterns = [
    `employee:${employeeId}:*`,
    `salary:${employeeId}:*`,
    `attendance:${employeeId}:*`,
    `payroll:${employeeId}:*`
  ];
  
  patterns.forEach(pattern => {
    appCache.keys().filter(k => k.startsWith(pattern.replace('*', '')))
      .forEach(k => appCache.del(k));
  });
}
```

### 4. **Lazy Invalidation (Stale-While-Revalidate)**
```javascript
async function getCachedData(key, fetchFn, ttl = 300) {
  const cached = appCache.get(key);
  
  if (cached) {
    // Return cached data immediately
    setImmediate(async () => {
      // Refresh cache in background
      const fresh = await fetchFn();
      appCache.set(key, fresh, ttl);
    });
    return cached;
  }
  
  // Fetch and cache
  const data = await fetchFn();
  appCache.set(key, data, ttl);
  return data;
}
```

---

## 📈 Performance Comparison

| Strategy | Speed | Memory | Scalability | Use Case |
|----------|-------|--------|-------------|----------|
| **node-cache** | ⚡⚡⚡ | 🔴 High | ⚠️ Single Server | Best for most apps |
| **lru-cache** | ⚡⚡⚡ | 🟢 Controlled | ⚠️ Single Server | Memory-constrained |
| **File Cache** | ⚡ Slower | 🟢 Low | ✅ Multi-server | Large datasets |
| **Redis** | ⚡⚡ | 🟡 Medium | ✅✅ Distributed | Multi-server apps |

**For your app:** Use **node-cache** for simplicity and performance on single server!

---

## 🚀 Quick Start Implementation

### Step 1: Install
```bash
cd backend
npm install node-cache
```

### Step 2: Create Cache Utility
Create `backend/utils/cache.js` with the code from Solution 1 above.

### Step 3: Update One Controller
Start with leave types (easiest):
```javascript
import { leaveTypeCache } from '../utils/cache.js';

// Update listLeaveTypes and createLeaveType functions
```

### Step 4: Test
```bash
# Start server
npm run dev

# Call endpoint twice
curl http://localhost:3000/api/leaves/types
curl http://localhost:3000/api/leaves/types  # Should be faster!
```

### Step 5: Expand
Apply caching to other controllers gradually.

---

## 🎯 Recommended Caching Plan

### Phase 1: Static Data (Easy Wins)
- ✅ Leave types
- ✅ Company settings
- ✅ Access control rules

### Phase 2: User Data (Medium Impact)
- ✅ Employee profiles
- ✅ Salary components
- ✅ Leave allocations

### Phase 3: Computed Data (High Impact)
- ✅ Payroll calculations
- ✅ Attendance summaries
- ✅ Reports

---

## 💡 Best Practices

1. **Cache Key Naming Convention**
   ```javascript
   // Good: namespace:entity:id:field
   employee:profile:123
   salary:components:456
   payroll:computed:789:2025-01
   
   // Bad
   emp123
   salary456
   ```

2. **Always Invalidate After Updates**
   ```javascript
   async function updateData(id, data) {
     await db.update(id, data);
     cache.del(`entity:${id}`); // IMPORTANT!
   }
   ```

3. **Use Different TTLs for Different Data**
   - Static data: 1-2 hours
   - User data: 5-10 minutes
   - Computed data: 30 minutes
   - Real-time data: Don't cache!

4. **Monitor Cache Hit Rates**
   - Target: >70% hit rate
   - If <50%: TTL too short or wrong data cached
   - If >95%: TTL might be too long

---

## 🔍 Debugging Cache Issues

```javascript
// Enable verbose logging in development
if (process.env.NODE_ENV === 'development') {
  appCache.on('set', (key) => console.log(`📦 SET: ${key}`));
  appCache.on('del', (key) => console.log(`🗑️ DEL: ${key}`));
  appCache.on('expired', (key) => console.log(`⏰ EXPIRED: ${key}`));
  appCache.on('flush', () => console.log(`🧹 FLUSH ALL`));
}
```

---

**Ready to implement?** Start with Solution 1 (node-cache) for the best balance of simplicity and performance! 🚀

