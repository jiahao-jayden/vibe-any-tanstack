# 管理后台页面（端到端）

创建一个新的管理后台页面需要以下步骤，按顺序执行。

## 端到端工作流

```
- [ ] Step 1: 数据库层（如需新表）→ 读 db-schema.md
- [ ] Step 2: API 路由 → 读 api-route.md
- [ ] Step 3: 国际化 → 读 intlayer-i18n.md
- [ ] Step 4: 页面组件（本文件的模板）
- [ ] Step 5: 侧边栏入口
```

## Step 1: 数据库层

如果需要新建数据库表，按 [db-schema.md](db-schema.md) 的步骤：
1. 创建 `src/db/{name}.schema.ts`
2. 注册到 `src/db/index.ts`
3. 创建 `src/shared/model/{name}.model.ts`
4. 导出类型到 `src/shared/types/{name}.ts`

## Step 2: API 路由

在 `src/routes/api/admin/` 下创建 API，按 [api-route.md](api-route.md) 的模板：
- CRUD 资源 → 用模板 A
- 列表+分页 → 用模板 B
- 放在 `api/admin/` 目录下自动继承管理员权限

## Step 3: 国际化

按 [intlayer-i18n.md](intlayer-i18n.md)：
- 在 `src/config/locale/admin.content.ts` 中追加新 section
- 或创建独立的 content 文件

## Step 4: 页面组件

文件: `src/routes/{-$locale}/_main/admin/{name}.tsx`

路由会自动继承 `pageAdminMiddleware`（在 admin/route.tsx 中配置），无需手动添加。

### 模板 A：列表页（Data Table）

适用: 需要搜索、筛选、排序、分页的数据列表。

```tsx
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Eye } from "lucide-react"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useMemo } from "react"
import { useIntlayer } from "react-intlayer"
import { PageHeader } from "@/shared/components/admin"
import {
  DataTable,
  DataTableColumnHeader,
  DataTableSkeleton,
  DataTableToolbar,
} from "@/shared/components/common/data-table"
import { Button } from "@/shared/components/ui/button"
import { useDataTable } from "@/shared/hooks/use-data-table"
import { http } from "@/shared/lib/tools/http-client"
import type { PaginatedResponse } from "@/shared/types/admin"
import type { MyItem } from "@/shared/types/{name}"

export const Route = createFileRoute("/{-$locale}/_main/admin/{name}")({
  component: MyListPage,
})

function MyListPage() {
  const content = useIntlayer("admin")

  const [page] = useQueryState("page", parseAsInteger.withDefault(1))
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10))
  const [sortBy] = useQueryState("sortBy", parseAsString.withDefault("createdAt"))
  const [sortOrder] = useQueryState("sortOrder", parseAsString.withDefault("desc"))
  const [name] = useQueryState("name", parseAsString)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "{name}", page, perPage, sortBy, sortOrder, name],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(perPage),
        sortBy,
        sortOrder,
      })
      if (name) params.set("search", name)

      return http<PaginatedResponse<MyItem>>(`/api/admin/{name}?${params}`)
    },
  })

  const items = data?.items ?? []
  const pageCount = data?.pagination.totalPages ?? -1

  const columns: ColumnDef<MyItem>[] = useMemo(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Name" />
        ),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        meta: {
          label: "Name",
          placeholder: "Search...",
          variant: "text" as const,
        },
        enableColumnFilter: true,
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Created" />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" className="size-8" aria-label="View details">
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    []
  )

  const { table } = useDataTable({
    data: items,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getRowId: (row) => row.id,
  })

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <PageHeader
        title={content.{name}.title.value}
        description={content.{name}.description.value}
      />

      {isLoading ? (
        <DataTableSkeleton columnCount={3} rowCount={perPage} filterCount={1} />
      ) : items.length === 0 && !name ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 rounded-md border">
          <h3 className="mt-5 text-base font-medium">{content.{name}.empty}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{content.{name}.emptyDesc}</p>
        </div>
      ) : (
        <DataTable table={table}>
          <DataTableToolbar table={table} />
        </DataTable>
      )}
    </div>
  )
}
```

### 模板 B：CRUD 管理页

适用: 简单列表 + 新增/编辑/删除（Dialog 表单）。

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useId, useState } from "react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import { PageHeader } from "@/shared/components/admin"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { http } from "@/shared/lib/tools/http-client"
import type { MyItem } from "@/shared/types/{name}"

export const Route = createFileRoute("/{-$locale}/_main/admin/{name}")({
  component: MyManagementPage,
})

type FormData = {
  name: string
  // ... 其他字段
}

const defaultFormData: FormData = {
  name: "",
}

function MyManagementPage() {
  const content = useIntlayer("admin")
  const queryClient = useQueryClient()
  const formId = useId()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MyItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<MyItem | null>(null)
  const [formData, setFormData] = useState<FormData>(defaultFormData)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin", "{name}"],
    queryFn: () => http<MyItem[]>("/api/admin/{name}"),
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      http("/api/admin/{name}", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "{name}"] })
      setIsDialogOpen(false)
      setFormData(defaultFormData)
      toast.success("Created")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData & { id: string }) =>
      http("/api/admin/{name}", { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "{name}"] })
      setIsDialogOpen(false)
      setEditingItem(null)
      setFormData(defaultFormData)
      toast.success("Updated")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      http(`/api/admin/{name}?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "{name}"] })
      setDeleteItem(null)
      toast.success("Deleted")
    },
  })

  const handleEdit = (item: MyItem) => {
    setEditingItem(item)
    setFormData({ name: item.name })
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem) {
      updateMutation.mutate({ ...formData, id: editingItem.id })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingItem(null)
    setFormData(defaultFormData)
  }

  return (
    <>
      <PageHeader
        title={content.{name}.title.value}
        description={content.{name}.description.value}
      >
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          {content.{name}.add}
        </Button>
      </PageHeader>

      <div className="rounded-xl border bg-card">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <h3 className="mt-4 text-base font-medium">{content.{name}.empty}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{content.{name}.emptyDesc}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteItem(item)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* 新增/编辑 Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? content.{name}.edit : content.{name}.add}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-name`}>Name</Label>
              <Input
                id={`${formId}-name`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                {content.{name}.form.cancel}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {content.{name}.form.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{content.{name}.delete}</AlertDialogTitle>
            <AlertDialogDescription>{content.{name}.confirmDelete}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{content.{name}.form.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {content.{name}.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

## Step 5: 侧边栏入口

在 `src/shared/components/sidebar/admin-sidebar.tsx` 中添加菜单项：

```tsx
{
  title: "New Section",
  url: "/admin/{name}",
  icon: SomeIcon,  // 从 lucide-react 导入
}
```

## 通用模式

| 模式 | 导入 |
|------|------|
| 页面头部 | `import { PageHeader } from "@/shared/components/admin"` |
| HTTP 客户端 | `import { http } from "@/shared/lib/tools/http-client"` |
| Toast 通知 | `import { toast } from "sonner"` |
| 图标 | `import { IconName } from "lucide-react"` |
| 国际化 | `import { useIntlayer } from "react-intlayer"` |

### queryKey 命名规范

```ts
["admin", "{name}"]                      // 简单列表
["admin", "{name}", page, perPage, ...]  // 分页列表
```

### http 客户端用法

```ts
// GET
const data = await http<MyItem[]>("/api/admin/{name}")

// POST
await http("/api/admin/{name}", { method: "POST", body: data })

// PUT
await http("/api/admin/{name}", { method: "PUT", body: { id, ...data } })

// DELETE
await http(`/api/admin/{name}?id=${id}`, { method: "DELETE" })
```
