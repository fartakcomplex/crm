'use client'

import { useState, useCallback } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Bot, Eye, EyeOff, Mail, Lock, User, ArrowLeft, Loader2, Github, Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'

// ─── Zod Schemas ──────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().min(1, 'ایمیل الزامی است').email('فرمت ایمیل نامعتبر است'),
  password: z.string().min(1, 'رمز عبور الزامی است').min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
})

const registerSchema = z.object({
  name: z.string().min(1, 'نام الزامی است').min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  email: z.string().min(1, 'ایمیل الزامی است').email('فرمت ایمیل نامعتبر است'),
  password: z.string().min(1, 'رمز عبور الزامی است').min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  confirmPassword: z.string().min(1, 'تکرار رمز عبور الزامی است'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'رمز عبور و تکرار آن یکسان نیستند',
  path: ['confirmPassword'],
})

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

interface FormErrors {
  email?: string
  password?: string
  name?: string
  confirmPassword?: string
  _form?: string
}

// ─── Props ───────────────────────────────────────────────────────────

interface LoginPageProps {
  onLogin: () => void
}

// ─── Component ───────────────────────────────────────────────────────

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [rememberMe, setRememberMe] = useState(false)
  const { theme, setTheme } = useTheme()

  // Form state
  const [loginData, setLoginData] = useState<LoginFormData>({ email: '', password: '' })
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    name: '', email: '', password: '', confirmPassword: '',
  })

  const validateLogin = useCallback((): boolean => {
    const result = loginSchema.safeParse(loginData)
    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }, [loginData])

  const validateRegister = useCallback((): boolean => {
    const result = registerSchema.safeParse(registerData)
    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }, [registerData])

  const handleLoginSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateLogin()) return
    setIsLoading(true)
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1200))
    setIsLoading(false)
    onLogin()
  }, [validateLogin, onLogin])

  const handleRegisterSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateRegister()) return
    setIsLoading(true)
    // Simulate register delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    onLogin()
  }, [validateRegister, onLogin])

  const toggleMode = useCallback(() => {
    setIsRegister(prev => !prev)
    setErrors({})
  }, [])

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden" dir="rtl">
      {/* ─── Animated Gradient Background ─── */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 dark:from-violet-950 dark:via-purple-950 dark:to-fuchsia-950" />
        {/* Floating gradient orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-400/30 to-purple-400/20 dark:from-violet-600/20 dark:to-purple-600/10 blur-3xl gradient-animate" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-fuchsia-400/25 to-pink-400/15 dark:from-fuchsia-600/15 dark:to-pink-600/10 blur-3xl gradient-animate" style={{ animationDelay: '-1.5s' }} />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-purple-300/20 to-violet-300/10 dark:from-purple-700/10 dark:to-violet-700/5 blur-3xl gradient-animate" style={{ animationDelay: '-3s' }} />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
      </div>

      {/* ─── Theme Toggle (top-left) ─── */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute top-6 left-6 z-10 flex items-center justify-center w-10 h-10 rounded-xl glass-card hover:bg-accent/80 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
        aria-label="تغییر تم"
      >
        <span className="text-violet-600 dark:text-violet-400">
          {theme === 'dark' ? '☀️' : '🌙'}
        </span>
      </button>

      {/* ─── Login Card ─── */}
      <div
        className="relative w-full max-w-[440px] mx-4 page-enter"
        style={{ animation: 'fadeIn 0.5s ease-out, slideUp 0.6s ease-out' }}
      >
        {/* Glass card wrapper */}
        <div className="rounded-2xl glass-card card-elevated card-gradient-border hover-lift shadow-2xl shadow-violet-500/10 dark:shadow-violet-500/5 p-8 md:p-10 relative overflow-hidden">
          {/* Decorative gradient accent line at top */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

          {/* Subtle corner glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-violet-500/10 to-purple-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* ─── Logo / Header ─── */}
          <div className="flex flex-col items-center mb-8">
            <div className="float-animation mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow">
                <Bot className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gradient-violet mb-1">
              {isRegister ? 'ثبت‌نام' : 'ورود به سیستم'}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              مدیریت هوشمند محتوا
            </p>
          </div>

          {/* ─── Form ─── */}
          {isRegister ? (
            /* ─── Register Form ─── */
            <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-name" className="text-sm font-medium">
                  نام کامل
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="نام و نام خانوادگی"
                    value={registerData.name}
                    onChange={e => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                    className={`pr-9 h-11 bg-background/60 border-border/60 focus:border-violet-400 focus:ring-violet-400/20 transition-all ${errors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                    autoComplete="name"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1 animate-in">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-sm font-medium">
                  ایمیل
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="example@email.com"
                    value={registerData.email}
                    onChange={e => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    className={`pr-9 h-11 bg-background/60 border-border/60 focus:border-violet-400 focus:ring-violet-400/20 transition-all ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                    autoComplete="email"
                    dir="ltr"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 animate-in">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-sm font-medium">
                  رمز عبور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="حداقل ۶ کاراکتر"
                    value={registerData.password}
                    onChange={e => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    className={`pr-9 pl-11 h-11 bg-background/60 border-border/60 focus:border-violet-400 focus:ring-violet-400/20 transition-all ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                    autoComplete="new-password"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 animate-in">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm-password" className="text-sm font-medium">
                  تکرار رمز عبور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="تکرار رمز عبور"
                    value={registerData.confirmPassword}
                    onChange={e => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`pr-9 pl-11 h-11 bg-background/60 border-border/60 focus:border-violet-400 focus:ring-violet-400/20 transition-all ${errors.confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                    autoComplete="new-password"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 animate-in">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Form error */}
              {errors._form && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 px-4 py-2.5">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors._form}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 btn-primary-gradient text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال ثبت‌نام...
                  </span>
                ) : (
                  'ثبت‌نام'
                )}
              </Button>
            </form>
          ) : (
            /* ─── Login Form ─── */
            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-sm font-medium">
                  ایمیل
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="example@email.com"
                    value={loginData.email}
                    onChange={e => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className={`pr-9 h-11 bg-background/60 border-border/60 focus:border-violet-400 focus:ring-violet-400/20 transition-all ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                    autoComplete="email"
                    dir="ltr"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 animate-in">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-sm font-medium">
                  رمز عبور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="رمز عبور خود را وارد کنید"
                    value={loginData.password}
                    onChange={e => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className={`pr-9 pl-11 h-11 bg-background/60 border-border/60 focus:border-violet-400 focus:ring-violet-400/20 transition-all ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                    autoComplete="current-password"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 animate-in">{errors.password}</p>
                )}
              </div>

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={checked => setRememberMe(checked === true)}
                    className="data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer select-none"
                  >
                    مرا به خاطر بسپار
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 transition-colors cursor-pointer hover:underline"
                >
                  فراموشی رمز عبور؟
                </button>
              </div>

              {/* Form error */}
              {errors._form && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 px-4 py-2.5">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors._form}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 btn-primary-gradient text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال ورود...
                  </span>
                ) : (
                  'ورود'
                )}
              </Button>
            </form>
          )}

          {/* ─── Divider ─── */}
          <div className="relative my-6">
            <Separator className="bg-border/60" />
            <span className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm px-3 text-xs text-muted-foreground rounded-full">
              یا
            </span>
          </div>

          {/* ─── Social Login Buttons ─── */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 h-10 rounded-xl border border-border/60 bg-background/40 hover:bg-accent/60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm font-medium shine-effect"
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>ورود با گوگل</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 h-10 rounded-xl border border-border/60 bg-background/40 hover:bg-accent/60 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm font-medium shine-effect"
            >
              <Github className="h-4.5 w-4.5" />
              <span>ورود با گیت‌هاب</span>
            </button>
          </div>

          {/* ─── Toggle Login / Register ─── */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isRegister ? 'قبلاً ثبت‌نام کرده‌اید؟' : 'حساب ندارید؟'}
              {' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 font-semibold transition-colors cursor-pointer hover:underline inline-flex items-center gap-1"
              >
                {isRegister ? 'ورود به سیستم' : 'ثبت‌نام'}
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            </p>
          </div>

          {/* ─── Footer branding ─── */}
          <div className="mt-8 pt-4 border-t border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground/60">
              Smart CMS — مدیریت هوشمند محتوا
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
