"use strict";
const Media = require("$models/Media");
const guard = require("express-jwt-permissions")();
const { uploadFiles } = require("$services/upload");
const { ADD_ALL_MEDIA } = require("$util/policies");
const { transaction } = require("objection");

const uploadFileMiddleware = async (req, res, next) => {
  const upload = uploadFiles({
    dest: `uploads/media/${req.user.username}-${req.user.id}/`,
    fields: [{ name: "media", maxCount: 10 }],
    bucket: process.env.AWS_BUCKET_NAME,
  });

  try {
    await upload.promise(req, res);
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const uploadMedia = async function (req, res, next) {
  const files = req.files.media;
  if (!files.length) {
    return res.sendStatus(500);
  }
  const data = files.map((file) => ({
    mimetype: file.contentType,
    url: file.location,
    storage_key: file.key,
    owner_id: req.user.id,
  }));

  console.log(data);

  const trx = await Media.startTransaction();

  try {
    await Media.query(trx).insert(data);
    await trx.commit();
    res.sendStatus(204);
  } catch (err) {
    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [guard.check([ADD_ALL_MEDIA]), uploadFileMiddleware],
  handler: uploadMedia,
};
