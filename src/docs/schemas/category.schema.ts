// Money and ratings leave this API as strings, never numbers: a Decimal column
// serialises to an object and a float rounds, and both are wrong for a figure a
// customer is about to read off a card.
const moneyString = (example: string) => ({
  type: "string",
  description: "Decimal as a string.",
  example,
});

export const categorySchemas = {
  CategoryCreate: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 100, example: "Plumbing" },
      slug: { type: "string", minLength: 2, maxLength: 120, description: "Derived from `name` when omitted.", example: "plumbing" },
      description: {
        type: "string",
        maxLength: 2000,
        description: "One line for the category card. Keep it short — the grid clamps it.",
        example: "Leaks, blockages, geysers and bathroom fittings — handled by licensed plumbers who carry their own parts.",
      },
      overview: {
        type: "string",
        maxLength: 4000,
        description:
          "Long copy for the landing page, stored as one block of text with a **blank line between paragraphs** " +
          "(`\\n\\n`), the same way a technician bio is. The public endpoint splits it into an array before sending; " +
          "the admin endpoints hand it back raw so it can go straight into a textarea.",
        example:
          "Plumbing is the category customers reach for first, and the one where a wrong call costs the most.\n\nRates are quoted before the visit and the payment sits in escrow until you confirm the leak has stopped.",
      },
      tagline: {
        type: "string",
        maxLength: 200,
        description: "One line under the hero image.",
        example: "Water where it should be, and nowhere else.",
      },
      image: {
        type: "string",
        format: "uri",
        maxLength: 2048,
        description: "Card artwork for the category. Any reachable image URL.",
        example: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=80&auto=format&fit=crop",
      },
      coverImage: {
        type: "string",
        format: "uri",
        maxLength: 2048,
        description: "Wide hero image for the landing page. Landscape — the page renders it as a band.",
        example: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1920&h=720&q=80&auto=format&fit=crop",
      },
      commonIssues: {
        type: "array",
        maxItems: 12,
        description: "The 'what people usually call us for' list on the landing page. Editorial, not derived from bookings.",
        items: { type: "string", minLength: 3, maxLength: 160 },
        example: [
          "Dripping taps and worn washers",
          "Blocked kitchen or bathroom drains",
          "Geyser not heating or leaking",
        ],
      },
      isActive: { type: "boolean", default: true },
    },
  },
  CategoryUpdate: {
    type: "object",
    description:
      "Partial update. Send `null` on `image`, `coverImage`, `tagline` or `overview` to clear that field; " +
      "send `commonIssues: []` to empty the list.",
    properties: {
      name: { type: "string", minLength: 2, maxLength: 100 },
      description: { type: "string", maxLength: 2000 },
      overview: { type: "string", maxLength: 4000, nullable: true },
      tagline: { type: "string", maxLength: 200, nullable: true },
      image: { type: "string", format: "uri", maxLength: 2048, nullable: true },
      coverImage: { type: "string", format: "uri", maxLength: 2048, nullable: true },
      commonIssues: { type: "array", maxItems: 12, items: { type: "string", minLength: 3, maxLength: 160 } },
      isActive: { type: "boolean" },
    },
  },

  CategoryBase: {
    type: "object",
    description: "The five columns every category shape starts from.",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", example: "Plumbing" },
      slug: { type: "string", example: "plumbing" },
      description: { type: "string", nullable: true },
      image: { type: "string", format: "uri", nullable: true },
    },
  },

  CategoryPublicItem: {
    allOf: [
      { $ref: "#/components/schemas/CategoryBase" },
      {
        type: "object",
        description:
          "What customers see. Only live categories are ever returned, and every number below is counted at " +
          "request time from bookable rows only — a service counts when the row is live **and** the technician " +
          "behind it is approved, active and not removed. That is the same filter `GET /services` applies, so a " +
          "`serviceCount` of 7 always opens a page with 7 services on it.",
        properties: {
          technicianCount: {
            type: "integer",
            description: "Distinct technicians with at least one live service here. Somebody offering four services counts once.",
            example: 3,
          },
          serviceCount: { type: "integer", description: "Bookable services in this category.", example: 7 },
          startingPrice: { ...moneyString("600"), nullable: true, description: "Cheapest bookable service. `null` when the category has none yet." },
          averageRating: {
            type: "string",
            description: "Mean of the **published** reviews on jobs done in this category, two decimals. `\"0.00\"` when there are none.",
            example: "4.38",
          },
          totalReviews: { type: "integer", description: "Published reviews only — pending, hidden and rejected ones never move this.", example: 8 },
          popularServices: {
            type: "array",
            items: { type: "string" },
            description:
              "Up to four service titles, ranked by real bookings and deduplicated by title — three plumbers " +
              "listing 'Tap replacement' is one chip. Declined and cancelled bookings do not count. " +
              "**Empty until the category has been booked**: cheap services are not passed off as popular ones.",
            example: ["Toilet flush repair", "Tap replacement", "Basin fitting"],
          },
          isTrending: {
            type: "boolean",
            description:
              "Earned, not a flag an admin sets: the category cleared a floor of bookings in the last 30 days " +
              "**and** finished in the top few by that count. The floor alone would light up the whole grid in a " +
              "quiet week; the ranking alone would crown a category with two bookings.",
          },
        },
      },
    ],
  },

  CategoryTopTechnician: {
    type: "object",
    description: "One card in the landing page's technician strip.",
    properties: {
      id: { type: "string", format: "uuid", description: "Technician **profile** id — the same one `GET /technicians/{id}` takes." },
      name: { type: "string", example: "Anwar Ali" },
      avatar: { type: "string", format: "uri", nullable: true },
      professionalTitle: { type: "string", nullable: true, example: "Senior Plumbing Technician" },
      city: { type: "string", example: "Dhaka" },
      area: { type: "string", example: "Jatrabari" },
      averageRating: { type: "string", example: "4.25" },
      totalReviews: { type: "integer", example: 4 },
      completedJobs: {
        type: "integer",
        description: "Jobs finished **in this category**, not across every trade they list under.",
        example: 6,
      },
      hourlyRate: moneyString("750"),
      isFeatured: { type: "boolean" },
      isAvailable: { type: "boolean" },
    },
  },

  CategoryTopService: {
    type: "object",
    description: "One card in the landing page's services strip.",
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string", example: "Tap replacement" },
      technicianId: { type: "string", format: "uuid", description: "Profile id of whoever provides it — the card links straight through." },
      technicianName: { type: "string", example: "Anwar Ali" },
      price: moneyString("600"),
      estimatedDuration: { type: "integer", nullable: true, description: "Minutes.", example: 30 },
      totalBookings: {
        type: "integer",
        description: "Real bookings on this service, declined and cancelled excluded. `0` on a filler row.",
        example: 4,
      },
    },
  },

  CategoryPublicDetails: {
    allOf: [
      { $ref: "#/components/schemas/CategoryPublicItem" },
      {
        type: "object",
        description: "The card, plus the editorial copy and the two strips the landing page renders.",
        properties: {
          coverImage: { type: "string", format: "uri", nullable: true },
          tagline: { type: "string", nullable: true, example: "Water where it should be, and nowhere else." },
          overview: {
            type: "array",
            items: { type: "string" },
            description:
              "The `overview` text split on its blank lines, ready to render as paragraphs. " +
              "Empty array when no overview was written. Note the admin endpoints return this field as a **raw string** instead.",
          },
          completedJobs: { type: "integer", description: "Bookings finished in this category, all time.", example: 19 },
          responseMinutes: {
            type: "integer",
            nullable: true,
            description:
              "Average minutes between a request landing and a technician accepting it, over every booking ever " +
              "accepted here — including ones later cancelled, because the answer was still that fast. " +
              "`null` when nothing has been accepted yet.",
            example: 55,
          },
          priceRange: {
            type: "object",
            nullable: true,
            description: "Cheapest and dearest bookable service. `null` when the category has none.",
            properties: { min: moneyString("600"), max: moneyString("1800") },
          },
          commonIssues: { type: "array", items: { type: "string" } },
          topTechnicians: {
            type: "array",
            maxItems: 6,
            description: "Best rated first. Empty until somebody is approved in this category.",
            items: { $ref: "#/components/schemas/CategoryTopTechnician" },
          },
          topServices: {
            type: "array",
            maxItems: 6,
            description:
              "Most booked first. A category with no booking history still fills the strip with its cheapest live " +
              "services, and those carry an honest `totalBookings: 0`. This is a preview — `serviceCount` is the " +
              "real number and the full, paginated grid is `GET /services?category={slug}`.",
            items: { $ref: "#/components/schemas/CategoryTopService" },
          },
        },
      },
    ],
  },

  CategoryAdminItem: {
    allOf: [
      { $ref: "#/components/schemas/CategoryBase" },
      {
        type: "object",
        description:
          "The editorial copy plus both state flags, which move independently. `isActive: false` with " +
          "`isDeleted: false` is a category that was switched off — a toggle brings it back. `isDeleted: true` " +
          "needs the restore endpoint, and keeps whatever `isActive` it had, so a removed row can read " +
          "`isActive: true` and still be off the public list. Read `isDeleted` first.\n\n" +
          "No public counts here: this shape is for editing a row, not for reading how the category is doing.",
        properties: {
          overview: {
            type: "string",
            nullable: true,
            description: "**Raw text**, not split — it goes back into the edit form's textarea as written. The public details endpoint splits the same field into an array.",
          },
          tagline: { type: "string", nullable: true },
          coverImage: { type: "string", format: "uri", nullable: true },
          commonIssues: { type: "array", items: { type: "string" } },
          isActive: { type: "boolean" },
          isDeleted: { type: "boolean" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          totalServices: {
            type: "integer",
            description: "Services still attached to this category, removed ones excluded. Unlike the public `serviceCount`, this counts paused rows and rows whose technician is not approved.",
            example: 12,
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    ],
  },
};
