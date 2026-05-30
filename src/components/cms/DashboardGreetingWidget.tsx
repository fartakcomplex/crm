'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Sun, Moon, CloudSun, CalendarDays, Quote, Sparkles } from 'lucide-react'

// ──────────────── Motivational Quotes (Persian) ────────────────

const MOTIVATIONAL_QUOTES = [
  { text: 'هر روز فرصت تازه‌ای برای شروعی بهتر است.', author: 'ناشناس' },
  { text: 'موفقیت نتیجه تلاش مداوم و پشتکار است.', author: 'ناشناس' },
  { text: 'بهترین زمان برای کاشتن درخت بیست سال پیش بود. دومین بهترین زمان همین الان است.', author: 'ضرب‌المثل چینی' },
  { text: 'با هر مشکل، فرصتی برای رشد و پیشرفت همراه است.', author: 'ناشناس' },
  { text: 'صبر و استقامت، کلید رسیدن به اهداف بزرگ است.', author: 'ناشناس' },
  { text: 'کسی که با خودش رقابت می‌کند، همیشه برنده است.', author: 'ناشناس' },
  { text: 'عملکرد دیروز، مبنای بهتر شدن امروز شماست.', author: 'ناشناس' },
  { text: 'تیم قوی‌ترین سرمایه هر سازمان است.', author: 'ناشناس' },
  { text: 'مشتریان راضی، بهترین تبلیغ‌کنندگان شما هستند.', author: 'ناشناس' },
  { text: 'نوآوری، تمایز بین رهبران و پیروان است.', author: 'استیو جابز' },
  { text: 'هر روز یک قدم جلوتر، یعنی نزدیک‌تر شدن به هدف.', author: 'ناشناس' },
  { text: 'کار بزرگ از مجموع کارهای کوچک به دست می‌آید.', author: 'ونسان ون گوگ' },
  { text: 'وقت طلاست. آن را هدر ندهید.', author: 'ناشناس' },
  { text: 'سختی‌ها پلی هستند به سوی موفقیت.', author: 'ناشناس' },
  { text: 'دانش قدرت است. آن را به اشتراک بگذارید.', author: 'فرانسیس بیکن' },
  { text: 'خلق ارزش برای مشتری، هدف اصلی کسب‌وکار است.', author: 'پیتر دراکر' },
  { text: 'صدها بار زمین خوردن، قبل از اولین قدم برداشتن طبیعی است.', author: 'ناشناس' },
  { text: 'فکرهای بزرگ از ذهن‌های آرام و صبور برمی‌آیند.', author: 'ناشناس' },
  { text: 'کمال نهایی از تکرار و بهبود مستمر حاصل می‌شود.', author: 'ناشناس' },
  { text: 'کار تیمی ضرب می‌کند، کار انفرادی جمع می‌کند.', author: 'ناشناس' },
  { text: 'به جای شکایت از باد، آسیاب خود را بساز.', author: 'مولانا' },
  { text: 'آنچه از عشق می‌دانم این است: که به نگاهت شفا یابد هر دردم.', author: 'حافظ' },
  { text: 'هر کسی که دست به کار بزرگ می‌زند، ابتدا تنهایی می‌کشد.', author: 'ناشناس' },
  { text: 'دنیا متعلق به کسانی است که به رویاهایشان ایمان دارند.', author: 'النور روزولت' },
  { text: 'هنر خوب بودن، با هرکسی خوب بودن نیست.', author: 'مولانا' },
  { text: 'سفر هزار فرسنگی با یک گام آغاز می‌شود.', author: 'لائوتسه' },
  { text: 'ما کاری را انجام نمی‌دهیم چون سخت است، بلکه چون ما را عقب نگه می‌دارد.', author: 'جیم جانسون' },
  { text: 'قیمت موفقیت، تلاش، سخت‌کوشی و عشق به کار است.', author: 'وینستون چرچیل' },
  { text: 'آینده متعلق به کسانی است که به زیبایی رؤیاهایشان ایمان دارند.', author: 'النور روزولت' },
  { text: 'اگر می‌خواهی چیزی را به خوبی انجام دهی، خودت آن را انجام بده.', author: 'ناشناس' },
  { text: 'اول کسی باش که خوبی می‌کنی، بعد خوب بودن را انتظار داشته باش.', author: 'ناشناس' },
]

// ──────────────── Time-based Greeting Config ────────────────

interface TimeConfig {
  greeting: string
  icon: React.ReactNode
  gradient: string
  darkGradient: string
  iconBg: string
  iconColor: string
}

function getTimeConfig(hour: number): TimeConfig {
  if (hour >= 5 && hour < 12) {
    return {
      greeting: 'صبح بخیر',
      icon: <Sun className="h-6 w-6" />,
      gradient: 'from-amber-400 via-orange-400 to-rose-400',
      darkGradient: 'dark:from-amber-600/30 dark:via-orange-600/20 dark:to-rose-600/30',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    }
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: 'عصر بخیر',
      icon: <CloudSun className="h-6 w-6" />,
      gradient: 'from-violet-400 via-purple-400 to-fuchsia-400',
      darkGradient: 'dark:from-violet-600/30 dark:via-purple-600/20 dark:to-fuchsia-600/30',
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
    }
  } else {
    return {
      greeting: 'شب بخیر',
      icon: <Moon className="h-6 w-6" />,
      gradient: 'from-indigo-500 via-violet-500 to-purple-500',
      darkGradient: 'dark:from-indigo-600/30 dark:via-violet-600/20 dark:to-purple-600/30',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    }
  }
}

// ──────────────── Quote Selection (changes daily) ────────────────

function getDailyQuote() {
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
  )
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length]
}

// ──────────────── Main Component ────────────────

export default function DashboardGreetingWidget() {
  const [now, setNow] = useState(() => Date.now())

  // Update time every second — no infinite loop because setState batches updates
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Derive values from `now` (only changes every second)
  const timeString = useMemo(() => {
    return new Date(now).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }, [now])

  const dateInfo = useMemo(() => {
    const d = new Date(now)
    return {
      fullDate: d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }),
      weekday: d.toLocaleDateString('fa-IR', { weekday: 'long' }),
      shortDate: d.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' }),
    }
  }, [now])

  const timeConfig = useMemo(() => getTimeConfig(new Date(now).getHours()), [now])

  // Daily quote — stable for the whole day
  const dailyQuote = useMemo(() => getDailyQuote(), [])

  // Quote animation state
  const [quoteVisible, setQuoteVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setQuoteVisible(true), 400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Card className="relative overflow-hidden border-0 shadow-sm card-elevated hover-lift transition-all duration-300 animate-in">
      {/* Background gradient layer */}
      <div
        className={`absolute inset-0 bg-gradient-to-l ${timeConfig.gradient} ${timeConfig.darkGradient} opacity-80 dark:opacity-100 pointer-events-none`}
      />

      {/* Decorative circles */}
      <div className="absolute top-[-20px] end-[-20px] w-32 h-32 rounded-full bg-white/10 dark:bg-white/5 pointer-events-none" />
      <div className="absolute bottom-[-30px] start-[-30px] w-40 h-40 rounded-full bg-white/5 dark:bg-white/3 pointer-events-none" />
      <div className="absolute top-1/2 end-1/4 w-20 h-20 rounded-full bg-white/5 dark:bg-white/3 pointer-events-none" />

      <CardContent className="relative z-10 p-5 md:p-6" dir="rtl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Right side: Greeting & Quote */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Greeting row */}
            <div className="flex items-center gap-3">
              <div
                className={`h-11 w-11 rounded-xl ${timeConfig.iconBg} flex items-center justify-center ${timeConfig.iconColor} shadow-sm`}
              >
                {timeConfig.icon}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  {timeConfig.greeting} 👋
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="font-medium">{dateInfo.weekday}</span>
                  <span className="text-border">|</span>
                  <span>{dateInfo.fullDate}</span>
                </div>
              </div>
            </div>

            {/* Quote */}
            <div
              className={`flex items-start gap-2.5 transition-all duration-500 ${
                quoteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <Quote className="h-4 w-4 mt-0.5 shrink-0 opacity-40" />
              <div className="min-w-0">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {dailyQuote.text}
                </p>
                <p className="text-xs text-muted-foreground mt-1">— {dailyQuote.author}</p>
              </div>
            </div>
          </div>

          {/* Left side: Clock & Decorative */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            {/* Digital Clock */}
            <div
              className="inline-flex items-center justify-center bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-sm"
              dir="ltr"
            >
              <Sparkles className="h-4 w-4 text-white/70 mr-2" />
              <span className="text-2xl font-bold text-foreground tabular-nums font-mono tracking-wide">
                {timeString}
              </span>
            </div>

            {/* Short date badge */}
            <div className="bg-white/15 dark:bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
              <span className="text-xs font-medium text-foreground/70">{dateInfo.shortDate}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
