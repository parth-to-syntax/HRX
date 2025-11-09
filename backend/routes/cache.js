import express from 'express';
import { authRequired, rolesAllowed } from '../middleware/auth.js';
import { 
  getCacheStats, 
  clearAllCaches, 
  clearCompanyCache, 
  clearEmployeeCache,
  userCache,
  employeeCache,
  salaryCache,
  leaveTypeCache,
  companyCache,
  appCache
} from '../utils/cache.js';

const router = express.Router();

/**
 * Get cache statistics
 * Shows hit rates, keys count, and performance metrics
 */
router.get('/stats', authRequired, rolesAllowed('admin', 'hr'), (req, res) => {
  try {
    const stats = getCacheStats();
    
    // Calculate overall statistics
    const overall = {
      totalHits: 0,
      totalMisses: 0,
      totalKeys: 0,
      hitRate: 0
    };
    
    Object.values(stats).forEach(cacheStat => {
      overall.totalHits += cacheStat.hits || 0;
      overall.totalMisses += cacheStat.misses || 0;
      overall.totalKeys += cacheStat.keys || 0;
    });
    
    overall.hitRate = overall.totalHits + overall.totalMisses > 0
      ? ((overall.totalHits / (overall.totalHits + overall.totalMisses)) * 100).toFixed(2)
      : 0;
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      overall,
      caches: stats
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cache statistics'
    });
  }
});

/**
 * Clear all caches
 * Use with caution - will temporarily slow down the application
 */
router.post('/clear', authRequired, rolesAllowed('admin'), (req, res) => {
  try {
    clearAllCaches();
    
    res.json({
      success: true,
      message: 'All caches cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing caches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear caches'
    });
  }
});

/**
 * Clear cache for specific company
 */
router.post('/clear/company/:companyId', authRequired, rolesAllowed('admin'), (req, res) => {
  try {
    const { companyId } = req.params;
    clearCompanyCache(companyId);
    
    res.json({
      success: true,
      message: `Cache cleared for company ${companyId}`
    });
  } catch (error) {
    console.error('Error clearing company cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear company cache'
    });
  }
});

/**
 * Clear cache for specific employee
 */
router.post('/clear/employee/:employeeId', authRequired, rolesAllowed('admin', 'hr'), (req, res) => {
  try {
    const { employeeId } = req.params;
    clearEmployeeCache(employeeId);
    
    res.json({
      success: true,
      message: `Cache cleared for employee ${employeeId}`
    });
  } catch (error) {
    console.error('Error clearing employee cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear employee cache'
    });
  }
});

/**
 * Clear specific cache by name
 */
router.post('/clear/:cacheName', authRequired, rolesAllowed('admin'), (req, res) => {
  try {
    const { cacheName } = req.params;
    
    const cacheMap = {
      user: userCache,
      employee: employeeCache,
      salary: salaryCache,
      leaveType: leaveTypeCache,
      company: companyCache,
      app: appCache
    };
    
    const cache = cacheMap[cacheName];
    if (!cache) {
      return res.status(400).json({
        success: false,
        message: `Invalid cache name: ${cacheName}`,
        validNames: Object.keys(cacheMap)
      });
    }
    
    cache.flushAll();
    
    res.json({
      success: true,
      message: `Cache '${cacheName}' cleared successfully`
    });
  } catch (error) {
    console.error('Error clearing specific cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

/**
 * Get keys from specific cache
 */
router.get('/keys/:cacheName', authRequired, rolesAllowed('admin'), (req, res) => {
  try {
    const { cacheName } = req.params;
    
    const cacheMap = {
      user: userCache,
      employee: employeeCache,
      salary: salaryCache,
      leaveType: leaveTypeCache,
      company: companyCache,
      app: appCache
    };
    
    const cache = cacheMap[cacheName];
    if (!cache) {
      return res.status(400).json({
        success: false,
        message: `Invalid cache name: ${cacheName}`,
        validNames: Object.keys(cacheMap)
      });
    }
    
    const keys = cache.keys();
    
    res.json({
      success: true,
      cacheName,
      keyCount: keys.length,
      keys
    });
  } catch (error) {
    console.error('Error fetching cache keys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cache keys'
    });
  }
});

export default router;
