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
        t.boolean("is_disabled").defaultTo(false);
        t.timestamps();
      });
    }),
    knex.schema.hasTable("roles").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("roles", (t) => {
        t.increments("id").primary();
        t.string("name").unique();
        t.enum("level", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).defaultTo(10);
        t.boolean("default").defaultTo(false);
        t.boolean("can_view_admin").defaultTo(false);
        t.boolean("can_edit_fp").defaultTo(false);

        t.boolean("can_view_posts").defaultTo(false);
        // t.boolean("can_view_maps").defaultTo(false);
        t.boolean("can_view_forms").defaultTo(false);
        t.boolean("can_view_events").defaultTo(false);
        t.boolean("can_view_pins").defaultTo(false);
        t.boolean("can_view_users").defaultTo(false);
        t.boolean("can_view_roles").defaultTo(false);

        t.boolean("can_edit_posts").defaultTo(false);
        // t.boolean("can_edit_maps").defaultTo(false);
        t.boolean("can_edit_forms").defaultTo(false);
        t.boolean("can_edit_events").defaultTo(false);
        t.boolean("can_edit_pins").defaultTo(false);
        t.boolean("can_edit_users").defaultTo(false);
        t.boolean("can_edit_roles").defaultTo(false);

        t.boolean("can_add_posts").defaultTo(false);
        // t.boolean("can_add_maps").defaultTo(false);

        t.boolean("can_add_events").defaultTo(false);
        t.boolean("can_add_pins").defaultTo(false);
        t.boolean("can_add_users").defaultTo(false);
        t.boolean("can_add_roles").defaultTo(false);
        t.boolean("can_add_form").defaultTo(false);

        t.boolean("can_remove_posts").defaultTo(false);
        // t.boolean("can_remove_maps").defaultTo(false);
        t.boolean("can_add_forms").defaultTo(false);

        t.boolean("can_remove_events").defaultTo(false);
        t.boolean("can_remove_pins").defaultTo(false);
        t.boolean("can_remove_users").defaultTo(false);
        t.boolean("can_remove_roles").defaultTo(false);
        t.boolean("can_remove_form").defaultTo(false);

        t.boolean("can_disable_posts").defaultTo(false);
        // t.boolean("can_disable_maps").defaultTo(false);
        t.boolean("can_disable_events").defaultTo(false);
        t.boolean("can_disable_pins").defaultTo(false);
        t.boolean("can_disable_users").defaultTo(false);
        t.boolean("can_disable_roles").defaultTo(false);

        // t.boolean("can_upload_maps").defaultTo(false);
        // t.boolean("can_upload_pins").defaultTo(false);

        t.boolean("can_upload_media").defaultTo(false);
        t.boolean("can_view_media").defaultTo(false);
        t.boolean("can_remove_media").defaultTo(false);

        t.boolean("is_disabled").defaultTo(false);
        t.boolean("is_removable").defaultTo(true);
        t.timestamps();
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
    // knex.schema.hasTable("maps").then((exists) => {
    //   if (exists) return;
    //   return knex.schema.createTable("maps", (t) => {
    //     t.increments("id").primary();
    //     t.integer("template_id").references("map_templates.id");
    //     t.string("slug").unique();
    //     t.string("name");
    //     t.boolean("is_disabled").defaultTo(false);
    //     t.timestamps();
    //   });
    // }),
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
        t.string("startDate");
        t.string("startTime");
        t.string("endDate");
        t.string("endTime");
        t.text("description");
        t.boolean("rvsp").defaultTo(false);
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
        t.integer("event_banner").references("media.id");
        t.integer("page_header").references("media.id");
        t.string("name");
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
        t.boolean("status").nullable();
        t.unique("status");
        t.timestamps();
      });
    }),
    knex.schema.hasTable("fields").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("fields", (t) => {
        t.increments("id").primary();
        t.text("value");
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
    // knex.schema.hasTable("form_field_children").then((exists) => {
    //   if (exists) return;
    //   return knex.schema.createTable("form_field_children", (t) => {
    //     t.increments("id").primary();
    //     t.integer("field_parent_id")
    //       .references("fields.id")
    //       .onUpdate("CASCADE")
    //       .onDelete("CASCADE");
    //     t.string("value");
    //   });
    // }),

    knex.schema.hasTable("menu").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("menu", (t) => {
        t.increments("id").primary();
        t.integer("order");
        t.string("title");
        t.string("icon");
        t.string("to");
        t.boolean("disable").defaultTo(false);
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
        t.string("image");
        t.text("body");
        t.text("excerpt");
        t.boolean("has_excerpt").defaultTo(false);
        t.timestamps();
      });
    }),
    // knex.schema.hasTable("map_templates").then((exists) => {
    //   if (exists) return;
    //   return knex.schema.createTable("map_templates", (t) => {
    //     t.increments("id").primary();
    //     t.string("url");
    //     t.string("s3_key");
    //     t.integer("user_id").references("users.id");
    //     t.boolean("is_disabled").defaultTo(false);
    //     t.timestamps();
    //   });
    // }),
    // knex.schema.hasTable("pins").then((exists) => {
    //   if (exists) return;
    //   return knex.schema.createTable("pins", (t) => {
    //     t.increments("id").primary();
    //     t.string("name");
    //     t.string("icon");
    //     t.string("s3_key");
    //     t.enum("type", [
    //       "friendly",
    //       "enemy",
    //       "friendlyBase",
    //       "enemyBase",
    //     ]).defaultTo("enemy");
    //     t.boolean("is_disabled").defaultTo(false);
    //     t.timestamps();
    //   });
    // }),
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
    // knex.schema.hasTable("map_pins").then((exists) => {
    //   if (exists) return;
    //   return knex.schema.createTable("map_pins", (t) => {
    //     t.increments("id").primary();
    //     t.integer("map_id").references("maps.id");
    //     t.integer("pin_id").references("pins.id");
    //     t.integer("x").defaultTo(0);
    //     t.integer("y").defaultTo(0);
    //     t.boolean("is_disabled").defaultTo(false);
    //     t.timestamps();
    //   });
    // }),
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    // knex.schema.dropTableIfExists("form_field_children"),
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
    knex.schema.dropTableIfExists("roles"),

    knex.schema.dropTableIfExists("posts"),
    knex.schema.dropTableIfExists("post_types"),

    // knex.schema.dropTableIfExists("map_pins"),
    // knex.schema.dropTableIfExists("maps"),
    // knex.schema.dropTableIfExists("map_templates"),
    knex.schema.dropTableIfExists("media"),
    knex.schema.dropTableIfExists("pins"),
    knex.schema.dropTableIfExists("users"),
  ]);
};
