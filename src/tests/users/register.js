"use strict";
const randomString = require("crypto-random-string");

const username = randomString({ length: 10 });
const password = randomString({ length: 20 });

function runRegisterTests(request, authorized, ns) {
  return function () {
    it("/POST /users/register should create a new user", async (done) => {
      try {
        const res = await request.post(`${ns}/users/register`).send({
          username,
          password,
        });

        const successful = {
          success: true,
          user: username,
        };

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("user");
        expect(res.body).toHaveProperty("success");
        expect(res.body).toEqual(successful);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/register should send back a 400 if password is missing.", async (done) => {
      try {
        const res = await request
          .post(`${ns}/users/register`)
          .send({ username });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/register should send back a 400 if username is missing.", async (done) => {
      try {
        const res = await request
          .post(`${ns}/users/register`)
          .send({ password });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/register should send back a 400 if username has illegal characters", async (done) => {
      try {
        const res = await request
          .post(`${ns}/users/register`)
          .send({ username: "$!_banger", password });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/register should send back a 422 if the user with the same username already exists", async (done) => {
      try {
        const res = await request
          .post(`${ns}/users/register`)
          .send({ username, password });
        expect(res.statusCode).toEqual(422);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/register should send back a 400 if password length is less than 8", async (done) => {
      try {
        const res = await request
          .post(`${ns}/users/register`)
          .send({ username: randomString({ length: 20 }), password: "xxx" });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/register should send back a 400 if password length is more than 50", async (done) => {
      try {
        const res = await request.post(`${ns}/users/register`).send({
          username: randomString({ length: 20 }),
          password: randomString({ length: 51 }),
        });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/register should send back a 400 if username length is less than 3", async (done) => {
      try {
        const res = await request
          .post(`${ns}/users/register`)
          .send({ username: "Xu", password });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/register should send back a 400 if username length is more than 30", async (done) => {
      try {
        const res = await request
          .post(`${ns}/users/register`)
          .send({ username: randomString({ length: 31 }), password });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/register should send back a 403 if you're already logged in", async (done) => {
      try {
        const res = await authorized("post", `${ns}/users/register`).send({
          username: randomString({ length: 20 }),
          password: randomString({ length: 15 }),
        });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });
  };
}

module.exports = {
  description: "Test /users/register endpoint",
  handler: runRegisterTests,
};
