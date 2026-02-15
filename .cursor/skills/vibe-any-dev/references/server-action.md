# Server Function（Server Action）

## 何时用 Server Function vs API Route

| 场景 | 选择 | 原因 |
|------|------|------|
| 页面数据获取（SSR / loader） | Server Function | 直接返回数据，无需序列化 |
| 简单数据操作 | Server Function | 类型安全，无需写 API |
| REST 端点（给 `http` 客户端调用） | API Route | 标准 HTTP，适合前端 fetch |
| Webhook 接收 | API Route | 外部服务回调 |
| Admin 后台 CRUD | API Route | 统一 RESTful 风格 |

## 文件路径

Server Function 放在 `src/actions/{name}.action.ts`

## 模板 A：数据获取（GET）

```ts
import { createServerFn } from "@tanstack/react-start"
import { sessionMiddleware } from "@/shared/middleware/auth.middleware"
import type { MyData } from "@/shared/types/{name}"

const DEFAULT_DATA: MyData = {
  items: [],
  total: 0,
}

export const getMyDataFn = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }): Promise<MyData> => {
    try {
      const userId = context.session?.user.id

      if (!userId) {
        return DEFAULT_DATA
      }

      // 查询逻辑
      const result = await findMyData(userId)
      return result
    } catch (error) {
      console.error("[getMyDataFn] Failed:", error)
      return DEFAULT_DATA
    }
  })
```

## 模板 B：数据变更（POST）

```ts
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod/v4"
import { sessionMiddleware } from "@/shared/middleware/auth.middleware"

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
})

export const updateMyDataFn = createServerFn({ method: "POST" })
  .middleware([sessionMiddleware])
  .validator((input: z.infer<typeof updateSchema>) => updateSchema.parse(input))
  .handler(async ({ context, data }) => {
    const userId = context.session?.user.id
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // 操作逻辑
    const result = await updateMyData(data.id, data.name)
    return result
  })
```

## 模板 C：无认证（公开数据）

```ts
import { createServerFn } from "@tanstack/react-start"

export const getPublicDataFn = createServerFn({ method: "GET" })
  .handler(async () => {
    // 不需要 session
    return await fetchPublicData()
  })
```

## 在页面中使用

### 路由 loader（SSR 数据加载）

```tsx
export const Route = createFileRoute("/{-$locale}/_main/{name}")({
  component: PageComponent,
  loader: async () => {
    return await getMyDataFn()
  },
})

function PageComponent() {
  const data = Route.useLoaderData()
  return <div>{data.total}</div>
}
```

### 组件内 useQuery

```tsx
import { useQuery } from "@tanstack/react-query"

const { data, isLoading } = useQuery({
  queryKey: ["myData"],
  queryFn: () => getMyDataFn(),
})
```

### 变更 useMutation

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query"

const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: updateMyDataFn,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["myData"] })
    toast.success("Updated")
  },
})

// 调用
mutation.mutate({ id: "xxx", name: "new name" })
```

## 中间件

- `sessionMiddleware`: session 可为 null，适合公开数据 + 可选的用户信息增强
- `apiAuthMiddleware`: **不适用于** Server Function，仅用于 API Route

## 禁忌

- Server Function 直接返回数据，**不要**用 `Resp.success()` 包装
- **不要**在 Server Function 中 `throw redirect`，权限跳转应在路由的 `beforeLoad` 中处理
- Server Function 的错误应该 try/catch 后返回默认值或 throw Error
