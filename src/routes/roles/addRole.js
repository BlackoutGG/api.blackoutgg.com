"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const pick = require("lodash").pick;
const { body } = require("express-validator");
const { validate, buildQuery } = require("$util");

const consoleLog = (req, res, next) => {
  console.log(req.body, req.query);
  next();
};

const middleware = [
  guard.check("add:roles"),
  consoleLog,
  validate([
    body("details.name").isAlphanumeric().escape().trim(),
    body("page").optional().isNumeric(),
    body("limit").optional().isNumeric(),
    body("details.level")
      .isNumeric()
      .custom((v, { req }) => v >= req.user.level),
    body("permissions.*").optional().isNumeric(),
  ]),
];

const graphFn = (role) => {
  const { permissions, ...r } = role;
  const data = {
    name: r.details.name,
    level: r.details.level,
  };

  if (permissions && permissions.length) {
    Object.assign(data, {
      role_perms: permissions.map((perm) => ({ perm_id: perm })),
    });
  }

  return data;
};

const addRole = async function (req, res, next) {
  const insert = graphFn(req.body);

  const roles = await Roles.transaction(async (trx) => {
    await Roles.query(trx).insertGraph(insert, { relate: true }).returning("*");

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

  // try {
  //   const roles = await Roles.transaction(async (trx) => {
  //     await Roles.query(trx)
  //       .insertGraph(insert, { relate: true })
  //       .returning("*");

  //     const results = await buildQuery(
  //       Roles.query(trx).select(
  //         "id",
  //         "name",
  //         "level",
  //         "created_at",
  //         "updated_at"
  //       ),
  //       req.body.page,
  //       req.body.limit
  //     );

  //     return results;
  //   });

  //   res.status(200).send({ roles });
  // } catch (err) {
  //   console.log(err);
  //   next(err);
  // }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware,
  handler: addRole,
};
