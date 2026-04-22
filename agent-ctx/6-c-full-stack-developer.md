# Task 6-c: Cross-Module Integration for AccountingPage

## Status: ✅ COMPLETED

## Changes Made

### File Modified: `/home/z/my-project/src/components/cms/AccountingPage.tsx`

1. **Added imports** (line 35-36):
   - `useRegisterAccountingData`, `ContactCrossRef`, `ModuleBadge`, `CrossModuleSyncStatus` from `@/components/CrossModulePanel`
   - `useCrossModuleStore` from `@/lib/cross-module-store`

2. **Added auto-registration hook** (line 233-235):
   - `useRegisterAccountingData(invoices, transactions)` — registers invoice and transaction data into the cross-module Zustand store
   - `const { getContactByName } = useCrossModuleStore()` — gets the cross-reference query function

3. **Added `CrossModuleSyncStatus`** (line 381-383):
   - Placed in the stats area, above the stat cards grid
   - Shows badges for: shared contacts count, linked products count, stock mismatches, synced items

4. **Added `ModuleBadge` in invoices table** (line 553-567):
   - For each invoice row's customer column, shows CRM and Store badges if that customer exists in those modules
   - Uses IIFE pattern to call `getContactByName` within JSX without violating hooks rules

5. **Added `ContactCrossRef` in Invoice Detail Sheet** (line 1013-1014):
   - Placed between the line items table and the totals section
   - Shows cross-module contact info (CRM stage, deal value, store orders, etc.) for the invoice's customer

## Lint Results
- `AccountingPage.tsx`: 0 errors, 0 warnings ✅
- Pre-existing error in `page.tsx` (line 638: set-state-in-effect) — NOT caused by these changes

## Notes
- All existing functionality preserved
- Minimal, targeted changes following the exact instructions
