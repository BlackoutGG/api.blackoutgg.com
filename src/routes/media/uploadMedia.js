"use strict";
const Media = require("./models/Media");
const guard = require("express-jwt-permissions")();
const uploadService = require("$util/upload");

const upload = uploadService({
  fields: [{ name: "gallery", maxCount: 10 }],
  bucket: process.env.AWS_BUCKET_NAME,
});

const middleware = [guard.check("media:upload"), upload];

const uploadMedia = async function (req, res, next) {
  const files = req.files.gallery;
  if (!files.length) return res.status(400).send("Invalid Files");

  files.map((file) => ({
    mimetype: file.contentType,
    url: file.location,
    storage_key: file.key,
    user_id: req.user.id,
  }));

  try {
    await Media.query().insert(files);
    res.status(200).send();
  } catch (err) {
    next(err);
  }

  res.status(200).send("OK");
};

module.exports = {
  path: "/",
  method: "POST",
  middleware,
  handler: uploadMedia,
};
