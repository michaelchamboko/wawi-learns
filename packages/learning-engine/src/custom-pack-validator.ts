/**
 * Custom pack validator (SLC-008-T004).
 * Lightweight, deterministic. Rejects empty themes, banned tokens,
 * and items that contain request-for-personal-information or links.
 */
export interface CustomPackValidationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

const FORBIDDEN_THEME_TOKENS = ["@", "http://", "https://", "www.", ".com", ".co.", "porn", "violence", "kill"];
const FORBIDDEN_ITEM_TOKENS = ["my name is", "i live at", "my phone", "my address", "follow me", "http://", "https://"];
const MAX_ITEMS = 30;
const MAX_ITEM_LENGTH = 80;

export const validateCustomPackDraft = (params: {
  theme: string;
  items: readonly string[];
}): CustomPackValidationResult => {
  const errors: string[] = [];
  const theme = params.theme.trim();
  if (theme.length < 3) errors.push("theme-too-short");
  if (theme.length > 80) errors.push("theme-too-long");
  for (const token of FORBIDDEN_THEME_TOKENS) {
    if (theme.toLowerCase().includes(token)) {
      errors.push(`theme-forbidden:${token}`);
      break;
    }
  }
  if (params.items.length === 0) errors.push("items-empty");
  if (params.items.length > MAX_ITEMS) errors.push(`items-too-many:${params.items.length}`);
  params.items.forEach((raw, index) => {
    const item = raw.trim();
    if (item.length === 0) errors.push(`item-${index + 1}-empty`);
    if (item.length > MAX_ITEM_LENGTH) errors.push(`item-${index + 1}-too-long`);
    const lower = item.toLowerCase();
    for (const token of FORBIDDEN_ITEM_TOKENS) {
      if (lower.includes(token)) {
        errors.push(`item-${index + 1}-forbidden:${token}`);
        break;
      }
    }
  });
  return { ok: errors.length === 0, errors };
};
