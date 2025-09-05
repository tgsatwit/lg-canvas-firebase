import { NextRequest, NextResponse } from 'next/server';

const VIMEO_OTT_API_BASE = 'https://api.vhx.tv';

// Cache for status breakdown
interface StatusBreakdownCache {
  data: any;
  timestamp: number;
  expires: number;
}

const statusBreakdownCache = new Map<string, StatusBreakdownCache>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds (longer cache since this is summary data)

function getCachedStatusBreakdown(cacheKey: string): any | null {
  const entry = statusBreakdownCache.get(cacheKey);
  if (!entry) return null;
  
  const now = Date.now();
  if (now > entry.expires) {
    statusBreakdownCache.delete(cacheKey);
    return null;
  }
  
  console.log(`Status breakdown cache HIT - data is ${Math.round((now - entry.timestamp) / 1000)}s old`);
  return entry.data;
}

function setCachedStatusBreakdown(cacheKey: string, data: any): void {
  const now = Date.now();
  statusBreakdownCache.set(cacheKey, {
    data,
    timestamp: now,
    expires: now + CACHE_DURATION
  });
  console.log(`Status breakdown cache SET - expires in ${CACHE_DURATION / 1000}s`);
}

async function fetchStatusCount(status: string): Promise<number> {
  try {
    let totalCount = 0;
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '50',
        status: status
      });
      
      // Note: Temporarily commenting out product filter to debug 404 error
      // TODO: Investigate if product parameter name is correct or if we need a product ID
      // queryParams.append('product', 'PBL Online Subscription');

      const apiUrl = `${VIMEO_OTT_API_BASE}/customers?${queryParams.toString()}`;
      console.log(`Fetching ${status} status from: ${apiUrl}`);

      const response = await fetch(
        apiUrl,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.VIMEO_OTT_API_KEY}:`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Vimeo OTT API error for status ${status}: ${response.status}`);
      }

      const data = await response.json();
      const pageCustomers = Array.isArray(data) ? data : (data._embedded?.customers || data.customers || []);
      
      totalCount += pageCustomers.length;

      if (pageCustomers.length < 50) {
        hasMorePages = false;
      } else {
        currentPage++;
        if (currentPage > 25) { // Safety limit
          console.warn(`Reached max pages for status ${status}`);
          hasMorePages = false;
        }
      }
    }

    console.log(`Status ${status}: ${totalCount} customers`);
    return totalCount;
  } catch (error) {
    console.error(`Error fetching ${status} status:`, error);
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const cacheKey = 'pbl-status-breakdown';
    const cachedData = getCachedStatusBreakdown(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    console.log('Status breakdown cache MISS - fetching from Vimeo OTT API...');

    // Fetch counts for all statuses in parallel
    const statuses = ['enabled', 'cancelled', 'expired', 'disabled', 'paused', 'refunded'];
    
    const statusPromises = statuses.map(status => 
      fetchStatusCount(status).then(count => ({ status, count }))
    );

    const statusCounts = await Promise.all(statusPromises);
    
    // Convert to object format
    const breakdown = {};
    let totalCount = 0;
    
    statusCounts.forEach(({ status, count }) => {
      breakdown[status] = count;
      totalCount += count;
    });

    const responseData = {
      breakdown,
      total: totalCount,
      timestamp: new Date().toISOString()
    };

    // Cache the response
    setCachedStatusBreakdown(cacheKey, responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Status breakdown API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status breakdown from Vimeo OTT' },
      { status: 500 }
    );
  }
}