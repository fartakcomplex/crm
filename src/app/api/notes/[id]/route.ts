import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/notes/:id — update note
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const note = await db.quickNote.update({
      where: { id },
      data: {
        ...(body.content !== undefined && { content: body.content }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.pinned !== undefined && { pinned: body.pinned }),
      },
    })
    return NextResponse.json(note)
  } catch {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

// DELETE /api/notes/:id — delete note
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.quickNote.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
