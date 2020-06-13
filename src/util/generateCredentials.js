"use strict";
const jwt = require("jsonwebtoken");
const { generateScope } = require("@util");

const generateUserCredentials = function (permissions, data) {
  const _permissions = generateScope(permissions);
};

const createToken = function (permissions, data) {
  const _permissions = generateScope(permissions);

  const groups = user.groups.reduce((result, g) => {
    result.push(g.name);
    return result;
  }, []);

  const data = {
    id: user.id,
    username: user.username,
    groups,
    permissions: _permissions,
  };

  const token = jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return token;
};
