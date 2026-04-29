import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all products (with includes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const productCategoryId = searchParams.get('productCategoryId')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (productCategoryId) where.productCategoryId = productCategoryId
    if (featured === 'true') where.featured = true
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          productCategory: true,
          inventory: true,
          orderItems: true,
          invoiceItems: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({ products, total, page, limit })
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, sku, description, price, salePrice, cost, status, featured, images, productCategoryId } = body

    if (!name || !sku) {
      return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        name,
        sku,
        description: description || '',
        price: price || 0,
        salePrice: salePrice !== undefined ? salePrice : null,
        cost: cost || 0,
        status: status || 'active',
        featured: featured || false,
        images: images || '[]',
        productCategoryId: productCategoryId || null,
      },
      include: {
        productCategory: true,
        inventory: true,
        orderItems: true,
        invoiceItems: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('POST /api/products error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
