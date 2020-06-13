"use strict";

function runGetSingleRoleTests(request, authorized, ns) {
  return function () {
    it("GET /roles/4 should return a single object relative to the roles id", async (done) => {
      try {
        const res = await authorized("get", `${ns}/roles/4`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("role.id", 4);
        expect(res.body).toHaveProperty("role.name", "contributor");
        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET /roles/four should return a status of 400 if the param is a string", async (done) => {
      try {
        const res = await authorized("get", `${ns}/roles/four`);

        expect(res.statusCode).toEqual(400);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("GET /roles/4 should return a status of 401 if not authorized", async (done) => {
      try {
        const res = await request.get(`${ns}/roles/four`);

        expect(res.statusCode).toEqual(401);

        done();
      } catch (err) {
        done(err);
      }
    });
  };
}

module.exports = {
  description: "Test GET /roless/:id endpoint",
  handler: runGetSingleRoleTests,
};
