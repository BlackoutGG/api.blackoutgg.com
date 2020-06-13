"use strict";

function runGetSingleUserTests(request, authorized, ns) {
  return function () {
    it("GET /users/2 should return a payload with a status of 200 when authenticated", async (done) => {
      try {
        const res = await authorized("get", `${ns}/users/2`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("user.id", 2);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET /users/2 should return a status 401 error when not authenticated", async (done) => {
      try {
        const res = await request.get(`${ns}/users/2`);
        expect(res.statusCode).toEqual(401);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET /users/3 should return with a status of 404 when authenticated", async (done) => {
      try {
        const res = await authorized("get", `${ns}/users/3`);
        expect(res.statusCode).toEqual(404);
        done();
      } catch (err) {
        done(err);
      }
    });

    /* PARAM HAS TO BE NUMERIC; WON'T PASS CHECK */
    it(`GET /users/${process.env.JEST_TEST_NAME} should return with a status of 400 when authenticated`, async (done) => {
      try {
        const res = await authorized(
          "get",
          `${ns}/users/${process.env.JEST_TEST_NAME}`
        );
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });
  };
}

module.exports = {
  description: "Test /users/:id endpoint",
  handler: runGetSingleUserTests,
};
