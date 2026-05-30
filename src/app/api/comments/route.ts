import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all comments or GET by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const postId = searchParams.get('postId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (id) {
      const comment = await db.comment.findUnique({
        where: { id },
        include: {
          post: { select: { id: true, title: true, slug: true } },
        },
      })
      if (!comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
      }
      return NextResponse.json(comment)
    }

    const where: Record<string, unknown> = {}
    if (postId) where.postId = postId
    if (status) where.status = status

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where,
        include: {
          post: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.comment.count({ where }),
    ])

    return NextResponse.json({ comments, total, page, limit })
  } catch (error) {
    console.error('GET /api/comments error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST create a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, author, email, status, postId } = body

    if (!content || !postId) {
      return NextResponse.json({ error: 'Content and postId are required' }, { status: 400 })
    }

    // Verify post exists
    const post = await db.post.findUnique({ where: { id: postId } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const comment = await db.comment.create({
      data: {
        content,
        author: author || '',
        email: email || '',
        status: status || 'pending',
        postId,
      },
      include: {
        post: { select: { id: true, title: true, slug: true } },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('POST /api/comments error:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}

// PUT update a comment (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, content, author, email, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
    }

    const comment = await db.comment.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(author !== undefined && { author }),
        ...(email !== undefined && { email }),
        ...(status !== undefined && { status }),
      },
      include: {
        post: { select: { id: true, title: true, slug: true } },
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('PUT /api/comments error:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

// DELETE a comment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
    }

    await db.comment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/comments error:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
