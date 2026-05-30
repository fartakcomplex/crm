'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Bot,
  Palette,
  Rocket,
  Check,
  X,
  LayoutDashboard,
  FileText,
  ImageIcon,
  Users,
  UserCog,
  FolderKanban,
  Settings,
  ShoppingBag,
  Receipt,
  Wallet,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  open: boolean
  onClose: () => void
}

// ─── Sidebar category data for Step 2 ────────────────────────────────────

const sidebarCategories = [
  {
    id: 'main',
    label: 'عام',
    description: 'داشبورد و نمای کلی سیستم',
    icon: LayoutDashboard,
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    id: 'content',
    label: 'مدیریت محتوا',
    description: 'محتوا، رسانه، نظرات و وردپرس',
    icon: FileText,
    gradient: 'from-cyan-500 to-teal-500',
  },
  {
    id: 'people',
    label: 'افراد',
    description: 'کاربران، تیم و مشتریان',
    icon: Users,
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    id: 'workspace',
    label: 'فضای کار',
    description: 'پروژه‌ها، وظایف و تقویم',
    icon: FolderKanban,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'tools',
    label: 'ابزارهای هوشمند',
    description: 'دستیار AI، استودیو AI و گزارش‌ها',
    icon: Bot,
    gradient: 'from-fuchsia-500 to-pink-500',
  },
  {
    id: 'system',
    label: 'سیستم',
    description: 'تنظیمات، فعالیت‌ها و اعلان‌ها',
    icon: Settings,
    gradient: 'from-slate-500 to-gray-500',
  },
  {
    id: 'business',
    label: 'کسب‌وکار',
    description: 'فروشگاه و مدیریت ارتباط با مشتری',
    icon: ShoppingBag,
    gradient: 'from-rose-500 to-red-500',
  },
  {
    id: 'finance',
    label: 'مالی و حسابداری',
    description: 'حسابداری، انبارداری و امور مالی',
    icon: Wallet,
    gradient: 'from-teal-500 to-cyan-500',
  },
]

// ─── AI Tools data for Step 3 ───────────────────────────────────────────

const aiTools = [
  {
    title: 'استودیو AI',
    subtitle: 'AI Studio',
    description: 'بیش از ۱۰۰ ابزار هوش مصنوعی برای تولید محتوا، ویرایش تصاویر، سئو و...',
    icon: Palette,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    badge: '۱۰۰+ ابزار',
  },
  {
    title: 'دستیار AI',
    subtitle: 'AI Assistant',
    description: 'چت هوشمند با دستیار مجهز به AI برای پاسخگویی به سوالات و حل مشکلات',
    icon: Bot,
    gradient: 'from-cyan-500 via-teal-500 to-emerald-500',
    badge: 'چت هوشمند',
  },
  {
    title: 'AI سریع',
    subtitle: 'Quick AI',
    description: 'ویجت شناور برای دسترسی سریع به امکانات AI بدون ترک صفحه فعلی',
    icon: Sparkles,
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    badge: 'ویجت شناور',
  },
]

// ─── Step labels ────────────────────────────────────────────────────────

const stepLabels = ['خوش‌آمدید', 'ناوبری', 'ابزارهای AI', 'شروع']

// ─── Animation keyframes ─────────────────────────────────────────────────

const stepAnimationClass = 'animate-in fade-in slide-in-from-bottom-4 duration-500'

// ─── Component ───────────────────────────────────────────────────────────

export default function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [stepKey, setStepKey] = useState(0)

  // Reset stepKey when step changes to re-trigger entrance animation
  const goToStep = useCallback((step: number) => {
    setCurrentStep(step)
    setStepKey(prev => prev + 1)
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      goToStep(currentStep + 1)
    } else {
      // Final step — close
      if (dontShowAgain) {
        localStorage.setItem('cms_onboarding_done', 'true')
      }
      onClose()
    }
  }, [currentStep, dontShowAgain, goToStep, onClose])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1)
    }
  }, [currentStep, goToStep])

  const handleSkip = useCallback(() => {
    onClose()
  }, [onClose])

  const handleFinish = useCallback(() => {
    if (dontShowAgain) {
      localStorage.setItem('cms_onboarding_done', 'true')
    }
    onClose()
  }, [dontShowAgain, onClose])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // no-op
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent
        className="sm:max-w-[560px] glass-card card-elevated p-0 overflow-hidden"
        dir="rtl"
        onPointerDownOutside={(e) => {
          try { e.preventDefault() } catch { /* ignore */ }
        }}
        onEscapeKeyDown={(e) => {
          try {
            e.preventDefault()
          } catch { /* ignore */ }
          onClose()
        }}
      >
        {/* ─── Header with step progress ─── */}
        <div className="relative px-6 pt-6 pb-4">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent/60 transition-colors cursor-pointer"
            aria-label="بستن"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Step indicator dots */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      i === currentStep
                        ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 scale-110'
                        : i < currentStep
                        ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={`text-[10px] transition-colors duration-300 ${
                    i === currentStep ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  }`}>
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`w-6 h-0.5 rounded-full transition-colors duration-300 ${
                    i < currentStep ? 'bg-violet-400' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step title */}
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-bold">
              {currentStep === 0 && 'به Smart CMS خوش آمدید! 🎉'}
              {currentStep === 1 && 'آشنایی با ناوبری سیستم'}
              {currentStep === 2 && 'ابزارهای هوش مصنوعی'}
              {currentStep === 3 && 'آماده شروع هستید!'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {currentStep === 0 && 'سیستم مدیریت محتوای هوشمند نسخه ۲.۰'}
              {currentStep === 1 && 'با بخش‌های مختلف سیستم آشنا شوید'}
              {currentStep === 2 && 'قدرت هوش مصنوعی را در اختیار دارید'}
              {currentStep === 3 && 'هرچه آماده‌تر هستید، شروع کنید!'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ─── Step Content ─── */}
        <div className="px-6 pb-4 min-h-[300px] flex items-start">
          <div key={stepKey} className={`w-full ${stepAnimationClass}`}>
            {/* Step 1: Welcome */}
            {currentStep === 0 && (
              <div className="space-y-5 text-center">
                {/* Hero icon */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-violet-500/25">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                </div>

                <p className="text-sm leading-7 text-muted-foreground max-w-[400px] mx-auto">
                  به <span className="font-semibold text-foreground">Smart CMS</span> خوش آمدید!
                  پلتفرم مدیریت محتوای هوشمند با بیش از ۲۰ ماژول قدرتمند و ابزارهای پیشرفته هوش مصنوعی.
                </p>

                {/* Feature highlights */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: LayoutDashboard, label: 'داشبورد هوشمند', gradient: 'from-violet-500 to-purple-500' },
                    { icon: Bot, label: 'دستیار AI', gradient: 'from-cyan-500 to-teal-500' },
                    { icon: Rocket, label: '۲۰+ ماژول', gradient: 'from-amber-500 to-orange-500' },
                  ].map((feature, i) => (
                    <div
                      key={feature.label}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50"
                      style={{ animationDelay: `${i * 100 + 200}ms` }}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-sm`}>
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-center">{feature.label}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground/70">
                  این راهنمای سریع را دنبال کنید تا با امکانات اصلی آشنا شوید.
                </p>
              </div>
            )}

            {/* Step 2: Navigation */}
            {currentStep === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  سیستم دارای ۷ دسته‌بندی اصلی در نوار کناری است:
                </p>
                <div className="grid grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto cms-scrollbar">
                  {sidebarCategories.map((cat, i) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40 hover:bg-muted/70 transition-colors"
                      style={{ animationDelay: `${i * 80 + 100}ms` }}
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-white shadow-sm shrink-0`}>
                        <cat.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{cat.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{cat.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: AI Tools */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  سه ابزار قدرتمند هوش مصنوعی در اختیار شماست:
                </p>
                <div className="space-y-3">
                  {aiTools.map((tool, i) => (
                    <div
                      key={tool.subtitle}
                      className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/40 hover:bg-muted/70 transition-colors"
                      style={{ animationDelay: `${i * 120 + 100}ms` }}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-md shrink-0`}>
                        <tool.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold">{tool.title}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 font-medium">
                            {tool.badge}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-5">{tool.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick tip */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    نکته: ویجت <strong>AI سریع</strong> همیشه در گوشه صفحه در دسترس است!
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Get Started */}
            {currentStep === 3 && (
              <div className="space-y-5 text-center">
                {/* Rocket icon */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                    <Rocket className="h-10 w-10 text-white" />
                  </div>
                </div>

                <p className="text-sm leading-7 text-muted-foreground max-w-[400px] mx-auto">
                  شما اکنون با امکانات اصلی Smart CMS آشنا هستید.
                  داشبورد شما آماده استفاده است!
                </p>

                {/* Quick tips */}
                <div className="space-y-2 text-right max-w-[380px] mx-auto">
                  {[
                    { icon: Navigation, text: 'از نوار کناری برای دسترسی به بخش‌ها استفاده کنید' },
                    { icon: Bot, text: 'دستیار AI همیشه آماده پاسخگویی به سوالات شماست' },
                    { icon: Sparkles, text: 'با کلید ⌘K جستجوی سریع را باز کنید' },
                  ].map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/30"
                      style={{ animationDelay: `${i * 100 + 150}ms` }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 dark:from-violet-500/20 dark:to-fuchsia-500/20 flex items-center justify-center shrink-0">
                        <tip.icon className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                      </div>
                      <p className="text-xs text-muted-foreground">{tip.text}</p>
                    </div>
                  ))}
                </div>

                {/* Don't show again checkbox */}
                <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={dontShowAgain}
                    onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                    className="data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                  />
                  <span className="text-xs text-muted-foreground">در دفعات بعدی نمایش نده</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* ─── Footer with navigation buttons ─── */}
        <DialogFooter className="px-6 pb-6 pt-2 flex items-center justify-between sm:justify-between gap-3">
          {/* Left side: Skip or empty */}
          <div>
            {currentStep < 3 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                رد شدن
                <X className="h-3 w-3" />
              </Button>
            ) : (
              <div />
            )}
          </div>

          {/* Right side: Prev + Next */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="text-xs gap-1 hover:bg-accent/60"
              >
                <ChevronRight className="h-3.5 w-3.5" />
                قبلی
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                size="sm"
                onClick={handleNext}
                className="text-xs gap-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-sm hover:shadow-md"
              >
                بعدی
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinish}
                className="text-xs gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm hover:shadow-md"
              >
                <Rocket className="h-3.5 w-3.5" />
                شروع کنید!
              </Button>
            )}
          </div>
        </DialogFooter>

        {/* ─── Progress bar at bottom ─── */}
        <div className="h-1 bg-muted/50">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((currentStep + 1) / 4) * 100}%` }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
