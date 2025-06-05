import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ResumeViewModel from '@/lib/models/ResumeView';
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
    
    console.log('Analytics query with period:', period, 'Date filter:', dateFilter);
    
    // Basic stats with date filtering
    const totalViews = await ResumeViewModel.countDocuments(dateFilter);
    const totalDownloads = await ResumeViewModel.countDocuments({ 
      ...dateFilter, 
      downloaded: true 
    });
    const uniqueVisitors = await ResumeViewModel.distinct('ip', dateFilter).then(ips => ips.length);
    
    // Time-based analytics (these remain static for "today", "week", "month")
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date();
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    
    const todayViews = await ResumeViewModel.countDocuments({ 
      createdAt: { $gte: startOfToday } 
    });
    const weekViews = await ResumeViewModel.countDocuments({ 
      createdAt: { $gte: startOfWeek } 
    });
    const monthViews = await ResumeViewModel.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    
    // Views by date (filtered by period)
    const viewsByDate = await ResumeViewModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          views: { $sum: 1 },
          downloads: { $sum: { $cond: [{ $eq: ["$downloaded", true] }, 1, 0] } }
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
      
    const geographicData = await ResumeViewModel.aggregate([
      { $match: geoMatchCondition },
      {
        $group: {
          _id: "$country",
          viewCount: { $sum: 1 },
          cities: { $addToSet: "$city" },
          downloadCount: { $sum: { $cond: [{ $eq: ["$downloaded", true] }, 1, 0] } }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 20 }
    ]);
    
    // Device and browser analytics (filtered by period)
    const deviceStats = await ResumeViewModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$deviceType",
          viewCount: { $sum: 1 },
          downloadCount: { $sum: { $cond: [{ $eq: ["$downloaded", true] }, 1, 0] } }
        }
      },
      { $sort: { viewCount: -1 } }
    ]);
    
    const browserMatchCondition = period === 'all'
      ? { browser: { $exists: true, $nin: [null, ""] } }
      : { 
          ...(dateFilter as any),
          browser: { $exists: true, $nin: [null, ""] } 
        };
      
    const browserStats = await ResumeViewModel.aggregate([
      { $match: browserMatchCondition },
      {
        $group: {
          _id: "$browser",
          viewCount: { $sum: 1 },
          downloadCount: { $sum: { $cond: [{ $eq: ["$downloaded", true] }, 1, 0] } }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 }
    ]);
    
    const osMatchCondition = period === 'all'
      ? { os: { $exists: true, $nin: [null, ""] } }
      : { 
          ...(dateFilter as any),
          os: { $exists: true, $nin: [null, ""] } 
        };
      
    const osStats = await ResumeViewModel.aggregate([
      { $match: osMatchCondition },
      {
        $group: {
          _id: "$os",
          viewCount: { $sum: 1 },
          downloadCount: { $sum: { $cond: [{ $eq: ["$downloaded", true] }, 1, 0] } }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 }
    ]);
    
    // Hourly distribution (filtered by period)
    const hourlyDistribution = await ResumeViewModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          viewCount: { $sum: 1 },
          downloadCount: { $sum: { $cond: [{ $eq: ["$downloaded", true] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const referrerMatchCondition = period === 'all'
      ? { referrer: { $exists: true, $nin: [null, ""] } }
      : { 
          ...(dateFilter as any),
          referrer: { $exists: true, $nin: [null, ""] } 
        };
      
    // Top referrers (filtered by period)
    const topReferrers = await ResumeViewModel.aggregate([
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
    const recentViews = await ResumeViewModel.find(recentViewsFilter)
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
    const orgStats = await ResumeViewModel.aggregate([
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
      
    // Download conversion rate by country (filtered by period)
    const conversionByCountry = await ResumeViewModel.aggregate([
      { $match: conversionMatchCondition },
      {
        $group: {
          _id: "$country",
          totalViews: { $sum: 1 },
          totalDownloads: { $sum: { $cond: [{ $eq: ["$downloaded", true] }, 1, 0] } }
        }
      },
      {
        $project: {
          country: "$_id",
          totalViews: 1,
          totalDownloads: 1,
          conversionRate: { 
            $multiply: [
              { $divide: ["$totalDownloads", "$totalViews"] },
              100
            ]
          }
        }
      },
      { $sort: { totalViews: -1 } },
      { $limit: 15 }
    ]);
    
    console.log('Analytics results:', {
      period,
      totalViews,
      totalDownloads,
      uniqueVisitors,
      conversionRate: totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(2) : 0
    });
    
    return NextResponse.json({
      // Basic metrics
      totalViews,
      totalDownloads,
      uniqueVisitors,
      conversionRate: totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(2) : 0,
      
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
      hourlyDistribution,
      topReferrers,
      orgStats,
      conversionByCountry,
      
      // Recent activity
      recentViews,
      
      // Metadata
      period,
      dateRange: period === 'all' ? 'All time' : `Last ${period}`,
      queryTimestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting resume analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to get analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}