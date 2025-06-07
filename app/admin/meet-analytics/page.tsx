'use client';

import { useState, useEffect } from 'react';
import { format, formatInTimeZone } from 'date-fns-tz';

interface MeetView {
  _id: string;
  ip: string;
  userAgent: string;
  referrer: string | null;
  createdAt: string;
  meetingScheduled: boolean;
  country?: string;
  city?: string;
  region?: string;
  step1Completed?: boolean;
  step2Completed?: boolean;
  step3Reached?: boolean;
  selectedDuration?: number;
  selectedTimezone?: string;
  __v: number;
}

interface ViewsByDate {
  _id: string;
  views: number;
  meetings: number;
  step1Completions: number;
  step2Completions: number;
  step3Reached: number;
}

interface GeographicData {
  _id: string;
  viewCount: number;
  cities: string[];
  meetingCount: number;
}

interface DeviceStats {
  _id: string;
  viewCount: number;
  meetingCount: number;
}

interface BrowserStats {
  _id: string;
  viewCount: number;
  meetingCount: number;
}

interface OSStats {
  _id: string;
  viewCount: number;
  meetingCount: number;
}

interface HourlyDistribution {
  _id: number;
  viewCount: number;
  meetingCount: number;
}

interface TopReferrers {
  _id: string;
  viewCount: number;
}

interface OrgStats {
  _id: string;
  viewCount: number;
}

interface ConversionByCountry {
  _id: string;
  country: string;
  totalViews: number;
  totalMeetings: number;
  conversionRate: number;
}

interface DurationStats {
  _id: number;
  count: number;
}

interface TimezoneStats {
  _id: string;
  count: number;
}

type TimeFilter = '7d' | '15d' | '30d' | 'all';
type ViewMode = 'overview' | 'funnel';

interface AnalyticsData {
  totalViews: number;
  totalMeetingsScheduled: number;
  uniqueVisitors: number;
  conversionRate: string;
  step1Completions: number;
  step2Completions: number;
  step3Reached: number;
  step1ConversionRate: string;
  step2ConversionRate: string;
  step3ConversionRate: string;
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
  durationStats: DurationStats[];
  timezoneStats: TimezoneStats[];
  recentViews: MeetView[];
}

const CustomTooltip = ({ visible, x, y, content }: { visible: boolean; x: number; y: number; content: string }) => {
  if (!visible) return null;
  
  return (
    <div 
      className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl max-w-xs pointer-events-none"
      style={{ 
        left: Math.min(x, window.innerWidth - 300), 
        top: Math.max(y - 100, 10) 
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default function MeetAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
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
      const response = await fetch(`/api/admin/meet-analytics?period=${filter}`);
      
      if (!response.ok) {
        throw new Error('Unauthorized access or server error');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleTimeFilterChange = async (newFilter: TimeFilter) => {
    setTimeFilter(newFilter);
    await fetchAnalytics(newFilter);
  };

  const formatDateIST = (date: string | Date, formatString: string = 'MMM d, yyyy HH:mm:ss') => {
    return formatInTimeZone(new Date(date), IST_TIMEZONE, formatString);
  };

  const formatDateOnlyIST = (date: string | Date) => {
    return formatInTimeZone(new Date(date), IST_TIMEZONE, 'MMM d, yyyy');
  };

  const formatTimeOnlyIST = (date: string | Date) => {
    return formatInTimeZone(new Date(date), IST_TIMEZONE, 'HH:mm:ss');
  };

  const convertUTCHourToIST = (utcHour: number) => {
    const istHour = (utcHour + 5.5) % 24;
    return Math.floor(istHour);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading meet analytics...</p>
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

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Meet Page Analytics
              </h1>
              <p className="text-gray-400">Comprehensive analytics for your meeting scheduling page</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">View:</span>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="overview">Overview</option>
                  <option value="funnel">Conversion Funnel</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Period:</span>
                <select
                  value={timeFilter}
                  onChange={(e) => handleTimeFilterChange(e.target.value as TimeFilter)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  {timeFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
        </div>

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
                <h2 className="text-sm font-medium mb-2 text-green-300">Meetings Scheduled</h2>
                <p className="text-3xl font-bold text-white">{analytics.totalMeetingsScheduled.toLocaleString()}</p>
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
                <p className="text-xs text-orange-200 mt-1">View to meeting</p>
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

            {/* Meeting Duration & Timezone Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Popular Meeting Durations</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {(analytics.durationStats || []).map((duration, index) => (
                    <div key={duration._id} className="flex justify-between items-center p-3 bg-zinc-700/50 rounded hover:bg-zinc-700/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-xs bg-zinc-600 text-gray-300 px-2 py-1 rounded font-mono">
                          #{index + 1}
                        </div>
                        <span className="text-gray-300">{duration._id} minutes</span>
                      </div>
                      <span className="text-lg font-semibold text-white">{duration.count.toLocaleString()}</span>
                    </div>
                  ))}
                  {(!analytics.durationStats || analytics.durationStats.length === 0) && (
                    <p className="text-center text-gray-400 py-8">No duration data available</p>
                  )}
                </div>
              </div>

              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Popular Timezones</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {(analytics.timezoneStats || []).map((timezone, index) => (
                    <div key={timezone._id} className="flex justify-between items-center p-3 bg-zinc-700/50 rounded hover:bg-zinc-700/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-xs bg-zinc-600 text-gray-300 px-2 py-1 rounded font-mono">
                          #{index + 1}
                        </div>
                        <span className="text-gray-300">{timezone._id.replace('_', ' ')}</span>
                      </div>
                      <span className="text-lg font-semibold text-white">{timezone.count.toLocaleString()}</span>
                    </div>
                  ))}
                  {(!analytics.timezoneStats || analytics.timezoneStats.length === 0) && (
                    <p className="text-center text-gray-400 py-8">No timezone data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Views by Date Chart */}
            <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700 mb-8">
              <h2 className="text-xl font-semibold mb-6 text-white">Daily Views & Meeting Trends</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-300">Page Views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-300">Meetings Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-gray-300">Step 1 Completions</span>
                  </div>
                </div>
                
                <div className="h-80 relative overflow-visible">
                  <div className="absolute inset-0 flex items-end justify-between gap-2 px-4 py-4">
                    {(analytics.viewsByDate || []).slice(-14).map((day, index) => {
                      const maxViews = Math.max(...analytics.viewsByDate.map(d => d.views), 1);
                      const viewHeight = Math.max((day.views / maxViews) * 100, 2);
                      const meetingHeight = Math.max((day.meetings / maxViews) * 100, 1);
                      const step1Height = Math.max((day.step1Completions / maxViews) * 100, 1);
                      
                      return (
                        <div key={day._id} className="flex flex-col items-center group relative flex-1 min-w-0">
                          <div className="flex items-end gap-1 h-56 w-full max-w-20 relative">
                            <div 
                              className="bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-400 cursor-pointer"
                              style={{ height: `${viewHeight}%`, width: '28%', minHeight: '2px' }}
                              title={`Views: ${day.views}`}
                            ></div>
                            <div 
                              className="bg-green-500 rounded-t-sm transition-all duration-300 hover:bg-green-400 cursor-pointer"
                              style={{ height: `${meetingHeight}%`, width: '28%', minHeight: '1px' }}
                              title={`Meetings: ${day.meetings}`}
                            ></div>
                            <div 
                              className="bg-yellow-500 rounded-t-sm transition-all duration-300 hover:bg-yellow-400 cursor-pointer"
                              style={{ height: `${step1Height}%`, width: '28%', minHeight: '1px' }}
                              title={`Step 1: ${day.step1Completions}`}
                            ></div>
                            
                            {/* Improved Tooltip */}
                            <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none">
                              <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 shadow-2xl min-w-48">
                                <div className="text-sm font-semibold text-white mb-3 text-center border-b border-gray-600 pb-2">
                                  {formatDateOnlyIST(day._id)}
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                      <span className="text-gray-300">Views:</span>
                                    </div>
                                    <span className="text-white font-medium">{day.views}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                                      <span className="text-gray-300">Meetings:</span>
                                    </div>
                                    <span className="text-white font-medium">{day.meetings}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                                      <span className="text-gray-300">Step 1:</span>
                                    </div>
                                    <span className="text-white font-medium">{day.step1Completions}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                      <span className="text-gray-300">Step 2:</span>
                                    </div>
                                    <span className="text-white font-medium">{day.step2Completions}</span>
                                  </div>
                                  <div className="pt-2 mt-2 border-t border-gray-600">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-gray-400">Conversion:</span>
                                      <span className="text-primary font-medium">
                                        {day.views > 0 ? ((day.meetings / day.views) * 100).toFixed(1) : 0}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {/* Arrow pointing down */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-600"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-400 mt-3 text-center leading-tight">
                            <div>{format(new Date(day._id), 'MMM d')}</div>
                            <div className="text-xs text-gray-500">{format(new Date(day._id), 'EEE')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Hourly Distribution */}
            <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700 mb-8">
              <h2 className="text-xl font-semibold mb-6 text-white">Hourly Activity Pattern (IST)</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-300">Page Views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-300">Meetings Scheduled</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-12 gap-1">
                  {analytics.hourlyDistribution.map((hour) => {
                    const maxHourlyViews = Math.max(...analytics.hourlyDistribution.map(h => h.viewCount), 1);
                    const viewHeight = (hour.viewCount / maxHourlyViews) * 100;
                    const meetingHeight = (hour.meetingCount / maxHourlyViews) * 100;
                    const istHour = convertUTCHourToIST(hour._id);
                    
                    return (
                      <div key={hour._id} className="flex flex-col items-center group relative">
                        <div className="flex flex-col items-center justify-end h-32 w-full">
                          <div 
                            className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-400"
                            style={{ height: `${viewHeight}%` }}
                            title={`${istHour}:00 IST - Views: ${hour.viewCount}`}
                          ></div>
                          <div 
                            className="bg-green-500 w-full transition-all duration-300 hover:bg-green-400"
                            style={{ height: `${meetingHeight}%` }}
                            title={`${istHour}:00 IST - Meetings: ${hour.meetingCount}`}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {istHour}h
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl z-10 whitespace-nowrap">
                          <div className="text-sm font-medium text-white mb-1">{istHour}:00 IST</div>
                          <div className="text-xs space-y-1">
                            <div>Views: {hour.viewCount}</div>
                            <div>Meetings: {hour.meetingCount}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Geographic Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Geographic Distribution</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(analytics.geographicData || []).map((country, index) => (
                    <div key={country._id} className="p-3 bg-zinc-700/50 rounded hover:bg-zinc-700/70 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="text-xs bg-zinc-600 text-gray-300 px-2 py-1 rounded font-mono">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="text-gray-300 font-medium">{country._id || 'Unknown'}</div>
                            <div className="text-xs text-gray-400">
                              {country.cities.filter(city => city).slice(0, 3).join(', ')}
                              {country.cities.length > 3 && ` +${country.cities.length - 3} more`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-white">{country.viewCount}</div>
                          <div className="text-xs text-green-400">{country.meetingCount} meetings</div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Conversion: {country.viewCount > 0 ? ((country.meetingCount / country.viewCount) * 100).toFixed(1) : 0}%</span>
                        <span>{country.cities.length} cities</span>
                      </div>
                    </div>
                  ))}
                  {(!analytics.geographicData || analytics.geographicData.length === 0) && (
                    <p className="text-center text-gray-400 py-8">No geographic data available</p>
                  )}
                </div>
              </div>

              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">ISP/Organization Analysis</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(analytics.orgStats || []).map((org, index) => (
                    <div key={org._id} className="flex justify-between items-center p-3 bg-zinc-700/50 rounded hover:bg-zinc-700/70 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-xs bg-zinc-600 text-gray-300 px-2 py-1 rounded font-mono">
                          #{index + 1}
                        </div>
                        <span className="text-gray-300 truncate" title={org._id}>{org._id}</span>
                      </div>
                      <span className="text-lg font-semibold text-white ml-2">{org.viewCount}</span>
                    </div>
                  ))}
                  {(!analytics.orgStats || analytics.orgStats.length === 0) && (
                    <p className="text-center text-gray-400 py-8">No organization data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Device & Browser Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Device Types</h2>
                <div className="space-y-3">
                  {(analytics.deviceStats || []).map((device, index) => (
                    <div key={device._id || 'unknown'} className="flex justify-between items-center p-3 bg-zinc-700/50 rounded hover:bg-zinc-700/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-xs bg-zinc-600 text-gray-300 px-2 py-1 rounded font-mono">
                          #{index + 1}
                        </div>
                        <span className="text-gray-300 capitalize">{device._id || 'Unknown'}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-white">{device.viewCount}</div>
                        <div className="text-xs text-green-400">{device.meetingCount} meetings</div>
                      </div>
                    </div>
                  ))}
                  {(!analytics.deviceStats || analytics.deviceStats.length === 0) && (
                    <p className="text-center text-gray-400 py-8">No device data</p>
                  )}
                </div>
              </div>

              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Browsers</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(analytics.browserStats || []).map((browser, index) => (
                    <div key={browser._id || 'unknown'} className="flex justify-between items-center p-3 bg-zinc-700/50 rounded hover:bg-zinc-700/70 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-xs bg-zinc-600 text-gray-300 px-2 py-1 rounded font-mono">
                          #{index + 1}
                        </div>
                        <span className="text-gray-300 truncate">{browser._id || 'Unknown'}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-white">{browser.viewCount}</div>
                        <div className="text-xs text-green-400">{browser.meetingCount} meetings</div>
                      </div>
                    </div>
                  ))}
                  {(!analytics.browserStats || analytics.browserStats.length === 0) && (
                    <p className="text-center text-gray-400 py-8">No browser data</p>
                  )}
                </div>
              </div>

              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Operating Systems</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(analytics.osStats || []).map((os, index) => (
                    <div key={os._id || 'unknown'} className="flex justify-between items-center p-3 bg-zinc-700/50 rounded hover:bg-zinc-700/70 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-xs bg-zinc-600 text-gray-300 px-2 py-1 rounded font-mono">
                          #{index + 1}
                        </div>
                        <span className="text-gray-300 truncate">{os._id || 'Unknown'}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-white">{os.viewCount}</div>
                        <div className="text-xs text-green-400">{os.meetingCount} meetings</div>
                      </div>
                    </div>
                  ))}
                  {(!analytics.osStats || analytics.osStats.length === 0) && (
                    <p className="text-center text-gray-400 py-8">No OS data</p>
                  )}
                </div>
              </div>
            </div>

            {/* Referrer Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Top Referrers</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(analytics.topReferrers || []).map((referrer, index) => (
                    <div key={referrer._id} className="p-3 bg-zinc-700/50 rounded hover:bg-zinc-700/70 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="text-xs bg-zinc-600 text-gray-300 px-2 py-1 rounded font-mono">
                            #{index + 1}
                          </div>
                          <span className="text-gray-300 truncate text-sm" title={referrer._id}>
                            {referrer._id.length > 50 ? referrer._id.substring(0, 50) + '...' : referrer._id}
                          </span>
                        </div>
                        <span className="text-lg font-semibold text-white ml-2">{referrer.viewCount}</span>
                      </div>
                      <div className="text-xs text-gray-400 ml-8">
                        {new URL(referrer._id).hostname}
                      </div>
                    </div>
                  ))}
                  {(!analytics.topReferrers || analytics.topReferrers.length === 0) && (
                    <p className="text-center text-gray-400 py-8">No referrer data available</p>
                  )}
                </div>
              </div>

              <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Conversion by Country</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(analytics.conversionByCountry || []).map((country, index) => (
                    <div key={country._id} className="p-3 bg-zinc-700/50 rounded hover:bg-zinc-700/70 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div className="text-xs bg-zinc-600 text-gray-300 px-2 py-1 rounded font-mono">
                            #{index + 1}
                          </div>
                          <span className="text-gray-300">{country.country}</span>
                        </div>
                        <span className="text-lg font-semibold text-primary">
                          {country.conversionRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 ml-8">
                        <span>{country.totalViews} views</span>
                        <span>{country.totalMeetings} meetings</span>
                      </div>
                    </div>
                  ))}
                  {(!analytics.conversionByCountry || analytics.conversionByCountry.length === 0) && (
                    <p className="text-center text-gray-400 py-8">No conversion data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
              <h2 className="text-xl font-semibold mb-6 text-white">Recent Activity & Visitor Details</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left py-3 text-gray-300 font-medium">Time (IST)</th>
                      <th className="text-left py-3 text-gray-300 font-medium">IP Address</th>
                      <th className="text-left py-3 text-gray-300 font-medium">Location</th>
                      <th className="text-left py-3 text-gray-300 font-medium">Device</th>
                      <th className="text-left py-3 text-gray-300 font-medium">Browser</th>
                      <th className="text-left py-3 text-gray-300 font-medium">Steps</th>
                      <th className="text-left py-3 text-gray-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics.recentViews || []).map((view, index) => (
                      <tr key={view._id} className="border-b border-zinc-800 hover:bg-zinc-700/30">
                        <td className="py-3 text-gray-300">
                          <div>{formatTimeOnlyIST(view.createdAt)}</div>
                          <div className="text-xs text-gray-500">{formatDateOnlyIST(view.createdAt)}</div>
                        </td>
                        <td className="py-3">
                          <code className="bg-zinc-700 px-2 py-1 rounded text-xs text-gray-300">
                            {view.ip}
                          </code>
                        </td>
                        <td className="py-3 text-gray-300">
                          <div>{view.country || 'Unknown'}</div>
                          {view.city && (
                            <div className="text-xs text-gray-500">{view.city}</div>
                          )}
                        </td>
                        <td className="py-3 text-gray-300">
                          <div className="capitalize">{view.deviceType || 'Unknown'}</div>
                          {view.device && (
                            <div className="text-xs text-gray-500 truncate max-w-20" title={view.device}>
                              {view.device}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-gray-300">
                          <div>{view.browser || 'Unknown'}</div>
                          {view.browserVersion && (
                            <div className="text-xs text-gray-500">{view.browserVersion}</div>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <span className={`w-2 h-2 rounded-full ${view.step1Completed ? 'bg-green-500' : 'bg-gray-600'}`} title="Step 1"></span>
                            <span className={`w-2 h-2 rounded-full ${view.step2Completed ? 'bg-green-500' : 'bg-gray-600'}`} title="Step 2"></span>
                            <span className={`w-2 h-2 rounded-full ${view.step3Reached ? 'bg-green-500' : 'bg-gray-600'}`} title="Step 3"></span>
                          </div>
                        </td>
                        <td className="py-3">
                          {view.meetingScheduled ? (
                            <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs">
                              Meeting Scheduled
                            </span>
                          ) : view.step3Reached ? (
                            <span className="px-2 py-1 bg-orange-900/50 text-orange-300 rounded text-xs">
                              Reached Final Step
                            </span>
                          ) : view.step2Completed ? (
                            <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded text-xs">
                              Form Completed
                            </span>
                          ) : view.step1Completed ? (
                            <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs">
                              Time Selected
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs">
                              Page View Only
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!analytics.recentViews || analytics.recentViews.length === 0) && (
                  <p className="text-center text-gray-400 py-8">No recent activity</p>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Funnel Analysis View */
          <div className="space-y-6">
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-300">
                  Conversion Funnel Analysis - Track user journey through the meeting scheduling process
                </span>
              </div>
            </div>

            {/* Funnel Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-6 rounded-lg shadow-lg border border-blue-700/50">
                <h2 className="text-sm font-medium mb-2 text-blue-300">Page Views</h2>
                <p className="text-3xl font-bold text-white">{analytics.totalViews.toLocaleString()}</p>
                <p className="text-xs text-blue-200 mt-1">100% (Entry Point)</p>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 p-6 rounded-lg shadow-lg border border-yellow-700/50">
                <h2 className="text-sm font-medium mb-2 text-yellow-300">Step 1 Completed</h2>
                <p className="text-3xl font-bold text-white">{analytics.step1Completions.toLocaleString()}</p>
                <p className="text-xs text-yellow-200 mt-1">{analytics.step1ConversionRate}% of views</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 p-6 rounded-lg shadow-lg border border-orange-700/50">
                <h2 className="text-sm font-medium mb-2 text-orange-300">Step 2 Completed</h2>
                <p className="text-3xl font-bold text-white">{analytics.step2Completions.toLocaleString()}</p>
                <p className="text-xs text-orange-200 mt-1">{analytics.step2ConversionRate}% from step 1</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 p-6 rounded-lg shadow-lg border border-green-700/50">
                <h2 className="text-sm font-medium mb-2 text-green-300">Meetings Scheduled</h2>
                <p className="text-3xl font-bold text-white">{analytics.totalMeetingsScheduled.toLocaleString()}</p>
                <p className="text-xs text-green-200 mt-1">{analytics.step3ConversionRate}% from step 2</p>
              </div>
            </div>

            {/* Visual Funnel */}
            <div className="bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700">
              <h2 className="text-xl font-semibold mb-6 text-white">Conversion Funnel Visualization</h2>
              <div className="flex flex-col space-y-4">
                {/* Step bars with proportional widths */}
                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm text-blue-300 font-medium">Page Views</div>
                    <div className="flex-1 bg-gray-700 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-4"
                        style={{ width: '100%' }}
                      >
                        <span className="text-white text-sm font-medium">{analytics.totalViews.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm text-yellow-300 font-medium">Step 1</div>
                    <div className="flex-1 bg-gray-700 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full flex items-center justify-end pr-4"
                        style={{ width: analytics.totalViews > 0 ? `${(analytics.step1Completions / analytics.totalViews) * 100}%` : '0%' }}
                      >
                        <span className="text-white text-sm font-medium">{analytics.step1Completions.toLocaleString()} ({analytics.step1ConversionRate}%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm text-orange-300 font-medium">Step 2</div>
                    <div className="flex-1 bg-gray-700 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full flex items-center justify-end pr-4"
                        style={{ width: analytics.totalViews > 0 ? `${(analytics.step2Completions / analytics.totalViews) * 100}%` : '0%' }}
                      >
                        <span className="text-white text-sm font-medium">{analytics.step2Completions.toLocaleString()} ({analytics.step2ConversionRate}%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-sm text-green-300 font-medium">Scheduled</div>
                    <div className="flex-1 bg-gray-700 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full flex items-center justify-end pr-4"
                        style={{ width: analytics.totalViews > 0 ? `${(analytics.totalMeetingsScheduled / analytics.totalViews) * 100}%` : '0%' }}
                      >
                        <span className="text-white text-sm font-medium">{analytics.totalMeetingsScheduled.toLocaleString()} ({analytics.conversionRate}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 