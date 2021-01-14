"use strict";
const { validate } = require("$util");
const { header } = require("express-validator");
const jwt = require("jsonwebtoken");

const logout = async function (req, res, next) {
  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2) {
      const token = parts[1];
      if (token) {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload && payload.jti) {
          await req.redis.del(`blacklist:${payload.jti}`);
        }
      }
    }
  }

  res.status(204).send();

  // try {
  //   if (req.headers && req.headers.authorization) {
  //     const parts = req.headers.authorization.split(" ");
  //     if (parts.length === 2) {
  //       const token = parts[1];
  //       if (token) {
  //         const payload = jwt.verify(token, process.env.JWT_SECRET);
  //         if (payload && payload.jti) {
  //           await req.redis.del(`blacklist:${payload.jti}`);
  //         }
  //       }
  //     }
  //   }

  // res.status(204).send();
  // } catch (err) {
  //   console.log(err);
  //   next(err);
  // }
};

module.exports = {
  path: "/logout",
  method: "POST",
  middleware: [validate([header("Authorization").notEmpty()])],
  handler: logout,
};
