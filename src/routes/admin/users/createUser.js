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

const insertFn = (credentials, roles) => {
  const data = {
    "#id": "user",
    ...credentials,
  };

  if (roles && roles.length) {
    const user_roles = roles.map((roleId) => ({
      user_id: "#{refuser.id}",
      role_id: roleId,
    }));

    Object.assign(data, { user_roles });
  }
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

    const creds = {
      username,
      email,
      password,
    };

    const users = await User.transaction(async (trx) => {
      const result = await User.query(trx).insertGraph(insertFn(creds, roles), {
        allowRefs: true,
      });

      const query = User.query(trx)
        .select("id", "avatar", "username", "email", "created_at")
        .withGraphFetched("roles");

      const list = await buildQuery(query, req.query.page, req.query.limit);

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
