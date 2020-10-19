"use strict";
const Media = require("./models/Media");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { deleteFiles } = require("$services/upload");
const { buildQuery, validate } = require("$util");

const validators = validate([query("keys.*").isString()]);

const removeMedia = async (req, res, next) => {
  try {
    const s3 = await deleteFiles(process.env.AWS_BUCKET_NAME, req.query.keys);
    if (!s3.Errors.length && s3.Deleted.length) {
      const ids = await Media.transaction(async (trx) => {
        const results = await Media.query(trx)
          .delete()
          .whereIn("storage_key", req.query.keys)
          .returning(["id"]);

        return results.map(({ id }) => id);
      });
      return res.status(200).send({ ids });
    }

    throw new Error("Encountered an internal problem.");
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware: [guard.check("delete:media"), validators],
  handler: removeMedia,
};
