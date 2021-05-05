"use strict";
const allPermissions = require("./helpers/allPermissions.js");
const ownPermissions = require("./helpers/ownPermissions.js");

const date = new Date().toISOString();

const generateRolePerms = (roleId, num) => {
  const results = [];
  for (let i = 1; i <= num; i++) {
    results.push({ role_id: roleId, perm_id: i });
  }
  return results;
};

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  try {
    await knex.raw(
      "TRUNCATE roles, role_permissions, user_permissions, permissions RESTART IDENTITY CASCADE"
    );
    await knex
      .into("permissions")
      .insert([...allPermissions, ...ownPermissions]);

    await knex.into("roles").insert([
      { name: "Admin", level: 0, created_at: date, updated_at: date },
      { name: "Member", level: 4, created_at: date, updated_at: date },
      { name: "Guest", level: 5, created_at: date, updated_at: date },
      { name: "Curator", level: 3, created_at: date, updated_at: date },
    ]);

    await knex
      .into("role_permissions")
      .insert([
        ...generateRolePerms(1, 31),
        { role_id: 2, perm_id: 4 },
        { role_id: 4, perm_id: 1 },
        { role_id: 4, perm_id: 2 },
        { role_id: 4, perm_id: 3 },
        { role_id: 4, perm_id: 4 },
        { role_id: 4, perm_id: 5 },
        { role_id: 4, perm_id: 7 },
        { role_id: 4, perm_id: 9 },
        { role_id: 4, perm_id: 10 },
      ]);
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};
