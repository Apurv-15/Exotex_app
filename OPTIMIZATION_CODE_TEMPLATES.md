# Performance Optimization Code Templates

## 1. PAGINATION SERVICE TEMPLATE

```typescript
// Add this to each service file (SalesService.ts, FieldVisitService.ts, etc.)

export const SalesService = {
  // Existing methods...
  
  // NEW: Paginated method
  getSalesPaginated: async (
    limit: number = 50,
    page: number = 1,
    filters?: {
      branchId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<{ data: Sale[]; total: number; hasMore: boolean }> => {
    if (!isSupabaseConfigured()) {
      // Fallback to mock/local data
      return { data: [], total: 0, hasMore: false };
    }

    try {
      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('sales')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dateFrom) {
        query = query.gte('sale_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('sale_date', filters.dateTo);
      }

      const { data, count, error } = await query
        .order('sale_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const total = count || 0;
      const hasMore = offset + limit < total;

      return {
        data: (data || []).map(dbToSale),
        total,
        hasMore
      };
    } catch (error) {
      console.error('Error fetching paginated sales:', error);
      throw error;
    }
  },

  // NEW: Get sales by branch with pagination
  getSalesByBranchPaginated: async (
    branchId: string,
    limit: number = 50,
    page: number = 1
  ): Promise<{ data: Sale[]; total: number; hasMore: boolean }> => {
    return SalesService.getSalesPaginated(limit, page, { branchId });
  },

  // NEW: Get sales by status with pagination
  getSalesByStatusPaginated: async (
    status: 'pending' | 'approved' | 'rejected',
    limit: number = 50,
    page: number = 1
  ): Promise<{ data: Sale[]; total: number; hasMore: boolean }> => {
    return SalesService.getSalesPaginated(limit, page, { status });
  },

  // NEW: Search sales
  searchSales: async (
    query: string,
    limit: number = 50,
    page: number = 1
  ): Promise<{ data: Sale[]; total: number }> => {
    if (!isSupabaseConfigured()) return { data: [], total: 0 };

    try {
      const offset = (page - 1) * limit;
      
      const { data, count, error } = await supabase
        .from('sales')
        .select('*', { count: 'exact' })
        .or(`customer_name.ilike.%${query}%,phone.ilike.%${query}%,invoice_number.ilike.%${query}%`)
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: (data || []).map(dbToSale),
        total: count || 0
      };
    } catch (error) {
      console.error('Error searching sales:', error);
      throw error;
    }
  }
};
```

---

## 2. CACHING SERVICE WRAPPER

```typescript
// Create: src/services/CacheService.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 60000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  clear() {
    this.cache.clear();
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();

// Usage in services:
export const SalesService = {
  getSalesPaginated: async (limit: number, page: number, filters?: any) => {
    const cacheKey = `sales:${limit}:${page}:${JSON.stringify(filters || {})}`;
    
    // Check cache first
    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;
    
    // Fetch from DB
    const result = await fetchSalesFromDB(limit, page, filters);
    
    // Cache for 2 minutes
    cacheManager.set(cacheKey, result, 120000);
    
    return result;
  }
};
```

---

## 3. OPTIMIZED FLATLIST COMPONENT

```typescript
// Replace ScrollView + map() with this component
// src/components/OptimizedDataList.tsx

import React, { useCallback } from 'react';
import { FlatList, View, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface OptimizedDataListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  estimatedItemSize: number;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onEndReachedThreshold?: number;
  listHeader?: React.ReactElement;
  numColumns?: number;
}

export const OptimizedDataList = React.memo(function OptimizedDataList<T>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize,
  onLoadMore,
  isLoading = false,
  hasMore = true,
  onEndReachedThreshold = 0.5,
  listHeader,
  numColumns = 1
}: OptimizedDataListProps<T>) {
  
  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  const LoadingFooter = () => (
    isLoading ? (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    ) : null
  );

  return (
    <FlashList
      data={data}
      renderItem={({ item, index }) => renderItem(item, index)}
      keyExtractor={(item, index) => keyExtractor(item, index)}
      estimatedItemSize={estimatedItemSize}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListHeaderComponent={listHeader}
      ListFooterComponent={<LoadingFooter />}
      numColumns={numColumns}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
    />
  );
});

const styles = StyleSheet.create({
  // Add styles as needed
});
```

---

## 4. OPTIMIZED DASHBOARD TAB FETCHING

```typescript
// Replace the fetchData function in MainBranchDashboard.tsx

const fetchData = useCallback(async (isInitial: boolean = true) => {
  if (isInitial) setLoading(true);

  try {
    let salesData: Sale[] = [];
    let visitsData: any[] = [];
    let stockData: Stock[] = [];
    let complaintsData: Complaint[] = [];
    let quotationsData: Quotation[] = [];

    const userBranch = user?.branchId;
    const userRegion = user?.region;
    const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';

    // OPTIMIZATION: Fetch only first page (50 items) initially
    // Lazy load other tabs only when they're accessed
    const corePromises = [
      isAdmin 
        ? SalesService.getSalesPaginated(50, 1)
        : (userBranch
          ? SalesService.getSalesByBranchPaginated(userBranch, 50, 1)
          : SalesService.getSalesPaginated(50, 1)),
      
      isAdmin 
        ? FieldVisitService.getFieldVisitsPaginated(50, 1)
        : (userBranch
          ? FieldVisitService.getFieldVisitsByBranchPaginated(userBranch, 50, 1)
          : FieldVisitService.getFieldVisitsPaginated(50, 1))
    ];

    const [salesResult, visitsResult] = await Promise.all(corePromises);

    salesData = salesResult.data;
    visitsData = visitsResult.data;

    // OPTIMIZATION: Lazy load other data only when needed
    const lazyLoadOtherData = async () => {
      if (activeTab === 'Stock' && stockData.length === 0) {
        stockData = (await StockService.getStockPaginated(50, 1)).data;
        setAllStock(stockData);
      }
      
      if (activeTab === 'Complaints' && complaintsData.length === 0) {
        complaintsData = (await ComplaintService.getComplaintsPaginated(50, 1)).data;
        setAllComplaints(complaintsData);
      }
      
      if (activeTab === 'Quotations' && quotationsData.length === 0) {
        quotationsData = (await QuotationService.getQuotationsPaginated(50, 1)).data;
        setAllQuotations(quotationsData);
      }
    };

    // Load other data in background (non-blocking)
    lazyLoadOtherData().catch(err => console.error('Error lazy loading data:', err));

    setAllSales(salesData);
    setAllVisits(visitsData);
    setSales(salesData.slice(0, 5)); // Show only 5 on dashboard
    setFieldVisits(visitsData.slice(0, 5));

    // Fetch user list for admin
    const { data: userData } = await supabase.from('users').select('*');
    setAllUsers(userData || []);

    // Build branches list
    const BLACKLIST = ['main', 'sub1', 'Xrxr', 'Dvd', 'Ss', 'd', '400604', 'test', 'garbage'];
    const allBranches = Array.from(
      new Set([
        ...salesData.map(s => s.branchId),
        ...visitsData.map(v => (v as any).branchId),
        ...(userData || []).map(u => u.branch_id)
      ])
    ).filter(b => b && !BLACKLIST.includes(b)) as string[];

    setOfficialRegions(allBranches);

  } catch (error: any) {
    console.error('FetchData Error:', error);
    Alert.alert("Failed to Update", `Failed to fetch data: ${error.message || 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
}, [user?.role, user?.branchId, activeTab]); // Added activeTab dependency
```

---

## 5. DEBOUNCED FILTER HOOK

```typescript
// Create: src/hooks/useDebouncedState.ts

import { useState, useCallback, useRef } from 'react';

export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const [debouncedState, setDebouncedState] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setDebouncedValue = useCallback((value: T) => {
    setState(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedState(value);
    }, delay);
  }, [delay]);

  return [state, debouncedState, setDebouncedValue];
}

// Usage in MainBranchDashboard:
const [filter, debouncedFilter, setFilter] = useDebouncedState<'All' | 'Today' | 'Month' | 'Year'>('All', 300);

const filteredSales = useMemo(() => {
  // Uses debouncedFilter instead of filter
  // So expensive calculations wait for user to stop changing filter
  return filterSalesData(allSales, debouncedFilter, officialRegions);
}, [allSales, debouncedFilter, officialRegions]);
```

---

## 6. DATA INDEXING HOOK

```typescript
// Create: src/hooks/useIndexedData.ts

import { useMemo } from 'react';

interface DataIndex<T> {
  byId: Map<string, T>;
  byBranch: Map<string, T[]>;
  byStatus: Map<string, T[]>;
}

export function useIndexedSales(sales: Sale[]): DataIndex<Sale> {
  return useMemo(() => {
    const index: DataIndex<Sale> = {
      byId: new Map(),
      byBranch: new Map(),
      byStatus: new Map()
    };

    sales.forEach(sale => {
      // Index by ID
      index.byId.set(sale.id, sale);

      // Index by branch
      if (!index.byBranch.has(sale.branchId)) {
        index.byBranch.set(sale.branchId, []);
      }
      index.byBranch.get(sale.branchId)!.push(sale);

      // Index by status
      if (!index.byStatus.has(sale.status)) {
        index.byStatus.set(sale.status, []);
      }
      index.byStatus.get(sale.status)!.push(sale);
    });

    return index;
  }, [sales]);
}

// Usage:
const salesIndex = useIndexedSales(allSales);

// Now filtering is instant:
const branchSales = useMemo(() => {
  return selectedRegion ? salesIndex.byBranch.get(selectedRegion) || [] : allSales;
}, [selectedRegion, salesIndex, allSales]);
```

---

## 7. INFINITE SCROLL PAGINATION COMPONENT

```typescript
// Create: src/hooks/usePaginatedData.ts

import { useState, useCallback } from 'react';

interface UsePaginatedDataOptions {
  initialPage?: number;
  itemsPerPage?: number;
}

export function usePaginatedData<T>(
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: UsePaginatedDataOptions = {}
) {
  const { initialPage = 1, itemsPerPage = 50 } = options;

  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page, itemsPerPage);
      setData(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, fetchFn, itemsPerPage]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  return {
    data,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset
  };
}

// Usage in component:
const complaints = usePaginatedData(
  (page, limit) => ComplaintService.getComplaintsPaginated(limit, page),
  { itemsPerPage: 50 }
);

// In render:
<OptimizedDataList
  data={complaints.data}
  renderItem={(item) => <ComplaintItem {...item} />}
  keyExtractor={(item) => item.id}
  estimatedItemSize={80}
  onLoadMore={complaints.loadMore}
  isLoading={complaints.isLoading}
  hasMore={complaints.hasMore}
/>
```

---

## 8. PERFORMANCE MONITORING HOOK

```typescript
// Create: src/hooks/usePerformanceMonitor.ts

import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(componentName: string) {
  const mountTimeRef = useRef(Date.now());
  const renderStartRef = useRef(Date.now());

  useEffect(() => {
    const renderEndTime = Date.now();
    const renderDuration = renderEndTime - renderStartRef.current;
    
    if (renderDuration > 16) { // 60fps = 16ms per frame
      console.warn(
        `⚠️ [${componentName}] Slow render detected: ${renderDuration}ms`
      );
    }

    renderStartRef.current = Date.now();
  });

  useEffect(() => {
    return () => {
      const totalTime = Date.now() - mountTimeRef.current;
      console.log(
        `✅ [${componentName}] Mounted for ${totalTime}ms`
      );
    };
  }, [componentName]);
}

// Usage:
export default function MainBranchDashboard() {
  usePerformanceMonitor('MainBranchDashboard');
  // ... rest of component
}
```

---

## 9. INSTALLATION COMMANDS

```bash
# Install required packages for optimization

# FlashList for virtualization
npm install @shopify/flash-list

# Fast image loading
npm install react-native-fast-image

# Performance monitoring (optional)
npm install @react-native-firebase/perf

# Async storage for caching (optional)
npm install @react-native-async-storage/async-storage
```

---

## 10. QUICK INTEGRATION CHECKLIST

- [ ] Create pagination methods in all services
- [ ] Replace ScrollView with OptimizedDataList in PhotosTab
- [ ] Replace ScrollView with OptimizedDataList in ComplaintsTab
- [ ] Replace ScrollView with OptimizedDataList in QuotationsTab
- [ ] Implement CacheManager for service calls
- [ ] Add usePaginatedData hook to tabs
- [ ] Implement lazy loading based on activeTab
- [ ] Test with 5000+ records
- [ ] Profile with React DevTools
- [ ] Monitor memory usage

---

## Testing Commands

```typescript
// Test pagination with fake data
const testPagination = async () => {
  const page1 = await SalesService.getSalesPaginated(50, 1);
  console.log('Page 1:', page1.data.length, 'items');
  
  const page2 = await SalesService.getSalesPaginated(50, 2);
  console.log('Page 2:', page2.data.length, 'items');
  
  console.log('Has more:', page1.hasMore);
};

// Test cache
const testCache = async () => {
  const start1 = Date.now();
  const result1 = await SalesService.getSalesPaginated(50, 1);
  console.log('First call:', Date.now() - start1, 'ms');
  
  const start2 = Date.now();
  const result2 = await SalesService.getSalesPaginated(50, 1);
  console.log('Cached call:', Date.now() - start2, 'ms'); // Should be instant
};
```
