'use client'

import { useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingBag, Users, Receipt, Warehouse, Wallet,
  ArrowLeftRight, ExternalLink, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Package, Phone, Mail, Building2,
  ChevronLeft,
} from 'lucide-react'
import { useCrossModuleStore, type SharedContact, type SharedProduct, type SharedOrderInvoice } from '@/lib/cross-module-store'

// ─── Helpers ────────────────────────────────────────────────────────────────

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, d => persianDigits[parseInt(d)])
}

function formatPrice(price: number): string {
  return toPersianDigits(price.toLocaleString())
}

function formatDealValue(val: number): string {
  if (val >= 1_000_000_000) return toPersianDigits((val / 1_000_000_000).toFixed(1)) + ' میلیارد'
  if (val >= 1_000_000) return toPersianDigits((val / 1_000_000).toFixed(0)) + ' میلیون'
  return toPersianDigits(val.toLocaleString())
}

function formatValue(value: number): string {
  if (value >= 1e9) return toPersianDigits((value / 1e9).toFixed(1)) + ' میلیارد'
  if (value >= 1e6) return toPersianDigits((value / 1e6).toFixed(1)) + ' میلیون'
  return toPersianDigits(value.toLocaleString())
}

const stageLabels: Record<string, string> = {
  initial: 'تماس اولیه',
  assessment: 'نیازسنجی',
  proposal: 'پیشنهاد قیمت',
  negotiation: 'مذاکره',
  success: 'موفق',
  lost: 'از دست رفته',
}

const moduleConfig = {
  store: { label: 'فروشگاه', icon: ShoppingBag, gradient: 'from-pink-500 to-rose-500', bg: 'bg-pink-100 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400' },
  crm: { label: 'CRM', icon: Users, gradient: 'from-cyan-500 to-teal-500', bg: 'bg-cyan-100 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400' },
  accounting: { label: 'حسابداری', icon: Receipt, gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
  inventory: { label: 'انبار', icon: Warehouse, gradient: 'from-sky-500 to-blue-500', bg: 'bg-sky-100 dark:bg-sky-900/20', text: 'text-sky-600 dark:text-sky-400' },
  finance: { label: 'مالی', icon: Wallet, gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-100 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
}

const tabMap: Record<string, string> = {
  store: 'store',
  crm: 'crm',
  accounting: 'accounting',
  inventory: 'inventory',
  finance: 'finance',
}

// ─── Contact Cross-Reference Panel ─────────────────────────────────────────

interface ContactCrossRefProps {
  contactName: string
  /** Which module is showing this panel (to exclude from the display) */
  currentModule: 'store' | 'crm' | 'accounting'
}

export function ContactCrossRef({ contactName, currentModule }: ContactCrossRefProps) {
  const { sharedContacts, navigateTo } = useCrossModuleStore()

  const contact = useMemo(() => {
    return sharedContacts.find(c => {
      return c.name === contactName ||
        c.name.includes(contactName) ||
        contactName.includes(c.name)
    })
  }, [sharedContacts, contactName])

  const otherModules = useMemo(() => {
    if (!contact) return []
    return contact.sources
      .filter(s => s !== currentModule)
      .map(s => ({ key: s, ...moduleConfig[s as keyof typeof moduleConfig] }))
  }, [contact, currentModule])

  if (!contact || otherModules.length === 0) return null

  return (
    <Card className="glass-card shadow-sm border-border/40 overflow-hidden animate-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs font-bold flex items-center gap-2 text-muted-foreground">
          <ArrowLeftRight className="h-3.5 w-3.5" />
          ارتباطات بین‌بخشی — {contact.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {otherModules.map(mod => (
          <div key={mod.key} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${mod.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
              <mod.icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${mod.text}`}>{mod.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => navigateTo(tabMap[mod.key] || mod.key, contact.name, contact.name)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                {/* Store info */}
                {mod.key === 'store' && (
                  <>
                    <p>🛒 {toPersianDigits(contact.storeOrderCount)} سفارش</p>
                    <p>💰 مجموع خرید: {formatPrice(contact.storeTotalSpent)} تومان</p>
                  </>
                )}
                {/* CRM info */}
                {mod.key === 'crm' && (
                  <>
                    <p>🏢 {contact.company || '—'}</p>
                    <p>📊 مرحله: {stageLabels[contact.crmStage] || contact.crmStage}</p>
                    <p>💎 ارزش معامله: {formatDealValue(contact.crmDealValue)} تومان</p>
                  </>
                )}
                {/* Accounting info */}
                {mod.key === 'accounting' && (
                  <>
                    <p>📄 {toPersianDigits(contact.accountingInvoiceCount)} فاکتور</p>
                    <p>✅ {toPersianDigits(contact.accountingPaidCount)} پرداخت شده</p>
                    <p>💰 مجموع: {formatPrice(contact.accountingInvoiceTotal)} تومان</p>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ─── Product Cross-Reference Panel ─────────────────────────────────────────

interface ProductCrossRefProps {
  productName: string
  sku?: string
  currentModule: 'store' | 'inventory'
}

export function ProductCrossRef({ productName, sku, currentModule }: ProductCrossRefProps) {
  const { sharedProducts, navigateTo } = useCrossModuleStore()

  const product = useMemo(() => {
    return sharedProducts.find(p =>
      p.name === productName || p.name.includes(productName) || productName.includes(p.name) ||
      (sku && (p.sku === sku || p.sku.includes(sku)))
    )
  }, [sharedProducts, productName, sku])

  if (!product) return null

  const hasStore = product.storeStatus !== ''
  const hasInventory = product.inventoryStatus !== ''
  const showOther = (currentModule === 'store' && hasInventory) || (currentModule === 'inventory' && hasStore)

  if (!showOther) return null

  const otherModule = currentModule === 'store' ? moduleConfig.inventory : moduleConfig.store
  const otherKey = currentModule === 'store' ? 'inventory' : 'store'

  return (
    <Card className="glass-card shadow-sm border-border/40 overflow-hidden animate-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs font-bold flex items-center gap-2 text-muted-foreground">
          <ArrowLeftRight className="h-3.5 w-3.5" />
          ارتباطات بین‌بخشی — {productName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
          <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${otherModule.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
            <otherModule.icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${otherModule.text}`}>{otherModule.label}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => navigateTo(tabMap[otherKey] || otherKey, productName, productName)}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
              {/* Show inventory info in store */}
              {currentModule === 'store' && hasInventory && (
                <>
                  <p className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    موجودی انبار: <span className={`font-bold ${product.inventoryStatus === 'out-of-stock' ? 'text-red-500' : product.inventoryStatus === 'low-stock' ? 'text-amber-500' : 'text-emerald-500'}`}>{toPersianDigits(product.inventoryStock)}</span>
                  </p>
                  <p>📊 دسته‌بندی: {product.inventoryCategory}</p>
                  {!product.stockSynced && product.storeStock > 0 && (
                    <p className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      عدم هماهنگی موجودی!
                    </p>
                  )}
                  {product.stockSynced && product.storeStock > 0 && (
                    <p className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      موجودی هماهنگ است
                    </p>
                  )}
                </>
              )}
              {/* Show store info in inventory */}
              {currentModule === 'inventory' && hasStore && (
                <>
                  <p>💰 قیمت فروشگاه: {formatPrice(product.storePrice)} تومان</p>
                  {product.storeSalePrice > 0 && (
                    <p className="text-rose-500">🏷️ تخفیف: {formatPrice(product.storeSalePrice)} تومان</p>
                  )}
                  <p>📦 وضعیت فروشگاه: {product.storeStatus === 'active' ? '✅ فعال' : product.storeStatus === 'draft' ? '📝 پیش‌نویس' : '⭕ غیرفعال'}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Order/Invoice Cross-Reference Panel ────────────────────────────────────

interface OrderInvoiceCrossRefProps {
  orderNumber?: string
  invoiceNumber?: string
  customerName: string
  amount: number
  orderStatus?: string
  invoiceStatus?: string
  currentModule: 'store' | 'accounting'
}

export function OrderInvoiceCrossRef({
  orderNumber,
  invoiceNumber,
  customerName,
  amount,
  orderStatus,
  invoiceStatus,
  currentModule,
}: OrderInvoiceCrossRefProps) {
  const { sharedContacts, navigateTo } = useCrossModuleStore()

  const contact = useMemo(() => {
    return sharedContacts.find(c =>
      c.name === customerName || c.name.includes(customerName) || customerName.includes(c.name)
    )
  }, [sharedContacts, customerName])

  const crmInfo = contact?.sources.includes('crm') ? contact : null

  return (
    <Card className="glass-card shadow-sm border-border/40 overflow-hidden animate-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs font-bold flex items-center gap-2 text-muted-foreground">
          <ArrowLeftRight className="h-3.5 w-3.5" />
          ارتباطات بین‌بخشی
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {/* CRM Contact Link */}
        {crmInfo && (
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${moduleConfig.crm.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
              <Users className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${moduleConfig.crm.text}`}>CRM — مخاطب</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => navigateTo('crm', crmInfo.name, crmInfo.name)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                <p className="flex items-center gap-1">
                  <span className="text-base">{crmInfo.crmAvatar}</span>
                  {crmInfo.name} — {crmInfo.company}
                </p>
                <p>📊 مرحله: {stageLabels[crmInfo.crmStage]}</p>
                <p>💎 ارزش معامله: {formatDealValue(crmInfo.crmDealValue)} تومان</p>
              </div>
            </div>
          </div>
        )}

        {/* Store Order (when viewing in accounting) */}
        {currentModule === 'accounting' && orderNumber && (
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${moduleConfig.store.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${moduleConfig.store.text}`}>فروشگاه — سفارش</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => navigateTo('store', orderNumber, orderNumber)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                <p>📦 شماره سفارش: <span className="font-mono font-bold">{orderNumber}</span></p>
                {orderStatus && <p>وضعیت: {orderStatus}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Accounting Invoice (when viewing in store) */}
        {currentModule === 'store' && invoiceNumber && (
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${moduleConfig.accounting.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${moduleConfig.accounting.text}`}>حسابداری — فاکتور</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => navigateTo('accounting', invoiceNumber, invoiceNumber)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                <p>📄 شماره فاکتور: <span className="font-mono font-bold">{invoiceNumber}</span></p>
                {invoiceStatus && <p>وضعیت: {invoiceStatus === 'paid' ? 'پرداخت شده ✅' : invoiceStatus === 'pending' ? 'در انتظار ⏳' : 'لغو شده ❌'}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Contact details */}
        {contact && (
          <div className="text-[11px] text-muted-foreground px-2.5 space-y-0.5 border-t border-border/30 pt-2 mt-1">
            <p className="font-bold text-foreground/70 text-xs">اطلاعات تماس:</p>
            {contact.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phone}</p>}
            {contact.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</p>}
            {contact.company && <p className="flex items-center gap-1"><Building2 className="h-3 w-3" />{contact.company}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Module Stats Overview ─────────────────────────────────────────────────

export function ModuleStatsOverview() {
  const { getModuleStats } = useCrossModuleStore()
  const stats = getModuleStats()

  const cards = [
    { key: 'store' as const, label: 'فروشگاه', ...moduleConfig.store, value: toPersianDigits(stats.store.orders), sub: `درآمد: ${formatValue(stats.store.revenue)} تومان` },
    { key: 'crm' as const, label: 'CRM', ...moduleConfig.crm, value: toPersianDigits(stats.crm.contacts), sub: `${toPersianDigits(stats.crm.activeDeals)} فرصت فعال — نرخ تبدیل ${toPersianDigits(stats.crm.successRate)}٪` },
    { key: 'accounting' as const, label: 'حسابداری', ...moduleConfig.accounting, value: toPersianDigits(stats.accounting.invoices), sub: `درآمد پرداخت‌شده: ${formatValue(stats.accounting.paidRevenue)} تومان` },
    { key: 'inventory' as const, label: 'انبار', ...moduleConfig.inventory, value: toPersianDigits(stats.inventory.items), sub: `ارزش: ${formatValue(stats.inventory.totalValue)} تومان` },
    { key: 'finance' as const, label: 'مالی', ...moduleConfig.finance, value: toPersianDigits(stats.finance.transactions), sub: `مانده: ${formatValue(stats.finance.netBalance)} تومان` },
  ]

  return (
    <Card className="glass-card shadow-sm overflow-hidden">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 gradient-text">
          <ArrowLeftRight className="h-4 w-4" />
          نمای کلی ارتباطات بین‌بخشی
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-2">
          {cards.map((card, idx) => (
            <div
              key={card.key}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group cursor-pointer animate-in"
              style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
            >
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm shrink-0`}>
                <card.icon className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${card.text}`}>{card.label}</span>
                  <span className="text-lg font-bold tabular-nums">{card.value}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{card.sub}</p>
              </div>
              <ChevronLeft className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Cross-Module Sync Status Bar ──────────────────────────────────────────

export function CrossModuleSyncStatus() {
  const { sharedContacts, sharedProducts } = useCrossModuleStore()

  const contactsInMultiple = sharedContacts.filter(c => c.sources.length > 1).length
  const syncedProducts = sharedProducts.filter(p => p.stockSynced).length
  const totalLinkedProducts = sharedProducts.filter(p => p.storeStatus && p.inventoryStatus).length
  const stockMismatch = sharedProducts.filter(p => p.storeStatus && p.inventoryStatus && !p.stockSynced).length

  return (
    <div className="flex flex-wrap gap-2 text-[10px]">
      <Badge variant="outline" className="gap-1 border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300">
        <Users className="h-3 w-3" />
        {toPersianDigits(contactsInMultiple)} مخاطب مشترک
      </Badge>
      <Badge variant="outline" className="gap-1 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300">
        <Package className="h-3 w-3" />
        {toPersianDigits(totalLinkedProducts)} محصول مرتبط
      </Badge>
      {stockMismatch > 0 && (
        <Badge variant="outline" className="gap-1 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-3 w-3" />
          {toPersianDigits(stockMismatch)} عدم هماهنگی
        </Badge>
      )}
      {syncedProducts > 0 && (
        <Badge variant="outline" className="gap-1 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          {toPersianDigits(syncedProducts)} هماهنگ
        </Badge>
      )}
    </div>
  )
}

// ─── Cross-Module Badge (inline) ────────────────────────────────────────────

interface ModuleBadgeProps {
  module: 'store' | 'crm' | 'accounting' | 'inventory' | 'finance'
  label?: string
  onClick?: () => void
}

export function ModuleBadge({ module, label, onClick }: ModuleBadgeProps) {
  const config = moduleConfig[module]
  return (
    <Badge
      className={`gap-1 cursor-pointer hover:scale-105 transition-transform ${config.bg} ${config.text} border-0 shadow-sm`}
      onClick={onClick}
    >
      <config.icon className="h-3 w-3" />
      {label || config.label}
    </Badge>
  )
}

// ─── Auto-Registration Hooks ────────────────────────────────────────────────

/**
 * Hook to register Store data with the cross-module store.
 * Call this in StorePage's useEffect.
 */
export function useRegisterStoreData(orders: any[], products: any[]) {
  const { registerStoreData } = useCrossModuleStore()

  useEffect(() => {
    if (orders.length > 0 || products.length > 0) {
      registerStoreData(
        orders.map(o => ({
          orderNumber: o.orderNumber,
          customer: o.customer,
          customerPhone: o.customerPhone,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
          items: o.items || [],
        })),
        products.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stock: p.stock,
          price: p.price,
          salePrice: p.salePrice || 0,
          status: p.status,
          category: p.category,
        }))
      )
    }
  }, [orders, products, registerStoreData])
}

/**
 * Hook to register CRM data with the cross-module store.
 * Call this in CrmPage's useEffect.
 */
export function useRegisterCRMData(contacts: any[]) {
  const { registerCRMData } = useCrossModuleStore()

  useEffect(() => {
    if (contacts.length > 0) {
      registerCRMData(
        contacts.map(c => ({
          id: c.id,
          name: c.name,
          company: c.company,
          phone: c.phone,
          email: c.email,
          dealValue: c.dealValue,
          avatar: c.avatar,
          stage: c.stage,
        }))
      )
    }
  }, [contacts, registerCRMData])
}

/**
 * Hook to register Accounting data with the cross-module store.
 * Call this in AccountingPage's useEffect.
 */
export function useRegisterAccountingData(invoices: any[], transactions: any[]) {
  const { registerAccountingData } = useCrossModuleStore()

  useEffect(() => {
    if (invoices.length > 0 || transactions.length > 0) {
      registerAccountingData(
        invoices.map(i => ({
          id: i.id,
          number: i.number,
          customer: i.customer,
          amount: i.amount,
          status: i.status,
          date: i.date,
          dueDate: i.dueDate,
        })),
        transactions.map(t => ({
          id: t.id,
          date: t.date,
          description: t.description,
          type: t.type,
          category: t.category,
          amount: t.amount,
          account: t.account,
        }))
      )
    }
  }, [invoices, transactions, registerAccountingData])
}

/**
 * Hook to register Inventory data with the cross-module store.
 * Call this in InventoryPage's useEffect.
 */
export function useRegisterInventoryData(items: any[]) {
  const { registerInventoryData } = useCrossModuleStore()

  useEffect(() => {
    if (items.length > 0) {
      registerInventoryData(
        items.map(i => ({
          id: i.id,
          name: i.name,
          sku: i.sku,
          category: i.category,
          stock: i.stock,
          minStock: i.minStock,
          unitPrice: i.unitPrice,
          status: i.status,
        }))
      )
    }
  }, [items, registerInventoryData])
}

/**
 * Hook to register Finance data with the cross-module store.
 * Call this in FinancePage's useEffect.
 */
export function useRegisterFinanceData(transactions: any[]) {
  const { registerFinanceData } = useCrossModuleStore()

  useEffect(() => {
    if (transactions.length > 0) {
      registerFinanceData(
        transactions.map(t => ({
          id: t.id,
          date: t.date,
          description: t.description,
          type: t.type,
          amount: t.amount,
          category: t.category,
        }))
      )
    }
  }, [transactions, registerFinanceData])
}
