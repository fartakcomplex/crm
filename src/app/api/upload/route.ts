import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
]

// MIME type to extension mapping (for edge cases)
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
}

function getFileType(ext: string): string {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  if (imageExts.includes(ext)) return 'image'
  if (ext === 'pdf' || ext === 'doc' || ext === 'docx' || ext === 'xls' || ext === 'xlsx') return 'document'
  return 'other'
}

// Check if content type is multipart
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'درخواست باید به فرمت multipart/form-data باشد' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const alt = (formData.get('alt') as string) || ''

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'فایلی انتخاب نشده است' },
        { status: 400 }
      )
    }

    // Determine extension
    const originalExt = path.extname(file.name).toLowerCase().replace('.', '')
    let ext = originalExt || MIME_TO_EXT[file.type] || ''

    // Validate extension
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: `فرمت فایل پشتیبانی نمی‌شود. فرمت‌های مجاز: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 415 }
      )
    }

    // Read file bytes
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename with timestamp prefix
    const timestamp = Date.now()
    const random = Math.round(Math.random() * 1e9).toString(36)
    const filename = `${timestamp}-${random}.${ext}`
    const filePath = path.join(uploadDir, filename)

    // Write file to disk
    await writeFile(filePath, buffer)

    // Determine file type for categorization
    const fileType = getFileType(ext)

    // Create Media record in database via Prisma
    const mediaRecord = await db.media.create({
      data: {
        name: file.name,
        filename,
        url: `/uploads/${filename}`,
        type: fileType,
        size: file.size,
        alt,
      },
    })

    return NextResponse.json({
      success: true,
      file: {
        name: mediaRecord.name,
        filename: mediaRecord.filename,
        url: mediaRecord.url,
        type: mediaRecord.type,
        size: mediaRecord.size,
        alt: mediaRecord.alt,
      },
    })
  } catch (error) {
    console.error('POST /api/upload error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری فایل' },
      { status: 500 }
    )
  }
}
