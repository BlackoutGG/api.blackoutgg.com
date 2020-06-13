"use strict";
/*** SETUP MODEL PATHS ***/
const moduleAlias = require("module-alias");

const models = require("./util/returnPaths")(module, "./routes", {
  include: /models/,
});

const aliases = models.reduce((obj, [key, path]) => {
  obj[`$models/${key}`] = path;
  return obj;
}, {});

moduleAlias.addAliases(aliases);

/*** REGISTER MODULES ***/
require("module-alias/register");

/*** START UP SERVER ***/
const app = require("./app.js");
const server = app.listen(process.env.PORT || 3000);

/*** SETUP SOCKETS ***/
const io = require("socket.io")(server);
require("./sockets.js")(io);
