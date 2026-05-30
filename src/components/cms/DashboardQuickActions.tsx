'use client'

import { FileText, UserPlus, FolderPlus, ShoppingCart, BarChart3, Bot } from 'lucide-react'

interface DashboardQuickActionsProps {
  onAction: (action: string) => void
}

const quickActions = [
  {
    id: 'new-post',
    label: 'ایجاد مطلب جدید',
    icon: <FileText className="h-5 w-5" />,
    gradient: 'from-violet-500 to-purple-600',
    hoverShadow: 'hover:shadow-violet-500/30',
    glow: 'group-hover:shadow-violet-500/20',
  },
  {
    id: 'add-user',
    label: 'افزودن کاربر',
    icon: <UserPlus className="h-5 w-5" />,
    gradient: 'from-cyan-500 to-sky-600',
    hoverShadow: 'hover:shadow-cyan-500/30',
    glow: 'group-hover:shadow-cyan-500/20',
  },
  {
    id: 'new-project',
    label: 'ایجاد پروژه',
    icon: <FolderPlus className="h-5 w-5" />,
    gradient: 'from-emerald-500 to-teal-600',
    hoverShadow: 'hover:shadow-emerald-500/30',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  {
    id: 'new-order',
    label: 'ثبت سفارش',
    icon: <ShoppingCart className="h-5 w-5" />,
    gradient: 'from-amber-500 to-orange-600',
    hoverShadow: 'hover:shadow-amber-500/30',
    glow: 'group-hover:shadow-amber-500/20',
  },
  {
    id: 'financial-report',
    label: 'گزارش مالی',
    icon: <BarChart3 className="h-5 w-5" />,
    gradient: 'from-rose-500 to-pink-600',
    hoverShadow: 'hover:shadow-rose-500/30',
    glow: 'group-hover:shadow-rose-500/20',
  },
  {
    id: 'ai-assistant',
    label: 'دستیار AI',
    icon: <Bot className="h-5 w-5" />,
    gradient: 'from-fuchsia-500 to-purple-600',
    hoverShadow: 'hover:shadow-fuchsia-500/30',
    glow: 'group-hover:shadow-fuchsia-500/20',
  },
]

export default function DashboardQuickActions({ onAction }: DashboardQuickActionsProps) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          className={`group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-md ${action.hoverShadow} hover:scale-[1.06] active:scale-[0.97] transition-all duration-200 hover:shadow-xl`}
          type="button"
        >
          <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110 group-hover:bg-white/30">
            {action.icon}
          </div>
          <span className="text-[11px] sm:text-xs font-medium leading-tight text-center text-white/95">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  )
}
