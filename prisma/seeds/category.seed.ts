import { prisma } from "../../src/lib/prisma";
import { TMaintenanceType } from "../../generated/prisma/enums";
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
// 1200px wide, not 800: the same file is also behind a retina card, so 800 was
// already being upscaled.
const UNSPLASH = (photoId: string): string =>
  `https://images.unsplash.com/${photoId}?w=1200&q=80&auto=format&fit=crop`;

// The hero strip at the top of the category page. Same checked photo, cropped
// to 8:3 by the CDN instead of by CSS, so the browser never downloads a tall
// image to show a wide band of it.
const UNSPLASH_COVER = (photoId: string): string =>
  `https://images.unsplash.com/${photoId}?w=1920&h=720&q=80&auto=format&fit=crop`;

// `overview` is stored the same way a technician bio is: one Text column with a
// blank line between paragraphs, split back into an array on the way out. Kept
// as a list here so the paragraph breaks are visible while editing.
const paragraphs = (...parts: string[]): string => parts.join("\n\n");

// One row per trade. `Booking.categoryName` is a snapshot string, so the names
// here are what the booking history and the category breakdown chart show.
//
// The last four are deliberately not live. Two are switched off but still
// present (`?status=paused`), two are removed (`?status=deleted`) — which is
// what the admin restore endpoint needs something to act on.
//
// Every row carries the full landing-page set: a one-line description for the
// card, a tagline for the hero, two paragraphs of overview and exactly six
// common issues. The paused and removed ones carry it too — a restore has to
// bring back a complete page, not a half-filled one.
//
// `maintenanceType` decides whether a category can appear on a customer's
// maintenance list at all, and it is a judgement about the trade, not a number:
//
//   RECURRING  — the job comes back on a cycle whether anything broke or not
//                (AC servicing, deep cleaning). Only these get a countdown.
//   OCCASIONAL — real interval, but measured in years. Reminding somebody to
//                repaint reads as nagging, so it is recorded and never nudged.
//   NONE       — a breakdown. You do not schedule a fridge repair, so a
//                reminder for one would be nonsense.
//
// `maintenanceIntervalDays` only means anything on a RECURRING row; everywhere
// else it stays null so a later type change cannot quietly resurrect a stale
// number.
const categorySeed = [
  {
    name: "Plumbing",
    slug: "plumbing",
    description:
      "Leaks, blockages, geysers and bathroom fittings — handled by licensed plumbers who carry their own parts.",
    tagline: "Water where it should be, and nowhere else.",
    overview: paragraphs(
      "Plumbing is the category customers reach for first, and the one where a wrong call costs the most. Every plumber listed here has cleared an ID check, submitted trade experience and had their first jobs reviewed before the profile went public.",
      "Rates are quoted before the visit and the payment sits in escrow until you confirm the leak has stopped. Parts are itemised on the invoice, so a ৳120 washer never turns into a ৳1,200 line.",
    ),
    commonIssues: [
      "Dripping taps and worn washers",
      "Blocked kitchen or bathroom drains",
      "Leaking pipe joints behind tiles",
      "Geyser not heating or leaking",
      "Low water pressure through the flat",
      "Toilet running or not flushing",
    ],
    photoId: "photo-1607472586893-edb57bdc0e39",
    isActive: true,
    removedDaysAgo: null,
    // A tap starts dripping or it does not — nothing here runs on a clock.
    maintenanceType: TMaintenanceType.NONE,
    maintenanceIntervalDays: null,
  },
  {
    name: "Electrical",
    slug: "electrical",
    description:
      "Wiring, fans, switchboards and new points — handled by electricians who test the line before they leave.",
    tagline: "Power that behaves, wiring that lasts.",
    overview: paragraphs(
      "Electrical work is the category where cutting corners shows up months later, usually as a burn mark. Every electrician here has cleared an ID check, submitted trade experience and had their first jobs reviewed before the profile ever went public here.",
      "Rates are quoted before the visit and the payment sits in escrow until you confirm the power is back on safely. Materials are itemised on the invoice, so a switch never turns into a rewire.",
    ),
    commonIssues: [
      "Tripping circuit breakers and fuse boxes",
      "Ceiling fans running slow or humming",
      "Switchboard sparking or getting warm",
      "Lights flickering on one line only",
      "New wiring for an AC or geyser point",
      "Sockets dead after a voltage surge",
    ],
    photoId: "photo-1621905251189-08b45d6a269e",
    isActive: true,
    removedDaysAgo: null,
    // Fault-driven. Wiring is not serviced on a schedule in a private flat.
    maintenanceType: TMaintenanceType.NONE,
    maintenanceIntervalDays: null,
  },
  {
    name: "Cleaning",
    slug: "cleaning",
    description:
      "Deep cleaning for kitchens, sofas, bathrooms and full flats, with the supplies the cleaner brings along.",
    tagline: "A flat that looks the way it did on day one.",
    overview: paragraphs(
      "Cleaning is the category customers book most often and judge fastest, because the result is visible the moment the door closes. Every cleaner here has cleared an ID check, submitted work history and had their first jobs reviewed before going public.",
      "Rates are quoted by room count before the visit and the payment sits in escrow until you have walked through the flat. Supplies are itemised on the invoice, so nothing is added after the work.",
    ),
    commonIssues: [
      "Post-renovation dust across every room",
      "Kitchen grease on tiles and chimney",
      "Sofa and mattress stains after spills",
      "Bathroom scale and grout discolouring",
      "Move-out cleaning before handing keys",
      "Balcony and window glass left streaky",
    ],
    photoId: "photo-1581578731548-c64695cc6952",
    isActive: true,
    removedDaysAgo: null,
    // The shortest cycle on the platform — a quarterly deep clean is the
    // rhythm most flats settle into.
    maintenanceType: TMaintenanceType.RECURRING,
    maintenanceIntervalDays: 90,
  },
  {
    name: "Painting",
    slug: "painting",
    description:
      "Interior and exterior painting quoted per square foot, with the primer and the paint brand written down.",
    tagline: "Two coats, straight edges, no repaint next year.",
    overview: paragraphs(
      "Painting is the category where the estimate and the finish drift apart most easily, usually over how many coats were meant. Every painter here has cleared an ID check, submitted work history and had early jobs reviewed before the profile went public.",
      "Rates are quoted per square foot before any tin is opened and the payment sits in escrow until you sign off. Paint and primer are itemised on the invoice, so the brand cannot quietly change.",
    ),
    commonIssues: [
      "Damp patches bleeding through the paint",
      "Old distemper flaking off the plaster",
      "Hairline cracks reopening after a coat",
      "Ceiling stains from an upstairs leak",
      "Exterior wall fading on one side",
      "Single room repaint before a move-in",
    ],
    photoId: "photo-1562259949-e8e7689d7828",
    isActive: true,
    removedDaysAgo: null,
    // Four to five years between coats. Long enough that a reminder would land
    // after most people have moved, so it is recorded and never nudged.
    maintenanceType: TMaintenanceType.OCCASIONAL,
    maintenanceIntervalDays: null,
  },
  {
    name: "AC Repair",
    slug: "ac-repair",
    description:
      "Servicing, gas refills, installation and fault-finding for split and window units alike.",
    tagline: "Cold air back before the afternoon heat.",
    overview: paragraphs(
      "AC work is the category that spikes every summer, and the one where a rushed diagnosis costs a compressor. Every technician here has cleared an ID check, submitted trade experience and had their first jobs reviewed before going public.",
      "Rates are quoted before the unit is opened and the payment sits in escrow until the room actually cools. Gas and spare parts are itemised on the invoice, so a top-up stays a top-up.",
    ),
    commonIssues: [
      "Unit running but the room stays warm",
      "Water dripping from the indoor unit",
      "Gas low after two or three seasons",
      "Outdoor compressor rattling or humming",
      "Remote or thermostat not responding",
      "New split unit needing wall mounting",
    ],
    photoId: "photo-1667983453881-4992fe86ab1b",
    isActive: true,
    removedDaysAgo: null,
    // Twice a year — before summer and after it. Skipping a service is what
    // turns a ৳800 clean into a compressor bill.
    maintenanceType: TMaintenanceType.RECURRING,
    maintenanceIntervalDays: 180,
  },
  {
    name: "Carpentry",
    slug: "carpentry",
    description:
      "Furniture repair, door and cabinet work, and custom fittings measured on site before any quote.",
    tagline: "Doors that close, joints that hold.",
    overview: paragraphs(
      "Carpentry is the category with the widest gap between a quick repair and a rebuild, so the quote matters more than the rate. Every carpenter here has cleared an ID check and had early jobs reviewed before the profile went public.",
      "Rates are quoted after the piece is seen, not over the phone, and the payment sits in escrow until the hinge holds. Timber and fittings are itemised on the invoice, so nothing is guessed.",
    ),
    commonIssues: [
      "Wardrobe doors dropping out of line",
      "Drawer runners jamming or sticking",
      "Door locks and hinges working loose",
      "Bed frames creaking under weight",
      "Kitchen cabinet shutters coming away",
      "Custom shelving fitted to an alcove",
    ],
    photoId: "photo-1544164560-adac3045edb2",
    isActive: true,
    removedDaysAgo: null,
    // A hinge works loose when it works loose. No cycle to track.
    maintenanceType: TMaintenanceType.NONE,
    maintenanceIntervalDays: null,
  },
  {
    name: "Appliance Repair",
    slug: "appliance-repair",
    description:
      "Fridges, washing machines, ovens and purifiers repaired with itemised, numbered spare parts.",
    tagline: "Fixed on the first visit, or told straight.",
    overview: paragraphs(
      "Appliance repair is the category where customers most want to know whether to fix or replace, and an honest answer saves the most money. Every technician here has cleared an ID check and had early jobs reviewed before going public.",
      "Rates are quoted after the fault is found and the payment sits in escrow until the machine runs a full cycle. Spare parts are itemised on the invoice with the part number on it.",
    ),
    commonIssues: [
      "Washing machine not draining or spinning",
      "Fridge cooling in one compartment only",
      "Microwave heating unevenly or not at all",
      "Oven thermostat running hot or cold",
      "Water purifier leaking at the filter",
      "Dishwasher stopping mid-cycle with an error",
    ],
    photoId: "photo-1585659722983-3a675dabf23d",
    isActive: true,
    removedDaysAgo: null,
    // Annual: purifier filters and washing-machine descaling are the two jobs
    // in here that come round on a calendar rather than after a breakdown.
    maintenanceType: TMaintenanceType.RECURRING,
    maintenanceIntervalDays: 365,
  },

  // ---------- switched off, not removed ----------
  {
    // Paused rather than deleted: the admin can flip it back on from the
    // category list without going through restore.
    name: "Home Shifting",
    slug: "home-shifting",
    description:
      "House and office moving with packing, dismantling and a crew that counts the boxes twice.",
    tagline: "Every box accounted for, on the day you booked.",
    overview: paragraphs(
      "Home shifting is the category judged on one day and one van, where a missing box matters more than the hourly rate. Every crew here has cleared an ID check and had early jobs reviewed before the listing went public.",
      "Rates are quoted after an inventory walk-through and the payment sits in escrow until the last box is inside. Packing material and labour are itemised separately, so a long carry is not a surprise.",
    ),
    commonIssues: [
      "Fragile crockery and glass needing packing",
      "Wardrobes that must be dismantled first",
      "Fridge and AC needing careful handling",
      "Narrow stairwells with no service lift",
      "Same-day shifting inside the same city",
      "Storage needed between two move dates",
    ],
    photoId: "photo-1600725935160-f67ee4f6084a",
    isActive: false,
    removedDaysAgo: null,
    // Once every few years, and never on a schedule anyone would want reminding of.
    maintenanceType: TMaintenanceType.NONE,
    maintenanceIntervalDays: null,
  },
  // ---------- live again ----------
  // Pest control used to be seeded paused. It is live now because it is the
  // clearest RECURRING trade on the platform, and the customer dashboard needs
  // at least one recurring category nobody has booked yet — that is the row
  // that renders as "Never booked", which is the only upsell on the page.
  // Home Shifting above still covers the paused tab.
  {
    name: "Pest Control",
    slug: "pest-control",
    description:
      "Cockroach, termite, bed bug and mosquito treatment with the chemicals named on the invoice.",
    tagline: "Gone this month, and still gone next season.",
    overview: paragraphs(
      "Pest control is the category customers keep quiet about and want handled discreetly, often the same week they call. Every operator here has cleared an ID check, declared the chemicals they use and had early jobs reviewed before going public.",
      "Rates are quoted per treatment and the payment sits in escrow until the follow-up visit is done. Chemicals used are named on the invoice, so nothing unlabelled is ever sprayed inside your flat.",
    ),
    commonIssues: [
      "Cockroaches returning to the kitchen line",
      "Termites in door frames and skirting",
      "Bed bugs after a mattress or a move",
      "Mosquito breeding in tanks and drains",
      "Rodents in the false ceiling or duct",
      "Ants trailing along a kitchen counter",
    ],
    photoId: "photo-1593999094742-4f5280054b23",
    isActive: true,
    removedDaysAgo: null,
    // Twice a year is the standard contract — one treatment plus a follow-up.
    maintenanceType: TMaintenanceType.RECURRING,
    maintenanceIntervalDays: 180,
  },

  // ---------- removed ----------
  // deleteCategory writes deletedAt and leaves isActive alone, so a removed row
  // keeps the switch position it had. Gardening was live when it was removed and
  // comes back live; CCTV was already switched off for the season and has to come
  // back switched off — that pair is what a restore has to get right.
  {
    name: "Gardening",
    slug: "gardening",
    description:
      "Balcony and rooftop garden setup, seasonal upkeep and planting handled visit by visit.",
    tagline: "Green that survives the month between visits.",
    overview: paragraphs(
      "Gardening is the category booked for upkeep rather than emergencies, so what matters is whether the same person comes back each month. Every gardener here has cleared an ID check and had early jobs reviewed before the profile went public.",
      "Rates are quoted per visit or per month and the payment sits in escrow until the work is seen. Plants, soil and pots are itemised on the invoice at cost, not marked up.",
    ),
    commonIssues: [
      "Balcony pots drying out between visits",
      "Rooftop soil needing a seasonal change",
      "Hedges and creepers growing out of shape",
      "Leaf fungus spreading across one bed",
      "Drip irrigation clogging in the summer",
      "New planter setup for a bare balcony",
    ],
    photoId: "photo-1416879595882-3373a0480b5b",
    isActive: true,
    removedDaysAgo: 40,
    // Monthly upkeep — the shortest cycle of the lot. Removed, so it proves a
    // deleted category stays out of the maintenance list however recurring it is.
    maintenanceType: TMaintenanceType.RECURRING,
    maintenanceIntervalDays: 30,
  },
  {
    name: "CCTV Installation",
    slug: "cctv-installation",
    description:
      "Home and shop camera setup with DVR wiring, app configuration and cabling run out of sight.",
    tagline: "Every corner covered, every night readable.",
    overview: paragraphs(
      "CCTV is the category where the wiring outlives the camera, so a neat first install decides what the next five years cost. Every installer here has cleared an ID check and had early jobs reviewed before the profile went public.",
      "Rates are quoted per camera and per run of cable, and the payment sits in escrow until you see the recording. Hardware is itemised on the invoice by model, never as one lump.",
    ),
    commonIssues: [
      "Cameras offline after a power cut",
      "DVR overwriting footage too quickly",
      "Night vision washing out at the gate",
      "Cabling needed across two floors",
      "Mobile app losing the live feed",
      "Extra camera added to an old set",
    ],
    photoId: "photo-1557597774-9d273605dfa9",
    isActive: false,
    removedDaysAgo: 12,
    // Installed once and left alone until something fails.
    maintenanceType: TMaintenanceType.NONE,
    maintenanceIntervalDays: null,
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
        overview: c.overview,
        tagline: c.tagline,
        commonIssues: c.commonIssues,
        image: UNSPLASH(c.photoId),
        coverImage: UNSPLASH_COVER(c.photoId),
        isActive: c.isActive,
        deletedAt: c.removedDaysAgo ? daysAgo(c.removedDaysAgo) : null,
        maintenanceType: c.maintenanceType,
        maintenanceIntervalDays: c.maintenanceIntervalDays,
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
