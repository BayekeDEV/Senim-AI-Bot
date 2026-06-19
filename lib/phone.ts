/** Returns true if the string looks like a valid KZ phone number. */
export function hasValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  // 87071234567, +77071234567, 77071234567, 7071234567
  if (digits.length === 11 && (digits.startsWith("87") || digits.startsWith("77"))) {
    return true;
  }
  if (digits.length === 10 && digits.startsWith("7")) return true;
  return digits.length >= 10;
}

/** Normalizes phone for storage; returns null if invalid. */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  return hasValidPhone(trimmed) ? trimmed : null;
}
