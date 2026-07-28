import { Role } from '../types';

export const PERMISSIONS = {
  'clients:manage':        [Role.ADMIN, Role.PM],
  'projects:manage':       [Role.ADMIN, Role.PM],
  'projects:view':         [Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TEAM_MEMBER],
  'milestones:manage':     [Role.ADMIN, Role.PM],
  'tasks:manage':          [Role.ADMIN, Role.PM, Role.TEAM_LEAD],
  'tasks:view':            [Role.ADMIN, Role.PM, Role.TEAM_LEAD, Role.TEAM_MEMBER],
  'invoices:manage':       [Role.ADMIN, Role.PM],
  'financials:view':       [Role.ADMIN, Role.PM],
  'users:manage':          [Role.ADMIN],
  'reports:view':          [Role.ADMIN, Role.PM],
};
