import NodeCache from 'node-cache';

/**
 * Cache Configuration for HRMS Application
 * 
 * Different cache instances for different data types with appropriate TTLs
 */

// User authentication and profile cache (10 minutes)
export const userCache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Better performance
  deleteOnExpire: true
});

// Employee data cache (5 minutes)
export const employeeCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60
});

// Salary components cache (1 hour - rarely changes)
export const salaryCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600 // 10 minutes
});

// Leave types cache (2 hours - very static)
export const leaveTypeCache = new NodeCache({
  stdTTL: 7200, // 2 hours
  checkperiod: 1800 // 30 minutes
});

// Company settings cache (30 minutes)
export const companyCache = new NodeCache({
  stdTTL: 1800, // 30 minutes
  checkperiod: 300 // 5 minutes
});

// Generic application cache (5 minutes default)
export const appCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 120
});

/**
 * Get statistics for all caches
 * Useful for monitoring and debugging
 */
export function getCacheStats() {
  return {
    user: {
      ...userCache.getStats(),
      name: 'User Cache'
    },
    employee: {
      ...employeeCache.getStats(),
      name: 'Employee Cache'
    },
    salary: {
      ...salaryCache.getStats(),
      name: 'Salary Cache'
    },
    leaveType: {
      ...leaveTypeCache.getStats(),
      name: 'Leave Type Cache'
    },
    company: {
      ...companyCache.getStats(),
      name: 'Company Cache'
    },
    app: {
      ...appCache.getStats(),
      name: 'Application Cache'
    }
  };
}

/**
 * Clear all caches
 * Useful for admin operations or when data integrity is critical
 */
export function clearAllCaches() {
  userCache.flushAll();
  employeeCache.flushAll();
  salaryCache.flushAll();
  leaveTypeCache.flushAll();
  companyCache.flushAll();
  appCache.flushAll();
  console.log('✅ All caches cleared');
}

/**
 * Clear cache for a specific company
 * Useful when company settings change
 */
export function clearCompanyCache(companyId) {
  const caches = [appCache, employeeCache, salaryCache, companyCache];
  
  caches.forEach(cache => {
    const keys = cache.keys();
    keys.forEach(key => {
      if (key.includes(`:${companyId}:`) || key.includes(`:${companyId}`)) {
        cache.del(key);
      }
    });
  });
  
  console.log(`✅ Cleared cache for company ${companyId}`);
}

/**
 * Clear cache for a specific employee
 * Useful when employee data is updated
 */
export function clearEmployeeCache(employeeId) {
  const patterns = [
    `employee:${employeeId}`,
    `salary:${employeeId}`,
    `attendance:${employeeId}`,
    `payroll:${employeeId}`
  ];
  
  const caches = [employeeCache, salaryCache, appCache];
  
  caches.forEach(cache => {
    const keys = cache.keys();
    keys.forEach(key => {
      patterns.forEach(pattern => {
        if (key.startsWith(pattern)) {
          cache.del(key);
        }
      });
    });
  });
  
  console.log(`✅ Cleared cache for employee ${employeeId}`);
}

/**
 * Generic cache helper with automatic key generation
 */
export async function withCache(key, fetchFn, ttl = 300, cacheInstance = appCache) {
  // Try to get from cache
  const cached = cacheInstance.get(key);
  if (cached !== undefined) {
    console.log(`✅ Cache HIT: ${key}`);
    return cached;
  }
  
  console.log(`❌ Cache MISS: ${key}`);
  
  // Fetch data
  const data = await fetchFn();
  
  // Store in cache
  cacheInstance.set(key, data, ttl);
  
  return data;
}

// Event listeners for debugging (development only)
if (process.env.NODE_ENV === 'development') {
  const setupDebugListeners = (cache, name) => {
    cache.on('set', (key, value) => {
      console.log(`📦 [${name}] SET: ${key}`);
    });
    
    cache.on('del', (key, value) => {
      console.log(`🗑️ [${name}] DEL: ${key}`);
    });
    
    cache.on('expired', (key, value) => {
      console.log(`⏰ [${name}] EXPIRED: ${key}`);
    });
    
    cache.on('flush', () => {
      console.log(`🧹 [${name}] FLUSH ALL`);
    });
  };
  
  // Uncomment to enable verbose logging
  // setupDebugListeners(userCache, 'USER');
  // setupDebugListeners(employeeCache, 'EMPLOYEE');
  // setupDebugListeners(salaryCache, 'SALARY');
  // setupDebugListeners(leaveTypeCache, 'LEAVE_TYPE');
  // setupDebugListeners(companyCache, 'COMPANY');
  // setupDebugListeners(appCache, 'APP');
}

export default appCache;
