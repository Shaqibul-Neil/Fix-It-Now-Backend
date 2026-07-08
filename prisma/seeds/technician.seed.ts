import { prisma } from "../../src/lib/prisma";
import {
  TDayOfWeek,
  TRole,
  TUserStatus,
} from "../../generated/prisma/enums";
import type { SeededCategories } from "./category.seed";

export interface SeededTech {
  userId: string;
  profileId: string;
  services: { id: string; price: number }[];
}

export async function seedTechnicians(
  categories: SeededCategories,
  passwordHash: string,
): Promise<SeededTech[]> {
  const { plumbing, electrical, cleaning, painting } = categories;

  const techSeed = [
    {
      firstName: "Karim",
      lastName: "Mia",
      email: "karim.tech@fixitnow.com",
      phone: "01710000001",
      bio: "10 yrs plumbing expert.",
      experienceYears: 10,
      hourlyRate: 500,
      address: "Road 5, Dhanmondi",
      city: "Dhaka",
      area: "Dhanmondi",
      status: TUserStatus.ACTIVE,
      days: [
        TDayOfWeek.SUNDAY,
        TDayOfWeek.MONDAY,
        TDayOfWeek.TUESDAY,
        TDayOfWeek.WEDNESDAY,
        TDayOfWeek.THURSDAY,
      ],
      services: [
        {
          title: "Pipe leak repair",
          price: 800,
          categoryId: plumbing.id,
          estimatedDuration: 60,
        },
        {
          title: "Basin fitting",
          price: 1200,
          categoryId: plumbing.id,
          estimatedDuration: 90,
        },
      ],
    },
    {
      firstName: "Rahim",
      lastName: "Uddin",
      email: "rahim.tech@fixitnow.com",
      phone: "01710000002",
      bio: "Certified electrician.",
      experienceYears: 6,
      hourlyRate: 600,
      address: "Sector 7, Uttara",
      city: "Dhaka",
      area: "Uttara",
      status: TUserStatus.ACTIVE,
      days: [
        TDayOfWeek.SUNDAY,
        TDayOfWeek.MONDAY,
        TDayOfWeek.TUESDAY,
        TDayOfWeek.WEDNESDAY,
        TDayOfWeek.THURSDAY,
        TDayOfWeek.FRIDAY,
      ],
      services: [
        {
          title: "Ceiling fan install",
          price: 700,
          categoryId: electrical.id,
          estimatedDuration: 45,
        },
        {
          title: "Wiring fault fix",
          price: 1500,
          categoryId: electrical.id,
          estimatedDuration: 120,
        },
      ],
    },
    {
      firstName: "Jamal",
      lastName: "Sheikh",
      email: "jamal.tech@fixitnow.com",
      phone: "01710000003",
      bio: "Professional home cleaner.",
      experienceYears: 4,
      hourlyRate: 400,
      address: "Road 11, Banani",
      city: "Dhaka",
      area: "Banani",
      status: TUserStatus.ACTIVE,
      days: [
        TDayOfWeek.SUNDAY,
        TDayOfWeek.MONDAY,
        TDayOfWeek.TUESDAY,
        TDayOfWeek.WEDNESDAY,
        TDayOfWeek.THURSDAY,
        TDayOfWeek.SATURDAY,
      ],
      services: [
        {
          title: "Home deep cleaning",
          price: 2500,
          categoryId: cleaning.id,
          estimatedDuration: 180,
        },
        {
          title: "Sofa cleaning",
          price: 900,
          categoryId: cleaning.id,
          estimatedDuration: 60,
        },
      ],
    },
    {
      firstName: "Sohel",
      lastName: "Rana",
      email: "sohel.tech@fixitnow.com",
      phone: "01710000004",
      bio: "Interior & exterior painter.",
      experienceYears: 8,
      hourlyRate: 550,
      address: "Mirpur 10",
      city: "Dhaka",
      area: "Mirpur",
      status: TUserStatus.ACTIVE,
      days: [
        TDayOfWeek.MONDAY,
        TDayOfWeek.TUESDAY,
        TDayOfWeek.WEDNESDAY,
        TDayOfWeek.THURSDAY,
        TDayOfWeek.SATURDAY,
      ],
      services: [
        {
          title: "Single room painting",
          price: 3500,
          categoryId: painting.id,
          estimatedDuration: 240,
        },
        {
          title: "Full apartment painting",
          price: 12000,
          categoryId: painting.id,
          estimatedDuration: 600,
        },
      ],
    },
    {
      firstName: "Faruk",
      lastName: "Ahmed",
      email: "faruk.tech@fixitnow.com",
      phone: "01710000005",
      bio: "Plumbing & water systems.",
      experienceYears: 5,
      hourlyRate: 480,
      address: "Bashundhara Block C",
      city: "Dhaka",
      area: "Bashundhara",
      status: TUserStatus.ACTIVE,
      days: [
        TDayOfWeek.FRIDAY,
        TDayOfWeek.SATURDAY,
        TDayOfWeek.SUNDAY,
        TDayOfWeek.MONDAY,
        TDayOfWeek.TUESDAY,
      ],
      services: [
        {
          title: "Water tank cleaning",
          price: 1800,
          categoryId: plumbing.id,
          estimatedDuration: 120,
        },
        {
          title: "Tap replacement",
          price: 600,
          categoryId: plumbing.id,
          estimatedDuration: 30,
        },
      ],
    },
    {
      // BANNED technician — services kept but inactive, no availability
      firstName: "Babul",
      lastName: "Hossain",
      email: "babul.tech@fixitnow.com",
      phone: "01710000006",
      bio: "Electrician (account suspended).",
      experienceYears: 3,
      hourlyRate: 450,
      address: "Jatrabari",
      city: "Dhaka",
      area: "Jatrabari",
      status: TUserStatus.BANNED,
      days: [] as TDayOfWeek[],
      services: [
        {
          title: "Old wiring service",
          price: 1000,
          categoryId: electrical.id,
          estimatedDuration: 60,
          isActive: false,
        },
      ],
    },
  ];

  const technicians: SeededTech[] = [];
  for (const t of techSeed) {
    const user = await prisma.user.create({
      data: {
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        passwordHash,
        role: TRole.TECHNICIAN,
        status: t.status,
        technicianProfile: {
          create: {
            phone: t.phone,
            bio: t.bio,
            experienceYears: t.experienceYears,
            hourlyRate: t.hourlyRate,
            address: t.address,
            city: t.city,
            area: t.area,
            isProfileComplete: true,
            isApproved: t.status === TUserStatus.ACTIVE,
          },
        },
      },
      include: { technicianProfile: true },
    });
    const profileId = user.technicianProfile!.id;

    const services: { id: string; price: number }[] = [];
    for (const s of t.services) {
      const created = await prisma.service.create({
        data: {
          technicianId: profileId,
          categoryId: s.categoryId,
          title: s.title,
          price: s.price,
          estimatedDuration: s.estimatedDuration,
          isActive: "isActive" in s ? s.isActive : true,
        },
      });
      services.push({ id: created.id, price: s.price });
    }

    if (t.days.length > 0) {
      await prisma.availabilitySlot.createMany({
        data: t.days.map((d) => ({
          technicianId: profileId,
          dayOfWeek: d,
          startTime: "09:00",
          endTime: "17:00",
        })),
      });
    }

    technicians.push({ userId: user.id, profileId, services });
  }

  return technicians;
}
