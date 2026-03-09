/**
 * Shared TypeScript types used across all models.
 */

export type Jurisdiction = 'AU' | 'NZ';

export type PayRunStatus = 'draft' | 'calculating' | 'review' | 'approved' | 'finalised';

export type RuleCategory =
  | 'tax'
  | 'leave'
  | 'superannuation'
  | 'kiwisaver'
  | 'termination'
  | 'allowance';

export type RuleInheritanceLevel = 'jurisdiction' | 'platform' | 'bureau' | 'tenant' | 'employee';

export type LeaveAccrualMethod = 'per_hour' | 'per_pay_period' | 'anniversary';

export type LeavePayMethod = 'ordinary_pay' | 'average_weekly_earnings' | 'flat_rate';

export type PayType = 'salary' | 'hourly';

export type PayFrequency = 'weekly' | 'fortnightly' | 'semi_monthly' | 'monthly';

export type LineItemType = 'earnings' | 'deduction' | 'tax' | 'employer_contribution' | 'leave';

export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'finalise' | 'void';

/** Base fields present on every database record. */
export interface BaseRecord {
  id: string;
  created_at: Date;
  updated_at: Date;
}

/** Base fields present on every tenant-scoped record. */
export interface TenantScopedRecord extends BaseRecord {
  tenant_id: string;
}
