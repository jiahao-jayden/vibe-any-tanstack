import { Lock } from "lucide-react"
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
import { Switch } from "@/shared/components/ui/switch"
import { Textarea } from "@/shared/components/ui/textarea"
import type {
  ConfigGroup,
  ConfigMeta,
  ConfigSubGroup,
  SelectOption,
} from "@/shared/lib/config/helper"

export type ConfigI18n = Record<
  string,
  | { label?: { value: string }; description?: { value: string }; title?: { value: string } }
  | undefined
> & {
  groups?: Record<string, { title?: { value: string }; description?: { value: string } } | undefined>
  subGroups?: Record<string, { title?: { value: string } } | undefined>
}

export type ConfigGroupCardProps = {
  group: ConfigGroup
  items: ConfigMeta[]
  hasChanges: boolean
  isSaving: boolean
  showValues: boolean
  configI18n: ConfigI18n
  saveLabel: string
  cancelLabel: string
  lockedLabel: string
  getConfigValue: (config: ConfigMeta) => unknown
  onChange: (key: string, value: unknown) => void
  onSave: () => void
  onCancel: () => void
}

export function ConfigGroupCard({
  group,
  items,
  hasChanges,
  isSaving,
  showValues,
  configI18n,
  saveLabel,
  cancelLabel,
  lockedLabel,
  getConfigValue,
  onChange,
  onSave,
  onCancel,
}: ConfigGroupCardProps) {
  const groupI18n = configI18n.groups?.[group.labelKey]

  const getSubGroupItems = (subGroup: ConfigSubGroup) => {
    return items.filter((item) => subGroup.keys.includes(item.key))
  }

  const getUngroupedItems = () => {
    if (!group.subGroups || group.subGroups.length === 0) return items
    const groupedKeys = group.subGroups.flatMap((sg) => sg.keys)
    return items.filter((item) => !groupedKeys.includes(item.key))
  }

  const getSubGroupI18n = (labelKey: string) => {
    return configI18n.subGroups?.[labelKey]
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
          lockedLabel={lockedLabel}
          onChange={(value) => onChange(config.key, value)}
        />
      ))}
    </>
  )

  return (
    <Card className="relative shadow-none">
      {isSaving && (
        <div className="absolute inset-0 z-10 overflow-hidden rounded-xl bg-muted/30">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_ease-in-out_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
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
                {cancelLabel}
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving}
              >
                {saveLabel}
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
  configI18n: ConfigI18n
  lockedLabel: string
  onChange: (value: unknown) => void
}

function ConfigField({
  config,
  value,
  showValues,
  configI18n,
  lockedLabel,
  onChange,
}: ConfigFieldProps) {
  const i18n = configI18n[config.labelKey] as
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
              {lockedLabel}
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
        ) : config.type === "time_hour" ? (
          <TimeHourField
            id={config.key}
            value={value as number}
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
  configI18n: ConfigI18n
  disabled: boolean
  onChange: (value: unknown) => void
}) {
  const getOptionLabel = (option: SelectOption) => {
    if (!option.labelKey) return option.value
    const optionI18n = configI18n[option.labelKey] as
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

function TimeHourField({
  id,
  value,
  disabled,
  onChange,
}: {
  id: string
  value: number
  disabled: boolean
  onChange: (value: unknown) => void
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, "0")}:00`
  }

  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v))}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className="w-full sm:w-32"
      >
        <SelectValue>{formatHour(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="max-h-56"
      >
        {hours.map((hour) => (
          <SelectItem
            key={hour}
            value={String(hour)}
          >
            {formatHour(hour)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
