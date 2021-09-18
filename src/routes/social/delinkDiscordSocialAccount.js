"use strict";
const User = require("$models/User");
const UserRole = require("$models/UserRole");
const { transaction } = require("objection");

const delinkDiscordSocialAccount = async (req, res, next) => {
  const trx = await User.startTransaction();

  try {
    const userQuery = User.query(trx)
      .patch({ discord_id: null })
      .where("id", req.user.id)
      .throwIfNotFound();

    const roleQuery = UserRole.query()
      .where("user_id", req.user.id)
      .andWhere("assigned_by", "discord")
      .select("role_id as id");

    const [user, roles] = await Promise.all([userQuery, roleQuery]);

    await User.relatedQuery("roles", trx)
      .for(user)
      .unrelate()
      .whereIn(
        "id",
        roles.map(({ id }) => id)
      );

    await trx.commit();

    res.status(200).send({ discord_id: null });
  } catch (err) {
    await trx.rollback();
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/discord",
  method: "PATCH",
  handler: delinkDiscordSocialAccount,
};
