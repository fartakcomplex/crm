# Task 4 - CRUD API Routes

## Summary
Created all 14 API route files for the Smart CMS project under `/src/app/api/`.

## Files Created

### CRUD Routes (7 files)
1. **`/api/posts/route.ts`** - Full Post CRUD with includes (author, category, tags, comment count), pagination, filtering by status/category/search
2. **`/api/users/route.ts`** - Full User CRUD with post/activity counts, pagination, filtering by role/status/search
3. **`/api/customers/route.ts`** - Full Customer CRUD with pagination, filtering by status/search
4. **`/api/projects/route.ts`** - Full Project CRUD with date handling, pagination, filtering by status/priority/search
5. **`/api/team/route.ts`** - Full TeamMember CRUD with pagination, filtering by department/role/status
6. **`/api/media/route.ts`** - Full Media CRUD with FormData file upload (saves to public/uploads), physical file cleanup on delete
7. **`/api/comments/route.ts`** - Full Comment CRUD with post include, post existence validation on create

### Supporting Routes (7 files)
8. **`/api/stats/route.ts`** - Dashboard stats (overview, content, engagement, users, customers, projects, postsByStatus)
9. **`/api/charts/route.ts`** - Chart data (monthly views 12mo, category distribution, weekly activity 7d, content status)
10. **`/api/activities/route.ts`** - Recent activity logs with user include, limit param
11. **`/api/categories/route.ts`** - GET all, POST create, PUT update, DELETE (nullifies categoryId on posts)
12. **`/api/tags/route.ts`** - GET all, POST create, DELETE (cleans up PostTag relations)
13. **`/api/settings/route.ts`** - GET all (grouped by group), PUT (upsert by key)
14. **`/api/seed/route.ts`** - Idempotent seeder (checks existing data first) with 5 categories, 8 tags, 4 users, 6 posts, 5 comments, 5 customers, 5 projects, 5 team members, 4 media, 8 activity logs, 20 settings

## Patterns Used
- All routes use `import { db } from '@/lib/db'`
- `NextResponse.json()` with proper HTTP status codes (200, 201, 400, 404, 500)
- Try/catch error handling with console.error logging
- Pagination support (page, limit query params) on list endpoints
- Filtering support (status, category, search) on relevant endpoints
- Query params for GET by id (`?id=xxx`) and for DELETE (`?id=xxx`)
- JSON body for POST/PUT operations
- Unique constraint error detection on POST (email, name, slug)
- Cascade cleanup on DELETE (PostTag, Comment relations)

## Verification
- `bun run db:push` - Database schema already in sync
- `bun run lint` - 0 errors, 0 warnings
