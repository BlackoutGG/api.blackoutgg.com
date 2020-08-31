"use strict";
const { validationResult } = require("express-validator");

const buildQuery = async function (_page, _limit, _sortBy, _orderBy, _filters) {
  let query = this;

  const page = typeof _page !== undefined ? parseInt(_page, 10) : 1,
    limit = typeof _limit !== undefined ? parseInt(_limit, 10) : 25;

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
