---
name: vibe-any-dev
description: Full-stack development guide for the VibeAny project. Covers creating pages, API routes, database tables, admin panels, landing page sections, i18n content, and server functions. Use when building any new feature, page, API endpoint, or modifying the landing page in this TanStack Start + React + Drizzle + Intlayer codebase.
---

# VibeAny 全栈开发指南

## 需求路由表

根据需求类型，阅读对应的 reference 文件：

| 需求 | 阅读 |
|------|------|
| 修改落地页内容/显隐 | [landing-page.md](references/landing-page.md) 操作 A |
| 新增落地页区块 | [landing-page.md](references/landing-page.md) 操作 B + [intlayer-i18n.md](references/intlayer-i18n.md) |
| 创建新公开页面 | [page-route.md](references/page-route.md) + [intlayer-i18n.md](references/intlayer-i18n.md) |
| 创建需认证页面 | [page-route.md](references/page-route.md) + [server-action.md](references/server-action.md) |
| 新增管理后台页面 | [admin-page.md](references/admin-page.md)（端到端流程，内部引用其他 reference） |
| 新增 API 接口 | [api-route.md](references/api-route.md)（如需新表 + [db-schema.md](references/db-schema.md)） |
| 新增数据库表 | [db-schema.md](references/db-schema.md) |
| 页面数据获取/变更 | [server-action.md](references/server-action.md) |
| 数据表格 | 使用已有的 `data-table` skill |
| AI 聊天组件 | 使用已有的 `ai-elements` skill |

## 全局规则

以下规则适用于所有开发场景，任何 reference 中的代码都必须遵守。

### Import 别名

所有项目内 import 使用 `@/` 前缀：

```ts
import { db } from "@/db"
import { Resp } from "@/shared/lib/tools/response"
import { cn } from "@/shared/lib/utils"
```

### className 拼接

禁止模板字面量拼接，使用 `cn()` 函数：

```tsx
// 正确
import { cn } from "@/shared/lib/utils"
<div className={cn("base-class", isActive && "active-class")} />

// 错误
<div className={`base-class ${isActive ? "active-class" : ""}`} />
```

### 路由链接

禁止使用 TanStack Router 的 `<Link>`，使用 `LocalizedLink`：

```tsx
import { LocalizedLink } from "@/shared/components/locale/localized-link"
<LocalizedLink to="/chat">Chat</LocalizedLink>
```

编程式跳转：

```ts
import { useLocalizedNavigate } from "@/shared/hooks/use-localized-navigate"
const navigate = useLocalizedNavigate()
navigate({ to: "/chat" })
```

### 图片

使用 unpic 的 Image 组件：

```tsx
import { Image } from "@unpic/react"
<Image src="/images/logo.png" alt="Logo" width={100} height={100} />
```

### 请求与响应

本项目有一套统一的请求/响应/错误处理链路：

```
后端 Resp 返回 → ApiResponse 格式 → 前端 http 自动解包 data → 出错时 errorEmitter → ErrorToaster 展示 i18n 弹窗
```

#### 后端：Resp 响应工具（API 路由专用）

```ts
import { Resp } from "@/shared/lib/tools/response"

// 成功
Resp.success(data)                        // { code: 200, message: "success", data }
// 业务错误（带 i18n 错误码，前端自动弹出多语言 toast）
Resp.error("Unauthorized", 401, "FORBIDDEN")  // { code: 401, message: "...", error: "FORBIDDEN" }
// 简单错误（前端弹出 message 原文）
Resp.error("Something failed", 500)       // { code: 500, message: "Something failed" }
```

#### 错误码（ErrorCode）

定义在 `src/config/locale/error.content.ts`，前端 `ErrorToaster` 会根据错误码自动展示对应的多语言 toast：

```ts
// 已有错误码
UNAUTHORIZED   // "请先登录"
FORBIDDEN      // "访问被拒绝"
NOT_FOUND      // "资源不存在"
VALIDATION_FAILED  // "数据无效"
NETWORK_ERROR  // "网络错误，请重试"
UNKNOWN_ERROR  // "出错了"
```

新增错误码：在 `error.content.ts` 中添加条目，类型自动推导。

#### 前端：http 客户端

```ts
import { http } from "@/shared/lib/tools/http-client"
```

`http` 基于 `ofetch`，会**自动解包** `ApiResponse.data`，返回的直接就是业务数据：

```ts
// GET - 返回值直接是 T（不是 ApiResponse<T>）
const items = await http<MyItem[]>("/api/admin/tags")

// POST
await http("/api/admin/tags", { method: "POST", body: { name: "test" } })

// PUT
await http("/api/admin/tags", { method: "PUT", body: { id, name: "new" } })

// DELETE
await http(`/api/admin/tags?id=${id}`, { method: "DELETE" })
```

**错误处理**：当后端返回 `error` 字段时，`http` 自动抛出 `HttpError` 并通过 `errorEmitter` 触发全局 toast，前端代码**无需手动处理 toast**。

可选参数：

```ts
// 需要认证（未登录返回 null 而非报错）
const data = await http<MyData>("/api/me", { requireAuth: true })

// 静默模式（不弹 toast，自行处理错误）
try {
  await http("/api/check", { silent: true })
} catch (e) {
  // 手动处理
}
```

#### 前后端配合模式

```ts
// 后端 API
POST: async ({ request }) => {
  try {
    const body = await request.json()
    const data = createSchema.parse(body)
    const [created] = await db.insert(example).values(data).returning()
    return Resp.success(created)  // → 前端 http 自动拿到 created
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Resp.error(`Invalid: ${error.issues.map(i => i.message).join(", ")}`, 400)
    }
    return Resp.error("Failed", 500)  // → 前端自动弹 toast "Failed"
  }
}

// 前端调用
const mutation = useMutation({
  mutationFn: (data: FormData) =>
    http("/api/admin/example", { method: "POST", body: data }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "example"] })
    toast.success("Created")  // 手动弹成功 toast
  },
  // 不需要 onError 处理弹窗，http 客户端已自动弹错误 toast
})
```

### Zod 导入

本项目使用 zod v4，导入路径为：

```ts
import { z } from "zod/v4"
```

### 数据库迁移

**禁止**未经用户允许执行 `drizzle-kit push`、`drizzle-kit migrate` 等迁移命令。创建完 schema 后提醒用户自行执行迁移。

### aria-label

保持英文，不需要多语言。

### 类型推导

数据库表中有的类型，应在 `src/shared/types/` 中从 schema 推导，不要手写重复类型：

```ts
import type { user } from "@/db/auth.schema"
export type User = typeof user.$inferSelect
```
