'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Bot, Zap, Shield, Globe, BarChart3, MessageCircle, FileText,
  Users, Sparkles, Check, Star, ChevronDown,
  Menu, X, Moon, Sun, LayoutDashboard, Wand2, Cpu,
  Layers, Lock, Gauge, Rocket, Heart, Code, Workflow, Eye,
  ShoppingCart, Database, TrendingUp, Receipt,
} from 'lucide-react'
import Image from 'next/image'

// ─── Animated Section Wrapper ─────────────────────────────────────
function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const [ref, setRef] = useState<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref])

  return (
    <motion.div
      ref={setRef}
      initial={{ opacity: 0, y: 40 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Floating Particles Background ────────────────────────────────
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.3 + 0.1,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: `rgba(139, 92, 246, ${p.opacity})`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Gradient Orb ─────────────────────────────────────────────────
function GradientOrb({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-[80px] opacity-30 pointer-events-none ${className}`} aria-hidden="true" />
  )
}

// ─── Navbar ───────────────────────────────────────────────────────
function Navbar({ onEnter }: { onEnter: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { label: 'ویژگی‌ها', href: '#features' },
    { label: 'محصولات', href: '#products' },
    { label: 'درباره ما', href: '#about' },
    { label: 'قیمت‌گذاری', href: '#pricing' },
    { label: 'تماس', href: '#contact' },
  ]

  const scrollToSection = (href: string) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-border/30'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" dir="rtl">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight">Smart CMS</span>
            <span className="block text-[10px] text-muted-foreground -mt-0.5">سیستم مدیریت هوشمند</span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            onClick={onEnter}
            className="hidden sm:flex gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
          >
            <Rocket className="h-4 w-4" />
            ورود به پنل
          </Button>
          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/30 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1" dir="rtl">
              {navLinks.map(link => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="block w-full text-right px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
              <Button
                onClick={() => { onEnter(); setMobileOpen(false) }}
                className="w-full mt-2 gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
              >
                <Rocket className="h-4 w-4" />
                ورود به پنل
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────
function HeroSection({ onEnter }: { onEnter: () => void }) {
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 500], [0, 150])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <GradientOrb className="w-[600px] h-[600px] bg-violet-500 -top-40 -right-40" />
      <GradientOrb className="w-[500px] h-[500px] bg-fuchsia-500 -bottom-40 -left-40" />
      <GradientOrb className="w-[400px] h-[400px] bg-cyan-500 top-1/3 left-1/2 -translate-x-1/2 opacity-20" />
      <FloatingParticles />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center" dir="rtl">
          {/* Text Content */}
          <div className="text-center lg:text-right">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Badge className="mb-6 px-4 py-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/15 cursor-default">
                <Sparkles className="h-3.5 w-3.5 ml-1.5" />
                نسخه ۲.۰ — با هوش مصنوعی قدرتمند
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight"
            >
              <span className="block">مدیریت هوشمند</span>
              <span className="block mt-2 bg-gradient-to-l from-violet-600 via-purple-500 to-fuchsia-600 bg-clip-text text-transparent">
                محتوای شما
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 lg:max-w-none"
            >
              یک پلتفرم جامع و قدرتمند برای مدیریت محتوا، فروشگاه، CRM و حسابداری
              با بهره‌گیری از آخرین فناوری‌های هوش مصنوعی
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                onClick={onEnter}
                className="gap-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 active:scale-95 transition-all px-8 h-13 text-base font-semibold"
              >
                <Rocket className="h-5 w-5" />
                شروع رایگان
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
                className="gap-2.5 border-border/60 hover:bg-accent/50 hover:border-violet-500/30 transition-all px-8 h-13 text-base"
              >
                <Eye className="h-5 w-5" />
                مشاهده دمو
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-10 flex items-center gap-6 justify-center lg:justify-start"
            >
              <div className="flex -space-x-3 space-x-reverse">
                {['from-violet-400 to-purple-500', 'from-fuchsia-400 to-pink-500', 'from-cyan-400 to-teal-500', 'from-amber-400 to-orange-500'].map((g, i) => (
                  <div key={i} className={`w-9 h-9 rounded-full bg-gradient-to-br ${g} border-2 border-background flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                    {['A', 'M', 'S', 'R'][i]}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-muted-foreground">بیش از ۵,۰۰۰ کاربر فعال</span>
              </div>
            </motion.div>
          </div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/20 border border-border/30">
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent z-10 rounded-2xl" />
              <Image
                src="/hero-cms.png"
                alt="Smart CMS Dashboard"
                width={1344}
                height={768}
                className="w-full h-auto"
                priority
              />
            </div>
            {/* Floating cards around hero */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -right-4 glass-card rounded-xl p-3 shadow-xl hidden sm:block"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+۲۴۵%</p>
                  <p className="text-[10px] text-muted-foreground">رشد ترافیک</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-4 -left-4 glass-card rounded-xl p-3 shadow-xl hidden sm:block"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-fuchsia-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold">AI فعال</p>
                  <p className="text-[10px] text-muted-foreground">۹ مدل آماده</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
      >
        <span className="text-xs">اسکرول کنید</span>
        <ChevronDown className="h-4 w-4" />
      </motion.div>
    </section>
  )
}

// ─── Stats Section ────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { value: '۵,۰۰۰+', label: 'کاربر فعال', icon: Users, color: 'text-violet-500' },
    { value: '۲۵۰K+', label: 'محتوای تولید شده', icon: FileText, color: 'text-fuchsia-500' },
    { value: '۹۹.۹٪', label: 'آپتایم', icon: Shield, color: 'text-emerald-500' },
    { value: '۴.۹/۵', label: 'رضایت کاربران', icon: Star, color: 'text-amber-500' },
  ]

  return (
    <section className="relative py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
        <AnimatedSection>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.03, y: -4 }}
                className="relative group"
              >
                <Card className="relative overflow-hidden border-border/40 hover:border-violet-500/30 transition-all duration-300 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-violet-500/10">
                  <CardContent className="p-6 text-center">
                    <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform`} />
                    <div className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-l from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

// ─── Features Section ─────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    {
      icon: Wand2,
      title: 'دستیار هوشمند AI',
      desc: 'تولید محتوا، بهینه‌سازی SEO و تحلیل رقبا با هوش مصنوعی قدرتمند GLM-5',
      gradient: 'from-violet-500 to-purple-600',
      glow: 'group-hover:shadow-violet-500/20',
    },
    {
      icon: LayoutDashboard,
      title: 'داشبورد تحلیلی',
      desc: 'نمایشگرهای تعاملی با آمار لحظه‌ای و گزارش‌های پیشرفته',
      gradient: 'from-cyan-500 to-teal-600',
      glow: 'group-hover:shadow-cyan-500/20',
    },
    {
      icon: FileText,
      title: 'مدیریت محتوا',
      desc: 'ویرایشگر حرفه‌ای با پیش‌نمایش زنده، دسته‌بندی و برچسب‌گذاری هوشمند',
      gradient: 'from-fuchsia-500 to-pink-600',
      glow: 'group-hover:shadow-fuchsia-500/20',
    },
    {
      icon: ShoppingCart,
      title: 'فروشگاه آنلاین',
      desc: 'مدیریت محصولات، سفارشات و تخفیف‌ها با رابط کاربری مدرن',
      gradient: 'from-amber-500 to-orange-600',
      glow: 'group-hover:shadow-amber-500/20',
    },
    {
      icon: Users,
      title: 'مدیریت CRM',
      desc: 'ارتباط با مشتریان، پیگیری تعاملات و مدیریت مخاطبین',
      gradient: 'from-emerald-500 to-green-600',
      glow: 'group-hover:shadow-emerald-500/20',
    },
    {
      icon: Receipt,
      title: 'حسابداری مالی',
      desc: 'مدیریت فاکتورها، تراکنش‌ها، بودجه و گزارش‌های مالی',
      gradient: 'from-rose-500 to-red-600',
      glow: 'group-hover:shadow-rose-500/20',
    },
    {
      icon: Globe,
      title: 'همگام‌سازی وردپرس',
      desc: 'اتصال یک‌طرفه و دوطرفه با سایت‌های وردپرسی برای مدیریت یکپارچه',
      gradient: 'from-blue-500 to-indigo-600',
      glow: 'group-hover:shadow-blue-500/20',
    },
    {
      icon: Lock,
      title: 'امنیت پیشرفته',
      desc: 'احراز هویت چند مرحله‌ای، رمزگذاری داده‌ها و کنترل دسترسی نقش‌محور',
      gradient: 'from-violet-600 to-indigo-700',
      glow: 'group-hover:shadow-violet-600/20',
    },
    {
      icon: Gauge,
      title: 'عملکرد بالا',
      desc: 'بهینه‌سازی خودکار، کش هوشمند و لود سریع در کمتر از ۲۰۰ میلی‌ثانیه',
      gradient: 'from-teal-500 to-cyan-600',
      glow: 'group-hover:shadow-teal-500/20',
    },
  ]

  return (
    <section id="features" className="relative py-20 md:py-28">
      <GradientOrb className="w-[500px] h-[500px] bg-violet-500 top-20 -left-60 opacity-20" />
      <GradientOrb className="w-[400px] h-[400px] bg-fuchsia-500 bottom-20 -right-60 opacity-15" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir="rtl">
        <AnimatedSection className="text-center mb-16">
          <Badge className="mb-4 px-4 py-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
            <Layers className="h-3.5 w-3.5 ml-1.5" />
            ویژگی‌های کلیدی
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            همه چیز در <span className="bg-gradient-to-l from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">یک پلتفرم</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            با Smart CMS نیازی به ابزارهای مجزا ندارید. همه ابزارهای مورد نیاز شما در یک مکان
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {features.map((f, i) => (
            <AnimatedSection key={f.title} delay={i * 0.07}>
              <Card className={`group relative overflow-hidden border-border/40 hover:border-transparent transition-all duration-500 bg-card/50 backdrop-blur-sm hover:shadow-2xl ${f.glow} cursor-default h-full`}>
                <CardContent className="p-6 md:p-8">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <f.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </CardContent>
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/5 group-hover:to-fuchsia-500/5 transition-all duration-500 pointer-events-none rounded-xl" />
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Products Showcase Section ────────────────────────────────────
function ProductsSection() {
  const products = [
    {
      title: 'مدیریت محتوا',
      desc: 'ویرایشگر پیشرفته با پشتیبانی از Markdown، پیش‌نمایش زنده، مدیریت رسانه و ابزار SEO',
      image: '/dashboard-preview.png',
      gradient: 'from-violet-600/20 to-purple-600/10',
      features: ['ویرایشگر غنی', 'SEO هوشمند', 'مدیریت رسانه', 'نسخه‌برداری'],
    },
    {
      title: 'دستیار هوشمند AI',
      desc: '۹ مدل هوش مصنوعی برای تولید محتوا، تحلیل رقبا، پیشنهاد کلیدواژه و بهینه‌سازی خودکار',
      image: '/ai-feature.png',
      gradient: 'from-fuchsia-600/20 to-pink-600/10',
      features: ['تولید محتوا', 'تحلیل رقبا', 'کلیدواژه', 'استریم زنده'],
    },
  ]

  return (
    <section id="products" className="relative py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
        <AnimatedSection className="text-center mb-16">
          <Badge className="mb-4 px-4 py-1.5 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20">
            <Cpu className="h-3.5 w-3.5 ml-1.5" />
            محصولات ما
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            ابزارهایی برای <span className="bg-gradient-to-l from-fuchsia-600 to-rose-600 bg-clip-text text-transparent">موفقیت شما</span>
          </h2>
        </AnimatedSection>

        <div className="space-y-24">
          {products.map((product, idx) => (
            <AnimatedSection key={product.title} delay={0.1}>
              <div className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${idx % 2 === 1 ? 'lg:direction-ltr' : ''}`}>
                <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">{product.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">{product.desc}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {product.features.map(f => (
                      <div key={f} className="flex items-center gap-2.5 text-sm">
                        <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                          <Check className="h-3.5 w-3.5 text-violet-500" />
                        </div>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`relative rounded-2xl overflow-hidden shadow-2xl border border-border/30 ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${product.gradient} z-0`} />
                  <Image
                    src={product.image}
                    alt={product.title}
                    width={1344}
                    height={768}
                    className="relative z-10 w-full h-auto rounded-2xl"
                  />
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── AI Capabilities Section ──────────────────────────────────────
function AICapabilitiesSection() {
  const capabilities = [
    { icon: Wand2, title: 'تولید محتوا', desc: 'نوشتن مقالات، پست‌ها و محتوای بازاریابی' },
    { icon: BarChart3, title: 'تحلیل SEO', desc: 'تحلیل و بهینه‌سازی سئو صفحات شما' },
    { icon: Globe, title: 'تحلیل رقبا', desc: 'بررسی استراتژی رقبا و پیشنهاد بهبود' },
    { icon: MessageCircle, title: 'چت هوشمند', desc: 'گفتگوی طبیعی با پاسخ‌دهی لحظه‌ای' },
    { icon: Zap, title: 'کلیدواژه', desc: 'پیشنهاد کلیدواژه‌های طلایی برای محتوا' },
    { icon: Code, title: 'نشانه‌گذاری', desc: 'تولید خودکار Schema Markup برای سئو' },
    { icon: TrendingUp, title: 'لینک‌سازی', desc: 'پیشنهاد استراتژی بک‌لینک موثر' },
    { icon: Sparkles, title: 'بهینه‌سازی', desc: 'بهبود خودکار کیفیت و ساختار محتوا' },
    { icon: Workflow, title: 'جریان کار', desc: 'اتوماسیون فرآیندهای تکراری با AI' },
  ]

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-fuchsia-500/5 to-transparent pointer-events-none" />
      <GradientOrb className="w-[600px] h-[600px] bg-cyan-500 top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 opacity-15" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir="rtl">
        <AnimatedSection className="text-center mb-16">
          <Badge className="mb-4 px-4 py-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20">
            <Cpu className="h-3.5 w-3.5 ml-1.5" />
            هوش مصنوعی
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            قدرت <span className="bg-gradient-to-l from-cyan-600 to-violet-600 bg-clip-text text-transparent">هوش مصنوعی</span> در خدمت شما
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            با ۹ مدل AI مبتنی بر GLM-5، کارهای پیچیده را در چند ثانیه انجام دهید
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {capabilities.map((cap, i) => (
            <AnimatedSection key={cap.title} delay={i * 0.06}>
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                className="group flex items-start gap-4 p-5 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center shrink-0 group-hover:from-violet-500/20 group-hover:to-fuchsia-500/20 transition-all">
                  <cap.icon className="h-5 w-5 text-violet-500 group-hover:text-violet-400 transition-colors" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{cap.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cap.desc}</p>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials Section ─────────────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    {
      name: 'علی محمدی',
      role: 'مدیرعامل شرکت نوآوران',
      avatar: 'from-violet-400 to-purple-600',
      text: 'Smart CMS بهترین تصمیمی بود که برای کسب‌وکارمان گرفتیم. سرعت و دقت فوق‌العاده‌ای دارد.',
      rating: 5,
    },
    {
      name: 'سارا رضایی',
      role: 'مدیر محتوا، استارتاپ دیجیتال',
      avatar: 'from-fuchsia-400 to-pink-600',
      text: 'دستیار AI واقعاً کار ما را متحول کرد. تولید محتوا در عرض چند دقیقه انجام می‌شود.',
      rating: 5,
    },
    {
      name: 'محمد حسینی',
      role: 'توسعه‌دهنده فول‌استک',
      avatar: 'from-cyan-400 to-teal-600',
      text: 'معماری تمیز و API قدرتمند. ادغام با سیستم‌های موجود خیلی ساده بود.',
      rating: 5,
    },
  ]

  return (
    <section id="about" className="relative py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
        <AnimatedSection className="text-center mb-16">
          <Badge className="mb-4 px-4 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            <Heart className="h-3.5 w-3.5 ml-1.5" />
            نظرات کاربران
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            کاربران ما <span className="bg-gradient-to-l from-amber-600 to-orange-600 bg-clip-text text-transparent">چه می‌گویند</span>
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <AnimatedSection key={t.name} delay={i * 0.12}>
              <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-500/20 transition-all duration-300 h-full">
                <CardContent className="p-6 md:p-8">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground mb-6">{t.text}</p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatar} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing Section ──────────────────────────────────────────────
function PricingSection() {
  const plans = [
    {
      name: 'شروع',
      price: 'رایگان',
      period: 'همیشه',
      desc: 'مناسب برای شروع و پروژه‌های شخصی',
      features: ['تا ۳ کاربر', '۱ گیگابایت فضای ذخیره‌سازی', 'دستیار AI محدود', 'پشتیبانی ایمیل', 'تم پایه'],
      gradient: 'from-slate-500 to-slate-600',
      buttonClass: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100',
      popular: false,
    },
    {
      name: 'حرفه‌ای',
      price: '۴۹۰,۰۰۰',
      period: 'تومان/ماهانه',
      desc: 'مناسب برای تیم‌های در حال رشد',
      features: ['تا ۲۵ کاربر', '۵۰ گیگابایت فضای ذخیره‌سازی', 'دستیار AI نامحدود', 'پشتیبانی ۲۴/۷', 'همه تم‌ها', 'API دسترسی', 'اتصال وردپرس'],
      gradient: 'from-violet-600 to-fuchsia-600',
      buttonClass: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/25',
      popular: true,
    },
    {
      name: 'سازمانی',
      price: 'تماس بگیرید',
      period: '',
      desc: 'مناسب برای سازمان‌های بزرگ',
      features: ['کاربران نامحدود', 'فضای ذخیره‌سازی نامحدود', 'AI پیشرفته + مدل اختصاصی', 'پشتیبانی اختصاصی', 'تم سفارشی', 'API پیشرفته', 'SSO و SAML', 'SLA ۹۹.۹٪'],
      gradient: 'from-amber-500 to-orange-600',
      buttonClass: 'bg-amber-500 text-white hover:bg-amber-600',
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="relative py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/3 to-transparent pointer-events-none" />
      <GradientOrb className="w-[500px] h-[500px] bg-fuchsia-500 top-1/3 -right-60 opacity-15" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir="rtl">
        <AnimatedSection className="text-center mb-16">
          <Badge className="mb-4 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            <Database className="h-3.5 w-3.5 ml-1.5" />
            قیمت‌گذاری
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            طرح مناسب <span className="bg-gradient-to-l from-emerald-600 to-teal-600 bg-clip-text text-transparent">خود را انتخاب کنید</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            بدون هزینه پنهان. ارتقا یا کاهش طرح در هر زمان.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, i) => (
            <AnimatedSection key={plan.name} delay={i * 0.1}>
              <Card className={`relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-300 h-full flex flex-col ${plan.popular ? 'border-violet-500/40 shadow-xl shadow-violet-500/10 scale-[1.02] lg:scale-105' : 'hover:border-border/60 hover:shadow-lg'}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 left-0">
                    <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-semibold py-1.5 text-center">
                      محبوب‌ترین
                    </div>
                  </div>
                )}
                <CardContent className="p-6 md:p-8 flex flex-col flex-1 pt-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

                  <div className="mb-6">
                    <span className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground mr-2">/ {plan.period}</span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 text-violet-500" />
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button className={`w-full h-11 font-semibold ${plan.buttonClass} transition-all`}>
                    {plan.name === 'سازمانی' ? 'تماس با فروش' : 'شروع کنید'}
                  </Button>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Section ──────────────────────────────────────────────────
function CTASection({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
        <AnimatedSection>
          <div className="relative rounded-3xl overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1),transparent_40%)]" />

            {/* Pattern overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                backgroundSize: '24px 24px',
              }}
            />

            <div className="relative z-10 px-6 py-16 md:px-16 md:py-20 text-center">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/30">
                  <Bot className="h-8 w-8 text-white" />
                </div>
              </motion.div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                آماده شروع هستید؟
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                همین الان به هزاران کاربر حرفه‌ای بپیوندید و مدیریت کسب‌وکار خود را متحول کنید
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={onEnter}
                  className="gap-2 bg-white text-violet-700 hover:bg-white/90 shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all px-8 h-13 text-base font-bold"
                >
                  <Rocket className="h-5 w-5" />
                  شروع رایگان
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-white/30 text-white hover:bg-white/10 transition-all px-8 h-13 text-base"
                >
                  <MessageCircle className="h-5 w-5" />
                  صحبت با مشاور
                </Button>
              </div>

              <p className="mt-6 text-sm text-white/60">
                بدون نیاز به کارت بانکی • شروع فوری • لغو در هر زمان
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────
function Footer() {
  const footerLinks = {
    'محصول': ['ویژگی‌ها', 'قیمت‌گذاری', 'به‌روزرسانی‌ها', 'نقشه راه', 'API'],
    'شرکت': ['درباره ما', 'بلاگ', 'فرصت‌های شغلی', 'تماس', 'شرکا'],
    'منابع': ['مستندات', 'راهنما', 'جامعه', 'پشتیبانی', 'وضعیت سرور'],
    'قانونی': ['حریم خصوصی', 'شرایط استفاده', 'Cookie', 'مجوزها'],
  }

  return (
    <footer id="contact" className="relative border-t border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16" dir="rtl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <Bot className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm">Smart CMS</span>
                <span className="block text-[10px] text-muted-foreground -mt-0.5">سیستم مدیریت هوشمند</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              پلتفرم جامع مدیریت محتوا با هوش مصنوعی
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors animated-underline">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © ۱۴۰۴ Smart CMS. تمامی حقوق محفوظ است.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">همه سرورها فعال</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Main Landing Page Component ──────────────────────────────────
export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar onEnter={onEnter} />
      <HeroSection onEnter={onEnter} />
      <StatsSection />
      <FeaturesSection />
      <ProductsSection />
      <AICapabilitiesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection onEnter={onEnter} />
      <Footer />
    </div>
  )
}
