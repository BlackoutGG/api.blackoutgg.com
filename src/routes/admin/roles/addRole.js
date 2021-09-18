"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const pick = require("lodash").pick;
const { body } = require("express-validator");
const { validate, buildQuery } = require("$util");
const { VIEW_ALL_ADMIN, ADD_ALL_ROLES } = require("$util/policies");

const consoleLog = (req, res, next) => {
  console.log(req.body, req.query);
  next();
};

const middleware = [
  guard.check([VIEW_ALL_ADMIN, ADD_ALL_ROLES]),
  consoleLog,
  validate([
    body("details.name").isAlphanumeric().escape().trim(),
    body("page").optional().isNumeric(),
    body("limit").optional().isNumeric(),
    body("details.level")
      .isNumeric()
      .custom((v, { req }) => v >= req.user.level),
    body("policies.*").optional().isNumeric(),
  ]),
];

const graphFn = (role) => {
  const { policies, ...r } = role;
  const data = {
    name: r.details.name,
    level: r.details.level,
  };

  if (policies && policies.length) {
    Object.assign(data, {
      policies: policies.map((perm) => ({ id: perm })),
    });
  }

  if (discord_roles && discord_roles.length) {
    Object.assign(data, {
      discord_roles: maps.map((discord_role_id) => ({ discord_role_id })),
    });
  }

  return data;
};

const addRole = async function (req, res, next) {
  const insert = graphFn(req.body);

  const roles = await Roles.transaction(async (trx) => {
    await Roles.query(trx)
      .insertGraph(insert, { relate: true, noDelete: true })
      .returning("*");

    const results = await buildQuery(
      Roles.query(trx).select(
        "id",
        "name",
        "level",
        "created_at",
        "updated_at"
      ),
      req.body.page,
      req.body.limit
    );

    return results;
  });

  res.status(200).send({ roles });
};

module.exports = {
  path: "/",
  method: "POST",
  middleware,
  handler: addRole,
};
