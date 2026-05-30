# Smart CMS v2.0 — Persian (Farsi) RTL Content Management System

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-2d3748?logo=prisma)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎯 Core Modules (20+)
- **Dashboard** — Real-time analytics, Persian calendar, top customers, quick draft
- **Content Management** — Posts, categories, tags, comments, media library
- **Task Management** — Kanban board, priorities, status tracking
- **User Management** — Roles, permissions, user profiles
- **CRM** — Customer management, interaction tracking
- **Projects** — Project boards, progress tracking
- **Finance** — Income/expense tracking, reports, charts
- **Accounting** — Invoice management, financial reports
- **Inventory** — Stock management, product tracking
- **Store** — Products, orders, coupons
- **AI Assistant** — Integrated AI chatbot
- **AI Studio** — AI-powered content generation
- **Reports** — Data visualization and analytics
- **Activities** — Activity log and timeline
- **Notifications** — Real-time notification center
- **Calendar** — Persian (Jalali) calendar integration
- **Teams** — Team member management
- **WordPress** — WordPress integration
- **Settings** — System configuration

### 📱 Mobile Responsive
- Fully responsive design (375px+)
- Mobile bottom navigation bar with 5 quick tabs
- Floating Action Button with quick actions
- Scroll-to-top button
- Touch-optimized targets (44px minimum)
- Safe area support for iOS devices
- RTL-optimized layouts

### 🎨 Design System
- **Glass morphism** effects with backdrop-blur
- **Gradient borders** and animated hover effects
- **Dark/Light mode** with persistence
- **RTL layout** optimized for Persian/Arabic
- **Vazirmatn font** for Persian typography
- **Framer Motion** animations
- **Recharts** for data visualization
- **shadcn/ui** component library

### ⚡ Technical Features
- **WebSocket notifications** (real-time)
- **Advanced search API** (8 model types)
- **Command palette** (Ctrl+K / ⌘K)
- **Keyboard shortcuts** with discovery tracking
- **Drag-and-drop** notes widget
- **Data export** (JSON + CSV)
- **Onboarding wizard** for new users
- **Performance monitoring**
- **Auto-scroll progress indicator**
- **Quick stats bar** with live data

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [TypeScript 5](https://typescriptlang.org/) | Type-safe JavaScript |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS |
| [shadcn/ui](https://ui.shadcn.com/) | Component library |
| [Prisma ORM](https://prisma.io/) | Database management (SQLite) |
| [Zustand](https://zustand-demo.pmnd.rs/) | Client state management |
| [TanStack Query](https://tanstack.com/query) | Server state management |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [Recharts](https://recharts.org/) | Charts and data visualization |
| [next-themes](https://github.com/pacocoursey/next-themes) | Dark/Light theme |
| [Socket.IO](https://socket.io/) | WebSocket notifications |
| [date-fns](https://date-fns.org/) | Date utilities with Jalali support |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd crm

# Install dependencies
bun install
# or: npm install

# Set up database
bun run db:push
# or: npx prisma db push

# (Optional) Seed database
bun run db:seed

# Start development server
bun run dev
# or: npm run dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="file:./dev.db"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (search, stats, export, activity)
│   ├── (dashboard)/       # Dashboard layout group
│   └── page.tsx           # Main application page
├── components/
│   ├── cms/               # CMS-specific components
│   ├── dashboard/         # Dashboard widgets
│   ├── floating/          # Floating UI elements
│   ├── onboarding/        # Onboarding wizard
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   ├── db.ts             # Prisma client
│   └── store.ts          # Zustand stores
└── types/                 # TypeScript type definitions
```

## 🌐 Localization

This CMS is fully localized in **Persian (Farsi)** with RTL support:
- All UI text in Farsi
- Jalali (Persian) calendar
- Persian number formatting
- Toman currency
- RTL-optimized layouts and animations

## 📊 Screenshots

| Dashboard | Mobile View |
|---|---|
| Desktop dashboard with analytics, charts, and widgets | Fully responsive mobile layout with bottom navigation |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
</p>
