"use strict";
const { validate } = require("$util");
const { header } = require("express-validator");
const redis = require("$services/redis");
const UserSession = require("$models/UserSession");
const jwt = require("jsonwebtoken");

const logout = async function (req, res, next) {
  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2) {
      const token = parts[1];
      if (token) {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload && payload.jti) {
          await UserSession.query().where("token_id", payload.jti).del();
          await redis.del(`blacklist:${payload.jti}`);
        }
      }
    }
  }

  res.status(204).send();
};

module.exports = {
  path: "/logout",
  method: "POST",
  middleware: [validate([header("Authorization").notEmpty()])],
  handler: logout,
};
