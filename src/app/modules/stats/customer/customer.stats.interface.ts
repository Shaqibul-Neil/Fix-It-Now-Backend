export interface IRecurringCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  maintenanceIntervalDays: number | null;
}

// ---------- Response shapes ----------
export interface ICustomerStat {
  id: string;
  label: string;
  value: number;
  href: string;
}

export type TMaintenanceStatus = "due" | "soon" | "never" | "ok";

export interface IMaintenanceItem {
  categoryId: string;
  name: string;
  slug: string;
  image: string | null;
  lastServicedAt: Date | null;
  dueAt: Date | null;
  daysLeft: number | null;
  status: TMaintenanceStatus;
}
