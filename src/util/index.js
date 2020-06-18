"use strict";
const { validationResult } = require("express-validator");

const generateScope = function (perms) {
  const permissions = perms.reduce((result, perm) => {
    for (let key in perm) {
      if (perm[key] && typeof perm[key] === "boolean") result[key] = perm[key];
    }
    return result;
  }, {});

  console.log(permissions);

  const scope = Object.entries(permissions).reduce((arr, [key, val]) => {
    if (typeof val !== "boolean") return;

    if (/^can_/.test(key)) {
      let args = key.split("_"),
        perms,
        type;

      if (val) {
        if (args.length > 2) {
          perms = args[1];
          type = args[2];
        } else {
          perms = args[0];
          type = args[1];
        }

        arr.push(`${type}:${perms}`);
      }
    }

    return arr;
  }, []);

  console.log(scope);

  return scope;
};

const buildQuery = async function (_page, _limit) {
  let page = typeof _page !== undefined ? parseInt(_page, 10) : 1,
    limit = typeof _limit !== undefined ? parseInt(_limit, 10) : 20;

  let start = (page - 1) * limit,
    end = page * limit - 1;

  return this.range(start, end);
};

const validateRequest = async function (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.boom.badRequest(errors.array());
  next();
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
  generateScope,
  validateRequest,
  validate,
};
