"use strict";
const Event = require("./models/Event");
const Range = require("pg-range").Range;
const guard = require("express-jwt-permissions")();

const pick = require("lodash/pick");
const columns = require("./helpers/columns");

const { body } = require("express-validator");
const { validate } = require("$util");

const differenceInCalendarDays = require("date-fns/differenceInCalendarDays");
const addDays = require("date-fns/addDays");

const { RRule } = require("rrule");
const nanoid = require("nanoid");

const validators = validate([
  body("title").isString().escape().trim(),
  body("color").optional().isString().escape().trim(),
  body("category").optional().isNumeric(),
  body("start_date").isString().escape().trim(),
  body("end_date").optional().isString().escape().trim(),
  body("start_time").isString().escape().trim(),
  body("end_time").optional().isString().escape().trim(),
  body("description").optional().isString().escape().trim(),
  // body("roles.*").optional().isNumeric(),
  body("rvsp").optional().isBoolean(),
]);

const values = [...columns, "category", "organizer"];

const log = (req, res, next) => {
  console.log(req.body);
  next();
};

// const graphFn = (userId, start, end, fields, roles) => {
//   const data = {
//     "#id": "event",
//     duration: Range(start, end),
//     start_date: start,
//     end_date: end,
//     user_id: userId,
//     ...fields,
//   };

//   if (roles && roles.length) {
//     Object.assign(data, {
//       roles: roles.map((role) => ({
//         role_id: role,
//       })),
//     });
//   }

//   return data;
// };

// const addEvent = async function (req, res, next) {
//   const { roles, start_date, end_date, filters, ...fields } = req.body;

//   const insert = graphFn(req.user.id, start_date, end_date, fields);

//   try {
//     const event = await Event.transaction(async (trx) => {
//       const result = await Event.query(trx)
//         .insertGraph(insert)
//         .columns(values)
//         .withGraphFetched(
//           "[category(defaultSelects), organizer(defaultSelects)]"
//         );

//       if (filters && Object.keys(filters).length) {
//         if (filters.category_id.includes(result.category_id)) {
//           return pick(result, values);
//         }
//       }

//       return pick(result, values);
//     });

//     res.status(200).send({ event });
//   } catch (err) {
//     console.log(err);
//     next(err);
//   }
// };

const getFrequency = (interval) => {
  switch (interval) {
    case "weekly":
      return RRule.WEEKLY;
    case "monthly":
      return RRule.MONTHLY;
    case "yearly":
      return RRule.YEARLY;
    default:
      break;
  }
};

const graphFn = (userId, start, end, interval, fields, roles) => {
  const data = {
    "#id": "event",
    user_id: userId,
    ...fields,
  };

  if (roles && roles.length) {
    Object.assign(data, {
      roles: roles.map((role) => ({
        role_id: role,
      })),
    });
  }

  if (interval && interval !== "once") {
    const rule = new RRule({
      freq: getFrequence(interval),
      dstart: start,
      interval: 1,
    });

    const occurances = rule.all().map((_start, idx) => {
      let endOfEvent = end;
      if (idx > 0) {
        const endEventDate = addDays(_start, duration);
        endOfEvent = new Date().toISOString(
          endEventDate.split("T")[0] + " " + fields.end_time
        );
      }
      return {
        group_id: nanoid(),
        start: _start,
        end: endOfEvent,
      };
    });

    Object.assign(data, { occurances });
  }

  return data;
};

const select = [
  "events.id as base_id",
  "occurences.id as id",
  "all_day",
  "title",
  "color",
  "category_id",
  "description",
  "occurences.start as start",
  "occurence.end as end",
  "rvsp",
  "category",
  "organizer",
];

const addEvent = async function (req, res, next) {
  const {
    roles,
    start_date,
    end_date,
    interval,
    filters,
    recurring,
    ...fields
  } = req.body;

  const insert = graphFn(req.user.id, start_date, end_date, interval, fields);

  try {
    const events = await Event.transaction(async (trx) => {
      const entry = await Event.query(trx).insertGraph(insert, {
        relate: true,
      });

      const results = Event.query(trx)
        .joinRelated("occurrances")
        .where("events.id", entry.id)
        // .where(raw("daterange('start', 'end', '[])' && '[??, ??)'", start, end))
        .withGraphFetched(
          "[category(defaultSelects), organizer(defaultSelects)]"
        )
        .select(select);

      return results;
    });

    res.status(200).send({ events });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [guard.check("add:events"), log],
  handler: addEvent,
};
