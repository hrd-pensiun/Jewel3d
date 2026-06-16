export const USER_NAME_KEY = "ubs_user_name";

export function normalizeUserName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function isValidUserName(name: string): boolean {
  const normalized = normalizeUserName(name);
  return normalized.length >= 2 && normalized.length <= 50;
}
