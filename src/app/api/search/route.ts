import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SearchResultItem {
  id: string
  type: string
  typeLabel: string
  title: string
  description: string
  status: string
  statusLabel: string
  createdAt: string
}

type SortField = 'createdAt' | 'updatedAt'
type SortDir = 'asc' | 'desc'

// ─── Persian Labels ──────────────────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  post: 'مقاله',
  user: 'کاربر',
  customer: 'مشتری',
  project: 'پروژه',
  media: 'رسانه',
  comment: 'نظر',
  team: 'عضو تیم',
  task: 'وظیفه',
}

const statusLabels: Record<string, Record<string, string>> = {
  post: { published: 'منتشر شده', draft: 'پیش‌نویس', archived: 'بایگانی', pending: 'در انتظار' },
  user: { active: 'فعال', inactive: 'غیرفعال' },
  customer: { active: 'فعال', inactive: 'غیرفعال' },
  project: { active: 'فعال', completed: 'تکمیل شده', pending: 'در انتظار', planning: 'برنامه‌ریزی', archived: 'بایگانی' },
  media: { image: 'تصویر', video: 'ویدیو', document: 'سند' },
  comment: { approved: 'تأیید شده', pending: 'در انتظار', spam: 'هرزنامه' },
  team: { active: 'فعال', inactive: 'غیرفعال' },
  task: { todo: 'انجام نشده', in_progress: 'در حال انجام', done: 'انجام شده' },
}

const searchableTypes = ['post', 'user', 'customer', 'project', 'media', 'comment', 'team', 'task']

// ─── GET Handler ───────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const typeFilter = searchParams.get('type') || 'all'
    const statusFilter = searchParams.get('status') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Date filtering
    const fromDateStr = searchParams.get('fromDate') || ''
    const toDateStr = searchParams.get('toDate') || ''
    const fromDate = fromDateStr ? new Date(fromDateStr) : null
    const toDate = toDateStr ? new Date(toDateStr) : null

    // Sorting
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as SortField
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as SortDir
    const validSortFields: SortField[] = ['createdAt', 'updatedAt']
    const validSortDirs: SortDir[] = ['asc', 'desc']
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const orderByDir = validSortDirs.includes(sortOrder) ? sortOrder : 'desc'

    if (!q.trim()) {
      return NextResponse.json({
        success: true,
        query: q,
        results: [],
        total: 0,
        message: 'عبارت جستجو خالی است',
      })
    }

    const keyword = q.trim()
    const types = typeFilter === 'all'
      ? searchableTypes
      : typeFilter.split(',').filter((t) => searchableTypes.includes(t))

    const allResults: SearchResultItem[] = []

    for (const type of types) {
      const items = await searchByType(type, keyword, statusFilter === 'all' ? null : statusFilter, limit, fromDate, toDate, orderByField, orderByDir)
      allResults.push(...items)
    }

    // Sort results according to requested sort
    allResults.sort((a, b) => {
      const aVal = new Date(a[orderByField] || a.createdAt).getTime()
      const bVal = new Date(b[orderByField] || b.createdAt).getTime()
      return orderByDir === 'desc' ? bVal - aVal : aVal - bVal
    })

    // Apply pagination
    const paginatedResults = allResults.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      query: keyword,
      type: typeFilter,
      status: statusFilter,
      results: paginatedResults,
      total: allResults.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error('[Search API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'خطا در جستجو',
        results: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}

// ─── Search by Type ──────────────────────────────────────────────────────────

// Build date filter clause for Prisma
function buildDateFilter(fromDate: Date | null, toDate: Date | null): Prisma.DateTimeFilter {
  const filter: Prisma.DateTimeFilter = {}
  if (fromDate && toDate) {
    filter.gte = fromDate
    filter.lte = toDate
  } else if (fromDate) {
    filter.gte = fromDate
  } else if (toDate) {
    filter.lte = toDate
  }
  return filter
}

async function searchByType(
  type: string,
  keyword: string,
  statusFilter: string | null,
  limit: number,
  fromDate: Date | null,
  toDate: Date | null,
  orderByField: SortField,
  orderByDir: SortDir,
): Promise<SearchResultItem[]> {
  const results: SearchResultItem[] = []
  const dateFilter = buildDateFilter(fromDate, toDate)
  const hasDateFilter = fromDate || toDate
  const orderConfig = { [orderByField]: orderByDir } as Record<string, string>

  switch (type) {
    case 'post': {
      const posts = await db.post.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          OR: [
            { title: { contains: keyword } },
            { excerpt: { contains: keyword } },
            { content: { contains: keyword } },
          ],
        },
        take: limit,
        orderBy: orderConfig,
        select: {
          id: true,
          title: true,
          excerpt: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      for (const post of posts) {
        results.push({
          id: post.id,
          type: 'post',
          typeLabel: typeLabels.post,
          title: post.title,
          description: post.excerpt || '',
          status: post.status,
          statusLabel: statusLabels.post[post.status] || post.status,
          createdAt: post.createdAt.toISOString(),
        })
      }
      break
    }

    case 'user': {
      const users = await db.user.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          OR: [
            { name: { contains: keyword } },
            { email: { contains: keyword } },
          ],
        },
        take: limit,
        orderBy: orderConfig,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      for (const user of users) {
        results.push({
          id: user.id,
          type: 'user',
          typeLabel: typeLabels.user,
          title: user.name,
          description: user.email,
          status: user.status,
          statusLabel: statusLabels.user[user.status] || user.status,
          createdAt: user.createdAt.toISOString(),
        })
      }
      break
    }

    case 'customer': {
      const customers = await db.customer.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          OR: [
            { name: { contains: keyword } },
            { email: { contains: keyword } },
            { company: { contains: keyword } },
            { phone: { contains: keyword } },
          ],
        },
        take: limit,
        orderBy: orderConfig,
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      for (const customer of customers) {
        results.push({
          id: customer.id,
          type: 'customer',
          typeLabel: typeLabels.customer,
          title: customer.name,
          description: customer.company || customer.email,
          status: customer.status,
          statusLabel: statusLabels.customer[customer.status] || customer.status,
          createdAt: customer.createdAt.toISOString(),
        })
      }
      break
    }

    case 'project': {
      const projects = await db.project.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          OR: [
            { title: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        },
        take: limit,
        orderBy: orderConfig,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      for (const project of projects) {
        results.push({
          id: project.id,
          type: 'project',
          typeLabel: typeLabels.project,
          title: project.title,
          description: project.description,
          status: project.status,
          statusLabel: statusLabels.project[project.status] || project.status,
          createdAt: project.createdAt.toISOString(),
        })
      }
      break
    }

    case 'media': {
      const mediaItems = await db.media.findMany({
        where: {
          ...(statusFilter ? { type: statusFilter } : {}),
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          OR: [
            { name: { contains: keyword } },
            { alt: { contains: keyword } },
          ],
        },
        take: limit,
        orderBy: orderConfig,
        select: {
          id: true,
          name: true,
          alt: true,
          type: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      for (const media of mediaItems) {
        results.push({
          id: media.id,
          type: 'media',
          typeLabel: typeLabels.media,
          title: media.name,
          description: media.alt || '',
          status: media.type,
          statusLabel: statusLabels.media[media.type] || media.type,
          createdAt: media.createdAt.toISOString(),
        })
      }
      break
    }

    case 'comment': {
      const comments = await db.comment.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          OR: [
            { content: { contains: keyword } },
            { author: { contains: keyword } },
          ],
        },
        take: limit,
        orderBy: orderConfig,
        select: {
          id: true,
          content: true,
          author: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      for (const comment of comments) {
        results.push({
          id: comment.id,
          type: 'comment',
          typeLabel: typeLabels.comment,
          title: comment.author || 'ناشناس',
          description: comment.content.slice(0, 100),
          status: comment.status,
          statusLabel: statusLabels.comment[comment.status] || comment.status,
          createdAt: comment.createdAt.toISOString(),
        })
      }
      break
    }

    case 'team': {
      const teamMembers = await db.teamMember.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          OR: [
            { name: { contains: keyword } },
            { email: { contains: keyword } },
            { department: { contains: keyword } },
            { role: { contains: keyword } },
          ],
        },
        take: limit,
        orderBy: orderConfig,
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      for (const member of teamMembers) {
        results.push({
          id: member.id,
          type: 'team',
          typeLabel: typeLabels.team,
          title: member.name,
          description: member.department || member.email,
          status: member.status,
          statusLabel: statusLabels.team[member.status] || member.status,
          createdAt: member.createdAt.toISOString(),
        })
      }
      break
    }

    case 'task': {
      const tasks = await db.task.findMany({
        where: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          OR: [
            { title: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        },
        take: limit,
        orderBy: orderConfig,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      for (const task of tasks) {
        results.push({
          id: task.id,
          type: 'task',
          typeLabel: typeLabels.task,
          title: task.title,
          description: task.description,
          status: task.status,
          statusLabel: statusLabels.task[task.status] || task.status,
          createdAt: task.createdAt.toISOString(),
        })
      }
      break
    }
  }

  return results
}
