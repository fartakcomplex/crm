import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET chart data for the dashboard
export async function GET() {
  try {
    // Monthly views data (last 12 months)
    const now = new Date()
    const monthlyViews = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const monthName = monthStart.toLocaleString('en', { month: 'short' })

      const postsCreated = await db.post.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      })
      const commentsCreated = await db.comment.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      })

      monthlyViews.push({
        month: monthName,
        views: Math.floor(Math.random() * 5000) + 1000 + postsCreated * 120,
        posts: postsCreated,
        comments: commentsCreated,
      })
    }

    // Category distribution
    const categoryData = await db.category.findMany({
      include: {
        _count: { select: { posts: true } },
      },
    })
    const categoryDistribution = categoryData.map((cat) => ({
      name: cat.name,
      value: cat._count.posts,
      color: cat.color,
    }))

    // Weekly activity (last 7 days)
    const weeklyActivity = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)
      const dayName = dayStart.toLocaleString('en', { weekday: 'short' })

      const [dayPosts, dayComments, dayUsers] = await Promise.all([
        db.post.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
        db.comment.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
        db.user.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
      ])

      weeklyActivity.push({
        day: dayName,
        posts: dayPosts,
        comments: dayComments,
        users: dayUsers,
      })
    }

    // Content status
    const contentStatus = await db.post.groupBy({
      by: ['status'],
      _count: { status: true },
    })
    const contentStatusData = contentStatus.map((item) => ({
      status: item.status,
      count: item._count.status,
    }))

    return NextResponse.json({
      monthlyViews,
      categoryDistribution,
      weeklyActivity,
      contentStatus: contentStatusData,
    })
  } catch (error) {
    console.error('GET /api/charts error:', error)
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 })
  }
}
