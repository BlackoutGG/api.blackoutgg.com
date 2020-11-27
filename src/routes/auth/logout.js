"use strict";
const User = require("$models/User");
const { validate } = require("$util");
const { header } = require("express-validator");

const logout = async function (req, res, next) {
  try {
    // const user = await User.query()
    //   .where("id", req.user.id)
    //   .patch({ token_id: null})
    //   .first()
    //   .returning("tokenId");

    await req.redis.del(`blacklist:${req.user.jti}`);

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
