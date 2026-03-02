/**
 * @description Fixed Public Holidays — no database storage.
 * These apply automatically every year based on month/day.
 * @module utils/fixedPublicHolidays
 */

const FIXED_HOLIDAY_DEFS = [
  { month: 1, day: 26, title: "Republic Day" },
  { month: 8, day: 15, title: "Independence Day" },
  { month: 10, day: 2, title: "Gandhi Jayanti" },
];

/**
 * Returns fixed public holidays for the given year.
 * Each entry has the shape:
 *   { title, startDate, endDate, type: "PUBLIC_FIXED", source: "FIXED" }
 *
 * @param {number} year - Full year, e.g. 2026
 * @returns {Array} Fixed holiday objects for the year
 */
const getFixedHolidaysForYear = (year) => {
  return FIXED_HOLIDAY_DEFS.map(({ month, day, title }) => {
    const date = new Date(year, month - 1, day); // month is 1-indexed
    date.setHours(0, 0, 0, 0);
    return {
      title,
      startDate: date,
      endDate: date,
      type: "PUBLIC_FIXED",
      source: "FIXED",
    };
  });
};

/**
 * Checks if a given date matches a fixed public holiday.
 *
 * @param {Date} dateToCheck
 * @returns {{ isHoliday: boolean, title: string|null }}
 */
const checkFixedHolidayForDate = (dateToCheck) => {
  const d = new Date(dateToCheck);
  const month = d.getMonth() + 1; // 1-indexed
  const day = d.getDate();

  const match = FIXED_HOLIDAY_DEFS.find(
    (h) => h.month === month && h.day === day,
  );

  if (match) {
    return { isHoliday: true, title: match.title };
  }
  return { isHoliday: false, title: null };
};

export { getFixedHolidaysForYear, checkFixedHolidayForDate, FIXED_HOLIDAY_DEFS };
