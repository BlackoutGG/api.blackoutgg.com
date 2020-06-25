"use strict";
const Role = require("./models/Roles");
const guard = require("express-jwt-permissions")();
const { param } = require("express-validator");
const { validate } = require("$util");

const columns = [
  "can_access_admin",
  "can_view_posts",
  "can_view_maps",
  "can_view_events",
  "can_view_pins",
  "can_view_users",
  "can_view_roles",
  "can_edit_posts",
  "can_edit_maps",
  "can_edit_events",
  "can_edit_pins",
  "can_edit_users",
  "can_edit_roles",
  "can_add_posts",
  "can_add_maps",
  "can_add_events",
  "can_add_pins",
  "can_add_users",
  "can_add_roles",
  "can_remove_posts",
  "can_remove_maps",
  "can_remove_events",
  "can_remove_pins",
  "can_remove_users",
  "can_remove_roles",
  "can_disable_posts",
  "can_disable_maps",
  "can_disable_events",
  "can_disable_pins",
  "can_disable_users",
  "can_disable_roles",
  "can_upload_maps",
  "can_upload_pins",
  "can_upload_media",
];

const getRolePermissions = async function (req, res, next) {
  try {
    // const result = await Role.query().where("id", 1).first();

    // const columns = Object.keys(result).filter((key) => /^can_/.test(key));

    let permissions = await Role.query()
      .where("id", req.params.id)
      .columns(columns)
      .first();

    permissions = Object.entries(permissions).map(([name, value]) => ({
      name,
      value,
    }));

    res.status(200).send({ permissions });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  path: "/perms/:id",
  method: "GET",
  middleware: [guard.check("roles:view"), validate([param("id").isNumeric()])],
  handler: getRolePermissions,
};
