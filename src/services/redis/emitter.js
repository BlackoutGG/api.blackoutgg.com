"use strict";
const redis = require("./index.js");
const { Emitter } = require("@socket.io/redis-emitter");

module.exports = new Emitter(redis);
