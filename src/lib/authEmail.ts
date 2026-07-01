/**
 * Детермінована синтетична email-адреса для Supabase Auth.
 * Одне і те ж ім'я → завжди той самий email (для пошуку в Authentication → Users).
 */
export function nameToEmail(name: string): string {
  const bytes = new TextEncoder().encode(name.trim().toLowerCase());
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `u${hex}@lanp.local`;
}
