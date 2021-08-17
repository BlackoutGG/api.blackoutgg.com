"use strict";
const redis = require("ioredis");
module.exports = {
  name: "roleDeleted",
  async execute(role) {
    console.log(role);
    await redis.del("discord");
  },
};
