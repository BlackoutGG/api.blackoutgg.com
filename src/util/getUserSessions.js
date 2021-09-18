"use strict";
const UserSession = require("$models/UserSession");
const { isFuture, differenceInSeconds } = require("date-fns");
const { raw } = require("objection");

/**
 * Blacklists user tokens that have been revoked.
 * @param {*} id The id referencing the user
 * @param {*} trx The optional transaction object
 */

module.exports = async function getUserSessionsForRevoke(id, trx) {
  let commands = null;
  let query = trx ? UserSession.query(trx) : UserSession.query();
  query =
    Array.isArray(id) && id.length
      ? query.whereIn("user_id", id)
      : query.where("user_id", id);

  const userSessions = await query
    .whereRaw(raw("expires >= CURRENT_TIMESTAMP"))
    .select("refresh_token_id", "expires")
    .orderBy("created_at", "DESC");

  if (userSessions && userSessions.length) {
    commands = userSessions.reduce((output, s) => {
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

  return commands;
};
