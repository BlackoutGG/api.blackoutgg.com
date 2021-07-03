"use strict";
const User = require("$models/User");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;
const sanitize = require("sanitize-html");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate, buildQuery } = require("$util");
const { VIEW_ALL_ADMIN, ADD_ALL_USERS } = require("$util/policies");

const validators = validate([
  body("username")
    .notEmpty()
    .isAlphanumeric()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  body("email").notEmpty().isEmail().escape().normalizeEmail().trim(),
  body("password")
    .notEmpty()
    .escape()
    .trim()
    .customSanitizer((v) => sanitize(v)),
  body("active").isBoolean(),
  body("roles.*").optional().isNumeric(),
  body("policies.*").optional().isNumeric(),
  body("page").optional().isNumeric(),
  body("limit").optional().isNumeric(),
]);

const consoleLog = (req, res, next) => {
  console.log(req.body);
  next();
};

const insertFn = (credentials, roles, policies) => {
  const data = {
    "#id": "user",
    ...credentials,
  };

  if (roles && roles.length) {
    Object.assign(data, { roles: roles.map((id) => ({ id })) });
  }

  if (policies && policies.length) {
    const _policies = policies.map((id) => ({ id }));
    Object.assign(data, { policies: _policies });
  }

  return data;
};

const createUser = async function (req, res, next) {
  const filters = req.body.filters;

  const email = req.body.email,
    page = req.body.page,
    limit = req.body.limit,
    active = req.body.active,
    policies = req.body.policies,
    roles = req.body.roles;

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const password = await bcrypt.hash(req.body.password, salt);

  const creds = {
    username: req.body.username,
    active,
    email,
    password,
  };

  const insert = insertFn(creds, roles, policies);
  const options = { relate: true, unrelate: true };

  const { username, users } = await User.transaction(async (trx) => {
    const user = await User.query(trx)
      .insertGraph(insert, options)
      .returning("*");

    let query = User.query(trx)
      .withGraphFetched("[roles(nameAndId), policies]")
      .orderBy("id")
      .select("id", "avatar", "username", "email", "created_at");

    if (filters && Object.keys(filters).length) {
      console.log(filters);

      query = query.whereExists(
        User.relatedQuery("roles").whereIn("id", filters.id)
      );
    }

    const users = await buildQuery(query, page, limit);

    return { username: user.username, users };
  });

  res.status(200).send({ username, users });
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, ADD_ALL_USERS]),
    consoleLog,
    validators,
  ],
  handler: createUser,
};
