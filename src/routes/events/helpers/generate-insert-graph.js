"use strict";
const generateDates = require("./generate-dates.js");

module.exports = function generateGraph(user_id, body) {
  const {
    start_date,
    start_time,
    end_date,
    end_time,
    interval,
    roles,
    duration,
    ...fields
  } = body;

  const occurrences = generateDates(start_date, start_time, interval, duration);

  const data = {
    "#id": "event",
    user_id,
    interval,
    ...fields,
    start_time,
    end_time,
    occurrences,
  };

  if (roles && roles.length) {
    Object.assign(data, {
      roles: roles.map((role) => ({
        role_id: role,
      })),
    });
  }

  return data;
};
