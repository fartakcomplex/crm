'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, LogOut, Shield, Bell, Palette, Moon, Sun } from 'lucide-react'

interface UserMenuDropdownProps {
  theme?: string
  onToggleTheme?: () => void
  onOpenNotifications?: () => void
  onOpenProfile?: () => void
  onLogout?: () => void
}

const user = {
  name: 'مدیر سیستم',
  email: 'admin@smartcms.ir',
  role: 'مدیر ارشد',
  avatar: 'A',
}

export default function UserMenuDropdown({ theme, onToggleTheme, onOpenNotifications, onOpenProfile, onLogout }: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all hover:scale-105 active:scale-95"
        >
          {user.avatar}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 glass-card border-violet-200/20 dark:border-violet-700/20" dir="rtl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <Shield className="h-4 w-4 text-violet-500" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm">نقش</span>
              <Badge className="badge-gradient text-[9px]">{user.role}</Badge>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onOpenNotifications}>
            <Bell className="h-4 w-4 text-amber-500" />
            <span className="text-sm">اعلان‌ها</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onToggleTheme}>
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-violet-500" />
            )}
            <span className="text-sm">{theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">تنظیمات</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onOpenProfile}>
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">پروفایل</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer text-red-500 focus:text-red-500" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          <span className="text-sm">خروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
