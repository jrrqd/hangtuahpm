const BASE = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function midChar(a: string, b: string): string {
  const ai = BASE.indexOf(a);
  const bi = BASE.indexOf(b);
  return BASE[Math.floor((ai + bi) / 2)];
}

/** Generate a position string between `before` and `after` (exclusive). */
export function generateKeyBetween(
  before: string | null | undefined,
  after: string | null | undefined
): string {
  if (!before && !after) return "a0";
  if (!before) {
    const a = after!;
    if (a <= "a0") return "Z" + a;
    return a.slice(0, -1) + BASE[Math.max(0, BASE.indexOf(a.slice(-1)) - 1)];
  }
  if (!after) {
    const b = before;
    const last = b.slice(-1);
    const idx = BASE.indexOf(last);
    if (idx < BASE.length - 1) return b.slice(0, -1) + BASE[idx + 1];
    return b + "0";
  }
  if (before >= after) {
    return before + "0";
  }
  // Find midpoint lexicographically
  let i = 0;
  while (i < before.length && i < after.length && before[i] === after[i]) i++;
  const prefix = before.slice(0, i);
  const bChar = before[i] ?? "0";
  const aChar = after[i] ?? "z";
  const bi = BASE.indexOf(bChar);
  const ai = BASE.indexOf(aChar);
  if (ai - bi > 1) {
    return prefix + midChar(bChar, aChar);
  }
  return before + "V";
}

export function sortByPosition<T extends { position: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.position < b.position ? -1 : a.position > b.position ? 1 : 0
  );
}
