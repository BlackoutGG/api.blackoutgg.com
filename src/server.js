"use strict";

const moduleAlias = require("module-alias");
const knex = require("knex");

const { fdir } = require("fdir");

/*** SETUP MODEL PATHS ***/
const models = new fdir()
  .withFullPaths()
  .withMaxDepth(3)
  .filter((path) => /models/.test(path))
  .crawl("./src/routes")
  .sync();

const aliases = models.reduce((obj, path) => {
  const split = path.split("/");
  const filename = split[split.length - 1].replace(".js", "");
  obj[`$models/${filename}`] = path;
  return obj;
}, {});

moduleAlias.addAliases(aliases);

/*** REGISTER MODULES ***/
require("module-alias/register");

/*** SETUP AND STARTUP UP SERVER ***/
const bootstrapApp = require("./app");
const http = require("http");
const redis = require("$services/redis");
const sub = redis.duplicate();
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { verifySocketUser } = require("$util");

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
    .use(async (socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      try {
        const verified = await verifySocketUser(
          token,
          process.env.JWT_REFRESH_SECRET
        );

        if (!verified) {
          socket.leave(`user:${verified.id}`);
          const error = new Error("UNAUTHORIZED");
          error.data = { content: "Please retry later." };
          return next(error);
        }

        socket.user = verified;
        socket.auth = true;
      } catch (err) {
        return next(err);
      }

      next();
    })
    .on("connection", async (socket) => {
      console.log("Connected:", socket.id);

      let verified = null;

      if (socket.handshake.auth.token || socket.handshake.query.token) {
        const token =
          socket.handshake.auth.token || socket.handshake.query.token;

        try {
          verified = await verifySocketUser(
            token,
            process.env.JWT_REFRESH_SECRET
          );

          if (!verified) {
            const error = new Error("UNAUTHORIZED");
            error.data = { content: "Please retry later." };
            return next(error);
          }

          if (await redis.exists(`users:${verified.id}`)) {
            socket.join(`user:${verified.id}`);
          } else {
            await redis.set(`users:${verified.id}`, verified.id, "EX", 30);
            socket.join(`user:${verified.id}`);
          }

          socket.user = verified;
          socket.auth = true;

          socket.join(`user:${verified.id}`);
        } catch (err) {
          return next(err);
        }
      } else {
        return next(new Error("Handshake missing property token."));
      }

      socket.conn.on("packet", async (packet) => {
        if (socket.auth && packet.type === "pong") {
          await redis.set(`users:${verified.id}`, verified.id, "EX", 30);
        }
      });

      socket.conn.on("disconnect", async () => {
        console.log("Disconnected");
        if (socket.user) {
          await redis.del(`users:${verified.id}`);
        }
      });
    });

  indexAdapter.on("create-room", (room) => {
    console.log(`room ${room} was created.`);
  });

  indexAdapter.on("join-room", (room, id) =>
    console.log(`socket ${id} has joined room ${room}`)
  );

  server.listen(process.env.PORT || 3000, (err) => {
    console.log("\u2713", `Server running at ${process.env.PORT}...`);
  });

  const { client } = require("./bot");

  process.on("SIGTERM", () => {
    console.log(
      "[SIGTERM]: cleaning up connections and shuting down sever...."
    );
    knex.destroy();
    client.destroy();
    server.close(() => {
      console.log("HTTP server closed.");
    });
  });
};

startServer();
