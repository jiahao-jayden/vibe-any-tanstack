# 页面路由

## 路由层级

```
__root.tsx                          → HTML, Theme, Devtools
└── {-$locale}/route.tsx            → IntlayerProvider
    ├── _main/route.tsx             → GlobalContextProvider（用户信息、配置）
    │   ├── _landing/route.tsx      → Header + Footer + Banner
    │   │   ├── index.tsx           → 落地页
    │   │   ├── blog/index.tsx      → 博客列表
    │   │   ├── blog/$slug.tsx      → 博客详情
    │   │   ├── changelog.tsx       → 更新日志
    │   │   └── roadmap.tsx         → 路线图
    │   ├── admin/route.tsx         → AdminSidebar + pageAdminMiddleware
    │   │   ├── users.tsx
    │   │   ├── orders.tsx
    │   │   └── ...
    │   └── chat/index.tsx          → AI 聊天
    ├── login/index.tsx             → 登录页（独立布局）
    └── docs/route.tsx              → Fumadocs 文档
```

## 选择布局

### 布局 A：Landing 布局（带 Header + Footer）

路径: `src/routes/{-$locale}/_main/_landing/{name}.tsx`

适用: 公开页面（关于、博客、FAQ 等）

自动包含: Banner + Header + Footer + GlobalContext

```tsx
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/{-$locale}/_main/_landing/{name}")({
  component: PageComponent,
  ssr: true,
  head: () => ({
    meta: [
      { title: "Page Title - VibeAny" },
      { name: "description", content: "Page description" },
    ],
  }),
})

function PageComponent() {
  return (
    <main className="mx-auto max-w-7xl px-6 lg:px-8 py-10">
      <h1 className="text-4xl font-bold">Page Title</h1>
    </main>
  )
}
```

### 布局 B：Main 布局（无 Header/Footer）

路径: `src/routes/{-$locale}/_main/{name}/index.tsx` 或 `{name}.tsx`

适用: 功能页面（聊天、仪表盘等）

自动包含: GlobalContextProvider（用户信息、配置）

```tsx
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/{-$locale}/_main/{name}/")({
  component: PageComponent,
  ssr: false,
})

function PageComponent() {
  return (
    <div className="flex flex-col size-full min-h-dvh p-4">
      <h1>功能页面</h1>
    </div>
  )
}
```

### 布局 C：Admin 布局

路径: `src/routes/{-$locale}/_main/admin/{name}.tsx`

详见 [admin-page.md](admin-page.md)。

### 布局 D：独立页面（无共享布局）

路径: `src/routes/{-$locale}/{name}/index.tsx`

适用: 登录、注册等需要完全自定义布局的页面

```tsx
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/{-$locale}/{name}/")({
  component: PageComponent,
  ssr: false,
})

function PageComponent() {
  return <div>独立布局页面</div>
}
```

## 带数据加载

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

const getPageData = createServerFn({ method: "GET" })
  .inputValidator((params: { lang?: string }) => params)
  .handler(async ({ data: { lang } }) => {
    return { title: "Hello", lang }
  })

export const Route = createFileRoute("/{-$locale}/_main/_landing/{name}")({
  component: PageComponent,
  loader: async ({ params }) => {
    return await getPageData({ data: { lang: params.locale } })
  },
})

function PageComponent() {
  const data = Route.useLoaderData()
  return <div>{data.title}</div>
}
```

## 带认证保护

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { pageAuthMiddleware } from "@/shared/middleware/auth.middleware"

export const Route = createFileRoute("/{-$locale}/_main/{name}/")({
  component: PageComponent,
  server: {
    middleware: [pageAuthMiddleware],
  },
})
```

未登录用户自动跳转到 `/login`。

## 动态路由

文件名使用 `$param`：

文件: `src/routes/{-$locale}/_main/_landing/blog/$slug.tsx`

```tsx
export const Route = createFileRoute("/{-$locale}/_main/_landing/blog/$slug")({
  component: BlogPostPage,
  loader: async ({ params }) => {
    return await getPost({ data: { slug: params.slug } })
  },
})

function BlogPostPage() {
  const { slug } = Route.useParams()
  const data = Route.useLoaderData()
  return <article>{data.title}</article>
}
```

## 可选配置

| 配置 | 用途 | 默认值 |
|------|------|--------|
| `ssr: true` | 服务端渲染 | false |
| `head: () => ({...})` | SEO meta 标签 | 无 |
| `loader: async () => {}` | 数据预加载 | 无 |
| `beforeLoad: async () => {}` | 路由守卫 | 无 |
| `server.middleware: [...]` | 服务端中间件 | 无 |
| `validateSearch: (search) => ({})` | URL 查询参数校验 | 无 |

## 禁忌

- `createFileRoute` 的路径字符串**必须**与文件路径完全匹配
- 路由链接使用 `LocalizedLink` 而非 `<Link>`
- 编程式跳转使用 `useLocalizedNavigate`
- 不要忘记 `{-$locale}` 是路由层级的一部分
