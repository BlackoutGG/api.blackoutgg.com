"use strict";
const {
  ValidationError,
  NotFoundError,
  DBError,
  ConstraintViolationError,
  UniqueViolationError,
  NotNullViolationError,
  ForeignKeyViolationError,
  CheckViolationError,
  DataError,
} = require("objection");

const types = new Map([
  ...require("./codes/4xx.js"),
  ...require("./codes/5xx.js"),
]);

// In this example `res` is an express response object.
function errorHandler(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    if (err.code === "permission_denied") {
      return res.status(403).send({
        message: err.message,
        type: "Unauthorized",
      });
    }

    return res.status(401).send({
      message: err.message,
      type: "Unauthorized",
    });
  }

  if (err.name === "RevokeTokenError") {
    return res.status(401).send({
      message: err.message,
      type: "Revoked",
    });
  }

  if (err instanceof ValidationError) {
    switch (err.type) {
      case "ModelValidation":
        res.status(400).send({
          message: err.message,
          type: err.type,
          data: err.data,
        });
        break;
      case "RelationExpression":
        res.status(400).send({
          message: err.message,
          type: "RelationExpression",
          data: {},
        });
        break;
      case "UnallowedRelation":
        res.status(400).send({
          message: err.message,
          type: err.type,
          data: {},
        });
        break;
      case "InvalidGraph":
        res.status(400).send({
          message: err.message,
          type: err.type,
          data: {},
        });
        break;
      default:
        res.status(500).send({
          message: err.message,
          type: "UnknownValidationError",
          data: {},
        });
        break;
    }
  } else if (err instanceof NotFoundError) {
    res.status(404).send({
      message: err.message,
      type: "NotFound",
      data: {},
    });
  } else if (err instanceof UniqueViolationError) {
    res.status(409).send({
      message: err.message,
      type: "UniqueViolation",
      data: {
        columns: err.columns,
        table: err.table,
        constraint: err.constraint,
      },
    });
  } else if (err instanceof NotNullViolationError) {
    res.status(400).send({
      message: err.message,
      type: "NotNullViolation",
      data: {
        column: err.column,
        table: err.table,
      },
    });
  } else if (err instanceof ForeignKeyViolationError) {
    res.status(409).send({
      message: err.message,
      type: "ForeignKeyViolation",
      data: {
        table: err.table,
        constraint: err.constraint,
      },
    });
  } else if (err instanceof CheckViolationError) {
    res.status(400).send({
      message: err.message,
      type: "CheckViolation",
      data: {
        table: err.table,
        constraint: err.constraint,
      },
    });
  } else if (err instanceof DataError) {
    res.status(400).send({
      message: err.message,
      type: "InvalidData",
      data: {},
    });
  } else if (err instanceof DBError) {
    res.status(500).send({
      message: err.message,
      type: "UnknownDatabaseError",
      data: {},
    });
  } else {
    res.status(500).send({ message: err.message });
  }
}

module.exports = errorHandler;
