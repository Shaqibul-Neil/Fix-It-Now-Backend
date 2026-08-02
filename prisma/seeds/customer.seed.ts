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
  type AvatarGender,
} from "./seed.helpers";

export interface SeededCustomer {
  userId: string;
  profileId: string;
  fullName: string;
  status: TUserStatus;
  isRemoved: boolean;
}

// 40 names — index 0..5 keep the original emails so any bookmarked login still
// works. The third entry picks the portrait pool so the face on the card is not
// at odds with the name.
const CUSTOMER_NAMES: [string, string, AvatarGender][] = [
  ["Nadia", "Akter", "women"],
  ["Sabbir", "Hossain", "men"],
  ["Tania", "Rahman", "women"],
  ["Rakib", "Hasan", "men"],
  ["Mimi", "Chowdhury", "women"],
  ["Jahid", "Khan", "men"],
  ["Farhana", "Yasmin", "women"],
  ["Imran", "Kabir", "men"],
  ["Sadia", "Islam", "women"],
  ["Tanvir", "Alam", "men"],
  ["Ruma", "Begum", "women"],
  ["Shakil", "Ahmed", "men"],
  ["Nusrat", "Jahan", "women"],
  ["Arif", "Mahmud", "men"],
  ["Priya", "Das", "women"],
  ["Rasel", "Mia", "men"],
  ["Lamia", "Sultana", "women"],
  ["Mehedi", "Hasan", "men"],
  ["Sharmin", "Nahar", "women"],
  ["Omar", "Faruque", "men"],
  ["Ishrat", "Binte", "women"],
  ["Sujon", "Sarker", "men"],
  ["Rima", "Khatun", "women"],
  ["Naeem", "Hossain", "men"],
  ["Antara", "Roy", "women"],
  ["Zubair", "Rahman", "men"],
  ["Mitu", "Akter", "women"],
  ["Rafiul", "Karim", "men"],
  ["Shanta", "Paul", "women"],
  ["Emon", "Chowdhury", "men"],
  ["Bushra", "Tabassum", "women"],
  ["Nayeem", "Uddin", "men"],
  ["Jarin", "Tasnim", "women"],
  ["Habib", "Ullah", "men"],
  ["Sumaiya", "Haque", "women"],
  ["Tarek", "Aziz", "men"],
  ["Nipa", "Barua", "women"],
  ["Ashraf", "Ali", "men"],
  ["Munia", "Ferdous", "women"],
  ["Sabbir", "Rahat", "men"],
];

// Emails are handwritten for the first six so the README logins keep working;
// everyone after that gets a generated, guaranteed-unique address.
const LEGACY_EMAILS = [
  "nadia.cust@fixitnow.com",
  "sabbir.cust@fixitnow.com",
  "tania.cust@fixitnow.com",
  "rakib.cust@fixitnow.com",
  "mimi.cust@fixitnow.com",
  "jahid.cust@fixitnow.com",
];

// Banned and removed are two different columns answering two different
// questions — "does this account behave" and "does this account still exist".
// Index 8 carries both at once, which is the row that proves the admin list
// shows them as separate flags instead of collapsing one into the other.
const BANNED_INDEXES = new Set([5, 8, 17, 22, 28, 36]);
const REMOVED_INDEXES = new Set([8, 12, 25]);

export async function seedCustomers(
  passwordHash: string,
): Promise<SeededCustomer[]> {
  const customers: SeededCustomer[] = [];

  for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
    const [firstName, lastName, gender] = pick(CUSTOMER_NAMES, i);
    const location = pick(LOCATIONS, i % LOCATIONS.length);

    const status = BANNED_INDEXES.has(i)
      ? TUserStatus.BANNED
      : TUserStatus.ACTIVE;
    const isRemoved = REMOVED_INDEXES.has(i);
    const canSignIn = status === TUserStatus.ACTIVE && !isRemoved;

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
        deletedAt: isRemoved ? daysAgo(randomInt(2, 30)) : null,
        // Anyone the door is shut on has no recent login.
        lastLoginAt: canSignIn ? daysAgo(randomInt(0, 20)) : null,
        createdAt: daysAgo(randomInt(95, 200)),
        customerProfile: {
          create: {
            phone: makePhone("0172", i + 1),
            // Everyone gets a portrait, and the gender flag on the name list is
            // what keeps a woman's row from being handed a man's face.
            avatar: makeAvatar(gender, i),
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
      isRemoved,
    });
  }

  return customers;
}
