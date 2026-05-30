import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET dashboard stats
export async function GET() {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalPosts,
      totalUsers,
      totalCustomers,
      totalProjects,
      totalComments,
      totalMedia,
      totalProducts,
      totalOrders,
      publishedPosts,
      draftPosts,
      pendingComments,
      activeUsers,
      activeCustomers,
      activeProjects,
      recentActivity,
      pendingTasks,
    ] = await Promise.all([
      db.post.count(),
      db.user.count(),
      db.customer.count(),
      db.project.count(),
      db.comment.count(),
      db.media.count(),
      db.product.count(),
      db.order.count(),
      db.post.count({ where: { status: 'published' } }),
      db.post.count({ where: { status: 'draft' } }),
      db.comment.count({ where: { status: 'pending' } }),
      db.user.count({ where: { status: 'active' } }),
      db.customer.count({ where: { status: 'active' } }),
      db.project.count({ where: { status: { in: ['active', 'in-progress'] } } }),
      db.activityLog.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      db.task.count({ where: { status: { in: ['todo', 'in_progress'] } } }),
    ])

    // Calculate total revenue from customers
    const customerAgg = await db.customer.aggregate({
      _sum: { value: true },
    })
    const totalRevenue = customerAgg._sum.value || 0

    // Calculate average project progress
    const projectAgg = await db.project.aggregate({
      _avg: { progress: true },
    })
    const avgProjectProgress = Math.round(projectAgg._avg.progress || 0)

    // Posts by status
    const postsByStatus = await db.post.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    return NextResponse.json({
      overview: {
        totalPosts,
        totalUsers,
        totalCustomers,
        totalProjects,
        totalComments,
        totalMedia,
        totalProducts,
        totalOrders,
      },
      content: {
        published: publishedPosts,
        drafts: draftPosts,
        pendingComments,
      },
      engagement: {
        totalViews: totalPosts * 142, // Simulated view count
        totalRevenue,
      },
      users: {
        active: activeUsers,
      },
      customers: {
        active: activeCustomers,
      },
      projects: {
        active: activeProjects,
        avgProgress: avgProjectProgress,
      },
      postsByStatus,
      summary: {
        totalPosts,
        totalUsers,
        totalOrders,
        totalRevenue,
        recentActivity,
        pendingTasks,
      },
    })
  } catch (error) {
    console.error('GET /api/stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
