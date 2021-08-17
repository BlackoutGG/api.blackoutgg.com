"use strict";

module.exports = {
  name: "ready",
  once: true,
  execute(_, client) {
    console.log(`Discord bot ready!`);
  },
};
