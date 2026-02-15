---
name: data-table
description: Build data tables with filtering, sorting, pagination, and URL state management using diceui DataTable components. Use when creating admin tables, list views, or any data-heavy UI that needs server-side pagination and filtering.
---

# DataTable Component

基于 diceui/data-table 的数据表格组件，已集成 nuqs URL 状态管理和 TanStack Router。

## 组件路径

```
@/shared/components/common/data-table/   # 组件目录
@/shared/components/common/data-table/data-table-config.ts  # 配置
@/shared/hooks/use-data-table.ts         # hook
@/shared/types/data-table.ts             # 类型
@/shared/lib/data-table.ts               # 工具函数
@/shared/lib/parsers.ts                  # URL 解析器
```

## 快速开始

```tsx
import { DataTable, DataTableToolbar, DataTableSkeleton, DataTableColumnHeader } from "@/shared/components/common/data-table"
import { useDataTable } from "@/shared/hooks/use-data-table"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"

function MyTablePage() {
  // 1. URL 状态管理（参数名需与 useDataTable 默认 queryKeys 一致：page, perPage, sort, 以及列 id 作为 filter 键）
  const [page] = useQueryState("page", parseAsInteger.withDefault(1))
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10))
  const [name] = useQueryState("name", parseAsString)  // 列 id 为 "name" 时，filter 键为 "name"

  // 2. 数据获取
  const { data, isLoading } = useQuery({
    queryKey: ["items", page, perPage, name],
    queryFn: () => fetchItems({ page, perPage, search: name }),
  })

  // 3. 定义列
  const columns: ColumnDef<Item>[] = useMemo(() => [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
      cell: ({ row }) => row.original.name,
      meta: {
        label: "Name",
        placeholder: "Search...",
        variant: "text",
      },
      enableColumnFilter: true,
    },
  ], [])

  // 4. 初始化表格
  const { table } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: data?.totalPages ?? -1,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getRowId: (row) => row.id,
  })

  // 5. 渲染
  if (isLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={10} filterCount={2} />
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  )
}
```

## 列定义

### Filter Variants

| Variant | 用途 | meta 配置 |
|---------|------|-----------|
| `text` | 文本搜索 | `placeholder` |
| `number` | 数字过滤 | `unit` |
| `range` | 范围滑块 | `range: [min, max]` |
| `date` | 日期选择 | - |
| `dateRange` | 日期范围 | - |
| `select` | 单选下拉 | `options` |
| `multiSelect` | 多选下拉 | `options` |

### 列配置示例

```tsx
// 文本过滤
{
  id: "name",
  accessorKey: "name",
  header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
  meta: { label: "Name", variant: "text", placeholder: "Search...", icon: User },
  enableColumnFilter: true,
}

// 选择过滤
{
  id: "status",
  accessorKey: "status",
  header: () => "Status",
  meta: {
    label: "Status",
    variant: "select",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
  enableColumnFilter: true,
  enableSorting: false,
}

// 日期列
{
  id: "createdAt",
  accessorKey: "createdAt",
  header: ({ column }) => <DataTableColumnHeader column={column} label="Created" />,
  cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
}

// 操作列
{
  id: "actions",
  header: "",
  enableSorting: false,
  enableHiding: false,
  cell: ({ row }) => <Button onClick={() => handleView(row.original.id)}>View</Button>,
}
```

## 可用组件

| 组件 | 用途 |
|------|------|
| `DataTable` | 主表格组件 |
| `DataTableToolbar` | 标准工具栏（过滤 + 视图选项） |
| `DataTableColumnHeader` | 列头（支持排序） |
| `DataTablePagination` | 分页控件 |
| `DataTableViewOptions` | 列可见性控制 |
| `DataTableSkeleton` | 加载骨架屏 |
| `DataTableFacetedFilter` | 分面过滤器 |
| `DataTableDateFilter` | 日期过滤器 |
| `DataTableSliderFilter` | 滑块范围过滤器 |

## 项目示例

参考现有实现：
- `src/routes/{-$locale}/_main/admin/users.tsx` - 用户管理表格
- `src/routes/{-$locale}/_main/admin/orders.tsx` - 订单管理表格

## 注意事项

1. **URL 状态**: useDataTable 默认使用 `page`, `perPage`, `sort`, 以及列 id 作为 filter 键。API 调用时用 `useQueryState` 读取相同参数。若 API 需要不同参数名（如 sortBy/sortOrder），可通过 `queryKeys` 自定义
2. **服务端分页**: `useDataTable` 已配置 `manualPagination`, `manualSorting`, `manualFiltering`
3. **空状态**: 当 `data.length === 0 && !hasFilters` 时显示空状态，有过滤时显示表格（可能是过滤结果为空）
4. **骨架屏**: 使用 `DataTableSkeleton` 组件，传入 `columnCount`, `rowCount`, `filterCount`

## API Reference

详细的 API 文档请查看 [reference.md](reference.md)，包含：
- `useDataTable` hook 完整参数
- 所有组件的 Props 类型
- Column Meta 类型定义
- Filter Operators 列表
- 键盘快捷键
