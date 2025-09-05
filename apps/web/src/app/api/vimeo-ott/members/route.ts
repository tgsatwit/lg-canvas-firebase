import { NextRequest, NextResponse } from 'next/server';

const VIMEO_OTT_API_BASE = 'https://api.vhx.tv';

// In-memory cache for members data
interface CacheEntry {
  data: any;
  timestamp: number;
  expires: number;
}

const membersCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper functions for cache management
function getCacheKey(params: { status?: string; product?: string; query?: string; timeFilter?: string }): string {
  return `members-${params.status || 'enabled'}-pbl-online-${params.query || 'none'}-${params.timeFilter || 'all'}`;
}

function getCachedData(cacheKey: string): any | null {
  const entry = membersCache.get(cacheKey);
  if (!entry) return null;
  
  const now = Date.now();
  if (now > entry.expires) {
    membersCache.delete(cacheKey);
    return null;
  }
  
  console.log(`Cache HIT for ${cacheKey} - data is ${Math.round((now - entry.timestamp) / 1000)}s old`);
  return entry.data;
}

function setCachedData(cacheKey: string, data: any): void {
  const now = Date.now();
  membersCache.set(cacheKey, {
    data,
    timestamp: now,
    expires: now + CACHE_DURATION
  });
  console.log(`Cache SET for ${cacheKey} - expires in ${CACHE_DURATION / 1000}s`);
}

interface VimeoOttCustomer {
  id: number;
  email: string;
  name?: string;
  status?: 'active' | 'inactive' | 'cancelled';
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

interface VimeoOttResponse {
  customers?: VimeoOttCustomer[];
  _embedded?: {
    customers: VimeoOttCustomer[];
  };
  page?: {
    size: number;
    number: number;
    total: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const product = searchParams.get('product');
    const sort = searchParams.get('sort') || 'created_at';
    const query = searchParams.get('query');
    const timeFilter = searchParams.get('timeFilter'); // 'joined7days' or 'cancelled7days'
    
    // Check cache first
    const cacheKey = getCacheKey({ status, product, query, timeFilter });
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }
    
    console.log(`Cache MISS for ${cacheKey} - fetching from Vimeo OTT API...`);

    // Fetch all customers by paginating through all pages
    const allCustomers: VimeoOttCustomer[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      // Build query parameters for current page
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '50', // Vimeo OTT max per page
        sort
      });
      
      // Note: Temporarily commenting out product filter to debug 404 error
      // TODO: Investigate if product parameter name is correct or if we need a product ID
      // queryParams.append('product', 'PBL Online Subscription');

      // Add status filter - default to 'enabled' for main view, but allow override for breakdown views
      if (status && ['enabled', 'cancelled', 'expired', 'disabled', 'paused', 'refunded'].includes(status)) {
        queryParams.append('status', status);
      } else {
        queryParams.append('status', 'enabled'); // Default to enabled (active subscribers)
      }

      if (query) queryParams.append('query', query);

      const apiUrl = `${VIMEO_OTT_API_BASE}/customers?${queryParams.toString()}`;
      console.log(`Fetching page ${currentPage} from Vimeo OTT: ${apiUrl}`);

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
        throw new Error(`Vimeo OTT API error: ${response.status} ${response.statusText}`);
      }

      const data: VimeoOttResponse = await response.json();
      
      // Extract customers from this page
      const pageCustomers = Array.isArray(data) ? data : (data._embedded?.customers || data.customers || []);
      
      console.log(`Page ${currentPage}: Found ${pageCustomers.length} PBL Online Subscription customers with status ${status || 'enabled'}`);
      
      // Add all customers from this page (already filtered by API to enabled status)
      allCustomers.push(...pageCustomers);

      // Check if there are more pages
      if (pageCustomers.length < 50) {
        // If we got less than 50 customers total, we've reached the end
        hasMorePages = false;
        console.log(`Reached end of pagination at page ${currentPage} with ${pageCustomers.length} total customers`);
      } else {
        // Continue to next page
        currentPage++;
        // Safety limit based on expected ~308 active subscribers
        if (currentPage > 10) { 
          console.warn('Reached maximum page limit (10), stopping pagination');
          hasMorePages = false;
        }
      }
    }

    console.log(`Fetched ${allCustomers.length} PBL Online Subscription customers (${status || 'enabled'}) across ${currentPage - 1} pages`);
    
    const customers = allCustomers;

    // Calculate statistics for current week (last 7 days)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Map Vimeo OTT statuses to our internal status types
    const getCustomerStatus = (customer: VimeoOttCustomer): 'active' | 'cancelled' | 'inactive' => {
      // Check the actual status from the API response
      if (customer.status === 'enabled') return 'active';
      if (customer.status === 'cancelled' || customer.status === 'expired' || customer.status === 'disabled') return 'cancelled';
      if (customer.status === 'paused' || customer.status === 'refunded') return 'inactive';
      return 'inactive'; // fallback
    };

    const stats = {
      total: customers.length,
      active: customers.filter(c => getCustomerStatus(c) === 'active').length,
      cancelled: customers.filter(c => getCustomerStatus(c) === 'cancelled').length,
      thisWeek: {
        joined: customers.filter(c => {
          const joinDate = new Date(c.created_at);
          return joinDate >= oneWeekAgo && joinDate <= now;
        }).length,
        cancelled: customers.filter(c => {
          const updateDate = new Date(c.updated_at);
          const status = getCustomerStatus(c);
          // Consider cancelled if status is cancelled and updated recently
          return status === 'cancelled' && updateDate >= oneWeekAgo && updateDate <= now;
        }).length,
      }
    };

    // Transform customers to include status and product info
    const transformedCustomers = customers.map(customer => ({
      ...customer,
      id: customer.id.toString(),
      status: getCustomerStatus(customer),
      product: {
        name: customer._embedded?.latest_event?._embedded?.product || 'All Subscriptions',
        id: 'unknown'
      }
    }));

    // Apply time-based filtering if requested
    let filteredCustomers = transformedCustomers;
    if (timeFilter === 'joined7days') {
      filteredCustomers = transformedCustomers.filter(c => {
        const joinDate = new Date(c.created_at);
        return joinDate >= oneWeekAgo && joinDate <= now;
      });
    } else if (timeFilter === 'cancelled7days') {
      filteredCustomers = transformedCustomers.filter(c => {
        const updateDate = new Date(c.updated_at);
        const status = getCustomerStatus(c);
        return status === 'cancelled' && updateDate >= oneWeekAgo && updateDate <= now;
      });
    }

    const responseData = {
      customers: filteredCustomers,
      stats,
      pagination: {
        size: customers.length,
        number: 1,
        total: customers.length,
        pages: currentPage - 1
      }
    };
    
    // Cache the response data
    setCachedData(cacheKey, responseData);
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Vimeo OTT API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members from Vimeo OTT' },
      { status: 500 }
    );
  }
}