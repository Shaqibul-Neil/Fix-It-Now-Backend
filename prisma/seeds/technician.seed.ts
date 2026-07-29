import { prisma } from "../../src/lib/prisma";
import {
  TDayOfWeek,
  TRole,
  TTechnicianApprovalStatus,
  TUserStatus,
} from "../../generated/prisma/enums";
import type { SeededCategories } from "./category.seed";
import { LOCATIONS, STREETS } from "./locations";
import { SERVICE_CATALOG } from "./service.catalog";
import {
  chance,
  daysAgo,
  makeAvatar,
  makePhone,
  pick,
  pickMany,
  randomInt,
} from "./seed.helpers";

export interface SeededService {
  id: string;
  price: number;
  categoryName: string;
}

export interface SeededTech {
  userId: string;
  profileId: string;
  fullName: string;
  city: string;
  area: string;
  approvalStatus: TTechnicianApprovalStatus;
  userStatus: TUserStatus;
  services: SeededService[];
}

// ---------- how many of each bucket ----------
const APPROVED_COUNT = 20; // publicly listed, own services and bookings
const PENDING_COUNT = 20; // waiting in the admin review queue
const REJECTED_COUNT = 3; // admin said no — one of them still has old services
const BANNED_COUNT = 1; // approved technician whose account was later banned

const TECH_NAMES: [string, string][] = [
  // --- 20 APPROVED ---
  ["Karim", "Mia"], ["Rahim", "Uddin"], ["Jamal", "Sheikh"], ["Sohel", "Rana"],
  ["Faruk", "Ahmed"], ["Nazmul", "Haque"], ["Delwar", "Hossain"], ["Anwar", "Ali"],
  ["Rubel", "Miah"], ["Shahin", "Alam"], ["Kamrul", "Islam"], ["Bappy", "Sarker"],
  ["Milon", "Chowdhury"], ["Sattar", "Molla"], ["Jewel", "Rana"], ["Liton", "Das"],
  ["Rony", "Barua"], ["Masud", "Karim"], ["Sumon", "Talukder"], ["Hanif", "Bepari"],
  // --- 20 PENDING ---
  ["Alamgir", "Kabir"], ["Tuhin", "Mahmud"], ["Rasel", "Sikder"], ["Palash", "Roy"],
  ["Nayan", "Howlader"], ["Sabuj", "Gazi"], ["Ripon", "Mridha"], ["Selim", "Reza"],
  ["Arif", "Sarkar"], ["Manik", "Pramanik"], ["Belal", "Munshi"], ["Robin", "Biswas"],
  ["Shipon", "Akand"], ["Torikul", "Bhuiyan"], ["Zahirul", "Patwary"], ["Mamun", "Dewan"],
  ["Firoz", "Khandaker"], ["Saiful", "Majumder"], ["Rakibul", "Sardar"], ["Nurul", "Fakir"],
  // --- 3 REJECTED ---
  ["Bashir", "Chowkidar"], ["Jasim", "Halder"], ["Iqbal", "Mistry"],
  // --- 1 BANNED (was approved) ---
  ["Babul", "Hossain"],
];

// Kept so the README / Postman logins that already exist keep working.
const LEGACY_EMAILS = [
  "karim.tech@fixitnow.com",
  "rahim.tech@fixitnow.com",
  "jamal.tech@fixitnow.com",
  "sohel.tech@fixitnow.com",
  "faruk.tech@fixitnow.com",
];

const REJECTION_REASONS = [
  "Bio is too short and the experience claim could not be verified.",
  "Uploaded phone number does not match the NID on record.",
  "Service area is outside our current coverage. Reapply once we expand.",
];

const ALL_DAYS: TDayOfWeek[] = [
  TDayOfWeek.SATURDAY,
  TDayOfWeek.SUNDAY,
  TDayOfWeek.MONDAY,
  TDayOfWeek.TUESDAY,
  TDayOfWeek.WEDNESDAY,
  TDayOfWeek.THURSDAY,
  TDayOfWeek.FRIDAY,
];

const SHIFTS: { start: string; end: string }[] = [
  { start: "08:00", end: "16:00" },
  { start: "09:00", end: "17:00" },
  { start: "10:00", end: "18:00" },
  { start: "14:00", end: "22:00" },
];

const BIO_TEMPLATES = [
  (y: number, trade: string) => `${y} years of hands-on ${trade} work across Dhaka. Same-day service available.`,
  (y: number, trade: string) => `Certified ${trade} technician with ${y} years on residential and small commercial jobs.`,
  (y: number, trade: string) => `${trade} specialist. ${y} years in the field, 500+ jobs completed, warranty on every repair.`,
  (y: number, trade: string) => `Independent ${trade} professional. ${y} years experience, transparent pricing, no hidden charges.`,
];

// Which bucket does technician `i` belong to?
function bucketFor(index: number): {
  approvalStatus: TTechnicianApprovalStatus;
  userStatus: TUserStatus;
} {
  if (index < APPROVED_COUNT) {
    return {
      approvalStatus: TTechnicianApprovalStatus.APPROVED,
      userStatus: TUserStatus.ACTIVE,
    };
  }
  if (index < APPROVED_COUNT + PENDING_COUNT) {
    return {
      approvalStatus: TTechnicianApprovalStatus.PENDING,
      userStatus: TUserStatus.ACTIVE,
    };
  }
  if (index < APPROVED_COUNT + PENDING_COUNT + REJECTED_COUNT) {
    return {
      approvalStatus: TTechnicianApprovalStatus.REJECTED,
      userStatus: TUserStatus.ACTIVE,
    };
  }
  // A ban is an account action, not a review decision — the approval stays
  // APPROVED so the two concerns never get confused in the admin UI.
  return {
    approvalStatus: TTechnicianApprovalStatus.APPROVED,
    userStatus: TUserStatus.BANNED,
  };
}

// How many services this technician publishes.
function serviceCountFor(
  index: number,
  approvalStatus: TTechnicianApprovalStatus,
  userStatus: TUserStatus,
): number {
  if (userStatus === TUserStatus.BANNED) return 1; // leftovers from before the ban
  if (approvalStatus === TTechnicianApprovalStatus.APPROVED) {
    return index < 10 ? 3 : 2; // 10*3 + 10*2 = 50 published services
  }
  // The first rejected technician was approved once and published two services
  // before being rejected — this is what proves the public filters hide them.
  if (approvalStatus === TTechnicianApprovalStatus.REJECTED) {
    return index === APPROVED_COUNT + PENDING_COUNT ? 2 : 0;
  }
  return 0; // PENDING cannot publish — the API blocks it, so the seed matches
}

export async function seedTechnicians(
  categories: SeededCategories,
  passwordHash: string,
  reviewerAdminId: string,
): Promise<SeededTech[]> {
  const technicians: SeededTech[] = [];
  const totalCount =
    APPROVED_COUNT + PENDING_COUNT + REJECTED_COUNT + BANNED_COUNT;

  if (TECH_NAMES.length !== totalCount) {
    throw new Error(
      `Seed error: TECH_NAMES has ${TECH_NAMES.length} names but ${totalCount} technicians are configured`,
    );
  }

  for (let i = 0; i < totalCount; i++) {
    const [firstName, lastName] = pick(TECH_NAMES, i);
    const fullName = `${firstName} ${lastName}`;
    const location = pick(LOCATIONS, i % LOCATIONS.length);
    const category = pick(categories.all, i % categories.all.length);
    const { approvalStatus, userStatus } = bucketFor(i);

    const experienceYears = randomInt(2, 15);
    const bioTemplate = pick(BIO_TEMPLATES, i % BIO_TEMPLATES.length);

    // Applied first, reviewed later — reviewedAt is always after createdAt.
    const appliedDaysAgo = randomInt(20, 170);
    const createdAt = daysAgo(appliedDaysAgo);
    const isReviewed = approvalStatus !== TTechnicianApprovalStatus.PENDING;
    const reviewedAt = isReviewed
      ? daysAgo(Math.max(1, appliedDaysAgo - randomInt(1, 10)))
      : null;

    const isRejected = approvalStatus === TTechnicianApprovalStatus.REJECTED;

    const email =
      LEGACY_EMAILS[i] ?? `${firstName.toLowerCase()}${i}.tech@fixitnow.com`;

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: TRole.TECHNICIAN,
        status: userStatus,
        createdAt,
        lastLoginAt:
          userStatus === TUserStatus.ACTIVE ? daysAgo(randomInt(0, 14)) : null,
        technicianProfile: {
          create: {
            phone: makePhone("0171", i + 1),
            avatar: chance(70) ? makeAvatar(fullName) : null,
            bio: bioTemplate(experienceYears, category.name.toLowerCase()),
            experienceYears,
            hourlyRate: randomInt(8, 16) * 50, // 400 – 800
            address: `${pick(STREETS, i % STREETS.length)}, ${location.area}`,
            city: location.city,
            area: location.area,
            serviceRadius: randomInt(3, 20),
            isProfileComplete: true,
            // A technician can mark themselves unavailable without losing approval.
            isAvailable:
              approvalStatus === TTechnicianApprovalStatus.APPROVED
                ? chance(85)
                : false,
            approvalStatus,
            rejectionReason: isRejected
              ? pick(REJECTION_REASONS, i % REJECTION_REASONS.length)
              : null,
            reviewedAt,
            reviewedBy: isReviewed ? reviewerAdminId : null,
            createdAt,
          },
        },
      },
      include: { technicianProfile: true },
    });

    const profile = user.technicianProfile;
    if (!profile) {
      throw new Error(`Seed error: technician profile missing for ${email}`);
    }

    // ---------- services ----------
    const catalog = SERVICE_CATALOG[category.slug];
    if (!catalog) {
      throw new Error(`Seed error: no service catalog for "${category.slug}"`);
    }

    const wanted = serviceCountFor(i, approvalStatus, userStatus);
    const chosen = pickMany(catalog, wanted, i); // offset keeps titles varied per tech
    const services: SeededService[] = [];

    for (const [serviceIndex, item] of chosen.entries()) {
      const created = await prisma.service.create({
        data: {
          technicianId: profile.id,
          categoryId: category.id,
          title: item.title,
          description: item.description,
          price: item.price,
          estimatedDuration: item.estimatedDuration,
          // Turning a service off is the technician's own choice and has nothing
          // to do with approval or bans. So a rejected/banned technician's rows
          // deliberately stay ACTIVE here — only the public query filters may
          // hide them, which is exactly what needs proving. Technician #9 keeps
          // one genuinely switched-off service so the isActive filter is testable.
          isActive: !(i === 9 && serviceIndex === 2),
          createdAt: daysAgo(Math.max(1, appliedDaysAgo - randomInt(1, 15))),
        },
      });
      services.push({
        id: created.id,
        price: item.price,
        categoryName: category.name,
      });
    }

    // ---------- availability ----------
    // Only technicians who can actually be booked publish a weekly schedule.
    if (approvalStatus === TTechnicianApprovalStatus.APPROVED && userStatus === TUserStatus.ACTIVE) {
      const shift = pick(SHIFTS, i % SHIFTS.length);
      const workingDays = pickMany(ALL_DAYS, randomInt(4, 6), i % ALL_DAYS.length);

      await prisma.availabilitySlot.createMany({
        data: workingDays.map((day, dayIndex) => ({
          technicianId: profile.id,
          dayOfWeek: day,
          startTime: shift.start,
          endTime: shift.end,
          // one technician in five has a single day switched off
          isActive: !(i % 5 === 0 && dayIndex === 0),
        })),
        skipDuplicates: true,
      });
    }

    technicians.push({
      userId: user.id,
      profileId: profile.id,
      fullName,
      city: location.city,
      area: location.area,
      approvalStatus,
      userStatus,
      services,
    });
  }

  return technicians;
}

// Only these can receive bookings — approved, active, and actually selling something.
export function bookableTechnicians(technicians: SeededTech[]): SeededTech[] {
  return technicians.filter(
    (t) =>
      t.approvalStatus === TTechnicianApprovalStatus.APPROVED &&
      t.userStatus === TUserStatus.ACTIVE &&
      t.services.length > 0,
  );
}
