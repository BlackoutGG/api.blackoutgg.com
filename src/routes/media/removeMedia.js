"use strict";
const Media = require("./models/Media");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { deleteFiles } = require("$services/upload");
const { buildQuery, validate } = require("$util");

const validators = validate([query("keys.*").isString()]);

const removeMedia = async (req, res, next) => {
  const s3 = await deleteFiles(process.env.AWS_BUCKET_NAME, req.query.keys);
  if (!s3.Errors.length && s3.Deleted.length) {
    // const ids = await Media.transaction(async (trx) => {
    //   const results = await Media.query(trx)
    //     .delete()
    //     .whereIn("storage_key", req.query.keys)
    //     .returning(["id"]);

    //   return results.map(({ id }) => id);
    // });

    const results = await Media.query()
      .delete()
      .whereIn("storage_key", req.query.keys)
      .returning(["id"]);

    const ids = results.map(({ id }) => id);
    return res.status(200).send({ ids });
  } else {
    res.status(500).send({ message: "Encountered an internal problem." });
  }
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware: [guard.check("delete:media"), validators],
  handler: removeMedia,
};
