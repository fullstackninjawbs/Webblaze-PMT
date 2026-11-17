import { Role } from '../types';

type MaybeUser = { role?: Role | string } | null | undefined;

const hasRole = (user: MaybeUser, roles: Role[]) => !!user?.role && roles.includes(user.role as Role);

/**
 * Mirrors server/src/config/permissions.ts. The server is the source of truth; these only
 * decide what to show and which requests to make, so users don't hit 403 errors.
 */

/** Projects, milestones, tasks, releases and time logs. Sales roles have no access. */
export const canViewDelivery = (user: MaybeUser) =>
  hasRole(user, [Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TEAM_MEMBER]);

/** Client contact records. */
export const canViewClients = (user: MaybeUser) => hasRole(user, [Role.ADMIN, Role.PM]);

/** Budgets, payments and invoices. */
export const canViewFinancials = (user: MaybeUser) => hasRole(user, [Role.ADMIN, Role.PM]);
