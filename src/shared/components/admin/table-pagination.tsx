import type { Table } from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

type TablePaginationProps<T> = {
  table: Table<T>
  totalRows?: number
  pageSizeOptions?: number[]
  rowsPerPageLabel?: string
}

export function TablePagination<T>({
  table,
  totalRows: externalTotalRows,
  pageSizeOptions = [10, 20, 50, 100],
  rowsPerPageLabel = "Rows per page",
}: TablePaginationProps<T>) {
  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = externalTotalRows ?? table.getFilteredRowModel().rows.length

  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className="flex items-center justify-between border-t px-3 py-2 sm:px-4 sm:py-3 gap-2">
      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
        <span>{rowsPerPageLabel}</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger className="h-8 w-18">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem
                key={size}
                value={String(size)}
              >
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
        {startRow}-{endRow} / {totalRows}
      </span>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-7 sm:size-8"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label="First page"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-7 sm:size-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-7 sm:size-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-7 sm:size-8"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          aria-label="Last page"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
