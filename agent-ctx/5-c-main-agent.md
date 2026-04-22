# Task 5-c: Refactor AccountingPage to use shared API data with cross-module integration

## Summary
Refactored `AccountingPage.tsx` from local `useState()` demo data to shared CMS data layer via `useCMS()` hook, and added 5 cross-module integration features.

## File Modified: `/home/z/my-project/src/components/cms/AccountingPage.tsx`

### Changes Made:
1. **Data Loading**: Replaced 3 local `useState()` data sources with `useCMS()` queries + `useEnsureData(['invoices', 'transactions', 'bank-accounts', 'customers'])`
2. **API Field Mapping**: Mapped API Invoice/Transaction/BankAccount fields to existing UI (invoiceNumber, customer.name, total, createdAt, bankAccount.name)
3. **Cross-Module Features**:
   - Customer info on invoices (name, company, balance)
   - Order references in invoice detail (orderNumber, status, total)
   - Product details on invoice items (name, SKU)
   - Transaction links (invoice.invoiceNumber, bankAccount.name, reference)
   - Financial summary card (total receivable, paid, overdue, bank balances)
4. **Reports Tab**: Dynamically computed from API transactions (monthly data, category expenses)
5. **CRUD Operations**: Updated to use API mutations (createInvoice, updateInvoice, deleteInvoice)
6. **New Features**: Overdue detection, extended status system (draft, sent, partial, overdue), customer datalist autocomplete, loading spinner
7. **Cleanup**: Removed unused imports (useEffect, Textarea, CardHeader, CardTitle, etc.)

### ESLint Result:
- `AccountingPage.tsx`: 0 errors, 0 warnings ✅

### Lines: 1214 → 1533
