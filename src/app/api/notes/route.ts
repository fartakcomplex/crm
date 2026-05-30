import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/notes — list all notes
export async function GET() {
  try {
    const notes = await db.quickNote.findMany({
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ notes, total: notes.length })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

// POST /api/notes — create note
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, color } = body
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    const note = await db.quickNote.create({
      data: {
        content: content.trim(),
        color: color ?? 'yellow',
      },
    })
    return NextResponse.json(note, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}
