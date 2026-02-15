# 国际化（Intlayer）

## Content 文件

文件: `src/config/locale/{name}.content.ts`

```ts
import { type Dictionary, t } from "intlayer"

export default {
  key: "{name}",
  content: {
    title: t({ en: "English Title", zh: "中文标题" }),
    description: t({ en: "English description", zh: "中文描述" }),
    form: {
      name: t({ en: "Name", zh: "名称" }),
      save: t({ en: "Save", zh: "保存" }),
      cancel: t({ en: "Cancel", zh: "取消" }),
    },
    empty: t({ en: "No data", zh: "暂无数据" }),
    emptyDesc: t({ en: "Data will appear here", zh: "数据将显示在这里" }),
  },
} satisfies Dictionary
```

### 添加到已有 content 文件

如果功能属于已有模块（如 admin），直接在对应文件中追加 section：

```ts
// src/config/locale/admin.content.ts
export default {
  key: "admin",
  content: {
    // ... 已有内容
    newSection: {
      title: t({ en: "New Section", zh: "新区块" }),
      // ...
    },
  },
} satisfies Dictionary
```

## 组件中使用

```tsx
import { useIntlayer } from "react-intlayer"

function MyComponent() {
  const content = useIntlayer("{name}")

  return (
    <div>
      {/* JSX children：直接用，不加 .value */}
      <h1>{content.title}</h1>
      <p>{content.description}</p>
      <span>{content.form.name}</span>
    </div>
  )
}
```

## .value 使用规则

这是最容易出错的地方。规则很简单：

**JSX children** → 直接用（自动渲染为 ReactNode）：
```tsx
<h1>{content.title}</h1>
<Button>{content.form.save}</Button>
```

**需要 string 的地方** → 加 `.value`：
```tsx
// placeholder
<Input placeholder={content.form.name.value} />

// toast
toast.success(content.saveSuccess.value)

// 字符串拼接
const msg = `${content.count.value}: ${num}`

// 传给接受 string 类型的 props
<PageHeader title={content.title.value} description={content.description.value} />

// 条件判断中使用字符串值
if (someCondition) toast.error(content.error.value)
```

**aria-label** → 保持英文，不使用 i18n：
```tsx
<Button aria-label="Close dialog">...</Button>
```

## 路由链接

禁止使用 TanStack Router 的 `<Link>`。

组件链接：
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

## 禁忌

- 不要 `import { t } from "react-intlayer"`，`t` 从 `"intlayer"` 导入
- 不要 `import { useIntlayer } from "intlayer"`，`useIntlayer` 从 `"react-intlayer"` 导入
- 不要忘记 `satisfies Dictionary` 类型断言
- aria-label 不需要多语言
