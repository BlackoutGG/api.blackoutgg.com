"use strict";
const User = require("$models/User");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { client } = require("$bot");
const { raw } = require("objection");
const { VIEW_ALL_ADMIN } = require("$util/policies");

const getDashboardData = async (req, res, next) => {
  const chart = await User.query()
    .select(
      raw("COUNT (id) AS users, to_char(created_at, 'YYYY-MM-DD') AS day")
    )
    .whereRaw(raw("created_at >= current_date - interval '30 day'"))
    .groupBy("day")
    .orderBy("day");

  const discord = {
    status: !!client.readyAt,
    readyAt: client.readyAt,
  };

  console.log(discord);

  res.status(200).send({ chart, discord });
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [guard.check(VIEW_ALL_ADMIN)],
  handler: getDashboardData,
};
