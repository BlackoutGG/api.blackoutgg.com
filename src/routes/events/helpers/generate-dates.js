"use strict";
const { nanoid } = require("nanoid");
const { RRule } = require("rrule");
const { addDays, addMonths, parseISO } = require("date-fns");

const getFrequency = (interval) => {
  switch (interval) {
    case "weekly":
      return RRule.WEEKLY;
    case "monthly":
      return RRule.MONTHLY;
    case "yearly":
      return RRule.YEARLY;
    default:
      return RRule.DAILY;
  }
};

module.exports = function generateDates(
  start_date,
  start_time,
  interval,
  duration
) {
  const group_id = nanoid();

  if (interval && interval === "once") {
    const endDate = addDays(parseISO(start_date), duration)
      .toISOString()
      .split("T")[0];

    return [{ group_id, start_date, end_date: endDate }];
  }

  const startDate = start_date.split("-");
  const startTime = start_time.split(":");

  const until = addMonths(parseISO(start_date), 6)
    .toISOString()
    .split("T")[0]
    .split("-");

  const dtstart = new Date(
    Date.UTC(
      startDate[0],
      startDate[1] - 1,
      startDate[2],
      startTime[0],
      startTime[1]
    )
  );

  const rule = new RRule({
    freq: getFrequency(interval),
    dtstart,
    wkst: RRule.MO,
    interval: 1,
    until: new Date(Date.UTC(until[0], until[1] - 1, until[2])),
  });

  const dates = rule.all().map((_start, idx) => {
    const startISO = _start.toISOString();
    const startSplit = startISO.split("T");

    const endDate = addDays(parseISO(startSplit[0]), duration)
      .toISOString()
      .split("T")[0];

    return {
      group_id,
      start_date: startSplit[0],
      end_date: endDate,
    };
  });

  return dates;
};
