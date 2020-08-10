"use strict";
/*** SETUP MODEL PATHS ***/
const moduleAlias = require("module-alias");
const { fdir } = require("fdir");

const models = new fdir()
  .withFullPaths()
  .withMaxDepth(2)
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

/*** START UP SERVER ***/
const app = require("./app.js");
const server = app.listen(process.env.PORT || 3000);

/*** SETUP SOCKETS ***/
// const io = require("socket.io")(server);
// require("./sockets.js")(io);
