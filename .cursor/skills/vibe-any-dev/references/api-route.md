# API 路由

## 文件路径约定

- 普通 API: `src/routes/api/{module}/{endpoint}.ts`
- Admin API: `src/routes/api/admin/{endpoint}.ts`（自动继承 `apiAdminMiddleware`，无需手动添加）

## 中间件选择

| 场景 | 中间件 | 说明 |
|------|--------|------|
| 公开 | 不需要 | 无认证要求 |
| 需登录 | `apiAuthMiddleware` | 未登录返回 401 |
| 管理员 | 放在 `api/admin/` 目录下 | 自动继承，无需显式声明 |

```ts
import { apiAuthMiddleware } from "@/shared/middleware/auth.middleware"
```

## 模板 A：CRUD 接口

适用: 单资源的增删改查，如积分包、标签等。

文件: `src/routes/api/admin/{name}.ts`（或 `src/routes/api/{name}.ts`）

```ts
import { createFileRoute } from "@tanstack/react-router"
import { asc, eq } from "drizzle-orm"
import { z } from "zod/v4"
import { db, example } from "@/db"
import { Resp } from "@/shared/lib/tools/response"

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

const updateSchema = createSchema.partial().extend({
  id: z.string().uuid(),
})

export const Route = createFileRoute("/api/admin/{name}")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const items = await db
            .select()
            .from(example)
            .orderBy(asc(example.sortOrder))

          return Resp.success(items)
        } catch (error) {
          console.error("Failed to fetch:", error)
          return Resp.error("Failed to fetch")
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const data = createSchema.parse(body)

          const [created] = await db
            .insert(example)
            .values(data)
            .returning()

          return Resp.success(created)
        } catch (error) {
          if (error instanceof z.ZodError) {
            return Resp.error(`Invalid data: ${error.issues.map((i) => i.message).join(", ")}`, 400)
          }
          console.error("Failed to create:", error)
          return Resp.error("Failed to create")
        }
      },

      PUT: async ({ request }) => {
        try {
          const body = await request.json()
          const { id, ...data } = updateSchema.parse(body)

          const [updated] = await db
            .update(example)
            .set(data)
            .where(eq(example.id, id))
            .returning()

          if (!updated) {
            return Resp.error("Not found", 404)
          }

          return Resp.success(updated)
        } catch (error) {
          if (error instanceof z.ZodError) {
            return Resp.error(`Invalid data: ${error.issues.map((i) => i.message).join(", ")}`, 400)
          }
          console.error("Failed to update:", error)
          return Resp.error("Failed to update")
        }
      },

      DELETE: async ({ request }) => {
        try {
          const { searchParams } = new URL(request.url)
          const id = searchParams.get("id")

          if (!id) {
            return Resp.error("ID is required", 400)
          }

          const [deleted] = await db
            .delete(example)
            .where(eq(example.id, id))
            .returning()

          if (!deleted) {
            return Resp.error("Not found", 404)
          }

          return Resp.success({ deleted: true })
        } catch (error) {
          console.error("Failed to delete:", error)
          return Resp.error("Failed to delete")
        }
      },
    },
  },
})
```

## 模板 B：列表 + 分页 + 筛选

适用: 管理后台的数据列表，支持搜索、筛选、排序、分页。

```ts
import { createFileRoute } from "@tanstack/react-router"
import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm"
import { db, example } from "@/db"
import { Resp } from "@/shared/lib/tools/response"

export const Route = createFileRoute("/api/admin/{name}")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const page = Math.max(1, Number(url.searchParams.get("page")) || 1)
          const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize")) || 10))
          const offset = (page - 1) * pageSize

          const search = url.searchParams.get("search")?.trim()
          const sortBy = url.searchParams.get("sortBy") || "createdAt"
          const sortOrder = url.searchParams.get("sortOrder") || "desc"

          const conditions: SQL[] = []

          if (search) {
            conditions.push(
              or(
                ilike(example.name, `%${search}%`),
                ilike(example.description, `%${search}%`)
              )!
            )
          }

          const whereClause = conditions.length > 0 ? and(...conditions) : undefined

          const orderByColumn = sortBy === "name" ? example.name : example.createdAt
          const orderBy = sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn)

          const [[{ total }], items] = await Promise.all([
            db.select({ total: count() }).from(example).where(whereClause),
            db
              .select()
              .from(example)
              .where(whereClause)
              .orderBy(orderBy)
              .limit(pageSize)
              .offset(offset),
          ])

          return Resp.success({
            items,
            pagination: {
              page,
              pageSize,
              total,
              totalPages: Math.ceil(total / pageSize),
            },
          })
        } catch (error) {
          console.error("Failed to fetch:", error)
          return Resp.error("Failed to fetch")
        }
      },
    },
  },
})
```

### 标准分页响应格式

```ts
{
  items: T[],
  pagination: {
    page: number,
    pageSize: number,
    total: number,
    totalPages: number,
  }
}
```

## 模板 C：需认证的普通接口

适用: 非管理员但需要登录的接口。

```ts
import { createFileRoute } from "@tanstack/react-router"
import { Resp } from "@/shared/lib/tools/response"
import { apiAuthMiddleware } from "@/shared/middleware/auth.middleware"

export const Route = createFileRoute("/api/{name}")({
  server: {
    middleware: [apiAuthMiddleware],
    handlers: {
      POST: async ({ request, context }) => {
        try {
          const userId = context.session.user.id
          const body = await request.json()

          // 业务逻辑...

          return Resp.success(result)
        } catch (error) {
          console.error("Error:", error)
          return Resp.error(error instanceof Error ? error.message : "Unknown error", 500)
        }
      },
    },
  },
})
```

## 禁忌

- 不要用 `Response.json()` 直接返回，必须用 `Resp`
- zod 导入路径是 `"zod/v4"` 不是 `"zod"`
- Admin 路由放在 `api/admin/` 下即可，不需要手动加 `apiAdminMiddleware`
- `createFileRoute` 的路径字符串必须与文件路径完全匹配
