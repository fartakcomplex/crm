import { NextResponse } from 'next/server'
import { restoreFromBackup, deleteBackup, getBackupDetail, verifyBackupIntegrity } from '@/lib/backup'
import { db } from '@/lib/db'
import { existsSync, createReadStream, statSync } from 'fs'

// ─── GET: Download backup file ──────────────────────────────────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = new URL(request.url).searchParams
    const detail = searchParams.get('detail') === 'true'
    const verify = searchParams.get('verify') === 'true'

    const record = await db.backupRecord.findUnique({
      where: { id },
    })

    if (!record) {
      return NextResponse.json({ error: 'بکاپ یافت نشد' }, { status: 404 })
    }

    // Return backup detail
    if (detail) {
      const backupDetail = await getBackupDetail(id)
      return NextResponse.json(backupDetail)
    }

    // Return verification result
    if (verify && record.filePath) {
      const integrity = await verifyBackupIntegrity(record.filePath)
      return NextResponse.json(integrity)
    }

    // Download backup file
    if (!existsSync(record.filePath)) {
      return NextResponse.json({ error: 'فایل بکاپ وجود ندارد' }, { status: 404 })
    }

    const stats = statSync(record.filePath)

    return new NextResponse(createReadStream(record.filePath), {
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="${record.filename}"`,
        'Content-Length': String(stats.size),
      },
    })
  } catch (error) {
    console.error('Error in backup [id] GET:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در دریافت بکاپ' },
      { status: 500 }
    )
  }
}

// ─── POST: Restore from backup ──────────────────────────────────────────────
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await restoreFromBackup(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در بازیابی بکاپ' },
      { status: 500 }
    )
  }
}

// ─── DELETE: Delete a backup ────────────────────────────────────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteBackup(id)
    return NextResponse.json({ success: true, message: 'بکاپ با موفقیت حذف شد' })
  } catch (error) {
    console.error('Error deleting backup:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در حذف بکاپ' },
      { status: 500 }
    )
  }
}
