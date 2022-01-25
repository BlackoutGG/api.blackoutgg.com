"use strict";
/*** DEPENDENCIES ***/
const express = require("express");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const aws = require("aws-sdk");
const expressJwt = require("express-jwt");
const pino = require("express-pino-logger")();
const Settings = require("$models/Settings");

/*** SETUP S3 CONFIG ***/
aws.config.update({
  secretAccessKey: process.env.AWS_SECRET,
  accessKeyId: process.env.AWS_ACCESS_ID,
  region: process.env.AWS_REGION,
});

/** SETUP PG TO USE RANGE */
const pg = require("pg");
require("pg-range").install(pg);

const apiVersion = "/api";

const bootstrapApp = async () => {
  if (
    process.env.NODE_ENV === "debug" ||
    process.env.NODE_ENV === "development"
  ) {
    app.use(pino);
  }

  /** SETUP HELMET */
  app.use(helmet());

  /*** SETUP CORS ***/
  app.use(
    cors({
      origin: "*",
      exposedHeaders: ["Content-Range", "Content-Length", "Authorization"],
    })
  );

  /*** SETUP KNEX AND OBJECTION ***/
  require("./util/setupDB")();

  /*** SETUP AUTHENTICATION FOR ROUTES ***/
  app.use(
    expressJwt({
      secret: process.env.JWT_SECRET,
      isRevoked: require("$util/revokeToken.js"),
      algorithms: ["HS256"],
    }).unless({
      path: [
        "/",
        `${apiVersion}/auth/login`,
        `${apiVersion}/auth/refresh`,
        `${apiVersion}/auth/discord`,
        `${apiVersion}/auth/logout`,
        `${apiVersion}/users/register`,
        `${apiVersion}/users/activation`,
        /^\/api\/users\/password-reset(?:\/([^\/]+?))?\/?$/i,
        `${apiVersion}/users/resend/activation`,
        `${apiVersion}/social/discord/link`,
        `${apiVersion}/users/update-password`,
        `${apiVersion}/settings`,
      ],
    })
  );

  /*** SETUP BODY PARSER ***/
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  /*** PARSE NESTED FILTERS */
  app.use((req, res, next) => {
    if (req.query.filters && Object.keys(req.query.filters)) {
      req.query.filters = JSON.parse(req.query.filters);
    }
    next();
  });

  /*** SETUP INDEX ROUTE ***/
  app.get("/", (req, res) => {
    res.status(200).send("HELLO WORLD");
  });

  /** SETUP ROUTES */
  app.use(apiVersion, require("./routes"));

  /** START BOT */
  const { createBot } = require("./bot");
  const settings = await Settings.query().select("enable_bot").first();
  createBot(settings.enable_bot);

  /*** SETUP ERROR HANDLING ***/
  app.use(require("./middleware/errors"));

  return app;
};

module.exports = bootstrapApp;
