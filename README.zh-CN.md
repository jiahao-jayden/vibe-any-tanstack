<p align="center">
  <img src="./public/logo.svg" alt="VibeAny" width="80" height="80" />
</p>
<h1 align="center">VibeAny</h1>
<p align="center">
  <a href="./README.zh-CN.md">中文</a> | <a href="./README.md">English</a>
</p>
<p align="center">
  全栈 AI Web 应用脚手架，基于 TanStack Start 构建。<br />
  内置身份认证、数据库、落地页、博客、文档、国际化、管理后台等功能，开箱即用，分钟级部署。
</p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jiahao-jayden/vibe-any" alt="License" /></a>
  <a href="https://github.com/jiahao-jayden/vibe-any/stargazers"><img src="https://img.shields.io/github/stars/jiahao-jayden/vibe-any" alt="Stars" /></a>
  <a href="https://github.com/jiahao-jayden/vibe-any/issues"><img src="https://img.shields.io/github/issues/jiahao-jayden/vibe-any" alt="Issues" /></a>
</p>
<p align="center">
  <img src="https://placehold.co/800x450?text=截图即将更新" alt="VibeAny Screenshot" width="800" />
</p>

## 功能特性

- **TanStack Start** — 基于文件的路由、SSR、Server Functions
- **身份认证** — 邮箱密码、Google、GitHub OAuth、Magic Link（Better Auth）
- **数据库** — PostgreSQL + Drizzle ORM，类型安全的 Schema 与迁移
- **RBAC** — 基于角色的权限控制，支持权限继承
- **落地页** — Hero、功能介绍、优势、用户评价、FAQ、CTA 等区块
- **博客与文档** — 基于 MDX 的博客和 Fumadocs 文档系统，支持多语言
- **更新日志与路线图** — 产品变更时间线和可视化路线图看板
- **管理后台** — 用户管理、系统配置、角色管理
- **国际化** — 开箱即用的中英文支持（Intlayer）
- **邮件** — 通过 Resend 或自定义 SMTP 发送验证和 Magic Link 邮件
- **文件存储** — S3 兼容上传（Cloudflare R2、AWS S3、MinIO）
- **AI 聊天** — 基于 Vercel AI SDK 的聊天界面
- **UI** — Tailwind CSS v4、shadcn/ui、Radix 原语、Lucide 图标
- **主题** — 亮色 / 暗色 / 跟随系统，一键切换

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | TanStack Start + React 19 + Vite |
| 路由 | TanStack Router（基于文件） |
| 数据获取 | TanStack Query |
| 数据库 | PostgreSQL + Drizzle ORM |
| 认证 | Better Auth |
| 样式 | Tailwind CSS v4 + shadcn/ui |
| 国际化 | Intlayer |
| 内容 | Fumadocs（文档）+ MDX（博客） |
| 邮件 | Resend / Nodemailer |
| 校验 | Zod |
| 代码规范 | Biome |

## 快速开始

### 前置要求

- Node.js 20+
- pnpm 9+
- PostgreSQL 数据库

### 1. 克隆并安装

```bash
git clone https://github.com/jiahao-jayden/vibe-any.git
cd vibe-any
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

应用默认以**静态模式**运行，无需任何配置——落地页、博客和文档无需数据库即可使用。如需启用认证和用户功能，请设置 `DATABASE_URL` 和 `BETTER_AUTH_SECRET`。

### 3. 初始化数据库（可选）

```bash
pnpm db:push
```

### 4. 启动开发

```bash
pnpm dev
```

打开 [http://localhost:3377](http://localhost:3377)。

## 项目结构

```
src/
├── actions/          # Server Actions
├── config/           # 站点配置、国际化内容、动态配置
├── db/               # Drizzle Schema（认证、配置、RBAC）
├── integrations/     # RBAC 检查器、存储、TanStack Query
├── routes/
│   ├── api/          # API 路由（认证、管理、文件上传）
│   └── {-$locale}/   # 带国际化前缀的页面路由
│       ├── _main/
│       │   ├── _landing/   # 落地页（首页、博客、更新日志等）
│       │   ├── admin/      # 管理后台
│       │   └── chat/       # AI 聊天
│       ├── docs/     # 文档
│       └── login/    # 登录页
├── services/         # 业务逻辑
└── shared/
    ├── components/   # UI 组件
    ├── context/      # React Context（全局状态）
    ├── hooks/        # 自定义 Hooks
    ├── lib/          # 工具函数（认证、邮件、配置、工具）
    ├── middleware/    # 路由中间件（认证、语言）
    ├── model/        # 数据库查询函数
    └── types/        # TypeScript 类型
```

## 配置

所有功能均通过环境变量按需启用：

| 功能 | 必需变量 |
|------|---------|
| 数据库 | `DATABASE_URL` |
| 认证 | `DATABASE_URL` + `BETTER_AUTH_SECRET` |
| GitHub OAuth | `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` |
| Google OAuth | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |
| 邮件 | `EMAIL_PROVIDER` + `EMAIL_FROM` + 服务商密钥 |
| 存储 | `STORAGE_*` 相关变量 |
| 验证码 | `VITE_TURNSTILE_*` + `TURNSTILE_SECRET_KEY` |

完整列表请参阅 [`.env.example`](.env.example)。

## 脚本命令

```bash
pnpm dev          # 启动开发服务器（端口 3377）
pnpm build        # 生产构建
pnpm preview      # 预览生产构建
pnpm db:generate  # 生成 Drizzle 迁移文件
pnpm db:push      # 推送 Schema 到数据库
pnpm db:migrate   # 执行迁移
pnpm db:studio    # 打开 Drizzle Studio
pnpm rbac         # 管理 RBAC 角色和权限
pnpm lint         # Biome 代码检查
pnpm format       # Biome 代码格式化
pnpm test         # Vitest 运行测试
```

## 部署

构建并运行：

```bash
pnpm build
node .output/server/index.mjs
```

支持任何 Node.js 托管平台——Vercel、Railway、Fly.io、VPS、Docker 等。

## 贡献

欢迎贡献代码。请先开一个 Issue 讨论你想要做的改动。

## 许可证

[MIT](LICENSE)
