"use strict";

// const moduleAlias = require("module-alias");

// const { fdir } = require("fdir");

// /*** SETUP MODEL PATHS ***/
// const models = new fdir()
//   .withFullPaths()
//   .withMaxDepth(3)
//   .filter((path) => /models/.test(path))
//   .crawl("./src/routes")
//   .sync();

// const aliases = models.reduce((obj, path) => {
//   const split = path.split("/");
//   const filename = split[split.length - 1].replace(".js", "");
//   obj[`$models/${filename}`] = path;
//   return obj;
// }, {});

// moduleAlias.addAliases(aliases);

/*** REGISTER MODULES ***/
require("module-alias/register");

/*** SETUP AND STARTUP UP SERVER ***/
const bootstrapApp = require("./app");
const http = require("http");
const redis = require("$services/redis");
const sub = redis.duplicate();

const verifySocketToken = require("$util/verifySocketToken");
const authenticateSocketClient = require("$util/authenticateSocketClient");
const onSignal = require("$util/onSignal");

const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createTerminus } = require("@godaddy/terminus");

const startServer = async function () {
  const server = http.createServer(await bootstrapApp());

  const io = new Server(server, {
    cors: {
      origins: ["*"],
    },
  });

  io.adapter(createAdapter(redis, sub));

  const indexAdapter = io.of("/index").adapter;

  io.of("/index")
    .use(verifySocketToken)
    .on("connection", authenticateSocketClient);

  indexAdapter.on("create-room", (room) => {
    console.log(`room ${room} was created.`);
  });

  indexAdapter.on("join-room", (room, id) =>
    console.log(`socket ${id} has joined room ${room}`)
  );

  server.listen(process.env.PORT || 3000, (err) => {
    console.log("\u2713", `Server running at ${process.env.PORT}...`);
  });

  createTerminus(server, {
    signals: ["SIGTERM"],
    onSignal: onSignal.bind(null, server, redis, io, require("../knex")),
  });
};

startServer();
