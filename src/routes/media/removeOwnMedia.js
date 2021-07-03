"use strict";
const Media = require("$models/Media");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { deleteFiles } = require("$services/upload");
const { validate } = require("$util");
const { DELETE_OWN_MEDIA } = require("$util/policies");

const validators = validate([query("keys.*").isString()]);

const removeMedia = async (req, res, next) => {
  const s3 = await deleteFiles(process.env.AWS_BUCKET_NAME, req.query.keys);
  if (s3.Errors.length || !s3.Deleted.length) {
    return res
      .status(500)
      .send({ message: "Encountered an internal problem." });
  }
  const results = await Media.query()
    .delete()
    .whereIn("storage_key", req.query.keys)
    .where("owner_id", req.user.id)
    .returning(["id"]);

  const ids = results.map(({ id }) => id);
  return res.status(200).send({ ids });
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware: [guard.check([DELETE_OWN_MEDIA]), validators],
  handler: removeMedia,
};
