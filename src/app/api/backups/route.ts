import { NextResponse } from 'next/server'
import { createBackup, listBackups, getBackupStats, runAutoBackupCheck, restoreFromUploadedFile } from '@/lib/backup'

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

// ─── POST: Create backup, run auto-check, or upload file ────────────────────
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // Handle file upload (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json(
          { error: 'فایلی ارسال نشده است' },
          { status: 400 }
        )
      }

      // Validate file type
      if (!file.name.endsWith('.db') && !file.name.endsWith('.sqlite') && !file.name.endsWith('.sqlite3')) {
        return NextResponse.json(
          { error: 'فرمت فایل باید .db یا .sqlite باشد' },
          { status: 400 }
        )
      }

      // Validate file size (max 500MB)
      const MAX_SIZE = 500 * 1024 * 1024
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: 'حجم فایل بیش از حد مجاز (۵۰۰ مگابایت) است' },
          { status: 400 }
        )
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await restoreFromUploadedFile(buffer, file.name)

      return NextResponse.json(result, { status: 200 })
    }

    // Handle JSON request
    const body = await request.json()
    const { type = 'manual', note = '', autoCheck = false } = body

    if (autoCheck) {
      const result = await runAutoBackupCheck()
      return NextResponse.json(result)
    }

    const backup = await createBackup({ type, note })
    return NextResponse.json(backup, { status: 201 })
  } catch (error) {
    console.error('Error in backup POST:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در عملیات بکاپ' },
      { status: 500 }
    )
  }
}
