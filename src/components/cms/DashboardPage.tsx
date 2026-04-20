'use client'

import { useState } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3, FileText, Users, UserCircle, FolderKanban, Eye,
  DollarSign, TrendingUp, Plus, UserPlus, Clock, Activity,
  Lightbulb, MessageCircle, ChevronDown, Sparkles, Star, Zap
} from 'lucide-react'
import { formatRelativeTime } from './types'

// Persian labels
const labels = {
  title: 'داشبورد',
  subtitle: 'نمای کلی سیستم مدیریت محتوا',
  totalPosts: 'کل مطالب',
  totalUsers: 'کاربران',
  totalCustomers: 'مشتریان',
  totalProjects: 'پروژه‌ها',
  totalViews: 'بازدیدها',
  revenue: 'درآمد',
  quickActions: 'عملیات سریع',
  recentActivities: 'فعالیت‌های اخیر',
  valueMetrics: 'شاخص‌های ارزش',
  aiSuggestions: 'پیشنهادات هوش مصنوعی',
  recentComments: 'نظرات اخیر',
  monthlyViews: 'بازدید ماهانه',
  categoryDist: 'توزیع دسته‌بندی‌ها',
  weeklyActivity: 'فعالیت هفتگی',
  contentStatus: 'وضعیت محتوا',
  popularArticles: 'مقالات پربازدید',
  createPost: 'ایجاد مطلب',
  addUser: 'افزودن کاربر',
  newProject: 'پروژه جدید',
  addCustomer: 'مشتری جدید',
  mediaUpload: 'بارگذاری رسانه',
  aiGenerate: 'تولید با AI',
  collapsed: 'باز/بسته',
  views: 'بازدید',
  comments: 'نظرات',
  posts: 'مطالب',
  published: 'منتشر شده',
  draft: 'پیش‌نویس',
  archived: 'بایگانی',
  noActivities: 'فعالیتی یافت نشد',
  noComments: 'نظری یافت نشد',
  noArticles: 'مقاله‌ای یافت نشد',
  improveSeo: 'بهبود سئو',
  schedulePost: 'زمان‌بندی انتشار',
  repurposeContent: 'استفاده مجدد از محتوا',
  updateMeta: 'بروزرسانی متا داده‌ها',
  optimizeImages: 'بهینه‌سازی تصاویر',
}

const statusLabel: Record<string, string> = {
  published: 'منتشر شده',
  draft: 'پیش‌نویس',
  archived: 'بایگانی',
  pending: 'در انتظار',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  spam: 'هرزنامه',
}

const aiSuggestions = [
  { icon: <Lightbulb className="h-4 w-4" />, text: labels.improveSeo, desc: '۳ مطلب شما سئوی ضعیف دارند' },
  { icon: <Clock className="h-4 w-4" />, text: labels.schedulePost, desc: '۲ پیش‌نویس آماده انتشار هستند' },
  { icon: <Zap className="h-4 w-4" />, text: labels.repurposeContent, desc: 'محتوای محبوب را دوباره استفاده کنید' },
  { icon: <FileText className="h-4 w-4" />, text: labels.updateMeta, desc: 'متا توضیحات ۵ مطلب خالی است' },
  { icon: <Sparkles className="h-4 w-4" />, text: labels.optimizeImages, desc: 'تصاویر ۴ مطلب نیاز به بهینه‌سازی دارند' },
]

// ─────────────────────────────── Stat Card ───────────────────────────────

function StatCard({ icon, label, value, color, delay }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; delay?: number
}) {
  return (
    <Card
      className={`bg-gradient-to-br ${color} border-0 text-white stat-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in`}
      style={{ animationDelay: `${delay ?? 0}ms`, animationFillMode: 'both' }}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">{icon}</div>
        <div>
          <p className="text-sm opacity-80">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ────────────────────────────── Collapsible Section ──────────────────────

function Section({ title, defaultOpen, children, delay }: {
  title: string; defaultOpen: boolean; children: React.ReactNode; delay?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in" style={{ animationDelay: `${delay ?? 0}ms`, animationFillMode: 'both' }}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-violet-500/5 transition-colors rounded-t-lg py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-violet-700 dark:text-violet-300">{title}</CardTitle>
              <ChevronDown className={`h-5 w-5 text-violet-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

// ────────────────────────────── Skeleton Loader ──────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 animate-in">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ────────────────────────────── Main Component ───────────────────────────

export default function DashboardPage() {
  useEnsureData(['stats', 'charts', 'activities', 'posts'])
  const { stats, charts, activities, comments } = useCMS()
  const statsData = stats.data
  const chartData = charts.data
  const activitiesData = activities.data ?? []
  const commentsData = comments.data ?? []
  const isLoading = stats.isLoading || charts.isLoading

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 w-fit shadow-sm">
          <Activity className="h-3 w-3 ml-1" />
          آنلاین
        </Badge>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<FileText className="h-5 w-5" />} label={labels.totalPosts} value={statsData?.totalPosts ?? '—'} color="from-violet-500 to-violet-700" delay={0} />
        <StatCard icon={<Users className="h-5 w-5" />} label={labels.totalUsers} value={statsData?.totalUsers ?? '—'} color="from-purple-500 to-purple-700" delay={50} />
        <StatCard icon={<UserCircle className="h-5 w-5" />} label={labels.totalCustomers} value={statsData?.totalCustomers ?? '—'} color="from-fuchsia-500 to-fuchsia-700" delay={100} />
        <StatCard icon={<FolderKanban className="h-5 w-5" />} label={labels.totalProjects} value={statsData?.totalProjects ?? '—'} color="from-sky-500 to-sky-700" delay={150} />
        <StatCard icon={<Eye className="h-5 w-5" />} label={labels.totalViews} value={(statsData?.totalViews ?? 0).toLocaleString()} color="from-emerald-500 to-emerald-700" delay={200} />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label={labels.revenue} value={`$${(statsData?.revenue ?? 0).toLocaleString()}`} color="from-amber-500 to-amber-700" delay={250} />
      </div>

      {/* Collapsible Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <Section title={labels.quickActions} defaultOpen={true} delay={100}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <Plus className="h-4 w-4" />{labels.createPost}
            </Button>
            <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <UserPlus className="h-4 w-4" />{labels.addUser}
            </Button>
            <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <FolderKanban className="h-4 w-4" />{labels.newProject}
            </Button>
            <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <UserCircle className="h-4 w-4" />{labels.addCustomer}
            </Button>
            <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <Sparkles className="h-4 w-4" />{labels.mediaUpload}
            </Button>
            <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <Zap className="h-4 w-4" />{labels.aiGenerate}
            </Button>
          </div>
        </Section>

        {/* Recent Activities */}
        <Section title={labels.recentActivities} defaultOpen={true} delay={150}>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activitiesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Activity className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">{labels.noActivities}</p>
              </div>
            ) : (
              activitiesData.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-violet-500/5 transition-all duration-200 hover-lift">
                  <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-1.5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.details}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(a.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* Value Metrics */}
        <Section title={labels.valueMetrics} defaultOpen={false} delay={200}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">{labels.totalPosts}</span>
              <span className="font-bold text-violet-600 dark:text-violet-400 tabular-nums">{statsData?.totalPosts ?? 0}</span>
            </div>
            <Progress value={statsData?.publishedPosts && statsData?.totalPosts ? (statsData.publishedPosts / statsData.totalPosts) * 100 : 0} className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-violet-400 [&>div]:transition-all" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{labels.published}: {statsData?.publishedPosts ?? 0}</span>
              <span>{labels.draft}: {statsData?.draftPosts ?? 0}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-center">
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400 tabular-nums">{statsData?.totalCustomers ?? 0}</p>
                <p className="text-xs text-muted-foreground">{labels.totalCustomers}</p>
              </div>
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-center">
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400 tabular-nums">{statsData?.activeProjects ?? 0}</p>
                <p className="text-xs text-muted-foreground">پروژه‌های فعال</p>
              </div>
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-center">
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400 tabular-nums">{statsData?.completedProjects ?? 0}</p>
                <p className="text-xs text-muted-foreground">پروژه‌های تکمیل شده</p>
              </div>
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-center">
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400 tabular-nums">{statsData?.mediaCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">فایل‌های رسانه</p>
              </div>
            </div>
          </div>
        </Section>

        {/* AI Suggestions */}
        <Section title={labels.aiSuggestions} defaultOpen={false} delay={250}>
          <div className="space-y-2">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-violet-500/5 transition-all duration-200 cursor-pointer hover-lift">
                <div className="bg-violet-500/10 rounded-lg p-2 text-violet-600 dark:text-violet-400 shrink-0">{s.icon}</div>
                <div>
                  <p className="text-sm font-medium">{s.text}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Recent Comments */}
        <Section title={labels.recentComments} defaultOpen={false} delay={300}>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {commentsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">{labels.noComments}</p>
              </div>
            ) : (
              commentsData.slice(0, 6).map((c) => (
                <div key={c.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-violet-500/5 transition-all duration-200 hover-lift">
                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 text-xs font-bold">
                    {c.author.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.author}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.content}</p>
                  </div>
                  <Badge variant={c.status === 'approved' ? 'default' : c.status === 'pending' ? 'secondary' : 'destructive'} className="shrink-0 text-[10px]">
                    {statusLabel[c.status] ?? c.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* Monthly Views Chart */}
        <Section title={labels.monthlyViews} defaultOpen={true} delay={350}>
          <div className="flex items-end gap-1.5 h-40">
            {(chartData?.monthlyViews ?? []).map((m, i) => {
              const maxVal = Math.max(...(chartData?.monthlyViews ?? []).map(v => v.views), 1)
              const height = (m.views / maxVal) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{m.views}</span>
                  <div
                    className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-md min-h-[4px] transition-all duration-500 group-hover:from-violet-500 group-hover:to-violet-300 group-hover:shadow-lg group-hover:shadow-violet-500/20"
                    style={{ height: `${height}%`, transitionDelay: `${i * 50}ms` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{m.month}</span>
                </div>
              )
            })}
          </div>
        </Section>

        {/* Category Distribution */}
        <Section title={labels.categoryDist} defaultOpen={false} delay={400}>
          <div className="space-y-3">
            {(chartData?.categoryDistribution ?? []).map((c, i) => {
              const maxVal = Math.max(...(chartData?.categoryDistribution ?? []).map(v => v.value), 1)
              const width = (c.value / maxVal) * 100
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{c.name}</span>
                    <span className="text-muted-foreground tabular-nums">{c.value}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${width}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* Weekly Activity */}
        <Section title={labels.weeklyActivity} defaultOpen={false} delay={450}>
          <div className="flex items-end gap-2 h-36">
            {(chartData?.weeklyActivity ?? []).map((w, i) => {
              const maxVal = Math.max(...(chartData?.weeklyActivity ?? []).map(v => Math.max(v.posts, v.comments)), 1)
              const postsH = (w.posts / maxVal) * 100
              const commentsH = (w.comments / maxVal) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="flex gap-0.5 items-end h-28">
                    <div className="w-3 bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-sm transition-all duration-500 group-hover:from-violet-500 group-hover:to-violet-300" style={{ height: `${postsH}%`, transitionDelay: `${i * 30}ms` }} />
                    <div className="w-3 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm transition-all duration-500 group-hover:from-purple-500 group-hover:to-purple-300" style={{ height: `${commentsH}%`, transitionDelay: `${i * 30 + 15}ms` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{w.day}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-violet-500" />
              <span className="text-xs text-muted-foreground">{labels.posts}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-purple-500" />
              <span className="text-xs text-muted-foreground">{labels.comments}</span>
            </div>
          </div>
        </Section>

        {/* Content Status */}
        <Section title={labels.contentStatus} defaultOpen={false} delay={500}>
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-6">
              {(chartData?.contentStatus ?? []).map((cs, i) => {
                const total = (chartData?.contentStatus ?? []).reduce((s, c) => s + c.count, 0) || 1
                const pct = Math.round((cs.count / total) * 100)
                const colorMap: Record<string, string> = {
                  published: 'bg-green-500', draft: 'bg-yellow-500', archived: 'bg-gray-400'
                }
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="4" />
                        <circle cx="18" cy="18" r="14" fill="none" className={colorMap[cs.status] ?? 'bg-gray-400'} strokeWidth="4" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease-out' }} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">{pct}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{statusLabel[cs.status] ?? cs.status}</span>
                    <span className="text-sm font-bold tabular-nums">{cs.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </Section>

        {/* Popular Articles */}
        <Section title={labels.popularArticles} defaultOpen={false} delay={550}>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(chartData?.popularPosts ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Star className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">{labels.noArticles}</p>
              </div>
            ) : (
              (chartData?.popularPosts ?? []).slice(0, 6).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-violet-500/5 transition-all duration-200 hover-lift">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${i < 3 ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-muted text-muted-foreground'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Eye className="h-3 w-3" />
                    {p.views.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>
    </div>
  )
}
