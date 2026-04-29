/**
 * Cross-Module Integration Store
 * Connects Store, CRM, Accounting, Inventory, and Finance modules
 * All business pages register their data here and can query cross-references
 */

import { create } from 'zustand'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SharedContact {
  id: string
  name: string
  phone: string
  email: string
  company: string
  /** Which modules this contact appears in */
  sources: ('store' | 'crm' | 'accounting')[]
  /** Store: number of orders */
  storeOrderCount: number
  /** Store: total amount spent in orders */
  storeTotalSpent: number
  /** CRM: pipeline stage */
  crmStage: string
  /** CRM: deal value */
  crmDealValue: number
  /** CRM: avatar emoji */
  crmAvatar: string
  /** Accounting: number of invoices */
  accountingInvoiceCount: number
  /** Accounting: total invoice amount */
  accountingInvoiceTotal: number
  /** Accounting: invoices paid count */
  accountingPaidCount: number
}

export interface SharedProduct {
  id: string
  name: string
  sku: string
  /** Store price */
  storePrice: number
  /** Store stock (from orders) */
  storeStock: number
  /** Store sale price */
  storeSalePrice: number
  /** Store status */
  storeStatus: string
  /** Inventory stock */
  inventoryStock: number
  /** Inventory min stock */
  inventoryMinStock: number
  /** Inventory unit price */
  inventoryUnitPrice: number
  /** Inventory status */
  inventoryStatus: string
  /** Inventory category */
  inventoryCategory: string
  /** Whether stock is synced between modules */
  stockSynced: boolean
}

export interface SharedOrderInvoice {
  /** Store order number */
  orderNumber: string
  /** Accounting invoice number (if exists) */
  invoiceNumber: string
  /** Customer name */
  customer: string
  /** Order amount */
  orderAmount: number
  /** Order status */
  orderStatus: string
  /** Invoice status */
  invoiceStatus: string
  /** Order date */
  orderDate: string
  /** Invoice date */
  invoiceDate: string
}

export interface SharedTransaction {
  id: string
  date: string
  description: string
  /** 'income' | 'expense' */
  type: 'income' | 'expense'
  amount: number
  category: string
  /** Source module */
  source: 'accounting' | 'finance'
  /** Reference to related entity (invoice id, etc.) */
  reference: string
  /** Account name (accounting) */
  account: string
}

export interface NavigationAction {
  targetTab: string
  entityName: string
  searchQuery: string
  timestamp: number
}

export interface CrossModuleState {
  // ── Shared Data ──
  sharedContacts: SharedContact[]
  sharedProducts: SharedProduct[]
  sharedOrderInvoices: SharedOrderInvoice[]
  sharedTransactions: SharedTransaction[]

  // ── Navigation ──
  navigationAction: NavigationAction | null
  navigateTo: (targetTab: string, entityName: string, searchQuery?: string) => void

  // ── Store Registration ──
  registerStoreData: (orders: Array<{
    orderNumber: string
    customer: string
    customerPhone: string
    total: number
    status: string
    createdAt: string
    items: Array<{ name: string; quantity: number; price: number }>
  }>, products: Array<{
    id: string
    name: string
    sku: string
    stock: number
    price: number
    salePrice: number
    status: string
    category: string
  }>) => void

  registerCRMData: (contacts: Array<{
    id: string
    name: string
    company: string
    phone: string
    email: string
    dealValue: number
    avatar: string
    stage: string
  }>) => void

  registerAccountingData: (invoices: Array<{
    id: string
    number: string
    customer: string
    amount: number
    status: string
    date: string
    dueDate: string
  }>, transactions: Array<{
    id: string
    date: string
    description: string
    type: 'income' | 'expense'
    category: string
    amount: number
    account: string
  }>) => void

  registerInventoryData: (items: Array<{
    id: string
    name: string
    sku: string
    category: string
    stock: number
    minStock: number
    unitPrice: number
    status: string
  }>) => void

  registerFinanceData: (transactions: Array<{
    id: string
    date: string
    description: string
    type: 'income' | 'expense'
    amount: number
    category: string
  }>) => void

  // ── Cross-Reference Queries ──
  getContactByName: (name: string) => SharedContact | undefined
  getContactByCompany: (company: string) => SharedContact | undefined
  getProductByName: (name: string) => SharedProduct | undefined
  getProductBySku: (sku: string) => SharedProduct | undefined
  getContactOrders: (name: string) => SharedOrderInvoice[]
  getContactInvoices: (name: string) => SharedOrderInvoice[]
  getInvoiceForOrder: (orderNumber: string) => SharedOrderInvoice | undefined
  getProductInventoryInfo: (productName: string) => SharedProduct | undefined

  // ── Stats ──
  totalStoreRevenue: number
  totalAccountingRevenue: number
  totalCRMDealValue: number
  totalInventoryValue: number
  totalFinanceBalance: number
  getModuleStats: () => ModuleStats
}

export interface ModuleStats {
  store: { orders: number; revenue: number; products: number; pendingOrders: number }
  crm: { contacts: number; activeDeals: number; totalDealValue: number; successRate: number }
  accounting: { invoices: number; paidRevenue: number; pendingInvoices: number }
  inventory: { items: number; totalValue: number; lowStock: number; outOfStock: number }
  finance: { transactions: number; totalIncome: number; totalExpense: number; netBalance: number }
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function matchContactName(name1: string, name2: string): boolean {
  return name1.trim() === name2.trim() ||
    name1.includes(name2) ||
    name2.includes(name1)
}

function matchProductName(name1: string, name2: string): boolean {
  const normalize = (s: string) => s.replace(/[\u200c\u200d]/g, '').replace(/\s+/g, ' ').trim()
  return normalize(name1) === normalize(name2) ||
    normalize(name1).includes(normalize(name2)) ||
    normalize(name2).includes(normalize(name1))
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCrossModuleStore = create<CrossModuleState>((set, get) => ({
  // ── Initial Data ──
  sharedContacts: [],
  sharedProducts: [],
  sharedOrderInvoices: [],
  sharedTransactions: [],
  navigationAction: null,

  // ── Navigation ──
  navigateTo: (targetTab, entityName, searchQuery = '') => {
    set({
      navigationAction: {
        targetTab,
        entityName,
        searchQuery,
        timestamp: Date.now(),
      }
    })
  },

  // ── Store Registration ──
  registerStoreData: (orders, products) => {
    const state = get()

    // Build order-invoice map
    const newOrderInvoices = orders.map(order => {
      const existingInvoice = state.sharedOrderInvoices.find(
        oi => oi.orderNumber === order.orderNumber
      )
      return {
        orderNumber: order.orderNumber,
        invoiceNumber: existingInvoice?.invoiceNumber || '',
        customer: order.customer,
        orderAmount: order.total,
        orderStatus: order.status,
        invoiceStatus: existingInvoice?.invoiceStatus || '',
        orderDate: order.createdAt,
        invoiceDate: existingInvoice?.invoiceDate || '',
      }
    })

    // Update products
    const newProducts = products.map(p => {
      const existing = state.sharedProducts.find(ep => matchProductName(ep.name, p.name) || ep.sku === p.sku)
      return {
        id: existing?.id || p.id,
        name: p.name,
        sku: p.sku,
        storePrice: p.price,
        storeStock: p.stock,
        storeSalePrice: p.salePrice,
        storeStatus: p.status,
        inventoryStock: existing?.inventoryStock || 0,
        inventoryMinStock: existing?.inventoryMinStock || 0,
        inventoryUnitPrice: existing?.inventoryUnitPrice || 0,
        inventoryStatus: existing?.inventoryStatus || '',
        inventoryCategory: existing?.inventoryCategory || '',
        stockSynced: existing ? existing.inventoryStock === p.stock : false,
      }
    })

    // Add new products from inventory that aren't in store
    for (const existing of state.sharedProducts) {
      if (!newProducts.find(p => p.id === existing.id)) {
        newProducts.push({
          ...existing,
          storePrice: 0,
          storeStock: 0,
          storeSalePrice: 0,
          storeStatus: '',
          stockSynced: false,
        })
      }
    }

    // Update contacts with store data
    const newContacts = [...state.sharedContacts]
    for (const order of orders) {
      const existing = newContacts.find(c => matchContactName(c.name, order.customer))
      const contactOrders = orders.filter(o => matchContactName(o.customer, order.customer))
      if (existing) {
        if (!existing.sources.includes('store')) existing.sources.push('store')
        existing.storeOrderCount = contactOrders.length
        existing.storeTotalSpent = contactOrders.reduce((sum, o) => sum + o.total, 0)
      } else {
        newContacts.push({
          id: `store-${order.customer}`,
          name: order.customer,
          phone: order.customerPhone,
          email: '',
          company: '',
          sources: ['store'],
          storeOrderCount: contactOrders.length,
          storeTotalSpent: contactOrders.reduce((sum, o) => sum + o.total, 0),
          crmStage: '',
          crmDealValue: 0,
          crmAvatar: '👤',
          accountingInvoiceCount: 0,
          accountingInvoiceTotal: 0,
          accountingPaidCount: 0,
        })
      }
    }

    // Calculate stats
    const totalStoreRevenue = orders.filter(o => !['cancelled', 'returned'].includes(o.status)).reduce((s, o) => s + o.total, 0)

    set({
      sharedOrderInvoices: newOrderInvoices,
      sharedProducts: newProducts,
      sharedContacts: newContacts,
      totalStoreRevenue,
    })
  },

  registerCRMData: (contacts) => {
    const state = get()
    const newContacts = [...state.sharedContacts]

    for (const contact of contacts) {
      const existing = newContacts.find(c => matchContactName(c.name, contact.name))
      if (existing) {
        if (!existing.sources.includes('crm')) existing.sources.push('crm')
        existing.crmStage = contact.stage
        existing.crmDealValue = contact.dealValue
        existing.crmAvatar = contact.avatar
        if (!existing.company && contact.company) existing.company = contact.company
        if (!existing.phone && contact.phone) existing.phone = contact.phone
        if (!existing.email && contact.email) existing.email = contact.email
      } else {
        newContacts.push({
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          company: contact.company,
          sources: ['crm'],
          storeOrderCount: 0,
          storeTotalSpent: 0,
          crmStage: contact.stage,
          crmDealValue: contact.dealValue,
          crmAvatar: contact.avatar,
          accountingInvoiceCount: 0,
          accountingInvoiceTotal: 0,
          accountingPaidCount: 0,
        })
      }
    }

    const totalCRMDealValue = contacts.filter(c => c.stage !== 'lost').reduce((s, c) => s + c.dealValue, 0)

    set({ sharedContacts: newContacts, totalCRMDealValue })
  },

  registerAccountingData: (invoices, transactions) => {
    const state = get()

    // Match invoices to orders and contacts
    const newOrderInvoices = [...state.sharedOrderInvoices]
    for (const invoice of invoices) {
      // Try to find matching order
      const existingOI = newOrderInvoices.find(oi => oi.invoiceNumber === invoice.number)
      if (existingOI) {
        existingOI.invoiceNumber = invoice.number
        existingOI.invoiceStatus = invoice.status
        existingOI.invoiceDate = invoice.date
        existingOI.customer = invoice.customer
      } else {
        // Create standalone invoice entry
        newOrderInvoices.push({
          orderNumber: '',
          invoiceNumber: invoice.number,
          customer: invoice.customer,
          orderAmount: invoice.amount,
          orderStatus: '',
          invoiceStatus: invoice.status,
          orderDate: '',
          invoiceDate: invoice.date,
        })
      }
    }

    // Update contacts with accounting data
    const newContacts = [...state.sharedContacts]
    for (const invoice of invoices) {
      // Match by customer name or company
      let existing = newContacts.find(c => matchContactName(c.name, invoice.customer))
      if (!existing) {
        existing = newContacts.find(c => c.company && invoice.customer.includes(c.company))
      }
      if (existing) {
        if (!existing.sources.includes('accounting')) existing.sources.push('accounting')
        existing.accountingInvoiceCount++
        existing.accountingInvoiceTotal += invoice.amount
        if (invoice.status === 'paid') existing.accountingPaidCount++
      } else {
        newContacts.push({
          id: `acc-${invoice.id}`,
          name: invoice.customer,
          phone: '',
          email: '',
          company: invoice.customer,
          sources: ['accounting'],
          storeOrderCount: 0,
          storeTotalSpent: 0,
          crmStage: '',
          crmDealValue: 0,
          crmAvatar: '🏢',
          accountingInvoiceCount: 1,
          accountingInvoiceTotal: invoice.amount,
          accountingPaidCount: invoice.status === 'paid' ? 1 : 0,
        })
      }
    }

    // Merge accounting transactions
    const existingTxnIds = new Set(state.sharedTransactions.filter(t => t.source === 'accounting').map(t => t.id))
    const newTxns = [...state.sharedTransactions]
    for (const txn of transactions) {
      if (!existingTxnIds.has(txn.id)) {
        newTxns.push({
          ...txn,
          source: 'accounting',
          reference: '',
        })
      }
    }

    const totalAccountingRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)

    set({
      sharedOrderInvoices: newOrderInvoices,
      sharedContacts: newContacts,
      sharedTransactions: newTxns,
      totalAccountingRevenue,
    })
  },

  registerInventoryData: (items) => {
    const state = get()
    const newProducts = [...state.sharedProducts]

    for (const item of items) {
      const existing = newProducts.find(p => matchProductName(p.name, item.name) || p.sku === item.sku)
      if (existing) {
        existing.inventoryStock = item.stock
        existing.inventoryMinStock = item.minStock
        existing.inventoryUnitPrice = item.unitPrice
        existing.inventoryStatus = item.status
        existing.inventoryCategory = item.category
        existing.stockSynced = existing.storeStock === item.stock && existing.storeStock > 0
        if (item.sku && !existing.sku.includes(item.sku.split('-').pop() || '')) {
          // Keep original SKU format
        }
      } else {
        newProducts.push({
          id: item.id,
          name: item.name,
          sku: item.sku,
          storePrice: 0,
          storeStock: 0,
          storeSalePrice: 0,
          storeStatus: '',
          inventoryStock: item.stock,
          inventoryMinStock: item.minStock,
          inventoryUnitPrice: item.unitPrice,
          inventoryStatus: item.status,
          inventoryCategory: item.category,
          stockSynced: false,
        })
      }
    }

    const totalInventoryValue = items.reduce((sum, i) => sum + i.stock * i.unitPrice, 0)

    set({ sharedProducts: newProducts, totalInventoryValue })
  },

  registerFinanceData: (transactions) => {
    const state = get()
    const existingTxnIds = new Set(state.sharedTransactions.filter(t => t.source === 'finance').map(t => t.id))
    const newTxns = [...state.sharedTransactions]
    for (const txn of transactions) {
      if (!existingTxnIds.has(txn.id)) {
        newTxns.push({
          ...txn,
          source: 'finance',
          account: '',
          reference: '',
        })
      }
    }

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    set({
      sharedTransactions: newTxns,
      totalFinanceBalance: totalIncome - totalExpense,
    })
  },

  // ── Cross-Reference Queries ──
  getContactByName: (name) => {
    return get().sharedContacts.find(c => matchContactName(c.name, name))
  },

  getContactByCompany: (company) => {
    return get().sharedContacts.find(c => c.company && company.includes(c.company))
  },

  getProductByName: (name) => {
    return get().sharedProducts.find(p => matchProductName(p.name, name))
  },

  getProductBySku: (sku) => {
    return get().sharedProducts.find(p => p.sku === sku || p.sku.includes(sku))
  },

  getContactOrders: (name) => {
    return get().sharedOrderInvoices.filter(oi => matchContactName(oi.customer, name) && oi.orderNumber)
  },

  getContactInvoices: (name) => {
    return get().sharedOrderInvoices.filter(oi => matchContactName(oi.customer, name) && oi.invoiceNumber)
  },

  getInvoiceForOrder: (orderNumber) => {
    return get().sharedOrderInvoices.find(oi => oi.orderNumber === orderNumber)
  },

  getProductInventoryInfo: (productName) => {
    return get().sharedProducts.find(p => matchProductName(p.name, productName))
  },

  // ── Computed Stats ──
  totalStoreRevenue: 0,
  totalAccountingRevenue: 0,
  totalCRMDealValue: 0,
  totalInventoryValue: 0,
  totalFinanceBalance: 0,

  getModuleStats: () => {
    const state = get()
    const crmContacts = state.sharedContacts.filter(c => c.sources.includes('crm'))
    const activeDeals = crmContacts.filter(c => !['lost', 'success'].includes(c.crmStage))
    const successDeals = crmContacts.filter(c => c.crmStage === 'success')

    return {
      store: {
        orders: state.sharedOrderInvoices.filter(oi => oi.orderNumber).length,
        revenue: state.totalStoreRevenue,
        products: state.sharedProducts.filter(p => p.storeStatus).length,
        pendingOrders: state.sharedOrderInvoices.filter(oi => ['pending', 'processing'].includes(oi.orderStatus)).length,
      },
      crm: {
        contacts: crmContacts.length,
        activeDeals: activeDeals.length,
        totalDealValue: crmContacts.reduce((s, c) => s + c.crmDealValue, 0),
        successRate: crmContacts.length > 0 ? Math.round((successDeals.length / crmContacts.length) * 100) : 0,
      },
      accounting: {
        invoices: state.sharedOrderInvoices.filter(oi => oi.invoiceNumber).length,
        paidRevenue: state.totalAccountingRevenue,
        pendingInvoices: state.sharedOrderInvoices.filter(oi => oi.invoiceStatus === 'pending').length,
      },
      inventory: {
        items: state.sharedProducts.filter(p => p.inventoryStatus).length,
        totalValue: state.totalInventoryValue,
        lowStock: state.sharedProducts.filter(p => p.inventoryStatus === 'low-stock').length,
        outOfStock: state.sharedProducts.filter(p => p.inventoryStatus === 'out-of-stock').length,
      },
      finance: {
        transactions: state.sharedTransactions.length,
        totalIncome: state.sharedTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        totalExpense: state.sharedTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        netBalance: state.totalFinanceBalance,
      },
    }
  },
}))
