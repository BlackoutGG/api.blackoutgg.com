"use strict";
const User = require("$models/User");
// const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const { body } = require("express-validator");
const { validate } = require("$util");
// const docClient = new AWS.DynamoDB.DocumentClient();

const validators = validate([
  body("refresh_token").custom((v, { req }) => {
    if (!"^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_.+/=]*$".test(v)) {
      throw new Error("Malformed refresh token.");
    }
    return true;
  }),
]);

const refreshToken = async (req, res, next) => {
  const { refresh_token } = req.body;

  const token = jwt.verifiy(refresh_token, process.env.JWT_REFRESH_SECRET);

  if (!token) return res.status(400).send({ message: "Token was malformed." });

  const user = await User.query()
    .joinRelated("user_sessions")
    .where("user_sessions.token_id", token.token_id)
    .andWhere("user_sessions.expires", ">", new Date().toISOString())
    .select("users.id", "user_sessions.expires")
    .withGraphFetched("[roles.policies, policies]")
    .first();

  if (!user) {
    return res.status(403).send({ message: "Refresh token has expired." });
  }

  const rolePolicies = user.roles.flatMap(({ policies }) =>
    policies.map(({ action, target, resource }) => {
      return `${action}:${target}:${resource}`;
    })
  );

  const userPolicies = user.policies.map(
    ({ action, target, resource }) => `${action}:${target}:${resource}`
  );

  const permissions = uniq([...userPolicies, ...rolePolicies]);

  const level = Math.min(roles.map(({ level }) => level));

  const jti = nanoid();

  const data = {
    id: user.id,
    roles: user.roles.map(({ name }) => name),
    level,
    permissions,
  };

  const access = jwt.sign(data, process.env.JWT_SECRET);

  await UserSessions.query()
    .patch({ token_id: jti, access })
    .where({ token_id: token.id });

  await req.redis.del(`blacklist:${token.id}`);

  // const params = {
  //   TableName: "user_sessions",
  //   UpdateExpression:
  //     "SET access_token = :token WHERE refresh_token = :refresh",
  //   ConditionExpression: "tokenID = :id",
  //   Keys: {
  //     tokenID: token.jti,
  //   },
  //   ExpressionAttributeValues: {
  //     ":id": token.jti,
  //     ":refresh": token.refresh_token,
  //     ":token": jwt.sign(data, process.env.JWT_SECRET),
  //   },
  //   ReturnValues: "ALL_NEW",
  // };

  // const result = await docClient.update(params).promise();

  res.status(200).send({ access_token: access });
};

module.exports = {
  path: "/refresh",
  method: "POST",
  middleware: [validators],
  handler: refreshToken,
};
