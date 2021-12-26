"use strict";
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const phin = require("phin");

const _formatDiscordRoles = (roles) => {
  return roles.map((role) => ({
    discord_role_id: role.id,
    name: role.name,
  }));
};

const _isMatch = (item) => (item2) =>
  item.discord_role_id === item2.discord_role_id;

const checkIfRolesExist = (newRoles, currentRoles) =>
  newRoles.reduce((output, role) => {
    const match = currentRoles.findIndex(_isMatch(role));

    if (match === -1) output.push(role);
    return output;
  }, []);

/**
 * Fetches discord roles from server; catches and returns results.
 * @param {string|number} id
 */

const getDiscordRoles = async (id) => {
  try {
    const response = await phin({
      method: "GET",
      url: `https://discord.com/api/guilds/${id}/roles`,
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      parse: "json",
    });

    const results = _formatDiscordRoles(response.body);

    return results;
  } catch (err) {
    return Promise.reject(err);
  }
};

/**
 * Returns a fetch all query.
 * @param {promise} query The model query.
 * @param {number} _page The current page.
 * @param {number} _limit The offset to retrieve the db records.
 * @param {string} _sortBy The value containing what to sort by.
 * @param {string} _orderBy The order in (Asc|Desc) in which the records should be returned.
 * @param {object} _filters The object containing additional filters.
 * @returns {promise} Returns the query.
 */
const buildQuery = async function (
  _query,
  _page,
  _limit,
  _sortBy,
  _orderBy,
  _filters
) {
  const page = _page ? parseInt(_page, 10) : 1,
    limit = _limit ? parseInt(_limit, 10) : 25;

  let query = _query;

  const start = (page - 1) * limit,
    end = page * limit - 1;

  if (_filters && Object.keys(_filters).length) {
    Object.entries(_filters).forEach(([key, val]) => {
      query =
        val && Array.isArray(val)
          ? query.whereIn(key, val)
          : query.andWhere(key, val);
    });
  }

  if (_sortBy && _orderBy) {
    query = query.orderBy(_sortBy, _orderBy);
  }

  return query.range(start, end);
};

const validate = (validations, statusCode) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    return res.status(statusCode ? statusCode : 400).send(errors.array());
  };
};

const verifySignature = (label, signature, secret, buf) => {
  return function (req, res, buf, encoding) {
    if (req.headers && req.headers[signature]) {
      const sigToVerify = req.headers[signature].split("=");
      const hex = crypto
        .createHmac(sigToVerify[0], secret)
        .update(buf)
        .digest("hex");

      if (hex === sigToVerify[1]) req[label] = true;
      else throw Error("signaure cannot be verified");
    }
  };
};

const verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) reject(err);
      resolve(decoded);
    });
  });
};

module.exports = {
  buildQuery,
  validate,
  getDiscordRoles,
  verifyToken,
  checkIfRolesExist,
};
