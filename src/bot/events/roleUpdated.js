"use strict";
const redis = require("$services/redis");
module.exports = {
  name: "roleUpdated",
  async execute(role) {
    console.log(role);
    await redis.del("discord");
  },
};
