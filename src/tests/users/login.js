"use strict";
let token;

function runLoginTests(request, authorized, ns) {
  const login = function (username, password) {
    return request.post(`${ns}/users/login`).send({
      username: username || process.env.JEST_TEST_USERNAME,
      password: password || process.env.JEST_TEST_PASSWORD,
    });
  };

  return function () {
    it("POST /users/login should authenticate the user and send back a token from the header", async (done) => {
      try {
        const res = await login();

        token = res.headers.authorization;

        expect(res.statusCode).toEqual(200);
        expect(res.headers).toHaveProperty("authorization");
        expect(res.headers.authorization).toEqual(
          expect.stringMatching(/Bearer\s\w+/)
        );
        expect(res.body).toHaveProperty("username");
        expect(res.body.username).toEqual("admin");
        expect(res.body).toHaveProperty("groups");
        expect(res.body.groups).toEqual(
          expect.arrayContaining(["administrator"])
        );
        expect(token).toEqual(expect.stringMatching(/Bearer\s\w+/));
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/login should send back a 400 error if already logged in", async (done) => {
      try {
        const res = await authorized("post", `${ns}/users/login`).send({
          username: process.env.JEST_TEST_USERNAME,
          password: process.env.JEST_TEST_PASSWORD,
        });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/login should send back a 404 error if the user doesn't exist", async (done) => {
      try {
        const res = await login("notfound", "notfound");
        expect(res.statusCode).toEqual(404);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/login should send back a 400 if the password is wrong", async (done) => {
      try {
        const res = await login(
          process.env.JEST_TEST_USERNAME,
          "wrongpassword"
        );
        expect(res.statusCode).toEqual(422);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /users/login should send back a 400 if the username has illegal characters", async (done) => {
      try {
        const res = await login("$!_banger", "wrongpassword");
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });
  };
}

module.exports = {
  description: "Test /users/login endpoint",
  handler: runLoginTests,
};
