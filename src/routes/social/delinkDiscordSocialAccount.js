"use strict";
const User = require("$models/User");
const UserRole = require("$models/UserRole");
const redis = require("$services/redis");
const emitter = require("$services/redis/emitter");
const getUserSessionsByRoleID = require("$util/getUserSessionsByRoleID");
const { transaction } = require("objection");

const delinkDiscordSocialAccount = async (req, res, next) => {
  const trx = await User.startTransaction();

  try {
    const userQuery = User.query(trx)
      .patch({ discord_id: null })
      .where("id", req.user.id);

    const roleQuery = UserRole.query()
      .where("user_id", req.user.id)
      .andWhere("assigned_by", "discord")
      .select("role_id as id");

    let [_, roles] = await Promise.all([userQuery, roleQuery]);

    if (roles && roles.length) {
      const roleIds = roles.map(({ id }) => id);

      await User.relatedQuery("roles", trx)
        .for(req.user.id)
        .unrelate()
        .whereIn("id", roleIds);

      const sessions = await getUserSessionsByRoleID(roleIds);
      if (sessions && sessions.length) {
        await redis.multi(sessions).exec();
        emitter.of("/index").to(`user:${req.user.id}`).emit("account-change");
      }
    }

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
