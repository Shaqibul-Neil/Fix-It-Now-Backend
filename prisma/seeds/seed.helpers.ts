// Shared helpers for the seed scripts.
// Everything random here is DETERMINISTIC — the same `npm run seed` run twice
// produces the same rows, so screenshots/tests stay stable.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export { MINUTE, HOUR, DAY };

// mulberry32 — tiny seeded PRNG. Fixed seed = repeatable data.
let rngState = 0x9e3779b9;

export function resetRandom(seed = 0x9e3779b9): void {
  rngState = seed;
}

export function random(): number {
  rngState |= 0;
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// inclusive on both ends
export function randomInt(min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

// tsconfig has noUncheckedIndexedAccess — arr[i] is `T | undefined`, so every
// indexed read goes through here and fails loudly instead of yielding undefined.
export function pick<T>(arr: readonly T[], index: number): T {
  const item = arr[index];
  if (item === undefined) {
    throw new Error(`Seed error: index ${index} out of range (len ${arr.length})`);
  }
  return item;
}

export function pickRandom<T>(arr: readonly T[]): T {
  return pick(arr, randomInt(0, arr.length - 1));
}

// pick `count` distinct items, wrapping if the pool is smaller than count
export function pickMany<T>(arr: readonly T[], count: number, offset = 0): T[] {
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pick(arr, (offset + i) % arr.length));
  }
  return out;
}

// true `percent`% of the time (0-100)
export function chance(percent: number): boolean {
  return random() * 100 < percent;
}

// ---------- dates ----------
const NOW = new Date();

export function daysFromNow(days: number, hour = 10): Date {
  const d = new Date(NOW.getTime() + days * DAY);
  d.setHours(hour, randomInt(0, 3) * 15, 0, 0);
  return d;
}

export function daysAgo(days: number, hour = 10): Date {
  return daysFromNow(-days, hour);
}

// a random moment inside [minDaysAgo, maxDaysAgo] — used to spread the
// 3-month booking history so the dashboard period filters have real data
export function randomPastDate(minDaysAgo: number, maxDaysAgo: number): Date {
  return daysAgo(randomInt(minDaysAgo, maxDaysAgo), randomInt(8, 18));
}

export function randomFutureDate(minDays: number, maxDays: number): Date {
  return daysFromNow(randomInt(minDays, maxDays), randomInt(8, 18));
}

// ---------- misc ----------

// 01712000001 style — TechnicianProfile.phone / CustomerProfile.phone are @unique,
// so the prefix keeps technicians and customers from colliding.
export function makePhone(prefix: string, index: number): string {
  return `${prefix}${String(index).padStart(6, "0")}`;
}

// deterministic placeholder avatar, no network call at seed time
export function makeAvatar(seedText: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seedText)}`;
}

// insert big arrays in chunks so a single statement never gets too large
export async function inBatches<T>(
  rows: T[],
  size: number,
  run: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += size) {
    await run(rows.slice(i, i + size));
  }
}
