"use strict";
const requireDirectory = require("require-directory");
const blacklist = /models/;
const routes = requireDirectory(module, { exclude: blacklist });

const express = require("express");

const routeWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    if (process.env === "test" || process.env === "development") {
      console.log(err);
    }
    next(err);
  });
};

let m = {};

Object.keys(routes).forEach((key) => {
  m[key] = function () {
    const router = express.Router();
    Object.values(routes[key]).forEach((route) => {
      const method = route.method.toLowerCase();
      if (route.middleware && route.middleware.length) {
        router[method](route.path, route.middleware, route.handler);
      } else {
        router[method](route.path, route.handler);
      }
    });
    return router;
  };
});

module.exports = m;
