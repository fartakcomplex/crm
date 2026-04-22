import { existsSync, copyFileSync, statSync, unlinkSync, mkdirSync } from 'fs'
import { join } from 'path'
import { db } from '@/lib/db'

// ─── Config ──────────────────────────────────────────────────────────────────
const BACKUP_DIR = join(process.cwd(), 'backups')
const DB_SOURCE_PATH = join(process.cwd(), 'db', 'custom.db')
const MAX_DAILY_BACKUPS = 30
const MAX_WEEKLY_BACKUPS = 12
const MAX_MANUAL_BACKUPS = 50

// Ensure backup directory exists
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true })
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface BackupInfo {
  id: string
  filename: string
  filePath: string
  sizeBytes: number
  type: 'daily' | 'weekly' | 'manual'
  status: 'completed' | 'failed' | 'restoring'
  note: string
  createdAt: Date
}

export interface CreateBackupOptions {
  type?: 'daily' | 'weekly' | 'manual'
  note?: string
}

// ─── Helper: Format file size ────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ─── Helper: Generate backup filename ───────────────────────────────────────
function generateFilename(type: string): string {
  const now = new Date()
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `backup_${type}_${dateStr}.db`
}

// ─── Helper: Persian relative time ──────────────────────────────────────────
export function persianRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)
  const diffWeek = Math.floor(diffDay / 7)

  if (diffMin < 1) return 'همین الان'
  if (diffMin < 60) return `${diffMin} دقیقه پیش`
  if (diffHour < 24) return `${diffHour} ساعت پیش`
  if (diffDay < 7) return `${diffDay} روز پیش`
  if (diffWeek < 4) return `${diffWeek} هفته پیش`
  return new Intl.DateTimeFormat('fa-IR').format(new Date(date))
}

// ─── Helper: Persian formatted date ─────────────────────────────────────────
export function persianFormattedDate(date: Date): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// ─── Create Backup ──────────────────────────────────────────────────────────
export async function createBackup(options: CreateBackupOptions = {}): Promise<BackupInfo> {
  const { type = 'manual', note = '' } = options

  if (!existsSync(DB_SOURCE_PATH)) {
    throw new Error('فایل دیتابیس یافت نشد')
  }

  const filename = generateFilename(type)
  const filePath = join(BACKUP_DIR, filename)

  try {
    // Simple file copy for SQLite backup
    // Note: For production, consider using SQLite online backup API
    copyFileSync(DB_SOURCE_PATH, filePath)

    const sizeBytes = statSync(filePath).size

    // Save record to database
    const record = await db.backupRecord.create({
      data: {
        filename,
        filePath,
        sizeBytes,
        type,
        status: 'completed',
        note,
      },
    })

    // Cleanup old backups of same type
    await cleanupOldBackups(type)

    return record as unknown as BackupInfo
  } catch (error) {
    // Save failed record
    const record = await db.backupRecord.create({
      data: {
        filename,
        filePath,
        sizeBytes: 0,
        type,
        status: 'failed',
        note: `خطا: ${error instanceof Error ? error.message : 'نامشخص'}`,
      },
    })

    throw new Error(`خطا در ایجاد بکاپ: ${error instanceof Error ? error.message : 'نامشخص'}`)
  }
}

// ─── Restore from Backup ────────────────────────────────────────────────────
export async function restoreFromBackup(backupId: string): Promise<void> {
  const record = await db.backupRecord.findUnique({
    where: { id: backupId },
  })

  if (!record) {
    throw new Error('رکورد بکاپ یافت نشد')
  }

  if (!existsSync(record.filePath)) {
    throw new Error('فایل بکاپ یافت نشد')
  }

  try {
    // Update status to restoring
    await db.backupRecord.update({
      where: { id: backupId },
      data: { status: 'restoring' },
    })

    // Create a pre-restore safety backup
    const safetyFilename = `pre_restore_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.db`
    const safetyPath = join(BACKUP_DIR, safetyFilename)
    copyFileSync(DB_SOURCE_PATH, safetyPath)

    // Restore: copy backup file over current database
    copyFileSync(record.filePath, DB_SOURCE_PATH)

    // Mark as completed
    await db.backupRecord.update({
      where: { id: backupId },
      data: { status: 'completed' },
    })

    // Record the safety backup
    await db.backupRecord.create({
      data: {
        filename: safetyFilename,
        filePath: safetyPath,
        sizeBytes: statSync(safetyPath).size,
        type: 'manual',
        status: 'completed',
        note: 'بکاپ ایمنی قبل از بازیابی',
      },
    })
  } catch (error) {
    await db.backupRecord.update({
      where: { id: backupId },
      data: { status: 'failed' },
    })
    throw new Error(`خطا در بازیابی: ${error instanceof Error ? error.message : 'نامشخص'}`)
  }
}

// ─── List Backups ───────────────────────────────────────────────────────────
export async function listBackups(type?: string): Promise<BackupInfo[]> {
  const where = type ? { type } : {}
  const records = await db.backupRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
  return records as unknown as BackupInfo[]
}

// ─── Delete Backup ──────────────────────────────────────────────────────────
export async function deleteBackup(backupId: string): Promise<void> {
  const record = await db.backupRecord.findUnique({
    where: { id: backupId },
  })

  if (!record) {
    throw new Error('رکورد بکاپ یافت نشد')
  }

  // Delete file from disk
  if (existsSync(record.filePath)) {
    try {
      unlinkSync(record.filePath)
    } catch {
      // File may already be deleted
    }
  }

  // Delete record from database
  await db.backupRecord.delete({
    where: { id: backupId },
  })
}

// ─── Cleanup Old Backups ────────────────────────────────────────────────────
async function cleanupOldBackups(type: string): Promise<number> {
  const maxMap: Record<string, number> = {
    daily: MAX_DAILY_BACKUPS,
    weekly: MAX_WEEKLY_BACKUPS,
    manual: MAX_MANUAL_BACKUPS,
  }

  const maxBackups = maxMap[type] || MAX_MANUAL_BACKUPS

  const records = await db.backupRecord.findMany({
    where: { type, status: 'completed' },
    orderBy: { createdAt: 'desc' },
    skip: maxBackups,
  })

  let deleted = 0
  for (const record of records) {
    try {
      if (existsSync(record.filePath)) {
        unlinkSync(record.filePath)
      }
      await db.backupRecord.delete({ where: { id: record.id } })
      deleted++
    } catch {
      // Skip failed deletions
    }
  }

  return deleted
}

// ─── Get Backup Stats ───────────────────────────────────────────────────────
export async function getBackupStats(): Promise<{
  totalBackups: number
  totalSize: number
  dailyCount: number
  weeklyCount: number
  manualCount: number
  lastDailyBackup: Date | null
  lastWeeklyBackup: Date | null
  dbSize: number
}> {
  const [totalBackups, records, dbStats] = await Promise.all([
    db.backupRecord.count({ where: { status: 'completed' } }),
    db.backupRecord.findMany({ where: { status: 'completed' } }),
    db.backupRecord.aggregate({ _sum: { sizeBytes: true } }),
  ])

  const dailyRecords = records.filter(r => r.type === 'daily')
  const weeklyRecords = records.filter(r => r.type === 'weekly')
  const manualRecords = records.filter(r => r.type === 'manual')

  const totalSize = records.reduce((sum, r) => sum + r.sizeBytes, 0)
  const dbSize = existsSync(DB_SOURCE_PATH) ? statSync(DB_SOURCE_PATH).size : 0

  return {
    totalBackups,
    totalSize,
    dailyCount: dailyRecords.length,
    weeklyCount: weeklyRecords.length,
    manualCount: manualRecords.length,
    lastDailyBackup: dailyRecords.length > 0 ? dailyRecords[0].createdAt : null,
    lastWeeklyBackup: weeklyRecords.length > 0 ? weeklyRecords[0].createdAt : null,
    dbSize,
  }
}

// ─── Check if Auto Backup is Needed ─────────────────────────────────────────
export async function shouldRunAutoBackup(type: 'daily' | 'weekly'): Promise<boolean> {
  const record = await db.backupRecord.findFirst({
    where: { type, status: 'completed' },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) return true

  const lastBackup = new Date(record.createdAt)
  const now = new Date()

  if (type === 'daily') {
    // Run if last backup is older than 24 hours
    const diffHours = (now.getTime() - lastBackup.getTime()) / 3600000
    return diffHours >= 24
  }

  if (type === 'weekly') {
    // Run if last backup is older than 7 days
    const diffDays = (now.getTime() - lastBackup.getTime()) / 86400000
    return diffDays >= 7
  }

  return false
}

// ─── Run Auto Backup Check ──────────────────────────────────────────────────
export async function runAutoBackupCheck(): Promise<{
  dailyRun: boolean
  weeklyRun: boolean
  message: string
}> {
  const results = { dailyRun: false, weeklyRun: false, message: '' }
  const messages: string[] = []

  // Check daily
  if (await shouldRunAutoBackup('daily')) {
    try {
      await createBackup({ type: 'daily', note: 'بکاپ خودکار روزانه' })
      results.dailyRun = true
      messages.push('بکاپ روزانه ایجاد شد')
    } catch (error) {
      messages.push(`خطا در بکاپ روزانه: ${error instanceof Error ? error.message : ''}`)
    }
  }

  // Check weekly
  if (await shouldRunAutoBackup('weekly')) {
    try {
      await createBackup({ type: 'weekly', note: 'بکاپ خودکار هفتگی (فول)' })
      results.weeklyRun = true
      messages.push('بکاپ هفتگی ایجاد شد')
    } catch (error) {
      messages.push(`خطا در بکاپ هفتگی: ${error instanceof Error ? error.message : ''}`)
    }
  }

  results.message = messages.length > 0 ? messages.join(' | ') : 'بکاپ جدیدی لازم نیست'

  return results
}
