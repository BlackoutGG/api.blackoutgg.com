"use strict";
const { validationResult } = require("express-validator");

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

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    return res.status(400).send(errors.array());
  };
};

module.exports = {
  buildQuery,
  validate,
};
