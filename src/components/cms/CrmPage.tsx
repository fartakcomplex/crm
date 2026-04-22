'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts'
import {
  Users, Plus, Pencil, Search, Phone, Mail, Building2, DollarSign,
  Handshake, TrendingUp, UserCircle, GripVertical, ArrowLeftRight,
  PhoneCall, Video, FileText, StickyNote, Calendar, Clock, Filter,
  BarChart3, PieChart as PieChartIcon, ArrowUpDown, Eye, History,
  MessageSquare, ChevronLeft, Circle, Target, CheckCircle2, XCircle,
  Timer, ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRegisterCRMData, ContactCrossRef, ModuleBadge, CrossModuleSyncStatus } from '@/components/CrossModulePanel'
import { useCrossModuleStore } from '@/lib/cross-module-store'

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
  createdAt: string
}

interface Activity {
  id: string
  contactId: string
  contactName: string
  type: 'call' | 'email' | 'meeting' | 'note'
  title: string
  description: string
  date: string
  time: string
}

type PipelineStage = {
  id: string
  title: string
  color: string
  gradient: string
  dotColor: string
}

type SortField = 'name' | 'company' | 'dealValue'
type SortDir = 'asc' | 'desc'

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
  tabs: {
    pipeline: 'خط لوله فروش',
    contacts: 'مخاطبین',
    activities: 'فعالیت‌ها',
    reports: 'گزارش‌ها',
  },
  contactDetail: 'اطلاعات مخاطب',
  contactInfo: 'اطلاعات تماس',
  contactNotes: 'یادداشت‌ها',
  contactHistory: 'تاریخچه فعالیت‌ها',
  noActivity: 'فعالیتی ثبت نشده',
  totalValue: 'ارزش کل',
  count: 'تعداد',
  sortByName: 'نام',
  sortByCompany: 'شرکت',
  sortByValue: 'ارزش معامله',
  reportConversion: 'قیف تبدیل فروش',
  reportStages: 'توزیع مراحل معاملات',
  reportTopDeals: 'بزرگ‌ترین معاملات',
  activityTypes: {
    call: 'تماس تلفنی',
    email: 'ایمیل',
    meeting: 'جلسه',
    note: 'یادداشت',
  },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, d => persianDigits[parseInt(d)])
}

function formatDealValue(val: number): string {
  if (val >= 1_000_000_000) return toPersianDigits((val / 1_000_000_000).toFixed(1)) + ' میلیارد'
  if (val >= 1_000_000) return toPersianDigits((val / 1_000_000).toFixed(0)) + ' میلیون'
  return toPersianDigits(val.toLocaleString())
}

function getStageInfo(stageId: string): PipelineStage {
  return pipelineStages.find(s => s.id === stageId) ?? pipelineStages[0]
}

function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'call': return <PhoneCall className="h-4 w-4" />
    case 'email': return <Mail className="h-4 w-4" />
    case 'meeting': return <Video className="h-4 w-4" />
    case 'note': return <StickyNote className="h-4 w-4" />
  }
}

function getActivityColor(type: Activity['type']) {
  switch (type) {
    case 'call': return 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40'
    case 'email': return 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40'
    case 'meeting': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
    case 'note': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
  }
}

// ─── Sample data ────────────────────────────────────────────────────────────

const initialContacts: Contact[] = [
  { id: '1', name: 'علی محمدی', company: 'شرکت فناوری نوین', phone: '۰۹۱۲۱۲۳۴۵۶۷', email: 'ali@novintech.ir', dealValue: 450_000_000, avatar: '👨‍💼', stage: 'negotiation', notes: 'علاقه‌مند به پکیج سازمانی', createdAt: '۱۴۰۳/۰۹/۱۵' },
  { id: '2', name: 'سارا احمدی', company: 'گروه بازرگانی آریا', phone: '۰۹۳۵۱۲۳۴۵۶۷', email: 'sara@ariagroup.ir', dealValue: 1_200_000_000, avatar: '👩‍💼', stage: 'proposal', notes: 'در انتظار تایید بودجه', createdAt: '۱۴۰۳/۰۹/۱۰' },
  { id: '3', name: 'رضا کریمی', company: 'صنایع پارس', phone: '۰۹۱۳۱۲۳۴۵۶۷', email: 'reza@parsind.ir', dealValue: 800_000_000, avatar: '👨‍🔬', stage: 'success', notes: 'قرارداد امضا شد', createdAt: '۱۴۰۳/۰۸/۲۰' },
  { id: '4', name: 'مریم حسینی', company: 'شرکت دانش‌بنیان پارسه', phone: '۰۹۲۲۱۲۳۴۵۶۷', email: 'marzieh@parseh.ir', dealValue: 320_000_000, avatar: '👩‍💻', stage: 'assessment', notes: 'جلسه نیازسنجی برگزار شد', createdAt: '۱۴۰۳/۰۹/۲۰' },
  { id: '5', name: 'حسین رحیمی', company: 'فروشگاه آنلاین دیجیکالا', phone: '۰۹۱۹۱۲۳۴۵۶۷', email: 'hossein@digi.ir', dealValue: 2_300_000_000, avatar: '👨‍🚀', stage: 'negotiation', notes: 'مذاکره روی شرایط پرداخت', createdAt: '۱۴۰۳/۰۹/۰۵' },
  { id: '6', name: 'نازنین زارعی', company: 'موسسه آموزشی راهبرد', phone: '۰۹۳۸۱۲۳۴۵۶۷', email: 'nazanin@rahbord.ir', dealValue: 150_000_000, avatar: '👩‍🏫', stage: 'initial', notes: 'اولین تماس انجام شد', createdAt: '۱۴۰۳/۰۹/۲۵' },
  { id: '7', name: 'امیر نوری', company: 'شرکت عمرانی سازه', phone: '۰۹۱۶۱۲۳۴۵۶۷', email: 'amir@sazeh.ir', dealValue: 500_000_000, avatar: '👷', stage: 'lost', notes: 'به دلایل بودجه لغو شد', createdAt: '۱۴۰۳/۰۸/۱۰' },
  { id: '8', name: 'فاطمه عباسی', company: 'هلدینگ سرمایه‌گذاری برتر', phone: '۰۹۳۶۱۲۳۴۵۶۷', email: 'fatemeh@bartar.ir', dealValue: 3_500_000_000, avatar: '👩‍💼', stage: 'proposal', notes: 'پیشنهاد قیمت ارسال شد', createdAt: '۱۴۰۳/۰۹/۰۱' },
  { id: '9', name: 'مهدی صادقی', company: 'استارتاپ هوش مصنوعی', phone: '۰۹۱۲۹۸۷۶۵۴۳', email: 'mehdi@ai-startup.ir', dealValue: 670_000_000, avatar: '🧑‍💻', stage: 'assessment', notes: 'نیاز به مشاوره فنی بیشتر', createdAt: '۱۴۰۳/۰۹/۱۸' },
  { id: '10', name: 'زهرا موسوی', company: 'شرکت داروسازی شهید قندی', phone: '۰۹۳۵۹۸۷۶۵۴۳', email: 'zahra@ghandi.ir', dealValue: 920_000_000, avatar: '👩‍⚕️', stage: 'success', notes: 'پروژه اجرایی شد', createdAt: '۱۴۰۳/۰۸/۱۵' },
  { id: '11', name: 'پویا شریفی', company: 'شرکت حمل‌ونقل سریع', phone: '۰۹۱۱۵۵۵۴۴۳۳', email: 'pouya@express.ir', dealValue: 280_000_000, avatar: '🚚', stage: 'initial', notes: 'درخواست دمو محصول', createdAt: '۱۴۰۳/۰۹/۲۸' },
  { id: '12', name: 'لیلا رحمانی', company: 'مجتمع تجاری ایرانیان', phone: '۰۹۳۳۱۱۱۲۲۳۳', email: 'leila@iranian.ir', dealValue: 1_800_000_000, avatar: '🏬', stage: 'proposal', notes: 'قرارداد سه‌ساله پیشنهاد شده', createdAt: '۱۴۰۳/۰۹/۱۲' },
  { id: '13', name: 'کامران شفیعی', company: 'شرکت نرم‌افزاری تک‌وب', phone: '۰۹۱۲۴۴۴۵۵۶۶', email: 'kamran@takweb.ir', dealValue: 410_000_000, avatar: '👨‍💻', stage: 'assessment', notes: 'نیاز به API اختصاصی', createdAt: '۱۴۰۳/۰۹/۲۲' },
  { id: '14', name: 'شیدا بابایی', company: 'آژانس تبلیغاتی آینده', phone: '۰۹۳۷۷۷۸۸۹۹۰', email: 'shida@ayandeh.ir', dealValue: 195_000_000, avatar: '🎨', stage: 'success', notes: 'پروژه طراحی وب‌سایت تحویل شد', createdAt: '۱۴۰۳/۰۷/۲۵' },
  { id: '15', name: 'بهنام همتی', company: 'صندوق سرمایه‌گذاری آرمان', phone: '۰۹۱۶۳۳۳۲۲۱۱', email: 'behnam@arman.ir', dealValue: 5_000_000_000, avatar: '🏦', stage: 'negotiation', notes: 'مذاکره نهایی قرارداد', createdAt: '۱۴۰۳/۰۹/۰۸' },
]

const initialActivities: Activity[] = [
  { id: 'a1', contactId: '1', contactName: 'علی محمدی', type: 'call', title: 'تماس پیگیری', description: 'تماس برای بررسی وضعیت پیشنهاد و پاسخ به سوالات فنی', date: '۱۴۰۳/۰۹/۲۸', time: '۱۴:۳۰' },
  { id: 'a2', contactId: '2', contactName: 'سارا احمدی', type: 'email', title: 'ارسال پیشنهاد قیمت', description: 'فایل پیشنهاد قیمت و کاتالوگ محصولات ارسال شد', date: '۱۴۰۳/۰۹/۲۷', time: '۱۰:۱۵' },
  { id: 'a3', contactId: '5', contactName: 'حسین رحیمی', type: 'meeting', title: 'جلسه مذاکره', description: 'جلسه حضوری با تیم فنی و مالی دیجیکالا برگزار شد', date: '۱۴۰۳/۰۹/۲۶', time: '۱۱:۰۰' },
  { id: 'a4', contactId: '8', contactName: 'فاطمه عباسی', type: 'note', title: 'پیگیری بودجه', description: 'بودجه سالانه هلدینگ در حال تصویب است، تا هفته آینده نتیجه مشخص می‌شود', date: '۱۴۰۳/۰۹/۲۵', time: '۱۶:۴۵' },
  { id: 'a5', contactId: '3', contactName: 'رضا کریمی', type: 'call', title: 'تماس تبریک', description: 'تماس برای تبریک امضای قرارداد و هماهنگی شروع پروژه', date: '۱۴۰۳/۰۹/۲۴', time: '۰۹:۰۰' },
  { id: 'a6', contactId: '15', contactName: 'بهنام همتی', type: 'meeting', title: 'جلسه مدیریت ارشد', description: 'ارائه دمو محصول به مدیرعامل و هیئت مدیره صندوق', date: '۱۴۰۳/۰۹/۲۳', time: '۱۵:۳۰' },
  { id: 'a7', contactId: '4', contactName: 'مریم حسینی', type: 'email', title: 'ارسال سوالات فنی', description: 'لیست سوالات فنی برای تیم مهندسی شرکت دانش‌بنیان ارسال شد', date: '۱۴۰۳/۰۹/۲۲', time: '۱۳:۲۰' },
  { id: 'a8', contactId: '11', contactName: 'پویا شریفی', type: 'call', title: 'تماس اولیه', description: 'تماس معرفی شرکت و محصولات، علاقه‌مندی به دمو نشان داده شد', date: '۱۴۰۳/۰۹/۲۸', time: '۱۱:۰۰' },
  { id: 'a9', contactId: '12', contactName: 'لیلا رحمانی', type: 'meeting', title: 'جلسه نیازسنجی', description: 'بررسی نیازهای نرم‌افزاری مجتمع و ارائه راهکار اختصاصی', date: '۱۴۰۳/۰۹/۲۱', time: '۱۰:۰۰' },
  { id: 'a10', contactId: '9', contactName: 'مهدی صادقی', type: 'note', title: 'یادداشت فنی', description: 'نیاز به هماهنگی با تیم هوش مصنوعی برای بررسی قابلیت یکپارچه‌سازی', date: '۱۴۰۳/۰۹/۲۰', time: '۱۷:۰۰' },
  { id: 'a11', contactId: '6', contactName: 'نازنین زارعی', type: 'email', title: 'ارسال بروشور', description: 'بروشور خدمات آموزشی و نمونه کارها ارسال شد', date: '۱۴۰۳/۰۹/۲۶', time: '۰۸:۳۰' },
  { id: 'a12', contactId: '13', contactName: 'کامران شفیعی', type: 'call', title: 'مشاوره فنی', description: 'بررسی نیازمندی‌های API و تعیین زمان دمو فنی', date: '۱۴۰۳/۰۹/۲۷', time: '۱۴:۰۰' },
]

const emptyContact: Omit<Contact, 'id' | 'createdAt'> = {
  name: '', company: '', phone: '', email: '',
  dealValue: 0, avatar: '👤', stage: 'initial', notes: '',
}

// ─── Chart configs ──────────────────────────────────────────────────────────

const funnelChartConfig = {
  value: { label: 'تعداد معاملات', color: 'var(--chart-1)' },
} as const

const stageChartConfig = {
  value: { label: 'ارزش (میلیون تومان)', color: 'var(--chart-1)' },
} as const

// ─── Component ──────────────────────────────────────────────────────────────

export default function CrmPage() {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [activities] = useState<Activity[]>(initialActivities)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [form, setForm] = useState<Omit<Contact, 'id' | 'createdAt'>>(emptyContact)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('pipeline')
  const [contactSort, setContactSort] = useState<SortField>('name')
  const [contactSortDir, setContactSortDir] = useState<SortDir>('asc')
  const [activityFilter, setActivityFilter] = useState<'all' | 'call' | 'email' | 'meeting' | 'note'>('all')

  // ── Cross-Module Data Registration ──
  useRegisterCRMData(contacts)
  const { getContactByName } = useCrossModuleStore()

  // ── Computed stats ──
  const totalDeals = contacts.filter(c => !['lost', 'success'].includes(c.stage)).length
  const totalValue = contacts.filter(c => c.stage !== 'lost').reduce((sum, c) => sum + c.dealValue, 0)
  const successRate = contacts.length > 0 ? Math.round((contacts.filter(c => c.stage === 'success').length / contacts.length) * 100) : 0
  const lostCount = contacts.filter(c => c.stage === 'lost').length

  const filtered = contacts.filter(c =>
    c.name.includes(search) || c.company.includes(search) || c.email.includes(search)
  )

  // ── Report data ──
  const funnelData = useMemo(() => {
    return pipelineStages.map(stage => ({
      name: stage.title,
      value: contacts.filter(c => c.stage === stage.id).length,
      fill: stage.dotColor.includes('blue') ? '#3b82f6'
        : stage.dotColor.includes('violet') ? '#8b5cf6'
        : stage.dotColor.includes('amber') ? '#f59e0b'
        : stage.dotColor.includes('orange') ? '#f97316'
        : stage.dotColor.includes('emerald') ? '#10b981'
        : '#ef4444',
    }))
  }, [contacts])

  const stageValueData = useMemo(() => {
    return pipelineStages.map(stage => ({
      name: stage.title,
      value: Math.round(contacts.filter(c => c.stage === stage.id).reduce((s, c) => s + c.dealValue, 0) / 1_000_000),
      fill: stage.dotColor.includes('blue') ? '#3b82f6'
        : stage.dotColor.includes('violet') ? '#8b5cf6'
        : stage.dotColor.includes('amber') ? '#f59e0b'
        : stage.dotColor.includes('orange') ? '#f97316'
        : stage.dotColor.includes('emerald') ? '#10b981'
        : '#ef4444',
    }))
  }, [contacts])

  const topDeals = useMemo(() => {
    return [...contacts].sort((a, b) => b.dealValue - a.dealValue).slice(0, 5)
  }, [contacts])

  // ── Sorted contacts for table ──
  const sortedContacts = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      if (contactSort === 'name') cmp = a.name.localeCompare(b.name, 'fa')
      else if (contactSort === 'company') cmp = a.company.localeCompare(b.company, 'fa')
      else cmp = a.dealValue - b.dealValue
      return contactSortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, contactSort, contactSortDir])

  const handleSort = (field: SortField) => {
    if (contactSort === field) {
      setContactSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setContactSort(field)
      setContactSortDir('asc')
    }
  }

  const getContactActivities = (contactId: string) =>
    activities.filter(a => a.contactId === contactId)

  // ── Dialog handlers ──
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

  const openDetail = (contact: Contact) => {
    setSelectedContact(contact)
    setSheetOpen(true)
  }

  const handleSave = () => {
    if (!form.name) return
    if (editingContact) {
      setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...form } : c))
      toast.success('اطلاعات مخاطب بروزرسانی شد')
    } else {
      const newContact: Contact = { ...form, id: Date.now().toString(), createdAt: '۱۴۰۳/۰۹/۲۸' }
      setContacts(prev => [...prev, newContact])
      toast.success('مخاطب جدید ایجاد شد')
    }
    setDialogOpen(false)
  }

  const getStageContacts = (stageId: string) => filtered.filter(c => c.stage === stageId)
  const getStageValue = (stageId: string) => getStageContacts(stageId).reduce((s, c) => s + c.dealValue, 0)

  // ─── Render: Stats Cards ──────────────────────────────────────────────────

  const renderStats = () => (
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
  )

  // ─── Render: Pipeline Tab ─────────────────────────────────────────────────

  const renderPipeline = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10 glass-card-cyan shadow-sm" />
      </div>

      {/* Kanban */}
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
          {pipelineStages.map((stage, stageIdx) => {
            const stageContacts = getStageContacts(stage.id)
            const stageValue = getStageValue(stage.id)
            return (
              <div
                key={stage.id}
                className="min-w-[260px] max-w-[280px] flex-shrink-0 flex flex-col animate-in"
                style={{ direction: 'rtl', animationDelay: `${stageIdx * 60}ms`, animationFillMode: 'both' }}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-2">
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
                  {labels.totalValue}: {formatDealValue(stageValue)} تومان
                </p>
                {/* Cards */}
                <div className="flex-1 space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {stageContacts.map((contact, idx) => {
                    const cActivities = getContactActivities(contact.id)
                    return (
                      <Card
                        key={contact.id}
                        className="cursor-pointer hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in border-0 group overflow-hidden"
                        style={{ animationDelay: `${(stageIdx * 60) + (idx * 40)}ms`, animationFillMode: 'both' }}
                        onClick={() => openDetail(contact)}
                      >
                        <div className={`h-1 bg-gradient-to-r ${stage.gradient}`} />
                        <CardContent className="p-3 space-y-2">
                          {/* Avatar + Name */}
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center text-base shadow-sm flex-shrink-0">
                              {contact.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[13px] truncate">{contact.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                <Building2 className="h-2.5 w-2.5 flex-shrink-0" />
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
                          {/* Deal value + activity count */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                            <span className="text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                              {formatDealValue(contact.dealValue)}
                            </span>
                            <div className="flex items-center gap-2">
                              {cActivities.length > 0 && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <History className="h-2.5 w-2.5" />
                                  {toPersianDigits(cActivities.length)} فعالیت
                                </span>
                              )}
                              {(() => {
                                const crossContact = getContactByName(contact.name)
                                return crossContact && crossContact.storeOrderCount > 0 && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <ShoppingBag className="h-2.5 w-2.5" />
                                    {toPersianDigits(crossContact.storeOrderCount)} سفارش
                                  </span>
                                )
                              })()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
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
    </div>
  )

  // ─── Render: Contacts Tab ─────────────────────────────────────────────────

  const renderContacts = () => (
    <div className="space-y-4">
      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10 glass-card-cyan shadow-sm" />
        </div>
        <div className="flex gap-2">
          {([
            { field: 'name' as SortField, label: labels.sortByName },
            { field: 'company' as SortField, label: labels.sortByCompany },
            { field: 'dealValue' as SortField, label: labels.sortByValue },
          ]).map(s => (
            <Button
              key={s.field}
              variant={contactSort === s.field ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5 text-xs transition-all duration-200"
              onClick={() => handleSort(s.field)}
            >
              {contactSort === s.field && (
                <ArrowUpDown className="h-3 w-3" />
              )}
              {s.label}
              {contactSort === s.field && (
                <span className="text-[10px] mr-1">
                  {contactSortDir === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="glass-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-right text-xs font-bold">مخاطب</TableHead>
              <TableHead className="text-right text-xs font-bold hidden md:table-cell">شرکت</TableHead>
              <TableHead className="text-right text-xs font-bold hidden lg:table-cell">تلفن</TableHead>
              <TableHead className="text-right text-xs font-bold">ارزش معامله</TableHead>
              <TableHead className="text-right text-xs font-bold">مرحله</TableHead>
              <TableHead className="text-right text-xs font-bold w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <UserCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  {labels.noResults}
                </TableCell>
              </TableRow>
            ) : (
              sortedContacts.map((contact, idx) => {
                const stage = getStageInfo(contact.stage)
                return (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer animate-in group"
                    style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                    onClick={() => openDetail(contact)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center text-base shadow-sm flex-shrink-0">
                          {contact.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{contact.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate md:hidden">{contact.company}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">{contact.company}</span>
                        {(() => {
                          const crossContact = getContactByName(contact.name)
                          return crossContact && crossContact.sources.length > 1 && (
                            <div className="flex gap-1">
                              {crossContact.sources.filter((s: string) => s !== 'crm').map((s: string) => (
                                <ModuleBadge key={s} module={s as 'store' | 'accounting' | 'inventory' | 'finance'} />
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground" dir="ltr">{contact.phone}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatDealValue(contact.dealValue)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] border-0 ${stage.color}`} style={{ backgroundColor: 'var(--stage-bg, transparent)' }}>
                        <span className={`h-1.5 w-1.5 rounded-full ${stage.dotColor} ml-1.5`} />
                        {stage.title}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => { e.stopPropagation(); openDetail(contact) }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )

  // ─── Render: Activities Tab ───────────────────────────────────────────────

  const renderActivities = () => {
    const typeFilters = ['all', 'call', 'email', 'meeting', 'note'] as const

    const filteredActivities = activityFilter === 'all'
      ? activities
      : activities.filter(a => a.type === activityFilter)

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {typeFilters.map(type => (
            <Button
              key={type}
              variant={activityFilter === type ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5 text-xs transition-all duration-200"
              onClick={() => setActivityFilter(type)}
            >
              {type !== 'all' && getActivityIcon(type)}
              {type === 'all' ? 'همه' : labels.activityTypes[type]}
              <Badge variant="secondary" className="text-[10px] mr-1">
                {toPersianDigits(type === 'all' ? activities.length : activities.filter(a => a.type === type).length)}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Timeline */}
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-1 pr-2">
            {filteredActivities.map((activity, idx) => (
              <div
                key={activity.id}
                className="flex gap-4 animate-in"
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
              >
                {/* Timeline line */}
                <div className="flex flex-col items-center pt-4">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)} shrink-0`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  {idx < filteredActivities.length - 1 && (
                    <div className="w-px flex-1 bg-border/60 mt-2" />
                  )}
                </div>

                {/* Content */}
                <Card className="glass-card shadow-sm hover-lift transition-all duration-300 mb-3 flex-1 cursor-pointer animate-in border-0"
                  onClick={() => {
                    const contact = contacts.find(c => c.id === activity.contactId)
                    if (contact) openDetail(contact)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <UserCircle className="h-3 w-3 flex-shrink-0" />
                          {activity.contactName}
                        </p>
                      </div>
                      <div className="text-left shrink-0">
                        <Badge variant="outline" className="text-[10px]">
                          <span className={`h-1.5 w-1.5 rounded-full ml-1 ${getActivityColor(activity.type).split(' ')[1]}`} />
                          {labels.activityTypes[activity.type]}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{activity.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {activity.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // ─── Render: Reports Tab ──────────────────────────────────────────────────

  const renderReports = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-500 mb-2" />
            <p className="text-2xl font-bold tabular-nums">{toPersianDigits(contacts.filter(c => c.stage === 'success').length)}</p>
            <p className="text-xs text-muted-foreground mt-1">معاملات موفق</p>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold tabular-nums">{toPersianDigits(lostCount)}</p>
            <p className="text-xs text-muted-foreground mt-1">معاملات از دست رفته</p>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 text-center">
            <Timer className="h-6 w-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold tabular-nums">{toPersianDigits(totalDeals)}</p>
            <p className="text-xs text-muted-foreground mt-1">در حال مذاکره</p>
          </CardContent>
        </Card>
        <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '180ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto text-cyan-500 mb-2" />
            <p className="text-2xl font-bold tabular-nums">{toPersianDigits(successRate)}٪</p>
            <p className="text-xs text-muted-foreground mt-1">نرخ تبدیل</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
          <CardContent className="p-6">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-500" />
              {labels.reportConversion}
            </h3>
            <ChartContainer config={funnelChartConfig} className="h-[260px] w-full">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 60 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={55}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Stage Distribution */}
        <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <CardContent className="p-6">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-teal-500" />
              {labels.reportStages}
            </h3>
            <ChartContainer config={stageChartConfig} className="h-[260px] w-full">
              <BarChart data={stageValueData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={55}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => toPersianDigits(v)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                  {stageValueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Deals */}
      <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '360ms', animationFillMode: 'both' }}>
        <CardContent className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            {labels.reportTopDeals}
          </h3>
          <div className="space-y-3">
            {topDeals.map((contact, idx) => {
              const stage = getStageInfo(contact.stage)
              const maxValue = topDeals[0]?.dealValue || 1
              const pct = (contact.dealValue / maxValue) * 100
              return (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 rounded-lg p-2 -mx-2 transition-colors"
                  onClick={() => openDetail(contact)}
                >
                  <span className="text-sm font-bold text-muted-foreground w-6 text-center">{toPersianDigits(idx + 1)}</span>
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center text-base shadow-sm flex-shrink-0">
                    {contact.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">{contact.name}</p>
                      <span className="text-[10px] text-muted-foreground hidden sm:inline truncate">{contact.company}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={pct} className="h-1.5 flex-1 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-teal-400" />
                      <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                        {formatDealValue(contact.dealValue)}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0 hidden sm:flex">
                    <span className={`h-1.5 w-1.5 rounded-full ml-1 ${stage.dotColor}`} />
                    {stage.title}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // ─── Render: Contact Detail Sheet ─────────────────────────────────────────

  const renderContactSheet = () => (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetContent side="left" className="w-full sm:max-w-md p-0 overflow-hidden">
        {selectedContact && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-br from-cyan-500 to-teal-600 p-6 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
                  {selectedContact.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold">{selectedContact.name}</h2>
                  <p className="text-sm text-white/80 truncate">{selectedContact.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {getStageInfo(selectedContact.stage).title}
                </Badge>
                <span className="text-sm font-bold">
                  {formatDealValue(selectedContact.dealValue)} تومان
                </span>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                    <FileText className="h-4 w-4" />
                    {labels.contactInfo}
                  </h3>
                  <Card className="glass-card shadow-sm border-0">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center">
                          <Phone className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">تلفن</p>
                          <p className="text-sm font-medium" dir="ltr">{selectedContact.phone}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">ایمیل</p>
                          <p className="text-sm font-medium" dir="ltr">{selectedContact.email}</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">ارزش معامله</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatDealValue(selectedContact.dealValue)} تومان</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">تاریخ ایجاد</p>
                          <p className="text-sm font-medium">{selectedContact.createdAt}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                {selectedContact.notes && (
                  <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                      <StickyNote className="h-4 w-4" />
                      {labels.contactNotes}
                    </h3>
                    <Card className="glass-card shadow-sm border-0">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{selectedContact.notes}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Activity History */}
                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                    <History className="h-4 w-4" />
                    {labels.contactHistory}
                  </h3>
                  {getContactActivities(selectedContact.id).length > 0 ? (
                    <div className="space-y-2">
                      {getContactActivities(selectedContact.id).map(activity => (
                        <Card key={activity.id} className="glass-card shadow-sm border-0">
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${getActivityColor(activity.type)}`}>
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{activity.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>
                                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {activity.date} - {activity.time}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="glass-card shadow-sm border-0">
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">{labels.noActivity}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Cross-Module Reference */}
                <ContactCrossRef contactName={selectedContact.name} currentModule="crm" />

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 transition-all duration-200"
                    onClick={() => { setSheetOpen(false); openEdit(selectedContact) }}
                  >
                    <Pencil className="h-4 w-4" />
                    ویرایش
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white transition-all duration-200"
                    onClick={() => {
                      setSheetOpen(false)
                      toast.success('تماس با مخاطب شروع شد')
                    }}
                  >
                    <Phone className="h-4 w-4" />
                    تماس
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  )

  // ─── Main Render ──────────────────────────────────────────────────────────

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
      {renderStats()}

      {/* Cross-Module Sync Status */}
      <CrossModuleSyncStatus />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="space-y-4">
        <TabsList className="bg-muted/60 backdrop-blur-sm p-1 h-auto flex-wrap gap-1">
          <TabsTrigger
            value="pipeline"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.tabs.pipeline}</span>
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.tabs.contacts}</span>
          </TabsTrigger>
          <TabsTrigger
            value="activities"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.tabs.activities}</span>
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.tabs.reports}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-2">
          {renderPipeline()}
        </TabsContent>
        <TabsContent value="contacts" className="mt-2">
          {renderContacts()}
        </TabsContent>
        <TabsContent value="activities" className="mt-2">
          {renderActivities()}
        </TabsContent>
        <TabsContent value="reports" className="mt-2">
          {renderReports()}
        </TabsContent>
      </Tabs>

      {/* Contact Detail Sheet */}
      {renderContactSheet()}

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
