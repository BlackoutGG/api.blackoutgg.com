"use strict";
const Redis = require("ioredis");

// const connectRedis = () => {
//   const redis = new Redis();
//   return redis;
// };

// const client = connectRedis();

module.exports = new Redis();
