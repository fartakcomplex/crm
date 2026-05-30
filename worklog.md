---
Task ID: 1
Agent: Main Agent
Task: Clone and deploy CRM project from GitHub

Work Log:
- Cloned repository from https://github.com/fartakcomplex/crm
- Analyzed project structure: Full-featured Persian (Farsi) RTL CRM/CMS application
- Stopped existing dev server on port 3000
- Copied all project files from /home/z/crm to /home/z/my-project
- Created required directories (db, upload, backups, download)
- Installed all npm dependencies via bun
- Pushed Prisma schema to SQLite database
- Started Next.js dev server on port 3000 (Turbopack)
- Verified server is running with GET / 200 response

Stage Summary:
- Project: Smart CMS v2.0 - A comprehensive Persian CRM/CMS/ERP system
- Features: Dashboard, Content Management, Media, Users, Team, Customers, Projects,
  AI Assistant, AI Content Studio, Reports, Activities, Comments, Notifications,
  WordPress Integration, Settings, Tasks, Calendar, Store, CRM, Accounting, Inventory, Finance
- Tech Stack: Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma (SQLite), Zustand, TanStack Query
- Server: Running on http://localhost:3000 (Turbopack enabled)
- Database: SQLite at /home/z/my-project/db/custom.db
- Status: Successfully deployed and accessible
