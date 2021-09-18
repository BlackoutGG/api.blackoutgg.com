"use strict";
const phin = require("phin");

// const errors = (errs) => (type) => errs.indexOf(type) !== -1;

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
        const errors = body["error-codes"];
        console.log(errors);
        return res.status(500).send(errors);
      }
    } catch (err) {
      console.log(err);
      next(err);
    }
  };
};

module.exports = verifyRecaptcha;
