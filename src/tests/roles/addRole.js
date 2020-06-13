"use strict";

function runAddRolesTests(request, authorized, ns) {
  return function () {
    it("POST / should add a group", async (done) => {
      const permissions = { can_upload_map: true, can_view_map: true };
      try {
        const name = "uploader";
        const res = await authorized("post", `${ns}/roles`).send({
          name,
          permissions,
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("group.name", name);
        expect(res.body).toHaveProperty("group.can_upload_map", true);
        expect(res.body).toHaveProperty("group.can_view_map", true);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /roles when not authenticated should respond back with a 401", async (done) => {
      const permissions = { can_upload_map: true, can_view_map: true };
      const name = "negativeUploader";
      try {
        const res = await request
          .post(`${ns}/roles`)
          .send({ name, permissions });
        expect(res.statusCode).toEqual(401);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /roles should send back a 400 bad request response with malformed permissions", async (done) => {
      const permissions = { can_upload_map: "yes", can_view_map: true };
      const name = "negativeUploader";
      try {
        const res = await authorized("post", `${ns}/roles`).send({
          name,
          permissions,
        });
        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("POST /roles should send back a 400 bad request response with malformed name", async (done) => {
      const permissions = { can_upload_map: true, can_view_map: true };
      const name = "$!_banger";
      try {
        const res = await authorized("post", `${ns}/roles`).send({
          name,
          permissions,
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
  description: "Test /roles endpoint",
  handler: runAddRolesTests,
};
