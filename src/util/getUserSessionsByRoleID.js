"use strict";
const UserSession = require("$models/UserSession");
const { isFuture, differenceInSeconds } = require("date-fns");
const { raw } = require("objection");

/**
 * Creates array of potentially blacklisted user tokens that need to be revoked.
 * @param {*} id The id referencing the user role
 * @param {*} trx The optional transaction object
 */

module.exports = async function getUserBlacklistByRoleID(id, trx) {
  let blacklist = null;
  let query = trx
    ? UserSession.query(trx).joinRelated("user.roles")
    : UserSession.query().joinRelated("user.roles");
  query =
    Array.isArray(id) && id.length
      ? query
          .whereIn("user:roles.id", id)
          .groupBy("user_sessions.refresh_token_id")
      : query.where("user:roles.id", id);
  const userSessions = await query
    .whereRaw(raw("expires >= CURRENT_TIMESTAMP"))
    .select("user_sessions.refresh_token_id", "expires")
    .orderBy("user_sessions.created_at", "DESC");

  if (userSessions && userSessions.length) {
    blacklist = userSessions.reduce((output, s) => {
      const date = s.expires;
      const id = s.refresh_token_id;
      const key = `blacklist:${id}`;
      if (isFuture(date)) {
        const diff = differenceInSeconds(date, Date.now());
        output.push(["set", key, id, "NX", "EX", diff]);
      }
      return output;
    }, []);
  }

  return blacklist;
};
