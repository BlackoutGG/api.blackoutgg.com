"use strict";
const User = require("$models/User");
const { validate } = require("$util");
const { header } = require("express-validator");
const jwt = require("jsonwebtoken");

const logout = async function (req, res, next) {
  try {
    // const user = await User.query()
    //   .where("id", req.user.id)
    //   .patch({ token_id: null})
    //   .first()
    //   .returning("tokenId");

    if (req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2) {
        const token = parts[1];
        if (token) {
          const payload = jwt.verify(token, { secret: process.env.JWT_SECRET });
          if (payload && payload.jti) {
            await req.redis.del(`blacklist:${payload.jti}`);
          }
        }
      }
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/logout",
  method: "POST",
  middleware: [validate([header("Authorization").notEmpty()])],
  handler: logout,
};
