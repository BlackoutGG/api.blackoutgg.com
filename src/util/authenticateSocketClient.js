"use strict";
const redis = require("$services/redis");

module.exports = async function authentiateSocketClient(socket) {
  let verified = null;

  if (socket.handshake.auth.token || socket.handshake.query.token) {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    try {
      verified = await verifySocketUser(token, process.env.JWT_REFRESH_SECRET);

      if (!verified) {
        const error = new Error("UNAUTHORIZED");
        error.data = { content: "Please retry later." };
        socket.disconnect(true);
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
      socket.disconnect(true);
    }
  } else {
    return socket.disconnect(true);
  }

  socket.conn.on("packet", async (packet) => {
    if (socket.auth && packet.type === "pong") {
      await redis.set(`users:${verified.id}`, verified.id, "EX", 30);
    }
  });

  socket.conn.on("disconnect", async () => {
    if (socket.user) {
      await redis.del(`users:${verified.id}`);
    }
  });
};
