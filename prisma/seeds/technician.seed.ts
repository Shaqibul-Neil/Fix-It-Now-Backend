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
  title: string;
  price: number;
  categoryName: string;
  // null while the row is still there — "owner" and "admin" say who pressed
  // remove, which is what decides whether the technician may put it back.
  removedBy: "owner" | "admin" | null;
}

export interface SeededTech {
  userId: string;
  profileId: string;
  fullName: string;
  city: string;
  area: string;
  approvalStatus: TTechnicianApprovalStatus;
  userStatus: TUserStatus;
  isRemoved: boolean; // account soft-deleted by an admin
  services: SeededService[];
}

// ---------- how many of each bucket ----------
const APPROVED_COUNT = 20; // publicly listed, own services and bookings
const PENDING_COUNT = 20; // waiting in the admin review queue
const REJECTED_COUNT = 3; // admin said no at the door — none of them ever published
const BANNED_COUNT = 5; // approved technicians whose account was later banned
const REMOVED_COUNT = 2; // account soft-deleted — one approved, one rejected

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
  // --- 5 BANNED (were approved) ---
  ["Babul", "Hossain"], ["Kabir", "Sheikh"], ["Rafiq", "Mollah"],
  ["Sohag", "Miah"], ["Jubayer", "Khan"],
  // --- 2 REMOVED (account soft-deleted): Alamin was approved, Motiur rejected ---
  ["Alamin", "Sikder"], ["Motiur", "Rahman"],
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

// Bios are stored as one Text column with a blank line between paragraphs — the
// same rule a text editor uses. The API splits on that blank line on the way
// out, so the profile page gets a real three-paragraph write-up instead of one
// long run-on line. Each template lands between 105 and 140 words, which is
// enough text for the profile page to look filled in without going past the
// 1000-character ceiling the bio validator sets.
const BIO_TEMPLATES = [
  (years: number, trade: string, city: string) =>
    `I have spent ${years} years doing hands-on ${trade} work across ${city} and the districts around it. Quick call-outs and full-day jobs get the same attention, and I carry my own tools and a stocked parts box, so a job never stops halfway through while somebody drives to a hardware shop.\n\nYou get a fixed quote before anything is opened up, and that is the number on the bill at the end — no line items appear once the work has started. If I find a second problem while I am there, I will tell you what it costs and let you decide, rather than fixing it and asking afterwards.\n\nRepairs carry a written warranty and I stay reachable after the visit. If the same fault comes back inside the warranty period, I come back for it at no charge.`,

  (years: number, trade: string, city: string) =>
    `Certified ${trade} technician with ${years} years on residential and small commercial jobs. Most of my work comes from repeat customers and the neighbours they pass my number to, which says more about the finish than any advertisement could.\n\nI arrive inside the booked slot, or I call ahead if the job before mine runs long. Once I am there I explain what is actually wrong in plain language, show you the part that failed, and give you the choice between a repair and a replacement with the real price of each. Nothing gets replaced because replacing it was easier for me.\n\nThe site is swept before I pack up, and emergency call-outs anywhere in ${city} are usually covered the same day.`,

  (years: number, trade: string, city: string) =>
    `${trade} specialist with ${years} years in the field and more than five hundred completed jobs around ${city}. I handle small repairs on my own and bring a second pair of hands only when the job genuinely needs one, so you are never paying for two people to stand in a corridor.\n\nParts come from suppliers I have bought from for years, never whatever is cheapest on the shelf that week. It costs a little more up front and it is the reason I can put a warranty on the work at all. Every repair is switched on and tested in front of you before I pack the tools away.\n\nIf something is beyond what I can do properly, I will say so and point you to someone who can.`,

  (years: number, trade: string, city: string) =>
    `Independent ${trade} professional serving ${city} for ${years} years. Transparent pricing, no charges that appear at the end, and no pressure to buy work nobody asked for. The quote I give on the phone is the quote you get on paper.\n\nIf a repair is not worth doing I will tell you that to your face and explain what is worth doing instead, even when the honest answer is the smaller invoice. I would rather lose one job than have you call somebody else next time, and that approach has kept me busy for ${years} years without ever advertising.\n\nBookings placed before noon are normally covered the same day, weekends included, and I confirm by phone so nobody waits at home guessing.`,
];

// ---------- which shelf each published service ends up on ----------
// Services are numbered in creation order across every technician, and these
// three sets say what happens to each number. Spreading them by slot instead of
// by technician means the removed tab shows several different names rather than
// one technician's whole catalogue.
type ServiceState = "live" | "paused" | "removedByOwner" | "removedByAdmin";

// switched off by the technician — still theirs, still one toggle from live
const PAUSED_SLOTS = new Set([3, 9, 14, 20, 26, 31, 37, 43, 48, 54, 60, 66]);
// the technician removed it themselves, so they are allowed to restore it
const OWNER_REMOVED_SLOTS = new Set([5, 18, 33, 46, 61]);
// an admin removed it — the technician gets a 403 on restore, admin only
const ADMIN_REMOVED_SLOTS = new Set([11, 24, 39, 52, 67]);

// Two of the removed services were already switched off when they were removed,
// one from each kind of removal. Removing no longer writes isActive, so these
// are the rows that prove a restore puts a service back the way it was found
// instead of quietly switching everything back on.
const PAUSED_BEFORE_REMOVAL_SLOTS = new Set([18, 52]);

function serviceStateFor(slot: number): ServiceState {
  if (PAUSED_SLOTS.has(slot)) return "paused";
  if (OWNER_REMOVED_SLOTS.has(slot)) return "removedByOwner";
  if (ADMIN_REMOVED_SLOTS.has(slot)) return "removedByAdmin";
  return "live";
}

// Which bucket does technician `i` belong to?
function bucketFor(index: number): {
  approvalStatus: TTechnicianApprovalStatus;
  userStatus: TUserStatus;
  isRemoved: boolean;
} {
  const pendingEnd = APPROVED_COUNT + PENDING_COUNT;
  const rejectedEnd = pendingEnd + REJECTED_COUNT;
  const bannedEnd = rejectedEnd + BANNED_COUNT;

  if (index < APPROVED_COUNT) {
    return {
      approvalStatus: TTechnicianApprovalStatus.APPROVED,
      userStatus: TUserStatus.ACTIVE,
      isRemoved: false,
    };
  }
  if (index < pendingEnd) {
    return {
      approvalStatus: TTechnicianApprovalStatus.PENDING,
      userStatus: TUserStatus.ACTIVE,
      isRemoved: false,
    };
  }
  if (index < rejectedEnd) {
    return {
      approvalStatus: TTechnicianApprovalStatus.REJECTED,
      userStatus: TUserStatus.ACTIVE,
      isRemoved: false,
    };
  }
  // A ban is an account action, not a review decision — the approval stays
  // APPROVED so the two concerns never get confused in the admin UI.
  if (index < bannedEnd) {
    return {
      approvalStatus: TTechnicianApprovalStatus.APPROVED,
      userStatus: TUserStatus.BANNED,
      isRemoved: false,
    };
  }
  // Removal is a third, separate axis: the account is gone from every list but
  // approvalStatus and status are untouched, so a restore puts the technician
  // back exactly as they were. One of the two is REJECTED on purpose. "The
  // application failed" and "the account no longer exists" are answers to two
  // different questions, and without this row the admin list has nothing that
  // `?approvalStatus=REJECTED&includeDeleted=true` returns but
  // `?approvalStatus=REJECTED` does not.
  return {
    approvalStatus:
      index === bannedEnd
        ? TTechnicianApprovalStatus.APPROVED
        : TTechnicianApprovalStatus.REJECTED,
    userStatus: TUserStatus.ACTIVE,
    isRemoved: true,
  };
}

// How many services this technician publishes.
function serviceCountFor(
  index: number,
  approvalStatus: TTechnicianApprovalStatus,
  userStatus: TUserStatus,
  isRemoved: boolean,
): number {
  // Leftovers from before the ban or the removal, and only for someone who was
  // approved long enough to publish. The banned rows are what prove the public
  // filters hide a live service whose owner is no longer allowed to sell: the
  // service itself is isActive and not removed, and it still never appears.
  if (isRemoved || userStatus === TUserStatus.BANNED) {
    return approvalStatus === TTechnicianApprovalStatus.APPROVED ? 1 : 0;
  }
  if (approvalStatus === TTechnicianApprovalStatus.APPROVED) {
    return index < 10 ? 4 : 3; // 10*4 + 10*3 = 70 published services
  }
  // Neither PENDING nor REJECTED can publish, and now that approval is a one-way
  // decision a REJECTED technician was never approved either — so there is no
  // path by which any of them owns a service. The seed matches the API.
  return 0;
}

export async function seedTechnicians(
  categories: SeededCategories,
  passwordHash: string,
  reviewerAdminId: string,
): Promise<SeededTech[]> {
  const technicians: SeededTech[] = [];
  const totalCount =
    APPROVED_COUNT +
    PENDING_COUNT +
    REJECTED_COUNT +
    BANNED_COUNT +
    REMOVED_COUNT;

  if (TECH_NAMES.length !== totalCount) {
    throw new Error(
      `Seed error: TECH_NAMES has ${TECH_NAMES.length} names but ${totalCount} technicians are configured`,
    );
  }

  // Counts every service written so far, across all technicians — this is the
  // slot number the three sets above are keyed on.
  let serviceSlot = 0;

  for (let i = 0; i < totalCount; i++) {
    const [firstName, lastName] = pick(TECH_NAMES, i);
    const fullName = `${firstName} ${lastName}`;
    const location = pick(LOCATIONS, i % LOCATIONS.length);
    const category = pick(categories.all, i % categories.all.length);
    const { approvalStatus, userStatus, isRemoved } = bucketFor(i);
    const isBanned = userStatus === TUserStatus.BANNED;

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
    const canSignIn = !isBanned && !isRemoved;

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
        // Removal and a ban are different columns for different reasons, and a
        // row can carry either one on its own.
        deletedAt: isRemoved ? daysAgo(randomInt(3, 25)) : null,
        lastLoginAt: canSignIn ? daysAgo(randomInt(0, 14)) : null,
        technicianProfile: {
          create: {
            phone: makePhone("0171", i + 1),
            // Every name in this list is male, so the portrait pool matches.
            // Every technician gets one: a card with a face next to one with a
            // grey circle reads as a broken image rather than a design choice.
            avatar: makeAvatar("men", i),
            bio: bioTemplate(
              experienceYears,
              category.name.toLowerCase(),
              location.city,
            ),
            experienceYears,
            hourlyRate: randomInt(8, 16) * 50, // 400 – 800
            address: `${pick(STREETS, i % STREETS.length)}, ${location.area}`,
            city: location.city,
            area: location.area,
            serviceRadius: randomInt(3, 20),
            isProfileComplete: true,
            // A technician can mark themselves unavailable without losing
            // approval — this is the switch PATCH /technicians/profile/availability
            // flips, and createBooking refuses a booking when it is off.
            isAvailable:
              approvalStatus === TTechnicianApprovalStatus.APPROVED && canSignIn
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

    const wanted = serviceCountFor(i, approvalStatus, userStatus, isRemoved);
    const chosen = pickMany(catalog, wanted, i); // offset keeps titles varied per tech
    const services: SeededService[] = [];

    for (const item of chosen) {
      const slot = serviceSlot;
      serviceSlot++;

      const state = serviceStateFor(slot);
      const isRemovedService =
        state === "removedByOwner" || state === "removedByAdmin";

      const created = await prisma.service.create({
        data: {
          technicianId: profile.id,
          categoryId: category.id,
          title: item.title,
          description: item.description,
          price: item.price,
          estimatedDuration: item.estimatedDuration,
          // Turning a service off is the technician's own choice and has
          // nothing to do with approval, bans or removal. deleteService leaves
          // isActive alone, so a removed row keeps the switch position it had.
          isActive: state !== "paused" && !PAUSED_BEFORE_REMOVAL_SLOTS.has(slot),
          deletedAt: isRemovedService ? daysAgo(randomInt(2, 30)) : null,
          // Who pressed remove is the whole point of the column: the technician
          // may undo their own removal, but an admin's removal is admin-only.
          deletedBy: isRemovedService
            ? state === "removedByOwner"
              ? user.id
              : reviewerAdminId
            : null,
          createdAt: daysAgo(Math.max(1, appliedDaysAgo - randomInt(1, 15))),
        },
      });
      services.push({
        id: created.id,
        title: item.title,
        price: item.price,
        categoryName: category.name,
        removedBy: isRemovedService
          ? state === "removedByOwner"
            ? "owner"
            : "admin"
          : null,
      });
    }

    // ---------- availability ----------
    // Only technicians who can actually be booked publish a weekly schedule.
    if (approvalStatus === TTechnicianApprovalStatus.APPROVED && canSignIn) {
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
      isRemoved,
      services,
    });
  }

  return technicians;
}

// Only these can receive bookings — approved, signed-in-able, and actually
// selling something.
export function bookableTechnicians(technicians: SeededTech[]): SeededTech[] {
  return technicians.filter(
    (t) =>
      t.approvalStatus === TTechnicianApprovalStatus.APPROVED &&
      t.userStatus === TUserStatus.ACTIVE &&
      !t.isRemoved &&
      t.services.length > 0,
  );
}
