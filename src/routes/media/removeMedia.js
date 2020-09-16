"use strict";
const Media = require("./models/Media");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { deleteFiles } = require("$services/upload");
const { buildQuery, validate } = require("$util");

const validators = validate([query("keys.*").isString()]);

const removeMedia = async (req, res, next) => {
  try {
    const deleted = await deleteFiles(
      proces.env.AWS_BUCKET_NAME,
      req.query.keys
    );
    const media = await Media.transaction(async (trx) => {
      await Media.query(trx).whereIn(
        "s3_key",
        deleted.map((item) => item.Key)
      );
      const results = await buildQuery(
        Media.query(trx),
        req.query.page,
        req.query.limit
      );

      return results;
    });

    res.status(200).send({ media });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware: [guard.check("delete:media"), validators],
  handler: removeMedia,
};
