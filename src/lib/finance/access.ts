export const PERSONAL_FINANCE_OWNER_EMAIL = "dr.ricardoandreo@gmail.com";

export function isPersonalFinanceOwner(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === PERSONAL_FINANCE_OWNER_EMAIL;
}
