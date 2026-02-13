import type { ColumnSort, Row, RowData } from "@tanstack/react-table"
import type { DataTableConfig } from "@/shared/components/common/data-table/data-table-config"
import type { FilterItemSchema } from "@/shared/lib/parsers"

declare module "@tanstack/react-table" {
  // biome-ignore lint/correctness/noUnusedVariables: required by module augmentation
  interface TableMeta<TData extends RowData> {
    queryKeys?: QueryKeys
  }

  // biome-ignore lint/correctness/noUnusedVariables: required by module augmentation
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    placeholder?: string
    variant?: FilterVariant
    options?: Option[]
    range?: [number, number]
    unit?: string
    icon?: React.FC<React.SVGProps<SVGSVGElement>>
  }
}

export interface QueryKeys {
  page: string
  perPage: string
  sort: string
  filters: string
  joinOperator: string
}

export interface Option {
  label: string
  value: string
  count?: number
  icon?: React.FC<React.SVGProps<SVGSVGElement>>
}

export type FilterOperator = DataTableConfig["operators"][number]
export type FilterVariant = DataTableConfig["filterVariants"][number]
export type JoinOperator = DataTableConfig["joinOperators"][number]

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: Extract<keyof TData, string>
}

export interface ExtendedColumnFilter<TData> extends FilterItemSchema {
  id: Extract<keyof TData, string>
}

export interface DataTableRowAction<TData> {
  row: Row<TData>
  variant: "update" | "delete"
}
