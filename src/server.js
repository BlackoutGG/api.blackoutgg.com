"use strict";

const moduleAlias = require("module-alias");
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

/*** START UP SERVER ***/
const app = require("./app.js");

app.listen(process.env.PORT || 3000, (err) => {
  console.log(`Server running at ${process.env.PORT}...`);
});

app.on("SIGINT", function gracefulShutdown() {
  console.log("[SIGINT]: Shutting down...");
  process.exitCode(0);
});
