"use strict";
const guard = require("express-jwt-permissions")();
const Role = require("./models/Roles");

const getRolePermissionKeys = async function (req, res, next) {
  try {
    const result = await Role.query().where("id", 1).first();

    const keys = Object.keys(result).reduce((arr, key) => {
      if (/^can_/.test(key)) arr.push(key);
      return arr;
    }, []);

    res.status(200).send({ keys });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/keys",
  method: "GET",
  middleware: [guard.check(["roles:view", "roles:edit"])],
  handler: getRolePermissionKeys,
};
