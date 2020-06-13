"use strict";

function runChangeUserStatusTests(request, authorized, ns) {
  return function () {
    it("PUT /user/2/status should change a user is_disable column to true", async (done) => {
      try {
        const res = await authorized("put", `${ns}/users/2/status`).send({
          disable: true,
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("user.id", 2);
        expect(res.body).toHaveProperty("user.disabled", true);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /user/2/status should change a user is_disable column to false", async (done) => {
      try {
        const res = await authorized("put", `${ns}/users/2/status`).send({
          disable: false,
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("user.id", 2);
        expect(res.body).toHaveProperty("user.disabled", false);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /user/2/status without being authenticated should return a status of 401", async (done) => {
      try {
        const res = await request.put(`${ns}/users/2/status`).send({
          disable: false,
        });
        expect(res.statusCode).toEqual(401);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /user/2/status should return a 400 status when disable is a string and not a boolean", async (done) => {
      try {
        const res = await authorized("put", `${ns}/users/2/status`).send({
          disable: "false",
        });

        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /user/2/status should return 400 when no disable parameter is provided in payload", async (done) => {
      try {
        const res = await authorized("put", `${ns}/users/2/status`);

        expect(res.statusCode).toEqual(400);

        done();
      } catch (err) {
        done(err);
      }
    });
  };
}

module.exports = {
  description: "Test /users/2/status endpoint",
  handler: runChangeUserStatusTests,
};
