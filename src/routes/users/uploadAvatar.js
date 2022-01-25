"use strict";
const uploadFile = require("$services/upload");
const Media = require("$models/Media");
const guard = require("express-jwt-permissions")();
const User = require("$models/User");
const { transaction } = require("objection");
const { ADD_OWN_MEDIA } = require("$util/policies");

const uploadAvatarMiddleware = async (req, res, next) => {
  const userId = req.user.id,
    username = req.user.username;

  const upload = uploadFile({
    dest: `uploads/avatar/${username}-${userId}/`,
    filename: "avatar",
    fields: [{ name: "avatar", maxCount: 1 }],
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

const uploadAvatar = async function (req, res, next) {
  if (!req.files.avatar.length) {
    return res.status(400).send("Invalid Files");
  }

  const avatar = req.files.avatar[0];

  const data = {
    mimetype: avatar.contentType,
    url: avatar.location,
    storage_key: avatar.key,
    owner_id: req.user.id,
  };

  const trx = await Media.startTransaction();

  try {
    const media = await Media.query(trx).insert(data).returning("url");
    await trx.commit();

    res.status(200).send({ avatar_url: media.url });
  } catch (err) {
    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/upload-avatar",
  method: "POST",
  middleware: [guard.check([ADD_OWN_MEDIA]), uploadAvatarMiddleware],
  handler: uploadAvatar,
};
