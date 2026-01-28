import { createFileRoute } from "@tanstack/react-router"
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm"
import { db, subscription, user, userRole } from "@/db"
import { Resp } from "@/shared/lib/tools/response"
import { getConfig } from "@/shared/model/config.model"
import { getUserCreditBalance } from "@/shared/model/credit.model"
import { getUserRolesWithExpiry } from "@/shared/model/rabc.model"
import { findActiveSubscriptionByUserId } from "@/shared/model/subscription.model"
import type { AdminUserListItem } from "@/shared/types/admin"

export const Route = createFileRoute("/api/admin/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const page = Math.max(1, Number(url.searchParams.get("page")) || 1)
          const pageSize = Math.min(
            100,
            Math.max(1, Number(url.searchParams.get("pageSize")) || 10)
          )
          const offset = (page - 1) * pageSize

          const search = url.searchParams.get("search")?.trim()
          const bannedFilter = url.searchParams.get("banned")
          const subscriptionFilter = url.searchParams.get("subscription")
          const roleFilter = url.searchParams.get("role")
          const sortBy = url.searchParams.get("sortBy") || "createdAt"
          const sortOrder = url.searchParams.get("sortOrder") || "desc"

          const creditEnabled = await getConfig("public_credit_enable")

          const conditions: SQL[] = []

          if (search) {
            conditions.push(or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))!)
          }

          if (bannedFilter === "true") {
            conditions.push(eq(user.banned, true))
          } else if (bannedFilter === "false") {
            conditions.push(or(eq(user.banned, false), isNull(user.banned))!)
          }

          if (subscriptionFilter === "active") {
            const subscribedUsers = db
              .selectDistinct({ userId: subscription.userId })
              .from(subscription)
              .where(eq(subscription.status, "active"))
            conditions.push(inArray(user.id, subscribedUsers))
          } else if (subscriptionFilter === "none") {
            const subscribedUsers = db
              .selectDistinct({ userId: subscription.userId })
              .from(subscription)
              .where(eq(subscription.status, "active"))
            conditions.push(notInArray(user.id, subscribedUsers))
          }

          if (roleFilter) {
            const usersWithRole = db
              .selectDistinct({ userId: userRole.userId })
              .from(userRole)
              .where(eq(userRole.roleId, roleFilter))
            conditions.push(inArray(user.id, usersWithRole))
          }

          const whereClause = conditions.length > 0 ? and(...conditions) : undefined

          const orderByColumn =
            sortBy === "name" ? user.name : sortBy === "email" ? user.email : user.createdAt
          const orderBy = sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn)

          const [[{ total }], users] = await Promise.all([
            db.select({ total: count() }).from(user).where(whereClause),
            db
              .select({
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                image: user.image,
                createdAt: user.createdAt,
                banned: user.banned,
                bannedAt: user.bannedAt,
              })
              .from(user)
              .where(whereClause)
              .orderBy(orderBy)
              .limit(pageSize)
              .offset(offset),
          ])

          const enrichedUsers: AdminUserListItem[] = await Promise.all(
            users.map(async (u) => {
              const [roles, subscription, creditBalance] = await Promise.all([
                getUserRolesWithExpiry(u.id),
                findActiveSubscriptionByUserId(u.id),
                creditEnabled ? getUserCreditBalance(u.id) : Promise.resolve(0),
              ])

              return {
                ...u,
                banned: u.banned ?? false,
                bannedAt: u.bannedAt,
                roles,
                subscription: subscription
                  ? {
                      planId: subscription.planId,
                      planName: subscription.planId,
                      status: subscription.status,
                    }
                  : null,
                creditBalance,
              }
            })
          )

          return Resp.success({
            items: enrichedUsers,
            pagination: {
              page,
              pageSize,
              total,
              totalPages: Math.ceil(total / pageSize),
            },
          })
        } catch (error) {
          console.error("Failed to fetch users:", error)
          return Resp.error("Failed to fetch users")
        }
      },
    },
  },
})
