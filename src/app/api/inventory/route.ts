import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all inventory items (with includes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const warehouse = searchParams.get('warehouse')
    const lowStock = searchParams.get('lowStock')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (warehouse) where.warehouse = warehouse
    if (lowStock === 'true') {
      // SQLite comparison: stock <= minStock
      where.stock = { lte: 0 } // Prisma filter fallback — we filter in-app below if needed
    }
    if (search) {
      where.OR = [
        { product: { name: { contains: search } } },
        { product: { sku: { contains: search } } },
        { warehouse: { contains: search } },
        { location: { contains: search } },
      ]
    }

    const [inventoryItems, total] = await Promise.all([
      db.inventoryItem.findMany({
        where,
        include: {
          product: true,
          inboundRecords: { orderBy: { createdAt: 'desc' } },
          outboundRecords: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.inventoryItem.count({ where }),
    ])

    // Filter low stock in-memory for SQLite
    const filtered = lowStock === 'true'
      ? inventoryItems.filter((item: { stock: number; minStock: number }) => item.stock <= item.minStock)
      : inventoryItems

    const filteredTotal = lowStock === 'true'
      ? await db.inventoryItem.count()
      : total

    return NextResponse.json({
      inventoryItems: filtered,
      total: lowStock === 'true' ? filtered.length : filteredTotal,
      page,
      limit,
    })
  } catch (error) {
    console.error('GET /api/inventory error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory items' }, { status: 500 })
  }
}

// POST create a new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, stock, minStock, warehouse, location, lastRestocked } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const inventoryItem = await db.inventoryItem.create({
      data: {
        productId,
        stock: stock || 0,
        minStock: minStock || 5,
        warehouse: warehouse || 'main',
        location: location || '',
        lastRestocked: lastRestocked ? new Date(lastRestocked) : null,
      },
      include: {
        product: true,
        inboundRecords: true,
        outboundRecords: true,
      },
    })

    return NextResponse.json(inventoryItem, { status: 201 })
  } catch (error) {
    console.error('POST /api/inventory error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json({ error: 'Inventory item for this product already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}
