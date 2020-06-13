"use strict";

function runEditUserInfoTests(request, authorized, ns) {
  return function () {
    it("PUT /users/2/username should change the users username and respond with a status 200", async (done) => {
      const username = "new_user_name";
      try {
        const res = await authorized("put", `${ns}/users/2/username`).send({
          username,
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("user.id", 2);
        expect(res.body).toHaveProperty("user.username", username);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /users/2/username should respond with a status of 401 when not authenticated", async (done) => {
      const username = "new_user_name";
      try {
        const res = await request.put(`${ns}/users/2/username`).send({
          username,
        });

        expect(res.statusCode).toEqual(401);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /users/2/username should respond with a status 400 when username parameter is missing", async (done) => {
      const username = "new_user_name";
      try {
        const res = await authorized("put", `${ns}/users/2/username`);
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });
  };
}

module.exports = {
  description: "Test /users/2/username endpoints",
  handler: runEditUserInfoTests,
};
