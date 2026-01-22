import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { UserRoundX, Users } from "lucide-react"
import { useIntlayer } from "react-intlayer"
import { PageHeader } from "@/shared/components/admin/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"

type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: string
}

export const Route = createFileRoute("/{-$locale}/admin/users")({
  component: UsersPage,
})

function UsersPage() {
  const content = useIntlayer("admin")

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
  })

  return (
    <>
      <PageHeader title={content.users.title.value} description={content.users.description.value} />
      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <Users className="size-5 text-muted-foreground" />
          <h2 className="text-base font-medium">{content.users.title}</h2>
          {users && (
            <Badge
              variant="secondary"
              className="ml-auto"
            >
              {users.length} {content.users.count}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="overflow-x-auto">
            <Table className="shadow-none!">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16 pl-6" />
                  <TableHead className="min-w-35">{content.users.table.name}</TableHead>
                  <TableHead className="min-w-50">{content.users.table.email}</TableHead>
                  <TableHead className="min-w-25">{content.users.table.status}</TableHead>
                  <TableHead className="min-w-30 pr-6">{content.users.table.createdAt}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6">
                      <Skeleton className="size-10 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-44" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="pr-6">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : users?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <UserRoundX className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-medium">{content.users.empty}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{content.users.emptyDesc}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="shadow-none!">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16 pl-6" />
                  <TableHead className="min-w-35">{content.users.table.name}</TableHead>
                  <TableHead className="min-w-50">{content.users.table.email}</TableHead>
                  <TableHead className="min-w-25">{content.users.table.status}</TableHead>
                  <TableHead className="min-w-30 pr-6">{content.users.table.createdAt}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="pl-6">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={user.image ?? undefined}
                          alt={user.name}
                        />
                        <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.emailVerified ? "default" : "secondary"}>
                        {user.emailVerified ? content.users.verified : content.users.unverified}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground pr-6">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}
