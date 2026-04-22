import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all product categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [productCategories, total] = await Promise.all([
      db.productCategory.findMany({
        where,
        include: {
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.productCategory.count({ where }),
    ])

    return NextResponse.json({ productCategories, total, page, limit })
  } catch (error) {
    console.error('GET /api/product-categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch product categories' }, { status: 500 })
  }
}

// POST create a new product category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description, color } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const productCategory = await db.productCategory.create({
      data: {
        name,
        slug,
        description: description || '',
        color: color || '#6366f1',
      },
      include: {
        _count: { select: { products: true } },
      },
    })

    return NextResponse.json(productCategory, { status: 201 })
  } catch (error) {
    console.error('POST /api/product-categories error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json({ error: 'Category name or slug already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create product category' }, { status: 500 })
  }
}
