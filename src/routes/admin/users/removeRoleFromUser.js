"use strict";
const UserRole = require("$models/UserRole");
const UserSession = require("$models/UserSession");
const isFuture = require("date-fns/isFuture");
const diffInSeconds = require("date-fns/differenceInSeconds");
const AWS = require("aws-sdk");
const guard = require("express-jwt-permissions")();
const { param, query } = require("express-validator");
const { validate } = require("$util");
const { VIEW_ALL_ADMIN, UPDATE_ALL_USERS } = require("$util/permissions");
const { transaction, raw } = require("objection");

const docClient = new AWS.DynamoDB.DocumentClient();

const removeUserRole = async function (req, res, next) {
  const userId = req.params.id,
    roleId = req.query.roleId;

  const trx = await UserRole.startTransaction();

  try {
    const details = await UserRole.query(trx)
      .where({ user_id: userId, role_id: roleId })
      .returning(["user_id", "role_id"])
      .first()
      .throwIfNotFound()
      .delete();

    const sessions = await UserSession.query()
      .where("user_id", userId)
      .whereRaw(raw("expires >= CURRENT_TIMESTAMP"))
      .select("token_id", "expires")
      .orderBy("created_at", "DESC");

    // const params = {
    //   TableName: "user_sessions",
    //   Key: {
    //     user_id: userId,
    //   },
    //   UpdateExpression: "DELETE #roles :roleToRemove",
    //   ExpressionAttributeNames: {
    //     "#roles": "user_roles",
    //   },
    //   ExpressionAttributeValues: {
    //     ":roleToRemove": docClient.createSet([roleId]),
    //     ":id": userId,
    //   },
    //   ConditionExpression: "user_id = :id",
    //   ReturnValues: "ALL_NEW",
    // };

    // const session = await docClient.update(params).promise();

    /** If any permission/role changes are made on the user we revoke the token and force the user to relog. */
    // if (session) {
    //   const date = session.expires;

    //   console.log(date);
    //   console.log(session);

    //   const id = session.token_id;
    //   const key = `blacklist:${id}`;
    //   if (isFuture(date)) {
    //     const diff = diffInSeconds(date, new Date());
    //     const exists = await req.redis.exists(key);
    //     if (!exists) await req.redis.set(key, id, "NX", "EX", diff);
    //   }
    // }

    if (sessions && sessions.length) {
      const commands = sessions.reduce((output, s) => {
        const date = s.expires;
        const id = s.token_id;
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

    res.status(200).send(details);
  } catch (err) {
    await trx.rollback();
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id/role",
  method: "DELETE",
  middleware: [
    guard.check([VIEW_ALL_ADMIN, UPDATE_ALL_USERS]),
    validate([
      param("id").isNumeric().toInt(10),
      query("roleId").isNumeric().toInt(10),
    ]),
  ],
  handler: removeUserRole,
};
