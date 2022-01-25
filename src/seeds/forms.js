const date = new Date().toISOString();
const blaver = require("blaver");

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

const generateForms = async (num) => {
  const hasOptions = ["multiple", "select", "checkbox"];
  const types = ["textfield", "textarea", ...hasOptions];
  const forms = [];

  for (let i = 0; i < num; i++) {
    const fields = [];
    const fieldNum = blaver.random.number({ min: 2, max: 10 });

    for (let f = 0; f <= fieldNum; f++) {
      const type = types[blaver.random.number({ min: 0, max: 4 })];

      fields.push({
        value: blaver.lorem.words(),
        order: f,
        type,
        optional: blaver.random.boolean(),
        options: hasOptions.some((t) => t === type)
          ? JSON.stringify(blaver.random.arrayElements())
          : null,
      });
    }

    const form = {
      name: blaver.lorem.words(),
      category_id: blaver.random.number({ min: 1, max: 3 }),
      description: blaver.lorem.sentences(),
      status: false,
      fields,
      created_at: date,
      updated_at: date,
    };

    forms.push(form);
  }

  return forms;
};

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  try {
    // const forms = await generateForms(50);
    await knex.raw(
      "TRUNCATE forms, fields, form_fields RESTART IDENTITY CASCADE"
    );
    // const results = await Form.query(knex).insertGraph(forms);
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};
