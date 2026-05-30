import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/products/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: {
        productCategory: true,
        inventory: {
          include: {
            inboundRecords: true,
            outboundRecords: true,
          },
        },
        orderItems: { include: { order: true } },
        invoiceItems: { include: { invoice: true } },
      },
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json(product)
  } catch (error) {
    console.error('GET /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PUT /api/products/:id — partial update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const { name, sku, description, price, salePrice, cost, status, featured, images, productCategoryId } = body

    const product = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(sku !== undefined && { sku }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(salePrice !== undefined && { salePrice: salePrice === null ? null : salePrice }),
        ...(cost !== undefined && { cost }),
        ...(status !== undefined && { status }),
        ...(featured !== undefined && { featured }),
        ...(images !== undefined && { images }),
        ...(productCategoryId !== undefined && { productCategoryId: productCategoryId || null }),
      },
      include: {
        productCategory: true,
        inventory: true,
        orderItems: true,
        invoiceItems: true,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/products/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete related records first
    await db.invoiceItem.deleteMany({ where: { productId: id } })
    await db.orderItem.deleteMany({ where: { productId: id } })
    await db.outboundRecord.deleteMany({ where: { inventoryItem: { productId: id } } })
    await db.inboundRecord.deleteMany({ where: { inventoryItem: { productId: id } } })
    await db.inventoryItem.deleteMany({ where: { productId: id } })

    await db.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
