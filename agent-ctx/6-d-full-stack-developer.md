# Task 6-d: InventoryPage Cross-Module Integration

## Agent: full-stack-developer
## Status: ✅ Completed

## Summary

Integrated InventoryPage (`/src/components/cms/InventoryPage.tsx`) with the cross-module system by making 5 targeted changes:

### Changes Made

1. **Added cross-module imports** (line 28-29):
   - `useRegisterInventoryData`, `ProductCrossRef`, `ModuleBadge`, `CrossModuleSyncStatus` from `@/components/CrossModulePanel`
   - `useCrossModuleStore` from `@/lib/cross-module-store`

2. **Added auto-registration hook** (line 273-275):
   - `const { getProductByName } = useCrossModuleStore()` — for looking up store products
   - `useRegisterInventoryData(items)` — registers inventory items with the cross-module store on every update

3. **Added `CrossModuleSyncStatus`** (line 508-509):
   - Placed in the stats section, right after the 5 stats cards and before the low-stock alerts
   - Shows badges for shared contacts, linked products, stock mismatches, and synced items

4. **Added `ModuleBadge` for Store status** in each inventory table row (line 693-705):
   - Each item row now checks if it exists in the Store via `getProductByName(item.name)`
   - If found and has a store status, shows a pink "فروشگاه: فعال/پیش‌نویس/غیرفعال" badge below the inventory status badge
   - Uses an IIFE inside JSX to avoid hook-call-in-loop issues

5. **Added `ProductCrossRef` panel** in the Stock Adjustment Dialog (line 1302-1304):
   - When adjusting an item, the cross-ref panel shows store information (price, sale price, store status)
   - Placed between the adjustment preview and the dialog footer buttons

### Lint Result
- **0 errors in InventoryPage.tsx** ✅
- 1 pre-existing error in `page.tsx:638` (setState in effect — unrelated to this task)

### Dev Server
- Compiled successfully (no new warnings/errors)
- All API routes returning 200
