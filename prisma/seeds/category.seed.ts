import { prisma } from "../../src/lib/prisma";
import { daysAgo } from "./seed.helpers";

export interface SeededCategory {
  id: string;
  name: string;
  slug: string;
}

export interface SeededCategories {
  all: SeededCategory[]; // live only — services are only attached to these
  bySlug: Map<string, SeededCategory>;
  // switched off or removed — the notification seed announces each one, the
  // same way the API does when an admin turns a category off.
  nonLive: SeededCategory[];
  pausedCount: number;
  deletedCount: number;
}

// Every card on the customer home screen shows this picture, so a broken link is
// visible immediately. These are direct Unsplash CDN files (no API key, no
// redirect) and each one was opened and checked against its own trade before
// being written down — a plumbing card never shows a paint roller.
// 1200px wide, not 800: the same file is also the hero on the category page and
// behind a retina card, so 800 was already being upscaled.
const UNSPLASH = (photoId: string): string =>
  `https://images.unsplash.com/${photoId}?w=1200&q=80&auto=format&fit=crop`;

// One row per trade. `Booking.categoryName` is a snapshot string, so the names
// here are what the booking history and the category breakdown chart show.
//
// The last four are deliberately not live. Two are switched off but still
// present (`?status=paused`), two are removed (`?status=deleted`) — which is
// what the admin restore endpoint needs something to act on.
const categorySeed = [
  {
    name: "Plumbing",
    slug: "plumbing",
    description: "Pipe, leak, tap and fitting work",
    image: UNSPLASH("photo-1607472586893-edb57bdc0e39"),
    isActive: true,
    removedDaysAgo: null,
  },
  {
    name: "Electrical",
    slug: "electrical",
    description: "Wiring, fan, light and switchboard work",
    image: UNSPLASH("photo-1621905251189-08b45d6a269e"),
    isActive: true,
    removedDaysAgo: null,
  },
  {
    name: "Cleaning",
    slug: "cleaning",
    description: "Home, sofa and kitchen deep cleaning",
    image: UNSPLASH("photo-1581578731548-c64695cc6952"),
    isActive: true,
    removedDaysAgo: null,
  },
  {
    name: "Painting",
    slug: "painting",
    description: "Interior and exterior painting",
    image: UNSPLASH("photo-1562259949-e8e7689d7828"),
    isActive: true,
    removedDaysAgo: null,
  },
  {
    name: "AC Repair",
    slug: "ac-repair",
    description: "AC servicing, gas refill and installation",
    image: UNSPLASH("photo-1667983453881-4992fe86ab1b"),
    isActive: true,
    removedDaysAgo: null,
  },
  {
    name: "Carpentry",
    slug: "carpentry",
    description: "Furniture repair, door and cabinet work",
    image: UNSPLASH("photo-1544164560-adac3045edb2"),
    isActive: true,
    removedDaysAgo: null,
  },
  {
    name: "Appliance Repair",
    slug: "appliance-repair",
    description: "Fridge, washing machine and oven repair",
    image: UNSPLASH("photo-1585659722983-3a675dabf23d"),
    isActive: true,
    removedDaysAgo: null,
  },

  // ---------- switched off, not removed ----------
  {
    // Paused rather than deleted: the admin can flip it back on from the
    // category list without going through restore.
    name: "Home Shifting",
    slug: "home-shifting",
    description: "House and office moving with packing support",
    image: UNSPLASH("photo-1600725935160-f67ee4f6084a"),
    isActive: false,
    removedDaysAgo: null,
  },
  {
    name: "Pest Control",
    slug: "pest-control",
    description: "Cockroach, termite and mosquito treatment",
    image: UNSPLASH("photo-1593999094742-4f5280054b23"),
    isActive: false,
    removedDaysAgo: null,
  },

  // ---------- removed ----------
  // deleteCategory writes deletedAt and leaves isActive alone, so a removed row
  // keeps the switch position it had. Gardening was live when it was removed and
  // comes back live; CCTV was already switched off for the season and has to come
  // back switched off — that pair is what a restore has to get right.
  {
    name: "Gardening",
    slug: "gardening",
    description: "Balcony and rooftop garden setup and upkeep",
    image: UNSPLASH("photo-1416879595882-3373a0480b5b"),
    isActive: true,
    removedDaysAgo: 40,
  },
  {
    name: "CCTV Installation",
    slug: "cctv-installation",
    description: "Home and shop camera setup with DVR wiring",
    image: UNSPLASH("photo-1557597774-9d273605dfa9"),
    isActive: false,
    removedDaysAgo: 12,
  },
];

export async function seedCategories(): Promise<SeededCategories> {
  const all: SeededCategory[] = [];
  const nonLive: SeededCategory[] = [];
  const bySlug = new Map<string, SeededCategory>();
  let pausedCount = 0;
  let deletedCount = 0;

  for (const c of categorySeed) {
    const created = await prisma.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        isActive: c.isActive,
        deletedAt: c.removedDaysAgo ? daysAgo(c.removedDaysAgo) : null,
      },
    });

    const entry: SeededCategory = {
      id: created.id,
      name: created.name,
      slug: created.slug,
    };
    bySlug.set(entry.slug, entry);

    if (c.removedDaysAgo) {
      deletedCount++;
      nonLive.push(entry);
    } else if (!c.isActive) {
      pausedCount++;
      nonLive.push(entry);
    } else {
      all.push(entry);
    }
  }

  return { all, nonLive, bySlug, pausedCount, deletedCount };
}
