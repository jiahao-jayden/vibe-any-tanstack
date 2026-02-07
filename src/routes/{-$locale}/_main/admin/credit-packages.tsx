import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { AlertCircle, CheckCircle2, Coins, Package, Pencil, Plus, Trash2 } from "lucide-react"
import { useId, useMemo, useState } from "react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import { CURRENCY } from "@/config/payment-config"
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
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Switch } from "@/shared/components/ui/switch"
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
import type { CreditPackage } from "@/shared/types/payment"

export const Route = createFileRoute("/{-$locale}/_main/admin/credit-packages")({
  component: CreditPackagesPage,
})

type FormData = {
  name: string
  description: string
  creditAmount: number
  expireDays: number | null
  priceAmount: number
  stripePriceId: string
  sortOrder: number
  isActive: boolean
}

const defaultFormData: FormData = {
  name: "",
  description: "",
  creditAmount: 100,
  expireDays: 30,
  priceAmount: 990,
  stripePriceId: "",
  sortOrder: 0,
  isActive: true,
}

function CreditPackagesPage() {
  const content = useIntlayer("admin")
  const creditPackagesDict = useIntlayer("credit-packages")
  const queryClient = useQueryClient()
  const formId = useId()
  const { config } = useGlobalContext()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null)
  const [deletePackage, setDeletePackage] = useState<CreditPackage | null>(null)
  const [formData, setFormData] = useState<FormData>(defaultFormData)

  const localeKeyValidation = useMemo(() => {
    const nameKey = formData.name.trim()
    const descKey = formData.description.trim()
    if (!nameKey || !descKey) return { valid: false, nameExists: false, descExists: false }

    const dict = creditPackagesDict as Record<string, { name?: unknown; description?: unknown }>
    const entry = dict[nameKey]
    const nameExists = !!entry?.name
    const descExists = !!entry?.description

    return { valid: nameExists && descExists, nameExists, descExists }
  }, [formData.name, formData.description, creditPackagesDict])

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["admin", "credit-packages"],
    queryFn: () => http<CreditPackage[]>("/api/admin/credit-packages"),
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      http("/api/admin/credit-packages", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "credit-packages"] })
      setIsDialogOpen(false)
      resetForm()
      toast.success("Credit package created")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData & { id: string }) =>
      http("/api/admin/credit-packages", {
        method: "PUT",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "credit-packages"] })
      setIsDialogOpen(false)
      setEditingPackage(null)
      resetForm()
      toast.success("Credit package updated")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      http(`/api/admin/credit-packages?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "credit-packages"] })
      setDeletePackage(null)
      toast.success("Credit package deleted")
    },
  })

  const resetForm = () => {
    setFormData(defaultFormData)
  }

  const handleEdit = (pkg: CreditPackage) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      description: pkg.name,
      creditAmount: pkg.creditAmount,
      expireDays: pkg.expireDays,
      priceAmount: pkg.priceAmount,
      stripePriceId: pkg.stripePriceId,
      sortOrder: pkg.sortOrder,
      isActive: pkg.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      expireDays: formData.expireDays || null,
    }

    if (editingPackage) {
      updateMutation.mutate({ ...data, id: editingPackage.id })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingPackage(null)
    resetForm()
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount / 100)
  }

  return (
    <>
      <PageHeader
        title={content.creditPackages.title.value}
        description={content.creditPackages.description.value}
      >
        <Button
          onClick={() => {
            if (!config?.public_credit_enable) {
              toast.error(content.creditPackages.creditNotEnabled.value)
              return
            }
            setIsDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          {content.creditPackages.add}
        </Button>
      </PageHeader>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-3 border-b px-6 py-4">
          <Coins className="size-5 text-muted-foreground" />
          <h2 className="text-base font-medium">{content.creditPackages.title}</h2>
          {packages && (
            <Badge
              variant="secondary"
              className="ml-auto"
            >
              {packages.length} {content.creditPackages.count}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">{content.creditPackages.table.name}</TableHead>
                  <TableHead>{content.creditPackages.table.credits}</TableHead>
                  <TableHead>{content.creditPackages.table.price}</TableHead>
                  <TableHead>{content.creditPackages.table.expireDays}</TableHead>
                  <TableHead>{content.creditPackages.table.status}</TableHead>
                  <TableHead className="pr-6">{content.creditPackages.table.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-14 rounded-full" />
                    </TableCell>
                    <TableCell className="pr-6">
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : packages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Package className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-medium">{content.creditPackages.empty}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{content.creditPackages.emptyDesc}</p>
            <Button
              className="mt-4"
              onClick={() => {
                if (!config?.public_credit_enable) {
                  toast.error(content.creditPackages.creditNotEnabled.value)
                  return
                }
                setIsDialogOpen(true)
              }}
            >
              <Plus className="mr-2 size-4" />
              {content.creditPackages.add.value}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">{content.creditPackages.table.name}</TableHead>
                  <TableHead>{content.creditPackages.table.credits}</TableHead>
                  <TableHead>{content.creditPackages.table.price}</TableHead>
                  <TableHead>{content.creditPackages.table.expireDays}</TableHead>
                  <TableHead>{content.creditPackages.table.status}</TableHead>
                  <TableHead className="pr-6">{content.creditPackages.table.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages?.map((pkg) => {
                  const dict = creditPackagesDict as Record<
                    string,
                    { name?: { value: string }; description?: { value: string } }
                  >
                  const entry = dict[pkg.name]
                  return (
                    <TableRow key={pkg.id}>
                      <TableCell className="pl-6">
                        <div>
                          <div className="font-medium">{entry?.name?.value ?? pkg.name}</div>
                          {entry?.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-48">
                              {entry.description.value}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{pkg.creditAmount}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatPrice(pkg.priceAmount, pkg.currency)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {pkg.expireDays
                          ? `${pkg.expireDays} ${content.creditPackages.days.value}`
                          : content.creditPackages.forever.value}
                      </TableCell>
                      <TableCell>
                        <Badge variant={pkg.isActive ? "default" : "secondary"}>
                          {pkg.isActive
                            ? content.creditPackages.active
                            : content.creditPackages.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(pkg)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletePackage(pkg)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? content.creditPackages.edit : content.creditPackages.add}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-name`}>{content.creditPackages.form.localeKey}</Label>
                <div className="relative">
                  <Input
                    id={`${formId}-name`}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        description: e.target.value,
                      })
                    }
                    placeholder={String(content.creditPackages.form.localeKeyPlaceholder.value)}
                    className="pr-8"
                    required
                  />
                  {formData.name && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      {localeKeyValidation.nameExists && localeKeyValidation.descExists ? (
                        <CheckCircle2 className="size-4 text-green-500" />
                      ) : (
                        <AlertCircle className="size-4 text-amber-500" />
                      )}
                    </div>
                  )}
                </div>
                {formData.name && !localeKeyValidation.valid && (
                  <p className="text-xs text-amber-600">
                    {!localeKeyValidation.nameExists && !localeKeyValidation.descExists
                      ? String(content.creditPackages.form.localeKeyNotFound.value).replace(
                          "{key}",
                          formData.name
                        )
                      : !localeKeyValidation.nameExists
                        ? String(content.creditPackages.form.localeKeyMissingName.value).replace(
                            "{key}",
                            formData.name
                          )
                        : String(content.creditPackages.form.localeKeyMissingDesc.value).replace(
                            "{key}",
                            formData.name
                          )}
                  </p>
                )}
                {formData.name && localeKeyValidation.valid && (
                  <p className="text-xs text-green-600">
                    {content.creditPackages.form.localeKeyVerified}
                  </p>
                )}
              </div>
            </div>

            <fieldset
              disabled={!localeKeyValidation.valid}
              className="space-y-4 disabled:opacity-50"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-creditAmount`}>
                    {content.creditPackages.form.creditAmount}
                  </Label>
                  <Input
                    id={`${formId}-creditAmount`}
                    type="number"
                    value={formData.creditAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, creditAmount: Number(e.target.value) })
                    }
                    min={1}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`${formId}-expireDays`}>
                    {content.creditPackages.form.expireDays}
                  </Label>
                  <Input
                    id={`${formId}-expireDays`}
                    type="number"
                    value={formData.expireDays ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expireDays: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    min={1}
                    placeholder={String(content.creditPackages.form.expireDaysHint.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-priceAmount`}>
                  {content.creditPackages.form.priceAmount} ({CURRENCY})
                </Label>
                <Input
                  id={`${formId}-priceAmount`}
                  type="number"
                  value={formData.priceAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, priceAmount: Number(e.target.value) })
                  }
                  min={1}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {content.creditPackages.form.priceAmountHint}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-stripePriceId`}>
                  {content.creditPackages.form.stripePriceId}
                </Label>
                <Input
                  id={`${formId}-stripePriceId`}
                  value={formData.stripePriceId}
                  onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })}
                  placeholder="price_xxx"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-sortOrder`}>
                    {content.creditPackages.form.sortOrder}
                  </Label>
                  <Input
                    id={`${formId}-sortOrder`}
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="flex items-center justify-between pt-6">
                  <Label htmlFor={`${formId}-isActive`}>
                    {content.creditPackages.form.isActive}
                  </Label>
                  <Switch
                    id={`${formId}-isActive`}
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
              >
                {content.creditPackages.form.cancel}
              </Button>
              <Button
                type="submit"
                disabled={
                  !localeKeyValidation.valid || createMutation.isPending || updateMutation.isPending
                }
              >
                {content.creditPackages.form.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletePackage}
        onOpenChange={() => setDeletePackage(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{content.creditPackages.delete}</AlertDialogTitle>
            <AlertDialogDescription>{content.creditPackages.confirmDelete}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{content.creditPackages.form.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePackage && deleteMutation.mutate(deletePackage.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {content.creditPackages.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
