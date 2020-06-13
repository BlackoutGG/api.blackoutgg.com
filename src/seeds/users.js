const bcrypt = require("bcrypt");

async function hashPassword(password) {
  const SALT_ROUNDS = 12;

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  } catch (err) {
    console.log(err);
    Promise.reject(err);
  }
}

exports.seed = async function (knex) {
  // Deletes ALL existing entries

  const date = new Date().toISOString();
  try {
    await knex.raw(
      "TRUNCATE users, roles, maps, pins RESTART IDENTITY CASCADE"
    );
    await knex.into("roles").insert([
      {
        name: "admin",
        can_access_admin: true,
        can_view_maps: true,
        can_view_events: true,
        can_view_pins: true,
        can_view_users: true,
        can_view_roles: true,
        can_edit_maps: true,
        can_edit_events: true,
        can_edit_pins: true,
        can_edit_users: true,
        can_edit_roles: true,
        can_add_maps: true,
        can_add_events: true,
        can_add_pins: true,
        can_add_users: true,
        can_add_roles: true,
        can_remove_maps: true,
        can_remove_events: true,
        can_remove_pins: true,
        can_remove_users: true,
        can_remove_roles: true,
        can_disable_maps: true,
        can_disable_events: true,
        can_disable_pins: true,
        can_disable_users: true,
        can_disable_roles: true,
        can_upload_maps: true,
        can_upload_pins: true,
        can_upload_media: true,
        is_disabled: true,
        is_removable: false,
        created_at: date,
        updated_at: date,
      },
      {
        name: "guest",
        can_view_maps: true,
        created_at: date,
        updated_at: date,
      },
      {
        name: "member",
        can_view_maps: true,
        can_add_pins: true,
        can_remove_pins: true,
        created_at: date,
        updated_at: date,
      },
    ]);

    const users = [
      {
        username: "admin",
        email: "mmccauleyjr@rogers.com",
        password: await hashPassword("superadminbko"),
        created_at: date,
        updated_at: date,
      },
      {
        username: "testaccount",
        email: "h3lix0@gmail.com",
        password: await hashPassword("testpassword"),
        created_at: date,
        updated_at: date,
      },
    ];

    const results = await knex.into("users").insert(users).returning("id");

    const userroles = [
      { user_id: results[0], role_id: 1 },
      { user_id: results[1], role_id: 2 },
    ];

    await knex.into("user_roles").insert(userroles);
  } catch (err) {
    console.log(err);
    Promise.reject(err);
  }
};
