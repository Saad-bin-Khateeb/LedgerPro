const moment = require("moment");

/**
 * Format date to readable string
 * @param {Date} date - Date object
 * @param {String} format - Moment format string
 * @returns {String} Formatted date
 */
const formatDate = (date, format = "DD-MMM-YYYY") => {
  if (!date) return "";
  return moment(date).format(format);
};

/**
 * Get days difference between two dates
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {Number} Days difference
 */
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs(date2 - date1) / oneDay);
};

/**
 * Add days to date
 * @param {Date} date - Starting date
 * @param {Number} days - Days to add
 * @returns {Date} New date
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Check if date is overdue
 * @param {Date} dueDate - Due date
 * @returns {Boolean} True if overdue
 */
const isOverdue = (dueDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
};

/**
 * Get fiscal year start and end
 * @param {Number} year - Fiscal year
 * @param {Number} startMonth - Starting month (0-11, default: 0 for January)
 * @returns {Object} Start and end dates
 */
const getFiscalYear = (year = new Date().getFullYear(), startMonth = 0) => {
  const start = new Date(year, startMonth, 1);
  const end = new Date(year + 1, startMonth, 0);
  return { start, end };
};

/**
 * Get date range for period
 * @param {String} period - today, week, month, quarter, year
 * @returns {Object} Start and end dates
 */
const getDateRange = (period) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(now.getMonth() - 3);
      break;
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1); // Default to last 30 days
  }

  return { start, end };
};

module.exports = {
  formatDate,
  daysBetween,
  addDays,
  isOverdue,
  getFiscalYear,
  getDateRange
};