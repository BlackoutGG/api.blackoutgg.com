"use strict";

function runChangeRoleStatusTests(request, authorized, ns) {
  return function () {
    it("PUT /roles/4/status should disable the role and return with a status of 200", async (done) => {
      try {
        const res = await authorized("put", `${ns}/roles/4/status`).send({
          disable: true,
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("role.id", 4);
        expect(res.body).toHaveProperty("role.disabled", true);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/4/status should reenable the role and return with a status of 200", async (done) => {
      try {
        const res = await authorized("put", `${ns}/roles/4/status`).send({
          disable: false,
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("role.id", 4);
        expect(res.body).toHaveProperty("role.disabled", false);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/4/status should return with a status of 400 when disabled parameter is a string", async (done) => {
      try {
        const res = await authorized("put", `${ns}/roles/4/status`).send({
          disable: "true",
        });

        expect(res.statusCode).toEqual(400);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/5/status should return with a status of 404 because it doesn't exist", async (done) => {
      try {
        const res = await authorized("put", `${ns}/roles/5/status`).send({
          disable: true,
        });

        expect(res.statusCode).toEqual(404);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/four/status should return with a status of 400 because the param is not numeric", async (done) => {
      try {
        const res = await authorized("put", `${ns}/roles/four/status`).send({
          disable: true,
        });

        expect(res.statusCode).toEqual(400);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/4/status should return with a status of 401 when not authenticated", async (done) => {
      try {
        const res = await request.put(`${ns}/roles/4/status`).send({
          disable: true,
        });

        expect(res.statusCode).toEqual(401);

        done();
      } catch (err) {
        done(err);
      }
    });
  };
}

module.exports = {
  description: "Test /roles/:id/status endpoint",
  handler: runChangeRoleStatusTests,
};
