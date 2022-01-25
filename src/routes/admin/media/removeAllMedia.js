"use strict";
const Media = require("$models/Media");
const guard = require("express-jwt-permissions")();
const { query } = require("express-validator");
const { deleteFiles } = require("$services/upload");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, DELETE_ALL_MEDIA } = require("$util/policies");
const { transaction } = require("objection");

const validators = validate([query("keys.*").isString()]);

const removeAllMedia = async (req, res, next) => {
  const trx = await Media.startTransaction();

  try {
    const s3 = await deleteFiles(process.env.AWS_BUCKET_NAME, req.query.keys);
    if (s3.Errors.length || !s3.Deleted.length) {
      return res
        .status(500)
        .send({ message: "Encountered an internal problem." });
    }

    const results = await Media.query(trx)
      .delete()
      .whereIn("storage_key", req.query.keys)
      .returning(["id"]);

    await trx.commit();

    const deleted = results.map(({ id }) => id);

    return res.status(200).send(deleted);
  } catch (err) {
    console.log(err);
    await trx.rollack();
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "DELETE",
  middleware: [guard.check([VIEW_ALL_ADMIN, DELETE_ALL_MEDIA]), validators],
  handler: removeAllMedia,
};
