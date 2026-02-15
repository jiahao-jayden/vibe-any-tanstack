# 落地页

## 架构（配置驱动）

```
src/config/locale/landing.content.ts        → 所有内容和开关
src/routes/{-$locale}/_main/_landing/index.tsx → 区块组装
src/routes/{-$locale}/_main/_landing/route.tsx → 布局（Header/Footer）
src/shared/components/landing/               → 区块组件
src/shared/types/landing.ts                  → 类型定义
```

## 操作 A：修改现有区块内容

只需修改 `src/config/locale/landing.content.ts` 中对应 section。

### 修改文字

```ts
hero: {
  title: t({ en: "New Title", zh: "新标题" }),
  description: t({ en: "New description", zh: "新描述" }),
},
```

### 显示/隐藏区块

```ts
pricing: {
  display: false,  // 设为 false 隐藏
},
```

### 修改列表项

```ts
features: {
  display: true,
  items: [
    {
      title: t({ en: "Feature 1", zh: "功能 1" }),
      description: t({ en: "Desc 1", zh: "描述 1" }),
      icon: "Code",  // Lucide 图标名
    },
    // 添加/删除/修改项...
  ],
},
```

### 修改导航和页脚

Header 导航和 Footer 链接也在同一个 content 文件中，搜索 `header` 和 `footer` section 即可修改。

## 操作 B：新增一个落地页区块

### Step 1: 创建组件

文件: `src/shared/components/landing/{section-name}/index.tsx`

```tsx
import { useIntlayer } from "react-intlayer"
import { cn } from "@/shared/lib/utils"

export function NewSection() {
  const { newSection } = useIntlayer("landing")

  return (
    <section id="new-section" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {newSection.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {newSection.description}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {newSection.items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border bg-card p-6"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### Step 2: 在 landing.content.ts 中添加配置

在 `src/config/locale/landing.content.ts` 的 content 对象中添加：

```ts
newSection: {
  display: true,
  title: t({ en: "Section Title", zh: "区块标题" }),
  description: t({ en: "Section description", zh: "区块描述" }),
  items: [
    {
      title: t({ en: "Item 1", zh: "项目 1" }),
      description: t({ en: "Item 1 description", zh: "项目 1 描述" }),
    },
    {
      title: t({ en: "Item 2", zh: "项目 2" }),
      description: t({ en: "Item 2 description", zh: "项目 2 描述" }),
    },
    {
      title: t({ en: "Item 3", zh: "项目 3" }),
      description: t({ en: "Item 3 description", zh: "项目 3 描述" }),
    },
  ],
},
```

### Step 3: 在 index.tsx 中渲染

在 `src/routes/{-$locale}/_main/_landing/index.tsx` 中添加：

```tsx
import { NewSection } from "@/shared/components/landing/{section-name}"

// 在 return 中合适位置添加：
{landing.newSection.display && <NewSection />}
```

## 现有区块参考

| 区块 | 组件路径 | 类型 |
|------|---------|------|
| Hero | `landing/hero/` | 主视觉（固定显示） |
| PowerBy | `landing/powerby/` | Logo 墙 |
| ThreeBenefits | `landing/benefits/` | 3 列带图标卡片 |
| Introduction | `landing/introduction/` | 图文交替（支持图片/视频） |
| Features | `landing/features/` | 网格图标卡片 |
| Pricing | `landing/pricing/` | 价格方案卡片 |
| HorizontalShowcase | `landing/showcase/` | 横向滚动展示 |
| Testimonials | `landing/testimonials/` | 3 列用户评价 |
| MediaCoverage | `landing/media/` | 媒体报道卡片 |
| FAQ | `landing/faq/` | 手风琴问答 |
| CTA | `landing/cta/` | 行动号召 |

## 动画模式

### 滚动进入动画

```tsx
import { motion } from "motion/react"

<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5 }}
>
  {/* 内容 */}
</motion.div>
```

### 标题文字动画

```tsx
import { TextEffect } from "@/shared/components/motion-primitives/text-effect"

<TextEffect preset="fade-in-blur" speedSegment={0.3}>
  {title.value}
</TextEffect>
```

预设: `blur`, `fade-in-blur`, `scale`, `fade`, `slide`

### 子元素依次进入

```tsx
import { AnimatedGroup } from "@/shared/components/motion-primitives/animate-group"

<AnimatedGroup
  variants={{
    container: { visible: { transition: { staggerChildren: 0.1 } } },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    },
  }}
>
  {items.map((item, i) => (
    <div key={i}>{item.title}</div>
  ))}
</AnimatedGroup>
```

预设: `fade`, `slide`, `scale`, `blur`, `zoom`, `flip`, `bounce`, `rotate`, `swing`

## 禁忌

- 不要直接修改 `index.tsx` 的现有组件结构，只添加新区块的渲染行
- 图片使用 `<Image>` from `@unpic/react`
- 链接使用 `LocalizedLink` 而非 `<Link>` 或 `<a>`
- className 拼接使用 `cn()`
- 动画库是 `motion/react`（不是 `framer-motion`）
