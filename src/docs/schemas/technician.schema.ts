export const technicianSchemas = {
  TechnicianBasicInfo: {
    type: "object",
    required: ["phone", "bio", "experienceYears"],
    properties: {
      phone: { type: "string", minLength: 6, maxLength: 11, example: "01710000001" },
      avatar: {
        type: "string",
        format: "uri",
        maxLength: 2048,
        nullable: true,
        description: "Square portrait. Shown on every list row and booking card.",
        example: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces",
      },
      coverImage: {
        type: "string",
        format: "uri",
        maxLength: 2048,
        nullable: true,
        description:
          "The banner behind the avatar on the profile page. Wide, not square — it is cropped to a strip, so a " +
          "portrait uploaded here loses its head.",
        example: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&fit=crop",
      },
      bio: {
        type: "string",
        minLength: 10,
        maxLength: 1000,
        description:
          "Sent as one string. Separate paragraphs with a blank line (`\\n\\n`) — the read endpoints split on that " +
          "and hand the profile page an array, so the write side stays a plain textarea and search still works.",
        example:
          "8 years of hands-on plumbing work across Dhaka. I take both quick call-outs and full-day jobs.\n\nYou get a fixed quote before I start, and that is the number you pay.",
      },
      experienceYears: { type: "integer", minimum: 0, maximum: 60, example: 8 },
    },
  },
  TechnicianIdentity: {
    type: "object",
    required: ["nationalId"],
    description:
      "Who the platform can prove this technician is, and who it calls when a job goes wrong. Collected at " +
      "onboarding and read back only by an admin or by the technician themselves — the public profile route never " +
      "returns any of it, and answers `isVerified` instead.\n\n" +
      "**Editable until the application is approved, and not after.** `PATCH /technicians/profile` returns 403 if " +
      "this group is sent by an APPROVED technician: swapping the NID afterwards would keep a badge an admin " +
      "granted to a different person.",
    properties: {
      nationalId: {
        type: "string",
        pattern: "^(\\d{10}|\\d{13}|\\d{17})$",
        description:
          "Bangladeshi NID — 10, 13 or 17 digits, no spaces or dashes. Unique across technicians; a second " +
          "onboarding with the same number is refused with 409.",
        example: "1990000034250",
      },
      nidDocument: {
        type: "string",
        format: "uri",
        maxLength: 2048,
        nullable: true,
        description: "Scan or photo of the NID card. This is the file the admin opens on the review screen.",
      },
      passportNumber: {
        type: "string",
        minLength: 6,
        maxLength: 20,
        nullable: true,
        description: "Optional second document. Also unique when present.",
        example: "BD1000175",
      },
      dateOfBirth: {
        type: "string",
        format: "date",
        nullable: true,
        description: "Must be at least 18 years ago — a younger date fails validation.",
        example: "1994-03-17",
      },
      emergencyContactName: { type: "string", minLength: 2, maxLength: 100, nullable: true, example: "Rahima Begum" },
      emergencyContactPhone: { type: "string", minLength: 6, maxLength: 20, nullable: true, example: "01910000026" },
    },
  },
  TechnicianAvailabilityUpdate: {
    type: "object",
    required: ["isAvailable"],
    description:
      "The technician's own \"am I taking work right now\" switch. Deliberately not part of the profile update: " +
      "that one is the onboarding form and an admin reviews its fields, while this is flipped several times a week " +
      "and reviewed by nobody.\n\n" +
      "Do not confuse it with the weekly schedule under `/technician/availability` — that one says *which hours* " +
      "they work, this one says *whether they are working at all*.",
    properties: {
      isAvailable: { type: "boolean", example: false },
    },
  },
  TechnicianFeaturedUpdate: {
    type: "object",
    required: ["isFeatured"],
    description:
      "The admin's spotlight switch. Featured technicians sort to the top of the default public list and are what " +
      "`?featured=true` returns.",
    properties: {
      isFeatured: { type: "boolean", example: true },
    },
  },
  TechnicianPricing: {
    type: "object",
    required: ["hourlyRate"],
    properties: {
      hourlyRate: { type: "number", exclusiveMinimum: 0, example: 500 },
      serviceRadius: { type: "integer", exclusiveMinimum: 0, nullable: true, example: 10 },
      offersEmergencyService: {
        type: "boolean",
        description: "Takes urgent, out-of-hours call-outs. Drives the `emergencyService` filter on the public list.",
        example: true,
      },
    },
  },
  TechnicianLocation: {
    type: "object",
    required: ["address", "city", "area"],
    properties: {
      address: {
        type: "string",
        minLength: 5,
        maxLength: 255,
        description: "Street address. Admin-only on read — the public routes return `city` and `area` alone.",
        example: "House 12, Road 3",
      },
      city: { type: "string", minLength: 2, maxLength: 100, example: "Dhaka" },
      area: { type: "string", minLength: 2, maxLength: 100, example: "Gulshan" },
    },
  },
  TechnicianProfileDetails: {
    type: "object",
    description: "The presentation half of the profile. Nothing here gates anything; it is what the page shows.",
    properties: {
      professionalTitle: {
        type: "string",
        minLength: 2,
        maxLength: 120,
        nullable: true,
        description: "The line under the name on the card.",
        example: "Senior Plumbing Technician",
      },
      tagline: {
        type: "string",
        maxLength: 300,
        nullable: true,
        example: "Fixed right the first time, or I come back for free.",
      },
      skills: {
        type: "array",
        maxItems: 20,
        items: { type: "string", minLength: 1, maxLength: 60 },
        description:
          "Free text, but the sidebar counts these strings and `?skills=` matches them exactly — two technicians " +
          "in the same trade have to spell a skill identically or one facet becomes two. " +
          "`GET /technicians/filters` returns the spellings already in use; pick from there.",
        example: ["Pipe fitting", "Leak detection", "Drain cleaning"],
      },
      workHighlights: {
        type: "array",
        maxItems: 10,
        items: { type: "string", minLength: 1, maxLength: 100 },
        description: "Display-only checklist on the profile page. Nothing filters on it.",
        example: ["Own tools and a stocked parts box", "Written warranty on every repair"],
      },
    },
  },
  TechnicianProfileCreate: {
    type: "object",
    required: ["basicInfo", "identity", "pricing", "location"],
    description:
      "The whole onboarding form in one request. Submitting it marks the profile complete and puts it in the " +
      "admin review queue as PENDING — nothing is public until an admin approves it.",
    properties: {
      basicInfo: { $ref: "#/components/schemas/TechnicianBasicInfo" },
      identity: { $ref: "#/components/schemas/TechnicianIdentity" },
      pricing: { $ref: "#/components/schemas/TechnicianPricing" },
      location: { $ref: "#/components/schemas/TechnicianLocation" },
      profileDetails: { $ref: "#/components/schemas/TechnicianProfileDetails" },
    },
  },
  TechnicianProfileUpdate: {
    type: "object",
    description:
      "All groups optional; each group's fields are individually optional (partial update). " +
      "Updating a REJECTED profile resets it to PENDING and puts it back in the admin review queue.\n\n" +
      "`identity` is the exception: an APPROVED technician sending it gets a 403 and nothing is written.",
    properties: {
      basicInfo: { $ref: "#/components/schemas/TechnicianBasicInfo" },
      identity: { $ref: "#/components/schemas/TechnicianIdentity" },
      pricing: { $ref: "#/components/schemas/TechnicianPricing" },
      location: { $ref: "#/components/schemas/TechnicianLocation" },
      profileDetails: { $ref: "#/components/schemas/TechnicianProfileDetails" },
    },
  },
  TechnicianApprovalStatus: {
    type: "string",
    enum: ["PENDING", "APPROVED", "REJECTED"],
    description:
      "PENDING = submitted, waiting on an admin. APPROVED = publicly listed and allowed to publish services. " +
      "REJECTED = hidden from customers until the technician edits and resubmits.",
    example: "PENDING",
  },
  TechnicianReviewRequest: {
    type: "object",
    required: ["status"],
    description:
      "One endpoint handles both decisions — `status` picks which. " +
      "`rejectionReason` is required when status is REJECTED and ignored when it is APPROVED.",
    properties: {
      status: {
        type: "string",
        enum: ["APPROVED", "REJECTED"],
        description: "The admin's decision. PENDING is not accepted here.",
        example: "APPROVED",
      },
      rejectionReason: {
        type: "string",
        minLength: 10,
        maxLength: 500,
        nullable: true,
        description: "Required when status is REJECTED — the technician sees this text.",
        example: "Bio is too short and the phone number could not be verified.",
      },
    },
  },
  TechnicianRow: {
    type: "object",
    description:
      "The columns every technician row carries, public or admin. `id` is the TechnicianProfile id, not the User id.",
    properties: {
      id: { type: "string", format: "uuid" },
      firstName: { type: "string", example: "Karim" },
      lastName: { type: "string", example: "Mia" },
      email: { type: "string", format: "email" },
      avatar: {
        type: "string",
        format: "uri",
        nullable: true,
        example: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces",
      },
      experienceYears: { type: "integer", example: 8 },
      hourlyRate: { type: "number", example: 500 },
      city: { type: "string", example: "Dhaka" },
      area: { type: "string", example: "Dhanmondi" },
      averageRating: { type: "number", example: 4.5 },
      totalReviews: { type: "integer", example: 12 },
    },
  },
  TechnicianListItem: {
    allOf: [
      { $ref: "#/components/schemas/TechnicianRow" },
      {
        type: "object",
        description: "One card on the public list — enough to decide without opening the profile.",
        properties: {
          bio: {
            type: "string",
            description:
              "The raw stored text, blank lines and all. Only the details route splits it into paragraphs; a card " +
              "clamps it to two lines anyway.",
          },
          professionalTitle: { type: "string", nullable: true, example: "Senior Plumbing Technician" },
          skills: { type: "array", items: { type: "string" }, example: ["Pipe fitting", "Leak detection"] },
          isFeatured: { type: "boolean", example: false },
          isAvailable: { type: "boolean", description: "Taking new bookings right now.", example: true },
          offersEmergencyService: { type: "boolean", example: true },
          services: {
            type: "array",
            description: "The five cheapest live services, as a preview. The details route returns all of them.",
            items: { $ref: "#/components/schemas/TechnicianListServiceCard" },
          },
        },
      },
    ],
  },
  TechnicianAdminListItem: {
    allOf: [
      { $ref: "#/components/schemas/TechnicianRow" },
      {
        type: "object",
        description:
          "The moderation table row: the shared columns plus the approval state, contact details and " +
          "completed-job count. No bio, skills or service preview — this table is scanned, not browsed.\n\n" +
          "`approvalStatus`, `accountStatus` and `isDeleted` are three independent axes and none of them implies " +
          "another: an APPROVED technician can be banned, and a banned one can also be removed. `userId` is the " +
          "handle for the ban and remove endpoints under `/admin/users` — `id` is the profile, not the account.",
        properties: {
          userId: { type: "string", format: "uuid", description: "User id — what /admin/users/{id} takes." },
          phone: { type: "string", example: "01710000001" },
          isFeatured: { type: "boolean", example: false },
          approvalStatus: { $ref: "#/components/schemas/TechnicianApprovalStatus" },
          rejectionReason: { type: "string", nullable: true },
          reviewedAt: { type: "string", format: "date-time", nullable: true },
          appliedAt: { type: "string", format: "date-time", description: "When the onboarding was submitted." },
          completedJobs: { type: "integer", example: 7 },
          accountStatus: { type: "string", enum: ["ACTIVE", "BANNED"], example: "ACTIVE" },
          isDeleted: { type: "boolean", description: "The account was removed by an admin.", example: false },
        },
      },
    ],
  },
  TechnicianListServiceCard: {
    type: "object",
    description: "A service as it appears on a list card — price and trade, nothing else.",
    properties: {
      id: { type: "string", format: "uuid" },
      title: { type: "string", example: "Emergency pipe leak repair" },
      price: { type: "string", description: "Decimal serialised as a string.", example: "1500.00" },
      category: { type: "string", example: "Plumbing" },
    },
  },
  TechnicianServiceCard: {
    allOf: [
      { $ref: "#/components/schemas/TechnicianListServiceCard" },
      {
        type: "object",
        description:
          "The profile-page version. `categoryImage` is the category's picture, not the service's — a service has " +
          "no image of its own, so the trade's photo is what a card falls back to.",
        properties: {
          estimatedDuration: { type: "integer", nullable: true, description: "Minutes.", example: 90 },
          categoryImage: { type: "string", format: "uri", nullable: true },
        },
      },
    ],
  },
  TechnicianAdminServiceCard: {
    allOf: [
      { $ref: "#/components/schemas/TechnicianServiceCard" },
      {
        type: "object",
        description:
          "The admin view keeps every service, switched-off and removed included — moderating a technician means " +
          "seeing what they took down, not just what is live. These two flags say which is which.",
        properties: {
          isActive: { type: "boolean" },
          isDeleted: { type: "boolean" },
        },
      },
    ],
  },
  TechnicianDetailsBase: {
    type: "object",
    description:
      "What the public profile page and the admin review screen both show. Neither route returns this on its own — " +
      "see `TechnicianDetails` and `TechnicianAdminDetails`.",
    properties: {
      id: { type: "string", format: "uuid", description: "TechnicianProfile id." },
      firstName: { type: "string", example: "Karim" },
      lastName: { type: "string", example: "Mia" },
      email: { type: "string", format: "email" },
      avatar: { type: "string", format: "uri", nullable: true },
      coverImage: { type: "string", format: "uri", nullable: true, description: "Profile header banner." },
      professionalTitle: { type: "string", nullable: true, example: "Senior Plumbing Technician" },
      tagline: { type: "string", nullable: true, example: "Fixed right the first time, or I come back for free." },
      bio: {
        type: "array",
        description:
          "One entry per paragraph, already split — render each as its own `<p>`. Empty array when no bio was " +
          "written. It is stored as a single Text column and only split on the way out, so `?search=` still matches " +
          "across the whole thing.",
        items: { type: "string" },
        example: [
          "8 years of hands-on plumbing work across Dhaka. I take both quick call-outs and full-day jobs.",
          "You get a fixed quote before I start, and that is the number you pay.",
        ],
      },
      experienceYears: { type: "integer", example: 8 },
      hourlyRate: { type: "number", example: 500 },
      serviceRadius: { type: "integer", nullable: true, description: "Kilometres the technician travels.", example: 10 },
      city: { type: "string", example: "Dhaka" },
      area: { type: "string", example: "Dhanmondi" },
      averageRating: { type: "number", example: 4.5 },
      totalReviews: { type: "integer", example: 12 },
      isAvailable: { type: "boolean", description: "Taking new bookings right now.", example: true },
      isFeatured: { type: "boolean", example: false },
      offersEmergencyService: { type: "boolean", example: true },
      skills: { type: "array", items: { type: "string" }, example: ["Pipe fitting", "Leak detection"] },
      workHighlights: {
        type: "array",
        items: { type: "string" },
        example: ["Own tools and a stocked parts box", "Written warranty on every repair"],
      },
      reviews: {
        type: "array",
        description:
          "The 5 most recent PUBLISHED reviews — the same row `GET /technicians/{id}/reviews` serves, so a page can " +
          "show these and switch to the paginated endpoint for the rest without changing its rendering.",
        items: { $ref: "#/components/schemas/PublicReviewItem" },
      },
      availability: {
        type: "array",
        description:
          "The weekly schedule, so the profile page can answer \"when can I get them\" without a second request. " +
          "Empty means no schedule published, which blocks nothing — see `GET /technicians/{id}/availability`.",
        items: { $ref: "#/components/schemas/PublicAvailabilitySlot" },
      },
    },
  },
  TechnicianDetails: {
    allOf: [
      { $ref: "#/components/schemas/TechnicianDetailsBase" },
      {
        type: "object",
        description:
          "The public profile page in one response — the technician, what they sell, what customers said, and when " +
          "they work.\n\n" +
          "Nothing identifying is here. No National ID, no NID scan, no passport, no date of birth, no street " +
          "address, no phone number, no emergency contact: a customer needs to know the technician was checked, not " +
          "what the check was made of. `isVerified` is that answer, and it is the only trace of the review the " +
          "public route carries — `approvalStatus` and `rejectionReason` stay on the admin route.",
        properties: {
          isVerified: {
            type: "boolean",
            description:
              "`approvalStatus === APPROVED`, flattened. Always true on this route — the query itself pins " +
              "APPROVED — so it is there for the badge, not for branching.",
            example: true,
          },
          services: {
            type: "array",
            description: "Every live service. Switched-off and removed ones are left out.",
            items: { $ref: "#/components/schemas/TechnicianServiceCard" },
          },
        },
      },
    ],
  },
  TechnicianAdminDetails: {
    allOf: [
      { $ref: "#/components/schemas/TechnicianDetailsBase" },
      {
        type: "object",
        description:
          "The same profile read with no approval filter, plus everything the public version deliberately leaves " +
          "out: the identity documents, the moderation decision, the account state, the contact details, and the " +
          "full service list with the switched-off and removed rows still in it.\n\n" +
          "No `isVerified` here — the raw `approvalStatus` is what an admin acts on, and a two-state boolean cannot " +
          "tell PENDING from REJECTED.",
        properties: {
          userId: { type: "string", format: "uuid", description: "User id — what /admin/users/{id} takes." },
          phone: { type: "string", example: "01710000001" },
          address: { type: "string", example: "House 12, Road 3, Gulshan" },
          isProfileComplete: { type: "boolean", description: "The onboarding form was submitted.", example: true },
          identity: {
            allOf: [
              { $ref: "#/components/schemas/TechnicianIdentity" },
              {
                type: "object",
                description:
                  "Grouped rather than flattened so it is obvious this block has no business in a public response. " +
                  "Every field is returned whether it was filled or not — a null here is a real answer on a review " +
                  "screen: it means the applicant skipped it.",
              },
            ],
          },
          approvalStatus: { $ref: "#/components/schemas/TechnicianApprovalStatus" },
          rejectionReason: { type: "string", nullable: true },
          reviewedAt: { type: "string", format: "date-time", nullable: true },
          reviewedBy: {
            type: "string",
            format: "uuid",
            nullable: true,
            description: "User id of the admin who decided. Null while PENDING.",
          },
          appliedAt: { type: "string", format: "date-time", description: "When the onboarding was submitted." },
          updatedAt: { type: "string", format: "date-time", description: "Last edit to the profile row." },
          accountStatus: { type: "string", enum: ["ACTIVE", "BANNED"], example: "ACTIVE" },
          isDeleted: { type: "boolean", example: false },
          services: {
            type: "array",
            description: "Every service, newest first, removed ones included — overrides the public list.",
            items: { $ref: "#/components/schemas/TechnicianAdminServiceCard" },
          },
          bookingsByStatus: {
            type: "array",
            description: "Every status is present, zero-filled.",
            items: { $ref: "#/components/schemas/StatusBreakdownItem" },
          },
        },
      },
    ],
  },
  TechnicianMyProfile: {
    type: "object",
    description:
      "The technician's own row, straight from the table — every column, identity included, null or not. This is " +
      "the edit form's source, so a field the technician left blank has to come back as null rather than be " +
      "dropped, otherwise the form cannot tell \"never filled in\" from \"not returned by this endpoint\".\n\n" +
      "Services and the weekly schedule are not in here. They have their own modules: `/services/my-services` and " +
      "`/technician/availability`.",
    properties: {
      id: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid" },
      phone: { type: "string", example: "01710000001" },
      nationalId: { type: "string", example: "1990000034250" },
      nidDocument: { type: "string", format: "uri", nullable: true },
      passportNumber: { type: "string", nullable: true, example: "BD1000175" },
      dateOfBirth: { type: "string", format: "date", nullable: true },
      emergencyContactName: { type: "string", nullable: true },
      emergencyContactPhone: { type: "string", nullable: true },
      avatar: { type: "string", format: "uri", nullable: true },
      coverImage: { type: "string", format: "uri", nullable: true },
      professionalTitle: { type: "string", nullable: true },
      tagline: { type: "string", nullable: true },
      bio: {
        type: "string",
        description: "The raw stored text — not split into paragraphs here, because this response feeds a textarea.",
      },
      skills: { type: "array", items: { type: "string" } },
      workHighlights: { type: "array", items: { type: "string" } },
      experienceYears: { type: "integer", example: 8 },
      hourlyRate: { type: "string", description: "Decimal serialised as a string.", example: "500.00" },
      address: { type: "string" },
      city: { type: "string", example: "Dhaka" },
      area: { type: "string", example: "Dhanmondi" },
      serviceRadius: { type: "integer", nullable: true },
      averageRating: { type: "string", example: "4.50" },
      totalReviews: { type: "integer", example: 12 },
      isProfileComplete: { type: "boolean" },
      isAvailable: { type: "boolean" },
      isFeatured: { type: "boolean" },
      offersEmergencyService: { type: "boolean" },
      approvalStatus: { $ref: "#/components/schemas/TechnicianApprovalStatus" },
      rejectionReason: {
        type: "string",
        nullable: true,
        description: "Why the last application was turned down. Cleared the moment the profile is edited again.",
      },
      reviewedAt: { type: "string", format: "date-time", nullable: true },
      reviewedBy: { type: "string", format: "uuid", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      users: {
        type: "object",
        description: "The account behind the profile.",
        properties: {
          firstName: { type: "string", example: "Karim" },
          lastName: { type: "string", example: "Mia" },
          email: { type: "string", format: "email" },
          lastLoginAt: { type: "string", format: "date-time", nullable: true },
        },
      },
    },
  },
  TechnicianFilterFacets: {
    type: "object",
    description:
      "Everything needed to draw the filter sidebar, counted against the same gates the list applies — so a " +
      "checkbox never promises results the list then refuses to return. Counts ignore the filters currently " +
      "selected; this endpoint takes no query at all and can be fetched once and cached with the page.",
    properties: {
      categories: {
        type: "array",
        description:
          "Live categories, A-Z, each with the number of **technicians** who have at least one live service in it — " +
          "not the number of services. A technician with three plumbing services is one plumber.",
        items: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Plumbing" },
            slug: { type: "string", example: "plumbing" },
            count: { type: "integer", example: 12 },
          },
        },
      },
      skills: {
        type: "array",
        description:
          "Every skill string currently in use, commonest first, ties broken alphabetically. Feed these values " +
          "straight back as `?skills=` — the filter matches them exactly.",
        items: {
          type: "object",
          properties: {
            value: { type: "string", example: "Leak detection" },
            count: { type: "integer", example: 7 },
          },
        },
      },
      priceBuckets: {
        type: "array",
        description: "The accepted `?priceBuckets=` values, in display order. Bounds are in BDT per hour.",
        items: { type: "string", enum: ["under_500", "500_1000", "1000_2000", "2000_plus"] },
      },
      sortOptions: {
        type: "array",
        description: "The accepted `?sort=` values, in display order. The first one is the default.",
        items: {
          type: "string",
          enum: ["best_match", "top_rated", "most_reviewed", "price_low", "price_high", "newest"],
        },
      },
    },
  },
};
