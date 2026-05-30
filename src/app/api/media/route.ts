import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// GET all media or GET by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (id) {
      const media = await db.media.findUnique({ where: { id } })
      if (!media) {
        return NextResponse.json({ error: 'Media not found' }, { status: 404 })
      }
      return NextResponse.json(media)
    }

    const where: Record<string, unknown> = {}
    if (type) where.type = type

    const [media, total] = await Promise.all([
      db.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.media.count({ where }),
    ])

    return NextResponse.json({ media, total, page, limit })
  } catch (error) {
    console.error('GET /api/media error:', error)
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 })
  }
}

// POST upload/create media (handles FormData file upload)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string | null
    const alt = formData.get('alt') as string | null

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine file type
    const mimeType = file.type || ''
    let fileType = 'other'
    if (mimeType.startsWith('image/')) fileType = 'image'
    else if (mimeType.startsWith('video/')) fileType = 'video'
    else if (mimeType.startsWith('audio/')) fileType = 'audio'
    else if (mimeType.includes('pdf')) fileType = 'document'

    // Save file to public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.name) || `.${mimeType.split('/')[1] || 'bin'}`
    const filename = `media-${uniqueSuffix}${ext}`
    const filePath = path.join(uploadDir, filename)

    await writeFile(filePath, buffer)

    // Determine URL path
    const url = `/uploads/${filename}`

    // Save to database
    const media = await db.media.create({
      data: {
        name: name || file.name,
        filename,
        url,
        type: fileType,
        size: file.size,
        alt: alt || '',
      },
    })

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    console.error('POST /api/media error:', error)
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 })
  }
}

// PUT update media metadata
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, alt } = body

    if (!id) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 })
    }

    const media = await db.media.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(alt !== undefined && { alt }),
      },
    })

    return NextResponse.json(media)
  } catch (error) {
    console.error('PUT /api/media error:', error)
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 })
  }
}

// DELETE media
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 })
    }

    const media = await db.media.findUnique({ where: { id } })
    if (media) {
      // Try to delete the physical file
      try {
        const { unlink } = await import('fs/promises')
        const filePath = path.join(process.cwd(), 'public', media.filename)
        await unlink(filePath).catch(() => {})
      } catch {
        // Ignore file deletion errors
      }
    }

    await db.media.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/media error:', error)
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 })
  }
}
