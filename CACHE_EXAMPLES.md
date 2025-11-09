# Caching Implementation Examples

This file contains ready-to-use examples for adding caching to your controllers.

## 1. Leave Types Controller

### Before (leaveController.js):
```javascript
export async function listLeaveTypes(req, res) {
  const { company_id } = req.user;
  const result = await pool.query(
    'SELECT * FROM leave_types WHERE company_id = $1',
    [company_id]
  );
  res.json(result.rows);
}
```

### After (with caching):
```javascript
import { leaveTypeCache } from '../utils/cache.js';

export async function listLeaveTypes(req, res) {
  try {
    const { company_id } = req.user;
    const cacheKey = `leave_types:${company_id}`;
    
    // Try cache first
    const cached = leaveTypeCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Cache miss - fetch from database
    const result = await pool.query(
      'SELECT * FROM leave_types WHERE company_id = $1',
      [company_id]
    );
    
    // Store in cache (will auto-expire in 2 hours)
    leaveTypeCache.set(cacheKey, result.rows);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({ message: 'Failed to fetch leave types' });
  }
}

// Don't forget to invalidate cache on updates!
export async function createLeaveType(req, res) {
  try {
    const { company_id } = req.user;
    const { name, description, days_allowed } = req.body;
    
    const result = await pool.query(
      'INSERT INTO leave_types (name, description, days_allowed, company_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, days_allowed, company_id]
    );
    
    // Invalidate cache after creating new leave type
    leaveTypeCache.del(`leave_types:${company_id}`);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating leave type:', error);
    res.status(500).json({ message: 'Failed to create leave type' });
  }
}

export async function updateLeaveType(req, res) {
  try {
    const { company_id } = req.user;
    const { id } = req.params;
    const { name, description, days_allowed } = req.body;
    
    const result = await pool.query(
      'UPDATE leave_types SET name=$1, description=$2, days_allowed=$3 WHERE id=$4 AND company_id=$5 RETURNING *',
      [name, description, days_allowed, id, company_id]
    );
    
    // Invalidate cache after update
    leaveTypeCache.del(`leave_types:${company_id}`);
    
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Leave type not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating leave type:', error);
    res.status(500).json({ message: 'Failed to update leave type' });
  }
}
```

---

## 2. Employee Profile Controller

### Before (employeesController.js):
```javascript
export async function getMyProfile(req, res) {
  const { id } = req.user;
  const result = await pool.query(
    'SELECT * FROM employees WHERE id = $1',
    [id]
  );
  res.json(result.rows[0]);
}
```

### After (with caching):
```javascript
import { employeeCache } from '../utils/cache.js';

export async function getMyProfile(req, res) {
  try {
    const { id } = req.user;
    const cacheKey = `employee:${id}`;
    
    // Try cache first
    const cached = employeeCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Cache miss - fetch from database
    const result = await pool.query(
      'SELECT * FROM employees WHERE id = $1',
      [id]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Store in cache (will auto-expire in 5 minutes)
    employeeCache.set(cacheKey, result.rows[0]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
}

// Invalidate cache on profile update
export async function updateMyProfile(req, res) {
  try {
    const { id } = req.user;
    const { phone, address, emergency_contact, bio } = req.body;
    
    const result = await pool.query(
      'UPDATE employees SET phone=$1, address=$2, emergency_contact=$3, bio=$4 WHERE id=$5 RETURNING *',
      [phone, address, emergency_contact, bio, id]
    );
    
    // Invalidate cache after update
    employeeCache.del(`employee:${id}`);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
}
```

---

## 3. Salary Components Controller

### Before (salaryController.js):
```javascript
export async function listComponents(req, res) {
  const { company_id } = req.user;
  const result = await pool.query(
    'SELECT * FROM salary_components WHERE company_id = $1',
    [company_id]
  );
  res.json(result.rows);
}
```

### After (with caching):
```javascript
import { salaryCache } from '../utils/cache.js';

export async function listComponents(req, res) {
  try {
    const { company_id } = req.user;
    const cacheKey = `salary_components:${company_id}`;
    
    // Try cache first
    const cached = salaryCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Cache miss - fetch from database
    const result = await pool.query(
      'SELECT * FROM salary_components WHERE company_id = $1',
      [company_id]
    );
    
    // Store in cache (will auto-expire in 1 hour)
    salaryCache.set(cacheKey, result.rows);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching salary components:', error);
    res.status(500).json({ message: 'Failed to fetch salary components' });
  }
}

// Invalidate cache on create/update/delete
export async function createComponent(req, res) {
  try {
    const { company_id } = req.user;
    const { name, component_type, amount, is_taxable } = req.body;
    
    const result = await pool.query(
      'INSERT INTO salary_components (name, component_type, amount, is_taxable, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, component_type, amount, is_taxable, company_id]
    );
    
    // Invalidate cache
    salaryCache.del(`salary_components:${company_id}`);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating salary component:', error);
    res.status(500).json({ message: 'Failed to create salary component' });
  }
}
```

---

## 4. Using the Generic Cache Helper

For even simpler implementation, use the `withCache` helper:

```javascript
import { withCache, employeeCache } from '../utils/cache.js';

export async function getMyProfile(req, res) {
  try {
    const { id } = req.user;
    
    const profile = await withCache(
      `employee:${id}`,  // Cache key
      async () => {       // Fetch function
        const result = await pool.query(
          'SELECT * FROM employees WHERE id = $1',
          [id]
        );
        return result.rows[0];
      },
      300,                // TTL in seconds (5 minutes)
      employeeCache       // Cache instance to use
    );
    
    if (!profile) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
}
```

---

## 5. Company Settings Example

```javascript
import { companyCache } from '../utils/cache.js';

export async function getCompanySettings(req, res) {
  try {
    const { company_id } = req.user;
    const cacheKey = `company_settings:${company_id}`;
    
    const cached = companyCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const result = await pool.query(
      'SELECT * FROM companies WHERE id = $1',
      [company_id]
    );
    
    companyCache.set(cacheKey, result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ message: 'Failed to fetch company settings' });
  }
}

export async function updateCompanySettings(req, res) {
  try {
    const { company_id } = req.user;
    const { name, timezone, working_hours_per_day } = req.body;
    
    const result = await pool.query(
      'UPDATE companies SET name=$1, timezone=$2, working_hours_per_day=$3 WHERE id=$4 RETURNING *',
      [name, timezone, working_hours_per_day, company_id]
    );
    
    // Invalidate company cache
    companyCache.del(`company_settings:${company_id}`);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({ message: 'Failed to update company settings' });
  }
}
```

---

## Quick Implementation Checklist

1. ✅ Install node-cache: `npm install node-cache`
2. ✅ Cache utility created: `backend/utils/cache.js`
3. ✅ Cache routes created: `backend/routes/cache.js`
4. ✅ Routes registered in `index.js`
5. ⏳ Update controllers (copy examples above)
6. ⏳ Test with: `GET http://localhost:5000/cache/stats`

## Cache Key Naming Conventions

Use consistent patterns:
- Leave types: `leave_types:{company_id}`
- Employee: `employee:{employee_id}`
- Salary components: `salary_components:{company_id}`
- Company settings: `company_settings:{company_id}`
- Employee salary: `employee_salary:{employee_id}`
- Attendance summary: `attendance:{employee_id}:{month}`

## When to Invalidate Cache

**Always invalidate** after these operations:
- CREATE - Clear list cache for that company
- UPDATE - Clear specific item cache AND list cache
- DELETE - Clear specific item cache AND list cache

**Example pattern:**
```javascript
// After creating a leave type
leaveTypeCache.del(`leave_types:${company_id}`);

// After updating an employee
employeeCache.del(`employee:${employee_id}`);
clearEmployeeCache(employee_id); // Clears all related caches

// After bulk operations
clearAllCaches(); // Nuclear option - use sparingly
```
