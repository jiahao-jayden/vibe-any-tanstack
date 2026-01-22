import type { z } from "zod"

// ==================== 类型定义 ====================

type ConfigType = "string" | "number" | "boolean" | "select" | "textarea"

type SelectOption = { value: string; labelKey?: string }

// 基础配置定义
type BaseConfigDef = {
  labelKey: string
  descriptionKey?: string
  env?: string
  validation?: z.ZodType
}

// 根据 type 推导 default 的类型
type ConfigDef =
  | (BaseConfigDef & { type: "string" | "textarea"; default: string })
  | (BaseConfigDef & { type: "number"; default: number })
  | (BaseConfigDef & { type: "boolean"; default: boolean })
  | (BaseConfigDef & { type: "select"; default: string; options: SelectOption[] })

type ConfigSchema = Record<string, ConfigDef>

// 从 schema 推导值类型
type InferConfigValues<T extends ConfigSchema> = {
  [K in keyof T]: T[K]["default"]
}

// 导出类型
export type { ConfigType, ConfigDef, ConfigSchema, SelectOption, ConfigGroup, ConfigSubGroup }

// 配置元数据类型（用于 Admin UI）
export type ConfigMeta = {
  key: string
  type: ConfigType
  labelKey: string
  descriptionKey?: string
  options?: SelectOption[]
  value: unknown
  defaultValue: unknown
  isLocked: boolean // 环境变量锁定
}

// ==================== 核心函数 ====================

// 定义配置（类型安全）
export function defineConfig<T extends ConfigSchema>(schema: T) {
  return schema
}

// 子分组定义
type ConfigSubGroup = {
  id: string
  labelKey: string
  keys: string[]
}

// 分组定义
type ConfigGroup = {
  id: string
  labelKey: string
  prefixes: string[]
  subGroups?: ConfigSubGroup[]
}

export function defineGroup(group: ConfigGroup) {
  return group
}

export function defineSubGroup(subGroup: ConfigSubGroup) {
  return subGroup
}

// 获取环境变量值
function getEnvValue(key: string | undefined): string | undefined {
  if (!key) return undefined
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env?.[key]
  }
  if (typeof import.meta?.env !== "undefined" && import.meta.env?.[key]) {
    return import.meta.env?.[key]
  }
  return undefined
}

// 检查环境变量是否有值
function hasEnvValue(key: string | undefined): boolean {
  const value = getEnvValue(key)
  return value !== undefined && value !== ""
}

// 解析值类型
function parseValue<T>(value: string | undefined, defaultValue: T): T {
  if (value === undefined || value === "") return defaultValue

  if (typeof defaultValue === "boolean") {
    return (value === "true" || value === "1") as T
  }
  if (typeof defaultValue === "number") {
    const num = Number(value)
    return (Number.isNaN(num) ? defaultValue : num) as T
  }
  return value as T
}

// ==================== 配置解析器 ====================

export function createConfigResolver<T extends ConfigSchema>(schema: T) {
  type Values = InferConfigValues<T>
  type Key = keyof T & string

  // 解析所有配置
  // 优先级：环境变量 → 数据库 → 代码默认值
  function resolveAllConfigs(dbValues: Record<string, unknown>): Values {
    const result = {} as Values

    for (const [key, def] of Object.entries(schema)) {
      const envValue = getEnvValue(def.env)

      if (envValue !== undefined && envValue !== "") {
        // 环境变量优先
        result[key as Key] = parseValue(envValue, def.default) as Values[Key]
      } else if (key in dbValues && dbValues[key] !== undefined && dbValues[key] !== "") {
        // 数据库次之
        result[key as Key] = dbValues[key] as Values[Key]
      } else {
        // 最后用默认值
        result[key as Key] = def.default as Values[Key]
      }
    }

    return result
  }

  // 获取公开配置（public_ 前缀）
  function filterPublicConfigs(values: Values): Partial<Values> {
    const result: Partial<Values> = {}
    for (const key of Object.keys(values)) {
      if (key.startsWith("public_")) {
        result[key as Key] = values[key as Key]
      }
    }
    return result
  }

  // 验证配置值
  function validateConfig<K extends Key>(
    key: K,
    value: unknown
  ): { success: true; data: Values[K] } | { success: false; error: string } {
    const def = schema[key]
    if (!def.validation) {
      return { success: true, data: value as Values[K] }
    }

    const result = def.validation.safeParse(value)
    if (result.success) {
      return { success: true, data: result.data as Values[Key] }
    }
    return { success: false, error: result.error.message }
  }

  // 检查配置是否被环境变量锁定
  function isConfigLocked(key: Key): boolean {
    const def = schema[key]
    return hasEnvValue(def.env)
  }

  // 获取配置元数据（用于 Admin API）
  function getConfigMetas(values: Values) {
    return Object.entries(schema).map(([key, def]) => ({
      key,
      type: def.type,
      labelKey: def.labelKey,
      descriptionKey: def.descriptionKey,
      options: def.type === "select" ? (def as any).options : undefined,
      value: values[key as Key],
      defaultValue: def.default,
      isLocked: hasEnvValue(def.env),
    }))
  }

  return {
    schema,
    resolveAllConfigs,
    filterPublicConfigs,
    validateConfig,
    isConfigLocked,
    getConfigMetas,
  }
}
