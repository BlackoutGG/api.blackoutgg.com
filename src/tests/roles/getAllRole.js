"use strict";

function runGetAllRolesTests(request, authorized, ns) {
  return function () {
    it("GET /roles should return a list of all the roles", async (done) => {
      try {
        const res = await authorized("get", `${ns}/roles`).query({
          page: 1,
          limit: 20,
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("roles.results");
        expect(res.body).toHaveProperty("roles.total");
        expect(res.body.roles.total).toBeGreaterThan(0);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET /roles should return status of 400 when no payload is sent", async (done) => {
      try {
        const res = await authorized("get", `${ns}/roles`);

        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET /roles should return status of 400 when page is a string", async (done) => {
      try {
        const res = await authorized("get", `${ns}/roles`).query({
          page: "one",
          limit: 20,
        });

        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET /roles should return status of 400 when limit is a string", async (done) => {
      try {
        const res = await authorized("get", `${ns}/roles`).query({
          page: 1,
          limit: "twenty",
        });

        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET /roles should return status of 401 when not authenticated", async (done) => {
      try {
        const res = await request
          .get(`${ns}/roles`)
          .query({ page: "one", limit: 20 });

        expect(res.statusCode).toEqual(401);
        done();
      } catch (err) {
        done(err);
      }
    });
  };
}

module.exports = {
  description: "Test GET /roles endpoint",
  handler: runGetAllRolesTests,
};
