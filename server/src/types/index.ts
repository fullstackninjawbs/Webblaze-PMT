// Shared types for Backend
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
