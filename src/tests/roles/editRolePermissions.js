"use strict";

function runEditRolePermissionsTests(request, authorized, ns) {
  return function () {
    it("PUT /roles/4 should edit the role 'uploader' permissions", async (done) => {
      const permissions = {
        can_create_pin: true,
        can_delete_pin: true,
        can_remove_map: true,
      };

      try {
        const res = await authorized("put", `${ns}/roles/4`).send({
          permissions,
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("role.can_create_pin", true);
        expect(res.body).toHaveProperty("role.can_delete_pin", true);
        expect(res.body).toHaveProperty("role.can_remove_map", true);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/4 should return 400 if a permission is a string and not a boolean", async (done) => {
      const permissions = {
        can_create_pin: "true",
        can_delete_pin: true,
        can_remove_map: true,
      };

      try {
        const res = await authorized("put", `${ns}/roles/4`).send({
          permissions,
        });

        expect(res.statusCode).toEqual(400);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/5 should return 404 if the role doesn't exist", async (done) => {
      const permissions = {
        can_create_pin: true,
        can_delete_pin: true,
        can_remove_map: true,
      };

      try {
        const res = await authorized("put", `${ns}/roles/5`).send({
          permissions,
        });

        expect(res.statusCode).toEqual(404);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/four should return 400 if id parameter is a string and not a number", async (done) => {
      const permissions = {
        can_create_pin: true,
        can_delete_pin: true,
        can_remove_map: true,
      };

      try {
        const res = await authorized("put", `${ns}/roles/5`).send({
          permissions,
        });

        expect(res.statusCode).toEqual(404);
        done();
      } catch (err) {
        done(err);
      }
    });

    it("PUT /roles/4 should return 401 if not authenticated", async (done) => {
      const permissions = {
        can_create_pin: true,
        can_delete_pin: true,
        can_remove_map: true,
      };

      try {
        const res = await request.put(`${ns}/roles/5`).send({
          permissions,
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
  description: "Test PUT /roles/:id endpoint",
  handler: runEditRolePermissionsTests,
};
