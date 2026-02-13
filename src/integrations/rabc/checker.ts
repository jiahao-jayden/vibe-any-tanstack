export interface AbilityRule {
  permissionCode: string
  inverted: boolean
  conditions?: {
    ownOnly?: boolean
    fields?: string[]
  }
}

type CheckContext = {
  userId?: string
  ownerId?: string
  field?: string
}

/**
 * Permission checker with allow-first strategy
 *
 * - Multiple roles' permissions are merged (union)
 * - If any role allows, the action is allowed
 * - super_admin with "*" permission can do anything regardless of other roles
 * - "inverted" rules only affect within the same role, not across roles
 */
export class PermissionChecker {
  private rules: AbilityRule[]

  constructor(rules: AbilityRule[]) {
    this.rules = rules
  }

  can(action: string, resource: string, context?: CheckContext): boolean {
    const code = `${resource}:${action}`

    for (const rule of this.rules) {
      if (rule.inverted) continue

      if (!this.matchCode(rule.permissionCode, code)) continue

      if (!this.checkConditions(rule, context)) continue

      return true
    }

    return false
  }

  cannot(action: string, resource: string, context?: CheckContext): boolean {
    return !this.can(action, resource, context)
  }

  hasPermission(permissionCode: string): boolean {
    const [resource, action] = permissionCode.split(":")
    return this.can(action, resource)
  }

  private checkConditions(rule: AbilityRule, context?: CheckContext): boolean {
    if (!rule.conditions) return true

    if (rule.conditions.ownOnly && context?.userId !== context?.ownerId) {
      return false
    }

    if (rule.conditions.fields && context?.field) {
      if (!rule.conditions.fields.includes(context.field)) return false
    }

    return true
  }

  private matchCode(pattern: string, code: string): boolean {
    if (pattern === "*") return true
    if (pattern === code) return true

    if (pattern.endsWith(":*")) {
      const prefix = pattern.slice(0, -2)
      return code.startsWith(`${prefix}:`)
    }

    return false
  }
}
