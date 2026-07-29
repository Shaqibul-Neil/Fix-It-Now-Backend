import { prisma } from "../../src/lib/prisma";

export interface SeededCategory {
  id: string;
  name: string;
  slug: string;
}

export interface SeededCategories {
  all: SeededCategory[]; // active only — services are only attached to these
  bySlug: Map<string, SeededCategory>;
}

// One row per trade. `Booking.categoryName` is a snapshot string, so the names
// here are what the booking history and the category breakdown chart show.
const categorySeed = [
  {
    name: "Plumbing",
    slug: "plumbing",
    description: "Pipe, leak, tap and fitting work",
    isActive: true,
  },
  {
    name: "Electrical",
    slug: "electrical",
    description: "Wiring, fan, light and switchboard work",
    isActive: true,
  },
  {
    name: "Cleaning",
    slug: "cleaning",
    description: "Home, sofa and kitchen deep cleaning",
    isActive: true,
  },
  {
    name: "Painting",
    slug: "painting",
    description: "Interior and exterior painting",
    isActive: true,
  },
  {
    name: "AC Repair",
    slug: "ac-repair",
    description: "AC servicing, gas refill and installation",
    isActive: true,
  },
  {
    name: "Carpentry",
    slug: "carpentry",
    description: "Furniture repair, door and cabinet work",
    isActive: true,
  },
  {
    name: "Appliance Repair",
    slug: "appliance-repair",
    description: "Fridge, washing machine and oven repair",
    isActive: true,
  },
  {
    // Retired category — kept so GET /categories?isActive=false has a row and
    // the admin toggle is testable. No service points at it.
    name: "Home Shifting",
    slug: "home-shifting",
    description: "Discontinued moving service",
    isActive: false,
  },
];

export async function seedCategories(): Promise<SeededCategories> {
  const all: SeededCategory[] = [];
  const bySlug = new Map<string, SeededCategory>();

  for (const c of categorySeed) {
    const created = await prisma.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        isActive: c.isActive,
      },
    });

    const entry: SeededCategory = {
      id: created.id,
      name: created.name,
      slug: created.slug,
    };
    bySlug.set(entry.slug, entry);

    if (c.isActive) {
      all.push(entry);
    }
  }

  return { all, bySlug };
}
