"use strict";
const config = require("../knexfile.js");
const knex = require("knex")(config["development"]);
const faker = require("faker");

const { Model } = require("objection");

class Field extends Model {
  static get tableName() {
    return "fields";
  }

  static get jsonSchema() {
    return {
      type: "object",

      properties: {
        id: { type: "integer" },
        value: { type: "string" },
        type: { type: "string" },

        optional: { type: "boolean" },
      },
    };
  }
}

class Form extends Model {
  static get tableName() {
    return "forms";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "integer" },
        category_id: { type: "integer" },
        name: { type: "string " },
        description: { type: "string" },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    return {
      fields: {
        relation: Model.ManyToManyRelation,
        modelClass: Field,
        join: {
          from: "forms.id",
          through: {
            from: "form_fields.form_id",
            to: "form_fields.field_id",
          },
          to: "fields.id",
        },
      },
    };
  }
}

const generateForms = (num) => {
  const date = new Date().toISOString();
  const hasOptions = ["multiple", "select", "checkbox"];
  const types = ["textfield", "textarea", ...hasOptions];
  const forms = [];

  for (let i = 0; i < num; i++) {
    const fields = [];
    const fieldNum = faker.random.number({ min: 2, max: 10 });

    for (let f = 0; f <= fieldNum; f++) {
      const type = types[faker.random.number({ min: 0, max: 4 })];

      fields.push({
        value: faker.lorem.words(),
        order: f,
        type,
        optional: faker.random.boolean(),
        options: hasOptions.some((t) => t === type)
          ? JSON.stringify(faker.random.arrayElements())
          : null,
      });
    }

    const form = {
      name: faker.lorem.words(),
      category_id: faker.random.number({ min: 1, max: 3 }),
      description: faker.lorem.sentences(),
      status: false,
      fields,
      created_at: date,
      updated_at: date,
    };

    forms.push(form);
  }

  return forms;
};

const seedForms = async () => {
  try {
    const forms = generateForms(50);
    const results = await knex.transaction(async (trx) => {
      await trx.raw("TRUNCATE forms, fields RESTART IDENTITY CASCADE");
      const list = await Form.query(trx).insertGraph(forms);
      return list;
    });
    console.log(results);
    console.log("seeding complete...");
    process.exit(0);
  } catch (err) {
    console.log(err);
    Promise.reject(err);
    process.exit(1);
  }
};

seedForms();
