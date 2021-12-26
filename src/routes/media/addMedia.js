"use strict";
const Media = require("$models/Media");
const guard = require("express-jwt-permissions")();
const { uploadFiles } = require("$services/upload");
const { ADD_ALL_MEDIA } = require("$util/policies");

const uploadFileMiddleware = async (req, res, next) => {
  const upload = uploadFiles({
    dest: `uploads/media/${req.user.id}-${req.user.username}/`,
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
  if (!files.length) return res.status(400).send("Invalid Files");

  const data = files.map((file) => ({
    mimetype: file.contentType,
    url: file.location,
    storage_key: file.key,
    owner_id: req.user.id,
  }));

  console.log(data);

  await Media.query().insert(data);
  res.status(200).send();
};

module.exports = {
  path: "/",
  method: "POST",
  middleware: [guard.check([ADD_ALL_MEDIA]), uploadFileMiddleware],
  handler: uploadMedia,
};
