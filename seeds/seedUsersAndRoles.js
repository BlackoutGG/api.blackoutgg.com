"use strict";
const config = require("../knexfile.js");
const knex = require("knex")(config["development"]);
const faker = require("faker");
const bcrypt = require("bcrypt");
const SALT = 12;
const date = new Date().toISOString();

const { Model } = require("objection");

class UserRole extends Model {
  static get tableName() {
    return "user_roles";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["user_id", "role_id"],
      properties: {
        user_id: { type: "integer" },
        role_id: { type: "integer" },
      },
    };
  }
}

class User extends Model {
  static get tableName() {
    return "users";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["username", "password"],
      properties: {
        id: { type: "integer" },
        discord_id: { type: "integer" },
        username: { type: "string" },
        email: { type: "string" },
        password: { type: "string" },
        avatar: { type: "string" },
        is_disabled: { type: "boolean" },
      },
    };
  }

  static get relationMappings() {
    return {
      user_roles: {
        relation: Model.HasManyRelation,
        modelClass: UserRole,
        join: {
          from: "users.id",
          to: "user_roles.user_id",
        },
      },
    };
  }
}

const generateUsers = async (num) => {
  const users = [];
  const salted = await bcrypt.genSalt(SALT);
  const hashed = await bcrypt.hash("superadminbko", salted);

  for (let i = 0; i < num; i++) {
    const roles = [];

    const roleNum = faker.random.number({ min: 1, max: 5 });

    for (let u = 0; u < roleNum; u++) {
      roles.push({
        role_id: faker.random.number({ min: 1, max: 6 }),
      });
    }

    const hashed = await bcrypt.hash(faker.internet.password(), salted);

    users.push({
      username: faker.internet.userName(),
      password: hashed,
      email: faker.internet.email(),
      avatar: faker.internet.avatar(),
      user_roles: roles,
      created_at: date,
      updated_at: date,
    });
  }

  users.push({
    username: "Helix",
    email: "mmccauleyjr@rogers.com",
    password: hashed,
    avatar: faker.internet.avatar(),
    user_roles: [{ role_id: 1 }],
    created_at: date,
    updated_at: date,
  });

  return users;
};

const seed = async () => {
  try {
    await knex.raw(
      "TRUNCATE users, roles, posts, events RESTART IDENTITY CASCADE"
    );
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
  /**
   * SEED ROLES
   */
  try {
    await knex.into("roles").insert([
      {
        name: "Admin",
        can_view_admin: true,
        can_edit_fp: true,
        can_view_events: true,
        can_view_users: true,
        can_view_roles: true,
        can_edit_events: true,
        can_edit_users: true,
        can_edit_roles: true,
        can_add_events: true,
        can_add_users: true,
        can_add_roles: true,
        can_remove_events: true,
        can_remove_users: true,
        can_remove_roles: true,
        can_disable_events: true,
        can_disable_users: true,
        can_disable_roles: true,
        can_upload_media: true,
        is_disabled: false,
        is_removable: false,
        created_at: date,
        updated_at: date,
      },
      {
        name: "Guest",
        created_at: date,
        updated_at: date,
      },
      {
        name: "Role Master",
        can_view_roles: true,
        can_edit_roles: true,
        can_add_roles: true,
        can_remove_roles: true,
        created_at: date,
        updated_at: date,
      },
      {
        name: "Curator",
        can_view_posts: true,
        can_add_posts: true,
        can_view_posts: true,
        can_edit_posts: true,
        created_at: date,
        updated_at: date,
      },
      {
        name: "Scheduler",
        can_view_events: true,
        can_add_events: true,
        can_edit_events: true,
        can_remove_events: true,
        created_at: date,
        updated_at: date,
      },
      {
        name: "Member",
        can_view_events: true,
        created_at: date,
        updated_at: date,
        is_removable: false,
      },
    ]);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }

  try {
    const users = await generateUsers(50);
    const results = await knex.transaction(async (trx) => {
      const list = await User.query(trx)
        .insertGraph(users, {
          relate: true,
        })
        .returning("*");
      return list;
    });
    console.log(results);
    console.log("seeding complete...");
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

seed();
