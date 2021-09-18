"use strict";
const uniq = require("lodash/uniq");
const { nanoid } = require("nanoid");

module.exports = function generateTokenData(user) {
  if (!user.hasOwnProperty("roles")) {
    throw Error("user is missing property roles.");
  }

  if (!user.hasOwnProperty("policies")) {
    throw Error("user is missing property policies.");
  }

  const roles = user.roles.map(({ name }) => name.toLowerCase());
  const rolePolicies = user.roles.flatMap(({ policies }) =>
    policies.map(({ action, target, resource }) => {
      return `${action}:${target}:${resource}`;
    })
  );
  const userPolicies = user.policies.map(
    ({ action, target, resource }) => `${action}:${target}:${resource}`
  );
  const permissions = uniq([...userPolicies, ...rolePolicies]);
  const level = Math.min(user.roles.map(({ level }) => level));
  const access_jti = nanoid();
  const refresh_jti = nanoid();

  return {
    jti: access_jti,
    refresh_jti: refresh_jti,
    id: user.id,
    discord_id: user.discord_id,
    userame: user.username,
    roles,
    level,
    permissions,
  };
};
