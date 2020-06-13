"use strict";
const app = require("../bootstrap");
const request = require("supertest")(app);
const ns = "/api/v1";
const credentials = {
  username: process.env.JEST_TEST_USERNAME,
  password: process.env.JEST_TEST_PASSWORD,
};

const requireDirectory = require("require-directory");
const tests = Object.values(
  requireDirectory(module, { exclude: /assets/ })
).reduce((arr, required) => {
  return arr.concat(Object.entries(required));
}, []);

let token = "";

beforeAll(async (done) => {
  try {
    const res = await request.post(`${ns}/users/login`).send(credentials);
    token = res.headers.authorization;
    done();
  } catch (err) {
    done(err);
  }
});

tests.forEach(([filename, test]) =>
  describe(
    `${filename}: ${test.description}`,
    test.handler(request, authorized, ns)
  )
);

function authorized(method, url) {
  return request[method](url).set("Authorization", token);
}
