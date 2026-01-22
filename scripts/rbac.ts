#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { eq, and } from 'drizzle-orm';
import { db, closeDb } from '@/db';
import { permission, role, rolePermission, userRole, user } from '@/db/';
import { getUuid } from '@/shared/lib/tools/hash';

const program = new Command();

// ============================================================
// Default Permission Definitions
// ============================================================
const DEFAULT_PERMISSIONS = [
  // User Management
  { code: 'user:read', resource: 'user', action: 'read', title: 'View Users' },
  { code: 'user:create', resource: 'user', action: 'create', title: 'Create Users' },
  { code: 'user:update', resource: 'user', action: 'update', title: 'Edit Users' },
  { code: 'user:delete', resource: 'user', action: 'delete', title: 'Delete Users' },

  // Post Management
  { code: 'post:read', resource: 'post', action: 'read', title: 'View Posts' },
  { code: 'post:create', resource: 'post', action: 'create', title: 'Create Posts' },
  { code: 'post:update', resource: 'post', action: 'update', title: 'Edit Posts' },
  { code: 'post:delete', resource: 'post', action: 'delete', title: 'Delete Posts' },

  // Category Management
  { code: 'category:read', resource: 'category', action: 'read', title: 'View Categories' },
  { code: 'category:create', resource: 'category', action: 'create', title: 'Create Categories' },
  { code: 'category:update', resource: 'category', action: 'update', title: 'Edit Categories' },
  { code: 'category:delete', resource: 'category', action: 'delete', title: 'Delete Categories' },

  // Order Management
  { code: 'order:read', resource: 'order', action: 'read', title: 'View Orders' },
  { code: 'order:export', resource: 'order', action: 'export', title: 'Export Orders' },

  // Payment Management
  { code: 'payment:read', resource: 'payment', action: 'read', title: 'View Payments' },

  // Subscription Management
  { code: 'subscription:read', resource: 'subscription', action: 'read', title: 'View Subscriptions' },
  { code: 'subscription:cancel', resource: 'subscription', action: 'cancel', title: 'Cancel Subscriptions' },

  // Credit Management
  { code: 'credit:read', resource: 'credit', action: 'read', title: 'View Credits' },
  { code: 'credit:grant', resource: 'credit', action: 'grant', title: 'Grant Credits' },

  // API Key Management
  { code: 'apikey:read', resource: 'apikey', action: 'read', title: 'View API Keys' },
  { code: 'apikey:create', resource: 'apikey', action: 'create', title: 'Create API Keys' },
  { code: 'apikey:delete', resource: 'apikey', action: 'delete', title: 'Delete API Keys' },

  // System Configuration
  { code: 'config:read', resource: 'config', action: 'read', title: 'View Config' },
  { code: 'config:update', resource: 'config', action: 'update', title: 'Update Config' },

  // Role & Permission Management
  { code: 'role:read', resource: 'role', action: 'read', title: 'View Roles' },
  { code: 'role:create', resource: 'role', action: 'create', title: 'Create Roles' },
  { code: 'role:update', resource: 'role', action: 'update', title: 'Edit Roles' },
  { code: 'role:delete', resource: 'role', action: 'delete', title: 'Delete Roles' },
];

// ============================================================
// Default Role Definitions
// ============================================================
const DEFAULT_ROLES = [
  {
    name: 'super_admin',
    title: 'Super Admin',
    description: 'Has all permissions',
    isSystem: true,
    permissions: ['*'],
  },
  {
    name: 'admin',
    title: 'Admin',
    description: 'Backend management permissions',
    isSystem: true,
    permissions: [
      'user:*',
      'post:*',
      'category:*',
      'order:read',
      'order:export',
      'payment:read',
      'subscription:read',
      'credit:read',
      'credit:grant',
      'apikey:*',
      'config:read',
    ],
  },
];

// ============================================================
// Utility Functions
// ============================================================
function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const icons = { info: 'ℹ', success: '✓', error: '✗', warn: '⚠' };
  const colors = { info: chalk.blue, success: chalk.green, error: chalk.red, warn: chalk.yellow };
  console.log(colors[type](`  ${icons[type]} ${message}`));
}

function header(text: string) {
  console.log(chalk.cyan(`\n▸ ${text}`));
}

async function showBanner() {
  const text = figlet.textSync('RBAC CLI', { font: 'Small' });
  console.log(chalk.yellow(text));
}

// ============================================================
// init Command
// ============================================================
async function init(options: { force?: boolean }) {
  header('Initializing RBAC System');

  // 1. Create Permissions
  header('Creating Permissions');
  let createdPerms = 0;
  let skippedPerms = 0;

  for (const perm of DEFAULT_PERMISSIONS) {
    const [existing] = await db
      .select()
      .from(permission)
      .where(eq(permission.code, perm.code));

    if (existing) {
      if (options.force) {
        await db
          .update(permission)
          .set({ ...perm, updatedAt: new Date() })
          .where(eq(permission.code, perm.code));
        log(`Updated permission: ${perm.code}`, 'warn');
      } else {
        skippedPerms++;
      }
    } else {
      await db.insert(permission).values({
        id: getUuid(),
        ...perm,
      });
      log(`Created permission: ${perm.code}`, 'success');
      createdPerms++;
    }
  }

  if (skippedPerms > 0) {
    log(`Skipped ${skippedPerms} existing permissions`, 'info');
  }

  // 2. Create Roles
  header('Creating Roles');
  const roleIdMap: Record<string, string> = {};

  for (const r of DEFAULT_ROLES) {
    const [existing] = await db
      .select()
      .from(role)
      .where(eq(role.name, r.name));

    let roleId: string;

    if (existing) {
      roleId = existing.id;
      if (options.force) {
        await db
          .update(role)
          .set({
            title: r.title,
            description: r.description,
            isSystem: r.isSystem,
            inherits: [],
            updatedAt: new Date(),
          })
          .where(eq(role.name, r.name));
        log(`Updated role: ${r.name}`, 'warn');
      } else {
        log(`Role already exists: ${r.name}`, 'info');
      }
    } else {
      roleId = getUuid();
      await db.insert(role).values({
        id: roleId,
        name: r.name,
        title: r.title,
        description: r.description,
        isSystem: r.isSystem,
        inherits: [],
        status: 'active',
        sort: DEFAULT_ROLES.indexOf(r),
      });
      log(`Created role: ${r.name}`, 'success');
    }

    roleIdMap[r.name] = roleId;
  }

  // 3. Assign Role Permissions
  header('Assigning Role Permissions');

  for (const r of DEFAULT_ROLES) {
    const roleId = roleIdMap[r.name];

    if (options.force) {
      await db.delete(rolePermission).where(eq(rolePermission.roleId, roleId));
    }

    for (const permCode of r.permissions) {
      const [existing] = await db
        .select()
        .from(rolePermission)
        .where(
          and(
            eq(rolePermission.roleId, roleId),
            eq(rolePermission.permissionCode, permCode)
          )
        );

      if (!existing) {
        await db.insert(rolePermission).values({
          id: getUuid(),
          roleId,
          permissionCode: permCode,
          inverted: false,
        });
      }
    }

    log(`${r.name}: ${r.permissions.length} permissions`, 'success');
  }

  console.log(chalk.green('\n✅ RBAC system initialization complete!\n'));
}

// ============================================================
// assign Command - Assign Role to User
// ============================================================
async function assignRole(options: { email?: string; userId?: string; role: string; expiresDays?: number }) {
  header('Assign Role');

  let targetUser;
  if (options.email) {
    [targetUser] = await db.select().from(user).where(eq(user.email, options.email));
  } else if (options.userId) {
    [targetUser] = await db.select().from(user).where(eq(user.id, options.userId));
  }

  if (!targetUser) {
    log('User not found', 'error');
    return;
  }

  log(`User: ${targetUser.name} (${targetUser.email})`, 'info');

  const [targetRole] = await db.select().from(role).where(eq(role.name, options.role));

  if (!targetRole) {
    log(`Role not found: ${options.role}`, 'error');
    log('Available roles: ' + DEFAULT_ROLES.map((r) => r.name).join(', '), 'info');
    return;
  }

  const [existing] = await db
    .select()
    .from(userRole)
    .where(and(eq(userRole.userId, targetUser.id), eq(userRole.roleId, targetRole.id)));

  if (existing) {
    log(`User already has role: ${options.role}`, 'warn');
    return;
  }

  let expiresAt: Date | undefined;
  if (options.expiresDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + options.expiresDays);
  }

  await db.insert(userRole).values({
    id: getUuid(),
    userId: targetUser.id,
    roleId: targetRole.id,
    expiresAt,
  });

  log(`Successfully assigned role: ${targetRole.title}`, 'success');
  if (expiresAt) {
    log(`Expires at: ${expiresAt.toISOString()}`, 'info');
  }
}

// ============================================================
// revoke Command - Revoke User Role
// ============================================================
async function revokeRole(options: { email?: string; userId?: string; role: string }) {
  header('Revoke Role');

  let targetUser;
  if (options.email) {
    [targetUser] = await db.select().from(user).where(eq(user.email, options.email));
  } else if (options.userId) {
    [targetUser] = await db.select().from(user).where(eq(user.id, options.userId));
  }

  if (!targetUser) {
    log('User not found', 'error');
    return;
  }

  const [targetRole] = await db.select().from(role).where(eq(role.name, options.role));

  if (!targetRole) {
    log(`Role not found: ${options.role}`, 'error');
    return;
  }

  await db
    .delete(userRole)
    .where(and(eq(userRole.userId, targetUser.id), eq(userRole.roleId, targetRole.id)));

  log(`Revoked ${targetRole.title} role from ${targetUser.name}`, 'success');
}

// ============================================================
// list Command - List Roles/Permissions
// ============================================================
async function listRoles() {
  header('Role List');

  const roles = await db.select().from(role).orderBy(role.sort);

  console.log('');
  console.log(chalk.gray('  Name'.padEnd(20) + 'Title'.padEnd(15) + 'System'.padEnd(8) + 'Status'));
  console.log(chalk.gray('  ' + '-'.repeat(50)));

  for (const r of roles) {
    const isSystem = r.isSystem ? chalk.yellow('Yes') : chalk.gray('No');
    const status = r.status === 'active' ? chalk.green('Active') : chalk.red('Disabled');
    console.log(`  ${r.name.padEnd(18)}${r.title.padEnd(13)}${isSystem.padEnd(12)}${status}`);
  }
  console.log('');
}

async function listPermissions(options: { resource?: string }) {
  header('Permission List');

  let query = db.select().from(permission).orderBy(permission.resource, permission.sort);

  const permissions = await query;
  const filtered = options.resource
    ? permissions.filter((p) => p.resource === options.resource)
    : permissions;

  const grouped = filtered.reduce((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {} as Record<string, typeof filtered>);

  for (const [resource, perms] of Object.entries(grouped)) {
    console.log(chalk.cyan(`\n  [${resource}]`));
    for (const p of perms) {
      console.log(chalk.gray(`    ${p.code.padEnd(25)} ${p.title}`));
    }
  }
  console.log('');
}

async function listUserRoles(options: { email?: string; userId?: string }) {
  header('User Roles');

  let targetUser;
  if (options.email) {
    [targetUser] = await db.select().from(user).where(eq(user.email, options.email));
  } else if (options.userId) {
    [targetUser] = await db.select().from(user).where(eq(user.id, options.userId));
  }

  if (!targetUser) {
    log('User not found', 'error');
    return;
  }

  log(`User: ${targetUser.name} (${targetUser.email})`, 'info');

  const userRoles = await db
    .select({
      roleName: role.name,
      roleTitle: role.title,
      expiresAt: userRole.expiresAt,
      createdAt: userRole.createdAt,
    })
    .from(userRole)
    .innerJoin(role, eq(userRole.roleId, role.id))
    .where(eq(userRole.userId, targetUser.id));

  if (userRoles.length === 0) {
    log('This user has no roles', 'warn');
    return;
  }

  console.log('');
  for (const ur of userRoles) {
    const expires = ur.expiresAt ? chalk.yellow(`(Expires: ${ur.expiresAt.toLocaleDateString()})`) : chalk.green('(Permanent)');
    console.log(`  • ${ur.roleTitle} (${ur.roleName}) ${expires}`);
  }
  console.log('');
}

// ============================================================
// check Command - Check User Permission
// ============================================================
async function checkPermission(options: { email?: string; userId?: string; permission: string }) {
  header('Check Permission');

  let targetUser;
  if (options.email) {
    [targetUser] = await db.select().from(user).where(eq(user.email, options.email));
  } else if (options.userId) {
    [targetUser] = await db.select().from(user).where(eq(user.id, options.userId));
  }

  if (!targetUser) {
    log('User not found', 'error');
    return;
  }

  log(`User: ${targetUser.name}`, 'info');
  log(`Checking permission: ${options.permission}`, 'info');

  const userRoles = await db
    .select({ roleId: role.id, roleName: role.name, inherits: role.inherits })
    .from(userRole)
    .innerJoin(role, eq(userRole.roleId, role.id))
    .where(eq(userRole.userId, targetUser.id));

  const allRoleIds = new Set<string>();
  const collectRoles = async (roleIds: string[]) => {
    for (const id of roleIds) {
      if (allRoleIds.has(id)) continue;
      allRoleIds.add(id);
      const [r] = await db.select().from(role).where(eq(role.id, id));
      if (r?.inherits?.length) {
        const inheritedRoles = await db
          .select()
          .from(role)
          .where(eq(role.name, r.inherits[0]));
        await collectRoles(inheritedRoles.map((ir) => ir.id));
      }
    }
  };
  await collectRoles(userRoles.map((r) => r.roleId));

  const rules = await db
    .select()
    .from(rolePermission)
    .where(eq(rolePermission.roleId, Array.from(allRoleIds)[0]));

  let hasPermission = false;
  let matchedRule: string | null = null;

  for (const rule of rules) {
    const pattern = rule.permissionCode;
    if (
      pattern === '*' ||
      pattern === options.permission ||
      (pattern.endsWith(':*') && options.permission.startsWith(pattern.slice(0, -1)))
    ) {
      if (rule.inverted) {
        hasPermission = false;
        matchedRule = `cannot: ${pattern}`;
      } else {
        hasPermission = true;
        matchedRule = `can: ${pattern}`;
      }
    }
  }

  if (hasPermission) {
    log(`✅ Has permission (${matchedRule})`, 'success');
  } else {
    log(`❌ No permission`, 'error');
  }
}

// ============================================================
// CLI Definition
// ============================================================
program
  .name('rbac')
  .description('RBAC Permission Management CLI')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize RBAC system (create default permissions and roles)')
  .option('-f, --force', 'Force update existing data')
  .action(init);

program
  .command('assign')
  .description('Assign role to user')
  .option('-e, --email <email>', 'User email')
  .option('-u, --user-id <id>', 'User ID')
  .requiredOption('-r, --role <role>', 'Role name')
  .option('-d, --expires-days <days>', 'Expiration days', parseInt)
  .action(assignRole);

program
  .command('revoke')
  .description('Revoke user role')
  .option('-e, --email <email>', 'User email')
  .option('-u, --user-id <id>', 'User ID')
  .requiredOption('-r, --role <role>', 'Role name')
  .action(revokeRole);

program
  .command('list-roles')
  .description('List all roles')
  .action(listRoles);

program
  .command('list-permissions')
  .description('List all permissions')
  .option('-r, --resource <resource>', 'Filter by resource')
  .action(listPermissions);

program
  .command('list-user-roles')
  .description('View user roles')
  .option('-e, --email <email>', 'User email')
  .option('-u, --user-id <id>', 'User ID')
  .action(listUserRoles);

program
  .command('check')
  .description('Check if user has a permission')
  .option('-e, --email <email>', 'User email')
  .option('-u, --user-id <id>', 'User ID')
  .requiredOption('-p, --permission <code>', 'Permission code (e.g. user:read)')
  .action(checkPermission);

program.addHelpText(
  'afterAll',
  `
${chalk.gray('Examples:')}
  ${chalk.cyan('pnpm rbac init')}                              Initialize system
  ${chalk.cyan('pnpm rbac init --force')}                      Force reset
  ${chalk.cyan('pnpm rbac assign -e admin@example.com -r super_admin')}
  ${chalk.cyan('pnpm rbac assign -e user@example.com -r editor -d 30')}
  ${chalk.cyan('pnpm rbac revoke -e user@example.com -r editor')}
  ${chalk.cyan('pnpm rbac list-roles')}
  ${chalk.cyan('pnpm rbac list-permissions -r user')}
  ${chalk.cyan('pnpm rbac list-user-roles -e admin@example.com')}
  ${chalk.cyan('pnpm rbac check -e admin@example.com -p user:delete')}
`
);

// ============================================================
// Start
// ============================================================
try {
  await showBanner();
  await program.parseAsync(process.argv);

  if (process.argv.length === 2) {
    program.help();
  }
} finally {
  await closeDb();
}
