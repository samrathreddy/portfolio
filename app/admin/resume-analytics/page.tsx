'use client';

import { useState, useEffect } from 'react';
import { format, formatInTimeZone } from 'date-fns-tz';

interface ResumeView {
  _id: string;
  ip: string;
  userAgent: string;
  referrer: string | null;
  createdAt: string;
  country?: string;
  city?: string;
  region?: string;
  downloaded: boolean;
  __v: number;
}

interface ViewsByDate {
  _id: string;
  views: number;
  downloads: number;
}

interface DeviceStats {
  _id: string | null;
  viewCount: number;
  downloadCount: number;
}

interface BrowserStats {
  _id: string;
  viewCount: number;
}

interface OSStats {
  _id: string;
  viewCount: number;
}

interface HourlyDistribution {
  _id: number;
  viewCount: number;
}

interface TopReferrers {
  _id: string;
  viewCount: number;
}

interface GeographicData {
  _id: string;
  viewCount: number;
  downloadCount: number;
}

interface OrgStats {
  _id: string;
  viewCount: number;
}

interface ConversionByCountry {
  _id: string;
  views: number;
  downloads: number;
  conversionRate: number;
}

interface IPAnalytics {
  ip: string;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
  downloadCount: number;
  visits: {
    timestamp: string;
    downloaded: boolean;
    referrer: string | null;
    userAgent: string;
  }[];
  location?: string;
}

interface AnalyticsData {
  totalViews: number;
  totalDownloads: number;
  uniqueVisitors: number;
  conversionRate: string;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  viewsByDate: ViewsByDate[];
  geographicData: GeographicData[];
  deviceStats: DeviceStats[];
  browserStats: BrowserStats[];
  osStats: OSStats[];
  hourlyDistribution: HourlyDistribution[];
  topReferrers: TopReferrers[];
  orgStats: OrgStats[];
  conversionByCountry: ConversionByCountry[];
  recentViews: ResumeView[];
}

type TimeFilter = '7d' | '15d' | '30d' | 'all';
type ViewMode = 'overview' | 'ip-analysis';

export default function ResumeAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [ipAnalytics, setIpAnalytics] = useState<IPAnalytics[]>([]);
  const [hoveredBar, setHoveredBar] = useState<{type: string, data: any} | null>(null);

  const IST_TIMEZONE = 'Asia/Kolkata';

  const timeFilterOptions = [
    { value: '7d', label: '1 Week', days: 7 },
    { value: '15d', label: '15 Days', days: 15 },
    { value: '30d', label: '30 Days', days: 30 },
    { value: 'all', label: 'All Time', days: null },
  ];

  async function fetchAnalytics(filter: TimeFilter = timeFilter) {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/admin/resume-analytics?period=${filter}`);
      
      if (!response.ok) {
        throw new Error('Unauthorized access or server error');
      }
      
      const data = await response.json();
      setAnalytics(data);
      
      // Process IP analytics
      if (data.recentViews) {
        processIPAnalytics(data.recentViews);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const processIPAnalytics = (views: ResumeView[]) => {
    const ipMap = new Map<string, IPAnalytics>();
    
    views.forEach(view => {
      const ip = view.ip;
      const location = view.city && view.region && view.country 
        ? `${view.city}, ${view.region}, ${view.country}` 
        : view.country || 'Unknown';
      
      if (!ipMap.has(ip)) {
        ipMap.set(ip, {
          ip,
          visitCount: 0,
          firstVisit: view.createdAt,
          lastVisit: view.createdAt,
          downloadCount: 0,
          visits: [],
          location
        });
      }
      
      const ipData = ipMap.get(ip)!;
      ipData.visitCount++;
      
      if (new Date(view.createdAt) < new Date(ipData.firstVisit)) {
        ipData.firstVisit = view.createdAt;
      }
      if (new Date(view.createdAt) > new Date(ipData.lastVisit)) {
        ipData.lastVisit = view.createdAt;
      }
      
      if (view.downloaded) {
        ipData.downloadCount++;
      }
      
      ipData.visits.push({
        timestamp: view.createdAt,
        downloaded: view.downloaded,
        referrer: view.referrer,
        userAgent: view.userAgent
      });
    });
    
    // Sort visits by timestamp and convert to array
    const ipAnalyticsArray = Array.from(ipMap.values()).map(ip => ({
      ...ip,
      visits: ip.visits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    })).sort((a, b) => b.visitCount - a.visitCount);
    
    setIpAnalytics(ipAnalyticsArray);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleTimeFilterChange = async (newFilter: TimeFilter) => {
    setTimeFilter(newFilter);
    await fetchAnalytics(newFilter);
  };

  const formatDateIST = (date: string | Date, formatString: string = 'MMM d, yyyy HH:mm:ss') => {
    // Convert UTC timestamp to IST
    return formatInTimeZone(new Date(date), IST_TIMEZONE, formatString);
  };

  const formatDateOnlyIST = (date: string | Date) => {
    // For date-only formatting in IST
    return formatInTimeZone(new Date(date), IST_TIMEZONE, 'MMM d, yyyy');
  };

  const formatTimeOnlyIST = (date: string | Date) => {
    // For time-only formatting in IST
    return formatInTimeZone(new Date(date), IST_TIMEZONE, 'HH:mm:ss');
  };

  const convertUTCHourToIST = (utcHour: number) => {
    // Convert UTC hour to IST (UTC + 5:30)
    const istHour = (utcHour + 5.5) % 24;
    return Math.floor(istHour);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="bg-red-900/50 text-red-100 p-6 rounded-md border border-red-700 max-w-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!analytics) {
    return <div className="flex justify-center items-center h-screen bg-black text-white">No data available</div>;
  }

  const getMaxHourlyViews = () => Math.max(...(analytics.hourlyDistribution || []).map(h => h.viewCount), 1);
  const getMaxDailyViews = () => Math.max(...(analytics.viewsByDate || []).map(d => d.views), 1);
  const currentFilter = timeFilterOptions.find(f => f.value === timeFilter);

  // Custom Tooltip Component
  const CustomTooltip = ({ visible, x, y, content }: { 
    visible: boolean; 
    x: number; 
    y: number; 
    content: string;
  }) => {
    if (!visible) return null;
    
    return (
      <div 
        className="fixed bg-zinc-900 text-white p-3 rounded-lg border border-zinc-700 shadow-xl z-50 pointer-events-none"
        style={{ 
          left: x + 10, 
          top: y - 10,
          maxWidth: '300px'
        }}
      >
        <div className="text-sm whitespace-nowrap" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-700 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Resume Analytics Dashboard
            </h1>
            <p className="text-gray-400 text-sm">
              All times displayed in Indian Standard Time (IST) • Converted from UTC
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
            {/* View Mode Toggle */}
            <div className="flex bg-zinc-800 rounded-lg p-1 border border-zinc-700">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'overview'
                    ? 'bg-primary text-black shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-zinc-700'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setViewMode('ip-analysis')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === 'ip-analysis'
                    ? 'bg-primary text-black shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-zinc-700'
                }`}
              >
                🔍 IP Analysis
              </button>
            </div>
            
            {/* Time Filter Controls */}
            <div className="flex bg-zinc-800 rounded-lg p-1 border border-zinc-700 flex-wrap">
              {timeFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTimeFilterChange(option.value as TimeFilter)}
                  disabled={refreshing}
                  className={`px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-all duration-200 ${
                    timeFilter === option.value
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-zinc-700'
                  } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => fetchAnalytics()}
              disabled={refreshing}
              className={`flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-sm ${
                refreshing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Custom Tooltip */}
        <CustomTooltip 
          visible={!!hoveredBar} 
          x={hoveredBar?.data?.x || 0} 
          y={hoveredBar?.data?.y || 0} 
          content={hoveredBar?.data?.content || ''} 
        />
        
        {viewMode === 'overview' ? (
          <>
            {/* Current Filter Display */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-gray-300">
                    Showing data for: <span className="text-white font-semibold">{currentFilter?.label}</span>
                    {currentFilter?.days && (
                      <span className="text-gray-400"> ({currentFilter.days} days)</span>
                    )}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  Last updated: {formatDateIST(new Date(), 'MMM d, yyyy HH:mm:ss')} IST
                </div>
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-6 rounded-lg shadow-lg border border-blue-700/50 hover:shadow-xl transition-all">
                <h2 className="text-sm font-medium mb-2 text-blue-300">Total Views</h2>
                <p className="text-3xl font-bold text-white">{analytics.totalViews.toLocaleString()}</p>
                <p className="text-xs text-blue-200 mt-1">
                  {currentFilter?.days ? `Last ${currentFilter.days} days` : 'All time'}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 p-6 rounded-lg shadow-lg border border-green-700/50 hover:shadow-xl transition-all">
                <h2 className="text-sm font-medium mb-2 text-green-300">Total Downloads</h2>
                <p className="text-3xl font-bold text-white">{analytics.totalDownloads.toLocaleString()}</p>
                <p className="text-xs text-green-200 mt-1">
                  {currentFilter?.days ? `Last ${currentFilter.days} days` : 'All time'}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-6 rounded-lg shadow-lg border border-purple-700/50 hover:shadow-xl transition-all">
                <h2 className="text-sm font-medium mb-2 text-purple-300">Unique Visitors</h2>
                <p className="text-3xl font-bold text-white">{analytics.uniqueVisitors.toLocaleString()}</p>
                <p className="text-xs text-purple-200 mt-1">Distinct users</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 p-6 rounded-lg shadow-lg border border-orange-700/50 hover:shadow-xl transition-all">
                <h2 className="text-sm font-medium mb-2 text-orange-300">Conversion Rate</h2>
                <p className="text-3xl font-bold text-white">{analytics.conversionRate}%</p>
                <p className="text-xs text-orange-200 mt-1">View to download</p>
              </div>
            </div>

            {/* Time Period Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700 hover:shadow-xl transition-all">
                <h2 className="text-lg font-semibold mb-2 text-gray-300">Today</h2>
                <p className="text-2xl font-bold text-primary">{analytics.todayViews.toLocaleString()} views</p>
                <p className="text-xs text-gray-400 mt-1">{formatDateOnlyIST(new Date())} (IST)</p>
              </div>
              
              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700 hover:shadow-xl transition-all">
                <h2 className="text-lg font-semibold mb-2 text-gray-300">This Week</h2>
                <p className="text-2xl font-bold text-primary">{analytics.weekViews.toLocaleString()} views</p>
                <p className="text-xs text-gray-400 mt-1">Last 7 days</p>
              </div>
              
              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700 hover:shadow-xl transition-all">
                <h2 className="text-lg font-semibold mb-2 text-gray-300">This Month</h2>
                <p className="text-2xl font-bold text-primary">{analytics.monthViews.toLocaleString()} views</p>
                <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Views by Date Chart */}
              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">
                  Views by Date - {currentFilter?.label} (IST)
                </h2>
                <div className="h-64 flex items-end gap-2 overflow-x-auto pb-8 relative">
                  {(analytics.viewsByDate || []).map((item, index) => (
                    <div 
                      key={item._id} 
                      className="flex flex-col items-center flex-shrink-0 relative"
                      style={{ minWidth: '40px' }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredBar({
                          type: 'date',
                          data: {
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                            content: `
                              <div class="font-semibold text-blue-300">${formatDateOnlyIST(item._id)}</div>
                              <div class="text-white">${item.views.toLocaleString()} views</div>
                              <div class="text-green-300">${item.downloads.toLocaleString()} downloads</div>
                              <div class="text-gray-400 text-xs mt-1">IST timezone</div>
                            `
                          }
                        });
                      }}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div className="w-full flex flex-col gap-1">
                        <div 
                          className="bg-blue-500 w-full rounded-t transition-all hover:bg-blue-400 cursor-pointer" 
                          style={{ 
                            height: `${(item.views / getMaxDailyViews()) * 200}px`,
                            minHeight: '4px'
                          }}
                        ></div>
                        {item.downloads > 0 && (
                          <div 
                            className="bg-green-500 w-full rounded-t cursor-pointer" 
                            style={{ 
                              height: `${(item.downloads / getMaxDailyViews()) * 50}px`,
                              minHeight: '2px'
                            }}
                          ></div>
                        )}
                      </div>
                      <span className="text-xs mt-2 text-gray-400 transform -rotate-45 origin-top-left whitespace-nowrap">
                        {formatDateIST(item._id, 'MMM d')}
                      </span>
                    </div>
                  ))}
                  {(!analytics.viewsByDate || analytics.viewsByDate.length === 0) && (
                    <div className="w-full text-center py-12 text-gray-400">No data available for this period</div>
                  )}
                </div>
                <div className="flex gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-300">Views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-300">Downloads</span>
                  </div>
                </div>
              </div>

              {/* Hourly Distribution */}
              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">
                  Hourly Distribution (IST)
                </h2>
                <div className="h-64 flex items-end gap-1 relative">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const data = (analytics.hourlyDistribution || []).find(h => convertUTCHourToIST(h._id) === hour);
                    const viewCount = data?.viewCount || 0;
                    return (
                      <div 
                        key={hour} 
                        className="flex flex-col items-center flex-1"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredBar({
                            type: 'hour',
                            data: {
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                              content: `
                                <div class="font-semibold text-purple-300">${hour}:00 - ${hour + 1}:00 IST</div>
                                <div class="text-white">${viewCount.toLocaleString()} views</div>
                                <div class="text-gray-400 text-xs mt-1">Peak activity hour</div>
                              `
                            }
                          });
                        }}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        <div 
                          className="bg-purple-500 w-full rounded-t transition-all hover:bg-purple-400 cursor-pointer" 
                          style={{ 
                            height: viewCount > 0 ? `${(viewCount / getMaxHourlyViews()) * 200}px` : '2px',
                            minHeight: '2px'
                          }}
                        ></div>
                        {hour % 4 === 0 && (
                          <span className="text-xs mt-1 text-gray-400">{hour}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-center text-xs text-gray-400 mt-2">Hours (24h IST format)</div>
              </div>
            </div>

            {/* Stats Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Referrers */}
              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Top Referrers</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(analytics.topReferrers || []).slice(0, 10).map((referrer, index) => (
                    <div key={referrer._id} className="flex justify-between items-center p-3 bg-zinc-700/50 rounded hover:bg-zinc-700/70 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-xs bg-zinc-600 text-gray-300 px-2 py-1 rounded font-mono">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300 truncate" title={referrer._id}>
                            {referrer._id || 'Direct'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span className="text-lg font-semibold text-white">{referrer.viewCount.toLocaleString()}</span>
                        <p className="text-xs text-gray-400">views</p>
                      </div>
                    </div>
                  ))}
                  {(!analytics.topReferrers || analytics.topReferrers.length === 0) && (
                    <p className="text-center text-gray-400 py-8">No referrer data available</p>
                  )}
                </div>
              </div>

              {/* Browser Stats */}
              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Browser Statistics</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(analytics.browserStats || []).slice(0, 10).map((browser, index) => (
                    <div key={browser._id} className="flex justify-between items-center p-3 bg-zinc-700/50 rounded hover:bg-zinc-700/70 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-xs bg-zinc-600 text-gray-300 px-2 py-1 rounded font-mono">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">{browser._id}</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <span className="text-lg font-semibold text-white">{browser.viewCount.toLocaleString()}</span>
                        <p className="text-xs text-gray-400">views</p>
                      </div>
                    </div>
                  ))}
                  {(!analytics.browserStats || analytics.browserStats.length === 0) && (
                    <p className="text-center text-gray-400 py-8">No browser data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Geographic Data */}
            {analytics.geographicData && analytics.geographicData.length > 0 && (
              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">Geographic Distribution</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.geographicData.slice(0, 6).map((geo) => (
                    <div key={geo._id} className="bg-zinc-700/50 p-4 rounded hover:bg-zinc-700/70 transition-colors">
                      <h3 className="font-semibold text-white mb-2">{geo._id}</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-blue-300">{geo.viewCount.toLocaleString()} views</p>
                        <p className="text-sm text-green-300">{geo.downloadCount.toLocaleString()} downloads</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Views Table */}
            <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Recent Views (Converted to IST)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-700">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Date & Time (IST)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Referrer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Downloaded
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700">
                    {(analytics.recentViews || []).map((view) => (
                      <tr key={view._id} className="hover:bg-zinc-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDateOnlyIST(view.createdAt)}</span>
                            <span className="text-xs text-gray-400">{formatTimeOnlyIST(view.createdAt)} IST</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                          {view.ip}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {view.city && view.region && view.country 
                            ? `${view.city}, ${view.region}, ${view.country}` 
                            : view.country || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 max-w-xs truncate">
                          {view.referrer ? (
                            <a 
                              href={view.referrer} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-400 hover:underline"
                              title={view.referrer}
                            >
                              {new URL(view.referrer).hostname}
                            </a>
                          ) : (
                            'Direct'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {view.downloaded ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-200 border border-green-700">
                              ✓ Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-700/50 text-zinc-300 border border-zinc-600">
                              - No
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!analytics.recentViews || analytics.recentViews.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No views recorded yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* IP Analysis View */
          <div className="space-y-6">
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-gray-300">
                  IP Analysis View - Grouped by visitor IP addresses with detailed visit history
                </span>
              </div>
            </div>

            {/* IP Analytics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 p-6 rounded-lg shadow-lg border border-indigo-700/50">
                <h2 className="text-sm font-medium mb-2 text-indigo-300">Total Unique IPs</h2>
                <p className="text-3xl font-bold text-white">{ipAnalytics.length.toLocaleString()}</p>
                <p className="text-xs text-indigo-200 mt-1">Distinct visitors</p>
              </div>
              
              <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 p-6 rounded-lg shadow-lg border border-cyan-700/50">
                <h2 className="text-sm font-medium mb-2 text-cyan-300">Repeat Visitors</h2>
                <p className="text-3xl font-bold text-white">
                  {ipAnalytics.filter(ip => ip.visitCount > 1).length.toLocaleString()}
                </p>
                <p className="text-xs text-cyan-200 mt-1">Multiple visits</p>
              </div>
              
              <div className="bg-gradient-to-br from-teal-900/50 to-teal-800/30 p-6 rounded-lg shadow-lg border border-teal-700/50">
                <h2 className="text-sm font-medium mb-2 text-teal-300">IPs with Downloads</h2>
                <p className="text-3xl font-bold text-white">
                  {ipAnalytics.filter(ip => ip.downloadCount > 0).length.toLocaleString()}
                </p>
                <p className="text-xs text-teal-200 mt-1">Downloaded resume</p>
              </div>
            </div>

            {/* IP Analytics Table */}
            <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Detailed IP Analysis (IST)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Visit Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Downloads
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        First Visit (IST)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Last Visit (IST)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700">
                    {ipAnalytics.map((ip, index) => (
                      <tr key={ip.ip} className="hover:bg-zinc-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-zinc-600 text-gray-300 px-2 py-1 rounded font-mono">
                              #{index + 1}
                            </span>
                            <span className="text-sm text-gray-300 font-mono">{ip.ip}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {ip.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ip.visitCount > 5 
                              ? 'bg-red-900/50 text-red-200' 
                              : ip.visitCount > 2 
                                ? 'bg-yellow-900/50 text-yellow-200'
                                : 'bg-green-900/50 text-green-200'
                          }`}>
                            {ip.visitCount} visits
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ip.downloadCount > 0 
                              ? 'bg-green-900/50 text-green-200 border border-green-700' 
                              : 'bg-zinc-700/50 text-zinc-300 border border-zinc-600'
                          }`}>
                            {ip.downloadCount > 0 ? `✓ ${ip.downloadCount}` : '- 0'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDateOnlyIST(ip.firstVisit)}</span>
                            <span className="text-xs text-gray-400">{formatTimeOnlyIST(ip.firstVisit)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex flex-col">
                            <span className="font-medium">{formatDateOnlyIST(ip.lastVisit)}</span>
                            <span className="text-xs text-gray-400">{formatTimeOnlyIST(ip.lastVisit)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <details className="group">
                            <summary className="cursor-pointer text-blue-400 hover:text-blue-300 text-sm font-medium">
                              View History ({ip.visits.length})
                            </summary>
                            <div className="mt-3 space-y-2 bg-zinc-900/50 p-3 rounded border border-zinc-600 max-h-60 overflow-y-auto">
                              {ip.visits.map((visit, visitIndex) => (
                                <div key={visitIndex} className="flex justify-between items-start gap-3 py-2 border-b border-zinc-700 last:border-b-0">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs text-gray-300">
                                      <span className="font-medium">{formatDateIST(visit.timestamp, 'MMM d, HH:mm:ss')}</span>
                                      <span className="text-gray-500 ml-1">IST</span>
                                    </div>
                                    <div className="text-xs text-gray-400 truncate mt-1" title={visit.referrer || 'Direct'}>
                                      {visit.referrer ? new URL(visit.referrer).hostname : 'Direct'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {visit.downloaded ? (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-900/50 text-green-200">
                                        📥 DL
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-zinc-700/50 text-zinc-400">
                                        👁️ View
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))}
                    {ipAnalytics.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No IP data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 