import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all posts or GET by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (id) {
      const post = await db.post.findUnique({
        where: { id },
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
          category: true,
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
      })
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json(post)
    }

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (categoryId) where.categoryId = categoryId
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
    }

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
          category: true,
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.post.count({ where }),
    ])

    return NextResponse.json({ posts, total, page, limit })
  } catch (error) {
    console.error('GET /api/posts error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, slug, content, excerpt, status, featured, authorId, categoryId, tagIds } = body

    if (!title || !slug || !authorId) {
      return NextResponse.json({ error: 'Title, slug, and authorId are required' }, { status: 400 })
    }

    const post = await db.post.create({
      data: {
        title,
        slug,
        content: content || '',
        excerpt: excerpt || '',
        status: status || 'draft',
        featured: featured || false,
        authorId,
        categoryId: categoryId || null,
        publishedAt: status === 'published' ? new Date() : null,
        tags: tagIds?.length
          ? {
              create: tagIds.map((tagId: string) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        category: true,
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('POST /api/posts error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

// PUT update a post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, slug, content, excerpt, status, featured, categoryId, tagIds } = body

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    // If updating tags, first delete existing relations
    if (tagIds !== undefined) {
      await db.postTag.deleteMany({ where: { postId: id } })
    }

    const post = await db.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(status !== undefined && {
          status,
          publishedAt: status === 'published' ? new Date() : null,
        }),
        ...(featured !== undefined && { featured }),
        ...(categoryId !== undefined && { categoryId }),
        ...(tagIds !== undefined && {
          tags: {
            create: tagIds.map((tagId: string) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        }),
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        category: true,
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('PUT /api/posts error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// DELETE a post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    // Delete post-tag relations first
    await db.postTag.deleteMany({ where: { postId: id } })
    // Delete comments first
    await db.comment.deleteMany({ where: { postId: id } })

    await db.post.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/posts error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
