# 数据库 Schema 与 Model

## 工作流

```
- [ ] Step 1: 创建 schema 文件 src/db/{name}.schema.ts
- [ ] Step 2: 在 src/db/index.ts 中注册
- [ ] Step 3: 创建 model 文件 src/shared/model/{name}.model.ts
- [ ] Step 4: 在 src/shared/types/ 中导出类型
- [ ] Step 5: 提醒用户运行迁移（禁止 AI 执行）
```

## Step 1: Schema 文件

文件: `src/db/{name}.schema.ts`

```ts
import { relations } from "drizzle-orm"
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { user } from "./auth.schema"

// 可选：定义枚举
export const statusEnum = pgEnum("status", ["active", "inactive", "archived"])

export const example = pgTable(
  "example",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),
    status: statusEnum("status").notNull().default("active"),
    count: integer("count").notNull().default(0),
    isPublic: boolean("is_public").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, string>>(),

    createdAt: timestamp("created_at")
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("example_user_id_idx").on(table.userId),
    index("example_status_idx").on(table.status),
  ]
)

export const exampleRelations = relations(example, ({ one }) => ({
  user: one(user, {
    fields: [example.userId],
    references: [user.id],
  }),
}))
```

### 常用字段类型

| Drizzle 类型 | 用途 | 示例 |
|-------------|------|------|
| `text("col")` | 字符串 | name, email, description |
| `integer("col")` | 整数 | count, amount（金额用分） |
| `boolean("col")` | 布尔 | isActive, isPublic |
| `timestamp("col")` | 时间 | createdAt, expiresAt |
| `jsonb("col").$type<T>()` | JSON 对象 | metadata, settings |
| `pgEnum("name", [...])` | 枚举 | status, type |

### ID 生成

- 通用: `text("id").$defaultFn(() => crypto.randomUUID())`
- 订单号等需要雪花 ID: `text("id").$defaultFn(() => getSnowId())`（从 `@/shared/lib/tools/hash` 导入）

## Step 2: 注册到 index.ts

在 `src/db/index.ts` 中做 **3 处修改**：

```ts
// 1. 添加 re-export（在其他 export * 旁边）
export * from "./{name}.schema"

// 2. 添加 import（在其他 import * as 旁边）
import * as {name}Schema from "./{name}.schema"

// 3. 添加到 schema 对象（在其他 ...xxxSchema 旁边）
const schema = {
  ...authSchema,
  ...configSchema,
  // ... 其他已有的
  ...{name}Schema,  // ← 新增
}
```

## Step 3: Model 文件

文件: `src/shared/model/{name}.model.ts`

所有查询函数接受可选的 `tx?: DbTransaction` 参数以支持事务。

```ts
import { and, asc, count, desc, eq } from "drizzle-orm"
import { type DbTransaction, db } from "@/db"
import { example } from "@/db/{name}.schema"

export async function findExampleById(id: string, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance.select().from(example).where(eq(example.id, id)).limit(1)
  return result ?? null
}

export async function insertExample(data: typeof example.$inferInsert, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance.insert(example).values(data).returning()
  return result
}

export async function updateExample(id: string, data: Partial<typeof example.$inferInsert>, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance
    .update(example)
    .set(data)
    .where(eq(example.id, id))
    .returning()
  return result ?? null
}

export async function deleteExample(id: string, tx?: DbTransaction) {
  const dbInstance = tx || db
  const [result] = await dbInstance.delete(example).where(eq(example.id, id)).returning()
  return result ?? null
}

// 分页查询
export async function findExamples(
  userId: string,
  page = 1,
  pageSize = 10,
  tx?: DbTransaction
) {
  const dbInstance = tx || db
  const offset = (page - 1) * pageSize

  const [data, [{ total }]] = await Promise.all([
    dbInstance
      .select()
      .from(example)
      .where(eq(example.userId, userId))
      .orderBy(desc(example.createdAt))
      .limit(pageSize)
      .offset(offset),
    dbInstance
      .select({ total: count() })
      .from(example)
      .where(eq(example.userId, userId)),
  ])

  return { data, total }
}
```

### 事务用法

```ts
import { db } from "@/db"

await db.transaction(async (tx) => {
  const item = await insertExample({ name: "test", userId }, tx)
  await updateSomethingElse(item.id, tx)
})
```

## Step 4: 类型导出

文件: `src/shared/types/{name}.ts`

```ts
import type { example, statusEnum } from "@/db/{name}.schema"

export type Example = typeof example.$inferSelect
export type ExampleInsert = typeof example.$inferInsert
export type ExampleStatus = (typeof statusEnum.enumValues)[number]
```

## Step 5: 提醒迁移

创建完所有文件后，提醒用户：

> 数据库 schema 已创建，请运行 `pnpm drizzle-kit generate` 生成迁移文件，然后 `pnpm drizzle-kit migrate` 执行迁移。

**禁止 AI 自行执行迁移命令。**
