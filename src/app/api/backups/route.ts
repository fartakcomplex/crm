import { NextResponse } from 'next/server'
import { createBackup, listBackups, getBackupStats, runAutoBackupCheck } from '@/lib/backup'

// ─── GET: List all backups + stats ──────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const statsOnly = searchParams.get('stats') === 'true'

    if (statsOnly) {
      const stats = await getBackupStats()
      return NextResponse.json(stats)
    }

    const [backups, stats] = await Promise.all([
      listBackups(type as string | undefined),
      getBackupStats(),
    ])

    return NextResponse.json({ backups, stats })
  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت لیست بکاپ‌ها' },
      { status: 500 }
    )
  }
}

// ─── POST: Create a new backup or run auto-check ────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type = 'manual', note = '', autoCheck = false } = body

    if (autoCheck) {
      const result = await runAutoBackupCheck()
      return NextResponse.json(result)
    }

    const backup = await createBackup({ type, note })
    return NextResponse.json(backup, { status: 201 })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در ایجاد بکاپ' },
      { status: 500 }
    )
  }
}
