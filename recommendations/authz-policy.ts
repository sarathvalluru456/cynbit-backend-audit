type Principal = { userId: string; tenantId: string; roles: string[] };
type Resource = { tenantId: string; ownerId: string };

/** Check function-level permission and object ownership independently. */
export function canReadInquiry(principal: Principal, resource: Resource) {
  const sameTenant = principal.tenantId === resource.tenantId;
  const isOwner = principal.userId === resource.ownerId;
  const isRecruiter = principal.roles.includes("recruiter");

  // Deny by default. A role alone never bypasses tenant isolation.
  return sameTenant && (isOwner || isRecruiter);
}

export function requireRole(principal: Principal, allowed: string[]) {
  if (!allowed.some((role) => principal.roles.includes(role))) {
    throw new Error("FORBIDDEN");
  }
}
