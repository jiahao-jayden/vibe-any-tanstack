# DataTable API Reference

## useDataTable Hook

```tsx
interface UseDataTableProps<TData> {
  data: TData[]                    // 表格数据
  columns: ColumnDef<TData>[]      // 列定义
  pageCount: number                // 总页数，-1 表示未知
  initialState?: {
    sorting?: { id: string; desc: boolean }[]
    pagination?: { pageIndex: number; pageSize: number }
    columnVisibility?: Record<string, boolean>
    rowSelection?: Record<string, boolean>
  }
  getRowId?: (row: TData) => string  // 行唯一标识
  queryKeys?: {                      // 自定义 URL 参数名
    page?: string
    perPage?: string
    sort?: string
    filters?: string
    joinOperator?: string
  }
  history?: "push" | "replace"       // URL 更新方式，默认 "replace"
  debounceMs?: number                // 过滤防抖，默认 300ms
  throttleMs?: number                // 节流，默认 50ms
  clearOnDefault?: boolean           // 默认值时清除 URL 参数
  enableAdvancedFilter?: boolean     // 启用高级过滤
  scroll?: boolean                  // 更新 URL 时是否滚动到顶部，默认 false
  shallow?: boolean                  // 浅层路由更新，默认 true
  startTransition?: React.TransitionStartFunction  // 用于并发更新的 transition
}

const { table, shallow, debounceMs, throttleMs } = useDataTable(props)
```

## DataTable

```tsx
interface DataTableProps<TData> {
  table: Table<TData>          // useDataTable 返回的 table 实例
  actionBar?: React.ReactNode  // 行选择时显示的操作栏
  children?: React.ReactNode   // Toolbar 等子组件
  className?: string
}

<DataTable table={table} actionBar={<ActionBar />}>
  <DataTableToolbar table={table} />
</DataTable>
```

## DataTableColumnHeader

```tsx
interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>  // 列实例
  label: string                  // 显示文本
  className?: string
}

<DataTableColumnHeader column={column} label="Name" />
```

## DataTableToolbar

```tsx
interface DataTableToolbarProps<TData> {
  table: Table<TData>
  children?: React.ReactNode  // 额外的工具栏内容
  className?: string
}

<DataTableToolbar table={table}>
  {/* 额外内容 */}
</DataTableToolbar>
```

## DataTableSkeleton

```tsx
interface DataTableSkeletonProps {
  columnCount: number         // 列数
  rowCount?: number           // 行数，默认 10
  filterCount?: number        // 过滤器数量，默认 0
  cellWidths?: string[]       // 单元格宽度数组
  withViewOptions?: boolean   // 显示视图选项骨架，默认 true
  withPagination?: boolean    // 显示分页骨架，默认 true
  shrinkZero?: boolean        // 零宽度收缩
  className?: string
}

<DataTableSkeleton columnCount={8} rowCount={10} filterCount={2} />
```

## DataTablePagination

```tsx
interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions?: number[]  // 页大小选项，默认 [10, 20, 30, 40, 50]
  className?: string
}
```

## DataTableViewOptions

```tsx
interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
  disabled?: boolean
  align?: "start" | "center" | "end"  // Popover 对齐
}
```

## DataTableFacetedFilter

```tsx
interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: Option[]
  multiple?: boolean  // 是否多选
}

interface Option {
  label: string
  value: string
  count?: number
  icon?: React.FC<React.SVGProps<SVGSVGElement>>
}
```

## DataTableDateFilter

```tsx
interface DataTableDateFilterProps<TData> {
  column: Column<TData, unknown>
  title?: string
  multiple?: boolean  // true = dateRange, false = date
}
```

## DataTableSliderFilter

```tsx
interface DataTableSliderFilterProps<TData> {
  column: Column<TData, unknown>
  title?: string
}
```

## Column Meta 类型

```tsx
interface ColumnMeta<TData, TValue> {
  label?: string                      // 显示名称
  placeholder?: string                // 过滤输入占位符
  variant?: FilterVariant             // 过滤类型
  options?: Option[]                  // select/multiSelect 选项
  range?: [number, number]            // range 过滤的范围
  unit?: string                       // 数字单位 (如 "hr", "$")
  icon?: React.FC<SVGProps>           // 图标组件
}

type FilterVariant =
  | "text"        // 文本搜索
  | "number"      // 数字过滤
  | "range"       // 范围滑块
  | "date"        // 日期选择
  | "dateRange"   // 日期范围
  | "boolean"     // 布尔过滤
  | "select"      // 单选
  | "multiSelect" // 多选
```

## Filter Operators

```tsx
// 文本操作符
type TextOperator = "iLike" | "notILike" | "eq" | "ne" | "isEmpty" | "isNotEmpty"

// 数字操作符
type NumericOperator = "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "isBetween" | "isEmpty" | "isNotEmpty"

// 日期操作符
type DateOperator = "eq" | "ne" | "lt" | "gt" | "lte" | "gte" | "isBetween" | "isRelativeToToday" | "isEmpty" | "isNotEmpty"

// 选择操作符
type SelectOperator = "eq" | "ne" | "isEmpty" | "isNotEmpty"

// 多选操作符
type MultiSelectOperator = "inArray" | "notInArray" | "isEmpty" | "isNotEmpty"
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + Shift + F` | 打开/关闭过滤菜单 |
| `Cmd/Ctrl + Shift + S` | 打开/关闭排序菜单 |
| `Backspace` / `Delete` | 删除当前聚焦的过滤/排序项 |
