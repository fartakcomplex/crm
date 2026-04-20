import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all users or GET by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (id) {
      const user = await db.user.findUnique({
        where: { id },
        include: {
          _count: { select: { posts: true, activities: true } },
        },
      })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      return NextResponse.json(user)
    }

    const where: Record<string, unknown> = {}
    if (role) where.role = role
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          _count: { select: { posts: true, activities: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({ users, total, page, limit })
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, avatar, status } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        role: role || 'editor',
        avatar: avatar || '',
        status: status || 'active',
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('POST /api/users error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

// PUT update a user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, email, role, avatar, status } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(avatar !== undefined && { avatar }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('PUT /api/users error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/users error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
