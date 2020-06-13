"use strict";
const sanitize = require("sanitize-html");

const isString = (val) =>
  (val && typeof val === "string") || val instanceof String;
const isArray = (val) => val && Array.isArray(val);
const isObject = (val) =>
  val && typeof val === "object" && val.constructor === Object;

const validateMeta = function (value, { req }) {
  console.log(value);
  console.log(req.query);
  return new Promise(function (resolve, reject) {
    if (!isArray(value)) return reject("Is not of type: array.");

    if (value.length) {
      for (let [el, index] of value) {
        if (!isObject(el)) {
          return reject("Is not of type: object");
        }
        if (el.hasOwnProperty("name") && !isString(el.name)) {
          return reject(`Name not a string at index: ${index}`);
        }
        if (el.hasOwnProperty("type") && !isString(el.type)) {
          return reject(`Type not a string at index: ${index}`);
        }
      }
    } else {
      return reject("Array is empty.");
    }

    resolve();
  });
};

const sanitizeMeta = function (value) {
  return Array.isArray(value)
    ? value.map((el) => {
        return { name: sanitize(el.name), type: sanitize(el.type) };
      })
    : [];
};

module.exports = { validateMeta, sanitizeMeta };
