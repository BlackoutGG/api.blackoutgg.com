"use strict";

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
      "TRUNCATE roles, role_permissions, permissions RESTART IDENTITY CASCADE"
    );
    await knex.into("permissions").insert([
      {
        /** ID1 */
        action: "view",
        resource: "admin",
        level: 2,
      },
      {
        /** ID2 */
        action: "view",
        resource: "posts",
        level: 5,
      },
      {
        /** ID3 */
        action: "view",
        resource: "forms",
        level: 5,
      },
      {
        /** ID4 */
        action: "view",
        resource: "events",
        level: 5,
      },
      {
        /** ID5 */
        action: "view",
        resource: "roles",
        level: 1,
      },
      {
        /** ID6 */
        action: "view",
        resource: "users",
        level: 1,
      },
      {
        /** ID7 */
        action: "view",
        resource: "media",
        level: 3,
      },

      /** ADD */

      {
        /** ID8 */
        action: "add",
        resource: "posts",
        level: 3,
      },
      {
        /** ID9 */
        action: "add",
        resource: "forms",
        level: 3,
      },
      {
        /** ID10 */
        action: "add",
        resource: "events",
        level: 3,
      },
      {
        /** ID11 */
        action: "add",
        resource: "roles",
        level: 0,
      },
      {
        /** ID12 */
        action: "add",
        resource: "users",
        level: 0,
      },
      {
        /** ID13 */
        action: "add",
        resource: "media",
        level: 2,
      },

      /** UPDATE */

      {
        /** ID14 */
        action: "update",
        resource: "posts",
        level: 3,
      },
      {
        /** ID15 */
        action: "update",
        resource: "forms",
        level: 3,
      },
      {
        /** ID16 */
        action: "update",
        resource: "events",
        level: 3,
      },
      {
        /** ID17 */
        action: "update",
        resource: "roles",
        level: 0,
      },
      {
        /** ID18 */
        action: "update",
        resource: "users",
        level: 0,
      },
      {
        /** ID19 */
        action: "update",
        resource: "media",
        level: 2,
      },

      /** DELETE */

      {
        /** ID20 */
        action: "delete",
        resource: "posts",
        level: 3,
      },
      {
        /** ID21 */
        action: "delete",
        resource: "forms",
        level: 3,
      },
      {
        /** ID22 */
        action: "delete",
        resource: "events",
        level: 3,
      },
      {
        /** ID23 */
        action: "delete",
        resource: "roles",
        level: 0,
      },
      {
        /** ID24 */
        action: "delete",
        resource: "users",
        level: 0,
      },
      {
        /** ID25 */
        action: "delete",
        resource: "media",
        level: 0,
      },
    ]);

    await knex.into("roles").insert([
      { name: "Admin", level: 0, created_at: date, updated_at: date },
      { name: "Member", level: 4, created_at: date, updated_at: date },
      { name: "Guest", level: 5, created_at: date, updated_at: date },
      { name: "Curator", level: 3, created_at: date, updated_at: date },
    ]);

    await knex
      .into("role_permissions")
      .insert([
        ...generateRolePerms(1, 25),
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
