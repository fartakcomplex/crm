'use client'

import { motion } from 'framer-motion'
import {
  FileText,
  Upload,
  Sparkles,
  UserPlus,
  Receipt,
  BarChart3,
} from 'lucide-react'

interface QuickActionsWidgetProps {
  onAction: (action: string) => void
}

const actions = [
  {
    id: 'new-post',
    label: 'پست جدید',
    icon: FileText,
    gradient: 'from-pink-500 to-rose-500',
    shadowColor: 'shadow-pink-500/30',
  },
  {
    id: 'upload-media',
    label: 'آپلود مدیا',
    icon: Upload,
    gradient: 'from-amber-500 to-orange-500',
    shadowColor: 'shadow-amber-500/30',
  },
  {
    id: 'ai-assistant',
    label: 'دستیار هوشمند',
    icon: Sparkles,
    gradient: 'from-violet-500 to-purple-500',
    shadowColor: 'shadow-violet-500/30',
  },
  {
    id: 'add-customer',
    label: 'مشتری جدید',
    icon: UserPlus,
    gradient: 'from-emerald-500 to-green-500',
    shadowColor: 'shadow-emerald-500/30',
  },
  {
    id: 'create-invoice',
    label: 'صدور فاکتور',
    icon: Receipt,
    gradient: 'from-sky-500 to-cyan-500',
    shadowColor: 'shadow-sky-500/30',
  },
  {
    id: 'view-reports',
    label: 'گزارش‌ها',
    icon: BarChart3,
    gradient: 'from-fuchsia-500 to-pink-500',
    shadowColor: 'shadow-fuchsia-500/30',
  },
]

export default function QuickActionsWidget({ onAction }: QuickActionsWidgetProps) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-500" />
        دسترسی سریع
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onAction(action.id)}
              className={`group relative flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br ${action.gradient} p-4 text-white shadow-lg ${action.shadowColor} hover:shadow-xl transition-shadow duration-300 cursor-pointer`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium leading-tight text-center">
                {action.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
