"use client";

/**
 * FormattedDate — renders a date value in Indian (day-first) format.
 *
 * Props:
 *   date      {Date|string|number}  The date to display.
 *   format    {"short"|"long"|"full"|"datetime"|"time"|"range"}
 *               short    → DD/MM/YYYY          (default)
 *               long     → DD MMM YYYY         e.g. 06 Mar 2026
 *               full     → DD MMMM YYYY        e.g. 06 March 2026
 *               datetime → DD/MM/YYYY, h:mm AM/PM
 *               time     → h:mm AM/PM
 *               range    → requires `endDate` prop; DD/MM/YYYY – DD/MM/YYYY
 *   endDate   {Date|string|number}  Used only when format="range".
 *   fallback  {string}              Displayed when date is invalid. Default "-".
 *   className {string}              Extra CSS classes for the <time> element.
 *
 * Usage examples:
 *   <FormattedDate date={record.date} />
 *   <FormattedDate date={record.date} format="long" />
 *   <FormattedDate date={leave.fromDate} format="range" endDate={leave.toDate} />
 *   <FormattedDate date={notification.createdAt} format="datetime" />
 */

import {
  formatDate,
  formatDateLong,
  formatDateFull,
  formatDateTime,
  formatTime,
  formatDateRange,
} from "@/utils/formatDate";

const FORMATTERS = {
  short:    (date)          => formatDate(date),
  long:     (date)          => formatDateLong(date),
  full:     (date)          => formatDateFull(date),
  datetime: (date)          => formatDateTime(date),
  time:     (date)          => formatTime(date),
  range:    (date, endDate) => formatDateRange(date, endDate),
};

export function FormattedDate({
  date,
  format = "short",
  endDate,
  fallback = "-",
  className,
}) {
  if (!date) return <span className={className}>{fallback}</span>;

  const formatter = FORMATTERS[format] ?? FORMATTERS.short;
  const text = formatter(date, endDate);

  // Build an ISO string for the datetime attribute (accessibility).
  let isoString;
  try {
    isoString = new Date(date).toISOString();
  } catch {
    isoString = undefined;
  }

  return (
    <time dateTime={isoString} className={className}>
      {text}
    </time>
  );
}
