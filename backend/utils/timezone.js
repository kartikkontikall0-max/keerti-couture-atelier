/**
 * Keerti Couture — Atelier Timezone & Calendar Day Utilities
 *
 * The atelier operates exclusively in Indian Standard Time: Asia/Kolkata (UTC+05:30).
 * India does not observe Daylight Saving Time (DST); the offset is permanently +05:30.
 *
 * These utilities guarantee that:
 * 1. Calendar date keys ('YYYY-MM-DD') are consistently evaluated in Asia/Kolkata.
 * 2. Database query ranges encompass the exact 24-hour window of that Indian calendar day.
 * 3. Midnight boundary transitions and past-date validations are deterministic regardless
 *    of whether the server environment runs in UTC, EST, or local time.
 */

const ATELIER_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

/**
 * Formats a Date, timestamp, or date string into 'YYYY-MM-DD' in Asia/Kolkata.
 *
 * @param {Date|string|number} dateInput
 * @returns {string} Calendar date key in 'YYYY-MM-DD' format
 */
const getAtelierDateKey = (dateInput) => {
  if (!dateInput) {
    throw new Error('Date input is required');
  }

  // If already a strict YYYY-MM-DD string, validate and return
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [y, m, d] = dateInput.trim().split('-').map(Number);
    const testDate = new Date(Date.UTC(y, m - 1, d));
    if (testDate.getUTCFullYear() === y && testDate.getUTCMonth() === m - 1 && testDate.getUTCDate() === d) {
      return dateInput.trim();
    }
  }

  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided');
  }

  // en-CA produces the standard ISO 'YYYY-MM-DD' formatted calendar date
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ATELIER_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(d);
};

/**
 * Computes the exact UTC timestamp boundary for a full calendar day in Asia/Kolkata.
 *
 * 00:00:00.000 IST corresponds to 18:30:00.000 UTC of the prior day.
 * 23:59:59.999 IST corresponds to 18:29:59.999 UTC of the target day.
 *
 * @param {Date|string} dateInput
 * @returns {{ dateKey: string, startOfDay: Date, endOfDay: Date }}
 */
const getAtelierDayRange = (dateInput) => {
  const dateKey = getAtelierDateKey(dateInput);
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // 00:00:00.000 in IST is 18:30:00.000 UTC on the previous day
  // Date.UTC creates timestamps directly in UTC without local environment jitter
  const startOfDayUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - IST_OFFSET_MS;
  const endOfDayUtcMs = Date.UTC(year, month - 1, day, 23, 59, 59, 999) - IST_OFFSET_MS;

  return {
    dateKey,
    startOfDay: new Date(startOfDayUtcMs),
    endOfDay: new Date(endOfDayUtcMs),
  };
};

/**
 * Determines whether a requested date is prior to today in the atelier's timezone.
 *
 * @param {Date|string} dateInput
 * @returns {boolean} True if the date is in the past in Asia/Kolkata
 */
const isPastDateInAtelier = (dateInput) => {
  const targetKey = getAtelierDateKey(dateInput);
  const todayKey = getAtelierDateKey(new Date());
  return targetKey < todayKey;
};

/**
 * Normalizes a requested appointment date into a clean Date object pinned
 * to 00:00:00.000 IST (18:30:00 UTC previous day).
 *
 * @param {Date|string} dateInput
 * @returns {{ normalizedDate: Date, dateKey: string }}
 */
const normalizeAtelierAppointmentDate = (dateInput) => {
  const { dateKey, startOfDay } = getAtelierDayRange(dateInput);
  return {
    dateKey,
    normalizedDate: startOfDay,
  };
};

module.exports = {
  ATELIER_TIMEZONE,
  getAtelierDateKey,
  getAtelierDayRange,
  isPastDateInAtelier,
  normalizeAtelierAppointmentDate,
};

