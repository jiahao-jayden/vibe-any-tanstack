import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { Ban, Coins, Crown, Eye, ShieldCheck, UserRoundX, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useIntlayer } from "react-intlayer"
import { DataTableColumnHeader } from "@/shared/components/admin/data-table-column-header"
import { DataTableViewOptions } from "@/shared/components/admin/data-table-view-options"
import { PageHeader } from "@/shared/components/admin/page-header"
import { TableContainer, TableScrollArea } from "@/shared/components/admin/table-container"
import { TablePagination } from "@/shared/components/admin/table-pagination"
import { UserDetailSheet } from "@/shared/components/admin/user-detail-sheet"
import {
  DEFAULT_FILTERS,
  type UserFilters,
  UserFiltersBar,
} from "@/shared/components/admin/user-filters"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { useGlobalContext } from "@/shared/context/global.context"
import { http } from "@/shared/lib/tools/http-client"
import { cn } from "@/shared/lib/utils"
import type { AdminUserListItem, PaginatedResponse } from "@/shared/types/admin"

export const Route = createFileRoute("/{-$locale}/_main/admin/users")({
  component: UsersPage,
})

function StatCard({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  iconClassName?: string
}) {
  return (
    <div className="rounded-xl bg-card border p-3 sm:p-4 w-28 shrink-0 sm:w-auto sm:shrink">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className={cn("shrink-0", iconClassName)}>
          <Icon className="size-4 sm:size-5" />
        </div>
      </div>
    </div>
  )
}

function UsersPage() {
  const content = useIntlayer("admin")
  const { config } = useGlobalContext()
  const creditEnabled = config?.public_credit_enable ?? false

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: filters.sortBy, desc: filters.sortOrder === "desc" },
  ])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "users", pagination.pageIndex, pagination.pageSize, filters],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        pageSize: String(pagination.pageSize),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })
      if (filters.search) params.set("search", filters.search)
      if (filters.banned && filters.banned !== "all") params.set("banned", filters.banned)
      if (filters.subscription && filters.subscription !== "all")
        params.set("subscription", filters.subscription)
      if (filters.role && filters.role !== "all") params.set("role", filters.role)
      return http<PaginatedResponse<AdminUserListItem>>(`/api/admin/users?${params}`)
    },
  })

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    setSorting([{ id: newFilters.sortBy, desc: newFilters.sortOrder === "desc" }])
  }

  useEffect(() => {
    if (sorting.length > 0) {
      const { id, desc } = sorting[0]
      if (id !== filters.sortBy || (desc ? "desc" : "asc") !== filters.sortOrder) {
        setFilters((prev) => ({
          ...prev,
          sortBy: id,
          sortOrder: desc ? "desc" : "asc",
        }))
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
      }
    }
  }, [sorting, filters.sortBy, filters.sortOrder])

  const users = data?.items ?? []
  const totalRows = data?.pagination.total ?? 0

  const stats = useMemo(() => {
    return {
      total: totalRows,
      verified: users.filter((u) => u.emailVerified).length,
      banned: users.filter((u) => u.banned).length,
      subscribed: users.filter((u) => u.subscription).length,
    }
  }, [users, totalRows])

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId)
    setSheetOpen(true)
  }

  const handleSheetClose = () => {
    setSheetOpen(false)
    setSelectedUserId(null)
  }

  const columns: ColumnDef<AdminUserListItem>[] = useMemo(
    () => [
      {
        id: "avatar",
        header: "",
        size: 60,
        cell: ({ row }) => (
          <Avatar className="size-9">
            <AvatarImage
              src={row.original.image ?? undefined}
              alt={row.original.name}
            />
            <AvatarFallback className="text-xs">
              {row.original.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={content.users.table.name.value}
          />
        ),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        enableHiding: true,
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={content.users.table.email.value}
          />
        ),
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
        enableHiding: true,
      },
      {
        id: "roles",
        header: () => content.users.roles,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.length > 0 ? (
              <>
                {row.original.roles.slice(0, 2).map((role) => (
                  <Badge
                    key={role.roleId}
                    variant={role.name === "banned" ? "destructive" : "outline"}
                    className="text-xs"
                  >
                    {role.title}
                  </Badge>
                ))}
                {row.original.roles.length > 2 && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    +{row.original.roles.length - 2}
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        ),
      },
      {
        id: "subscription",
        header: () => content.users.subscription,
        cell: ({ row }) =>
          row.original.subscription ? (
            <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0 text-xs">
              {row.original.subscription.planName}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-xs"
            >
              {content.users.free}
            </Badge>
          ),
        enableHiding: true,
      },
      ...(creditEnabled
        ? [
            {
              id: "credits",
              header: () => content.users.credits,
              cell: ({ row }: { row: { original: AdminUserListItem } }) => (
                <div className="flex items-center gap-1 tabular-nums text-muted-foreground">
                  <Coins className="size-3.5" />
                  {row.original.creditBalance}
                </div>
              ),
              enableHiding: true,
            } as ColumnDef<AdminUserListItem>,
          ]
        : []),
      {
        id: "status",
        header: () => content.users.table.status,
        cell: ({ row }) =>
          row.original.banned ? (
            <Badge variant="destructive">{content.users.banned}</Badge>
          ) : (
            <Badge variant={row.original.emailVerified ? "default" : "secondary"}>
              {row.original.emailVerified ? content.users.verified : content.users.unverified}
            </Badge>
          ),
        enableHiding: true,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={content.users.table.createdAt.value}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        enableHiding: true,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation()
              handleViewUser(row.original.id)
            }}
            aria-label="View details"
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    [content, creditEnabled]
  )

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: data?.pagination.totalPages ?? -1,
    state: {
      pagination,
      sorting,
      columnVisibility,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
  })

  const columnLabels = useMemo(
    () => ({
      name: content.users.table.name.value,
      email: content.users.table.email.value,
      roles: content.users.roles.value,
      subscription: content.users.subscription.value,
      credits: content.users.credits.value,
      status: content.users.table.status.value,
      createdAt: content.users.table.createdAt.value,
    }),
    [content]
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      <PageHeader
        title={content.users.title.value}
        description={content.users.description.value}
      />

      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 sm:mb-6 lg:grid-cols-4 shrink-0">
        <StatCard
          icon={Users}
          label={content.users.stats.total.value}
          value={stats.total}
          iconClassName="rounded-xl bg-primary/10 p-2.5 text-primary"
        />
        <StatCard
          icon={ShieldCheck}
          label={content.users.stats.verified.value}
          value={stats.verified}
          iconClassName="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500"
        />
        <StatCard
          icon={Crown}
          label={content.users.stats.subscribed.value}
          value={stats.subscribed}
          iconClassName="rounded-xl bg-amber-500/10 p-2.5 text-amber-500"
        />
        <StatCard
          icon={Ban}
          label={content.users.stats.banned.value}
          value={stats.banned}
          iconClassName="rounded-xl bg-destructive/10 p-2.5 text-destructive"
        />
      </div>

      <div className="mb-4 shrink-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <UserFiltersBar
          filters={filters}
          onChange={handleFiltersChange}
        />
        <DataTableViewOptions
          table={table}
          columnLabels={columnLabels}
        />
      </div>

      <TableContainer>
        {isLoading ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16 pl-4" />
                  <TableHead>{content.users.table.name}</TableHead>
                  <TableHead>{content.users.table.email}</TableHead>
                  <TableHead>{content.users.roles}</TableHead>
                  <TableHead>{content.users.subscription}</TableHead>
                  {creditEnabled && <TableHead>{content.users.credits}</TableHead>}
                  <TableHead>{content.users.table.status}</TableHead>
                  <TableHead>{content.users.table.createdAt}</TableHead>
                  <TableHead className="w-12 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4">
                      <Skeleton className="size-9 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    {creditEnabled && (
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                    )}
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="pr-4">
                      <Skeleton className="size-8" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <UserRoundX className="size-7 text-muted-foreground" />
            </div>
            <h3 className="mt-5 text-base font-medium">{content.users.empty}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{content.users.emptyDesc}</p>
          </div>
        ) : (
          <>
            <TableScrollArea>
              <Table className="min-w-175">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent"
                    >
                      {headerGroup.headers.map((header, index) => (
                        <TableHead
                          key={header.id}
                          className={
                            index === 0
                              ? "pl-4"
                              : index === headerGroup.headers.length - 1
                                ? "pr-4"
                                : ""
                          }
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => handleViewUser(row.original.id)}
                    >
                      {row.getVisibleCells().map((cell, index) => (
                        <TableCell
                          key={cell.id}
                          className={
                            index === 0
                              ? "pl-4"
                              : index === row.getVisibleCells().length - 1
                                ? "pr-4"
                                : ""
                          }
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScrollArea>

            <TablePagination
              table={table}
              totalRows={totalRows}
              rowsPerPageLabel={content.users.pagination?.rowsPerPage?.value ?? "Rows per page"}
            />
          </>
        )}
      </TableContainer>

      <UserDetailSheet
        userId={selectedUserId}
        open={sheetOpen}
        onOpenChange={(open: boolean) => {
          if (!open) handleSheetClose()
        }}
        onUpdate={() => refetch()}
      />
    </div>
  )
}
