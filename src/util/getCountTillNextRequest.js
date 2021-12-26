"use strict";
const { parseISO, isValid, addMinutes, isFuture } = require("date-fns");

/**
 * Returns an object with the endTime till another request can be made.
 * @param {date} lastSent Date object representation when the last activation email was sent.
 * @param {number} minutesToAdd Number of minutes before another activation request can be made.
 */
module.exports = function getCountTillNextRequest(lastSent, minutesToAdd) {
  let last;
  if (!isValid(lastSent)) last = parseISO(lastSent);
  else last = lastSent;

  const expiry = addMinutes(last, minutesToAdd);

  const result = {};

  if (isFuture(expiry)) {
    const endTime = expiry.getTime();
    Object.assign(result, { startTimer: true, endTime });
  } else {
    Object.assign(result, { startTimer: false, endTime: 0 });
  }

  return result;
};
