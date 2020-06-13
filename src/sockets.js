"use strict";

module.exports = function (io) {
  /*** SETUP SOCKETS ***/
  io.origins(["*:*"]);

  io.on("connection", (socket) => {
    console.log("user connected to map.");

    socket.on("disconnect", () => {
      console.log("user has disconnected");
    });

    socket.on("join", (key) => {
      socket.join(key);
    });

    socket.on("add", async (data) => {
      // console.log(`Received pin at coordinates: ${data}...`);
      // io.emit("update", data);
    });

    socket.on("remove", async (data) => {
      console.log(`Removing a pin with the index of ${idx}`);

      io.to(data.key).emit("remove", data.idx);
    });
  });

  return io;
};
