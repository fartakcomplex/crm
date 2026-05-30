import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const inventoryItem = await db.inventoryItem.findUnique({
      where: { id },
      include: {
        product: true,
        inboundRecords: { orderBy: { createdAt: 'desc' } },
        outboundRecords: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!inventoryItem) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }
    return NextResponse.json(inventoryItem)
  } catch (error) {
    console.error('GET /api/inventory/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory item' }, { status: 500 })
  }
}

// PUT /api/inventory/:id — partial update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.inventoryItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    const { stock, minStock, warehouse, location, lastRestocked } = body

    const inventoryItem = await db.inventoryItem.update({
      where: { id },
      data: {
        ...(stock !== undefined && { stock }),
        ...(minStock !== undefined && { minStock }),
        ...(warehouse !== undefined && { warehouse }),
        ...(location !== undefined && { location }),
        ...(lastRestocked !== undefined && { lastRestocked: lastRestocked ? new Date(lastRestocked) : null }),
      },
      include: {
        product: true,
        inboundRecords: { orderBy: { createdAt: 'desc' } },
        outboundRecords: { orderBy: { createdAt: 'desc' } },
      },
    })

    return NextResponse.json(inventoryItem)
  } catch (error) {
    console.error('PUT /api/inventory/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 })
  }
}

// DELETE /api/inventory/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.inventoryItem.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    // Delete related records first
    await db.outboundRecord.deleteMany({ where: { inventoryItemId: id } })
    await db.inboundRecord.deleteMany({ where: { inventoryItemId: id } })

    await db.inventoryItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/inventory/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
  }
}
