import { type Dictionary, t } from "intlayer"
import { siteConfig } from "@/config/site-config"

const { github } = siteConfig.social

/**
 * Landing Page Configuration
 *
 * Modify this file to customize the landing page content.
 * Use `t({ en: "English", "zh": "中文" })` for i18n text.
 */
export default {
  key: "landing",
  content: {
    banner: {
      show: true,
      text: t({
        en: "Open Sourced in 2025: Production-grade AI SaaS template available! Join our developer ecosystem today.",
        zh: "2025 年开源：生产级 AI SaaS 模板现已发布！立即加入我们的开发者生态系统。",
      }),
      button: {
        text: t({ en: "View on GitHub", zh: "在 GitHub 上查看" }),
        href: github,
      },
    },
    hero: {
      title: t({
        en: "Vibe Any AI Startups in hours, not days",
        zh: "VibeAny AI 加速想法落地",
      }),
      description: t({
        en: "VibeAny is a TanStack boilerplate for building AI SaaS startups. Ship Fast with a variety of templates and components.",
        zh: "VibeAny 是一个 TanStack Start 模板，用于构建 AI SaaS 创业项目。快速搭建，多种模板和组件可供选择。",
      }),
      announcement: {
        show: true,
        text: t({
          en: "Open Sourced in 2025: Production-grade AI SaaS template available!",
          zh: "2026 年开源：生产级 AI SaaS 模板现已发布！",
        }),
        href: github,
      },
      buttons: {
        start: {
          text: t({ en: "Get Started", zh: "开始" }),
          url: "/chat",
        },
        docs: {
          text: t({ en: "Learn More", zh: "了解更多" }),
          url: "/docs",
        },
      },
      image: {
        enabled: false as const,
        src: "/home/home.avif",
        width: 2700,
        height: 1440,
      },
    },
    powerBy: {
      title: t({ en: "Trusted by developers worldwide", zh: "被全球开发者信任" }),
      items: [
        "tanstack-start",
        "github",
        "tailwindcss",
        "vercel",
        "shadcn",
        "openai",
        "react",
        "supabase",
        "cloudflare",
      ],
    },
    threeBenefits: {
      title: t({ en: "Three Key Benefits", zh: "三大核心优势" }),
      description: t({
        en: "Discover why choose our template",
        zh: "了解为什么选择我们的模板",
      }),
      items: [
        {
          title: t({ en: "Lightning Fast Startup", zh: "极速启动" }),
          description: t({
            en: "Get up and running in minutes with optimized templates and infrastructure. Say goodbye to Next.js's snail-like speed.",
            zh: "通过优化的模板和基础设施，几分钟内即可启动运行。告别 Next.js 的蜗牛速度。",
          }),
          icon: "Zap",
        },
        {
          title: t({ en: "Environment Variable Visual Configuration", zh: "环境变量可视化配置" }),
          description: t({
            en: "Built-in visual configuration system for dynamic environment variables, eliminating tedious configuration processes.",
            zh: "内置动态环境变量的可视化配置系统，告别繁琐的配置过程。",
          }),
          icon: "Shield",
        },
        {
          title: t({ en: "Complete SaaS Kit", zh: "完整的 SaaS 套件" }),
          description: t({
            en: "Authentication, i18n, payments, credits, AI, blog, docs, newsletter, dashboard, routing and SEO are all built-in — saving you weeks of development time.",
            zh: "认证、国际化、支付、积分、AI、博客、文档、邮件订阅、仪表盘、路由和 SEO 全部内置——为你节省数周开发时间。",
          }),
          icon: "HeadphonesIcon",
        },
      ],
    },
    introduction: [
      {
        type: "image" as const,
        title: t({ en: "Authentication System", zh: "身份认证系统" }),
        description: t({
          en: "Complete authentication solution with email/password login, OAuth integration (Google/GitHub), user profile management, and secure session handling",
          zh: "完整的身份认证解决方案，支持邮箱密码登录、OAuth 集成（Google/GitHub）、用户资料管理和安全会话处理",
        }),
        image: "/landing/introduction/auth.webp" as const,
        imagePosition: "left" as const,
        features: [
          {
            title: t({ en: "Multiple Login Methods", zh: "多种登录方式" }),
            description: t({
              en: "Email/password authentication with OAuth support for Google, GitHub, Apple and more",
              zh: "邮箱密码认证，支持 Google, GitHub OAuth, Apple 等多种方式登录",
            }),
          },
          {
            title: t({ en: "User Management", zh: "用户管理" }),
            description: t({
              en: "Complete user profile system with role-based access control",
              zh: "完整的用户资料系统，支持基于角色的访问控制",
            }),
          },
          {
            title: t({ en: "Session Security", zh: "会话安全" }),
            description: t({
              en: "Secure session management with automatic token refresh and logout",
              zh: "安全的会话管理，支持自动令牌刷新和登出",
            }),
          },
        ],
      },
      {
        type: "image" as const,
        title: t({ en: "Payment System", zh: "支付系统" }),
        description: t({
          en: "Supports subscriptions and one-time payments via Stripe, Creem, PayPal, WeChat and Alipay, with automated payment event handling and billing management",
          zh: "支持通过 Stripe, Creem, PayPal, 微信和支付宝进行订阅和一次性支付，自动处理支付事件和账单管理",
        }),
        image: "/landing/introduction/payment.webp",
        imagePosition: "right" as const,
        features: [
          {
            title: t({ en: "Subscriptions & One-time", zh: "订阅与一次性支付" }),
            description: t({
              en: "Two payment models, plug-and-play",
              zh: "两种支付模式，即插即用",
            }),
          },
          {
            title: t({ en: "Webhook Handling", zh: "Webhook 处理" }),
            description: t({
              en: "Automatically processes payment events like success and refunds",
              zh: "自动处理支付成功、退款等事件",
            }),
          },
          {
            title: t({ en: "Billing & Credits", zh: "账单与积分充值" }),
            description: t({
              en: "Billing page with credit top-up and history tracking",
              zh: "支持积分充值和账单历史记录追踪",
            }),
          },
        ],
      },
      {
        type: "image" as const,
        title: t({ en: "AI Capabilities", zh: "AI 能力" }),
        description: t({
          en: "Built-in AI chat, text & image generation, video creation, and speech synthesis. Ready to use and easy to integrate into your product.",
          zh: "内置 AI 对话、文本和图像生成、视频创作和语音合成。开箱即用，易于集成到您的产品中。",
        }),
        image: t({
          en: "/home/introduction/ai-capabilities.avif",
          zh: "/home/introduction/ai-capabilities-zh.avif",
        }),
        imagePosition: "left" as const,
        features: [
          {
            title: t({ en: "Text & Image Generation", zh: "文本和图像生成" }),
            description: t({
              en: "Supports leading models like OpenAI, DeepSeek, and Replicate",
              zh: "支持 OpenAI、DeepSeek、Replicate 等主流模型",
            }),
          },
          {
            title: t({ en: "Video Generation", zh: "视频生成" }),
            description: t({
              en: "Includes Google video generation examples for easy customization",
              zh: "包含 Google 视频生成示例，便于自定义",
            }),
          },
          {
            title: t({ en: "Speech Synthesis", zh: "语音合成" }),
            description: t({
              en: "Integrated with ElevenLabs for fast text-to-speech conversion",
              zh: "集成 ElevenLabs，快速文本转语音",
            }),
          },
          {
            title: t({ en: "Credits & Usage", zh: "积分与用量" }),
            description: t({
              en: "Built-in credit system with usage tracking for flexible billing",
              zh: "内置积分系统，支持用量追踪和灵活计费",
            }),
          },
        ],
      },
      {
        type: "image" as const,
        title: t({ en: "Blog & Roadmap & Changelog", zh: "博客、路线图与更新日志" }),
        description: t({
          en: "Built-in beautiful blog and roadmap system with clear structure, multilingual support, and deep customization",
          zh: "内置精美博客、路线图和更新日志系统，结构清晰，支持多语言和深度定制",
        }),
        image: "/landing/introduction/blog-roadmap.webp",
        imagePosition: "right" as const,
        features: [
          {
            title: t({ en: "Blog", zh: "博客" }),
            description: t({
              en: "Showcase product updates, technical insights, and industry trends",
              zh: "展示产品更新、技术分享、行业洞察等内容",
            }),
          },
          {
            title: t({ en: "Roadmap", zh: "路线图" }),
            description: t({
              en: "Visual roadmap with clear milestones and progress tracking, helping users understand the project progress",
              zh: "清晰的路标和进度追踪，帮助用户了解项目进展",
            }),
          },
          {
            title: t({ en: "Changelog", zh: "更新日志" }),
            description: t({
              en: "Product update changelog page",
              zh: "产品更新日志展示页面",
            }),
          },
        ],
      },

      {
        type: "image" as const,
        title: t({ en: "Documentation System", zh: "文档系统" }),
        description: t({
          en: "Built-in MDX documentation system with clear structure, multilingual support",
          zh: "内置 MDX 文档系统，结构清晰，支持多语言和深度定制",
        }),
        image: "/landing/introduction/doc.webp",
        imagePosition: "left" as const,
        features: [
          {
            title: t({ en: "MDX Documentation", zh: "MDX 文档" }),
            description: t({
              en: "Based on Fumadocs with structured directories and rich MDX components",
              zh: "基于 Fumadocs，支持结构化目录以及丰富的 MDX 组件",
            }),
          },
          {
            title: t({ en: "Multilingual Support", zh: "多语言支持" }),
            description: t({
              en: "Parallel Chinese/English content with automatic routing switching",
              zh: "中英文内容并行，自动路由切换",
            }),
          },
          {
            title: t({ en: "SEO Optimization", zh: "SEO 优化" }),
            description: t({
              en: "Semantic structure and metadata for better search engine visibility",
              zh: "语义化结构和元数据，提升搜索引擎可见性",
            }),
          },
        ],
      },
      {
        type: "image" as const,
        title: t({ en: "SaaS Core Features", zh: "SaaS 核心功能" }),
        description: t({
          en: "Rich SaaS components, customizable themes, data analytics, and SEO optimization to meet all SaaS application needs",
          zh: "丰富的 SaaS 组件、可定制主题、数据分析和 SEO 优化，满足所有 SaaS 应用需求",
        }),
        image: t({
          en: "/home/introduction/saas-core.avif",
          zh: "/home/introduction/saas-core-zh.avif",
        }),
        imagePosition: "left" as const,
        features: [
          {
            title: t({ en: "Components & Blocks", zh: "组件与区块" }),
            description: t({
              en: "Covers common SaaS pages and interaction scenarios",
              zh: "覆盖常见 SaaS 页面和交互场景",
            }),
          },
          {
            title: t({ en: "Themes & Styling", zh: "主题与样式" }),
            description: t({
              en: "Based on Tailwind CSS v4 with deep customization options",
              zh: "基于 Tailwind CSS v4，支持深度定制",
            }),
          },
          {
            title: t({ en: "Analytics & Monitoring", zh: "分析与监控" }),
            description: t({
              en: "Built-in analytics hooks with monitoring examples",
              zh: "内置分析钩子和监控示例",
            }),
          },
          {
            title: t({ en: "Performance & Deployment", zh: "性能与部署" }),
            description: t({
              en: "Powered by Next.js 15 and Turbopack, with one-click Vercel/Cloudflare deployment",
              zh: "基于 Next.js 15 和 Turbopack，支持一键部署到 Vercel/Cloudflare",
            }),
          },
        ],
      },
    ],
    features: {
      title: t({ en: "Core Features", zh: "核心功能" }),
      description: t({
        en: "Everything you need to boost productivity",
        zh: "提升生产力所需的一切",
      }),
      items: [
        {
          title: t({ en: "Next.js Production Template", zh: "Next.js 生产模板" }),
          description: t({
            en: "Ready-to-use Next.js template with built-in SEO and i18n support",
            zh: "开箱即用的 Next.js 模板，内置 SEO 和国际化支持",
          }),
          icon: "Code",
        },
        {
          title: t({ en: "Auth & Payment Integration", zh: "认证与支付集成" }),
          description: t({
            en: "Integrated Google OAuth, passwordless login, and Stripe payment system",
            zh: "集成 Google OAuth、免密登录和 Stripe 支付系统",
          }),
          icon: "Key",
        },
        {
          title: t({ en: "Data Infrastructure", zh: "数据基础设施" }),
          description: t({
            en: "Built-in Supabase integration for reliable and scalable data storage",
            zh: "内置 Supabase 集成，提供可靠且可扩展的数据存储",
          }),
          icon: "Database",
        },
        {
          title: t({ en: "One-Click Deployment", zh: "一键部署" }),
          description: t({
            en: "Automated configuration for seamless deployment to Vercel or Cloudflare",
            zh: "自动化配置，无缝部署到 Vercel 或 Cloudflare",
          }),
          icon: "Cloud",
        },
        {
          title: t({ en: "Business Analytics", zh: "业务分析" }),
          description: t({
            en: "Integrated Google Analytics and Search Console for continuous growth tracking",
            zh: "集成 Google Analytics 和 Search Console，持续追踪增长",
          }),
          icon: "BarChart3",
        },
        {
          title: t({ en: "AI-Ready Architecture", zh: "AI 就绪架构" }),
          description: t({
            en: "Pre-configured AI integrations with built-in credit system and API monetization",
            zh: "预配置 AI 集成，内置积分系统和 API 变现能力",
          }),
          icon: "Bot",
        },
      ],
    },
    horizontalShowcase: {
      title: t({ en: "Featured Capabilities", zh: "特色能力" }),
      description: t({
        en: "Discover what VibeAny can do for you",
        zh: "探索 VibeAny 能为你做什么",
      }),
      items: [
        {
          title: t({ en: "AI Integration", zh: "AI 集成" }),
          imagePath: t({
            en: "/home/introduction/ai-capabilities.avif",
            zh: "/home/introduction/ai-capabilities-zh.avif",
          }),
          link: "/",
          description: t({
            en: "Add AI-powered interactions to your website",
            zh: "为你的网站添加 AI 驱动的交互",
          }),
        },
        {
          title: t({ en: "Seamless Authentication", zh: "无缝认证" }),
          imagePath: t({
            en: "/home/introduction/authentication.avif",
            zh: "/home/introduction/authentication-zh.avif",
          }),
          link: "/",
          description: t({
            en: "One-click login and third-party integrations",
            zh: "一键登录和第三方集成",
          }),
        },
        {
          title: t({ en: "Payment Solutions", zh: "支付方案" }),
          imagePath: "/home/introduction/payment.avif",
          link: "/",
          description: t({
            en: "Flexible subscriptions and one-time payments",
            zh: "灵活的订阅和一次性支付",
          }),
        },
        {
          title: t({ en: "Content Management", zh: "内容管理" }),
          imagePath: t({
            en: "/home/introduction/blog.avif",
            zh: "/home/introduction/blog-zh.avif",
          }),
          link: "/",
          description: t({
            en: "Multilingual blogs and documentation system",
            zh: "多语言博客和文档系统",
          }),
        },
      ],
    },
    userTestimonials: {
      title: t({ en: "What Our Users Say", zh: "用户评价" }),
      testimonials: [
        {
          text: t({
            en: "VibeAny has completely transformed how we build AI applications. The templates are production-ready and save us weeks of development time.",
            zh: "VibeAny 彻底改变了我们构建 AI 应用的方式。模板开箱即用，为我们节省了数周的开发时间。",
          }),
          image: "/avatars/user1.avif",
          name: "Sarah Chen",
          role: t({ en: "CTO, TechStart", zh: "TechStart 首席技术官" }),
        },
        {
          text: t({
            en: "The best AI development platform I've used. Great documentation, amazing support, and powerful features that just work.",
            zh: "我用过的最好的 AI 开发平台。文档完善，支持出色，功能强大且稳定可靠。",
          }),
          image: "/avatars/user2.avif",
          name: "Michael Rodriguez",
          role: t({ en: "Lead Developer", zh: "首席开发者" }),
        },
        {
          text: t({
            en: "From prototype to production in record time. VibeAny's infrastructure and tools are exactly what modern AI projects need.",
            zh: "从原型到生产的速度创下纪录。VibeAny 的基础设施和工具正是现代 AI 项目所需要的。",
          }),
          image: "/avatars/user3.avif",
          name: "Emily Johnson",
          role: t({ en: "Product Manager", zh: "产品经理" }),
        },
        {
          text: t({
            en: "Outstanding platform with excellent performance. The AI integrations are seamless and the developer experience is top-notch.",
            zh: "性能卓越的出色平台。AI 集成无缝衔接，开发者体验一流。",
          }),
          image: "/avatars/user4.avif",
          name: "David Kim",
          role: t({ en: "Senior Engineer", zh: "高级工程师" }),
        },
        {
          text: t({
            en: "Incredible value for money. The lifetime plan paid for itself within the first month of using it for our startup.",
            zh: "性价比极高。终身计划在我们创业公司使用的第一个月就已回本。",
          }),
          image: "/avatars/user5.avif",
          name: "Lisa Zhang",
          role: t({ en: "Founder, AI Startup", zh: "AI 创业公司创始人" }),
        },
        {
          text: t({
            en: "The support team is amazing and the platform keeps getting better. Highly recommend for any AI project.",
            zh: "支持团队非常棒，平台也在不断改进。强烈推荐给任何 AI 项目。",
          }),
          image: "/avatars/user6.avif",
          name: "James Wilson",
          role: t({ en: "Full Stack Developer", zh: "全栈开发者" }),
        },
        {
          text: t({
            en: "VibeAny's AI templates are incredibly well-designed. They've accelerated our development process by months.",
            zh: "VibeAny 的 AI 模板设计精良。它们将我们的开发进程加速了数月。",
          }),
          image: "/avatars/user7.avif",
          name: "Alex Thompson",
          role: t({ en: "AI Research Lead", zh: "AI 研究负责人" }),
        },
        {
          text: t({
            en: "The documentation is comprehensive and the community support is fantastic. Makes complex AI development accessible.",
            zh: "文档全面，社区支持出色。让复杂的 AI 开发变得触手可及。",
          }),
          image: "/avatars/user8.avif",
          name: "Maria Garcia",
          role: t({ en: "Machine Learning Engineer", zh: "机器学习工程师" }),
        },
        {
          text: t({
            en: "Exceptional platform that delivers on its promises. Our team's productivity has increased dramatically since we started using it.",
            zh: "一个言出必行的卓越平台。自从开始使用后，我们团队的生产力大幅提升。",
          }),
          image: "/avatars/user9.avif",
          name: "Robert Lee",
          role: t({ en: "Tech Lead", zh: "技术负责人" }),
        },
      ],
    },
    mediaCoverage: {
      title: t({ en: "Featured In", zh: "媒体报道" }),
      description: t({
        en: "See what the tech community is saying about our platform",
        zh: "看看科技社区对我们平台的评价",
      }),
      items: [
        {
          title: t({
            en: "Sample Article Title: Advanced Technology Research Paper",
            zh: "示例文章标题：先进技术研究论文",
          }),
          description: t({
            en: "This is a placeholder description for a technology research paper. It demonstrates how research articles might be featured in this section...",
            zh: "这是一篇技术研究论文的占位描述。它展示了研究文章如何在此部分展示...",
          }),
          imagePath: "/landing/media/tech-research-paper.avif",
          source: "Tech Journal",
          date: "2025.09.15",
          href: "#",
          external: true,
        },
        {
          title: t({
            en: "Example Feature: Innovative AI Solutions in Modern Development",
            zh: "示例专题：现代开发中的创新 AI 解决方案",
          }),
          description: t({
            en: "This is a sample description showcasing how AI solutions and development tools might be covered in technology publications...",
            zh: "这是一个示例描述，展示 AI 解决方案和开发工具如何在科技出版物中被报道...",
          }),
          imagePath: "/landing/media/ai-solutions-development.avif",
          source: "AI Weekly",
          date: "2025.08.20",
          href: "#",
          external: true,
        },
        {
          title: t({
            en: "Demo Coverage: Platform Innovation and Developer Experience",
            zh: "演示报道：平台创新与开发者体验",
          }),
          description: t({
            en: "A placeholder article about platform innovation and how modern tools are transforming the developer experience across various industries...",
            zh: "一篇关于平台创新以及现代工具如何改变各行业开发者体验的占位文章...",
          }),
          imagePath: "/landing/media/platform-innovation.avif",
          source: "Tech News",
          date: "2025.07.10",
          href: "#",
          external: true,
        },
        {
          title: t({
            en: "Sample Story: Building Tomorrow's Software Solutions",
            zh: "示例故事：构建明日软件解决方案",
          }),
          description: t({
            en: "An example article discussing emerging technologies and their impact on software development practices and methodologies...",
            zh: "一篇讨论新兴技术及其对软件开发实践和方法论影响的示例文章...",
          }),
          imagePath: "/landing/media/software-solutions.avif",
          source: "Dev Magazine",
          date: "2025.05.25",
          href: "#",
          external: true,
        },
        {
          title: t({
            en: "Placeholder Feature: The Evolution of Development Tools",
            zh: "占位专题：开发工具的演进",
          }),
          description: t({
            en: "A sample article exploring how development tools are evolving and their impact on productivity and code quality...",
            zh: "一篇探索开发工具如何演进及其对生产力和代码质量影响的示例文章...",
          }),
          imagePath: "/landing/media/development-tools.avif",
          source: "Code Review",
          date: "2025.02.18",
          href: "#",
          external: true,
        },
      ],
    },
    faq: {
      title: t({ en: "Frequently Asked Questions", zh: "常见问题" }),
      description: t({
        en: "Discover quick and comprehensive answers to common questions about our platform, services, and features.",
        zh: "快速全面地了解关于我们平台、服务和功能的常见问题解答。",
      }),
      items: [
        {
          question: t({ en: "What is VibeAny?", zh: "什么是 VibeAny？" }),
          answer: t({
            en: "VibeAny is a platform for boosting any website.",
            zh: "VibeAny 是一个用于提升任何网站的平台。",
          }),
        },
        {
          question: t({ en: "What is VibeAny?", zh: "什么是 VibeAny？" }),
          answer: t({
            en: "VibeAny is a platform for boosting any website.",
            zh: "VibeAny 是一个用于提升任何网站的平台。",
          }),
        },
      ],
    },
    cta: {
      title: t({ en: "Start Building", zh: "开始构建" }),
      description: t({
        en: "Start building your next great project today.",
        zh: "立即开始，构建你的下一个伟大项目。",
      }),
      primaryButtonText: t({ en: "Get Started", zh: "立即开始" }),
      primaryButtonHref: "/",
      secondaryButtonText: t({ en: "Book Demo", zh: "预约演示" }),
      secondaryButtonHref: "/",
    },
    header: {
      items: [
        {
          label: t({ en: "Documentation", zh: "文档" }),
          href: "/docs",
        },
        {
          label: t({ en: "Chat", zh: "聊天" }),
          href: "/chat",
        },
        {
          label: t({ en: "Features", zh: "特点" }),
          href: "#introduction",
        },
        {
          label: t({ en: "Pricing", zh: "定价" }),
          href: "#pricing",
        },
        {
          label: t({ en: "More Features", zh: "更多功能" }),
          children: [
            {
              label: t({ en: "Blog", zh: "博客" }),
              href: "/blog",
            },
            {
              label: t({ en: "Roadmap", zh: "路线图" }),
              href: "/roadmap",
            },
            {
              label: t({ en: "Changelog", zh: "更新日志" }),
              href: "/changelog",
            },
          ],
        },
      ] as const,
    },
    footer: {
      companyName: "VibeAny",
      scrollToTop: t({ en: "Back to Top", zh: "返回顶部" }),
      sections: [
        {
          title: t({ en: "About", zh: "关于" }),
          links: [
            { label: t({ en: "About Us", zh: "关于我们" }), href: "/about" },
            { label: t({ en: "Works", zh: "作品" }), href: "/works" },
            { label: t({ en: "Pricing", zh: "定价" }), href: "/pricing" },
          ],
        },
        {
          title: t({ en: "Features", zh: "功能" }),
          links: [
            { label: t({ en: "Documentation", zh: "文档" }), href: "/docs" },
            { label: t({ en: "Roadmap", zh: "路线图" }), href: "/roadmap" },
            { label: t({ en: "Dashboard", zh: "控制台" }), href: "/dashboard" },
          ],
        },
        {
          title: t({ en: "Products", zh: "产品" }),
          links: [
            { label: t({ en: "AI Chat", zh: "AI 对话" }), href: "/chat" },
            { label: t({ en: "Templates", zh: "模板" }), href: "/templates" },
            { label: t({ en: "Components", zh: "组件" }), href: "/components" },
          ],
        },
        {
          title: t({ en: "Resources", zh: "资源" }),
          links: [
            { label: t({ en: "Changelog", zh: "更新日志" }), href: "/changelog" },
            { label: t({ en: "Blog", zh: "博客" }), href: "/blog" },
            { label: t({ en: "Community", zh: "社区" }), href: "/community" },
          ],
        },
        {
          title: t({ en: "Company", zh: "公司" }),
          links: [
            { label: t({ en: "Contact", zh: "联系我们" }), href: "/contact" },
            { label: t({ en: "Terms", zh: "服务条款" }), href: "/terms" },
            { label: t({ en: "Privacy", zh: "隐私政策" }), href: "/privacy" },
          ],
        },
      ],
    },
  },
} satisfies Dictionary
