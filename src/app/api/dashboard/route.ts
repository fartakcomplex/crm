import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET Handler ─────────────────────────────────────────────────

export async function GET() {
  try {
    // Fetch monthly revenue data from orders
    const orders = await db.order.findMany({
      where: { status: { in: ['completed', 'delivered', 'shipped'] } },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by month and calculate totals
    const monthlyRevenue: Record<string, number> = {}
    for (const order of orders) {
      const monthKey = order.createdAt.toISOString().slice(0, 7) // YYYY-MM
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + order.total
    }

    // Create array of last 12 months
    const now = new Date()
    const revenueData = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toISOString().slice(0, 7)
      const monthLabel = new Intl.DateTimeFormat('fa-IR', { month: 'short' }).format(d)
      revenueData.push({
        month: monthLabel,
        revenue: Math.round(monthlyRevenue[key] || 0),
      })
    }

    // Calculate total revenue and percentage change
    const totalRevenue = revenueData.reduce((sum, m) => sum + m.revenue, 0)
    const thisMonth = revenueData[revenueData.length - 1]?.revenue || 0
    const lastMonth = revenueData[revenueData.length - 2]?.revenue || 0
    const changePercent = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0

    // Fetch top 5 customers by order total
    const topCustomersRaw = await db.customer.findMany({
      include: {
        orders: {
          select: { total: true },
          where: { status: { in: ['completed', 'delivered', 'shipped'] } },
        },
      },
      orderBy: { value: 'desc' },
      take: 10,
    })

    const topCustomers = topCustomersRaw
      .map(customer => {
        const orderTotal = customer.orders.reduce((sum, o) => sum + o.total, 0)
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          company: customer.company,
          totalSpent: orderTotal,
          orderCount: customer.orders.length,
          initials: customer.name.charAt(0).toUpperCase(),
        }
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)

    const maxSpent = topCustomers.length > 0 ? Math.max(...topCustomers.map(c => c.totalSpent), 1) : 1

    return NextResponse.json({
      success: true,
      revenue: {
        total: totalRevenue,
        changePercent: Math.round(changePercent * 10) / 10,
        data: revenueData,
      },
      topCustomers: topCustomers.map(c => ({
        ...c,
        spentPercent: Math.round((c.totalSpent / maxSpent) * 100),
      })),
    })
  } catch (error) {
    console.error('[Dashboard Data API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات', revenue: { total: 0, changePercent: 0, data: [] }, topCustomers: [] },
      { status: 500 }
    )
  }
}
