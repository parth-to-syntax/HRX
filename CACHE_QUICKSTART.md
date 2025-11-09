# Quick Start: Implementing Caching

## Step 1: Install Dependencies

```bash
cd backend
npm install node-cache
```

## Step 2: Verify Files Created

✅ `backend/utils/cache.js` - Cache utility with 6 cache instances
✅ `backend/routes/cache.js` - Cache management endpoints
✅ `backend/index.js` - Updated with cache routes
✅ `CACHE_EXAMPLES.md` - Copy-paste ready controller examples

## Step 3: Start Your Server

```bash
npm start
```

## Step 4: Test Cache Endpoints

### Get Cache Statistics
```bash
curl http://localhost:5000/cache/stats
```

Expected response:
```json
{
  "success": true,
  "timestamp": "2025-01-11T10:30:00.000Z",
  "overall": {
    "totalHits": 0,
    "totalMisses": 0,
    "totalKeys": 0,
    "hitRate": "0.00"
  },
  "caches": {
    "user": { "hits": 0, "misses": 0, "keys": 0, "name": "User Cache" },
    "employee": { "hits": 0, "misses": 0, "keys": 0, "name": "Employee Cache" },
    "salary": { "hits": 0, "misses": 0, "keys": 0, "name": "Salary Cache" },
    "leaveType": { "hits": 0, "misses": 0, "keys": 0, "name": "Leave Type Cache" },
    "company": { "hits": 0, "misses": 0, "keys": 0, "name": "Company Cache" },
    "app": { "hits": 0, "misses": 0, "keys": 0, "name": "Application Cache" }
  }
}
```

### Clear All Caches (Admin only)
```bash
curl -X POST http://localhost:5000/cache/clear \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get Keys from Specific Cache
```bash
curl http://localhost:5000/cache/keys/employee \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 5: Add Caching to Controllers

Choose one controller to start with (I recommend leave types - easiest):

### Option A: Manual Implementation

1. Open `backend/controllers/leaveController.js`
2. Copy the "After (with caching)" code from `CACHE_EXAMPLES.md`
3. Replace your existing `listLeaveTypes` function
4. Add cache invalidation to `createLeaveType`, `updateLeaveType`, `deleteLeaveType`

### Option B: Use the Generic Helper

```javascript
import { withCache, leaveTypeCache } from '../utils/cache.js';

export async function listLeaveTypes(req, res) {
  try {
    const { company_id } = req.user;
    
    const leaveTypes = await withCache(
      `leave_types:${company_id}`,
      async () => {
        const result = await pool.query(
          'SELECT * FROM leave_types WHERE company_id = $1',
          [company_id]
        );
        return result.rows;
      },
      7200,  // 2 hours
      leaveTypeCache
    );
    
    res.json(leaveTypes);
  } catch (error) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({ message: 'Failed to fetch leave types' });
  }
}
```

## Step 6: Test Cache Performance

### Test 1: First Request (Cache Miss)
```bash
time curl http://localhost:5000/leaves/types \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected:** ~50-200ms (database query)

### Test 2: Second Request (Cache Hit)
```bash
time curl http://localhost:5000/leaves/types \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected:** ~5-20ms (from cache) ⚡

### Test 3: Check Statistics
```bash
curl http://localhost:5000/cache/stats
```
**Expected:**
```json
{
  "overall": {
    "totalHits": 1,
    "totalMisses": 1,
    "hitRate": "50.00"
  },
  "caches": {
    "leaveType": {
      "hits": 1,
      "misses": 1,
      "keys": 1
    }
  }
}
```

## Step 7: Monitor Performance

After implementing caching, monitor these metrics:

1. **Hit Rate** - Target: >70%
   - View at: `GET /cache/stats`
   - If <50%, increase TTL values

2. **Response Times** - Target: 50-90% faster
   - Use browser DevTools Network tab
   - Compare before/after caching

3. **Memory Usage** - Target: <100MB total
   - Check `cache/stats` → `ksize` field
   - If too high, reduce TTL or enable `maxKeys`

## Troubleshooting

### Cache not working?
1. Check server logs for "Cache HIT" / "Cache MISS" messages
2. Verify `node-cache` is installed: `npm list node-cache`
3. Check `/cache/stats` shows the cache instance

### Cache not clearing after updates?
1. Ensure you added cache invalidation to CREATE/UPDATE/DELETE functions
2. Example:
   ```javascript
   leaveTypeCache.del(`leave_types:${company_id}`);
   ```

### Too much memory usage?
1. Reduce TTL values in `cache.js`
2. Add `maxKeys` limit:
   ```javascript
   export const employeeCache = new NodeCache({
     stdTTL: 300,
     maxKeys: 1000  // Limit to 1000 employees
   });
   ```

## Next Steps

### Phase 1: Static Data (Start Here)
- ✅ Leave types
- ⏳ Salary components
- ⏳ Company settings

### Phase 2: User Data
- ⏳ Employee profiles
- ⏳ User access rules

### Phase 3: Computed Data
- ⏳ Payroll calculations
- ⏳ Attendance summaries
- ⏳ Report aggregations

## Performance Expectations

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| List leave types | 100ms | 10ms | **90% faster** |
| Get employee profile | 80ms | 8ms | **90% faster** |
| List salary components | 120ms | 12ms | **90% faster** |
| Get company settings | 90ms | 9ms | **90% faster** |

## Development Tips

### Enable Cache Debug Logging
In `backend/utils/cache.js`, uncomment these lines:
```javascript
setupDebugListeners(userCache, 'USER');
setupDebugListeners(employeeCache, 'EMPLOYEE');
setupDebugListeners(leaveTypeCache, 'LEAVE_TYPE');
```

You'll see detailed logs:
```
📦 [LEAVE_TYPE] SET: leave_types:1
✅ Cache HIT: leave_types:1
⏰ [LEAVE_TYPE] EXPIRED: leave_types:1
🗑️ [LEAVE_TYPE] DEL: leave_types:1
```

### Test Cache Invalidation
```bash
# 1. Get leave types (cache miss)
curl http://localhost:5000/leaves/types -H "Authorization: Bearer TOKEN"

# 2. Get again (cache hit)
curl http://localhost:5000/leaves/types -H "Authorization: Bearer TOKEN"

# 3. Create new leave type (should clear cache)
curl -X POST http://localhost:5000/leaves/types \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sick Leave","days_allowed":10}'

# 4. Get leave types (cache miss again - proves invalidation works)
curl http://localhost:5000/leaves/types -H "Authorization: Bearer TOKEN"
```

## Success Criteria

You've successfully implemented caching when:

1. ✅ `/cache/stats` returns data
2. ✅ Second identical request is 5-10x faster
3. ✅ Cache hit rate >70% after 1 hour of use
4. ✅ Cache clears after create/update operations
5. ✅ No stale data served to users

## Need Help?

- Check `CACHING_GUIDE.md` for complete documentation
- Review `CACHE_EXAMPLES.md` for more controller examples
- Monitor logs for cache HIT/MISS patterns
- Use `/cache/stats` endpoint to debug issues
