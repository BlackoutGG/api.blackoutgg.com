"use strict";
const faker = require("faker");
const bcrypt = require("bcrypt");
const SALT = 12;
const date = new Date().toISOString();
const uniqBy = require("lodash/uniqBy");

const { Model } = require("objection");

class Policies extends Model {
  static get tableName() {
    return "policies";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "integer" },
        action: { type: "string" },
        target: { type: "string" },
        resource: { type: "string" },
        level: { type: "integer" },
      },
    };
  }
}

class Role extends Model {
  static get tableName() {
    return "roles";
  }

  static get modifiers() {
    return {
      nameAndId(builder) {
        builder.select("id", "name");
      },
    };
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
        level: { type: "integer" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    return {
      policies: {
        relation: Model.ManyToManyRelation,
        modelClass: Policies,
        join: {
          from: "roles.id",
          through: {
            from: "role_policies.role_id",
            to: "role_policies.policy_id",
          },
          to: "policies.id",
        },
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
      roles: {
        relation: Model.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: "users.id",
          through: {
            from: "user_roles.user_id",
            to: "user_roles.role_id",
          },
          to: "roles.id",
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
    const roleNum = faker.datatype.number({ min: 1, max: 4 });

    for (let u = 0; u <= roleNum; u++) {
      roles.push({ id: faker.datatype.number({ min: 1, max: 4 }) });
    }

    const userRoles = uniqBy(roles, "id");

    users.push({
      username: faker.internet.userName(),
      password: hashed,
      email: faker.internet.email(),
      avatar: faker.image.avatar(),
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      roles: userRoles,
      created_at: date,
      updated_at: date,
    });
  }

  users.push({
    username: "Helix",
    email: "mmccauleyjr@rogers.com",
    password: hashed,
    avatar: faker.image.avatar(),
    roles: [{ id: 1 }],
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
      .insertGraph(users, { relate: true, unrelate: false, noDelete: true })
      .returning("*");
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};
