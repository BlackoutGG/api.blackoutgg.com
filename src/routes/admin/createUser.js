"use strict";
const User = require("$models/User");
const UserRoles = require("$models/UserRole");

const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validate } = require("$util");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 12;

const isObject = (val) => {
  return (
    val &&
    typeof val === "object" &&
    !Array.isArray(val) &&
    val.constructor === "Object"
  );
};

const validators = validate([
  body("username").notEmpty().isAlphanumeric().escape().trim(),
  body("email").notEmpty().isEmail().escape().normalizeEmail().trim(),
  body("password").notEmpty().escape().trim(),
  body("roles").custom((v) => Array.isArray(v)),
  body("page").isNumeric(),
  body("limit").isNumeric(),
]);

const consoleLog = (req, res, next) => {
  console.log(req.body);
  next();
};

/**
 * Returns a collection of users with from the database.
 * @param {Object<promise>} trx The transaction for the database query
 * @param {Number} page the offset for the range
 * @param {Number} limit the end for the range
 * @returns {Array}
 */
const query = async (trx, page, limit) =>
  buildQuery.call(
    User.query(trx)
      .select("id", "avatar", "username", "email", "created_at")
      .withGraphFetched("roles"),
    page,
    limit
  );

const createUser = async function (req, res, next) {
  let username = req.body.username,
    email = req.body.email,
    roles = req.body.roles;

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const password = await bcrypt.hash(req.body.password, salt);

    const credentials = {
      username,
      email,
      password,
    };

    const users = await User.transaction(async (trx) => {
      const result = await User.query(trx)
        .insert(credentials)
        .returning(["id", "username"]);

      roles = roles.map((roleId) => ({ user_id: result.id, role_id: roleId }));

      await UserRoles.query(trx).insert(roles).returning("*");

      const users = await query(trx, req.body.page, req.body.limit);

      users.results = users.results.map((user) => {
        return {
          id: user.id,
          avatar: user.avatar,
          username: user.username,
          email: user.email,
          roles: user.getRoles(),
          joined_on: user.created_at,
        };
      });

      return { user: result.username, users };
    });

    res.status(200).send(users);
  } catch (err) {
    console.log(err);
    next(new Error(err));
  }
};

module.exports = {
  path: "/users/create",
  method: "POST",
  middleware: [guard.check("users:add"), validators],
  handler: createUser,
};
