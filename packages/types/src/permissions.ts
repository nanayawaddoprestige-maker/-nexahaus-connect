/**
 * Permission catalogue and the default role → permission matrix.
 *
 * Permissions are `resource:action` strings. The API's PermissionGuard checks a
 * route's `@RequirePermission(...)` against the caller's flattened permission
 * set. Resource-scope (which client/property) is enforced separately by the
 * ResourceScopeGuard and the repository layer — a permission grants the *kind*
 * of access, not access to a specific record.
 *
 * The seed script writes this matrix into the Role/Permission/RolePermission
 * tables; administrators may then adjust grants at runtime.
 */

import { RoleKey } from "./enums.js";

export const PERMISSIONS = [
  // Platform / admin
  "settings:read",
  "settings:write",
  "role:read",
  "role:write",
  "user:read",
  "user:write",
  "audit:read",
  "analytics:read",

  // Clients & CRM
  "client:read",
  "client:write",
  "client:onboard",
  "lead:read",
  "lead:write",
  "lead:convert",
  "survey:read",
  "survey:write",

  // Properties / units
  "property:read",
  "property:write",
  "property:assign",
  "property:activate",
  "unit:read",
  "unit:write",
  "agreement:read",
  "agreement:write",

  // Tenancy
  "tenant:read",
  "tenant:write",
  "lease:read",
  "lease:write",
  "lease:terminate",

  // Finance
  "rent:read",
  "rent:write",
  "rent:waive",
  "payment:read",
  "payment:record",
  "payment:refund",
  "expense:read",
  "expense:write",
  "expense:approve",
  "transaction:read",
  "transaction:adjust",
  "statement:read",
  "statement:generate",
  "distribution:read",
  "distribution:write",

  // Maintenance
  "maintenance:read",
  "maintenance:write",
  "maintenance:transition",
  "maintenance:verify",
  "workorder:read",
  "workorder:write",
  "vendor:read",
  "vendor:write",
  "preventive:read",
  "preventive:write",

  // Inspections
  "inspection:read",
  "inspection:write",
  "inspection:submit",
  "inspection:review",
  "inspection:template:write",

  // Documents
  "document:read",
  "document:write",
  "document:delete",

  // Collaboration
  "approval:read",
  "approval:decide",
  "message:read",
  "message:write",
  "notification:read",

  // Intelligence
  "health:read",
  "health:config",
  "health:recompute",
  "rescue:read",
  "rescue:write",
  "report:read",

  // Owner self-service (own portfolio only; scope enforced separately)
  "owner:portfolio:read",
  "owner:approval:decide",
  "owner:document:read",
  "owner:statement:read",
  "owner:message:write",

  // Tenant self-service (own tenancy only)
  "tenant:self:read",
  "tenant:self:maintenance:write",
  "tenant:self:payment:read",
  "tenant:self:message:write",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

const STAFF_BASE: Permission[] = [
  "client:read",
  "property:read",
  "unit:read",
  "agreement:read",
  "tenant:read",
  "lease:read",
  "rent:read",
  "payment:read",
  "expense:read",
  "maintenance:read",
  "workorder:read",
  "vendor:read",
  "inspection:read",
  "document:read",
  "approval:read",
  "message:read",
  "message:write",
  "notification:read",
  "health:read",
  "rescue:read",
  "report:read",
];

export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  [RoleKey.SUPER_ADMIN]: ALL,

  [RoleKey.MANAGING_DIRECTOR]: [
    ...STAFF_BASE,
    "analytics:read",
    "audit:read",
    "settings:read",
    "lead:read",
    "survey:read",
    "statement:read",
    "distribution:read",
    "transaction:read",
    "expense:approve",
    "approval:decide",
    "health:config",
  ],

  [RoleKey.PROPERTY_MANAGER]: [
    ...STAFF_BASE,
    "client:write",
    "client:onboard",
    "property:write",
    "property:assign",
    "property:activate",
    "unit:write",
    "agreement:read",
    "tenant:write",
    "lease:write",
    "lease:terminate",
    "rent:read",
    "maintenance:write",
    "maintenance:transition",
    "maintenance:verify",
    "workorder:write",
    "preventive:read",
    "preventive:write",
    "inspection:write",
    "inspection:review",
    "document:write",
    "approval:read",
    "health:recompute",
    "rescue:write",
    "lead:read",
  ],

  [RoleKey.FINANCE_OFFICER]: [
    ...STAFF_BASE,
    "rent:write",
    "rent:waive",
    "payment:record",
    "payment:refund",
    "expense:write",
    "expense:approve",
    "transaction:read",
    "transaction:adjust",
    "statement:read",
    "statement:generate",
    "distribution:read",
    "distribution:write",
    "document:write",
  ],

  [RoleKey.MAINTENANCE_OFFICER]: [
    ...STAFF_BASE,
    "maintenance:write",
    "maintenance:transition",
    "workorder:write",
    "vendor:write",
    "preventive:read",
    "preventive:write",
    "expense:write",
    "document:write",
  ],

  [RoleKey.INSPECTOR]: [
    "property:read",
    "unit:read",
    "inspection:read",
    "inspection:write",
    "inspection:submit",
    "document:read",
    "document:write",
    "notification:read",
    "message:read",
    "message:write",
  ],

  [RoleKey.LEASING_OFFICER]: [
    ...STAFF_BASE,
    "tenant:write",
    "lease:write",
    "unit:write",
  ],

  [RoleKey.SUPPORT_STAFF]: [
    "client:read",
    "property:read",
    "tenant:read",
    "maintenance:read",
    "message:read",
    "message:write",
    "notification:read",
    "document:read",
  ],

  [RoleKey.VENDOR]: [
    "workorder:read",
    "maintenance:read",
    "document:read",
    "document:write",
    "notification:read",
    "message:read",
    "message:write",
  ],

  [RoleKey.OWNER]: [
    "owner:portfolio:read",
    "owner:approval:decide",
    "owner:document:read",
    "owner:statement:read",
    "owner:message:write",
    "property:read",
    "unit:read",
    "tenant:read",
    "lease:read",
    "rent:read",
    "payment:read",
    "expense:read",
    "maintenance:read",
    "inspection:read",
    "document:read",
    "approval:read",
    "approval:decide",
    "health:read",
    "rescue:read",
    "report:read",
    "message:read",
    "notification:read",
  ],

  [RoleKey.TENANT]: [
    "tenant:self:read",
    "tenant:self:maintenance:write",
    "tenant:self:payment:read",
    "tenant:self:message:write",
    "maintenance:read",
    "lease:read",
    "document:read",
    "message:read",
    "notification:read",
  ],
};
