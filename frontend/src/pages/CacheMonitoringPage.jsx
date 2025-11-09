import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

/**
 * Cache Monitoring Dashboard
 * View cache statistics and manage caches
 * Only visible to Admin/HR roles
 */
export default function CacheMonitoringPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/cache/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllCaches = async () => {
    if (!confirm('Are you sure you want to clear all caches? This will temporarily slow down the application.')) {
      return;
    }
    
    setClearing(true);
    try {
      const response = await fetch('http://localhost:5000/cache/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        alert('All caches cleared successfully!');
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error clearing caches:', error);
      alert('Failed to clear caches');
    } finally {
      setClearing(false);
    }
  };

  const clearSpecificCache = async (cacheName) => {
    if (!confirm(`Clear ${cacheName} cache?`)) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/cache/clear/${cacheName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        alert(`${cacheName} cache cleared!`);
        fetchStats();
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear cache');
    }
  };

  useEffect(() => {
    fetchStats();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading cache statistics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Failed to load cache statistics</div>
      </div>
    );
  }

  const getHitRateColor = (hitRate) => {
    const rate = parseFloat(hitRate);
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Cache Monitoring</h1>
          <p className="text-gray-600">Monitor cache performance and hit rates</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
          >
            {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
          </Button>
          <Button onClick={fetchStats} variant="outline">
            🔄 Refresh Now
          </Button>
          <Button 
            onClick={clearAllCaches} 
            variant="destructive"
            disabled={clearing}
          >
            {clearing ? 'Clearing...' : '🗑️ Clear All Caches'}
          </Button>
        </div>
      </div>

      {/* Overall Statistics */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Overall Performance</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatNumber(stats.overall.totalHits)}
            </div>
            <div className="text-sm text-gray-600">Cache Hits</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {formatNumber(stats.overall.totalMisses)}
            </div>
            <div className="text-sm text-gray-600">Cache Misses</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatNumber(stats.overall.totalKeys)}
            </div>
            <div className="text-sm text-gray-600">Total Keys</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getHitRateColor(stats.overall.hitRate)}`}>
              {stats.overall.hitRate}%
            </div>
            <div className="text-sm text-gray-600">Hit Rate</div>
          </div>
        </div>
      </Card>

      {/* Individual Cache Statistics */}
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(stats.caches).map(([key, cache]) => {
          const hitRate = cache.hits + cache.misses > 0
            ? ((cache.hits / (cache.hits + cache.misses)) * 100).toFixed(2)
            : '0.00';

          return (
            <Card key={key} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{cache.name}</h3>
                <Button
                  onClick={() => clearSpecificCache(key)}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Hits</div>
                  <div className="font-semibold text-green-600">
                    {formatNumber(cache.hits)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Misses</div>
                  <div className="font-semibold text-red-600">
                    {formatNumber(cache.misses)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Keys</div>
                  <div className="font-semibold text-blue-600">
                    {formatNumber(cache.keys)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Hit Rate</div>
                  <div className={`font-semibold ${getHitRateColor(hitRate)}`}>
                    {hitRate}%
                  </div>
                </div>
              </div>

              {/* Performance indicator */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  {parseFloat(hitRate) >= 70 && (
                    <>
                      <span className="text-green-600">✅</span>
                      <span className="text-sm text-green-600">Excellent performance</span>
                    </>
                  )}
                  {parseFloat(hitRate) >= 50 && parseFloat(hitRate) < 70 && (
                    <>
                      <span className="text-yellow-600">⚠️</span>
                      <span className="text-sm text-yellow-600">Good performance</span>
                    </>
                  )}
                  {parseFloat(hitRate) < 50 && (
                    <>
                      <span className="text-red-600">❌</span>
                      <span className="text-sm text-red-600">Consider increasing TTL</span>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Performance Tips */}
      <Card className="p-6 bg-blue-50">
        <h3 className="font-semibold mb-2">💡 Performance Tips</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• Target hit rate: <strong>&gt;70%</strong> for optimal performance</li>
          <li>• If hit rate &lt;50%, consider increasing TTL values in cache.js</li>
          <li>• Clear caches after major data updates</li>
          <li>• Monitor memory usage - total keys should stay reasonable</li>
          <li>• Auto-refresh updates stats every 5 seconds</li>
        </ul>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(stats.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
