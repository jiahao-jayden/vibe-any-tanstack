import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import { aiConfigGroups } from "@/config/dynamic-config"
import { PageHeader } from "@/shared/components/admin"
import { ConfigGroupCard } from "@/shared/components/admin/config-field"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip"
import type { ConfigMeta } from "@/shared/lib/config/helper"
import { http } from "@/shared/lib/tools/http-client"

export const Route = createFileRoute("/{-$locale}/_main/admin/ai-config")({
  component: AIConfigPage,
})

function AIConfigPage() {
  const queryClient = useQueryClient()
  const configI18n = useIntlayer("admin-config")
  const content = useIntlayer("admin")
  const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({})
  const [showValues, setShowValues] = useState(() => {
    const saved = localStorage.getItem("admin-ai-config-show-values")
    return saved === null ? true : saved === "true"
  })

  const toggleShowValues = () => {
    setShowValues((prev) => {
      const next = !prev
      localStorage.setItem("admin-ai-config-show-values", String(next))
      return next
    })
  }

  const { data: configs, isLoading } = useQuery({
    queryKey: ["admin", "configs"],
    queryFn: () => http<ConfigMeta[]>("/api/admin/config"),
    initialData: [],
    refetchOnWindowFocus: false,
  })

  const mutation = useMutation({
    mutationFn: async (changes: { key: string; value: unknown }[]) => {
      const results = await Promise.all(
        changes.map(({ key, value }) =>
          http("/api/admin/config", {
            method: "PUT",
            body: { key, value },
          })
        )
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
          title="AI Config"
          description="Configure AI provider API keys"
        />
        <AIConfigSkeleton />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="AI Config"
        description="Configure AI provider API keys"
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
        {aiConfigGroups.map((group) => {
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
              configI18n={configI18n as any}
              saveLabel={String(content.config.save.value)}
              cancelLabel={String(content.config.cancel.value)}
              lockedLabel={String(content.config.locked.value)}
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

function AIConfigSkeleton() {
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
