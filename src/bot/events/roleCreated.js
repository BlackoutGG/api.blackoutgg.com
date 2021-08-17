"use strict";
const redis = require("ioredis");

module.exports = {
  name: "roleCreated",
  async execute(role) {
    console.log(role);
    await redis.del("discord");
  },
};
