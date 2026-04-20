import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST seed the database with sample data (idempotent)
export async function POST() {
  try {
    // Check if data already exists
    const existingUsers = await db.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({
        message: 'Database already seeded',
        seeded: false,
      })
    }

    // --- Create Categories ---
    const categories = await Promise.all([
      db.category.create({
        data: { name: 'Technology', slug: 'technology', color: '#3b82f6' },
      }),
      db.category.create({
        data: { name: 'Design', slug: 'design', color: '#8b5cf6' },
      }),
      db.category.create({
        data: { name: 'Marketing', slug: 'marketing', color: '#f59e0b' },
      }),
      db.category.create({
        data: { name: 'Business', slug: 'business', color: '#10b981' },
      }),
      db.category.create({
        data: { name: 'Lifestyle', slug: 'lifestyle', color: '#ec4899' },
      }),
    ])

    // --- Create Tags ---
    const tags = await Promise.all([
      db.tag.create({ data: { name: 'JavaScript', slug: 'javascript' } }),
      db.tag.create({ data: { name: 'React', slug: 'react' } }),
      db.tag.create({ data: { name: 'Next.js', slug: 'nextjs' } }),
      db.tag.create({ data: { name: 'TypeScript', slug: 'typescript' } }),
      db.tag.create({ data: { name: 'UI/UX', slug: 'ui-ux' } }),
      db.tag.create({ data: { name: 'SEO', slug: 'seo' } }),
      db.tag.create({ data: { name: 'CSS', slug: 'css' } }),
      db.tag.create({ data: { name: 'Node.js', slug: 'nodejs' } }),
    ])

    // --- Create Users ---
    const users = await Promise.all([
      db.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@smartcms.com',
          role: 'admin',
          avatar: '',
          status: 'active',
        },
      }),
      db.user.create({
        data: {
          name: 'Sarah Johnson',
          email: 'sarah@smartcms.com',
          role: 'editor',
          avatar: '',
          status: 'active',
        },
      }),
      db.user.create({
        data: {
          name: 'Mike Chen',
          email: 'mike@smartcms.com',
          role: 'author',
          avatar: '',
          status: 'active',
        },
      }),
      db.user.create({
        data: {
          name: 'Emily Davis',
          email: 'emily@smartcms.com',
          role: 'author',
          avatar: '',
          status: 'inactive',
        },
      }),
    ])

    // --- Create Posts ---
    const posts = await Promise.all([
      db.post.create({
        data: {
          title: 'Getting Started with Next.js 14',
          slug: 'getting-started-nextjs-14',
          content: 'Next.js 14 introduces several new features including Server Actions, partial prerendering, and improved performance. In this guide, we will explore these features and learn how to build modern web applications.',
          excerpt: 'A comprehensive guide to Next.js 14 features and best practices.',
          status: 'published',
          featured: true,
          authorId: users[0].id,
          categoryId: categories[0].id,
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          tags: {
            create: [
              { tagId: tags[2].id },
              { tagId: tags[1].id },
              { tagId: tags[3].id },
            ],
          },
        },
      }),
      db.post.create({
        data: {
          title: 'Mastering CSS Grid Layout',
          slug: 'mastering-css-grid-layout',
          content: 'CSS Grid Layout is a powerful tool for creating complex responsive layouts. Learn how to use grid-template-columns, grid-template-rows, and other properties to build stunning designs.',
          excerpt: 'Learn CSS Grid from basics to advanced techniques.',
          status: 'published',
          featured: false,
          authorId: users[1].id,
          categoryId: categories[1].id,
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          tags: {
            create: [{ tagId: tags[6].id }, { tagId: tags[4].id }],
          },
        },
      }),
      db.post.create({
        data: {
          title: 'SEO Best Practices for 2024',
          slug: 'seo-best-practices-2024',
          content: 'Search engine optimization continues to evolve. Here are the top SEO strategies for 2024 including Core Web Vitals optimization, AI-generated content guidelines, and E-E-A-T principles.',
          excerpt: 'Stay ahead with the latest SEO strategies and techniques.',
          status: 'published',
          featured: true,
          authorId: users[2].id,
          categoryId: categories[2].id,
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          tags: {
            create: [{ tagId: tags[5].id }],
          },
        },
      }),
      db.post.create({
        data: {
          title: 'Building a SaaS Business from Scratch',
          slug: 'building-saas-business',
          content: 'Starting a Software as a Service business requires careful planning, market research, and execution. This article covers the essential steps from idea validation to launch.',
          excerpt: 'A step-by-step guide to launching your SaaS product.',
          status: 'draft',
          featured: false,
          authorId: users[1].id,
          categoryId: categories[3].id,
          tags: {
            create: [{ tagId: tags[3].id }, { tagId: tags[7].id }],
          },
        },
      }),
      db.post.create({
        data: {
          title: 'React Server Components Deep Dive',
          slug: 'react-server-components-deep-dive',
          content: 'React Server Components (RSC) represent a paradigm shift in how we build React applications. This article explores the architecture, benefits, and practical implementation patterns.',
          excerpt: 'Understanding the future of React with Server Components.',
          status: 'draft',
          featured: false,
          authorId: users[0].id,
          categoryId: categories[0].id,
          tags: {
            create: [{ tagId: tags[1].id }, { tagId: tags[2].id }],
          },
        },
      }),
      db.post.create({
        data: {
          title: 'Digital Marketing Trends to Watch',
          slug: 'digital-marketing-trends',
          content: 'The digital marketing landscape is constantly evolving. From AI-powered personalization to voice search optimization, discover the trends that will shape marketing in the coming years.',
          excerpt: 'Explore the latest trends in digital marketing.',
          status: 'review',
          featured: false,
          authorId: users[2].id,
          categoryId: categories[2].id,
        },
      }),
    ])

    // --- Create Comments ---
    await Promise.all([
      db.comment.create({
        data: {
          content: 'Great article! The explanation of Server Actions was very clear.',
          author: 'John Doe',
          email: 'john@example.com',
          status: 'approved',
          postId: posts[0].id,
        },
      }),
      db.comment.create({
        data: {
          content: 'This helped me understand CSS Grid much better. Thanks for sharing!',
          author: 'Jane Smith',
          email: 'jane@example.com',
          status: 'approved',
          postId: posts[1].id,
        },
      }),
      db.comment.create({
        data: {
          content: 'Can you write more about Core Web Vitals optimization?',
          author: 'Bob Wilson',
          email: 'bob@example.com',
          status: 'pending',
          postId: posts[2].id,
        },
      }),
      db.comment.create({
        data: {
          content: 'I disagree with some points about SaaS pricing strategies.',
          author: 'Alice Brown',
          email: 'alice@example.com',
          status: 'pending',
          postId: posts[3].id,
        },
      }),
      db.comment.create({
        data: {
          content: 'The section on data fetching patterns was excellent.',
          author: 'Chris Taylor',
          email: 'chris@example.com',
          status: 'approved',
          postId: posts[0].id,
        },
      }),
    ])

    // --- Create Customers ---
    await Promise.all([
      db.customer.create({
        data: {
          name: 'Acme Corporation',
          email: 'contact@acme.com',
          phone: '+1-555-0101',
          company: 'Acme Corporation',
          status: 'active',
          value: 12500,
        },
      }),
      db.customer.create({
        data: {
          name: 'Globex Industries',
          email: 'info@globex.com',
          phone: '+1-555-0102',
          company: 'Globex Industries',
          status: 'active',
          value: 8750,
        },
      }),
      db.customer.create({
        data: {
          name: 'Stark Enterprises',
          email: 'hello@stark.com',
          phone: '+1-555-0103',
          company: 'Stark Enterprises',
          status: 'lead',
          value: 25000,
        },
      }),
      db.customer.create({
        data: {
          name: 'Wayne Tech',
          email: 'info@waynetech.com',
          phone: '+1-555-0104',
          company: 'Wayne Tech',
          status: 'active',
          value: 32000,
        },
      }),
      db.customer.create({
        data: {
          name: 'Umbrella Corp',
          email: 'contact@umbrella.com',
          phone: '+1-555-0105',
          company: 'Umbrella Corp',
          status: 'inactive',
          value: 4200,
        },
      }),
    ])

    // --- Create Projects ---
    await Promise.all([
      db.project.create({
        data: {
          title: 'Website Redesign',
          description: 'Complete redesign of the company website with modern UI/UX principles.',
          status: 'active',
          progress: 65,
          priority: 'high',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
      }),
      db.project.create({
        data: {
          title: 'Mobile App Development',
          description: 'Cross-platform mobile application for iOS and Android.',
          status: 'planning',
          progress: 15,
          priority: 'high',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      }),
      db.project.create({
        data: {
          title: 'SEO Campaign Q4',
          description: 'Q4 search engine optimization campaign targeting organic growth.',
          status: 'active',
          progress: 40,
          priority: 'medium',
          startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        },
      }),
      db.project.create({
        data: {
          title: 'API Integration',
          description: 'Third-party API integration for payment processing and analytics.',
          status: 'completed',
          progress: 100,
          priority: 'low',
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      }),
      db.project.create({
        data: {
          title: 'Content Strategy',
          description: 'Develop comprehensive content strategy for the next quarter.',
          status: 'planning',
          progress: 5,
          priority: 'medium',
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      }),
    ])

    // --- Create Team Members ---
    await Promise.all([
      db.teamMember.create({
        data: {
          name: 'Alex Rivera',
          email: 'alex@smartcms.com',
          role: 'lead',
          department: 'Engineering',
          avatar: '',
          status: 'active',
          joinedAt: new Date('2023-01-15'),
        },
      }),
      db.teamMember.create({
        data: {
          name: 'Lisa Park',
          email: 'lisa@smartcms.com',
          role: 'senior',
          department: 'Design',
          avatar: '',
          status: 'active',
          joinedAt: new Date('2023-03-20'),
        },
      }),
      db.teamMember.create({
        data: {
          name: 'David Kim',
          email: 'david@smartcms.com',
          role: 'member',
          department: 'Marketing',
          avatar: '',
          status: 'active',
          joinedAt: new Date('2023-06-10'),
        },
      }),
      db.teamMember.create({
        data: {
          name: 'Maria Garcia',
          email: 'maria@smartcms.com',
          role: 'member',
          department: 'Content',
          avatar: '',
          status: 'active',
          joinedAt: new Date('2023-09-01'),
        },
      }),
      db.teamMember.create({
        data: {
          name: 'Tom Wilson',
          email: 'tom@smartcms.com',
          role: 'intern',
          department: 'Engineering',
          avatar: '',
          status: 'away',
          joinedAt: new Date('2024-01-05'),
        },
      }),
    ])

    // --- Create Media ---
    await Promise.all([
      db.media.create({
        data: {
          name: 'Hero Banner',
          filename: 'hero-banner.jpg',
          url: '/uploads/hero-banner.jpg',
          type: 'image',
          size: 245000,
          alt: 'Website hero banner image',
        },
      }),
      db.media.create({
        data: {
          name: 'Product Demo',
          filename: 'product-demo.mp4',
          url: '/uploads/product-demo.mp4',
          type: 'video',
          size: 15400000,
          alt: 'Product demonstration video',
        },
      }),
      db.media.create({
        data: {
          name: 'Company Logo',
          filename: 'company-logo.png',
          url: '/uploads/company-logo.png',
          type: 'image',
          size: 87000,
          alt: 'Company logo',
        },
      }),
      db.media.create({
        data: {
          name: 'User Guide PDF',
          filename: 'user-guide.pdf',
          url: '/uploads/user-guide.pdf',
          type: 'document',
          size: 3200000,
          alt: 'User guide documentation',
        },
      }),
    ])

    // --- Create Activity Logs ---
    await Promise.all([
      db.activityLog.create({
        data: {
          action: 'post.published',
          details: 'Published "Getting Started with Next.js 14"',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'comment.approved',
          details: 'Approved comment from John Doe on "Getting Started with Next.js 14"',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'post.created',
          details: 'Created draft "Building a SaaS Business from Scratch"',
          userId: users[1].id,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'user.updated',
          details: 'Updated profile for Emily Davis',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'media.uploaded',
          details: 'Uploaded "Hero Banner"',
          userId: users[1].id,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'settings.updated',
          details: 'Updated SEO settings',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'comment.created',
          details: 'New comment pending review from Bob Wilson',
          userId: null,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'project.updated',
          details: 'Updated progress of "Website Redesign" to 65%',
          userId: users[2].id,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
      }),
    ])

    // --- Create Settings ---
    const defaultSettings = [
      // General
      { key: 'site_name', value: 'Smart CMS', group: 'general' },
      { key: 'site_description', value: 'Intelligent Content Management System', group: 'general' },
      { key: 'site_url', value: 'https://smartcms.com', group: 'general' },
      { key: 'site_language', value: 'en', group: 'general' },
      { key: 'timezone', value: 'UTC', group: 'general' },
      // SEO
      { key: 'seo_title_template', value: '%title% | %sitename%', group: 'seo' },
      { key: 'meta_description', value: 'Smart CMS - A powerful content management system', group: 'seo' },
      { key: 'og_image', value: '/uploads/og-default.jpg', group: 'seo' },
      { key: 'robots_txt', value: 'User-agent: *\nAllow: /', group: 'seo' },
      // AI
      { key: 'ai_provider', value: 'glm', group: 'ai' },
      { key: 'ai_model', value: 'GLM-5-turbo', group: 'ai' },
      { key: 'ai_default_tone', value: 'professional', group: 'ai' },
      { key: 'ai_max_tokens', value: '4096', group: 'ai' },
      // Content
      { key: 'posts_per_page', value: '10', group: 'content' },
      { key: 'auto_save_interval', value: '30', group: 'content' },
      { key: 'default_post_status', value: 'draft', group: 'content' },
      { key: 'comment_moderation', value: 'true', group: 'content' },
      // Security
      { key: 'max_login_attempts', value: '5', group: 'security' },
      { key: 'session_timeout', value: '3600', group: 'security' },
      { key: 'two_factor_auth', value: 'false', group: 'security' },
    ]

    await db.setting.createMany({ data: defaultSettings })

    return NextResponse.json({
      message: 'Database seeded successfully',
      seeded: true,
      counts: {
        categories: categories.length,
        tags: tags.length,
        users: users.length,
        posts: posts.length,
        customers: 5,
        projects: 5,
        teamMembers: 5,
        media: 4,
        activityLogs: 8,
        settings: defaultSettings.length,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
