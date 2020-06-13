"use strict";

function runChangeUserGroupTests(request, authorized, ns) {
  return function () {
    it("PUT /user/2/group should change the user with an id of 2's group from guest to member", async (done) => {
      try {
        const res = await authorized("put", `${ns}/users/2/group`).send({
          groupId: 3,
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("id");
        expect(res.body).toHaveProperty("group");
        expect(res.body.id).toEqual(2);
        expect(res.body.group).toEqual(3);

        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /user/2/group should return with a 401 when not authenticated", async (done) => {
      try {
        const res = await request
          .put(`${ns}/users/2/group`)
          .send({ groupId: 3 });
        expect(res.statusCode).toEqual(401);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /user/2 should return a user with a group of member", async (done) => {
      try {
        const res = await authorized("get", `${ns}/users/2`);

        expect(res.statusCode).toEqual(200);
        expect(res.body);
        expect(res.body).toHaveProperty(
          "user.groups",
          expect.arrayContaining(["member"])
        );
        expect(res.body.user).toHaveProperty("permissions");
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /user/2/group should return with a status of 404 when group doesn't exist", async (done) => {
      try {
        const res = await authorized("put", `${ns}/users/2/group`).send({
          groupId: 5,
        });

        expect(res.statusCode).toEqual(404);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /user/2/group should return with a status of 400 when groupId is a string", async (done) => {
      try {
        const res = await authorized("put", `${ns}/users/2/group`).send({
          groupId: "four",
        });

        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /user/2/group should return with a status of 404 when user doesn't exist", async (done) => {
      try {
        const res = await authorized("put", `${ns}/users/5/group`).send({
          groupId: 3,
        });

        expect(res.statusCode).toEqual(404);
        done();
      } catch (err) {
        done(err);
      }
    });
  };
}

module.exports = {
  description: "Test /users/2/group endpoint",
  handler: runChangeUserGroupTests,
};
