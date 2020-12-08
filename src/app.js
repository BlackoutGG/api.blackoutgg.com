"use strict";
/*** DEPENDENCIES ***/
const express = require("express");
const app = express();
const cors = require("cors");
const expressJwt = require("express-jwt");
const aws = require("aws-sdk");
const routes = require("./routes");
const errorHandler = require("./middleware/errors");

/** SETUP PG TO USE RANGE */
const pg = require("pg");
require("pg-range").install(pg);

/*** SETUP REDIS  ***/
const Redis = require("ioredis");
const redis = new Redis();

const apiVersion = "/api";

if (
  process.env.NODE_ENV === "debug" ||
  process.env.NODE_ENV === "development"
) {
  const pino = require("express-pino-logger")();
  app.use(pino);
}

/*** SETUP CORS ***/
app.use(
  cors({
    origin: "*",
    exposedHeaders: ["Content-Range", "Content-Length", "Authorization"],
  })
);

/*** INJECT REDIS INTO RESPONSE ***/
app.use(function (req, res, next) {
  req.redis = redis;
  next();
});

/*** SETUP AUTHENTICATION FOR ROUTES ***/
app.use(
  expressJwt({
    secret: process.env.JWT_SECRET,
    isRevoked: require("$util/revokeToken.js"),
  }).unless({
    path: [
      "/",
      `${apiVersion}/auth/login`,
      `${apiVersion}/auth/discord/state`,
      `${apiVersion}/auth/discord`,
      `${apiVersion}/auth/logout`,
      `${apiVersion}/users/register`,
    ],
  })
);

/*** SETUP BODY PARSER ***/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*** PARSE NESTED FILTERS */
app.use(function (req, res, next) {
  if (req.query.filters && Object.keys(req.query.filters)) {
    req.query.filters = JSON.parse(req.query.filters);
  }
  next();
});

/*** SETUP INDEX ROUTE ***/
app.get("/", (req, res) => {
  res.status(200).send("HELLO WORLD");
});

/*** SETUP KNEX AND OBJECTION ***/
require("./util/setupDB")();

/** SETUP ROUTES */
app.use(apiVersion, routes);

/*** SETUP ERROR HANDLING ***/
app.use(errorHandler);

module.exports = app;
