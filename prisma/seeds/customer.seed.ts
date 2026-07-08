import { prisma } from "../../src/lib/prisma";
import { TRole, TUserStatus } from "../../generated/prisma/enums";

export interface SeededCustomer {
  userId: string;
  profileId: string;
}

export async function seedCustomers(
  passwordHash: string,
): Promise<SeededCustomer[]> {
  const customerSeed = [
    {
      firstName: "Nadia",
      lastName: "Akter",
      email: "nadia.cust@fixitnow.com",
      phone: "01720000001",
      city: "Dhaka",
      area: "Banani",
      status: TUserStatus.ACTIVE,
    },
    {
      firstName: "Sabbir",
      lastName: "Hossain",
      email: "sabbir.cust@fixitnow.com",
      phone: "01720000002",
      city: "Dhaka",
      area: "Mirpur",
      status: TUserStatus.ACTIVE,
    },
    {
      firstName: "Tania",
      lastName: "Rahman",
      email: "tania.cust@fixitnow.com",
      phone: "01720000003",
      city: "Dhaka",
      area: "Uttara",
      status: TUserStatus.ACTIVE,
    },
    {
      firstName: "Rakib",
      lastName: "Hasan",
      email: "rakib.cust@fixitnow.com",
      phone: "01720000004",
      city: "Chattogram",
      area: "Agrabad",
      status: TUserStatus.ACTIVE,
    },
    {
      firstName: "Mimi",
      lastName: "Chowdhury",
      email: "mimi.cust@fixitnow.com",
      phone: "01720000005",
      city: "Dhaka",
      area: "Bashundhara",
      status: TUserStatus.ACTIVE,
    },
    {
      // BANNED customer
      firstName: "Jahid",
      lastName: "Khan",
      email: "jahid.cust@fixitnow.com",
      phone: "01720000006",
      city: "Dhaka",
      area: "Jatrabari",
      status: TUserStatus.BANNED,
    },
  ];

  const customers: SeededCustomer[] = [];
  for (const c of customerSeed) {
    const user = await prisma.user.create({
      data: {
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        passwordHash,
        role: TRole.CUSTOMER,
        status: c.status,
        customerProfile: {
          create: {
            phone: c.phone,
            city: c.city,
            area: c.area,
            defaultAddress: `${c.area}, ${c.city}`,
          },
        },
      },
      include: { customerProfile: true },
    });
    customers.push({ userId: user.id, profileId: user.customerProfile!.id });
  }

  return customers;
}
