import { RuleInheritanceLevel, Jurisdiction } from '../models/common';

export interface RuleDefinition {
  [key: string]: unknown;
}

export interface ResolvedRule {
  code: string;
  jurisdiction: Jurisdiction;
  definition: RuleDefinition;
  resolvedFrom: RuleInheritanceLevel;
  ruleVersionId: string;
}

/**
 * Rule resolution order (lowest wins — most specific overrides least specific):
 * jurisdiction → platform → bureau → tenant → employee
 *
 * This is the core of the 5-level inheritance system.
 * Full implementation is wired in Phase 2.
 */
export async function resolveRule(params: {
  code: string;
  jurisdiction: Jurisdiction;
  bureauId?: string;
  tenantId?: string;
  employeeId?: string;
}): Promise<ResolvedRule | null> {
  // Placeholder — full resolution query implemented in Phase 2
  void params;
  return null;
}
