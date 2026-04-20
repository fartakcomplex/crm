import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all tags
export async function GET() {
  try {
    const tags = await db.tag.findMany({
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(tags)
  } catch (error) {
    console.error('GET /api/tags error:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

// POST create a new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const tag = await db.tag.create({
      data: {
        name,
        slug,
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('POST /api/tags error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json({ error: 'Name or slug already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}

// DELETE a tag
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    // Delete PostTag relations first
    await db.postTag.deleteMany({ where: { tagId: id } })

    await db.tag.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/tags error:', error)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}
