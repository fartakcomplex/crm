import { existsSync, copyFileSync, statSync, unlinkSync, mkdirSync, writeFileSync, createReadStream } from 'fs'
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

export interface BackupDetailInfo extends BackupInfo {
  fileExists: boolean
  currentDbSize: number
  sizeDifference: number
  ageHours: number
  isHealthy: boolean
}

export interface CreateBackupOptions {
  type?: 'daily' | 'weekly' | 'manual'
  note?: string
}

export interface SystemHealthInfo {
  dbExists: boolean
  dbSize: number
  dbWritable: boolean
  dbReadable: boolean
  backupDirExists: boolean
  backupDirWritable: boolean
  totalBackupCount: number
  lastBackupDate: Date | null
  estimatedDiskUsage: number
  isHealthy: boolean
  issues: string[]
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
    copyFileSync(DB_SOURCE_PATH, filePath)
    const sizeBytes = statSync(filePath).size

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

    await cleanupOldBackups(type)

    return record as unknown as BackupInfo
  } catch (error) {
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

// ─── Restore from Backup (by ID) ───────────────────────────────────────────
export async function restoreFromBackup(backupId: string): Promise<{
  success: boolean
  message: string
  safetyBackupId?: string
}> {
  const record = await db.backupRecord.findUnique({
    where: { id: backupId },
  })

  if (!record) {
    throw new Error('رکورد بکاپ یافت نشد')
  }

  if (!existsSync(record.filePath)) {
    throw new Error('فایل بکاپ روی دیسک وجود ندارد')
  }

  // Verify integrity before restoring
  const integrity = await verifyBackupIntegrity(record.filePath)
  if (!integrity.isValid) {
    throw new Error(`فایل بکاپ آسیب‌دیده: ${integrity.issues.join(', ')}`)
  }

  try {
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
    const safetyRecord = await db.backupRecord.create({
      data: {
        filename: safetyFilename,
        filePath: safetyPath,
        sizeBytes: statSync(safetyPath).size,
        type: 'manual',
        status: 'completed',
        note: `بکاپ ایمنی قبل از بازیابی از: ${record.filename}`,
      },
    })

    return {
      success: true,
      message: 'بازیابی با موفقیت انجام شد',
      safetyBackupId: safetyRecord.id,
    }
  } catch (error) {
    await db.backupRecord.update({
      where: { id: backupId },
      data: { status: 'failed' },
    })
    throw new Error(`خطا در بازیابی: ${error instanceof Error ? error.message : 'نامشخص'}`)
  }
}

// ─── Restore from Uploaded File ────────────────────────────────────────────
export async function restoreFromUploadedFile(
  fileBuffer: Buffer,
  originalFilename: string
): Promise<{
  success: boolean
  message: string
  backupId?: string
}> {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('فایل بکاپ خالی است')
  }

  // Check minimum file size (a valid SQLite DB should be at least a few KB)
  if (fileBuffer.length < 1024) {
    throw new Error('فایل بکاپ خیلی کوچک است و احتمالاً معتبر نیست')
  }

  // Save uploaded file to temp location for verification
  const tempFilename = `uploaded_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.db`
  const tempPath = join(BACKUP_DIR, tempFilename)

  try {
    writeFileSync(tempPath, fileBuffer)

    // Verify integrity
    const integrity = await verifyBackupIntegrity(tempPath)
    if (!integrity.isValid) {
      unlinkSync(tempPath)
      throw new Error(`فایل بکاپ آسیب‌دیده: ${integrity.issues.join(', ')}`)
    }

    if (!existsSync(DB_SOURCE_PATH)) {
      throw new Error('فایل دیتابیس فعلی یافت نشد')
    }

    // Create safety backup of current DB
    const safetyFilename = `pre_restore_upload_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.db`
    const safetyPath = join(BACKUP_DIR, safetyFilename)
    copyFileSync(DB_SOURCE_PATH, safetyPath)

    // Save uploaded file as current database
    copyFileSync(tempPath, DB_SOURCE_PATH)

    // Create record for the uploaded backup
    const backupRecord = await db.backupRecord.create({
      data: {
        filename: originalFilename || tempFilename,
        filePath: tempPath,
        sizeBytes: statSync(tempPath).size,
        type: 'manual',
        status: 'completed',
        note: `بازیابی از فایل آپلودی: ${originalFilename}`,
      },
    })

    // Create record for safety backup
    await db.backupRecord.create({
      data: {
        filename: safetyFilename,
        filePath: safetyPath,
        sizeBytes: statSync(safetyPath).size,
        type: 'manual',
        status: 'completed',
        note: 'بکاپ ایمنی قبل از بازیابی از فایل آپلودی',
      },
    })

    return {
      success: true,
      message: 'بازیابی از فایل آپلودی با موفقیت انجام شد',
      backupId: backupRecord.id,
    }
  } catch (error) {
    // Clean up temp file if it exists
    if (existsSync(tempPath)) {
      try { unlinkSync(tempPath) } catch { /* ignore */ }
    }
    throw error
  }
}

// ─── Verify Backup Integrity ───────────────────────────────────────────────
export async function verifyBackupIntegrity(filePath: string): Promise<{
  isValid: boolean
  sizeBytes: number
  issues: string[]
}> {
  const issues: string[] = []

  if (!existsSync(filePath)) {
    return { isValid: false, sizeBytes: 0, issues: ['فایل وجود ندارد'] }
  }

  const stats = statSync(filePath)

  if (stats.size === 0) {
    issues.push('فایل خالی است')
  }

  if (stats.size < 512) {
    issues.push('فایل خیلی کوچک است (حداقل ۵۱۲ بایت)')
  }

  // Check SQLite header magic bytes
  try {
    const { readFileSync } = await import('fs')
    const fd = readFileSync(filePath)
    const header = fd.slice(0, 16).toString('utf8')
    if (!header.startsWith('SQLite format 3')) {
      issues.push('فرمت فایل SQLite معتبر نیست')
    }
  } catch {
    issues.push('خطا در خواندن هدر فایل')
  }

  return {
    isValid: issues.length === 0,
    sizeBytes: stats.size,
    issues,
  }
}

// ─── Get Backup Detail ─────────────────────────────────────────────────────
export async function getBackupDetail(backupId: string): Promise<BackupDetailInfo> {
  const record = await db.backupRecord.findUnique({
    where: { id: backupId },
  })

  if (!record) {
    throw new Error('رکورد بکاپ یافت نشد')
  }

  const fileExists = existsSync(record.filePath)
  const currentDbSize = existsSync(DB_SOURCE_PATH) ? statSync(DB_SOURCE_PATH).size : 0
  const backupSize = fileExists ? statSync(record.filePath).size : record.sizeBytes
  const ageHours = (Date.now() - new Date(record.createdAt).getTime()) / 3600000

  // Verify integrity
  let isHealthy = record.status === 'completed'
  if (fileExists && isHealthy) {
    const integrity = await verifyBackupIntegrity(record.filePath)
    isHealthy = integrity.isValid
  } else if (!fileExists) {
    isHealthy = false
  }

  return {
    ...(record as unknown as BackupInfo),
    fileExists,
    currentDbSize,
    sizeDifference: backupSize - currentDbSize,
    ageHours,
    isHealthy,
  }
}

// ─── System Health Check ───────────────────────────────────────────────────
export async function getSystemHealth(): Promise<SystemHealthInfo> {
  const issues: string[] = []

  const dbExists = existsSync(DB_SOURCE_PATH)
  const backupDirExists = existsSync(BACKUP_DIR)

  let dbSize = 0
  let dbWritable = false
  let dbReadable = false

  if (!dbExists) {
    issues.push('فایل دیتابیس وجود ندارد')
  } else {
    try {
      dbSize = statSync(DB_SOURCE_PATH).size
      dbReadable = true
    } catch {
      issues.push('دسترسی خواندن دیتابیس وجود ندارد')
    }
  }

  if (!backupDirExists) {
    issues.push('پوشه بکاپ وجود ندارد')
  }

  let backupDirWritable = false
  try {
    const testFile = join(BACKUP_DIR, '.write_test')
    writeFileSync(testFile, 'test')
    unlinkSync(testFile)
    backupDirWritable = true
  } catch {
    issues.push('دسترسی نوشتن در پوشه بکاپ وجود ندارد')
  }

  // Check backup records
  let totalBackupCount = 0
  let lastBackupDate: Date | null = null
  try {
    const count = await db.backupRecord.count({ where: { status: 'completed' } })
    totalBackupCount = count
    const lastBackup = await db.backupRecord.findFirst({
      where: { status: 'completed' },
      orderBy: { createdAt: 'desc' },
    })
    lastBackupDate = lastBackup?.createdAt ?? null

    if (count === 0) {
      issues.push('هنوز هیچ بکاپی ایجاد نشده است')
    }
  } catch {
    issues.push('خطا در بررسی رکوردهای بکاپ')
  }

  // Estimate disk usage
  let estimatedDiskUsage = 0
  try {
    const stats = await db.backupRecord.aggregate({ _sum: { sizeBytes: true } })
    estimatedDiskUsage = stats._sum.sizeBytes ?? 0
  } catch { /* ignore */ }

  // Check if DB is too old (no recent backup)
  if (lastBackupDate) {
    const daysSinceLastBackup = (Date.now() - lastBackupDate.getTime()) / 86400000
    if (daysSinceLastBackup > 2) {
      issues.push(`آخرین بکاپ ${Math.floor(daysSinceLastBackup)} روز پیش انجام شده است`)
    }
  }

  // Check disk usage threshold
  if (estimatedDiskUsage > 500 * 1024 * 1024) { // > 500MB
    issues.push(`حجم بکاپ‌ها بیش از ۵۰۰ مگابایت است`)
  }

  return {
    dbExists,
    dbSize,
    dbWritable,
    dbReadable,
    backupDirExists,
    backupDirWritable,
    totalBackupCount,
    lastBackupDate,
    estimatedDiskUsage,
    isHealthy: issues.length === 0,
    issues,
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

  if (existsSync(record.filePath)) {
    try {
      unlinkSync(record.filePath)
    } catch {
      // File may already be deleted
    }
  }

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
  const [totalBackups, records] = await Promise.all([
    db.backupRecord.count({ where: { status: 'completed' } }),
    db.backupRecord.findMany({ where: { status: 'completed' } }),
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
    const diffHours = (now.getTime() - lastBackup.getTime()) / 3600000
    return diffHours >= 24
  }

  if (type === 'weekly') {
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

  if (await shouldRunAutoBackup('daily')) {
    try {
      await createBackup({ type: 'daily', note: 'بکاپ خودکار روزانه' })
      results.dailyRun = true
      messages.push('بکاپ روزانه ایجاد شد')
    } catch (error) {
      messages.push(`خطا در بکاپ روزانه: ${error instanceof Error ? error.message : ''}`)
    }
  }

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
