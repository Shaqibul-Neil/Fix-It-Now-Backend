import { MILLISECONDS_PER_DAY } from "../../../../utils/utils";
import type {
  ICustomerStat,
  IMaintenanceItem,
  IRecurringCategory,
  TMaintenanceStatus,
} from "./customer.stats.interface";

const DUE_SOON_DAYS = 14;

// Days between now and the due date. Negative once it has passed.
const countDaysLeft = (dueAt: Date): number => {
  return Math.ceil((dueAt.getTime() - Date.now()) / MILLISECONDS_PER_DAY);
};

// Day count to a label the UI can style.
const toStatus = (daysLeft: number | null): TMaintenanceStatus => {
  if (daysLeft === null) return "never";
  if (daysLeft <= 0) return "due";
  if (daysLeft <= DUE_SOON_DAYS) return "soon";
  return "ok";
};

// The rule (which categories run on a cycle) crossed with the history (when
// this customer last had each one done) gives the maintenance list.
export const buildMaintenance = (
  categories: IRecurringCategory[],
  lastServiceByCategory: Map<string, Date | null>,
): IMaintenanceItem[] => {
  const items = categories.map<IMaintenanceItem>((category) => {
    const lastServicedAt = lastServiceByCategory.get(category.id) ?? null;

    // The query already drops categories with a null interval, so the only case
    // that reaches this branch is a category the customer has never booked.
    if (!lastServicedAt || !category.maintenanceIntervalDays) {
      return {
        categoryId: category.id,
        name: category.name,
        slug: category.slug,
        image: category.image,
        lastServicedAt,
        dueAt: null,
        daysLeft: null,
        status: toStatus(null),
      };
    }

    const dueAt = new Date(
      lastServicedAt.getTime() +
        category.maintenanceIntervalDays * MILLISECONDS_PER_DAY,
    );
    const daysLeft = countDaysLeft(dueAt);

    return {
      categoryId: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image,
      lastServicedAt,
      dueAt,
      daysLeft,
      status: toStatus(daysLeft),
    };
  });

  // Most overdue first. A null daysLeft means never booked — those sort last,
  // since there is nothing late about a job that was never due.
  return items.sort((a, b) => {
    if (a.daysLeft === null) return 1;
    if (b.daysLeft === null) return -1;
    return a.daysLeft - b.daysLeft;
  });
};

export const buildStat = (
  id: string,
  label: string,
  value: number,
  href: string,
): ICustomerStat => ({ id, label, value, href });
