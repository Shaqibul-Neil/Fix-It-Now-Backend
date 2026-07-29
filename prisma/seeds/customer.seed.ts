import { prisma } from "../../src/lib/prisma";
import { TRole, TUserStatus } from "../../generated/prisma/enums";
import { LOCATIONS, STREETS } from "./locations";
import {
  chance,
  daysAgo,
  makeAvatar,
  makePhone,
  pick,
  randomInt,
} from "./seed.helpers";

export interface SeededCustomer {
  userId: string;
  profileId: string;
  fullName: string;
  status: TUserStatus;
}

// 40 names — index 0..4 keep the original emails so any bookmarked login still works.
const CUSTOMER_NAMES: [string, string][] = [
  ["Nadia", "Akter"],
  ["Sabbir", "Hossain"],
  ["Tania", "Rahman"],
  ["Rakib", "Hasan"],
  ["Mimi", "Chowdhury"],
  ["Jahid", "Khan"],
  ["Farhana", "Yasmin"],
  ["Imran", "Kabir"],
  ["Sadia", "Islam"],
  ["Tanvir", "Alam"],
  ["Ruma", "Begum"],
  ["Shakil", "Ahmed"],
  ["Nusrat", "Jahan"],
  ["Arif", "Mahmud"],
  ["Priya", "Das"],
  ["Rasel", "Mia"],
  ["Lamia", "Sultana"],
  ["Mehedi", "Hasan"],
  ["Sharmin", "Nahar"],
  ["Omar", "Faruque"],
  ["Ishrat", "Binte"],
  ["Sujon", "Sarker"],
  ["Rima", "Khatun"],
  ["Naeem", "Hossain"],
  ["Antara", "Roy"],
  ["Zubair", "Rahman"],
  ["Mitu", "Akter"],
  ["Rafiul", "Karim"],
  ["Shanta", "Paul"],
  ["Emon", "Chowdhury"],
  ["Bushra", "Tabassum"],
  ["Nayeem", "Uddin"],
  ["Jarin", "Tasnim"],
  ["Habib", "Ullah"],
  ["Sumaiya", "Haque"],
  ["Tarek", "Aziz"],
  ["Nipa", "Barua"],
  ["Ashraf", "Ali"],
  ["Munia", "Ferdous"],
  ["Sabbir", "Rahat"],
];

// Emails are handwritten for the first five so the README logins keep working;
// everyone after that gets a generated, guaranteed-unique address.
const LEGACY_EMAILS = [
  "nadia.cust@fixitnow.com",
  "sabbir.cust@fixitnow.com",
  "tania.cust@fixitnow.com",
  "rakib.cust@fixitnow.com",
  "mimi.cust@fixitnow.com",
  "jahid.cust@fixitnow.com",
];

export async function seedCustomers(
  passwordHash: string,
): Promise<SeededCustomer[]> {
  const customers: SeededCustomer[] = [];

  for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
    const [firstName, lastName] = pick(CUSTOMER_NAMES, i);
    const location = pick(LOCATIONS, i % LOCATIONS.length);

    // index 5 is Jahid — kept BANNED like before; three more banned rows spread
    // through the list so the admin user filter has something to show.
    const status =
      i === 5 || i === 17 || i === 28 || i === 36
        ? TUserStatus.BANNED
        : TUserStatus.ACTIVE;

    const email =
      LEGACY_EMAILS[i] ??
      `${firstName.toLowerCase()}${i}.cust@fixitnow.com`;

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: TRole.CUSTOMER,
        status,
        // BANNED users are frozen, so they have no recent login.
        lastLoginAt:
          status === TUserStatus.ACTIVE ? daysAgo(randomInt(0, 20)) : null,
        createdAt: daysAgo(randomInt(95, 200)),
        customerProfile: {
          create: {
            phone: makePhone("0172", i + 1),
            avatar: chance(60) ? makeAvatar(`${firstName} ${lastName}`) : null,
            city: location.city,
            area: location.area,
            postalCode: location.postalCode,
            defaultAddress: `${pick(STREETS, i % STREETS.length)}, ${location.area}, ${location.city}`,
          },
        },
      },
      include: { customerProfile: true },
    });

    const profile = user.customerProfile;
    if (!profile) {
      throw new Error(`Seed error: customer profile missing for ${email}`);
    }

    customers.push({
      userId: user.id,
      profileId: profile.id,
      fullName: `${firstName} ${lastName}`,
      status,
    });
  }

  return customers;
}
