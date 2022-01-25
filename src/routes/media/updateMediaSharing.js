"use strict";
const Media = require("$models/Media");
const Settings = require("$models/Settings");
const { param, body } = require("express-validator");
const { transaction } = require("objection");

const userList = (req, key) => {
  return Array.isArray(req.body[key])
    ? req.body[key].length > 1
      ? req.body[key]
      : req.body[key][0]
    : req.body[key];
};

const updateMediaSharing = async function (req, res, next) {
  const { enable_account_media_sharing } = await Settings.query()
    .select("enable_account_media_sharing")
    .first();

  if (!enable_account_media_sharing) {
    return res.sendStatus(422);
  }

  const result = {};

  const add = userList(req, "add");
  const remove = userList(req, "remove");

  const trx = await Media.startTransaction();

  try {
    if (add || (Array.isArray(add) && add.length)) {
      const added = await Media.relatedQuery("media_shared_users", trx)
        .for(req.params.id)
        .relate(add);
      Object.assign(result, { added });
    }

    if (remove) {
      let removed = Media.relatedQuery("media_shared_users", trx)
        .for(req.params.id)
        .unrelate();
      if (Array.isArray(remove) && remove.length) {
        removed = removed.whereIn("users.id", remove);
      } else {
        removed = removed.where("users.id", remove);
      }

      Object.assign(result, { removed: await removed });
    }

    await trx.commit();

    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/share/:id",
  method: "PATCH",
  middleware: [
    param("id").notEmpty().isUUID(),
    body("add.*").optional().isNumeric(),
    body("remove.*").optional().isNumeric(),
  ],
  handler: updateMediaSharing,
};
