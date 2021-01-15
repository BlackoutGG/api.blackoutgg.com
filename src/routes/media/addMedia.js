"use strict";
const Media = require("./models/Media");
const guard = require("express-jwt-permissions")();
const { uploadFiles } = require("$services/upload");

const upload = uploadFiles({
  fields: [{ name: "media", maxCount: 10 }],
  bucket: process.env.AWS_BUCKET_NAME,
});

const middleware = [guard.check("add:media"), upload];

const uploadMedia = async function (req, res, next) {
  const files = req.files.media;
  if (!files.length) return res.status(400).send("Invalid Files");

  const data = files.map((file) => ({
    mimetype: file.contentType,
    url: file.location,
    storage_key: file.key,
    user_id: req.user.id,
  }));

  console.log(data);

  await Media.query().insert(data);
  res.status(200).send();
};

module.exports = {
  path: "/",
  method: "POST",
  middleware,
  handler: uploadMedia,
};
