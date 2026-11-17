// Shared types for Frontend
export enum Role {
  ADMIN = 'admin',
  PM = 'pm',
  TEAM_LEAD = 'team_lead',
  TEAM_MEMBER = 'team_member',
  SALES_MANAGER = 'sales_manager',
  SALES_EXEC = 'sales_exec',
}

export enum ProjectStatus {
  NEW = 'new',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  MAINTENANCE = 'maintenance',
  COMPLETED = 'completed',
}

export enum MilestoneStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export enum TaskStatus {
  UNASSIGNED = 'unassigned',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export enum Department {
  SEO = 'seo',
  FULLSTACK = 'fullstack',
  DESIGN = 'design',
  SHOPIFY = 'shopify',
  WORDPRESS = 'wordpress',
  SALES = 'sales',
}

/**
 * Platform a project is built on. Stored in the project's `type` field, which used to
 * hold a department; older values stay selectable through platformOptions().
 */
export const PLATFORM_OPTIONS = [
  { value: 'Shopify', label: 'Shopify' },
  { value: 'WordPress', label: 'WordPress' },
  { value: 'WooCommerce', label: 'WooCommerce' },
  { value: 'Webflow', label: 'Webflow' },
  { value: 'Wix', label: 'Wix' },
  { value: 'Squarespace', label: 'Squarespace' },
  { value: 'Magento', label: 'Magento' },
  { value: 'Custom / Full Stack', label: 'Custom / Full Stack' },
  { value: 'Mobile App', label: 'Mobile App' },
  { value: 'Other', label: 'Other' },
];

/** Platform options plus the current value if it is an older one not in the list. */
export const platformOptions = (current?: string | null) =>
  current && !PLATFORM_OPTIONS.some((o) => o.value === current)
    ? [...PLATFORM_OPTIONS, { value: current, label: current }]
    : PLATFORM_OPTIONS;

export const DEPARTMENT_OPTIONS = [
  { value: 'seo', label: 'SEO' },
  { value: 'fullstack', label: 'Fullstack' },
  { value: 'design', label: 'Design' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'sales', label: 'Sales' },
];

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  meta: PaginationMeta;
}
