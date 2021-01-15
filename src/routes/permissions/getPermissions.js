"use strict";
const Permissions = require("./models/Permissions.js");
const guard = require("express-jwt-permissions")();

const getPermissions = async function (req, res, next) {
  const permissions = await Permissions.query().where(
    "level",
    ">=",
    req.user.level
  );
  res.status(200).send({ permissions });
};

// const getPermissionsForLevel = async function (req, res, next) {
//   console.log(req.user.level);
//   try {
//     const permissions = await Permissions.query().where(
//       "level",
//       ">=",
//       req.user.level
//     );
//     res.status(200).send({ permissions });
//   } catch (err) {
//     console.log(err);
//     next(err);
//   }
// };

module.exports = {
  path: "/",
  method: "GET",
  // middleware: [guard.check(["view:roles", "update:roles"])],
  handler: getPermissions,
};
