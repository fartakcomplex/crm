import {
  FileText, ShoppingBag, FileSearch, Languages, RefreshCw, Megaphone,
  Quote, Expand, Palette, Camera, Image, LayoutTemplate, BarChart2, Tag,
  Frame, Scissors, Layers, ArrowLeftRight, Presentation, Grid3X3,
  Mic, Subtitles, Tv, Clapperboard, Play, Podcast, Clock, Eye,
  GitCompareArrows, Target, Users, CalendarDays, ThumbsUp, Timer,
  Medal, Lightbulb, TrendingUp, Repeat, Compass, Bell, Zap, Tags,
  Star, Shield, DollarSign, ListChecks, MessageCircle, Sparkle,
  ArrowUpDown, BadgeCheck, Award, BookOpen, Heart, Radio, Volume2,
  Brain, Settings2, Layers3, FileStack, Type, Stamp, FileCheck,
  FileMinus, History, CalendarClock, SplitSquareHorizontal,
  GraduationCap, Cpu, Share2, PenLine, Mail, Hash, Video,
  BarChart3, Wand2, Download, Film, Code, Link, Music, Flame, Check, Workflow,
} from 'lucide-react'
import React from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIFeature {
  id: string
  title: string
  description: string
  icon: React.ElementType
  category: string
  gradient: string
  iconBg: string
  hasBackend: boolean
  inputFields: {
    name: string
    label: string
    type: 'text' | 'textarea' | 'select'
    placeholder?: string
    options?: string[]
  }[]
  outputType: 'text' | 'image' | 'audio' | 'video'
}

export interface Category {
  id: string
  name: string
  icon: React.ElementType
  gradient: string
  glowClass: string
}

// ─── 8 Categories ─────────────────────────────────────────────────────────

export const categories: Category[] = [
  { id: 'text-gen', name: 'تولید متن هوشمند', icon: FileText, gradient: 'from-violet-500 to-purple-600', glowClass: 'card-glow-violet' },
  { id: 'image-gen', name: 'تولید تصویر هوشمند', icon: Image, gradient: 'from-cyan-500 to-teal-600', glowClass: 'card-glow-cyan' },
  { id: 'video-gen', name: 'تولید ویدئو', icon: Video, gradient: 'from-rose-500 to-pink-600', glowClass: 'card-glow-rose' },
  { id: 'seo-analytics', name: 'سئو و تحلیل', icon: BarChart3, gradient: 'from-emerald-500 to-green-600', glowClass: 'card-glow-emerald' },
  { id: 'social-media', name: 'شبکه‌های اجتماعی', icon: Share2, gradient: 'from-amber-500 to-orange-600', glowClass: 'card-glow-amber' },
  { id: 'e-commerce', name: 'محصولات و فروشگاه', icon: ShoppingBag, gradient: 'from-fuchsia-500 to-violet-600', glowClass: 'card-glow-violet' },
  { id: 'audio', name: 'صدا و موسیقی', icon: Music, gradient: 'from-sky-500 to-blue-600', glowClass: 'card-glow-blue' },
  { id: 'automation', name: 'اتوماسیون و جریان کار', icon: Layers, gradient: 'from-teal-500 to-cyan-600', glowClass: 'card-glow-cyan' },
]

// ─── Output Type Labels ─────────────────────────────────────────────────────────

export const outputTypeLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  text: { label: 'متن', icon: FileText, color: 'text-violet-600 dark:text-violet-300' },
  image: { label: 'تصویر', icon: Camera, color: 'text-cyan-600 dark:text-cyan-300' },
  audio: { label: 'صدا', icon: Volume2, color: 'text-emerald-600 dark:text-emerald-300' },
  video: { label: 'ویدئو', icon: Play, color: 'text-rose-600 dark:text-rose-300' },
}

// ─── Icon Fallback ─────────────────────────────────────────────────────────────

const iconFallback: Record<string, React.ElementType> = {
  FileText, ShoppingBag, FileSearch, Languages, RefreshCw, Megaphone,
  Quote, Expand, Palette, Camera, Image, LayoutTemplate, BarChart2, Tag,
  Frame, Scissors, Layers, ArrowLeftRight, Presentation, Grid3X3,
  Mic, Subtitles, Tv, Clapperboard, Play, Podcast, Clock, Eye,
  GitCompareArrows, Target, Users, CalendarDays, ThumbsUp, Timer,
  Medal, Lightbulb, TrendingUp, Repeat, Compass, Bell, Zap, Tags,
  Star, Shield, DollarSign, ListChecks, MessageCircle, Sparkle,
  ArrowUpDown, BadgeCheck, Award, BookOpen, Heart, Radio, Volume2,
  Brain, Settings2, Layers3, FileStack, Type, Stamp, FileCheck,
  FileMinus, History, CalendarClock, SplitSquareHorizontal,
  GraduationCap, Cpu, Share2, PenLine, Mail, Hash, Video,
  BarChart3, Wand2, Download,
}

function getIcon(iconComp: React.ElementType): React.ElementType {
  if (typeof iconComp === 'string' && iconFallback[iconComp as string]) {
    return iconFallback[iconComp as string]
  }
  return iconComp
}

// ─── Build Prompt ────────────────────────────────────────────────────────────────

export function buildPrompt(feature: AIFeature, data: Record<string, string>): string {
  let prompt = `لطفاً ${feature.title} تولید کن.\n\n`

  for (const field of feature.inputFields) {
    const value = data[field.name]
    if (value?.trim()) {
      prompt += `${field.label}: ${value}\n`
    }
  }

  prompt += '\nلطفاً خروجی را به زبان فارسی و با فرمت خوانا و حرفه‌ای ارائه بده. از ایموجی و فرمت‌بندی مناسب استفاده کن.'

  return prompt
}

// ─── 100 AI Features ───────────────────────────────────────────────────────────

export const allFeatures: AIFeature[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // دسته ۱: تولید متن هوشمند (15 features)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'blog-post', title: 'تولید پست وبلاگ از موضوع', description: 'با استفاده از هوش مصنوعی، پست وبلاگ حرفه‌ای و سئو شده تولید کنید.',
    icon: FileText, category: 'text-gen', gradient: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع پست', type: 'text', placeholder: 'مثال: مزایای بازاریابی دیجیتال' },
      { name: 'tone', label: 'لحن نوشتار', type: 'select', options: ['رسمی', 'غیررسمی', 'آموزشی', 'متقاعدکننده'] },
      { name: 'length', label: 'طول محتوا', type: 'select', options: ['کوتاه (۳۰۰ کلمه)', 'متوسط (۶۰۰ کلمه)', 'بلند (۱۰۰۰+ کلمه)'] },
    ], outputType: 'text',
  },
  {
    id: 'product-desc', title: 'توصیف محصول', description: 'توصیف جذاب و فروشنده برای محصولات فروشگاه آنلاین بنویسید.',
    icon: ShoppingBag, category: 'text-gen', gradient: 'from-purple-500 to-fuchsia-500', iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    hasBackend: true, inputFields: [
      { name: 'productName', label: 'نام محصول', type: 'text', placeholder: 'مثال: هدفون بی‌سیم هوشمند' },
      { name: 'features', label: 'ویژگی‌ها', type: 'textarea', placeholder: 'ویژگی‌های اصلی محصول را بنویسید' },
    ], outputType: 'text',
  },
  {
    id: 'seo-title', title: 'عنوان و متای سئو', description: 'عنوان سئو شده و متا دیسکریپشن جذاب تولید کنید.',
    icon: FileSearch, category: 'text-gen', gradient: 'from-indigo-500 to-violet-500', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    hasBackend: true, inputFields: [
      { name: 'title', label: 'عنوان مطلب', type: 'text', placeholder: 'عنوان مطلب خود را وارد کنید' },
      { name: 'keywords', label: 'کلمات کلیدی', type: 'text', placeholder: 'کلمات کلیدی را وارد کنید' },
    ], outputType: 'text',
  },
  {
    id: 'summarizer', title: 'خلاصه‌ساز مقاله', description: 'مقاله طولانی را به خلاصه‌ای مفید تبدیل کنید.',
    icon: FileMinus, category: 'text-gen', gradient: 'from-blue-500 to-indigo-500', iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوای مقاله', type: 'textarea', placeholder: 'متن مقاله را اینجا قرار دهید' },
      { name: 'length', label: 'طول خلاصه', type: 'select', options: ['بسیار کوتاه (۱ جمله)', 'کوتاه (۳ جمله)', 'متوسط (۱ پاراگراف)'] },
    ], outputType: 'text',
  },
  {
    id: 'rewriter', title: 'بازنویسی محتوا', description: 'محتوا را با لحن و ساختار جدید بازنویسی کنید.',
    icon: RefreshCw, category: 'text-gen', gradient: 'from-green-500 to-teal-500', iconBg: 'bg-green-100 dark:bg-green-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوای اصلی', type: 'textarea', placeholder: 'متن مورد نظر را وارد کنید' },
      { name: 'tone', label: 'لحن جدید', type: 'select', options: ['رسمی', 'صمیمی', 'فنی', 'تبلیغاتی'] },
    ], outputType: 'text',
  },
  {
    id: 'email-newsletter', title: 'خبرنامه ایمیلی', description: 'خبرنامه حرفه‌ای برای مشترکان تولید کنید.',
    icon: Megaphone, category: 'text-gen', gradient: 'from-orange-500 to-red-500', iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع خبرنامه', type: 'text', placeholder: 'موضوع خبرنامه' },
      { name: 'audience', label: 'مخاطب', type: 'select', options: ['مشتریان', 'کاربران جدید', 'همه'] },
    ], outputType: 'text',
  },
  {
    id: 'social-caption', title: 'کپشن شبکه‌های اجتماعی', description: 'کپشن جذاب برای اینستاگرام، توییتر و لینکدین.',
    icon: MessageCircle, category: 'text-gen', gradient: 'from-pink-500 to-rose-500', iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'موضوع پست' },
      { name: 'platform', label: 'پلتفرم', type: 'select', options: ['اینستاگرام', 'توییتر', 'لینکدین', 'تلگرام'] },
    ], outputType: 'text',
  },
  {
    id: 'faq-gen', title: 'تولید سوالات متداول', description: 'سوالات متداول و پاسخ‌های مفید تولید کنید.',
    icon: Languages, category: 'text-gen', gradient: 'from-cyan-500 to-blue-500', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'مثال: استفاده از CRM' },
      { name: 'count', label: 'تعداد سوالات', type: 'select', options: ['۵ سوال', '۱۰ سوال', '۱۵ سوال'] },
    ], outputType: 'text',
  },
  {
    id: 'press-release', title: 'بیانیه مطبوعاتی', description: 'بیانیه مطبوعاتی حرفه‌ای و رسانه‌ای بنویسید.',
    icon: Expand, category: 'text-gen', gradient: 'from-violet-500 to-indigo-500', iconBg: 'bg-violet-100 dark:bg-indigo-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع خبر', type: 'text', placeholder: 'موضوع خبر' },
      { name: 'company', label: 'نام شرکت', type: 'text', placeholder: 'نام شرکت' },
    ], outputType: 'text',
  },
  {
    id: 'translate', title: 'ترجمه محتوا', description: 'محتوا را به زبان‌های مختلف ترجمه کنید.',
    icon: Languages, category: 'text-gen', gradient: 'from-teal-500 to-cyan-500', iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوا', type: 'textarea', placeholder: 'متن مورد نظر' },
      { name: 'targetLang', label: 'زبان مقصد', type: 'select', options: ['انگلیسی', 'عربی', 'فرانسوی', 'آلمانی', 'ترکی'] },
    ], outputType: 'text',
  },
  {
    id: 'headlines', title: 'تیترهای جایگزین', description: 'چندین تیتر جذاب برای محتوا تولید کنید.',
    icon: Quote, category: 'text-gen', gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    hasBackend: true, inputFields: [
      { name: 'title', label: 'عنوان فعلی', type: 'text', placeholder: 'عنوان فعلی مطلب' },
      { name: 'count', label: 'تعداد تیترها', type: 'select', options: ['۵ تیتر', '۱۰ تیتر', '۱۵ تیتر'] },
    ], outputType: 'text',
  },
  {
    id: 'cta-gen', title: 'دکمه فراخوان اقدام', description: 'متن دکمه CTA جذاب و تبدیل‌کننده تولید کنید.',
    icon: Target, category: 'text-gen', gradient: 'from-red-500 to-rose-500', iconBg: 'bg-red-100 dark:bg-red-900/30',
    hasBackend: true, inputFields: [
      { name: 'action', label: 'عمل مورد نظر', type: 'text', placeholder: 'مثال: خرید محصول' },
      { name: 'tone', label: 'لحن', type: 'select', options: ['فوری', 'صمیمی', 'حرفه‌ای'] },
    ], outputType: 'text',
  },
  {
    id: 'testimonial-gen', title: 'تولید دیدگاه/نظر', description: 'نظر و دیدگاه واقع‌نما مشتری تولید کنید.',
    icon: ThumbsUp, category: 'text-gen', gradient: 'from-emerald-500 to-green-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'محصول/خدمت', type: 'text', placeholder: 'نام محصول' },
      { name: 'sentiment', label: 'احساس', type: 'select', options: ['مثبت', 'خنثی', 'خنثی سازنده'] },
    ], outputType: 'text',
  },
  {
    id: 'expander', title: 'بسط‌دهنده محتوا', description: 'متن کوتاه را به محتوای کامل و جامع بسط دهید.',
    icon: Expand, category: 'text-gen', gradient: 'from-sky-500 to-blue-500', iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'متن کوتاه', type: 'textarea', placeholder: 'متن کوتاه را وارد کنید' },
      { name: 'target', label: 'طول هدف', type: 'select', options: ['۵۰۰ کلمه', '۱۰۰۰ کلمه', '۱۵۰۰ کلمه'] },
    ], outputType: 'text',
  },
  {
    id: 'tone-change', title: 'تغییر لحن محتوا', description: 'لحن محتوا را بدون تغییر معنا تغییر دهید.',
    icon: RefreshCw, category: 'text-gen', gradient: 'from-lime-500 to-green-500', iconBg: 'bg-lime-100 dark:bg-lime-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوا', type: 'textarea', placeholder: 'متن مورد نظر' },
      { name: 'targetTone', label: 'لحن هدف', type: 'select', options: ['رسمی', 'دوستانه', 'فنی', 'علمی', 'طنزآمیز'] },
    ], outputType: 'text',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // دسته ۲: تولید تصویر هوشمند (15 features)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'product-thumbnail', title: 'تصویر شاخص محصول', description: 'با AI تصویر حرفه‌ای شاخص محصول تولید کنید.',
    icon: Camera, category: 'image-gen', gradient: 'from-cyan-500 to-blue-500', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    hasBackend: true, inputFields: [
      { name: 'productName', label: 'نام محصول', type: 'text', placeholder: 'نام محصول' },
      { name: 'style', label: 'سبک تصویر', type: 'select', options: ['مدرن', 'مینیمال', 'واقع‌گرایانه', 'کارتونی'] },
    ], outputType: 'image',
  },
  {
    id: 'blog-featured', title: 'تصویر شاخص مقاله', description: 'تصویر جذاب و مرتبط برای مقاله وبلاگ بسازید.',
    icon: Image, category: 'image-gen', gradient: 'from-teal-500 to-cyan-500', iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    hasBackend: true, inputFields: [
      { name: 'title', label: 'عنوان مقاله', type: 'text', placeholder: 'عنوان مقاله' },
      { name: 'style', label: 'سبک', type: 'select', options: ['آبستره', 'طبیعت', 'تکنولوژی', 'هنری'] },
    ], outputType: 'image',
  },
  {
    id: 'social-image', title: 'تصویر پست اجتماعی', description: 'تصویر حرفه‌ای برای پست شبکه اجتماعی.',
    icon: Palette, category: 'image-gen', gradient: 'from-pink-500 to-rose-500', iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع تصویر', type: 'text', placeholder: 'موضوع تصویر' },
      { name: 'platform', label: 'پلتفرم', type: 'select', options: ['اینستاگرام', 'لینکدین', 'توییتر'] },
    ], outputType: 'image',
  },
  {
    id: 'youtube-thumbnail', title: 'تامنیل یوتیوب', description: 'تامنیل جذاب و کلیک‌خور برای ویدئوی یوتیوب.',
    icon: Tv, category: 'image-gen', gradient: 'from-red-500 to-orange-500', iconBg: 'bg-red-100 dark:bg-red-900/30',
    hasBackend: true, inputFields: [
      { name: 'title', label: 'عنوان ویدئو', type: 'text', placeholder: 'عنوان ویدئو' },
      { name: 'style', label: 'سبک', type: 'select', options: ['جذاب', 'وحشتناک', 'آموزشی', 'سرگرم'] },
    ], outputType: 'image',
  },
  {
    id: 'instagram-story', title: 'قالب استوری اینستاگرام', description: 'قالب آماده برای استوری اینستاگرام.',
    icon: LayoutTemplate, category: 'image-gen', gradient: 'from-fuchsia-500 to-pink-500', iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'موضوع استوری' },
      { name: 'type', label: 'نوع', type: 'select', options: ['تبلیغاتی', 'آموزشی', 'سرگرمی', 'فروش غذایی'] },
    ], outputType: 'image',
  },
  {
    id: 'infographic', title: 'اینفوگرافیک از داده', description: 'اینفوگرافیک زیبا از داده‌های عددی تولید کنید.',
    icon: BarChart2, category: 'image-gen', gradient: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    hasBackend: true, inputFields: [
      { name: 'data', label: 'داده‌ها', type: 'textarea', placeholder: 'داده‌های عددی را وارد کنید' },
      { name: 'style', label: 'سبک', type: 'select', options: ['شرکتی', 'مدرن', 'مینیمال'] },
    ], outputType: 'image',
  },
  {
    id: 'logo-gen', title: 'لوگو و برند', description: 'لوگوی حرفه‌ای برند خود طراحی کنید.',
    icon: Sparkle, category: 'image-gen', gradient: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    hasBackend: true, inputFields: [
      { name: 'brandName', label: 'نام برند', type: 'text', placeholder: 'نام برند' },
      { name: 'industry', label: 'صنعت', type: 'select', options: ['فناوری', 'غذا', 'مodes', 'آموزش', 'بهداشت'] },
    ], outputType: 'image',
  },
  {
    id: 'banner-hero', title: 'بنر و هیرو', description: 'بنر هیروی جذاب برای صفحه اصلی سایت.',
    icon: Frame, category: 'image-gen', gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    hasBackend: true, inputFields: [
      { name: 'headline', label: 'عنوان اصلی', type: 'text', placeholder: 'عنوان اصلی بنر' },
      { name: 'style', label: 'سبک', type: 'select', options: ['مدرن', 'تکنولوژی', 'طبیعت', 'مینیمال'] },
    ], outputType: 'image',
  },
  {
    id: 'product-mockup', title: 'ماکت محصول', description: 'ماکت محصول در محیط واقعی تولید کنید.',
    icon: Layers, category: 'image-gen', gradient: 'from-indigo-500 to-blue-500', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'نام محصول', type: 'text', placeholder: 'نام محصول' },
      { name: 'scene', label: 'محیط', type: 'select', options: ['استودیو', 'بیرونی', 'داخلی', 'اداری'] },
    ], outputType: 'image',
  },
  {
    id: 'bg-remove', title: 'حذف پس‌زمینه', description: 'پس‌زمینه تصویر را حذف کنید.',
    icon: Scissors, category: 'image-gen', gradient: 'from-rose-500 to-red-500', iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    hasBackend: true, inputFields: [
      { name: 'imageUrl', label: 'URL تصویر', type: 'text', placeholder: 'آدرس تصویر' },
    ], outputType: 'image',
  },
  {
    id: 'style-transfer', title: 'انتقال سبک تصویر', description: 'سبک هنری خاص به تصاویر اضافه کنید.',
    icon: Palette, category: 'image-gen', gradient: 'from-purple-500 to-violet-500', iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    hasBackend: true, inputFields: [
      { name: 'description', label: 'توضیحات سبک', type: 'text', placeholder: 'سبک مورد نظر (مثال: نقاشی آبرنگ)' },
    ], outputType: 'image',
  },
  {
    id: 'before-after', title: 'تصویر قبل و بعد', description: 'تصویر مقایسه‌ای قبل و بعد ایجاد کنید.',
    icon: ArrowLeftRight, category: 'image-gen', gradient: 'from-sky-500 to-indigo-500', iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'مثال: بازسازی ساختمان' },
    ], outputType: 'image',
  },
  {
    id: 'quote-poster', title: 'پوستر نقل‌قول', description: 'پوستر زیبا با نقل‌قول انگیزشی بسازید.',
    icon: Quote, category: 'image-gen', gradient: 'from-emerald-500 to-cyan-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    hasBackend: true, inputFields: [
      { name: 'quote', label: 'نقل‌قول', type: 'textarea', placeholder: 'نقل‌قول مورد نظر' },
      { name: 'author', label: 'نویسنده', type: 'text', placeholder: 'نام نویسنده' },
    ], outputType: 'image',
  },
  {
    id: 'product-variant', title: 'تصویر واریانت محصول', description: 'تصاویر واریانت مختلف محصول تولید کنید.',
    icon: Layers3, category: 'image-gen', gradient: 'from-teal-500 to-emerald-500', iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'نام محصول', type: 'text', placeholder: 'نام محصول' },
      { name: 'variant', label: 'نوع واریانت', type: 'select', options: ['رنگی', 'اندازه‌ای', 'استفاده'] },
    ], outputType: 'image',
  },
  {
    id: 'collage', title: 'کلاژ و مودبرد', description: 'کلاژ حرفه‌ای از تصاویر مختلف بسازید.',
    icon: Grid3X3, category: 'image-gen', gradient: 'from-orange-500 to-amber-500', iconBg: 'bg-orange-100 dark:bg-amber-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع کلاژ', type: 'text', placeholder: 'موضوع کلاژ' },
      { name: 'count', label: 'تعداد تصاویر', type: 'select', options: ['۴ تصویر', '۶ تصویر', '۹ تصویر'] },
    ], outputType: 'image',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // دسته ۳: تولید ویدئو (15 features)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'youtube-script', title: 'اسکریپت ویدئو یوتیوب', description: 'اسکریپت کامل و جذاب برای ویدئوی یوتیوب.',
    icon: Clapperboard, category: 'video-gen', gradient: 'from-red-500 to-rose-500', iconBg: 'bg-red-100 dark:bg-red-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع ویدئو', type: 'text', placeholder: 'موضوع ویدئو' },
      { name: 'duration', label: 'مدت زمان', type: 'select', options: ['۵ دقیقه', '۱۰ دقیقه', '۲۰ دقیقه'] },
    ], outputType: 'text',
  },
  {
    id: 'shorts-script', title: 'اسکریپت یوتیوب شورتس', description: 'اسکریپت کوتاه و وایرال برای یوتیوب شورتس.',
    icon: Play, category: 'video-gen', gradient: 'from-rose-500 to-pink-500', iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'موضوع شورتس' },
      { name: 'hook', label: 'قلابساز اول', type: 'text', placeholder: 'جمله اول جذاب' },
    ], outputType: 'text',
  },
  {
    id: 'reels-script', title: 'اسکریپت ریلز اینستاگرام', description: 'اسکریپت جذاب برای ریلز اینستاگرام.',
    icon: Film, category: 'video-gen', gradient: 'from-fuchsia-500 to-purple-500', iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'موضوع ریلز' },
      { name: 'trend', label: 'ترند فعلی', type: 'text', placeholder: 'ترند فعلی (اختیاری)' },
    ], outputType: 'text',
  },
  {
    id: 'video-voiceover', title: 'صداگذاری ویدئو', description: 'متن صداگذاری حرفه‌ای برای ویدئو تولید کنید.',
    icon: Mic, category: 'video-gen', gradient: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    hasBackend: true, inputFields: [
      { name: 'script', label: 'متن ویدئو', type: 'textarea', placeholder: 'متن ویدئو را وارد کنید' },
    ], outputType: 'audio',
  },
  {
    id: 'video-subtitle', title: 'زیرنویس ویدئو', description: 'زیرنویس دقیق و هماهنگ‌شده برای ویدئو.',
    icon: Subtitles, category: 'video-gen', gradient: 'from-cyan-500 to-blue-500', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    hasBackend: true, inputFields: [
      { name: 'transcript', label: 'متن ویدئو', type: 'textarea', placeholder: 'متن ویدئو' },
    ], outputType: 'text',
  },
  {
    id: 'video-description', title: 'توضیحات ویدئو یوتیوب', description: 'توضیحات کامل با سئو برای ویدئوی یوتیوب.',
    icon: Tv, category: 'video-gen', gradient: 'from-violet-500 to-indigo-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    hasBackend: true, inputFields: [
      { name: 'title', label: 'عنوان ویدئو', type: 'text', placeholder: 'عنوان ویدئو' },
      { name: 'keywords', label: 'کلمات کلیدی', type: 'text', placeholder: 'کلمات کلیدی (با کاما)' },
    ], outputType: 'text',
  },
  {
    id: 'hashtag-gen', title: 'هشتگ‌ساز', description: 'هشتگ‌های بهینه‌شده برای پست‌ها.',
    icon: Hash, category: 'video-gen', gradient: 'from-sky-500 to-blue-500', iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوا', type: 'textarea', placeholder: 'متن پست' },
      { name: 'platform', label: 'پلتفرم', type: 'select', options: ['اینستاگرام', 'توییتر', 'لینکدین', 'تیک‌تاک'] },
    ], outputType: 'text',
  },
  {
    id: 'tiktok-script', title: 'اسکریپت تیک‌تاک', description: 'محتوای وایرال و جذاب برای تیک‌تاک.',
    icon: Play, category: 'video-gen', gradient: 'from-pink-500 to-rose-500', iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'موضوع' },
      { name: 'duration', label: 'مدت', type: 'select', options: ['۱۵ ثانیه', '۳۰ ثانیه', '۶۰ ثانیه'] },
    ], outputType: 'text',
  },
  {
    id: 'demo-script', title: 'اسکریپت دمو محصول', description: 'اسکریپت دموی حرفه‌ای برای محصول.',
    icon: Presentation, category: 'video-gen', gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'نام محصول', type: 'text', placeholder: 'نام محصول' },
      { name: 'features', label: 'ویژگی‌ها', type: 'textarea', placeholder: 'ویژگی‌های کلیدی' },
    ], outputType: 'text',
  },
  {
    id: 'explainer-script', title: 'اسکریپت ویدئوی توضیحی', description: 'اسکریپت ویدئوی انیمیشنی توضیحی.',
    icon: Lightbulb, category: 'video-gen', gradient: 'from-teal-500 to-cyan-500', iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع توضیح', type: 'text', placeholder: 'مثال: نحوه کار AI' },
      { name: 'duration', label: 'مدت', type: 'select', options: ['۱ دقیقه', '۳ دقیقه', '۵ دقیقه'] },
    ], outputType: 'text',
  },
  {
    id: 'podcast-intro', title: 'اینترو/اوترو پادکست', description: 'متن معرفی و پایان پادکست جذاب.',
    icon: Podcast, category: 'video-gen', gradient: 'from-lime-500 to-green-500', iconBg: 'bg-lime-100 dark:bg-lime-900/30',
    hasBackend: true, inputFields: [
      { name: 'podcastName', label: 'نام پادکست', type: 'text', placeholder: 'نام پادکست' },
      { name: 'type', label: 'نوع', type: 'select', options: ['اینترو', 'اوترو'] },
    ], outputType: 'text',
  },
  {
    id: 'chapter-timestamps', title: 'تایم‌استمپ ویدئو', description: 'تایم‌استمپ فصلی برای بخش‌های ویدئو.',
    icon: Clock, category: 'video-gen', gradient: 'from-indigo-500 to-violet-500', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    hasBackend: true, inputFields: [
      { name: 'transcript', label: 'متن ویدئو', type: 'textarea', placeholder: 'متن کامل ویدئو' },
    ], outputType: 'text',
  },
  {
    id: 'thumbnail-ideas', title: 'ایده تامنیل + تیتر', description: 'ترکیب تامنیل و تیتر جذاب برای ویدئو.',
    icon: Eye, category: 'video-gen', gradient: 'from-rose-500 to-pink-500', iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    hasBackend: true, inputFields: [
      { name: 'title', label: 'عنوان ویدئو', type: 'text', placeholder: 'عنوان' },
    ], outputType: 'text',
  },
  {
    id: 'ab-testing', title: 'تست A/B تیتر ویدئو', description: 'چندین تیتر جایگزین با امتیازده برای تست A/B.',
    icon: GitCompareArrows, category: 'video-gen', gradient: 'from-blue-500 to-indigo-500', iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    hasBackend: true, inputFields: [
      { name: 'title', label: 'عنوان فعلی', type: 'text', placeholder: 'عنوان فعلی' },
      { name: 'count', label: 'تعداد', type: 'select', options: ['۳ تیتر', '۵ تیتر', '۱۰ تیتر'] },
    ], outputType: 'text',
  },
  {
    id: 'video-seo', title: 'سئوی ویدئو', description: 'بهینه‌سازی سئوی ویدئو برای رتبه بالاتر.',
    icon: TrendingUp, category: 'video-gen', gradient: 'from-emerald-500 to-green-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    hasBackend: true, inputFields: [
      { name: 'title', label: 'عنوان ویدئو', type: 'text', placeholder: 'عنوان' },
      { name: 'description', label: 'توضیحات فعلی', type: 'textarea', placeholder: 'توضیحات فعلی' },
    ], outputType: 'text',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // دسته ۴: سئو و تحلیل (10 features)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'keyword-research', title: 'تحقیق کلمات کلیدی', description: 'کلمات کلیدی بهینه برای محتوا پیدا کنید.',
    icon: FileSearch, category: 'seo-analytics', gradient: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'موضوع اصلی' },
      { name: 'language', label: 'زبان', type: 'select', options: ['فارسی', 'انگلیسی', 'عربی'] },
    ], outputType: 'text',
  },
  {
    id: 'competitor-analysis', title: 'تحلیل رقبا', description: 'تحلیل محتوای رقبا و پیشنهادات بهبود.',
    icon: Users, category: 'seo-analytics', gradient: 'from-orange-500 to-red-500', iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    hasBackend: true, inputFields: [
      { name: 'url', label: 'آدرس رقیب', type: 'text', placeholder: 'URL صفحه رقیب' },
      { name: 'topic', label: 'موضوع مقایسه', type: 'text', placeholder: 'موضوع' },
    ], outputType: 'text',
  },
  {
    id: 'readability', title: 'امتیاز خوانایی', description: 'امتیاز خوانایی محتوا و پیشنهادات بهبود.',
    icon: BookOpen, category: 'seo-analytics', gradient: 'from-cyan-500 to-teal-500', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوا', type: 'textarea', placeholder: 'متن مورد ارزیابی' },
    ], outputType: 'text',
  },
  {
    id: 'seo-audit', title: 'حسابرسی سئو', description: 'حسابرسی کامل سئو صفحه و پیشنهادات بهبود.',
    icon: Shield, category: 'seo-analytics', gradient: 'from-emerald-500 to-green-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    hasBackend: true, inputFields: [
      { name: 'url', label: 'آدرس صفحه', type: 'text', placeholder: 'URL صفحه' },
      { name: 'content', label: 'محتوا (اختیاری)', type: 'textarea', placeholder: 'محتوای صفحه' },
    ], outputType: 'text',
  },
  {
    id: 'backlink', title: 'فرصت بک‌لینک', description: 'فرصت‌های لینک‌سازی و بک‌لینک پیدا کنید.',
    icon: Link, category: 'seo-analytics', gradient: 'from-sky-500 to-blue-500', iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    hasBackend: false, inputFields: [
      { name: 'topic', label: 'نیش موضوع', type: 'text', placeholder: 'نیش موضوعی سایت' },
    ], outputType: 'text',
  },
  {
    id: 'content-gap', title: 'تحلیل شکاف محتوا', description: 'شکاف‌های محتوایی رقبا را شناسایی کنید.',
    icon: Compass, category: 'seo-analytics', gradient: 'from-indigo-500 to-violet-500', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'حوزه', type: 'text', placeholder: 'حوزه موضوعی' },
    ], outputType: 'text',
  },
  {
    id: 'trend-analysis', title: 'تحلیل ترندها', description: 'ترندهای فعلی و پیش‌بینی ترندهای آینده.',
    icon: TrendingUp, category: 'seo-analytics', gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'حوزه', type: 'text', placeholder: 'حوزه' },
      { name: 'period', label: 'بازه زمانی', type: 'select', options: ['هفته گذشته', 'ماه گذشته', '۳ ماه گذشته'] },
    ], outputType: 'text',
  },
  {
    id: 'serp-preview', title: 'پیش‌نمایش SERP', description: 'پیش‌نمایش نحوه نمایش در نتایج جستجو.',
    icon: Eye, category: 'seo-analytics', gradient: 'from-rose-500 to-pink-500', iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    hasBackend: true, inputFields: [
      { name: 'title', label: 'عنوان', type: 'text', placeholder: 'عنوان سئو شده' },
      { name: 'meta', label: 'متا دیسکریپشن', type: 'text', placeholder: 'متا دیسکریپشن' },
    ], outputType: 'text',
  },
  {
    id: 'linking-suggestions', title: 'پیشنهاد لینک داخلی', description: 'پیشنهاد لینک‌دهی داخلی بهین صفحات.',
    icon: Link, category: 'seo-analytics', gradient: 'from-teal-500 to-cyan-500', iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوا', type: 'textarea', placeholder: 'متن صفحه' },
      { name: 'existingUrls', label: 'صفحات موجود', type: 'text', placeholder: 'آدرس صفحات (اختیاری)' },
    ], outputType: 'text',
  },
  {
    id: 'schema-markup', title: 'اسکیما مارکاپ', description: 'کد اسکیما مارکاپ ساختار یافته برای سئو.',
    icon: Code, category: 'seo-analytics', gradient: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    hasBackend: true, inputFields: [
      { name: 'type', label: 'نوع صفحه', type: 'select', options: ['مقاله', 'محصول', 'خدمت', 'سازمان', 'FAQ'] },
      { name: 'title', label: 'عنوان', type: 'text', placeholder: 'عنوان صفحه' },
    ], outputType: 'text',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // دسته ۵: شبکه‌های اجتماعی (15 features)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'content-calendar', title: 'تقویم محتوایی چندپلتفرمی', description: 'برنامه‌ریزی محتوا برای چند پلتفرم.',
    icon: CalendarDays, category: 'social-media', gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'نیش', type: 'text', placeholder: 'نیش موضوعی' },
      { name: 'platforms', label: 'پلتفرم‌ها', type: 'select', options: ['اینستاگرام + یوتیوب', 'توییتر + لینکدین', 'همه پلتفرم'] },
    ], outputType: 'text',
  },
  {
    id: 'twitter-thread', title: 'ترد توییتری', description: 'ترد (Thread) جذاب و مفصل برای توییتر.',
    icon: Repeat, category: 'social-media', gradient: 'from-sky-500 to-blue-500', iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع ترد', type: 'text', placeholder: 'موضوع' },
      { name: 'count', label: 'تعداد تویت', type: 'select', options: ['۵ تویت', '۱۰ تویت', '۲۰ تویت'] },
    ], outputType: 'text',
  },
  {
    id: 'linkedin-article', title: 'مقاله لینکدین', description: 'مقاله حرفه‌ای برای پست لینکدین.',
    icon: Share2, category: 'social-media', gradient: 'from-blue-500 to-indigo-500', iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'موضوع مقاله' },
      { name: 'tone', label: 'لحن', type: 'select', options: ['رسمی', 'دمی', 'صمیمی', 'الهام‌بخش'] },
    ], outputType: 'text',
  },
  {
    id: 'insta-caption', title: 'کپشن اینستاگرام با هشتگ', description: 'کپشن جذاب + هشتگ برای اینستاگرام.',
    icon: Camera, category: 'social-media', gradient: 'from-fuchsia-500 to-pink-500', iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوا/تصویر', type: 'textarea', placeholder: 'توضیح تصویر یا محتوا' },
      { name: 'hashtags', label: 'هشتگ‌های اضافی', type: 'text', placeholder: 'هشتگ اضافی (اختیاری)' },
    ], outputType: 'text',
  },
  {
    id: 'facebook-post', title: 'پست فیسبوک', description: 'پست جذاب و تعاملی برای فیسبوک.',
    icon: MessageCircle, category: 'social-media', gradient: 'from-blue-600 to-indigo-600', iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'موضوع پست' },
      { name: 'type', label: 'نوع پست', type: 'select', options: ['متنی', 'عکس+متن', 'ویدئو'] },
    ], outputType: 'text',
  },
  {
    id: 'pinterest-pin', title: 'توضیحات پین پینترست', description: 'توضیحات جذاب و سئوشده برای پین.',
    icon: Layers, category: 'social-media', gradient: 'from-red-500 to-rose-500', iconBg: 'bg-red-100 dark:bg-red-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'موضوع پین' },
      { name: 'keywords', label: 'کلمات کلیدی', type: 'text', placeholder: 'کلمات کلیدی' },
    ], outputType: 'text',
  },
  {
    id: 'telegram-post', title: 'محتوای تلگرام', description: 'محتوای جذاب برای کانال تلگرام.',
    icon: MessageCircle, category: 'social-media', gradient: 'from-sky-500 to-cyan-500', iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع', type: 'text', placeholder: 'موضوع پیام' },
      { name: 'type', label: 'نوع', type: 'select', options: ['متن', 'عکس', 'ویدئو لینک'] },
    ], outputType: 'text',
  },
  {
    id: 'engagement-score', title: 'امتیاز تعامل', description: 'پیش‌بینی امتیاز تعامل پست قبل از انتشار.',
    icon: ThumbsUp, category: 'social-media', gradient: 'from-emerald-500 to-green-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوای پست', type: 'textarea', placeholder: 'محتوای پست' },
      { name: 'platform', label: 'پلتفرم', type: 'select', options: ['اینستاگرام', 'توییتر', 'فیسبوک'] },
    ], outputType: 'text',
  },
  {
    id: 'best-time', title: 'بهترین زمان انتشار', description: 'بهترین زمان انتشار برای حداکثر بازدید.',
    icon: Clock, category: 'social-media', gradient: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    hasBackend: true, inputFields: [
      { name: 'platform', label: 'پلتفرم', type: 'select', options: ['اینستاگرام', 'توییتر', 'لینکدین', 'تیک‌تاک'] },
      { name: 'audience', label: 'مخاطب', type: 'text', placeholder: 'توضیح مخاطب' },
    ], outputType: 'text',
  },
  {
    id: 'social-proof', title: 'متن تضمین اجتماعی', description: 'متن آمار و تضمین اجتماعی برای فروش.',
    icon: Award, category: 'social-media', gradient: 'from-gold-500 to-amber-500', iconBg: 'bg-gold-100 dark:bg-amber-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'محصول', type: 'text', placeholder: 'نام محصول' },
      { name: 'metric', label: 'مetric', type: 'select', options: ['فروش فروش', 'رضایت مشتری', 'تعداد کاربر'] },
    ], outputType: 'text',
  },
  {
    id: 'ugc-inspiration', title: 'الهام محتوای کاربران', description: 'ایده‌های محتوایی از محتوای کاربران.',
    icon: Lightbulb, category: 'social-media', gradient: 'from-teal-500 to-cyan-500', iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'حوزه', type: 'text', placeholder: 'حوزه' },
      { name: 'type', label: 'نوع محتوا', type: 'select', options: ['نقد و بررسی', 'استفاده محصول', 'عکس محصول'] },
    ], outputType: 'text',
  },
  {
    id: 'viral-predictor', title: 'پیش‌بینی وایرال', description: 'امتیاز احتمال وایرال شدن محتوا.',
    icon: Flame, category: 'social-media', gradient: 'from-orange-500 to-red-500', iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    hasBackend: true, inputFields: [
      { name: 'title', label: 'تیتر', type: 'text', placeholder: 'تیتر محتوا' },
      { name: 'platform', label: 'پلتفرم', type: 'select', options: ['اینستاگرام', 'توییتر', 'تیک‌تاک'] },
    ], outputType: 'text',
  },
  {
    id: 'cross-platform', title: 'تبدیل بین‌پلتفرمی', description: 'تبدیل محتوا برای انتشار در پلتفرم‌های مختلف.',
    icon: Repeat, category: 'social-media', gradient: 'from-indigo-500 to-blue-500', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوای اصلی', type: 'textarea', placeholder: 'محتوا' },
      { name: 'target', label: 'پلتفرم هدف', type: 'select', options: ['اینستاگرام', 'توییتر', 'لینکدین', 'تلگرام'] },
    ], outputType: 'text',
  },
  {
    id: 'analytics-summary', title: 'خلاصه تحلیل اجتماعی', description: 'خلاصه و تحلیل آمار شبکه‌های اجتماعی.',
    icon: BarChart2, category: 'social-media', gradient: 'from-cyan-500 to-teal-500', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    hasBackend: true, inputFields: [
      { name: 'data', label: 'داده‌های آماری', type: 'textarea', placeholder: 'لایک/رأیت‌ها/فالوور' },
    ], outputType: 'text',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // دسته ۶: محصولات و فروشگاه (15 features)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'product-name', title: 'نام‌گذاری محصول', description: 'نام‌های جذاب و خلاقانه برای محصول.',
    icon: Sparkle, category: 'e-commerce', gradient: 'from-fuchsia-500 to-violet-500', iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    hasBackend: true, inputFields: [
      { name: 'description', label: 'توضیح محصول', type: 'textarea', placeholder: 'توضیح مختصر محصول' },
      { name: 'type', label: 'نوع', type: 'select', options: ['دیجیتال', 'فیزیکی', 'خدمات', 'غذایی'] },
    ], outputType: 'text',
  },
  {
    id: 'product-benefits', title: 'استخراج مزایا', description: 'فهرست مزایا و فواید از توضیحات محصول.',
    icon: Check, category: 'e-commerce', gradient: 'from-emerald-500 to-green-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    hasBackend: true, inputFields: [
      { name: 'description', label: 'توضیحات محصول', type: 'textarea', placeholder: 'توضیحات کامل محصول' },
    ], outputType: 'text',
  },
  {
    id: 'comparison-table', title: 'جدول مقایسه', description: 'جدول مقایسه حرفه‌ای بین محصولات.',
    icon: Layers, category: 'e-commerce', gradient: 'from-cyan-500 to-teal-500', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    hasBackend: true, inputFields: [
      { name: 'products', label: 'محصولات (هر خط یک محصول)', type: 'textarea', placeholder: 'نام محصول ۱\nنام محصول ۲' },
    ], outputType: 'text',
  },
  {
    id: 'review-response', title: 'پاسخ به دیدگاه', description: 'پاسخ حرفه‌ای به دیدگاه مشتری.',
    icon: MessageCircle, category: 'e-commerce', gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    hasBackend: true, inputFields: [
      { name: 'review', label: 'دیدگاه مشتری', type: 'textarea', placeholder: 'متن دیدگاه' },
      { name: 'sentiment', label: 'احساس', type: 'select', options: ['مثبت', 'منفی', 'خنثی'] },
    ], outputType: 'text',
  },
  {
    id: 'upsell-text', title: 'متن آپ‌سل', description: 'متن آپ‌سل و کراس‌سل جذاب.',
    icon: TrendingUp, category: 'e-commerce', gradient: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'محصول فعلی', type: 'text', placeholder: 'محصول' },
      { name: 'upsell', label: 'محصول پیشنهادی', type: 'text', placeholder: 'محصول پیشنهادی' },
    ], outputType: 'text',
  },
  {
    id: 'product-faq', title: 'سوالات متداول محصول', description: 'FAQ حرفه‌ای برای صفحه محصول.',
    icon: FileSearch, category: 'e-commerce', gradient: 'from-sky-500 to-blue-500', iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'نام محصول', type: 'text', placeholder: 'نام محصول' },
      { name: 'features', label: 'ویژگی‌ها', type: 'textarea', placeholder: 'ویژگی‌های کلیدی' },
    ], outputType: 'text',
  },
  {
    id: 'discount-text', title: 'متن تخفیف', description: 'متن تبلیغاتی جذاب برای کمپین تخفیف.',
    icon: Tag, category: 'e-commerce', gradient: 'from-rose-500 to-red-500', iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'محصول', type: 'text', placeholder: 'محصول' },
      { name: 'discount', label: 'مقدار تخفیف', type: 'text', placeholder: 'مثال: ۲۰٪' },
    ], outputType: 'text',
  },
  {
    id: 'email-campaign', title: 'کمپین ایمیلی محصول', description: 'ایمیل مارکتینگی حرفه‌ای برای محصول.',
    icon: Mail, category: 'e-commerce', gradient: 'from-indigo-500 to-violet-500', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'محصول', type: 'text', placeholder: 'نام محصول' },
      { name: 'goal', label: 'هدف کمپین', type: 'select', options: ['فروش فروش', 'بازدید مجدد', 'معرفی ویژگی جدید'] },
    ], outputType: 'text',
  },
  {
    id: 'product-story', title: 'داستان‌سرایی محصول', description: 'داستان جذاب و فروشنده درباره محصول.',
    icon: BookOpen, category: 'e-commerce', gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'نام محصول', type: 'text', placeholder: 'محصول' },
      { name: 'audience', label: 'مخاطب', type: 'select', options: ['جوان', 'متخصص', 'مدیران'] },
    ], outputType: 'text',
  },
  {
    id: 'brand-voice', title: 'تحلیل صدای برند', description: 'تحلیل و بهبود صدای برند در محتوا.',
    icon: Heart, category: 'e-commerce', gradient: 'from-fuchsia-500 to-pink-500', iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'نمونه محتوا', type: 'textarea', placeholder: 'نمونه‌ای محتوای فعلی' },
    ], outputType: 'text',
  },
  {
    id: 'price-optimizer', title: 'بهینه‌سازی قیمت', description: 'توضیحات قیمت جذاب و روان‌شناسی قیمت.',
    icon: DollarSign, category: 'e-commerce', gradient: 'from-emerald-500 to-green-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'محصول', type: 'text', placeholder: 'محصول' },
      { name: 'currentPrice', label: 'قیمت فعلی', type: 'text', placeholder: 'قیمت فعلی (تومان)' },
    ], outputType: 'text',
  },
  {
    id: 'product-specs', title: 'فرمت مشخصات', description: 'فرمت حرفه‌ای مشخصات فنی محصول.',
    icon: FileCheck, category: 'e-commerce', gradient: 'from-teal-500 to-cyan-500', iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    hasBackend: true, inputFields: [
      { name: 'specs', label: 'مشخصات فنی', type: 'textarea', placeholder: 'مشخصات فنی محصول' },
      { name: 'language', label: 'زبان', type: 'select', options: ['فارسی', 'انگلیسی'] },
    ], outputType: 'text',
  },
  {
    id: 'customer-persona', title: 'پرسونای مشتری', description: 'شخصیت‌نگاری دقیق پرسونای مشتری هدف.',
    icon: Users, category: 'e-commerce', gradient: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'محصول', type: 'text', placeholder: 'محصول' },
      { name: 'market', label: 'بازار', type: 'select', options: ['ایران', 'خاورمیانه', 'اروپا'] },
    ], outputType: 'text',
  },
  {
    id: 'launch-announce', title: 'اعلام‌نامه عرضه محصول', description: 'اعلام‌نامه حرفه‌ای عرضه محصول جدید.',
    icon: Bell, category: 'e-commerce', gradient: 'from-orange-500 to-amber-500', iconBg: 'bg-orange-100 dark:bg-amber-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'محصول', type: 'text', placeholder: 'محصول' },
      { name: 'features', label: 'ویژگی‌های کلیدی', type: 'textarea', placeholder: 'ویژگی‌ها' },
    ], outputType: 'text',
  },
  {
    id: 'cart-recovery', title: 'بازیابی سبد رهاشده', description: 'ایمیل بازیابی سبد خرید رهاشده.',
    icon: Radio, category: 'e-commerce', gradient: 'from-red-500 to-rose-500', iconBg: 'bg-red-100 dark:bg-red-900/30',
    hasBackend: true, inputFields: [
      { name: 'product', label: 'محصول', type: 'text', placeholder: 'محصول' },
      { name: 'customerName', label: 'نام مشتری', type: 'text', placeholder: 'نام مشتری' },
    ], outputType: 'text',
  },

  // ═════════════════════════════════════════════════════════════════════════
  // دسته ۷: صدا و موسیقی (5 features)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'blog-to-podcast', title: 'تبدیل وبلاگ به پادکست', description: 'مقاله وبلاگ را به متن پادکست تبدیل کنید.',
    icon: Radio, category: 'audio', gradient: 'from-sky-500 to-blue-500', iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    hasBackend: true, inputFields: [
      { name: 'blogTitle', label: 'عنوان مقاله', type: 'text', placeholder: 'عنوان' },
      { name: 'content', label: 'خلاصه مقاله', type: 'textarea', placeholder: 'خلاصه' },
    ], outputType: 'text',
  },
  {
    id: 'audiobook-chapter', title: 'فصل کتاب صوتی', description: 'متن فصل کتاب صوتی حرفه‌ای.',
    icon: BookOpen, category: 'audio', gradient: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    hasBackend: true, inputFields: [
      { name: 'chapterTitle', label: 'عنوان فصل', type: 'text', placeholder: 'عنوان فصل' },
      { name: 'content', label: 'محتوا', type: 'textarea', placeholder: 'محتوای فصل' },
    ], outputType: 'text',
  },
  {
    id: 'tutorial-voiceover', title: 'صداگذاری آموزشی', description: 'صداگذاری ویسه آموزشی حرفه‌ای.',
    icon: Mic, category: 'audio', gradient: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    hasBackend: true, inputFields: [
      { name: 'tutorialText', label: 'متن آموزشی', type: 'textarea', placeholder: 'متن آموزش' },
    ], outputType: 'audio',
  },
  {
    id: 'pronunciation', title: 'بررسی تلفظ فارسی', description: 'بررسی تلفظ صحیح فارسی کلمات.',
    icon: Volume2, category: 'audio', gradient: 'from-cyan-500 to-teal-500', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    hasBackend: true, inputFields: [
      { name: 'text', label: 'متن فارسی', type: 'textarea', placeholder: 'متن فارسی' },
    ], outputType: 'text',
  },
  {
    id: 'music-mood', title: 'پیشنهاد موسیقی پس‌زمینه', description: 'پیشنهاد موسیقی مناسب پس‌زمینه محتوا.',
    icon: Music, category: 'audio', gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    hasBackend: true, inputFields: [
      { name: 'mood', label: 'حال و محتوا', type: 'text', placeholder: 'مثال: خوشحال و امیدوار' },
    ], outputType: 'text',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // دسته ۸: اتوماسیون و جریان کار (11 features - was 10, now 11 with content pipeline)
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: 'content-pipeline', title: 'خط تولید محتوا', description: 'خودکار تولید محتوا از ایده تا انتشار.',
    icon: Workflow, category: 'automation', gradient: 'from-teal-500 to-cyan-500', iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    hasBackend: true, inputFields: [
      { name: 'topic', label: 'موضوع محتوا', type: 'text', placeholder: 'موضوع' },
      { name: 'type', label: 'نوع محتوا', type: 'select', options: ['پست وبلاگ', 'محصول', 'ویدئو', 'ایمیل'] },
    ], outputType: 'text',
  },
  {
    id: 'bulk-wizard', title: 'جادوگر تولید انبوه', description: 'تولید همزمان چندین محتوا.',
    icon: Layers, category: 'automation', gradient: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    hasBackend: true, inputFields: [
      { name: 'topics', label: 'موضوعات (هر خط یک)', type: 'textarea', placeholder: 'موضوع ۱\nموضوع ۲\nموضوع ۳' },
    ], outputType: 'text',
  },
  {
    id: 'content-repurpose', title: 'بازتولید محتوا (۱ به ۱۰)', description: 'یک محتوا → ۱۰ محتوای مختلف برای پلتفرم‌ها.',
    icon: RefreshCw, category: 'automation', gradient: 'from-pink-500 to-rose-500', iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوای اصلی', type: 'textarea', placeholder: 'محتوای اصلی' },
    ], outputType: 'text',
  },
  {
    id: 'ai-writing-assistant', title: 'دستیار نویسندگی AI', description: 'دستیار هوشمند کنار موازی برای نوشتن.',
    icon: Brain, category: 'automation', gradient: 'from-fuchsia-500 to-violet-500', iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    hasBackend: true, inputFields: [
      { name: 'task', label: 'وظیفه نوشتنش', type: 'select', options: ['بازبینی', 'بسط‌دهی', 'ویرایش', 'ترجمه'] },
      { name: 'text', label: 'متن', type: 'textarea', placeholder: 'متن مورد نظر' },
    ], outputType: 'text',
  },
  {
    id: 'auto-tag', title: 'برچسب‌گذاری خودکار', description: 'برچسب و دسته‌بندی خودکار محتوا.',
    icon: Tags, category: 'automation', gradient: 'from-cyan-500 to-teal-500', iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوا', type: 'textarea', placeholder: 'محتوا' },
    ], outputType: 'text',
  },
  {
    id: 'quality-score', title: 'امتیاز کیفیت محتوا', description: 'امتیاز کیفیت و پیشنهادات بهبود.',
    icon: Star, category: 'automation', gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوا', type: 'textarea', placeholder: 'محتوا' },
    ], outputType: 'text',
  },
  {
    id: 'plagiarism-check', title: 'بررسی سرقت ادبی', description: 'بررسی شباهت محتوا با منابع آنلاین.',
    icon: Shield, category: 'automation', gradient: 'from-red-500 to-rose-500', iconBg: 'bg-red-100 dark:bg-red-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوا', type: 'textarea', placeholder: 'محتوای مورد بررسی' },
    ], outputType: 'text',
  },
  {
    id: 'version-compare', title: 'مقایسه نسخه‌ها', description: 'مقایسه دو نسخه مختلف محتوا.',
    icon: GitCompareArrows, category: 'automation', gradient: 'from-blue-500 to-indigo-500', iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    hasBackend: true, inputFields: [
      { name: 'version1', label: 'نسخه ۱', type: 'textarea', placeholder: 'نسخه اول' },
      { name: 'version2', label: 'نسخه ۲', type: 'textarea', placeholder: 'نسخه دوم' },
    ], outputType: 'text',
  },
  {
    id: 'smart-calendar', title: 'تقویم هوشمند محتوا', description: 'تقویم انتشار هوشمند بر اساس ترندها.',
    icon: CalendarClock, category: 'automation', gradient: 'from-emerald-500 to-green-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    hasBackend: true, inputFields: [
      { name: 'topics', label: 'موضوعات', type: 'textarea', placeholder: 'موضوع ۱\nموضوع ۲' },
      { name: 'period', label: 'بازه', type: 'select', options: ['هفته آینده', 'ماه آینده'] },
    ], outputType: 'text',
  },
  {
    id: 'smart-schedule', title: 'زمان‌بندی هوشمند', description: 'زمان‌بندی بهینه‌سازی انتشار محتوا.',
    icon: Timer, category: 'automation', gradient: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    hasBackend: true, inputFields: [
      { name: 'content', label: 'محتوا', type: 'textarea', placeholder: 'محتوا' },
      { name: 'platform', label: 'پلتفرم', type: 'select', options: ['اینستاگرام', 'یوتیوب', 'توییتر'] },
    ], outputType: 'text',
  },
]
