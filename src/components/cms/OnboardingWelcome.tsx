'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bot, Sparkles, ChevronLeft, ChevronRight, BarChart3, MessageCircle, ShoppingBag, TrendingUp } from 'lucide-react'

interface OnboardingWelcomeProps {
  onComplete: () => void
}

const TOTAL_STEPS = 4

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 bg-gradient-to-r from-violet-500 to-purple-500'
              : 'w-2 bg-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

export default function OnboardingWelcome({ onComplete }: OnboardingWelcomeProps) {
  const [step, setStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const goToStep = (newStep: number) => {
    if (newStep < 0 || newStep >= TOTAL_STEPS || isAnimating) return
    setIsAnimating(true)
    setTimeout(() => {
      setStep(newStep)
      setIsAnimating(false)
    }, 200)
  }

  const handleComplete = () => {
    localStorage.setItem('onboarding-completed', 'true')
    onComplete()
  }

  const handleSkip = () => {
    localStorage.setItem('onboarding-completed', 'true')
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-lg mx-4 glass-card card-elevated rounded-2xl p-6 sm:p-8 animate-in slide-in-from-bottom-4 duration-500"
        dir="rtl"
      >
        {/* Close / Skip button (top-left for RTL) */}
        <button
          onClick={handleSkip}
          className="absolute top-4 left-4 text-xs text-muted-foreground hover:text-foreground transition-colors animated-underline cursor-pointer"
        >
          رد کردن
        </button>

        {/* Step Content */}
        <div
          className={`min-h-[320px] sm:min-h-[340px] flex flex-col items-center justify-center text-center transition-all duration-300 ${
            isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* ─── Step 1: Welcome ─── */}
          {step === 0 && (
            <div className="space-y-6 stagger-children">
              <div className="flex items-center justify-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gradient-violet">
                  به Smart CMS خوش آمدید
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  سیستم مدیریت محتوای هوشمند نسخه ۲.۰
                </p>
              </div>
              <p className="text-xs text-muted-foreground/60 max-w-xs">
                با استفاده از هوش مصنوعی و ابزارهای پیشرفته، مدیریت محتوای خود را به سطح جدیدی ببرید.
              </p>
            </div>
          )}

          {/* ─── Step 2: Features ─── */}
          {step === 1 && (
            <div className="w-full space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gradient-cyan">
                  ویژگی‌های کلیدی
                </h2>
                <p className="text-sm text-muted-foreground">
                  ابزارهای قدرتمند برای مدیریت حرفه‌ای
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 stagger-children">
                {[
                  { icon: <BarChart3 className="h-5 w-5" />, label: 'داشبورد تحلیلی هوشمند', gradient: 'from-violet-500 to-purple-500' },
                  { icon: <Bot className="h-5 w-5" />, label: 'دستیار AI متصل', gradient: 'from-cyan-500 to-blue-500' },
                  { icon: <ShoppingBag className="h-5 w-5" />, label: 'مدیریت فروشگاه', gradient: 'from-emerald-500 to-green-500' },
                  { icon: <TrendingUp className="h-5 w-5" />, label: 'گزارشات پیشرفته', gradient: 'from-amber-500 to-orange-500' },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-muted/30 border border-border/40"
                  >
                    <span className={`flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-md`}>
                      {feature.icon}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-foreground/80">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Step 3: Quick Tips ─── */}
          {step === 2 && (
            <div className="w-full space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gradient-emerald">
                  نکات سریع
                </h2>
                <p className="text-sm text-muted-foreground">
                  با این میانبرها سریع‌تر کار کنید
                </p>
              </div>
              <div className="space-y-3 stagger-children">
                {[
                  { text: 'از ⌘K برای جستجوی سریع استفاده کنید', gradient: 'from-violet-500 to-purple-500' },
                  { text: 'از کلیدهای میانبر ⌘1-6 برای دسترسی سریع استفاده کنید', gradient: 'from-cyan-500 to-blue-500' },
                  { text: 'دستیار AI همیشه در دسترس شماست', gradient: 'from-emerald-500 to-green-500' },
                ].map((tip) => (
                  <div
                    key={tip.text}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/40 text-right"
                  >
                    <span className={`shrink-0 mt-0.5 h-2 w-2 rounded-full bg-gradient-to-r ${tip.gradient}`} />
                    <span className="text-sm text-foreground/80 leading-relaxed">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Step 4: Get Started ─── */}
          {step === 3 && (
            <div className="space-y-6 stagger-children">
              <div className="flex items-center justify-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Bot className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gradient-amber">
                  شروع کنید!
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                  آماده‌اید تا قدرت Smart CMS را تجربه کنید؟
                </p>
              </div>
              <Button
                onClick={handleComplete}
                className="btn-primary-gradient cta-pulse h-12 px-8 text-base font-semibold rounded-xl"
              >
                ورود به داشبورد
              </Button>
              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors animated-underline cursor-pointer"
              >
                رد کردن
              </button>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="mt-6 flex items-center justify-between gap-4">
          {/* Previous Button (steps 1-3) */}
          {step > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep(step - 1)}
              className="gap-1.5 text-sm"
            >
              <ChevronRight className="h-4 w-4" />
              قبلی
            </Button>
          ) : (
            <div className="w-16" />
          )}

          {/* Step Dots */}
          <StepDots current={step} total={TOTAL_STEPS} />

          {/* Next Button (steps 0-2) */}
          {step < TOTAL_STEPS - 1 ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => goToStep(step + 1)}
              className="btn-primary-gradient gap-1.5 text-sm"
            >
              بعدی
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </div>
    </div>
  )
}
