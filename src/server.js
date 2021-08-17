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
const socketAuth = require("socketio-auth");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { verifySocketUser } = require("$util");

const startServer = async function () {
  const server = http.createServer(await bootstrapApp());
  const io = new Server(server);

  io.adapter(createAdapter(redis, sub));

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    try {
      const verified = await verifySocketUser(
        token,
        process.env.JWT_REFRESH_SECRET
      );

      if (!verified) {
        const error = new Error("UNAUTHORIZED");
        error.data = { content: "Please retry later." };
        return next(error);
      }

      socket.user = verified;
      socket.auth = true;

      await redis.set(`users${verified.id}`, socket.id, "NX", "EX", 30);
    } catch (err) {
      next(err);
    }

    socket.conn.on("packet", async (packet) => {
      if (socket.auth && packet.type === "ping") {
        await redis.set(`users${verified.id}`, socket.id, "NX", "EX", 30);
      }
    });

    socket.conn.on("disconnect", async (_socket) => {
      if (socket.user) {
        await redis.del(`users:${verified.id}`);
        _socket.auth = false;
        _socket.user = null;
      }
    });

    next();
  });

  io.listen(8080);

  // socketAuth(io, {
  //   authenticate: async (socket, data, callback) => {
  //     const { token } = data;

  //     try {
  //       const { id, username } = await verifySocketUser(
  //         token,
  //         process.env.JWT_REFRESH_SECRET
  //       );

  //       const canConnect = await redis.set(
  //         `users:${id}`,
  //         socket.id,
  //         "NX",
  //         "EX",
  //         30
  //       );

  //       if (!canConnect) {
  //         return callback({ message: "ALREADY_LOGGED_IN" });
  //       }

  //       const userData = { id, username };

  //       socket.user = userData;

  //       return callback(null, true);
  //     } catch (err) {
  //       console.log(`Socket ${socket.id} unauthorized`);
  //       return callback({ message: "UNAUTHORIZED" });
  //     }
  //   },
  //   postAuthenticate: async (socket) => {
  //     socket.conn.on("packet", async (packet) => {
  //       if (socket.auth && packet.type === "ping") {
  //         redis.set(`users:${id}`, socket.id, "NX", "EX", 30);
  //       }
  //     });
  //   },
  //   disconnect: async (socket) => {
  //     if (socket.user) {
  //       await redis.del(`users:${socket.user.id}`);
  //     }
  //   },
  // });

  server.listen(process.env.PORT || 3000, (err) => {
    console.log(`Server running at ${process.env.PORT}...`);
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
