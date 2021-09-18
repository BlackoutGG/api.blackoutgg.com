"use strict";
const { fdir } = require("fdir");
const express = require("express");
const router = express.Router();
const routeDir = "/routes";

const resolve = (route) => (req, res, next) =>
  Promise.resolve(
    route(req, res, next).catch((err) => {
      console.log(err);
      next(err);
    })
  );

const toExclude = ["models", "helpers"];

const exclude = (dir) => toExclude.some((item) => dir.startsWith(item));

const filter = (path) => !path.endsWith("index.js");

const routes = new fdir()
  .withFullPaths()
  .withMaxDepth(2)
  .exclude(exclude)
  .filter(filter)
  .crawl(__dirname)
  .sync();

/** ALL ROUTE HANDLERS MUST BE AN ASYNC FUNCTION */

routes.forEach((r) => {
  const split = r.split(routeDir);
  const pathWithFilename = split[split.length - 1];
  const path = pathWithFilename.substr(0, pathWithFilename.lastIndexOf("/"));

  const route = require(r);

  if (route && route.path && route.handler) {
    const method = route.method.toLowerCase();
    if (route.middleware && route.middleware.length) {
      router[method](
        path.concat(route.path),
        route.middleware,
        resolve(route.handler)
      );
    } else {
      router[method](path.concat(route.path), resolve(route.handler));
    }
  }
});

module.exports = router;
