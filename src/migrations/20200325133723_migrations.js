exports.up = function (knex) {
  return Promise.all([
    knex.schema.hasTable("users").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("users", (t) => {
        t.increments("id").primary();
        t.integer("discord_id").unique();
        t.string("email").unique();
        t.string("username").unique();
        t.string("password");
        t.string("avatar");
        t.jsonb("role_ids");
        t.index("discord_id");
        t.timestamps();
      });
    }),
    knex.schema.hasTable("roles").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("roles", (t) => {
        t.increments("id").primary();
        t.string("name").unique();
        t.integer("level").defaultTo(5);
        t.index("level");
        t.timestamps();
      });
    }),
    knex.schema.hasTable("role_permissions").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("role_permissions", (t) => {
        t.integer("role_id")
          .references("id")
          .inTable("roles")
          .onDelete("CASCADE");
        t.integer("perm_id")
          .references("id")
          .inTable("permissions")
          .onDelete("CASCADE");
      });
    }),
    knex.schema.hasTable("permissions").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("permissions", (t) => {
        t.increments("id").primary();
        // t.enum("action", ["view", "add", "update", "delete"]);
        // t.enum("resource", [
        //   "admin",
        //   "posts",
        //   "forms",
        //   "events",
        //   "users",
        //   "roles",
        //   "media",
        // ]);
        // t.enum("level", [0, 1, 2, 3, 4, 5]);
        t.string("action");
        t.string("target");
        t.string("resource");
        t.integer("level");
      });
    }),
    knex.schema.hasTable("user_roles").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("user_roles", (t) => {
        t.integer("user_id")
          .references("users.id")
          .onUpdate("CASCADE")
          .onDelete("CASCADE");
        t.integer("role_id")
          .references("roles.id")
          .onUpdate("CASCADE")
          .onDelete("CASCADE");
      });
    }),
    knex.schema.hasTable("user_forms").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("user_forms", (t) => {
        t.increments("id").primary();
        t.integer("form_id")
          .references("id")
          .inTable("forms")
          .onDelete("CASCADE");
        t.integer("user_id")
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        t.enum("status", ["pending", "accepted", "rejected"]).defaultTo(
          "pending"
        );
        t.timestamps();
      });
    }),
    knex.schema.hasTable("user_form_fields").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("user_form_fields", (t) => {
        t.increments("id").primary();
        t.integer("form_id")
          .references("user_forms.id")
          .onDelete("CASCADE")
          .onUpdate("CASCADE");
        t.integer("field_id")
          .references("fields.id")
          .onDelete("CASCADE")
          .onUpdate("CASCADE");
        t.jsonb("answer").nullable();
        t.timestamps();
      });
    }),
    knex.schema.hasTable("events").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("events", (t) => {
        t.increments("id").primary();
        t.integer("category_id").references("categories.id").defaultTo(1);
        t.integer("user_id")
          .references("users.id")
          .onUpdate("CASCADE")
          .onDelete("CASCADE");
        t.string("name");
        t.string("color");
        t.string("start_date");
        t.string("start_time");
        t.string("end_date");
        t.string("end_time");
        t.text("description");
        t.boolean("rvsp").defaultTo(false);
        t.index("category_id");
        t.index("user_id");
        t.timestamps();
      });
    }),
    knex.schema.hasTable("event_roles").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("event_roles", (t) => {
        t.integer("event_id")
          .references("events.id")
          .onUpdate("CASCADE")
          .onDelete("CASCADE");
        t.integer("role_id")
          .references("roles.id")
          .onUpdate("CASCADE")
          .onDelete("CASCADE");
      });
    }),
    knex.schema.hasTable("event_participants").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("event_participants", (t) => {
        t.integer("event_id")
          .references("events.id")
          .onUpdate("CASCADE")
          .onDelete("CASCADE");
        t.integer("user_id")
          .references("users.id")
          .onUpdate("CASCADE")
          .onDelete("CASCADE");
      });
    }),
    knex.schema.hasTable("categories").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("categories", (t) => {
        t.increments("id").primary();
        t.string("name");
        t.boolean("recruitment").defaultTo(false);
        t.unique("name");
        t.timestamps();
      });
    }),
    knex.schema.hasTable("post_types").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("post_types", (t) => {
        t.increments("id").primary();
        t.integer("user_id").references("users.id");
        t.string("name").unique();
        t.timestamps();
      });
    }),
    knex.schema.hasTable("forms").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("forms", (t) => {
        t.increments("id").primary();
        t.integer("category_id")
          .references("categories.id")
          .onUpdate("CASCADE");
        t.string("name");
        t.text("description");
        t.boolean("status").defaultTo(false);
        t.timestamps();
      });
    }),

    knex.schema.hasTable("fields").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("fields", (t) => {
        t.increments("id").primary();
        t.text("value");
        t.integer("order");
        t.enum("type", [
          "textfield",
          "textarea",
          "multiple",
          "select",
          "checkbox",
        ]);
        t.jsonb("options").nullable();
        t.boolean("optional").defaultTo(false);
      });
    }),
    knex.schema.hasTable("form_fields").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("form_fields", (t) => {
        t.integer("form_id")
          .references("forms.id")
          .onUpdate("CASCADE")
          .onDelete("CASCADE");
        t.integer("field_id")
          .references("fields.id")
          .onUpdate("CASCADE")
          .onDelete("CASCADE");
      });
    }),
    knex.schema.hasTable("menu").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("menu", (t) => {
        t.increments("id").primary();
        t.integer("order");
        t.string("title");
        t.string("icon");
        t.string("to");
        t.timestamps();
      });
    }),
    knex.schema.hasTable("menu_tree").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("menu_tree", (t) => {
        t.integer("menu_parent_id").references("menu.id");
        t.integer("menu_child_id").references("menu.id");
      });
    }),
    knex.schema.hasTable("posts").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("posts", (t) => {
        t.increments("id").primary();
        t.integer("user_id").references("users.id");
        t.integer("post_type").references("post_types.id");
        t.string("slug");
        t.string("title");
        t.string("featured_image");
        t.text("body");
        t.text("excerpt");
        t.boolean("has_excerpt").defaultTo(false);
        t.timestamps();
      });
    }),
    knex.schema.hasTable("media").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("media", (t) => {
        t.increments("id").primary();
        t.string("mimetype");
        t.string("url");
        t.string("storage_key");
        t.integer("user_id").references("users.id");
        t.timestamps();
      });
    }),
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.dropTableIfExists("user_form_fields"),
    knex.schema.dropTableIfExists("user_forms"),
    knex.schema.dropTableIfExists("form_fields"),
    knex.schema.dropTableIfExists("fields"),
    knex.schema.dropTableIfExists("forms"),

    knex.schema.dropTableIfExists("menu_tree"),
    knex.schema.dropTableIfExists("menu"),

    knex.schema.dropTableIfExists("event_participants"),
    knex.schema.dropTableIfExists("event_roles"),
    knex.schema.dropTableIfExists("events"),
    knex.schema.dropTableIfExists("categories"),

    knex.schema.dropTableIfExists("user_roles"),
    knex.schema.dropTableIfExists("role_permissions"),
    knex.schema.dropTableIfExists("permissions"),
    knex.schema.dropTableIfExists("roles"),

    knex.schema.dropTableIfExists("posts"),
    knex.schema.dropTableIfExists("post_types"),

    knex.schema.dropTableIfExists("media"),
    knex.schema.dropTableIfExists("users"),
  ]);
};
