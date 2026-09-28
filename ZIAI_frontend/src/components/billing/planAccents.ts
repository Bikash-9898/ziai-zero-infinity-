export const PLAN_ACCENTS = {
  free: "#64748b",
  basic: "#06b6d4",
  pro: "#6366f1",
  enterprise: "#f59e0b",
} as const;

export function getPlanAccent(plan: string): string {
  return PLAN_ACCENTS[plan as keyof typeof PLAN_ACCENTS] ?? PLAN_ACCENTS.free;
}