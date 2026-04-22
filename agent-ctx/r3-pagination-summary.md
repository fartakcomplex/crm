# Task: r3-pagination — Client-Side Pagination for CMS Tables

## Summary
Added client-side pagination to 5 CMS table/grid pages using a reusable `PaginationControls` component. All pagination logic is purely client-side with Persian/Farsi labels, glass-card styling, and RTL support.

## Files Created
1. **`src/components/cms/PaginationControls.tsx`** — Reusable pagination component
   - Previous/Next buttons with ChevronRight/ChevronLeft icons (RTL-aware)
   - Page number buttons showing max 5 with ellipsis for large page counts
   - "X of Y" item count display in Persian
   - Page size selector (5, 10, 20, 50) with Persian number labels
   - Glass-card styling consistent with project design
   - Proper ARIA labels and keyboard navigation
   - Hidden when no items exist
   - Persian/Farsi digit conversion for page numbers

## Files Modified
1. **`src/components/cms/ContentPage.tsx`** — Posts table pagination
   - Added `currentPage`, `pageSize` state
   - Added `handleSearchChange`, `handleStatusFilterChange`, `handlePageSizeChange` handlers (reset to page 1)
   - Replaced `filtered.map` with `paginatedItems.map`
   - Added `<PaginationControls>` between table card and dialogs

2. **`src/components/cms/UsersPage.tsx`** — Users table pagination
   - Added `currentPage`, `pageSize` state
   - Added `handleSearchChange`, `handleRoleFilterChange`, `handlePageSizeChange` handlers
   - Replaced `filtered.map` with `paginatedItems.map`
   - Added `<PaginationControls>` between table card and dialogs

3. **`src/components/cms/CustomersPage.tsx`** — Customers table pagination
   - Added `currentPage`, `pageSize` state
   - Added `handleSearchChange`, `handleStatusFilterChange`, `handlePageSizeChange` handlers
   - Replaced `filtered.map` with `paginatedItems.map`
   - Added `<PaginationControls>` between table card and dialogs

4. **`src/components/cms/TeamPage.tsx`** — Team grid pagination
   - Added `currentPage`, `pageSize` state
   - Added `handleSearchChange`, `handleDeptFilterChange`, `handlePageSizeChange` handlers
   - Replaced `filtered.map` with `paginatedItems.map`
   - Added `<PaginationControls>` between grid and dialog

5. **`src/components/cms/CommentsPage.tsx`** — Comments card list pagination
   - Added `currentPage`, `pageSize` state
   - Added `handleSearchChange`, `handleStatusFilterChange`, `handlePageSizeChange` handlers
   - Replaced `filtered.map` with `paginatedItems.map`
   - Added `<PaginationControls>` after ScrollArea

## Approach
- Page resets to 1 on search/filter/pageSize change via handler functions (not useEffect, to avoid React 19 `set-state-in-effect` lint rule)
- Pagination rendered between the data card and dialogs with `mt-4` spacing
- Only visible when `filtered.length > 0`
- No existing functionality changed — only pagination added

## Lint Result
✅ ESLint: 0 errors, 0 warnings
