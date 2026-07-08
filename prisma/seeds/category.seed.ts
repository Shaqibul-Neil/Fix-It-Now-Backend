import { prisma } from "../../src/lib/prisma";

export interface SeededCategories {
  plumbing: { id: string };
  electrical: { id: string };
  cleaning: { id: string };
  painting: { id: string };
}

export async function seedCategories(): Promise<SeededCategories> {
  const plumbing = await prisma.category.create({
    data: {
      name: "Plumbing",
      slug: "plumbing",
      description: "Pipe, leak, fitting work",
    },
  });
  const electrical = await prisma.category.create({
    data: {
      name: "Electrical",
      slug: "electrical",
      description: "Wiring, fan, light work",
    },
  });
  const cleaning = await prisma.category.create({
    data: {
      name: "Cleaning",
      slug: "cleaning",
      description: "Home deep cleaning",
    },
  });
  const painting = await prisma.category.create({
    data: {
      name: "Painting",
      slug: "painting",
      description: "Interior & exterior painting",
    },
  });

  return { plumbing, electrical, cleaning, painting };
}
