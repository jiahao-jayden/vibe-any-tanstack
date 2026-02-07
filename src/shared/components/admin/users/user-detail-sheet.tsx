import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, Coins, Mail, Plus, Shield, Trash2, User, UserCheck } from "lucide-react"
import { useState } from "react"
import { useIntlayer } from "react-intlayer"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Separator } from "@/shared/components/ui/separator"
import { Sheet, SheetContent } from "@/shared/components/ui/sheet"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { useGlobalContext } from "@/shared/context/global.context"
import { http } from "@/shared/lib/tools/http-client"
import type { AdminUserDetail, AdminUserRole } from "@/shared/types/admin"
import { RoleAssignDialog } from "./role-assign-dialog"

type UserDetailSheetProps = {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function UserDetailSheet({ userId, open, onOpenChange, onUpdate }: UserDetailSheetProps) {
  const content = useIntlayer("admin")
  const { config } = useGlobalContext()
  const creditEnabled = config?.public_credit_enable ?? false
  const queryClient = useQueryClient()

  const [roleToRemove, setRoleToRemove] = useState<AdminUserRole | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [grantCreditsOpen, setGrantCreditsOpen] = useState(false)
  const [grantAmount, setGrantAmount] = useState("")
  const [grantDescription, setGrantDescription] = useState("")

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => http<AdminUserDetail>(`/api/admin/users/${userId}`),
    enabled: !!userId && open,
  })

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return http(`/api/admin/users/${userId}/roles`, {
        method: "DELETE",
        body: JSON.stringify({ roleId }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] })
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      onUpdate?.()
      setRoleToRemove(null)
    },
  })

  const banMutation = useMutation({
    mutationFn: async (ban: boolean) => {
      return http(`/api/admin/users/${userId}/ban`, {
        method: ban ? "POST" : "DELETE",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] })
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      onUpdate?.()
    },
  })

  const grantCreditsMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description?: string }) => {
      return http(`/api/admin/users/${userId}/credits`, {
        method: "POST",
        body: JSON.stringify({ amount, description: description || undefined }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] })
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      onUpdate?.()
      setGrantCreditsOpen(false)
      setGrantAmount("")
      setGrantDescription("")
    },
  })

  const handleGrantCredits = () => {
    const amount = parseInt(grantAmount, 10)
    if (amount > 0) {
      grantCreditsMutation.mutate({ amount, description: grantDescription })
    }
  }

  const handleRemoveRole = () => {
    if (roleToRemove) {
      removeRoleMutation.mutate(roleToRemove.roleId)
    }
  }

  const handleRoleAssigned = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] })
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    onUpdate?.()
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
          {isLoading ? (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="size-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : user ? (
            <div className="flex flex-col">
              <div className="p-6 pb-0">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16 border-2 border-background shadow-sm">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="text-lg font-medium">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold truncate">{user.name}</h3>
                      {user.banned && <Badge variant="destructive">{content.users.banned}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge
                        variant={user.emailVerified ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {user.emailVerified ? content.users.verified : content.users.unverified}
                      </Badge>
                      {user.subscription && (
                        <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0 text-xs">
                          {user.subscription.planName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="rounded-2xl bg-muted/50 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Shield className="size-4 text-primary" />
                      </div>
                      <h4 className="font-medium">{content.users.detail.roleManagement}</h4>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg"
                      onClick={() => setAssignDialogOpen(true)}
                    >
                      <Plus className="size-3.5 mr-1" />
                      {content.users.detail.addRole}
                    </Button>
                  </div>

                  {user.roles.length > 0 ? (
                    <div className="space-y-2">
                      {user.roles.map((role) => (
                        <div
                          key={role.id}
                          className="flex items-center justify-between rounded-xl bg-background p-3"
                        >
                          <div>
                            <Badge
                              variant={role.name === "banned" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {role.title}
                            </Badge>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {role.expiresAt
                                ? `${content.users.detail.expiresAt}: ${new Date(role.expiresAt).toLocaleDateString()}`
                                : content.users.detail.permanent}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setRoleToRemove(role)}
                            aria-label="Remove role"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-background p-4 text-center">
                      <p className="text-sm text-muted-foreground">-</p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-muted/50 p-4 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <User className="size-4 text-primary" />
                    </div>
                    <h4 className="font-medium">{content.users.detail.basicInfo}</h4>
                  </div>

                  <div className="rounded-xl bg-background p-4 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{content.users.table.email}</span>
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-muted-foreground" />
                        <span className="truncate max-w-40">{user.email}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{content.users.subscription}</span>
                      {user.subscription ? (
                        <span className="font-medium">{user.subscription.planName}</span>
                      ) : (
                        <span className="text-muted-foreground">{content.users.free}</span>
                      )}
                    </div>

                    {creditEnabled && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{content.users.credits}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 font-medium tabular-nums">
                              <Coins className="size-3.5 text-amber-500" />
                              {user.creditBalance}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 rounded-md px-2 text-xs"
                              onClick={() => setGrantCreditsOpen(true)}
                            >
                              <Plus className="size-3 mr-0.5" />
                              {content.users.detail.grantCredits}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{content.users.table.createdAt}</span>
                      <span className="tabular-nums">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  {user.banned ? (
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl"
                      onClick={() => banMutation.mutate(false)}
                      disabled={banMutation.isPending}
                    >
                      <UserCheck className="size-4 mr-2" />
                      {content.users.detail.unban}
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      className="w-full h-11 rounded-xl"
                      onClick={() => banMutation.mutate(true)}
                      disabled={banMutation.isPending}
                    >
                      <Ban className="size-4 mr-2" />
                      {content.users.detail.ban}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!roleToRemove}
        onOpenChange={(open) => !open && setRoleToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{content.users.detail.removeRole}</AlertDialogTitle>
            <AlertDialogDescription>
              {content.users.detail.confirmRemoveRole}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{content.creditPackages.form.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {content.users.detail.removeRole}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {userId && (
        <RoleAssignDialog
          userId={userId}
          currentRoleIds={user?.roles.map((r) => r.roleId) ?? []}
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          onSuccess={handleRoleAssigned}
        />
      )}

      <Dialog
        open={grantCreditsOpen}
        onOpenChange={(open) => {
          setGrantCreditsOpen(open)
          if (!open) {
            setGrantAmount("")
            setGrantDescription("")
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{content.users.detail.grantCredits}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{content.users.detail.grantAmount}</Label>
              <Input
                type="number"
                min={1}
                placeholder="100"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{content.users.detail.grantDescription}</Label>
              <Input
                placeholder={content.users.detail.grantDescriptionPlaceholder.value}
                value={grantDescription}
                onChange={(e) => setGrantDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrantCreditsOpen(false)}
            >
              {content.creditPackages.form.cancel}
            </Button>
            <Button
              onClick={handleGrantCredits}
              disabled={
                !grantAmount || parseInt(grantAmount, 10) <= 0 || grantCreditsMutation.isPending
              }
            >
              {content.users.detail.grantConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
