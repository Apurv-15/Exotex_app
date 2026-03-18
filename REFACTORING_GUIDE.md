# Specific File Refactoring Guide

## Quick Reference: Which Files to Modify

### 🔴 PRIORITY 1: Services (Most Impact)

#### SalesService.ts
Add these methods:
```typescript
// After line 200, add pagination methods:
getSalesPaginated(limit, page, filters)
getSalesByBranchPaginated(branchId, limit, page)
getSalesByStatusPaginated(status, limit, page)
searchSales(query, limit, page)
```

#### FieldVisitService.ts
Add: `getFieldVisitsPaginated()`, `getFieldVisitsByBranchPaginated()`

#### ComplaintService.ts
Add: `getComplaintsPaginated()`, `getComplaintsByBranchPaginated()`

#### QuotationService.ts
Add: `getQuotationsPaginated()`, `getQuotationsByBranchPaginated()`

#### StockService.ts
Add: `getStockPaginated()`, `getStockByRegionPaginated()`

**Time Investment:** 2-3 hours
**Impact:** 75% performance improvement

---

### 🟠 PRIORITY 2: Dashboard Components (Rendering)

#### MainBranchDashboard.tsx
**Lines to modify:**
- Line 60-76: State declarations → Split into UI state, data state, pagination state
- Line 82-140: `fetchData()` → Implement lazy loading per tab
- Line 244-280: Filter calculations → Add debouncing
- Line 300-380: Memo calculations → Separate heavy computations

**Changes needed:**
```typescript
// BEFORE (line 82):
const fetchData = useCallback(async (isInitial: boolean = true) => {
  // Fetches ALL data

// AFTER:
const fetchData = useCallback(async (isInitial: boolean = true) => {
  // Fetches only first page + lazy load others based on activeTab
```

**Time Investment:** 1-2 hours
**Impact:** 50% faster initial load

---

#### PhotosTab.tsx
**Lines to modify:**
- Line 85-110: ScrollView with map() → FlatList/FlashList
- Implement virtualization
- Add infinite scroll loading

**Before:**
```typescript
<ScrollView>
  {displayPhotos.map((photo) => <PhotoItem ... />)}
</ScrollView>
```

**After:**
```typescript
<OptimizedDataList
  data={displayPhotos}
  renderItem={renderPhotoItem}
  keyExtractor={photo => photo.url}
  estimatedItemSize={ITEM_SIZE}
  onLoadMore={loadMorePhotos}
/>
```

**Time Investment:** 30 minutes
**Impact:** 70% faster rendering on this tab

---

#### ComplaintsTab.tsx
**Lines to modify:**
- Line 50-80: Replace scrolling list with FlatList
- Add pagination support

**Time Investment:** 30 minutes
**Impact:** 60% faster rendering

---

#### QuotationsTab.tsx
**Lines to modify:**
- Line 45-75: Same as ComplaintsTab
- Add pagination support

**Time Investment:** 30 minutes
**Impact:** 60% faster rendering

---

### 🟡 PRIORITY 3: New Files to Create

#### src/services/CacheService.ts
```typescript
// New file - implements caching layer
// Time: 30 minutes
```

#### src/hooks/usePaginatedData.ts
```typescript
// New file - reusable pagination hook
// Time: 30 minutes
```

#### src/hooks/useDebouncedState.ts
```typescript
// New file - debounced state for filters
// Time: 20 minutes
```

#### src/hooks/useIndexedData.ts
```typescript
// New file - data indexing for fast filtering
// Time: 20 minutes
```

#### src/components/OptimizedDataList.tsx
```typescript
// New file - universal virtualized list component
// Time: 1 hour
```

---

## Detailed Step-by-Step Refactoring Path

### STEP 1: Add Pagination to Services (2 hours)

**SalesService.ts:**
```typescript
// Add AFTER the existing getAllSales() method

getSalesPaginated: async (
  limit: number = 50,
  page: number = 1,
  filters?: { branchId?: string; status?: string }
): Promise<{ data: Sale[]; total: number; hasMore: boolean }> => {
  // Implementation from templates
}
```

**Repeat for:** FieldVisitService, ComplaintService, QuotationService, StockService

**Testing:** 
```typescript
// Run in console
const result = await SalesService.getSalesPaginated(50, 1);
console.log(result); // Should have {data: [...], total: X, hasMore: true/false}
```

---

### STEP 2: Create Optimization Hooks (1.5 hours)

Create these 4 files in `src/hooks/`:
1. `usePaginatedData.ts` - For infinite scroll
2. `useDebouncedState.ts` - For filter debouncing
3. `useIndexedData.ts` - For fast filtering
4. `usePerformanceMonitor.ts` - For debugging

---

### STEP 3: Update MainBranchDashboard.tsx (2 hours)

**Modify fetchData():**
```typescript
// CHANGE FROM:
const [allSales, setAllSales] = useState<Sale[]>([]);
const [allVisits, setAllVisits] = useState<any[]>([]);

// CHANGE TO:
const [allSales, setAllSales] = useState<Sale[]>([]);
const [allVisits, setAllVisits] = useState<any[]>([]);
const [salesPage, setSalesPage] = useState(1);
const [visitsPage, setVisitsPage] = useState(1);
const [hasMoreSales, setHasMoreSales] = useState(true);
const [hasMoreVisits, setHasMoreVisits] = useState(true);
```

**New lazy load function:**
```typescript
const loadMoreSales = useCallback(async () => {
  if (!hasMoreSales) return;
  const result = await SalesService.getSalesPaginated(50, salesPage);
  setAllSales(prev => [...prev, ...result.data]);
  setHasMoreSales(result.hasMore);
  setSalesPage(prev => prev + 1);
}, [salesPage, hasMoreSales]);
```

---

### STEP 4: Replace ScrollViews with FlashList (1.5 hours)

**In PhotosTab.tsx:**
```typescript
// INSTALL FIRST:
// npm install @shopify/flash-list

// CHANGE FROM:
<ScrollView>
  {displayPhotos.map((p, i) => <PhotoPreview key={i} photo={p} />)}
</ScrollView>

// CHANGE TO:
<FlashList
  data={displayPhotos}
  renderItem={({ item }) => <PhotoPreview photo={item} />}
  keyExtractor={(item, idx) => `${item.id || idx}`}
  estimatedItemSize={120}
  onEndReached={() => loadMorePhotos()}
  onEndReachedThreshold={0.5}
/>
```

**Repeat for:** ComplaintsTab, QuotationsTab, VisitsTab

---

### STEP 5: Implement Debounced Filters (1 hour)

**In MainBranchDashboard.tsx:**
```typescript
// Import
import { useDebouncedState } from '../hooks/useDebouncedState';

// CHANGE FROM:
const [filter, setFilter] = useState<'All' | 'Today' | 'Month' | 'Year'>('All');

// CHANGE TO:
const [filter, debouncedFilter, setFilter] = useDebouncedState<'All' | 'Today' | 'Month' | 'Year'>('All', 300);

// In filteredSales useMemo, use debouncedFilter instead of filter:
const filteredSales = useMemo(() => {
  // ... use debouncedFilter
}, [allSales, debouncedFilter, officialRegions]); // NOT filter
```

---

### STEP 6: Add Data Indexing (1 hour)

**In MainBranchDashboard.tsx:**
```typescript
// Import
import { useIndexedSales } from '../hooks/useIndexedData';

// Add after fetchData:
const salesIndex = useIndexedSales(allSales);
const visitsIndex = useIndexedVisits(allVisits);

// Now replace complex filtering:
const displaySales = useMemo(() => {
  if (!selectedRegion) return allSales;
  return salesIndex.byBranch.get(selectedRegion) || [];
}, [selectedRegion, salesIndex]);
```

---

### STEP 7: Optimize Memo Calculations (1 hour)

**Move heavy calculations to separate hooks:**

```typescript
// Create src/hooks/useDashboardStats.ts

export function useDashboardStats(sales: Sale[], filter: string) {
  return useMemo(() => {
    const topModels = calculateTopModels(sales);
    const regionStats = calculateStats(sales);
    return { topModels, regionStats };
  }, [sales, filter]);
}

// In component:
const stats = useDashboardStats(filteredSales, debouncedFilter);
```

---

## Testing After Each Step

### Step 1 Test - Pagination
```typescript
// In MainBranchDashboard useEffect, add:
const testPagination = async () => {
  const p1 = await SalesService.getSalesPaginated(50, 1);
  console.log('✅ Paginated:', p1.data.length, 'items, hasMore:', p1.hasMore);
};
testPagination();
```

### Step 2 Test - Hooks
```typescript
// Test in component
const paginated = usePaginatedData(getSalesPage);
console.log('✅ Paginated hook works:', paginated.data.length);
```

### Step 3 Test - MainDashboard
```typescript
// Should load in < 2 seconds instead of 5-10
console.time('Dashboard Load');
// ... init code
console.timeEnd('Dashboard Load');
```

### Step 4 Test - FlashList
```typescript
// Scroll should be 55-60 fps, not 30-45 fps
// Measure with React Profiler or:
import { InteractionManager } from 'react-native';
// Monitor fps using DevTools
```

### Step 5 Test - Debouncing
```typescript
// Change filter rapidly
// Should see delay before recalculation (not instant lag)
```

---

## Performance Benchmarks to Track

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| Initial Load | 10s | 2s | `console.time()` |
| Memory (all data) | 400MB | 80MB | Xcode Instruments / Android profiler |
| Scroll FPS | 35 fps | 58 fps | React DevTools Profiler |
| Filter Response | 3s lag | <200ms | User interaction timing |
| Tab Switch | 2s | <500ms | Navigation timing |

---

## Debugging Tips

### Enable React DevTools Profiler
```bash
# Run on device
npx expo start
# Press 'e' to open in Expo Go
# Open Chrome DevTools
# React tab → Profiler
```

### Monitor Memory
```typescript
import { getMemoryUsage } from 'react-native-performance-monitor';

useEffect(() => {
  setInterval(() => {
    console.log('Memory:', getMemoryUsage());
  }, 5000);
}, []);
```

### Track Render Times
```typescript
console.time('MainDashboard Render');
// ... component renders
console.timeEnd('MainDashboard Render');
```

---

## Common Issues & Fixes

### Issue: "Cannot read property 'data' of undefined"
**Fix:** Ensure paginated methods return `{data: [], hasMore: false}` structure

### Issue: "Blank screen on slow devices"
**Fix:** Show loading skeleton while data loads

### Issue: "Not lazy loading"
**Fix:** Check activeTab dependency in useCallback for fetchData

### Issue: "Still laggy"
**Fix:** 
1. Reduce ITEMS_PER_PAGE from 50 to 25
2. Increase InteractionManager timeout
3. Profile with DevTools to find bottleneck

---

## Rollback Plan

If anything breaks:
```bash
# Revert service changes only (keep UI changes)
git diff src/services/
git checkout src/services/

# Or revert specific file
git checkout src/screens/dashboard/MainBranchDashboard.tsx
```

Keep UI changes (FlatList) - they're safe and improve performance on their own.
