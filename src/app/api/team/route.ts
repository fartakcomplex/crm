import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all team members or GET by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const department = searchParams.get('department')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (id) {
      const member = await db.teamMember.findUnique({ where: { id } })
      if (!member) {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
      }
      return NextResponse.json(member)
    }

    const where: Record<string, unknown> = {}
    if (department) where.department = department
    if (role) where.role = role
    if (status) where.status = status

    const [members, total] = await Promise.all([
      db.teamMember.findMany({
        where,
        orderBy: { joinedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.teamMember.count({ where }),
    ])

    return NextResponse.json({ members, total, page, limit })
  } catch (error) {
    console.error('GET /api/team error:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

// POST create a new team member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, department, avatar, status } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const member = await db.teamMember.create({
      data: {
        name,
        email,
        role: role || 'member',
        department: department || '',
        avatar: avatar || '',
        status: status || 'active',
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('POST /api/team error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}

// PUT update a team member
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, email, role, department, avatar, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Team member ID is required' }, { status: 400 })
    }

    const member = await db.teamMember.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(department !== undefined && { department }),
        ...(avatar !== undefined && { avatar }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('PUT /api/team error:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}

// DELETE a team member
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Team member ID is required' }, { status: 400 })
    }

    await db.teamMember.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/team error:', error)
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 })
  }
}
