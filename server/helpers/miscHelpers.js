/**
 * File for miscellaneous helper functions.
 */

/**
 * Calculates the elapsed time in microseconds since the specified start time.
 * @param {Array<number>} start - The start time captured.
 * @returns {number} The elapsed time in microseconds.
 */
function getDurationMicroseconds(start) {
  const finish = process.hrtime(start);
  const microseconds = parseInt(finish[0] * 1e6 + finish[1] / 1e3);
  return microseconds;
}

/**
 * Validates a date range.
 * @param {string} from - The start date of the range (format: "YYYY-MM-DDTHH:mm:ss").
 * @param {string} to - The end date of the range (format: "YYYY-MM-DDTHH:mm:ss").
 * @returns {boolean} Returns true if the date range is valid, otherwise false.
 */
function validateDateRange(from, to) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

  // Check if both from and to are undefined
  if (from === undefined && to === undefined) {
    return true;
  }

  // If either from or to is missing or not in the correct format, return false
  if (
    from === undefined ||
    to === undefined ||
    !dateRegex.test(from) ||
    !dateRegex.test(to)
  ) {
    return false;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  return fromDate < toDate;
}

/**
 * Validates whether a given word contains only letters.
 * @param {string} word - The word to validate.
 * @returns {boolean} Returns true if the word contains only letters, otherwise false.
 */
function validateWord(word) {
  if (typeof word !== "string" || word.trim() === "") {
    return false;
  }

  const regex = /^[a-zA-Z]+$/;
  return regex.test(word);
}

module.exports = { getDurationMicroseconds, validateDateRange, validateWord };
