import { TDayOfWeek } from "../../generated/prisma/enums";

//Mapping Day to Enum
export const DAYS = [
  TDayOfWeek.SUNDAY,
  TDayOfWeek.MONDAY,
  TDayOfWeek.TUESDAY,
  TDayOfWeek.WEDNESDAY,
  TDayOfWeek.THURSDAY,
  TDayOfWeek.FRIDAY,
  TDayOfWeek.SATURDAY,
] as const;

//Get the Day and time
export const getDayOfWeek = (date: Date): TDayOfWeek => {
  return DAYS[date.getUTCDay()]!;
};

export const getTimeString = (date: Date): string => {
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");

  return `${hh}:${mm}`;
};
