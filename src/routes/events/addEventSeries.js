"use strict";
const Event = require("./models/Event");
const EventRoles = require("./models/EventRoles");
const guard = require("express-jwt-permissions")();
const differenceInCalendarWeeks = require("date-fns/differenceInCalendarWeeks");
const { body } = require("express-validator");
const { validate } = require("$util");
const uuid = require("uuidv4");

const validators = validate([
  // body("name").isAlphanumeric().escape().trim(),
  // body("color").optional().isString().escape().trim(),
  // body("category").optional().isNumeric(),
  body("month").isNumeric(),
  body("year").isNumeric(),
  body("startDate").isString().escape().trim(),
  body("endDate").optional().isString().escape().trim(),
  body("startTime").isString().escape().trim(),
  body("endTime").optional().isString().escape().trim(),
  body("description").optional().isString().escape().trim(),
  body("roles").isArray(),
  // body("rvsp").optional().isBoolean(),
]);

const log = (req, res, next) => {
  console.log(req.body);
  next();
};

const monthsPerYear = 12;
const weeksPerMonth = 4;
const daysPerMonth = 31;

const getDaysInMonth = (year, month, day) =>
  new Date(year, month, day).getDate();

const addEvent = async function (req, res, next) {
  const { roles, ...event } = req.body,
    userId = req.user.id,
    series = [],
    id = uuid();

  if (event.series) {
    let { year, month, day, startDate, endDate, interval, ...insert } = event;
    let startingDay = day;
    let startingMonth = month;
    let end = parseInt(endDate.split("/")[1], 10);

    event.id = id;
    series.push(event);

    if (interval.everyDay) {
      event.id = id;
      series.push(event);

      for (startingMonth; startingMonth <= numOfMonths; m++) {
        for (startingDay; startingDay <= getDaysInMonth(year, m, 0); d++) {
          series.push({
            id: uuid(),
            event_series_id: id,
            event_series: true,
            year,
            month: m,
            day: d,
            startDate: `${year}/${m}/${d}`,
            endDate: `${year}/${m}/${d}`,
            ...insert,
          });
        }
      }
    }

    if (interval.everyWeek) {
      for (startingMonth; startMonth <= numOfMonths; m++) {
        let next = m > 12 ? 12 : m;
        let remainingWeeks = differenceInCalendarWeeks(
          new Date(year, m, day),
          new Date(year, next, 0)
        );
        let startingWeek = weeksPerMonth - remainingWeeks;
        for (startingWeek; startingWeek <= remainingWeeks; w++) {
          const start = day + 7 * w;
          const end = day + 7 * w;
          results.push({
            id: uuid(),
            event_series_id: id,
            event_series: true,
            year,
            month: m,
            day: d,
            startDate: `${year}/${m}/${start}`,
            endDate: `${year}/${m}/${end}`,
            ...insert,
          });
        }
      }
    }

    if (interval.everyMonth) {
      for (startingMonth; startingMonth <= numOfMonths; m++) {
        series.push({
          id: uuid(),
          event_series_id: id,
          event_series: true,
          year,
          month: m,
          day: day,
          startDate: `${year}/${m}/${day}`,
          endDate: `${year}/${m}/${day}`,
          ...insert,
        });
      }
    }
  }

  try {
    const results = await Event.transaction(async (trx) => {
      const toBeInserted = event.series
        ? series
        : Object.assign(event, { user_id: userId });
      const result = await Event.query(trx)
        .insert(toBeInserted)
        .returning("id");

      if (roles && roles.length) {
        await EventRoles.query(trx).insert(
          roles.map((role) => ({
            event_id: result.id,
            role_id: role,
          }))
        );
      }

      const event = await Event.query(trx)
        .where("id", result.id)
        .withGraphFetched(
          roles && roles.length
            ? `[category(defaultSelects), organizer(defaultSelects), roles]`
            : `[category(defaultSelects), organizer(defaultSelects)]`
        )
        .first();

      return event;
    });

    console.log(results);

    res.status(200).send({ event: results });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/series",
  method: "POST",
  middleware: [guard.check("events:add")],
  handler: addEvent,
};
