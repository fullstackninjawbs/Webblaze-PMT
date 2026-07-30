// Shared types for Frontend
export enum Role {
  ADMIN = 'admin',
  PM = 'pm',
  TEAM_LEAD = 'team_lead',
  TEAM_MEMBER = 'team_member',
}

export enum ProjectStatus {
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
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
}

export enum Department {
  SEO = 'seo',
  FULLSTACK = 'fullstack',
  DESIGN = 'design',
  SHOPIFY = 'shopify',
  WORDPRESS = 'wordpress',
  SALES = 'sales',
}

export const DEPARTMENT_OPTIONS = [
  { value: 'seo', label: 'SEO' },
  { value: 'fullstack', label: 'Fullstack' },
  { value: 'design', label: 'Design' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'sales', label: 'Sales' },
];
