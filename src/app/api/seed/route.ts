import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PrismaClient } from '@prisma/client'

// Fresh PrismaClient used only for newly-added models (bypasses hot-reload cache)
function getFreshDb() {
  return new PrismaClient({ log: ['error'] })
}

// Helper: millisecond day multiplier
const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

// POST /api/seed?force=true — seed the database (idempotent, or force-reseed)
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // --- Force reset: wipe all tables ---
    if (force) {
      await db.$executeRawUnsafe(`PRAGMA foreign_keys = OFF`)
      const tables = await db.$queryRawUnsafe<{ name: string }[]>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
      )
      for (const table of tables) {
        await db.$executeRawUnsafe(`DELETE FROM "${table.name}"`)
      }
      await db.$executeRawUnsafe(`PRAGMA foreign_keys = ON`)
    } else {
      // Idempotent check
      const existingUsers = await db.user.count()
      if (existingUsers > 0) {
        return NextResponse.json({
          message: 'Database already seeded',
          seeded: false,
        })
      }
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
          publishedAt: new Date(Date.now() - 5 * DAY),
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
          publishedAt: new Date(Date.now() - 3 * DAY),
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
          publishedAt: new Date(Date.now() - 1 * DAY),
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
      db.post.create({
        data: {
          title: 'Tips for Better TypeScript Code',
          slug: 'tips-for-better-typescript-code',
          content: 'TypeScript has become the standard for large-scale JavaScript projects. In this article, we cover essential tips including strict mode configuration, utility types, generics best practices, and how to leverage discriminated unions for type-safe state management. We also explore advanced patterns like conditional types and template literal types that can significantly improve your codebase.',
          excerpt: 'Essential TypeScript tips for writing cleaner, safer, and more maintainable code.',
          status: 'published',
          featured: false,
          authorId: users[0].id,
          categoryId: categories[0].id,
          publishedAt: new Date(Date.now() - 7 * DAY),
          tags: {
            create: [{ tagId: tags[3].id }, { tagId: tags[0].id }],
          },
        },
      }),
      db.post.create({
        data: {
          title: 'Tailwind CSS v4 New Features',
          slug: 'tailwind-css-v4-new-features',
          content: 'Tailwind CSS v4 brings a completely new engine with a CSS-first configuration approach. The new version introduces native cascade layers, container queries support, automatic content detection, and a redesigned color palette system. Performance has been dramatically improved with a new JIT engine that is up to 10x faster than the previous version.',
          excerpt: 'Explore the groundbreaking new features and improvements in Tailwind CSS v4.',
          status: 'published',
          featured: true,
          authorId: users[1].id,
          categoryId: categories[1].id,
          publishedAt: new Date(Date.now() - 2 * DAY),
          tags: {
            create: [{ tagId: tags[6].id }, { tagId: tags[4].id }, { tagId: tags[2].id }],
          },
        },
      }),
      db.post.create({
        data: {
          title: 'Understanding React Hooks in Depth',
          slug: 'understanding-react-hooks-in-depth',
          content: 'React Hooks revolutionized how we write components. This deep dive covers useState, useEffect, useContext, useReducer, useMemo, useCallback, and useRef with practical examples. We also explore custom hook patterns, the rules of hooks, and common pitfalls that developers encounter when transitioning from class components.',
          excerpt: 'A comprehensive deep dive into React Hooks patterns and best practices.',
          status: 'draft',
          featured: false,
          authorId: users[2].id,
          categoryId: categories[0].id,
          tags: {
            create: [{ tagId: tags[1].id }, { tagId: tags[3].id }],
          },
        },
      }),
      db.post.create({
        data: {
          title: 'Building REST APIs with Node.js',
          slug: 'building-rest-apis-with-nodejs',
          content: 'Node.js is an excellent choice for building REST APIs. This tutorial walks through creating a production-ready API using Express.js with proper error handling, validation, authentication middleware, rate limiting, and database integration with Prisma ORM. We cover RESTful design principles and API versioning strategies.',
          excerpt: 'Learn how to build scalable REST APIs using Node.js and Express.',
          status: 'published',
          featured: false,
          authorId: users[3].id,
          categoryId: categories[0].id,
          publishedAt: new Date(Date.now() - 10 * DAY),
          tags: {
            create: [{ tagId: tags[7].id }, { tagId: tags[0].id }, { tagId: tags[3].id }],
          },
        },
      }),
      db.post.create({
        data: {
          title: 'Introduction to Docker Containers',
          slug: 'introduction-to-docker-containers',
          content: 'Docker containers have transformed software deployment by providing consistent, isolated environments. This beginner-friendly guide covers Docker fundamentals including images, containers, volumes, networks, and Dockerfile best practices. We also explore Docker Compose for multi-container applications and how to integrate Docker into your CI/CD pipeline.',
          excerpt: 'A beginner-friendly introduction to Docker and containerization concepts.',
          status: 'review',
          featured: false,
          authorId: users[0].id,
          categoryId: categories[3].id,
          tags: {
            create: [{ tagId: tags[7].id }],
          },
        },
      }),
      db.post.create({
        data: {
          title: 'Machine Learning Basics for Developers',
          slug: 'machine-learning-basics-for-developers',
          content: 'Machine learning is no longer just for data scientists. This article introduces core ML concepts for software developers including supervised vs unsupervised learning, model training and evaluation, feature engineering, and how to integrate pre-trained models into your applications using Python and TensorFlow. Practical examples demonstrate sentiment analysis and recommendation systems.',
          excerpt: 'Essential machine learning concepts every developer should understand.',
          status: 'archived',
          featured: false,
          authorId: users[1].id,
          categoryId: categories[3].id,
          tags: {
            create: [{ tagId: tags[0].id }, { tagId: tags[3].id }],
          },
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
      db.comment.create({
        data: {
          content: 'This TypeScript article finally made generics click for me. Excellent explanation!',
          author: 'Daniel Lee',
          email: 'daniel@example.com',
          status: 'approved',
          postId: posts[6].id,
        },
      }),
      db.comment.create({
        data: {
          content: 'Tailwind CSS v4 looks amazing. The CSS-first configuration is a game changer.',
          author: 'Sophie Martin',
          email: 'sophie@example.com',
          status: 'approved',
          postId: posts[7].id,
        },
      }),
      db.comment.create({
        data: {
          content: 'Can you add more examples about useCallback and when to use it vs useMemo?',
          author: 'Ryan Patel',
          email: 'ryan@example.com',
          status: 'pending',
          postId: posts[8].id,
        },
      }),
      db.comment.create({
        data: {
          content: 'The Docker Compose section was really helpful for my microservices project.',
          author: 'Nina Kowalski',
          email: 'nina@example.com',
          status: 'pending',
          postId: posts[10].id,
        },
      }),
      db.comment.create({
        data: {
          content: 'Great API tutorial! Would love to see a follow-up on GraphQL comparison.',
          author: 'Marcus Johnson',
          email: 'marcus@example.com',
          status: 'approved',
          postId: posts[9].id,
        },
      }),
      db.comment.create({
        data: {
          content: 'The ML basics section was approachable but I think it needs more code examples.',
          author: 'Olivia Chen',
          email: 'olivia@example.com',
          status: 'pending',
          postId: posts[11].id,
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
      db.customer.create({
        data: {
          name: 'Cyberdyne Systems',
          email: 'info@cyberdyne.com',
          phone: '+1-555-0106',
          company: 'Cyberdyne Systems',
          status: 'active',
          value: 18700,
        },
      }),
      db.customer.create({
        data: {
          name: 'Oscorp Industries',
          email: 'hello@oscorp.com',
          phone: '+1-555-0107',
          company: 'Oscorp Industries',
          status: 'lead',
          value: 9500,
        },
      }),
      db.customer.create({
        data: {
          name: 'Soylent Corp',
          email: 'contact@soylent.com',
          phone: '+1-555-0108',
          company: 'Soylent Corp',
          status: 'active',
          value: 15800,
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
          startDate: new Date(Date.now() - 30 * DAY),
          dueDate: new Date(Date.now() + 15 * DAY),
        },
      }),
      db.project.create({
        data: {
          title: 'Mobile App Development',
          description: 'Cross-platform mobile application for iOS and Android.',
          status: 'planning',
          progress: 15,
          priority: 'high',
          startDate: new Date(Date.now() - 7 * DAY),
          dueDate: new Date(Date.now() + 90 * DAY),
        },
      }),
      db.project.create({
        data: {
          title: 'SEO Campaign Q4',
          description: 'Q4 search engine optimization campaign targeting organic growth.',
          status: 'active',
          progress: 40,
          priority: 'medium',
          startDate: new Date(Date.now() - 14 * DAY),
          dueDate: new Date(Date.now() + 45 * DAY),
        },
      }),
      db.project.create({
        data: {
          title: 'API Integration',
          description: 'Third-party API integration for payment processing and analytics.',
          status: 'completed',
          progress: 100,
          priority: 'low',
          startDate: new Date(Date.now() - 60 * DAY),
          dueDate: new Date(Date.now() - 5 * DAY),
        },
      }),
      db.project.create({
        data: {
          title: 'Content Strategy',
          description: 'Develop comprehensive content strategy for the next quarter.',
          status: 'planning',
          progress: 5,
          priority: 'medium',
          dueDate: new Date(Date.now() + 60 * DAY),
        },
      }),
      db.project.create({
        data: {
          title: 'Analytics Dashboard',
          description: 'Build real-time analytics dashboard with interactive charts and data visualization.',
          status: 'active',
          progress: 35,
          priority: 'high',
          startDate: new Date(Date.now() - 10 * DAY),
          dueDate: new Date(Date.now() + 30 * DAY),
        },
      }),
      db.project.create({
        data: {
          title: 'Performance Optimization',
          description: 'Optimize application performance including bundle size reduction, caching strategies, and database query optimization.',
          status: 'planning',
          progress: 0,
          priority: 'medium',
          dueDate: new Date(Date.now() + 45 * DAY),
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
      db.teamMember.create({
        data: {
          name: 'Rachel Foster',
          email: 'rachel@smartcms.com',
          role: 'senior',
          department: 'Engineering',
          avatar: '',
          status: 'active',
          joinedAt: new Date('2022-08-15'),
        },
      }),
      db.teamMember.create({
        data: {
          name: 'James Nakamura',
          email: 'james@smartcms.com',
          role: 'member',
          department: 'Marketing',
          avatar: '',
          status: 'active',
          joinedAt: new Date('2023-11-01'),
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
          createdAt: new Date(Date.now() - 5 * DAY),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'comment.approved',
          details: 'Approved comment from John Doe on "Getting Started with Next.js 14"',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 4 * DAY),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'post.created',
          details: 'Created draft "Building a SaaS Business from Scratch"',
          userId: users[1].id,
          createdAt: new Date(Date.now() - 3 * DAY),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'user.updated',
          details: 'Updated profile for Emily Davis',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 2 * DAY),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'media.uploaded',
          details: 'Uploaded "Hero Banner"',
          userId: users[1].id,
          createdAt: new Date(Date.now() - 1 * DAY),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'settings.updated',
          details: 'Updated SEO settings',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 12 * HOUR),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'comment.created',
          details: 'New comment pending review from Bob Wilson',
          userId: null,
          createdAt: new Date(Date.now() - 6 * HOUR),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'project.updated',
          details: 'Updated progress of "Website Redesign" to 65%',
          userId: users[2].id,
          createdAt: new Date(Date.now() - 3 * HOUR),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'post.published',
          details: 'Published "Tailwind CSS v4 New Features"',
          userId: users[1].id,
          createdAt: new Date(Date.now() - 2 * DAY),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'customer.created',
          details: 'Added new customer "Cyberdyne Systems"',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 8 * DAY),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'team.member_added',
          details: 'Rachel Foster joined the Engineering team',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 14 * DAY),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'media.uploaded',
          details: 'Uploaded "Company Logo" for brand assets',
          userId: users[1].id,
          createdAt: new Date(Date.now() - 10 * DAY),
        },
      }),
    ])

    // --- Create Settings ---
    const defaultSettings = [
      { key: 'site_name', value: 'Smart CMS', group: 'general' },
      { key: 'site_description', value: 'Intelligent Content Management System', group: 'general' },
      { key: 'site_url', value: 'https://smartcms.com', group: 'general' },
      { key: 'site_language', value: 'en', group: 'general' },
      { key: 'timezone', value: 'UTC', group: 'general' },
      { key: 'seo_title_template', value: '%title% | %sitename%', group: 'seo' },
      { key: 'meta_description', value: 'Smart CMS - A powerful content management system', group: 'seo' },
      { key: 'og_image', value: '/uploads/og-default.jpg', group: 'seo' },
      { key: 'robots_txt', value: 'User-agent: *\nAllow: /', group: 'seo' },
      { key: 'ai_provider', value: 'glm', group: 'ai' },
      { key: 'ai_model', value: 'GLM-5-turbo', group: 'ai' },
      { key: 'ai_default_tone', value: 'professional', group: 'ai' },
      { key: 'ai_max_tokens', value: '4096', group: 'ai' },
      { key: 'posts_per_page', value: '10', group: 'content' },
      { key: 'auto_save_interval', value: '30', group: 'content' },
      { key: 'default_post_status', value: 'draft', group: 'content' },
      { key: 'comment_moderation', value: 'true', group: 'content' },
      { key: 'max_login_attempts', value: '5', group: 'security' },
      { key: 'session_timeout', value: '3600', group: 'security' },
      { key: 'two_factor_auth', value: 'false', group: 'security' },
    ]

    await db.setting.createMany({ data: defaultSettings })

    // --- Create Tasks ---
    const taskData = [
      { title: 'نوشتن مقاله جدید درباره هوش مصنوعی', description: 'مقاله جامع درباره کاربردهای جدید هوش مصنوعی در صنعت', status: 'todo', priority: 'high', dueDate: new Date(Date.now() + 3 * DAY), tags: 'محتوا, AI' },
      { title: 'بررسی و تایید نظرات جدید', description: 'بررسی نظرات در انتظار تایید و پاسخ به آنها', status: 'todo', priority: 'medium', dueDate: new Date(Date.now() + 1 * DAY), tags: 'محتوا' },
      { title: 'به‌روزرسانی صفحه درباره ما', description: 'اضافه کردن اطلاعات جدید تیم و پروژه‌ها', status: 'in-progress', priority: 'medium', dueDate: new Date(Date.now() + 5 * DAY), tags: 'وبسایت' },
      { title: 'طراحی لوگوی جدید', description: 'طراحی لوگوی جدید برند با همکاری تیم طراحی', status: 'in-progress', priority: 'high', dueDate: new Date(Date.now() + 7 * DAY), tags: 'طراحی, برند' },
      { title: 'انتشار مقاله SEO', description: 'نهایی‌سازی و انتشار مقاله بهینه‌سازی موتور جستجو', status: 'review', priority: 'low', dueDate: new Date(Date.now() + 2 * DAY), tags: 'SEO, محتوا' },
      { title: 'تست فرم تماس با ما', description: 'بررسی عملکرد فرم تماس و ارسال ایمیل', status: 'review', priority: 'medium', dueDate: new Date(Date.now() + 1 * DAY), tags: 'تست' },
      { title: 'پشتیبان‌گیری از دیتابیس', description: 'ایجاد نسخه پشتیبان کامل از دیتابیس', status: 'done', priority: 'high', dueDate: new Date(Date.now() - 1 * DAY), tags: 'امنیت' },
      { title: 'افزودن نقشه سایت', description: 'ایجاد و ثبت sitemap.xml در موتورهای جستجو', status: 'done', priority: 'low', dueDate: new Date(Date.now() - 3 * DAY), tags: 'SEO' },
      { title: 'بهینه‌سازی سرعت سایت', description: 'تحلیل و بهبود سرعت بارگذاری صفحات', status: 'todo', priority: 'critical', dueDate: new Date(Date.now() + 2 * DAY), tags: 'عملکرد' },
      { title: 'ایمیل خبرنامه ماهانه', description: 'تهیه و ارسال خبرنامه ماهانه برای مشترکان', status: 'todo', priority: 'medium', dueDate: new Date(Date.now() + 10 * DAY), tags: 'بازاریابی, ایمیل' },
    ] as const

    await Promise.all(
      taskData.map(t =>
        db.task.create({
          data: {
            title: t.title,
            description: t.description,
            status: t.status as 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled',
            priority: t.priority as 'low' | 'medium' | 'high' | 'critical',
            dueDate: t.dueDate,
            tags: t.tags,
            assigneeId: users[0].id,
          },
        })
      )
    )

    // --- Create Quick Notes ---
    await Promise.all([
      db.quickNote.create({
        data: {
          content: 'جلسه فردا ساعت ۱۰ صبح با تیم طراحی',
          color: 'yellow',
          pinned: true,
        },
      }),
      db.quickNote.create({
        data: {
          content: 'لیست خرید: هاست جدید، دامنه ir',
          color: 'green',
          pinned: false,
        },
      }),
      db.quickNote.create({
        data: {
          content: 'ایده: اضافه کردن بخش فروشگاه',
          color: 'blue',
          pinned: true,
        },
      }),
      db.quickNote.create({
        data: {
          content: 'یادآوری: تمدید گواهی SSL تا پایان ماه',
          color: 'pink',
          pinned: false,
        },
      }),
    ])

    // =========================================================================
    // Business Seed Data — Cross-Module Integration
    // =========================================================================

    const allCustomers = await db.customer.findMany()

    // --- 1. Product Categories ---
    const productCategories = await Promise.all([
      db.productCategory.create({
        data: { name: 'الکترونیک', slug: 'electronics', description: 'محصولات الکترونیکی و دیجیتال', color: '#3b82f6' },
      }),
      db.productCategory.create({
        data: { name: 'لباس', slug: 'clothing', description: 'پوشاک و لباس‌های متنوع', color: '#ec4899' },
      }),
      db.productCategory.create({
        data: { name: 'لوازم خانگی', slug: 'home-appliances', description: 'لوازم خانگی و آشپزخانه', color: '#f59e0b' },
      }),
      db.productCategory.create({
        data: { name: 'کتاب', slug: 'books', description: 'کتاب‌های چاپی و الکترونیکی', color: '#10b981' },
      }),
    ])

    // --- 2. Products ---
    const products = await Promise.all([
      db.product.create({
        data: {
          name: 'گوشی هوشمند گلکسی S24',
          sku: 'ELC-001',
          description: 'گوشی هوشمند سامسونگ با صفحه نمایش ۶.۲ اینچی و دوربین ۱۰۸ مگاپیکسلی',
          price: 45000000,
          salePrice: 42000000,
          cost: 38000000,
          status: 'active',
          featured: true,
          productCategoryId: productCategories[0].id,
        },
      }),
      db.product.create({
        data: {
          name: 'لپ‌تاپ ایسوس ZenBook 14',
          sku: 'ELC-002',
          description: 'لپ‌تاپ سبک و قدرتمند مناسب کاربران حرفه‌ای',
          price: 65000000,
          cost: 58000000,
          status: 'active',
          featured: true,
          productCategoryId: productCategories[0].id,
        },
      }),
      db.product.create({
        data: {
          name: 'هدفون بی‌سیم ایرپاد پرو',
          sku: 'ELC-003',
          description: 'هدفون بی‌سیم اپل با قابلیت حذف نویز فعال',
          price: 12000000,
          salePrice: 10500000,
          cost: 8500000,
          status: 'active',
          featured: false,
          productCategoryId: productCategories[0].id,
        },
      }),
      db.product.create({
        data: {
          name: 'پیراهن مردانه اسلیم فیت',
          sku: 'CLO-001',
          description: 'پیراهن مردانه با پارچه نخی درجه یک',
          price: 2500000,
          salePrice: 1950000,
          cost: 1200000,
          status: 'active',
          featured: false,
          productCategoryId: productCategories[1].id,
        },
      }),
      db.product.create({
        data: {
          name: 'کاپشن زنانه زمستانی',
          sku: 'CLO-002',
          description: 'کاپشن گرم و سبک مناسب فصل زمستان',
          price: 4800000,
          cost: 2800000,
          status: 'active',
          featured: true,
          productCategoryId: productCategories[1].id,
        },
      }),
      db.product.create({
        data: {
          name: 'جاروبرقی رباتیک شیائومی',
          sku: 'HOM-001',
          description: 'جاروبرقی هوشمند با قابلیت نقشه‌برداری لیزری',
          price: 15000000,
          salePrice: 13500000,
          cost: 10500000,
          status: 'active',
          featured: true,
          productCategoryId: productCategories[2].id,
        },
      }),
      db.product.create({
        data: {
          name: 'آب‌میوه‌گیری چندکاره فیلیپس',
          sku: 'HOM-002',
          description: 'آب‌میوه‌گیری با سه سری مختلف و موتور قدرتمند ۸۰۰ وات',
          price: 5800000,
          cost: 3500000,
          status: 'active',
          featured: false,
          productCategoryId: productCategories[2].id,
        },
      }),
      db.product.create({
        data: {
          name: 'آموزش پیشرفته React',
          sku: 'BOK-001',
          description: 'کتاب جامع آموزش فریمورک React از مبتدی تا پیشرفته',
          price: 850000,
          salePrice: 650000,
          cost: 200000,
          status: 'active',
          featured: false,
          productCategoryId: productCategories[3].id,
        },
      }),
      db.product.create({
        data: {
          name: 'تبلت سامسونگ تب S9',
          sku: 'ELC-004',
          description: 'تبلت قدرتمند با قلم S Pen و صفحه نمایش AMOLED',
          price: 32000000,
          cost: 27000000,
          status: 'draft',
          featured: false,
          productCategoryId: productCategories[0].id,
        },
      }),
      db.product.create({
        data: {
          name: 'ست آشپزخانه ۲۴ پارچه',
          sku: 'HOM-003',
          description: 'ست قابلمه و تابه با روکش سرامیکی ضد خش',
          price: 9500000,
          cost: 5500000,
          status: 'draft',
          featured: false,
          productCategoryId: productCategories[2].id,
        },
      }),
    ])

    // --- 3. Coupons ---
    const coupons = await Promise.all([
      db.coupon.create({
        data: {
          code: 'WELCOME10',
          type: 'percent',
          value: 10,
          minPurchase: 500000,
          maxUses: 100,
          usedCount: 23,
          active: true,
          expiresAt: new Date(Date.now() + 30 * DAY),
        },
      }),
      db.coupon.create({
        data: {
          code: 'SUMMER20',
          type: 'percent',
          value: 20,
          minPurchase: 1000000,
          maxUses: 50,
          usedCount: 31,
          active: true,
          expiresAt: new Date(Date.now() + 15 * DAY),
        },
      }),
      db.coupon.create({
        data: {
          code: 'VIP30',
          type: 'percent',
          value: 30,
          minPurchase: 5000000,
          maxUses: 10,
          usedCount: 5,
          active: true,
          expiresAt: new Date(Date.now() + 60 * DAY),
        },
      }),
    ])

    // --- 4. Orders (linked to customers & products) ---
    const orders = await Promise.all([
      db.order.create({
        data: {
          orderNumber: 'ORD-1001',
          customerId: allCustomers[0].id,
          status: 'delivered',
          subtotal: 52500000,
          discount: 5250000,
          tax: 0,
          shippingCost: 150000,
          total: 47400000,
          shippingAddress: 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
          notes: 'تحویل در ساعات اداری',
          couponId: coupons[0].id,
          createdAt: new Date(Date.now() - 20 * DAY),
          items: {
            create: [
              { productId: products[0].id, quantity: 1, unitPrice: 45000000, totalPrice: 45000000 },
              { productId: products[2].id, quantity: 1, unitPrice: 12000000, totalPrice: 12000000 },
            ],
          },
        },
      }),
      db.order.create({
        data: {
          orderNumber: 'ORD-1002',
          customerId: allCustomers[1].id,
          status: 'shipped',
          subtotal: 4800000,
          discount: 0,
          tax: 0,
          shippingCost: 85000,
          total: 4885000,
          shippingAddress: 'اصفهان، خیابان چهارباغ، کوچه ۵',
          notes: '',
          createdAt: new Date(Date.now() - 10 * DAY),
          items: {
            create: [
              { productId: products[4].id, quantity: 1, unitPrice: 4800000, totalPrice: 4800000 },
            ],
          },
        },
      }),
      db.order.create({
        data: {
          orderNumber: 'ORD-1003',
          customerId: allCustomers[3].id,
          status: 'processing',
          subtotal: 15000000,
          discount: 1500000,
          tax: 0,
          shippingCost: 0,
          total: 13500000,
          shippingAddress: 'شیراز، بلوار ارم، ساختمان آریا',
          notes: 'تماس قبل از ارسال',
          couponId: coupons[1].id,
          createdAt: new Date(Date.now() - 3 * DAY),
          items: {
            create: [
              { productId: products[5].id, quantity: 1, unitPrice: 15000000, totalPrice: 15000000 },
            ],
          },
        },
      }),
      db.order.create({
        data: {
          orderNumber: 'ORD-1004',
          customerId: allCustomers[2].id,
          status: 'pending',
          subtotal: 65000000,
          discount: 0,
          tax: 0,
          shippingCost: 200000,
          total: 65200000,
          shippingAddress: 'مشهد، خیابان امام رضا، نبش خیابان ۱۲',
          notes: 'پیشتاز شبانه',
          createdAt: new Date(Date.now() - 1 * DAY),
          items: {
            create: [
              { productId: products[1].id, quantity: 1, unitPrice: 65000000, totalPrice: 65000000 },
            ],
          },
        },
      }),
      db.order.create({
        data: {
          orderNumber: 'ORD-1005',
          customerId: allCustomers[5].id,
          status: 'cancelled',
          subtotal: 3350000,
          discount: 0,
          tax: 0,
          shippingCost: 75000,
          total: 3425000,
          shippingAddress: 'تبریز، خیابان استقلال، پلاک ۴۵',
          notes: 'کنسلی توسط مشتری',
          createdAt: new Date(Date.now() - 15 * DAY),
          items: {
            create: [
              { productId: products[3].id, quantity: 1, unitPrice: 2500000, totalPrice: 2500000 },
              { productId: products[7].id, quantity: 1, unitPrice: 850000, totalPrice: 850000 },
            ],
          },
        },
      }),
      db.order.create({
        data: {
          orderNumber: 'ORD-1006',
          customerId: allCustomers[6].id,
          status: 'delivered',
          subtotal: 5800000,
          discount: 0,
          tax: 0,
          shippingCost: 120000,
          total: 5920000,
          shippingAddress: 'کرج، میدان مادر، خیابان فردوسی',
          notes: '',
          createdAt: new Date(Date.now() - 25 * DAY),
          items: {
            create: [
              { productId: products[6].id, quantity: 1, unitPrice: 5800000, totalPrice: 5800000 },
            ],
          },
        },
      }),
    ])

    // --- 5. Inventory Items (1:1 with products) ---
    const inventoryItems = await Promise.all(
      products.map((product, index) =>
        db.inventoryItem.create({
          data: {
            productId: product.id,
            stock: [45, 12, 30, 85, 22, 8, 15, 200, 5, 18][index],
            minStock: [10, 5, 10, 20, 10, 5, 5, 50, 5, 5][index],
            warehouse: ['انبار مرکزی تهران', 'انبار مرکزی تهران', 'انبار شمال', 'انبار مرکزی تهران', 'انبار جنوب', 'انبار مرکزی تهران', 'انبار مرکزی تهران', 'انبار دیجیتال', 'انبار مرکزی تهران', 'انبار مرکزی تهران'][index],
            location: ['قفسه A-1', 'قفسه A-3', 'قفسه B-2', 'قفسه C-1', 'قفسه C-4', 'قفسه D-1', 'قفسه D-3', 'انبار مجازی', 'قفسه A-5', 'قفسه E-1'][index],
            lastRestocked: new Date(Date.now() - [3, 7, 1, 5, 2, 10, 4, 1, 14, 6][index] * DAY),
          },
        })
      )
    )

    // --- 6. Inbound Records ---
    await Promise.all([
      db.inboundRecord.create({
        data: {
          inventoryItemId: inventoryItems[0].id,
          quantity: 50,
          reference: 'PO-2024-001',
          supplier: 'شرکت سامسونگ ایران',
          unitCost: 38000000,
          notes: 'تامین محموله فصلی گوشی گلکسی',
          createdAt: new Date(Date.now() - 3 * DAY),
        },
      }),
      db.inboundRecord.create({
        data: {
          inventoryItemId: inventoryItems[3].id,
          quantity: 100,
          reference: 'PO-2024-005',
          supplier: 'کارخانه نساجی پارس',
          unitCost: 1100000,
          notes: 'تامین پیراهن مردانه برای فصل بهار',
          createdAt: new Date(Date.now() - 5 * DAY),
        },
      }),
      db.inboundRecord.create({
        data: {
          inventoryItemId: inventoryItems[5].id,
          quantity: 10,
          reference: 'PO-2024-008',
          supplier: 'شیائومی گلوبال',
          unitCost: 10000000,
          notes: 'واردات جاروبرقی رباتیک',
          createdAt: new Date(Date.now() - 10 * DAY),
        },
      }),
      db.inboundRecord.create({
        data: {
          inventoryItemId: inventoryItems[1].id,
          quantity: 15,
          reference: 'PO-2024-010',
          supplier: 'ایسوس خاورمیانه',
          unitCost: 56000000,
          notes: 'محموله لپ‌تاپ ایسوس',
          createdAt: new Date(Date.now() - 7 * DAY),
        },
      }),
    ])

    // --- 7. Outbound Records ---
    await Promise.all([
      db.outboundRecord.create({
        data: {
          inventoryItemId: inventoryItems[0].id,
          quantity: 1,
          orderId: orders[0].id,
          reference: 'SHIP-1001',
          notes: 'ارسال سفارش ORD-1001',
          createdAt: new Date(Date.now() - 18 * DAY),
        },
      }),
      db.outboundRecord.create({
        data: {
          inventoryItemId: inventoryItems[5].id,
          quantity: 1,
          orderId: orders[2].id,
          reference: 'SHIP-1003',
          notes: 'ارسال سفارش ORD-1003',
          createdAt: new Date(Date.now() - 2 * DAY),
        },
      }),
      db.outboundRecord.create({
        data: {
          inventoryItemId: inventoryItems[4].id,
          quantity: 1,
          orderId: orders[1].id,
          reference: 'SHIP-1002',
          notes: 'ارسال سفارش ORD-1002 به اصفهان',
          createdAt: new Date(Date.now() - 8 * DAY),
        },
      }),
    ])

    // --- 8. Invoices (linked to customers & orders) ---
    const invoices = await Promise.all([
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2001',
          customerId: allCustomers[0].id,
          orderId: orders[0].id,
          status: 'paid',
          subtotal: 57000000,
          tax: 2850000,
          discount: 5250000,
          total: 54600000,
          dueDate: new Date(Date.now() - 10 * DAY),
          paidAt: new Date(Date.now() - 12 * DAY),
          notes: 'فاکتور فروش گوشی و هدفون',
          items: {
            create: [
              { productId: products[0].id, description: 'گوشی هوشمند گلکسی S24', quantity: 1, unitPrice: 45000000, total: 45000000 },
              { productId: products[2].id, description: 'هدفون بی‌سیم ایرپاد پرو', quantity: 1, unitPrice: 12000000, total: 12000000 },
            ],
          },
        },
      }),
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2002',
          customerId: allCustomers[1].id,
          orderId: orders[1].id,
          status: 'sent',
          subtotal: 4800000,
          tax: 240000,
          discount: 0,
          total: 5040000,
          dueDate: new Date(Date.now() + 5 * DAY),
          notes: 'فاکتور فروش کاپشن زنانه',
          items: {
            create: [
              { productId: products[4].id, description: 'کاپشن زنانه زمستانی', quantity: 1, unitPrice: 4800000, total: 4800000 },
            ],
          },
        },
      }),
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2003',
          customerId: allCustomers[3].id,
          orderId: orders[2].id,
          status: 'draft',
          subtotal: 15000000,
          tax: 750000,
          discount: 1500000,
          total: 14250000,
          dueDate: new Date(Date.now() + 20 * DAY),
          notes: 'فاکتور فروش جاروبرقی رباتیک',
          items: {
            create: [
              { productId: products[5].id, description: 'جاروبرقی رباتیک شیائومی', quantity: 1, unitPrice: 15000000, total: 15000000 },
            ],
          },
        },
      }),
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2004',
          customerId: allCustomers[2].id,
          orderId: orders[3].id,
          status: 'overdue',
          subtotal: 65000000,
          tax: 3250000,
          discount: 0,
          total: 68250000,
          dueDate: new Date(Date.now() - 5 * DAY),
          notes: 'فاکتور فروش لپ‌تاپ — سررسید گذشته',
          items: {
            create: [
              { productId: products[1].id, description: 'لپ‌تاپ ایسوس ZenBook 14', quantity: 1, unitPrice: 65000000, total: 65000000 },
            ],
          },
        },
      }),
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2005',
          customerId: allCustomers[5].id,
          status: 'cancelled',
          subtotal: 3350000,
          tax: 167500,
          discount: 0,
          total: 3517500,
          dueDate: new Date(Date.now() - 10 * DAY),
          notes: 'فاکتور کنسل شده — درخواست مشتری',
          items: {
            create: [
              { productId: products[3].id, description: 'پیراهن مردانه اسلیم فیت', quantity: 1, unitPrice: 2500000, total: 2500000 },
              { productId: products[7].id, description: 'آموزش پیشرفته React', quantity: 1, unitPrice: 850000, total: 850000 },
            ],
          },
        },
      }),
    ])

    // --- 9. Bank Accounts ---
    const bankAccounts = await Promise.all([
      db.bankAccount.create({
        data: {
          name: 'بانک ملی',
          accountNumber: '0105-0800-1234-5678',
          balance: 850000000,
          currency: 'IRR',
          type: 'checking',
        },
      }),
      db.bankAccount.create({
        data: {
          name: 'بانک ملت',
          accountNumber: '6104-3378-9012-3456',
          balance: 420000000,
          currency: 'IRR',
          type: 'checking',
        },
      }),
      db.bankAccount.create({
        data: {
          name: 'بانک صادرات',
          accountNumber: '6037-9975-1234-5678',
          balance: 215000000,
          currency: 'IRR',
          type: 'savings',
        },
      }),
    ])

    // --- 10. Transactions ---
    const transactions = await Promise.all([
      db.transaction.create({
        data: {
          type: 'income',
          amount: 54600000,
          description: 'پرداخت فاکتور INV-2001 — Acme Corporation',
          category: 'فروش',
          invoiceId: invoices[0].id,
          bankAccountId: bankAccounts[0].id,
          reference: 'TXN-3001',
          createdAt: new Date(Date.now() - 12 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'expense',
          amount: 1900000000,
          description: 'خرید محموله گوشی از سامسونگ',
          category: 'خرید',
          bankAccountId: bankAccounts[0].id,
          reference: 'TXN-3002',
          createdAt: new Date(Date.now() - 3 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'expense',
          amount: 85000000,
          description: 'پرداخت حقوق خرداد ماه — تیم فنی',
          category: 'حقوق',
          bankAccountId: bankAccounts[1].id,
          reference: 'TXN-3003',
          createdAt: new Date(Date.now() - 2 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'expense',
          amount: 45000000,
          description: 'اجاره دفتر مرکزی تیرماه',
          category: 'اجاره',
          bankAccountId: bankAccounts[0].id,
          reference: 'TXN-3004',
          createdAt: new Date(Date.now() - 1 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'income',
          amount: 5040000,
          description: 'پیش‌پرداخت فاکتور INV-2002 — Globex Industries',
          category: 'فروش',
          invoiceId: invoices[1].id,
          bankAccountId: bankAccounts[1].id,
          reference: 'TXN-3005',
          createdAt: new Date(Date.now() - 5 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'expense',
          amount: 25000000,
          description: 'هزینه تبلیغات گوگل ادز — تیرماه',
          category: 'تبلیغات',
          bankAccountId: bankAccounts[2].id,
          reference: 'TXN-3006',
          createdAt: new Date(Date.now() - 4 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'expense',
          amount: 15000000,
          description: 'خرید تجهیزات اداری — مانیتور و صندلی',
          category: 'خرید',
          bankAccountId: bankAccounts[2].id,
          reference: 'TXN-3007',
          createdAt: new Date(Date.now() - 8 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'income',
          amount: 5920000,
          description: 'پرداخت فاکتور INV-2005 — Soylent Corp',
          category: 'فروش',
          invoiceId: invoices[4].id,
          bankAccountId: bankAccounts[0].id,
          reference: 'TXN-3008',
          createdAt: new Date(Date.now() - 20 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'expense',
          amount: 35000000,
          description: 'پرداخت حقوق تیرماه — تیم بازاریابی',
          category: 'حقوق',
          bankAccountId: bankAccounts[1].id,
          reference: 'TXN-3009',
          createdAt: new Date(Date.now() - 2 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'income',
          amount: 15000000,
          description: 'پرداخت فاکتور INV-2003 — Stark Enterprises',
          category: 'فروش',
          invoiceId: invoices[2].id,
          bankAccountId: bankAccounts[0].id,
          reference: 'TXN-3010',
          createdAt: new Date(Date.now() - 1 * DAY),
        },
      }),
    ])

    // --- 11. CRM Activities ---
    await Promise.all([
      db.crmActivity.create({
        data: {
          customerId: allCustomers[0].id,
          type: 'call',
          title: 'تماس پیگیری سفارش',
          description: 'تماس با مشتری جهت پیگیری تحویل سفارش ORD-1001',
          outcome: 'موفق — مشتری رضایت داشت',
          scheduledAt: new Date(Date.now() - 18 * DAY),
          completedAt: new Date(Date.now() - 18 * DAY),
        },
      }),
      db.crmActivity.create({
        data: {
          customerId: allCustomers[1].id,
          type: 'email',
          title: 'ارسال پیشنهاد ویژه',
          description: 'ارسال ایمیل با تخفیف ۲۰٪ برای خریدهای بعدی',
          outcome: 'باز شده — لینک کلیک شده',
          scheduledAt: new Date(Date.now() - 7 * DAY),
          completedAt: new Date(Date.now() - 7 * DAY),
        },
      }),
      db.crmActivity.create({
        data: {
          customerId: allCustomers[2].id,
          type: 'meeting',
          title: 'جلسه مذاکره قرارداد',
          description: 'جلسه حضوری برای بررسی قرارداد سالانه همکاری',
          outcome: 'توافق اولیه — منتظر تایید نهایی',
          scheduledAt: new Date(Date.now() - 2 * DAY),
          completedAt: new Date(Date.now() - 2 * DAY),
        },
      }),
      db.crmActivity.create({
        data: {
          customerId: allCustomers[3].id,
          type: 'deal',
          title: 'مذاکره خرید عمده',
          description: 'درخواست خرید ۵۰ دستگاه لپ‌تاپ با تخفیف ویژه',
          outcome: 'در حال بررسی قیمت',
          scheduledAt: new Date(Date.now() + 3 * DAY),
        },
      }),
      db.crmActivity.create({
        data: {
          customerId: allCustomers[5].id,
          type: 'note',
          title: 'یادداشت تماس مشتری',
          description: 'مشتری درخواست استرداد وجه سفارش کنسل شده را دارد',
          outcome: '',
          scheduledAt: new Date(Date.now() - 1 * DAY),
          completedAt: new Date(Date.now() - 1 * DAY),
        },
      }),
      db.crmActivity.create({
        data: {
          customerId: allCustomers[6].id,
          type: 'email',
          title: 'ارسال فاکتور',
          description: 'ارسال فاکتور خرید آب‌میوه‌گیری فیلیپس',
          outcome: 'تحویل داده شد',
          scheduledAt: new Date(Date.now() - 22 * DAY),
          completedAt: new Date(Date.now() - 22 * DAY),
        },
      }),
      db.crmActivity.create({
        data: {
          customerId: allCustomers[3].id,
          type: 'call',
          title: 'پیگیری پرداخت',
          description: 'تماس جهت پیگیری فاکتور سررسید گذشته INV-2004',
          outcome: 'مشتری قول پرداخت تا پایان هفته را داد',
          scheduledAt: new Date(Date.now() - 1 * DAY),
          completedAt: new Date(Date.now() - 1 * DAY),
        },
      }),
      db.crmActivity.create({
        data: {
          customerId: allCustomers[0].id,
          type: 'meeting',
          title: 'جلسه بررسی نیازهای جدید',
          description: 'بررسی نیازهای فناوری اطلاعات شرکت Acme برای فصل بعد',
          outcome: '',
          scheduledAt: new Date(Date.now() + 5 * DAY),
        },
      }),
    ])

    // --- 12. Budget Items ---
    const budgetItems = await Promise.all([
      db.budgetItem.create({
        data: {
          name: 'بودجه بازاریابی',
          category: 'بازاریابی',
          allocated: 200000000,
          spent: 145000000,
          period: 'monthly',
          startDate: new Date(Date.now() - 30 * DAY),
          endDate: new Date(Date.now()),
        },
      }),
      db.budgetItem.create({
        data: {
          name: 'بودجه عملیات',
          category: 'عملیات',
          allocated: 350000000,
          spent: 310000000,
          period: 'monthly',
          startDate: new Date(Date.now() - 30 * DAY),
          endDate: new Date(Date.now()),
        },
      }),
      db.budgetItem.create({
        data: {
          name: 'حقوق و دستمزد',
          category: 'حقوق و دستمزد',
          allocated: 500000000,
          spent: 470000000,
          period: 'monthly',
          startDate: new Date(Date.now() - 30 * DAY),
          endDate: new Date(Date.now()),
        },
      }),
      db.budgetItem.create({
        data: {
          name: 'بودجه توسعه نرم‌افزار',
          category: 'توسعه',
          allocated: 300000000,
          spent: 180000000,
          period: 'quarterly',
          startDate: new Date(Date.now() - 90 * DAY),
          endDate: new Date(Date.now()),
        },
      }),
      db.budgetItem.create({
        data: {
          name: 'نگهداری سرور و زیرساخت',
          category: 'نگهداری',
          allocated: 80000000,
          spent: 62000000,
          period: 'monthly',
          startDate: new Date(Date.now() - 30 * DAY),
          endDate: new Date(Date.now()),
        },
      }),
    ])

    // =========================================================================
    // NEW SEED DATA — Task 4 Enhancements
    // =========================================================================

    // --- 13. Additional Activity Logs (5 store-related) ---
    await Promise.all([
      db.activityLog.create({
        data: {
          action: 'order.created',
          details: 'سفارش جدید ORD-1004 ثبت شد — لپ‌تاپ ایسوس ZenBook 14',
          userId: null,
          createdAt: new Date(Date.now() - 1 * DAY),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'order.shipped',
          details: 'سفارش ORD-1002 به اصفهان ارسال شد',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 8 * DAY),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'product.created',
          details: 'محصول جدید "جاروبرقی رباتیک شیائومی" اضافه شد',
          userId: users[1].id,
          createdAt: new Date(Date.now() - 12 * DAY),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'inventory.low_stock',
          details: 'هشدار: موجودی جاروبرقی رباتیک (۸ عدد) کمتر از حداقل است',
          userId: null,
          createdAt: new Date(Date.now() - 6 * HOUR),
        },
      }),
      db.activityLog.create({
        data: {
          action: 'order.delivered',
          details: 'سفارش ORD-1001 با موفقیت تحویل داده شد — Acme Corporation',
          userId: users[0].id,
          createdAt: new Date(Date.now() - 18 * DAY),
        },
      }),
    ])

    // --- 14. Additional Invoices (3 more) ---
    const extraInvoices = await Promise.all([
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2006',
          customerId: allCustomers[3].id,
          status: 'paid',
          subtotal: 14250000,
          tax: 712500,
          discount: 0,
          total: 14962500,
          dueDate: new Date(Date.now() - 15 * DAY),
          paidAt: new Date(Date.now() - 18 * DAY),
          notes: 'فاکتور فروش جاروبرقی — پرداخت کامل',
          items: {
            create: [
              { productId: products[5].id, description: 'جاروبرقی رباتیک شیائومی', quantity: 1, unitPrice: 14250000, total: 14250000 },
            ],
          },
        },
      }),
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2007',
          customerId: allCustomers[7].id,
          orderId: orders[5].id,
          status: 'sent',
          subtotal: 5800000,
          tax: 290000,
          discount: 0,
          total: 6090000,
          dueDate: new Date(Date.now() + 7 * DAY),
          notes: 'فاکتور آب‌میوه‌گیری فیلیپس — ارسال شده',
          items: {
            create: [
              { productId: products[6].id, description: 'آب‌میوه‌گیری چندکاره فیلیپس', quantity: 1, unitPrice: 5800000, total: 5800000 },
            ],
          },
        },
      }),
      db.invoice.create({
        data: {
          invoiceNumber: 'INV-2008',
          customerId: allCustomers[0].id,
          status: 'draft',
          subtotal: 57000000,
          tax: 2850000,
          discount: 5700000,
          total: 54150000,
          dueDate: new Date(Date.now() + 30 * DAY),
          notes: 'پیش‌فاکتور سفارش تکراری مشتری — منتظر تایید',
          items: {
            create: [
              { productId: products[0].id, description: 'گوشی هوشمند گلکسی S24', quantity: 1, unitPrice: 42000000, total: 42000000 },
              { productId: products[2].id, description: 'هدفون بی‌سیم ایرپاد پرو', quantity: 1, unitPrice: 10500000, total: 10500000 },
              { productId: products[7].id, description: 'آموزش پیشرفته React', quantity: 1, unitPrice: 650000, total: 650000 },
            ],
          },
        },
      }),
    ])

    // --- 15. Additional Transactions (5 more) ---
    await Promise.all([
      db.transaction.create({
        data: {
          type: 'income',
          amount: 14962500,
          description: 'پرداخت فاکتور INV-2006 — Wayne Tech',
          category: 'فروش',
          invoiceId: extraInvoices[0].id,
          bankAccountId: bankAccounts[0].id,
          reference: 'TXN-3011',
          createdAt: new Date(Date.now() - 18 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'expense',
          amount: 12000000,
          description: 'تمدید لایسنس سرور و دامنه',
          category: 'زیرساخت',
          bankAccountId: bankAccounts[2].id,
          reference: 'TXN-3012',
          createdAt: new Date(Date.now() - 6 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'income',
          amount: 25000000,
          description: 'پروژه طراحی وب‌سایت — پرداخت مرحله اول',
          category: 'پروژه',
          bankAccountId: bankAccounts[1].id,
          reference: 'TXN-3013',
          createdAt: new Date(Date.now() - 9 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'expense',
          amount: 8500000,
          description: 'خرید اشتراک ابزارهای طراحی — Figma و Adobe CC',
          category: 'اشتراک',
          bankAccountId: bankAccounts[1].id,
          reference: 'TXN-3014',
          createdAt: new Date(Date.now() - 3 * DAY),
        },
      }),
      db.transaction.create({
        data: {
          type: 'expense',
          amount: 50000000,
          description: 'هزینه سفر کاری تیم فروش — نمایشگاه صنعت',
          category: 'سفر',
          bankAccountId: bankAccounts[0].id,
          reference: 'TXN-3015',
          createdAt: new Date(Date.now() - 11 * DAY),
        },
      }),
    ])

    // --- 16. Notifications (18 realistic Persian notifications) ---
    // Use fresh PrismaClient to ensure the newly-added model is available
    const freshDb = getFreshDb()
    const notifications = await Promise.all([
      freshDb.notification.create({
        data: {
          title: 'مقاله جدید منتشر شد',
          message: 'مقاله "شروع با Next.js 14" با موفقیت منتشر شد.',
          type: 'success',
          read: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'نظر جدید در انتظار بررسی',
          message: 'نظر از رضا محمدی روی مقاله "بهترین روش‌های سئو ۲۰۲۴" نیاز به بررسی دارد.',
          type: 'warning',
          read: false,
          createdAt: new Date(Date.now() - 2 * HOUR),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'بروزرسانی سیستم',
          message: 'سیستم مدیریت محتوا Smart CMS به نسخه ۲.۰ ارتقا یافت.',
          type: 'info',
          read: true,
          createdAt: new Date(Date.now() - 5 * HOUR),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'پروژه "بازطراحی وب‌سایت" به ۶۵٪ رسید',
          message: 'پیشرفت پروژه وب‌سایت به ۶۵ درصد رسید. مهلت پایان ۱۵ روز دیگر است.',
          type: 'info',
          read: true,
          createdAt: new Date(Date.now() - 8 * HOUR),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'خطا در پشتیبان‌گیری',
          message: 'پشتیبان‌گیری خودکار شبانه با خطا مواجه شد. لطفاً بررسی کنید.',
          type: 'error',
          read: false,
          createdAt: new Date(Date.now() - 12 * HOUR),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'کاربر جدید ثبت‌نام کرد',
          message: 'کاربر جدید "نازنین پارک" در سیستم ثبت‌نام کرد.',
          type: 'success',
          read: true,
          createdAt: new Date(Date.now() - 1 * DAY),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'سفارش جدید ثبت شد',
          message: 'سفارش ORD-1004 از مشتری Stark Enterprises ثبت شد — مبلغ ۶۵,۲۰۰,۰۰۰ تومان.',
          type: 'info',
          read: false,
          createdAt: new Date(Date.now() - 1 * DAY),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'هشدار موجودی کم',
          message: 'موجودی جاروبرقی رباتیک شیائومی به ۸ عدد رسیده و کمتر از حداقل مجاز است.',
          type: 'warning',
          read: false,
          createdAt: new Date(Date.now() - 6 * HOUR),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'فاکتور سررسید گذشته',
          message: 'فاکتور INV-2004 مربوط به Stark Enterprises سررسید گذشته و مبلغ ۶۸,۲۵۰,۰۰۰ تومان واریز نشده.',
          type: 'error',
          read: false,
          createdAt: new Date(Date.now() - 5 * DAY),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'سفارش با موفقیت تحویل داده شد',
          message: 'سفارش ORD-1001 به آدرس تهران، خیابان ولیعصر تحویل داده شد.',
          type: 'success',
          read: true,
          createdAt: new Date(Date.now() - 18 * DAY),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'تخفیف ویژه تابستانه',
          message: 'کد تخفیف SUMMER20 با ۲۰٪ تخفیف فعال شد و به ۵۰ استفاده می‌رسد.',
          type: 'info',
          read: true,
          createdAt: new Date(Date.now() - 3 * DAY),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'مشتری جدید اضافه شد',
          message: 'شرکت "فناوری گاما" به عنوان مشتری بالقوه در سیستم ثبت شد.',
          type: 'success',
          read: true,
          createdAt: new Date(Date.now() - 4 * DAY),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'مهلت تسک نزدیک است',
          message: 'تسک "بررسی و تایید نظرات جدید" فردا سررسید می‌شود.',
          type: 'warning',
          read: false,
          createdAt: new Date(Date.now() - 8 * HOUR),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'خرید عمده جدید',
          message: 'درخواست خرید ۵۰ دستگاه لپ‌تاپ از Wayne Tech دریافت شد.',
          type: 'info',
          read: false,
          createdAt: new Date(Date.now() - 2 * DAY),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'پرداخت موفق فاکتور',
          message: 'مبلغ ۵۴,۶۰۰,۰۰۰ تومان برای فاکتور INV-2001 از Acme Corporation واریز شد.',
          type: 'success',
          read: true,
          createdAt: new Date(Date.now() - 12 * DAY),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'خطای پرداخت درگاه',
          message: 'یک تراکنش از درگاه پرداخت به دلیل قطع ارتباط با بانک ناموفق بود.',
          type: 'error',
          read: false,
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'همگام‌سازی وردپرس موفق',
          message: '۳ مقاله جدید از سایت وردپرس با موفقیت همگام‌سازی شدند.',
          type: 'success',
          read: true,
          createdAt: new Date(Date.now() - 2 * DAY),
        },
      }),
      freshDb.notification.create({
        data: {
          title: 'گواهی SSL منقضی می‌شود',
          message: 'گواهی SSL دامنه اصلی تا ۷ روز دیگر منقضی می‌شود. لطفاً اقدام کنید.',
          type: 'warning',
          read: false,
          createdAt: new Date(Date.now() - 3 * HOUR),
        },
      }),
    ])
    await freshDb.$disconnect()

    // --- 17. Calendar Events (7 events with Persian titles) ---
    const calendarEvents = await Promise.all([
      db.calendarEvent.create({
        data: {
          title: 'جلسه هفتگی تیم فنی',
          description: 'بررسی وضعیت پروژه‌ها و برنامه‌ریزی هفته آینده',
          startDate: new Date(Date.now() + 1 * DAY + 10 * HOUR),
          endDate: new Date(Date.now() + 1 * DAY + 12 * HOUR),
          allDay: false,
          color: 'blue',
          location: 'اتاق جلسات ۱ — طبقه دوم',
          type: 'meeting',
        },
      }),
      db.calendarEvent.create({
        data: {
          title: 'جشن سالگرد تاسیس شرکت',
          description: 'مراسم جشن سالگرد پنجم تاسیس شرکت با حضور همه اعضا',
          startDate: new Date(Date.now() + 5 * DAY),
          endDate: new Date(Date.now() + 5 * DAY),
          allDay: true,
          color: 'violet',
          location: 'سالن همایش‌های البرز',
          type: 'event',
        },
      }),
      db.calendarEvent.create({
        data: {
          title: 'آموزش React Server Components',
          description: 'جلسه آموزشی داخلی درباره الگوهای پیشرفته RSC و Next.js 16',
          startDate: new Date(Date.now() + 2 * DAY + 14 * HOUR),
          endDate: new Date(Date.now() + 2 * DAY + 17 * HOUR),
          allDay: false,
          color: 'emerald',
          location: 'آنلاین — Google Meet',
          type: 'event',
        },
      }),
      db.calendarEvent.create({
        data: {
          title: 'جلسه مذاکره با مشتری — Wayne Tech',
          description: 'بحث درباره قرارداد سالانه و خرید عمده تجهیزات',
          startDate: new Date(Date.now() + 3 * DAY + 11 * HOUR),
          endDate: new Date(Date.now() + 3 * DAY + 13 * HOUR),
          allDay: false,
          color: 'orange',
          location: 'دفتر مشتری — مشهد',
          type: 'meeting',
        },
      }),
      db.calendarEvent.create({
        data: {
          title: 'مهلت تحویل پروژه بازطراحی',
          description: 'مهلت نهایی تحویل فاز اول پروژه بازطراحی وب‌سایت',
          startDate: new Date(Date.now() + 15 * DAY),
          endDate: new Date(Date.now() + 15 * DAY),
          allDay: true,
          color: 'red',
          location: '',
          type: 'deadline',
        },
      }),
      db.calendarEvent.create({
        data: {
          title: 'نمایشگاه بین‌المللی فناوری',
          description: 'شرکت در نمایشگاه و غرفه‌گذاری محصولات شرکت',
          startDate: new Date(Date.now() + 20 * DAY),
          endDate: new Date(Date.now() + 22 * DAY),
          allDay: true,
          color: 'purple',
          location: 'محل نمایشگاه تهران',
          type: 'event',
        },
      }),
      db.calendarEvent.create({
        data: {
          title: 'بازبینی عملکرد فصلی',
          description: 'ارائه گزارش عملکرد Q2 و برنامه‌ریزی Q3 — حضور مدیران ارشد الزامی',
          startDate: new Date(Date.now() + 10 * DAY + 9 * HOUR),
          endDate: new Date(Date.now() + 10 * DAY + 12 * HOUR),
          allDay: false,
          color: 'cyan',
          location: 'اتاق جلسات اصلی',
          type: 'meeting',
        },
      }),
    ])

    // =========================================================================
    // Return summary
    // =========================================================================
    return NextResponse.json({
      message: force ? 'Database force-reseeded successfully' : 'Database seeded successfully',
      seeded: true,
      forced: !!force,
      counts: {
        categories: categories.length,
        tags: tags.length,
        users: users.length,
        posts: posts.length,
        customers: allCustomers.length,
        projects: 7,
        teamMembers: 7,
        media: 4,
        activityLogs: 17,
        settings: defaultSettings.length,
        tasks: taskData.length,
        quickNotes: 4,
        // Business entities
        productCategories: productCategories.length,
        products: products.length,
        coupons: coupons.length,
        orders: orders.length,
        inventoryItems: inventoryItems.length,
        inboundRecords: 4,
        outboundRecords: 3,
        invoices: invoices.length + extraInvoices.length,
        transactions: transactions.length + 5,
        bankAccounts: bankAccounts.length,
        crmActivities: 8,
        budgetItems: budgetItems.length,
        // New entities
        notifications: notifications.length,
        calendarEvents: calendarEvents.length,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
