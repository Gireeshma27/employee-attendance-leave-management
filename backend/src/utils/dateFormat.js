// ─── Indian-format date utilities (Node.js / backend) ────────────────────────
// Mirror of frontend/src/utils/formatDate.js — kept in sync.
// Use these instead of .toLocaleDateString() so formatting is locale-independent
// and always follows Indian day-first conventions.

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG  = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Parse a date input safely.
 * Treats YYYY-MM-DD strings as LOCAL time (midnight) to avoid UTC-offset shifts.
 * @param {Date|string|number} input
 * @returns {Date|null}
 */
function parseDate(input) {
  if (!input && input !== 0) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Display formatters ───────────────────────────────────────────────────────

/**
 * DD/MM/YYYY  →  06/03/2026
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
function formatDate(dateInput) {
  const d = parseDate(dateInput);
  if (!d) return '-';
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * DD MMM YYYY  →  06 Mar 2026
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
function formatDateLong(dateInput) {
  const d = parseDate(dateInput);
  if (!d) return '-';
  const day   = String(d.getDate()).padStart(2, '0');
  const month = MONTH_SHORT[d.getMonth()];
  const year  = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * DD MMMM YYYY  →  06 March 2026
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
function formatDateFull(dateInput) {
  const d = parseDate(dateInput);
  if (!d) return '-';
  const day   = String(d.getDate()).padStart(2, '0');
  const month = MONTH_LONG[d.getMonth()];
  const year  = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * DD/MM/YYYY, h:mm AM/PM  →  06/03/2026, 9:30 AM
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
function formatDateTime(dateInput) {
  const d = parseDate(dateInput);
  if (!d) return '-';
  const datePart = formatDate(d);
  const h   = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${datePart}, ${hour}:${min} ${ampm}`;
}

/**
 * h:mm AM/PM  →  9:30 AM
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
function formatTime(dateInput) {
  const d = parseDate(dateInput);
  if (!d) return '-';
  const h   = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${min} ${ampm}`;
}

/**
 * DD/MM/YYYY – DD/MM/YYYY  →  06/03/2026 – 10/03/2026
 * Returns a single formatted string when both dates are the same day.
 * @param {Date|string|number} startInput
 * @param {Date|string|number} endInput
 * @returns {string}
 */
function formatDateRange(startInput, endInput) {
  const s = formatDate(startInput);
  const e = formatDate(endInput);
  return s === e ? s : `${s} – ${e}`;
}

/**
 * Converts an HH:mm time string to h:mm AM/PM  →  9:30 AM
 * Use this when the input is a plain time string (e.g. from a timing config),
 * not a full Date object.
 * @param {string} hhMM  — e.g. "09:30"
 * @returns {string}
 */
function formatHHmm(hhMM) {
  if (!hhMM) return '';
  const [hours, minutes] = String(hhMM).split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return hhMM;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

export {
  formatDate,
  formatDateLong,
  formatDateFull,
  formatDateTime,
  formatTime,
  formatDateRange,
  formatHHmm,
};
