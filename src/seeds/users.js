"use strict";
const faker = require("faker");
const bcrypt = require("bcrypt");
const SALT = 12;
const date = new Date().toISOString();
const uniqBy = require("lodash/uniqBy");

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
    const roleNum = faker.random.number({ min: 1, max: 4 });

    for (let u = 0; u < roleNum; u++) {
      roles.push({ role_id: faker.random.number({ min: 1, max: 4 }) });
    }

    const userRoles = uniqBy(roles, "role_id");

    users.push({
      username: faker.internet.userName(),
      password: hashed,
      email: faker.internet.email(),
      avatar: faker.internet.avatar(),
      user_roles: userRoles,
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

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  try {
    const users = await generateUsers(75);
    await knex.raw("TRUNCATE users, media RESTART IDENTITY CASCADE");

    const results = await User.query(knex)
      .insertGraph(users, { relate: true })
      .returning("*");
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};
