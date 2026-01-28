import { useQuery } from "@tanstack/react-query"
import { RotateCcw, Search } from "lucide-react"
import { useIntlayer } from "react-intlayer"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { http } from "@/shared/lib/tools/http-client"
import type { AdminRole } from "@/shared/types/admin"

export type UserFilters = {
  search: string
  banned: string
  subscription: string
  role: string
  sortBy: string
  sortOrder: string
}

type UserFiltersProps = {
  filters: UserFilters
  onChange: (filters: UserFilters) => void
}

const DEFAULT_FILTERS: UserFilters = {
  search: "",
  banned: "",
  subscription: "",
  role: "",
  sortBy: "createdAt",
  sortOrder: "desc",
}

export function UserFiltersBar({ filters, onChange }: UserFiltersProps) {
  const content = useIntlayer("admin")

  const { data: roles = [] } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => http<AdminRole[]>("/api/admin/roles"),
  })

  const updateFilter = <K extends keyof UserFilters>(key: K, value: UserFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const hasActiveFilters =
    filters.search ||
    (filters.banned && filters.banned !== "all") ||
    (filters.subscription && filters.subscription !== "all") ||
    (filters.role && filters.role !== "all")

  const resetFilters = () => onChange(DEFAULT_FILTERS)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative flex-1 min-w-48 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={content.users.filter.search.value}
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      <Select
        value={filters.banned}
        onValueChange={(v) => updateFilter("banned", v)}
      >
        <SelectTrigger className="w-full sm:w-32 h-9">
          <SelectValue placeholder={content.users.filter.banned.value} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{content.users.filter.all.value}</SelectItem>
          <SelectItem value="true">{content.users.filter.bannedOnly.value}</SelectItem>
          <SelectItem value="false">{content.users.filter.notBanned.value}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.subscription}
        onValueChange={(v) => updateFilter("subscription", v)}
      >
        <SelectTrigger className="w-full sm:w-32 h-9">
          <SelectValue placeholder={content.users.filter.subscription.value} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{content.users.filter.all.value}</SelectItem>
          <SelectItem value="active">{content.users.filter.subscribed.value}</SelectItem>
          <SelectItem value="none">{content.users.filter.notSubscribed.value}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.role}
        onValueChange={(v) => updateFilter("role", v)}
      >
        <SelectTrigger className="w-full sm:w-36 h-9">
          <SelectValue placeholder={content.users.filter.role.value} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{content.users.filter.all.value}</SelectItem>
          {roles.map((role) => (
            <SelectItem
              key={role.id}
              value={role.id}
            >
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-9 px-3"
        >
          <RotateCcw className="size-4 mr-1.5" />
          {content.users.filter.reset.value}
        </Button>
      )}
    </div>
  )
}

export { DEFAULT_FILTERS }
