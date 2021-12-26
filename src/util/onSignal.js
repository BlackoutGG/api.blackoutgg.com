"use strict";
const { client } = require("$bot");

module.exports = function onShutdownSignal(server, redis, io, knex) {
  console.log("Shutting down the server...");
  server.close(() => {
    console.log("Server shutdown.");
    if (redis) redis.disconnect();
    if (io) io.close();
    if (knex) knex.destroy();
    client.destroy();
  });
};
