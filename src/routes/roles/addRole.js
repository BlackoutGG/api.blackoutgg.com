"use strict";
const Roles = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { body } = require("express-validator");
const { validateRequest } = require("$util");

const isObject = (val) =>
  val && typeof val === "object" && val.constructor === Object;

const middleware = [
  guard.check("roles:add"),
  body("name").not().isEmpty().isAlphanumeric().escape().trim(),
  body("permissions").custom((value) => {
    if (!isObject(value)) return false;
    return Object.keys(value).every((key) => typeof value[key] === "boolean");
  }),
  validateRequest,
];

const addRole = async function (req, res) {
  const data = {
    name: req.body.name,
    ...req.body.permissions,
  };

  try {
    const role = await Roles.query().insert(data).returning("name");
    res.status(200).send({ role });
  } catch (err) {
    next(new Error(err));
  }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware,
  handler: addRole,
};
