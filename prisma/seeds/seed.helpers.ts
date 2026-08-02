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

// Real-photo avatars, same Unsplash CDN the category and cover images come from,
// so the whole seed pulls from one host instead of three. They are plain static
// JPEGs — no API key, no rate limit — and the same index always returns the same
// face, so a re-seed does not shuffle everybody's picture.
//
// 400x400 with `crop=faces`: the CDN centres the crop on the face, so a square
// avatar is never a picture of somebody's shoulder, and 400px still looks sharp
// on a retina profile header.
const UNSPLASH_PORTRAIT = (photoId: string): string =>
  `https://images.unsplash.com/${photoId}?w=400&h=400&q=80&auto=format&fit=crop&crop=faces`;

export type AvatarGender = "men" | "women";

// Every id below was opened and looked at before it was written down. Anything
// that was not a usable head-and-shoulders shot — a landscape, a costume, a
// hooded figure with no face — was thrown out, and the two pools are kept apart
// so a woman's row is never handed a man's face.
const PORTRAITS: Record<AvatarGender, readonly string[]> = {
  men: [
    UNSPLASH_PORTRAIT("photo-1500648767791-00dcc994a43e"),
    UNSPLASH_PORTRAIT("photo-1507003211169-0a1dd7228f2d"),
    UNSPLASH_PORTRAIT("photo-1472099645785-5658abf4ff4e"),
    UNSPLASH_PORTRAIT("photo-1519085360753-af0119f7cbe7"),
    UNSPLASH_PORTRAIT("photo-1568602471122-7832951cc4c5"),
    UNSPLASH_PORTRAIT("photo-1506794778202-cad84cf45f1d"),
    UNSPLASH_PORTRAIT("photo-1531427186611-ecfd6d936c79"),
    UNSPLASH_PORTRAIT("photo-1492562080023-ab3db95bfbce"),
    UNSPLASH_PORTRAIT("photo-1463453091185-61582044d556"),
    UNSPLASH_PORTRAIT("photo-1544723795-3fb6469f5b39"),
    UNSPLASH_PORTRAIT("photo-1560250097-0b93528c311a"),
    UNSPLASH_PORTRAIT("photo-1552058544-f2b08422138a"),
    UNSPLASH_PORTRAIT("photo-1600486913747-55e5470d6f40"),
    UNSPLASH_PORTRAIT("photo-1584999734482-0361aecad844"),
    UNSPLASH_PORTRAIT("photo-1522075469751-3a6694fb2f61"),
    UNSPLASH_PORTRAIT("photo-1557862921-37829c790f19"),
    UNSPLASH_PORTRAIT("photo-1615109398623-88346a601842"),
    UNSPLASH_PORTRAIT("photo-1566492031773-4f4e44671857"),
    UNSPLASH_PORTRAIT("photo-1595152772835-219674b2a8a6"),
    UNSPLASH_PORTRAIT("photo-1570295999919-56ceb5ecca61"),
    UNSPLASH_PORTRAIT("photo-1599566150163-29194dcaad36"),
    UNSPLASH_PORTRAIT("photo-1607346256330-dee7af15f7c5"),
    UNSPLASH_PORTRAIT("photo-1633332755192-727a05c4013d"),
    UNSPLASH_PORTRAIT("photo-1618077360395-f3068be8e001"),
    UNSPLASH_PORTRAIT("photo-1545996124-0501ebae84d0"),
    UNSPLASH_PORTRAIT("photo-1564564321837-a57b7070ac4f"),
    UNSPLASH_PORTRAIT("photo-1519345182560-3f2917c472ef"),
    UNSPLASH_PORTRAIT("photo-1583864697784-a0efc8379f70"),
    UNSPLASH_PORTRAIT("photo-1611695434398-4f4b330623e6"),
    UNSPLASH_PORTRAIT("photo-1610088441520-4352457e7095"),
    UNSPLASH_PORTRAIT("photo-1590086782957-93c06ef21604"),
    UNSPLASH_PORTRAIT("photo-1628157588553-5eeea00af15c"),
    UNSPLASH_PORTRAIT("photo-1587397845856-e6cf49176c70"),
    UNSPLASH_PORTRAIT("photo-1636041293178-808a6762ab39"),
    UNSPLASH_PORTRAIT("photo-1639149888905-fb39731f2e6c"),
  ],
  women: [
    UNSPLASH_PORTRAIT("photo-1494790108377-be9c29b29330"),
    UNSPLASH_PORTRAIT("photo-1438761681033-6461ffad8d80"),
    UNSPLASH_PORTRAIT("photo-1544005313-94ddf0286df2"),
    UNSPLASH_PORTRAIT("photo-1524504388940-b1c1722653e1"),
    UNSPLASH_PORTRAIT("photo-1517841905240-472988babdf9"),
    UNSPLASH_PORTRAIT("photo-1508214751196-bcfd4ca60f91"),
    UNSPLASH_PORTRAIT("photo-1489424731084-a5d8b219a5bb"),
    UNSPLASH_PORTRAIT("photo-1573496359142-b8d87734a5a2"),
    UNSPLASH_PORTRAIT("photo-1580489944761-15a19d654956"),
    UNSPLASH_PORTRAIT("photo-1531123897727-8f129e1688ce"),
    UNSPLASH_PORTRAIT("photo-1554151228-14d9def656e4"),
    UNSPLASH_PORTRAIT("photo-1487412720507-e7ab37603c6f"),
    UNSPLASH_PORTRAIT("photo-1592621385612-4d7129426394"),
    UNSPLASH_PORTRAIT("photo-1593104547489-5cfb3839a3b5"),
    UNSPLASH_PORTRAIT("photo-1611432579699-484f7990b127"),
    UNSPLASH_PORTRAIT("photo-1607746882042-944635dfe10e"),
    UNSPLASH_PORTRAIT("photo-1619895862022-09114b41f16f"),
    UNSPLASH_PORTRAIT("photo-1621784563330-caee0b138a00"),
    UNSPLASH_PORTRAIT("photo-1601288496920-b6154fe3626a"),
    UNSPLASH_PORTRAIT("photo-1502685104226-ee32379fefbe"),
    UNSPLASH_PORTRAIT("photo-1546539782-6fc531453083"),
    UNSPLASH_PORTRAIT("photo-1541101767792-f9b2b1c4f127"),
    UNSPLASH_PORTRAIT("photo-1516756587022-7891ad56a8cd"),
    UNSPLASH_PORTRAIT("photo-1618835962148-cf177563c6c0"),
    UNSPLASH_PORTRAIT("photo-1601412436009-d964bd02edbc"),
  ],
};

// The pools are shorter than the row count, so a face comes back around every
// 35th technician. Wrapping is the point: it keeps the list page looking like a
// page of people instead of the same four faces on repeat.
export function makeAvatar(gender: AvatarGender, index: number): string {
  const pool = PORTRAITS[gender];
  return pick(pool, index % pool.length);
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
