# Task 6-b: Integrate CrmPage with Cross-Module System

## Agent: full-stack-developer

## Work Log

### Changes Made to `/home/z/my-project/src/components/cms/CrmPage.tsx`

1. **Added imports** (3 new lines after `sonner` import):
   - `useRegisterCRMData`, `ContactCrossRef`, `ModuleBadge`, `CrossModuleSyncStatus` from `@/components/CrossModulePanel`
   - `useCrossModuleStore` from `@/lib/cross-module-store`
   - `ShoppingBag` from `lucide-react`

2. **Added cross-module data registration** (after all useState, before useMemo):
   - `useRegisterCRMData(contacts)` — auto-registers CRM contacts with the cross-module store
   - `const { getContactByName } = useCrossModuleStore()` — retrieves cross-module contact data

3. **Added ContactCrossRef panel in Contact Detail Sheet** (line ~998):
   - Placed after the Activity History section, before the Action buttons
   - Shows cross-module connections for the selected contact (store orders, accounting invoices, etc.)
   - Props: `contactName={selectedContact.name}` and `currentModule="crm"`

4. **Added ModuleBadge in contacts table** (line ~583):
   - In the company cell, after the company name text
   - Shows colored badges for each other module the contact appears in (store, accounting, etc.)
   - Uses IIFE to call `getContactByName(contact.name)` and filter out 'crm' from sources

5. **Added store order count in pipeline cards** (line ~485):
   - In the pipeline kanban cards, after the activity count indicator
   - Shows a ShoppingBag icon with `{N} سفارش` (Persian for "N orders") when the contact has store orders
   - Uses IIFE to call `getContactByName(contact.name)` and check `storeOrderCount > 0`

6. **Added CrossModuleSyncStatus in stats section** (line ~1075):
   - Placed after the stats cards grid, before the tabs
   - Shows badges indicating: shared contacts count, linked products, stock mismatches, synced items

### Lint Results
- **CrmPage.tsx**: 0 errors, 0 warnings ✅
- **Pre-existing error** in `page.tsx:638` (react-hooks/set-state-in-effect) — NOT caused by these changes, exists in cross-module navigation handler from another agent's work

### No Breaking Changes
- All existing functionality preserved
- All existing code intact
- Only additive changes (new imports, new hook calls, new UI elements)
- Persian/Farsi labels used for new display text
