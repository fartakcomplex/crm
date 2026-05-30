'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, KeyRound, LogOut, FileText, MessageCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

export function UserProfileCard() {
  const handleEditProfile = () => {
    toast.info('بخش ویرایش پروفایل به زودی اضافه می‌شود')
  }

  const handleChangePassword = () => {
    toast.info('بخش تغییر رمز عبور به زودی اضافه می‌شود')
  }

  const handleLogout = () => {
    toast.info('در حال خروج...')
  }

  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0 overflow-hidden">
      {/* Gradient Header */}
      <div className="relative h-20 bg-gradient-to-l from-violet-500 via-purple-500 to-fuchsia-500">
        {/* Decorative circles */}
        <div className="absolute top-2 start-8 h-12 w-12 rounded-full bg-white/10 blur-sm" />
        <div className="absolute bottom-0 end-12 h-16 w-16 rounded-full bg-white/5 blur-md" />
      </div>

      <CardContent className="px-4 pb-4">
        {/* Avatar with overlap */}
        <div className="flex flex-col items-center -mt-10 relative z-10">
          {/* Avatar circle */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-violet-500/30 border-4 border-background">
            م
          </div>

          {/* Name & info */}
          <div className="text-center mt-3">
            <h3 className="text-base font-bold">مدیر سیستم</h3>
            <p className="text-xs text-muted-foreground mt-0.5">admin@smartcms.ir</p>
            <Badge className="mt-2 text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-0">
              مدیر ارشد
            </Badge>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 w-full mt-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <FileText className="h-3 w-3" />
              </div>
              <p className="text-sm font-bold tabular-nums">۲۴</p>
              <p className="text-[10px] text-muted-foreground">تعداد مطالب</p>
            </div>
            <div className="text-center border-x border-border/40">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <MessageCircle className="h-3 w-3" />
              </div>
              <p className="text-sm font-bold tabular-nums">۱۵۶</p>
              <p className="text-[10px] text-muted-foreground">تعداد نظرات</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
              </div>
              <p className="text-sm font-bold tabular-nums">۲ min</p>
              <p className="text-[10px] text-muted-foreground">آخرین ورود</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full mt-4 space-y-2">
            <Button
              variant="outline"
              className="w-full gap-2 justify-center text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700 transition-colors h-9"
              onClick={handleEditProfile}
            >
              <Pencil className="h-3.5 w-3.5" />
              ویرایش پروفایل
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="gap-1.5 justify-center text-xs hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-700 transition-colors h-8"
                onClick={handleChangePassword}
              >
                <KeyRound className="h-3.5 w-3.5" />
                تغییر رمز
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 justify-center text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-colors h-8"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
