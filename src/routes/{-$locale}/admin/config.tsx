import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Eye, EyeOff, Lock } from "lucide-react"
import { useState } from "react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import { configGroups } from "@/config/schema"
import { PageHeader } from "@/shared/components/admin/page-header"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Switch } from "@/shared/components/ui/switch"
import { Textarea } from "@/shared/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip"
import type {
  ConfigGroup,
  ConfigMeta,
  ConfigSubGroup,
  SelectOption,
} from "@/shared/lib/config/helper"

export const Route = createFileRoute("/{-$locale}/admin/config")({
  component: ConfigPage,
})

function ConfigPage() {
  const queryClient = useQueryClient()
  const configI18n = useIntlayer("admin-config")
  const content = useIntlayer("admin")
  const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({})
  const [showValues, setShowValues] = useState(() => {
    const saved = localStorage.getItem("admin-config-show-values")
    return saved === null ? true : saved === "true"
  })

  const toggleShowValues = () => {
    setShowValues((prev) => {
      const next = !prev
      localStorage.setItem("admin-config-show-values", String(next))
      return next
    })
  }

  const { data: configs, isLoading } = useQuery({
    queryKey: ["admin", "configs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/config")
      if (!res.ok) throw new Error("Failed to fetch configs")
      const json = await res.json()
      return json.data as ConfigMeta[]
    },
  })

  const mutation = useMutation({
    mutationFn: async (changes: { key: string; value: unknown }[]) => {
      const results = await Promise.all(
        changes.map(async ({ key, value }) => {
          const res = await fetch("/api/admin/config", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value }),
          })
          const json = await res.json()
          if (!res.ok || json.code !== 200) {
            throw new Error(json.message || `Failed to update ${key}`)
          }
          return json.data
        })
      )
      return results
    },
    onSuccess: (_, changes) => {
      setPendingChanges((prev) => {
        const next = { ...prev }
        for (const { key } of changes) {
          delete next[key]
        }
        return next
      })

      toast.success(content.config.saveSuccess)
    },
    onError: (error) => {
      toast.error(error.message || content.config.saveFailed)
    },
  })

  const getConfigValue = (config: ConfigMeta) => {
    return config.value
  }

  const handleChange = (key: string, value: unknown) => {
    queryClient.setQueryData(["admin", "configs"], (old: ConfigMeta[] | undefined) => {
      if (!old) return old
      return old.map((config) => (config.key === key ? { ...config, value } : config))
    })
    setPendingChanges((prev) => ({ ...prev, [key]: value }))
  }

  const getGroupConfigs = (prefixes: string[]) => {
    return configs?.filter((c) => prefixes.some((prefix) => c.key.startsWith(prefix))) ?? []
  }

  const getGroupPendingChanges = (prefixes: string[]) => {
    return Object.entries(pendingChanges).filter(([key]) =>
      prefixes.some((prefix) => key.startsWith(prefix))
    )
  }

  const handleSaveGroup = (prefixes: string[]) => {
    const changes = getGroupPendingChanges(prefixes).map(([key, value]) => ({ key, value }))
    if (changes.length > 0) {
      mutation.mutate(changes)
    }
  }

  const handleCancelGroup = (prefixes: string[]) => {
    queryClient.invalidateQueries({ queryKey: ["admin", "configs"] })
    setPendingChanges((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (prefixes.some((prefix) => key.startsWith(prefix))) {
          delete next[key]
        }
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          title={content.config.title.value}
          description={content.config.description.value}
        />
        <ConfigSkeleton />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={content.config.title.value}
        description={content.config.description.value}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleShowValues}
            >
              {showValues ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {showValues ? content.config.hideValues.value : content.config.showValues.value}
          </TooltipContent>
        </Tooltip>
      </PageHeader>
      <div className="grid gap-6">
        {configGroups.map((group) => {
          const items = getGroupConfigs(group.prefixes)
          if (items.length === 0) return null

          const groupPendingChanges = getGroupPendingChanges(group.prefixes)
          const hasChanges = groupPendingChanges.length > 0

          return (
            <ConfigGroupCard
              key={group.id}
              group={group}
              items={items}
              hasChanges={hasChanges}
              isSaving={mutation.isPending}
              showValues={showValues}
              configI18n={configI18n}
              content={content}
              getConfigValue={getConfigValue}
              onChange={handleChange}
              onSave={() => handleSaveGroup(group.prefixes)}
              onCancel={() => handleCancelGroup(group.prefixes)}
            />
          )
        })}
      </div>
    </>
  )
}

type ConfigGroupCardProps = {
  group: ConfigGroup
  items: ConfigMeta[]
  hasChanges: boolean
  isSaving: boolean
  showValues: boolean
  configI18n: ReturnType<typeof useIntlayer<"admin-config">>
  content: ReturnType<typeof useIntlayer<"admin">>
  getConfigValue: (config: ConfigMeta) => unknown
  onChange: (key: string, value: unknown) => void
  onSave: () => void
  onCancel: () => void
}

function ConfigGroupCard({
  group,
  items,
  hasChanges,
  isSaving,
  showValues,
  configI18n,
  content,
  getConfigValue,
  onChange,
  onSave,
  onCancel,
}: ConfigGroupCardProps) {
  const groupI18n = configI18n.groups?.[group.labelKey as keyof typeof configI18n.groups]

  const getSubGroupItems = (subGroup: ConfigSubGroup) => {
    return items.filter((item) => subGroup.keys.includes(item.key))
  }

  const getUngroupedItems = () => {
    if (!group.subGroups || group.subGroups.length === 0) return items
    const groupedKeys = group.subGroups.flatMap((sg) => sg.keys)
    return items.filter((item) => !groupedKeys.includes(item.key))
  }

  const getSubGroupI18n = (labelKey: string) => {
    return configI18n.subGroups?.[labelKey as keyof typeof configI18n.subGroups]
  }

  const renderConfigItems = (configItems: ConfigMeta[]) => (
    <>
      {configItems.map((config) => (
        <ConfigField
          key={config.key}
          config={config}
          value={getConfigValue(config)}
          showValues={showValues}
          configI18n={configI18n}
          content={content}
          onChange={(value) => onChange(config.key, value)}
        />
      ))}
    </>
  )

  return (
    <Card className="relative shadow-none">
      {isSaving && (
        <div className="absolute inset-0 z-10 overflow-hidden rounded-xl bg-muted/30">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
        </div>
      )}
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{groupI18n?.title?.value ?? group.labelKey}</CardTitle>
            <CardDescription>{groupI18n?.description?.value}</CardDescription>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isSaving}
              >
                {content.config.cancel}
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving}
              >
                {content.config.save}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        {group.subGroups && group.subGroups.length > 0 ? (
          <>
            {getUngroupedItems().length > 0 && (
              <div className="grid gap-4">{renderConfigItems(getUngroupedItems())}</div>
            )}
            {group.subGroups.map((subGroup) => {
              const subGroupItems = getSubGroupItems(subGroup)
              if (subGroupItems.length === 0) return null
              const subGroupI18n = getSubGroupI18n(subGroup.labelKey)
              return (
                <div
                  key={subGroup.id}
                  className="space-y-3"
                >
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {subGroupI18n?.title?.value ?? subGroup.labelKey}
                  </h4>
                  <div className="grid gap-4">{renderConfigItems(subGroupItems)}</div>
                </div>
              )
            })}
          </>
        ) : (
          <div className="grid gap-4">{renderConfigItems(items)}</div>
        )}
      </CardContent>
    </Card>
  )
}

type ConfigFieldProps = {
  config: ConfigMeta
  value: unknown
  showValues: boolean
  configI18n: ReturnType<typeof useIntlayer<"admin-config">>
  content: ReturnType<typeof useIntlayer<"admin">>
  onChange: (value: unknown) => void
}

function ConfigField({
  config,
  value,
  showValues,
  configI18n,
  content,
  onChange,
}: ConfigFieldProps) {
  const i18n = configI18n[config.labelKey as keyof typeof configI18n] as
    | { label?: { value: string }; description?: { value: string } }
    | undefined

  const isLocked = config.isLocked

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={config.key}
            className="text-sm font-medium"
          >
            {i18n?.label?.value ?? config.labelKey}
          </Label>
          {isLocked && (
            <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs">
              <Lock className="size-3" />
              {content.config.locked}
            </span>
          )}
        </div>
        {i18n?.description && (
          <p className="text-muted-foreground text-xs">{i18n.description.value}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {config.type === "boolean" ? (
          <Switch
            id={config.key}
            checked={value as boolean}
            onCheckedChange={(checked) => onChange(checked)}
            disabled={isLocked}
          />
        ) : config.type === "select" ? (
          <SelectField
            config={config}
            value={value as string}
            configI18n={configI18n}
            disabled={isLocked}
            onChange={onChange}
          />
        ) : config.type === "textarea" ? (
          <Textarea
            id={config.key}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLocked}
            autoComplete="off"
            className="min-h-20 w-full sm:w-80"
          />
        ) : config.type === "number" ? (
          <Input
            id={config.key}
            type="number"
            value={value as number}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={isLocked}
            autoComplete="off"
            className="w-full sm:w-40"
          />
        ) : (
          <Input
            id={config.key}
            type={showValues ? "text" : "password"}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLocked}
            autoComplete="off"
            className="w-full sm:w-80"
          />
        )}
      </div>
    </div>
  )
}

function SelectField({
  config,
  value,
  configI18n,
  disabled,
  onChange,
}: {
  config: ConfigMeta
  value: string
  configI18n: ReturnType<typeof useIntlayer<"admin-config">>
  disabled: boolean
  onChange: (value: unknown) => void
}) {
  const getOptionLabel = (option: SelectOption) => {
    if (!option.labelKey) return option.value
    const optionI18n = configI18n[option.labelKey as keyof typeof configI18n] as
      | { label?: { value: string } }
      | undefined
    return optionI18n?.label?.value ?? option.value
  }

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {config.options?.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
          >
            {getOptionLabel(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ConfigSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="grid gap-4">
        {[1, 2, 3].map((j) => (
          <Skeleton
            key={j}
            className="h-16 w-full"
          />
        ))}
      </CardContent>
    </Card>
  )
}
