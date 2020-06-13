"use strict";
const fs = require("fs"),
  join = require("path").join,
  dirname = require("path").dirname,
  resolve = require("path").resolve;

const defaultOptions = {
  extensions: ["js", "json", "coffee"],
  recurse: true,
};

/**
 * Returns a file path if the file name meets the criteria set within included or excluded.
 * @param {string} path The path in string format.
 * @param {string} filename The filename in string format.
 * @param {object} options The options object which determines howwe walk through the file system.
 */
function checkFileInclusion(path, filename, options) {
  return (
    // verify file has valid extension
    new RegExp("\\.(" + options.extensions.join("|") + ")$", "i").test(
      filename
    ) &&
    // if options.include is a RegExp, evaluate it and make sure the path passes
    !(
      options.include &&
      options.include instanceof RegExp &&
      !options.include.test(path)
    ) &&
    // if options.include is a function, evaluate it and make sure the path passes
    !(
      options.include &&
      typeof options.include === "function" &&
      !options.include(path, filename)
    ) &&
    // if options.exclude is a RegExp, evaluate it and make sure the path doesn't pass
    !(
      options.exclude &&
      options.exclude instanceof RegExp &&
      options.exclude.test(path)
    ) &&
    // if options.exclude is a function, evaluate it and make sure the path doesn't pass
    !(
      options.exclude &&
      typeof options.exclude === "function" &&
      options.exclude(path, filename)
    )
  );
}
/**
 * Returns an multi-dimensional array which constists of filename, filepath.
 * @param {object} m The module.
 * @param {string} path The path to start the file system walkthrough.
 * @param {object} options The options object.
 *
 * @returns {array<Array>} The multi-dimensional array which consists of filename and the path to the file to be required.
 */
const returnPaths = function (m, path, options) {
  let results = [];

  // path is optional
  if (path && !options && typeof path !== "string") {
    options = path;
    path = null;
  }

  // default options
  options = options || {};
  for (var prop in defaultOptions) {
    if (typeof options[prop] === "undefined") {
      options[prop] = defaultOptions[prop];
    }
  }

  path = !path ? dirname(m.filename) : resolve(dirname(m.filename), path);

  fs.readdirSync(path).forEach((filename) => {
    const joined = join(path, filename);
    if (fs.statSync(joined).isDirectory()) {
      return (results = results.concat(returnPaths(m, joined, options)));
    } else {
      if (
        joined !== m.filename &&
        checkFileInclusion(joined, filename, options)
      ) {
        const key = filename.substring(0, filename.lastIndexOf("."));
        const path = joined;
        results.push([key, path]);
      }
    }
  });

  return results;
};

module.exports = returnPaths;
