import { NextRequest, NextResponse } from 'next/server';

const VIMEO_OTT_API_BASE = 'https://api.vhx.tv';

// Cache for all members data
interface AllMembersCache {
  data: any;
  timestamp: number;
  expires: number;
}

const allMembersCache = new Map<string, AllMembersCache>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface VimeoOttCustomer {
  id: number;
  email: string;
  name?: string;
  status?: 'enabled' | 'cancelled' | 'expired' | 'disabled' | 'paused' | 'refunded';
  created_at: string;
  updated_at: string;
  plan: string;
  subscribed_to_site: boolean;
  _embedded?: {
    latest_event?: {
      topic: string;
      data: {
        action: string;
        status: string;
        frequency?: string;
        price?: {
          cents: number;
          currency: string;
          formatted: string;
        };
      };
      _embedded?: {
        product: string;
      };
    };
  };
}

function getCachedAllMembers(): any | null {
  const entry = allMembersCache.get('all-members');
  if (!entry) return null;
  
  const now = Date.now();
  if (now > entry.expires) {
    allMembersCache.delete('all-members');
    return null;
  }
  
  console.log(`All members cache HIT - data is ${Math.round((now - entry.timestamp) / 1000)}s old`);
  return entry.data;
}

function setCachedAllMembers(data: any): void {
  const now = Date.now();
  allMembersCache.set('all-members', {
    data,
    timestamp: now,
    expires: now + CACHE_DURATION
  });
  console.log(`All members cache SET - expires in ${CACHE_DURATION / 1000}s`);
}

export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const cachedData = getCachedAllMembers();
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    console.log('All members cache MISS - fetching from Vimeo OTT API...');

    // Fetch ALL customers (no status filter)
    const allCustomers: VimeoOttCustomer[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '50', // Max per page
        sort: 'created_at'
      });

      const apiUrl = `${VIMEO_OTT_API_BASE}/customers?${queryParams.toString()}`;
      console.log(`Fetching page ${currentPage} from: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.VIMEO_OTT_API_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Vimeo OTT API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const pageCustomers = Array.isArray(data) ? data : (data._embedded?.customers || data.customers || []);
      
      console.log(`Page ${currentPage}: Found ${pageCustomers.length} customers`);
      allCustomers.push(...pageCustomers);

      if (pageCustomers.length < 50) {
        hasMorePages = false;
        console.log(`Reached end at page ${currentPage}`);
      } else {
        currentPage++;
        if (currentPage > 100) { // Safety limit - should handle most cases
          console.warn('Reached maximum page limit (100) - this seems unusually high');
          hasMorePages = false;
        }
      }
    }

    console.log(`Fetched ${allCustomers.length} total customers across ${currentPage - 1} pages`);

    // Process and organize the data
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Group customers by status
    const customersByStatus = {
      enabled: [] as VimeoOttCustomer[],
      cancelled: [] as VimeoOttCustomer[],
      expired: [] as VimeoOttCustomer[],
      disabled: [] as VimeoOttCustomer[],
      paused: [] as VimeoOttCustomer[],
      refunded: [] as VimeoOttCustomer[]
    };

    // Categorize each customer
    allCustomers.forEach(customer => {
      const status = customer.status || 'enabled';
      if (customersByStatus[status]) {
        customersByStatus[status].push(customer);
      }
    });

    // Calculate statistics
    const stats = {
      total: allCustomers.length,
      byStatus: {
        enabled: customersByStatus.enabled.length,
        cancelled: customersByStatus.cancelled.length,
        expired: customersByStatus.expired.length,
        disabled: customersByStatus.disabled.length,
        paused: customersByStatus.paused.length,
        refunded: customersByStatus.refunded.length
      },
      thisWeek: {
        joined: allCustomers.filter(c => {
          const joinDate = new Date(c.created_at);
          return joinDate >= oneWeekAgo && joinDate <= now;
        }).length,
        cancelled: allCustomers.filter(c => {
          const updateDate = new Date(c.updated_at);
          return (c.status === 'cancelled' || c.status === 'expired') && 
                 updateDate >= oneWeekAgo && updateDate <= now;
        }).length
      }
    };

    const responseData = {
      allCustomers,
      customersByStatus,
      stats,
      timestamp: new Date().toISOString()
    };

    // Cache the response
    setCachedAllMembers(responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('All members API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch all members from Vimeo OTT' },
      { status: 500 }
    );
  }
}