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

/*** SETUP AUTHENTICATION FOR ROUTES ***/
app.use(
  expressJwt({
    secret: process.env.JWT_SECRET,
  }).unless({
    path: [
      "/",
      `${apiVersion}/auth/login`,
      `${apiVersion}/auth/discord/state`,
      `${apiVersion}/auth/discord`,
      `${apiVersion}/users/register`,
    ],
  })
);

/*** SETUP BODY PARSER ***/
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/*** INJECT REDIS INTO RESPONSE ***/
app.use(function (req, res, next) {
  req.redis = redis;
  next();
});

/*** SETUP S3 CONFIG ***/
aws.config.update({
  secretAccessKey: process.env.AWS_SECRET,
  accessKeyId: process.env.AWS_ACCESS_ID,
  region: process.env.AWS_REGION,
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
