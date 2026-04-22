'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Users, Plus, Pencil, Search, Phone, Mail, Building2, DollarSign,
  Handshake, TrendingUp, UserCircle, GripVertical, ArrowLeftRight,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Contact {
  id: string
  name: string
  company: string
  phone: string
  email: string
  dealValue: number
  avatar: string
  stage: string
  notes: string
}

type PipelineStage = {
  id: string
  title: string
  color: string
  gradient: string
  dotColor: string
}

// ─── Pipeline stages ────────────────────────────────────────────────────────

const pipelineStages: PipelineStage[] = [
  { id: 'initial', title: 'تماس اولیه', color: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500 to-blue-600', dotColor: 'bg-blue-500' },
  { id: 'assessment', title: 'نیازسنجی', color: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-500 to-violet-600', dotColor: 'bg-violet-500' },
  { id: 'proposal', title: 'پیشنهاد قیمت', color: 'text-amber-600 dark:text-amber-400', gradient: 'from-amber-500 to-amber-600', dotColor: 'bg-amber-500' },
  { id: 'negotiation', title: 'مذاکره', color: 'text-orange-600 dark:text-orange-400', gradient: 'from-orange-500 to-orange-600', dotColor: 'bg-orange-500' },
  { id: 'success', title: 'موفق', color: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500 to-emerald-600', dotColor: 'bg-emerald-500' },
  { id: 'lost', title: 'از دست رفته', color: 'text-red-600 dark:text-red-400', gradient: 'from-red-500 to-red-600', dotColor: 'bg-red-500' },
]

// ─── Labels ─────────────────────────────────────────────────────────────────

const labels = {
  title: 'مدیریت ارتباط با مشتریان',
  subtitle: 'پیگیری فرصت‌های فروش و مدیریت خط لوله معاملات',
  addContact: 'افزودن مخاطب',
  editContact: 'ویرایش مخاطب',
  save: 'ذخیره',
  cancel: 'انصراف',
  search: 'جستجو در مخاطبین...',
  noResults: 'مخاطبی یافت نشد',
  name: 'نام و نام خانوادگی',
  company: 'شرکت',
  phone: 'تلفن',
  email: 'ایمیل',
  dealValue: 'ارزش معامله (تومان)',
  stage: 'مرحله',
  notes: 'یادداشت',
  dragHint: 'برای جابجایی کلیک و بکشید',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, d => persianDigits[parseInt(d)])
}

function formatDealValue(val: number): string {
  if (val >= 1_000_000_000) return toPersianDigits((val / 1_000_000_000).toFixed(1)) + 'B'
  if (val >= 1_000_000) return toPersianDigits((val / 1_000_000).toFixed(0)) + 'M'
  return toPersianDigits(val.toLocaleString())
}

function getStageInfo(stageId: string): PipelineStage {
  return pipelineStages.find(s => s.id === stageId) ?? pipelineStages[0]
}

// ─── Sample data ────────────────────────────────────────────────────────────

const initialContacts: Contact[] = [
  { id: '1', name: 'علی محمدی', company: 'شرکت فناوری نوین', phone: '۰۹۱۲۱۲۳۴۵۶۷', email: 'ali@novintech.ir', dealValue: 450_000_000, avatar: '👨‍💼', stage: 'negotiation', notes: 'علاقه‌مند به پکیج سازمانی' },
  { id: '2', name: 'سارا احمدی', company: 'گروه بازرگانی آریا', phone: '۰۹۳۵۱۲۳۴۵۶۷', email: 'sara@ariagroup.ir', dealValue: 1_200_000_000, avatar: '👩‍💼', stage: 'proposal', notes: 'در انتظار تایید بودجه' },
  { id: '3', name: 'رضا کریمی', company: 'صنایع پارس', phone: '۰۹۱۳۱۲۳۴۵۶۷', email: 'reza@parsind.ir', dealValue: 800_000_000, avatar: '👨‍🔬', stage: 'success', notes: 'قرارداد امضا شد' },
  { id: '4', name: 'مریم حسینی', company: 'شرکت دانش‌بنیان پارسه', phone: '۰۹۲۲۱۲۳۴۵۶۷', email: 'marzieh@parseh.ir', dealValue: 320_000_000, avatar: '👩‍💻', stage: 'assessment', notes: 'جلسه نیازسنجی برگزار شد' },
  { id: '5', name: 'حسین رحیمی', company: 'فروشگاه آنلاین دیجیکالا', phone: '۰۹۱۹۱۲۳۴۵۶۷', email: 'hossein@digi.ir', dealValue: 2_300_000_000, avatar: '👨‍🚀', stage: 'negotiation', notes: 'مذاکره روی شرایط پرداخت' },
  { id: '6', name: 'نازنین زارعی', company: 'موسسه آموزشی راهبرد', phone: '۰۹۳۸۱۲۳۴۵۶۷', email: 'nazanin@rahbord.ir', dealValue: 150_000_000, avatar: '👩‍🏫', stage: 'initial', notes: 'اولین تماس انجام شد' },
  { id: '7', name: 'امیر نوری', company: 'شرکت عمرانی سازه', phone: '۰۹۱۶۱۲۳۴۵۶۷', email: 'amir@sazeh.ir', dealValue: 500_000_000, avatar: '👷', stage: 'lost', notes: 'به دلایل بودجه لغو شد' },
  { id: '8', name: 'فاطمه عباسی', company: 'هلدینگ سرمایه‌گذاری برتر', phone: '۰۹۳۶۱۲۳۴۵۶۷', email: 'fatemeh@bartar.ir', dealValue: 3_500_000_000, avatar: '👩‍💼', stage: 'proposal', notes: 'پیشنهاد قیمت ارسال شد' },
  { id: '9', name: 'مهدی صادقی', company: 'استارتاپ هوش مصنوعی', phone: '۰۹۱۲۹۸۷۶۵۴۳', email: 'mehdi@ai-startup.ir', dealValue: 670_000_000, avatar: '🧑‍💻', stage: 'assessment', notes: 'نیاز به مشاوره فنی بیشتر' },
  { id: '10', name: 'زهرا موسوی', company: 'شرکت داروسازی شهید قندی', phone: '۰۹۳۵۹۸۷۶۵۴۳', email: 'zahra@ghandi.ir', dealValue: 920_000_000, avatar: '👩‍⚕️', stage: 'success', notes: 'پروژه اجرایی شد' },
]

const emptyContact: Omit<Contact, 'id'> = {
  name: '', company: '', phone: '', email: '',
  dealValue: 0, avatar: '👤', stage: 'initial', notes: '',
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CrmPage() {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [form, setForm] = useState<Omit<Contact, 'id'>>(emptyContact)

  const totalDeals = contacts.filter(c => !['lost', 'success'].includes(c.stage)).length
  const totalValue = contacts.filter(c => c.stage !== 'lost').reduce((sum, c) => sum + c.dealValue, 0)
  const successRate = contacts.length > 0 ? Math.round((contacts.filter(c => c.stage === 'success').length / contacts.length) * 100) : 0

  const filtered = contacts.filter(c =>
    c.name.includes(search) || c.company.includes(search) || c.email.includes(search)
  )

  const openCreate = () => {
    setEditingContact(null)
    setForm(emptyContact)
    setDialogOpen(true)
  }

  const openEdit = (contact: Contact) => {
    setEditingContact(contact)
    setForm({
      name: contact.name, company: contact.company, phone: contact.phone,
      email: contact.email, dealValue: contact.dealValue, avatar: contact.avatar,
      stage: contact.stage, notes: contact.notes,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.name) return
    if (editingContact) {
      setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...form } : c))
      toast.success('اطلاعات مخاطب بروزرسانی شد')
    } else {
      const newContact: Contact = { ...form, id: Date.now().toString() }
      setContacts(prev => [...prev, newContact])
      toast.success('مخاطب جدید ایجاد شد')
    }
    setDialogOpen(false)
  }

  const getStageContacts = (stageId: string) => filtered.filter(c => c.stage === stageId)
  const getStageValue = (stageId: string) => getStageContacts(stageId).reduce((s, c) => s + c.dealValue, 0)

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{labels.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />{labels.addContact}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-md shadow-cyan-500/25 shrink-0">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">کل مخاطبین</p>
              <p className="text-2xl font-bold tabular-nums text-cyan-600 dark:text-cyan-400">{toPersianDigits(contacts.length)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
              <Handshake className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">فرصت‌های فعال</p>
              <p className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{toPersianDigits(totalDeals)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">ارزش کل قراردادها</p>
              <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatDealValue(totalValue)} تومان</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">نرخ تبدیل</p>
              <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{toPersianDigits(successRate)}٪</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10 glass-card-cyan shadow-sm" />
      </div>

      {/* Kanban Pipeline */}
      {filtered.length === 0 ? (
        <Card className="glass-card shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-200 dark:from-cyan-900/20 dark:to-teal-800/20 flex items-center justify-center mb-4">
              <UserCircle className="h-10 w-10 text-cyan-300" />
            </div>
            <p className="text-base font-medium">{search ? labels.noResults : 'مخاطبی یافت نشد'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ direction: 'ltr' }}>
          {pipelineStages.map(stage => {
            const stageContacts = getStageContacts(stage.id)
            const stageValue = getStageValue(stage.id)
            return (
              <div
                key={stage.id}
                className="min-w-[280px] max-w-[300px] flex-shrink-0 flex flex-col"
                style={{ direction: 'rtl' }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${stage.dotColor} shadow-sm shadow-current/30`} />
                    <h3 className={`text-sm font-bold ${stage.color}`}>{stage.title}</h3>
                  </div>
                  <Badge variant="secondary" className="text-[10px] tabular-nums">
                    {toPersianDigits(stageContacts.length)}
                  </Badge>
                </div>
                {/* Column value */}
                <p className="text-[11px] text-muted-foreground mb-2 tabular-nums">
                  {formatDealValue(stageValue)} تومان
                </p>
                {/* Cards */}
                <div className="flex-1 space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {stageContacts.map((contact, idx) => (
                    <Card
                      key={contact.id}
                      className="cursor-pointer hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in border-0 group overflow-hidden"
                      style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                      onClick={() => openEdit(contact)}
                    >
                      {/* Top gradient line */}
                      <div className={`h-1 bg-gradient-to-r ${stage.gradient}`} />
                      <CardContent className="p-3 space-y-2.5">
                        {/* Avatar + Name */}
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                            {contact.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{contact.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                              <Building2 className="h-3 w-3 flex-shrink-0" />
                              {contact.company}
                            </p>
                          </div>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground flex-shrink-0 cursor-grab"
                            onClick={e => e.stopPropagation()}
                            title={labels.dragHint}
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                        </div>
                        {/* Contact info */}
                        <div className="space-y-1">
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            {contact.phone}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate" dir="ltr">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            {contact.email}
                          </p>
                        </div>
                        {/* Deal value */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                          <span className="text-[10px] text-muted-foreground">ارزش معامله</span>
                          <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {formatDealValue(contact.dealValue)} تومان
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stageContacts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40 text-xs border border-dashed border-border/40 rounded-lg">
                      <ArrowLeftRight className="h-6 w-6 mb-1.5" />
                      <span>{labels.dragHint}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-cyan-700 dark:text-cyan-300">
              {editingContact ? labels.editContact : labels.addContact}
            </DialogTitle>
            <DialogDescription>
              {editingContact ? 'اطلاعات مخاطب را ویرایش کنید' : 'اطلاعات مخاطب جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{labels.name}</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{labels.company}</Label>
              <Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.phone}</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{labels.email}</Label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} dir="ltr" type="email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.dealValue}</Label>
                <Input
                  type="number"
                  value={form.dealValue}
                  onChange={e => setForm({ ...form, dealValue: Number(e.target.value) })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{labels.stage}</Label>
                <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {pipelineStages.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{labels.notes}</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSave} disabled={!form.name}>
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
