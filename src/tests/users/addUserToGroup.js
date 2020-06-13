"use strict";

function runAddUserToGroupTests(request, authorized, ns) {
  return function () {
    it("POST /user/2/group should add the user to the new group and return a status of 200", async (done) => {
      try {
        const res = await authorized("post", `${ns}/users/2/group`).send({
          groupId: 4,
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("user.user_id", 2);
        expect(res.body).toHaveProperty("user.group_id", 4);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /user/2/group should return a status of 400 because the groupId is a string and not number", async (done) => {
      try {
        const res = await authorized("post", `${ns}/users/2/group`).send({
          groupId: "four",
        });

        expect(res.statusCode).toEqual(400);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /user/four/group should return a status of 400 because id paramter is a string and not a number", async (done) => {
      try {
        const res = await authorized("post", `${ns}/users/four/group`).send({
          groupId: 4,
        });

        expect(res.statusCode).toEqual(400);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /user/4/group should return a status of 400 because no payload was sent", async (done) => {
      try {
        const res = await authorized("post", `${ns}/users/4/group`);

        expect(res.statusCode).toEqual(400);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /user/4/group should return a status of 404 because the user doesn't exist", async (done) => {
      try {
        const res = await authorized("post", `${ns}/users/4/group`).send({
          groupId: 4,
        });

        expect(res.statusCode).toEqual(404);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /user/four/group should return a status of 401 because the user isn't authenticated", async (done) => {
      try {
        const res = await request.post(`${ns}/users/4/group`).send({
          groupId: 4,
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
  description: "TEST /user/:id/group endpoint",
  handler: runAddUserToGroupTests,
};
