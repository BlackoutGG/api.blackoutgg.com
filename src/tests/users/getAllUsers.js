"use strict";

function runGetAllUserTests(request, authorized, ns) {
  return function () {
    it("GET / should return an payload with an array called results and a numeric property called total while authenticated", async (done) => {
      try {
        const res = await authorized("get", `${ns}/users`).query({
          page: 1,
          limit: 20,
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("users.results");
        expect(res.body).toHaveProperty("users.total");
        expect(res.body.users.results.length).toBeGreaterThan(0);
        expect(res.body.users.total).toBeGreaterThan(0);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET / should return with a status of 401 when not authenticated", async (done) => {
      try {
        const res = await request.get(`${ns}/users`).query({
          page: 1,
          limit: 20,
        });
        expect(res.statusCode).toEqual(401);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET / should return with a status of 400 when missing query parameter page", async (done) => {
      try {
        const res = await authorized("get", `${ns}/users`).query({
          limit: 20,
        });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET / should return with a status of 400 when missing query parameter limit", async (done) => {
      try {
        const res = await authorized("get", `${ns}/users`).query({
          page: 1,
        });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET / should return with a status of 400 when page is a string", async (done) => {
      try {
        const res = await authorized("get", `${ns}/users`).query({
          page: "one",
          limit: 20,
        });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET / should return with a status of 400 when limit is a string", async (done) => {
      try {
        const res = await authorized("get", `${ns}/users`).query({
          page: 1,
          limit: "twenty",
        });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET / should return with a status of 400 when no query parameters are sent", async (done) => {
      try {
        const res = await authorized("get", `${ns}/users`);
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });
  };
}

module.exports = {
  description: "Test /users endpoint",
  handler: runGetAllUserTests,
};
