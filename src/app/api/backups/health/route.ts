import { NextResponse } from 'next/server'
import { getSystemHealth } from '@/lib/backup'

// ─── GET: System health check for backup ────────────────────────────────────
export async function GET() {
  try {
    const health = await getSystemHealth()
    return NextResponse.json(health)
  } catch (error) {
    console.error('Error checking system health:', error)
    return NextResponse.json(
      { error: 'خطا در بررسی سلامت سیستم' },
      { status: 500 }
    )
  }
}
