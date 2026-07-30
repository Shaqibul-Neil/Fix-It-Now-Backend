import { TDayOfWeek } from "../../generated/prisma/enums";
import config from "../config";

const zonedFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: config.timezone,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const WEEKDAYS: Record<string, TDayOfWeek> = {
  Sun: TDayOfWeek.SUNDAY,
  Mon: TDayOfWeek.MONDAY,
  Tue: TDayOfWeek.TUESDAY,
  Wed: TDayOfWeek.WEDNESDAY,
  Thu: TDayOfWeek.THURSDAY,
  Fri: TDayOfWeek.FRIDAY,
  Sat: TDayOfWeek.SATURDAY,
};

// One pass over the instant. Both callers below want a piece of the same answer,
// and formatting twice would be the same work done twice.
const readZoned = (date: Date) => {
  const parts = zonedFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)!.value;

  return {
    weekday: read("weekday"),
    hour: read("hour"),
    minute: read("minute"),
  };
};

//Get the Day and time, both on the platform's wall clock
export const getDayOfWeek = (date: Date): TDayOfWeek => {
  return WEEKDAYS[readZoned(date).weekday]!;
};

export const getTimeString = (date: Date): string => {
  const { hour, minute } = readZoned(date);

  // Already zero-padded by the "2-digit" options, and "HH:MM" is exactly the
  // shape stored in startTime/endTime — which is what makes the plain string
  // comparison in the availability check hold.
  return `${hour}:${minute}`;
};
