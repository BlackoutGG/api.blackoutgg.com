"use strict";
const UserRole = require("$models/UserRole");
const UserSession = require("$models/UserSession");
const isFuture = require("date-fns/isFuture");
const diffInSeconds = require("date-fns/differenceInSeconds");
const guard = require("express-jwt-permissions")();
const { param, body } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, UPDATE_ALL_USERS } = require("$util/policies");
const { transaction, raw } = require("objection");

const addRoleToUser = async function (req, res, next) {
  const userId = req.params.id,
    roleId = req.body.roleId;

  const hasRole = await UserRole.query()
    .where("user_id", userId)
    .andWhere("role_id", roleId)
    .first();

  if (hasRole) {
    return res.status(422).send("User already has role.");
  }

  const trx = await UserRole.startTransaction();

  try {
    const user = await UserRole.query(trx)
      .insert({
        user_id: userId,
        role_id: roleId,
      })
      .withGraphFetched("role(nameAndId)")
      .returning("*");

    const sessions = await UserSession.query()
      .where("user_id", userId)
      .whereRaw(raw("expires >= CURRENT_TIMESTAMP"))
      .select("refresh_token_id", "expires")
      .orderBy("created_at", "DESC");

    if (sessions && sessions.length) {
      const commands = sessions.reduce((output, s) => {
        const date = s.expires;
        const id = s.refresh_token_id;
        const key = `blacklist:${id}`;
        if (isFuture(date)) {
          const diff = diffInSeconds(date, new Date());
          output.push(["set", key, id, "NX", "EX", diff]);
        }
        return output;
      }, []);

      await req.redis.multi(commands).exec();
    }

    await trx.commit();

    const payload = {
      user_id: user.user_id,
      role: user.role,
    };

    res.status(200).send(payload);
  } catch (err) {
    console.log(err);
    await trx.rollback();
    next(err);
  }
};

module.exports = {
  path: "/:id/role",
  method: "PATCH",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_USERS]),
    validate([
      param("id").isNumeric().toInt(10),
      body("roleId").isNumeric().toInt(10),
    ]),
  ],
  handler: addRoleToUser,
};
