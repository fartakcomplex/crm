import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all categories
export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('GET /api/categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, color } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const category = await db.category.create({
      data: {
        name,
        slug,
        color: color || '#6366f1',
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('POST /api/categories error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json({ error: 'Name or slug already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PUT update a category
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, slug, color } = body

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(color !== undefined && { color }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('PUT /api/categories error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE a category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // Remove categoryId from posts that reference this category
    await db.post.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    })

    await db.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/categories error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
