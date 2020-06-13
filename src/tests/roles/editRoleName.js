"use strict";

function runEditRolNameTests(request, authorized, ns) {
  return function () {
    it("PUT /roles/4/name should change the role name from 'uploader' to 'contributor'", async (done) => {
      try {
        const name = "contributor";
        const res = await authorized("put", `${ns}/roles/4/name`).send({
          name,
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("role.id", 4);
        expect(res.body).toHaveProperty("role.name", name);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/4/name should respond with a 400 error if the name property is not provided", async (done) => {
      try {
        const name = "contributor";
        const res = await authorized("put", `${ns}/roles/4/name`);

        expect(res.statusCode).toEqual(400);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/4/name should respond with a 400 status if the payload has illegal characters", async (done) => {
      try {
        const name = "contributor";
        const res = await authorized("put", `${ns}/roles/4/name`).send({
          name: "$!contributor",
        });

        expect(res.statusCode).toEqual(400);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/four/name should respond with a 400 status if the param is a string/word and not a number", async (done) => {
      try {
        const name = "contributor";
        const res = await authorized("put", `${ns}/roles/five/name`).send({
          name,
        });

        expect(res.statusCode).toEqual(400);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/5/name should respond with a 404 status if role doesn't exist", async (done) => {
      try {
        const name = "contributor";
        const res = await authorized("put", `${ns}/roles/5/name`).send({
          name,
        });

        expect(res.statusCode).toEqual(404);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/4/name should respond with a 401 status if user is not authenticated", async (done) => {
      try {
        const name = "contributor";
        const res = await request.put(`${ns}/roles/4/name`).send({
          name,
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
  description: "Test /roles/:id/name",
  handler: runEditRolNameTests,
};
