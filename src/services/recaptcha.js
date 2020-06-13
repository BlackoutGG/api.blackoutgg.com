"use strict";
const phin = require("phin");

const errors = (errs) => (type) => errs.indexOf(type) !== -1;

/**
 * Returns the recaptcha uri to verify the response.
 * @param {string} secret The google recaptcha secret.
 * @param {string} response The grecaptcha response sent from the client
 * @returns {string}
 */
const recaptchaURI = (secret, response) => {
  return `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${response}`;
};
/**
 * calls next() and moves the request forward
 * @param {string} secret THe google recaptcha secret.
 */
const verifyRecaptcha = function (secret) {
  if (!secret || typeof secret !== "string") {
    throw new Error("Recaptcha secret is either missing or not a string");
  }
  return async function (req, res, next) {
    try {
      const { body } = await phin({
        url: recaptchaURI(secret, req.body.gresponse),
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        parse: "json",
      });

      if (body.success) return next();
      if (body["error-codes"].length) {
        const error = errors(resp.body["error-codes"]);
        if (error("missing-input-secret")) {
          res.boom.badRequest("recaptcha:missing-input-secret");
        } else if (error("invalid-input-secret")) {
          res.boom.badData("recaptcha:invalid-input-secret");
        } else if (error("missing-input-response")) {
          res.boom.badRequest("recaptcha:missing-input-response");
        } else if (error("bad-request")) {
          res.boom.badRequest("recaptcha:bad-request");
        } else if (error("timeout-or-duplicate")) {
          res.boom.clientTimeout("recaptcha:timeout-or-duplicate");
        } else {
          res.boom.teapot("Encountered an error verifying recaptcha response");
        }
      }
    } catch (err) {
      console.log(err);
      res.boom.boomify(err, {
        statusCode: err.statusCode,
        message: err.message,
      });
    }
  };
};

module.exports = verifyRecaptcha;
