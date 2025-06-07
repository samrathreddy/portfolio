import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import MeetViewModel from '@/lib/models/MeetView';
import { isAllowedIP } from '@/lib/ip-security';

export async function GET(request: NextRequest) {
  try {
    // Get the client IP
    if (!isAllowedIP(request)) {
        return NextResponse.json(
          { error: 'Access denied: IP not authorized' },
          { status: 403 }
        );
      }
    
    // Connect to the database
    await connectToDatabase();
    
    // Get period parameter from URL
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    
    // Calculate date ranges based on period
    let dateFilter = {};
    const now = new Date();
    
    if (period !== 'all') {
      let daysBack = 30; // default
      
      switch (period) {
        case '7d':
          daysBack = 7;
          break;
        case '15d':
          daysBack = 15;
          break;
        case '30d':
          daysBack = 30;
          break;
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      dateFilter = { createdAt: { $gte: startDate } };
    }
    
    console.log('Meet analytics query with period:', period, 'Date filter:', dateFilter);
    
    // Basic stats with date filtering
    const totalViews = await MeetViewModel.countDocuments(dateFilter);
    const totalMeetingsScheduled = await MeetViewModel.countDocuments({ 
      ...dateFilter, 
      meetingScheduled: true 
    });
    const uniqueVisitors = await MeetViewModel.distinct('ip', dateFilter).then(ips => ips.length);
    
    // Step completion analytics
    const step1Completions = await MeetViewModel.countDocuments({ 
      ...dateFilter, 
      step1Completed: true 
    });
    const step2Completions = await MeetViewModel.countDocuments({ 
      ...dateFilter, 
      step2Completed: true 
    });
    const step3Reached = await MeetViewModel.countDocuments({ 
      ...dateFilter, 
      step3Reached: true 
    });
    
    // Time-based analytics (these remain static for "today", "week", "month")
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date();
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    
    const todayViews = await MeetViewModel.countDocuments({ 
      createdAt: { $gte: startOfToday } 
    });
    const weekViews = await MeetViewModel.countDocuments({ 
      createdAt: { $gte: startOfWeek } 
    });
    const monthViews = await MeetViewModel.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    
    // Views by date (filtered by period)
    const viewsByDate = await MeetViewModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          views: { $sum: 1 },
          meetings: { $sum: { $cond: [{ $eq: ["$meetingScheduled", true] }, 1, 0] } },
          step1Completions: { $sum: { $cond: [{ $eq: ["$step1Completed", true] }, 1, 0] } },
          step2Completions: { $sum: { $cond: [{ $eq: ["$step2Completed", true] }, 1, 0] } },
          step3Reached: { $sum: { $cond: [{ $eq: ["$step3Reached", true] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Geographic distribution (filtered by period)
    const geoMatchCondition = period === 'all' 
      ? { country: { $exists: true, $nin: [null, ""] } }
      : { 
          ...(dateFilter as any),
          country: { $exists: true, $nin: [null, ""] } 
        };
      
    const geographicData = await MeetViewModel.aggregate([
      { $match: geoMatchCondition },
      {
        $group: {
          _id: "$country",
          viewCount: { $sum: 1 },
          cities: { $addToSet: "$city" },
          meetingCount: { $sum: { $cond: [{ $eq: ["$meetingScheduled", true] }, 1, 0] } }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 20 }
    ]);
    
    // Device and browser analytics (filtered by period)
    const deviceStats = await MeetViewModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$deviceType",
          viewCount: { $sum: 1 },
          meetingCount: { $sum: { $cond: [{ $eq: ["$meetingScheduled", true] }, 1, 0] } }
        }
      },
      { $sort: { viewCount: -1 } }
    ]);
    
    const browserStats = await MeetViewModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$browser",
          viewCount: { $sum: 1 },
          meetingCount: { $sum: { $cond: [{ $eq: ["$meetingScheduled", true] }, 1, 0] } }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 }
    ]);
    
    const osStats = await MeetViewModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$os",
          viewCount: { $sum: 1 },
          meetingCount: { $sum: { $cond: [{ $eq: ["$meetingScheduled", true] }, 1, 0] } }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 }
    ]);
    
    // Hourly distribution (in UTC, will be converted to IST in frontend)
    const hourlyDistribution = await MeetViewModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          viewCount: { $sum: 1 },
          meetingCount: { $sum: { $cond: [{ $eq: ["$meetingScheduled", true] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Fill missing hours with 0 values
    const allHours = Array.from({ length: 24 }, (_, i) => {
      const hourData = hourlyDistribution.find(h => h._id === i);
      return {
        _id: i,
        viewCount: hourData?.viewCount || 0,
        meetingCount: hourData?.meetingCount || 0
      };
    });
    
    // Top referrers (filtered by period)
    const referrerMatchCondition = period === 'all'
      ? { referrer: { $exists: true, $nin: [null, ""] } }
      : { 
          ...(dateFilter as any),
          referrer: { $exists: true, $nin: [null, ""] } 
        };
      
    const topReferrers = await MeetViewModel.aggregate([
      { $match: referrerMatchCondition },
      {
        $group: {
          _id: "$referrer",
          viewCount: { $sum: 1 }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 }
    ]);
    
    // Recent views (filtered by period, limited to 50)
    const recentViewsFilter = period === 'all' ? {} : dateFilter;
    const recentViews = await MeetViewModel.find(recentViewsFilter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    const orgMatchCondition = period === 'all'
      ? { org: { $exists: true, $nin: [null, ""] } }
      : { 
          ...(dateFilter as any),
          org: { $exists: true, $nin: [null, ""] } 
        };
      
    // ISP/Organization data (filtered by period)
    const orgStats = await MeetViewModel.aggregate([
      { $match: orgMatchCondition },
      {
        $group: {
          _id: "$org",
          viewCount: { $sum: 1 }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 }
    ]);
    
    const conversionMatchCondition = period === 'all'
      ? { country: { $exists: true, $nin: [null, ""] } }
      : { 
          ...(dateFilter as any),
          country: { $exists: true, $nin: [null, ""] } 
        };
      
    // Meeting conversion rate by country (filtered by period)
    const conversionByCountry = await MeetViewModel.aggregate([
      { $match: conversionMatchCondition },
      {
        $group: {
          _id: "$country",
          totalViews: { $sum: 1 },
          totalMeetings: { $sum: { $cond: [{ $eq: ["$meetingScheduled", true] }, 1, 0] } }
        }
      },
      {
        $project: {
          country: "$_id",
          totalViews: 1,
          totalMeetings: 1,
          conversionRate: { 
            $multiply: [
              { $divide: ["$totalMeetings", "$totalViews"] },
              100
            ]
          }
        }
      },
      { $sort: { totalViews: -1 } },
      { $limit: 15 }
    ]);
    
    // Meeting duration preferences (filtered by period)
    const durationStats = await MeetViewModel.aggregate([
      { $match: { ...dateFilter, selectedDuration: { $exists: true, $nin: [null] } } },
      {
        $group: {
          _id: "$selectedDuration",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Timezone distribution (filtered by period)
    const timezoneStats = await MeetViewModel.aggregate([
      { $match: { ...dateFilter, selectedTimezone: { $exists: true, $nin: [null, ""] } } },
      {
        $group: {
          _id: "$selectedTimezone",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    console.log('Meet analytics results:', {
      period,
      totalViews,
      totalMeetingsScheduled,
      uniqueVisitors,
      conversionRate: totalViews > 0 ? ((totalMeetingsScheduled / totalViews) * 100).toFixed(2) : 0
    });
    
    return NextResponse.json({
      // Basic metrics
      totalViews,
      totalMeetingsScheduled,
      uniqueVisitors,
      conversionRate: totalViews > 0 ? ((totalMeetingsScheduled / totalViews) * 100).toFixed(2) : 0,
      
      // Step completion metrics
      step1Completions,
      step2Completions,
      step3Reached,
      step1ConversionRate: totalViews > 0 ? ((step1Completions / totalViews) * 100).toFixed(2) : 0,
      step2ConversionRate: step1Completions > 0 ? ((step2Completions / step1Completions) * 100).toFixed(2) : 0,
      step3ConversionRate: step2Completions > 0 ? ((step3Reached / step2Completions) * 100).toFixed(2) : 0,
      
      // Time-based metrics
      todayViews,
      weekViews,
      monthViews,
      
      // Charts and graphs data
      viewsByDate,
      geographicData,
      deviceStats,
      browserStats,
      osStats,
      hourlyDistribution: allHours,
      topReferrers,
      orgStats,
      conversionByCountry,
      durationStats,
      timezoneStats,
      
      // Recent activity
      recentViews,
      
      // Metadata
      period,
      dateRange: period === 'all' ? 'All time' : `Last ${period}`,
      queryTimestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting meet analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to get analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
