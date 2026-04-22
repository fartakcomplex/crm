import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks — list all tasks
export async function GET() {
  try {
    const tasks = await db.task.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ tasks, total: tasks.length })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/tasks — create task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, status, priority, assigneeId, dueDate, tags } = body
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const task = await db.task.create({
      data: {
        title: title.trim(),
        description: description ?? '',
        status: status ?? 'todo',
        priority: priority ?? 'medium',
        assigneeId: assigneeId ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags ?? '',
      },
    })
    return NextResponse.json(task, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

// PUT /api/tasks — bulk update (mark all done, etc.)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.bulkUpdate && body.ids) {
      await db.task.updateMany({
        where: { id: { in: body.ids } },
        data: { status: body.status ?? 'done' },
      })
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Failed to update tasks' }, { status: 500 })
  }
}
