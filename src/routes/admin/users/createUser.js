"use strict";
const User = require("$models/User");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate, buildQuery } = require("$util");

const validators = validate([
  body("username").notEmpty().isAlphanumeric().escape().trim(),
  body("email").notEmpty().isEmail().escape().normalizeEmail().trim(),
  body("password").notEmpty().escape().trim(),
  body("roles.*").optional().isNumeric(),
  body("page").optional().isNumeric(),
  body("limit").optional().isNumeric(),
]);

const consoleLog = (req, res, next) => {
  console.log(req.body);
  next();
};

const insertFn = (credentials, roles) => {
  const data = {
    "#id": "user",
    ...credentials,
  };

  if (roles && roles.length) {
    const user_roles = roles.map((roleId) => ({
      role_id: roleId,
    }));

    Object.assign(data, { user_roles });
  }

  return data;
};

const createUser = async function (req, res, next) {
  const filters = req.body.filters;

  const email = req.body.email,
    page = req.body.page,
    limit = req.body.limit,
    roles = req.body.roles;

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const password = await bcrypt.hash(req.body.password, salt);

    const creds = {
      username: req.body.username,
      email,
      password,
    };

    const insert = insertFn(creds, roles);
    const options = { relate: true };

    const { username, users } = await User.transaction(async (trx) => {
      const user = await User.query(trx)
        .insertGraph(insert, options)
        .returning("*");

      let query = User.query(trx)
        .withGraphFetched("roles(nameAndId)")
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
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [guard.check(["view:admin", "add:users"]), validators],
  handler: createUser,
};
