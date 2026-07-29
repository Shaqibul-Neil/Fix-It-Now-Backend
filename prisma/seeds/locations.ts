// One place for every city/area pair the seed uses, so the ?city= and ?area=
// filters on technicians, services and bookings all have several matches each.

export interface SeedLocation {
  city: string;
  area: string;
  postalCode: string;
}

export const LOCATIONS: SeedLocation[] = [
  { city: "Dhaka", area: "Dhanmondi", postalCode: "1209" },
  { city: "Dhaka", area: "Uttara", postalCode: "1230" },
  { city: "Dhaka", area: "Banani", postalCode: "1213" },
  { city: "Dhaka", area: "Mirpur", postalCode: "1216" },
  { city: "Dhaka", area: "Bashundhara", postalCode: "1229" },
  { city: "Dhaka", area: "Gulshan", postalCode: "1212" },
  { city: "Dhaka", area: "Mohammadpur", postalCode: "1207" },
  { city: "Dhaka", area: "Jatrabari", postalCode: "1204" },
  { city: "Chattogram", area: "Agrabad", postalCode: "4100" },
  { city: "Chattogram", area: "Khulshi", postalCode: "4225" },
  { city: "Chattogram", area: "Panchlaish", postalCode: "4203" },
  { city: "Sylhet", area: "Zindabazar", postalCode: "3100" },
  { city: "Sylhet", area: "Amberkhana", postalCode: "3100" },
  { city: "Khulna", area: "Sonadanga", postalCode: "9100" },
  { city: "Rajshahi", area: "Uposhohor", postalCode: "6202" },
];

// street lines get paired with a location to build a full address
export const STREETS = [
  "House 12, Road 3",
  "Flat 4B, House 27",
  "House 91, Road 11",
  "Plot 5, Block C",
  "House 8, Lane 2",
  "Apt 6A, Tower 3",
  "House 44, Road 7",
  "Holding 210, Main Road",
];
