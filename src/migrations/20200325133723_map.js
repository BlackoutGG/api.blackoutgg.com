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
        t.boolean("can_access_admin").defaultTo(false);

        t.boolean("can_view_posts").defaultTo(false);
        t.boolean("can_view_maps").defaultTo(false);
        t.boolean("can_view_events").defaultTo(false);
        t.boolean("can_view_pins").defaultTo(false);
        t.boolean("can_view_users").defaultTo(false);
        t.boolean("can_view_roles").defaultTo(false);

        t.boolean("can_edit_posts").defaultTo(false);
        t.boolean("can_edit_maps").defaultTo(false);
        t.boolean("can_edit_events").defaultTo(false);
        t.boolean("can_edit_pins").defaultTo(false);
        t.boolean("can_edit_users").defaultTo(false);
        t.boolean("can_edit_roles").defaultTo(false);

        t.boolean("can_add_posts").defaultTo(false);
        t.boolean("can_add_maps").defaultTo(false);
        t.boolean("can_add_events").defaultTo(false);
        t.boolean("can_add_pins").defaultTo(false);
        t.boolean("can_add_users").defaultTo(false);
        t.boolean("can_add_roles").defaultTo(false);

        t.boolean("can_remove_posts").defaultTo(false);
        t.boolean("can_remove_maps").defaultTo(false);
        t.boolean("can_remove_events").defaultTo(false);
        t.boolean("can_remove_pins").defaultTo(false);
        t.boolean("can_remove_users").defaultTo(false);
        t.boolean("can_remove_roles").defaultTo(false);

        t.boolean("can_disable_posts").defaultTo(false);
        t.boolean("can_disable_maps").defaultTo(false);
        t.boolean("can_disable_events").defaultTo(false);
        t.boolean("can_disable_pins").defaultTo(false);
        t.boolean("can_disable_users").defaultTo(false);
        t.boolean("can_disable_roles").defaultTo(false);

        t.boolean("can_upload_maps").defaultTo(false);
        t.boolean("can_upload_pins").defaultTo(false);
        t.boolean("can_upload_media").defaultTo(false);

        t.boolean("is_disabled").defaultTo(false);
        t.boolean("is_removable").defaultTo(true);
        t.timestamps();
      });
    }),
    knex.schema.hasTable("user_roles").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("user_roles", (t) => {
        t.integer("user_id").references("users.id");
        t.integer("role_id").references("roles.id");
      });
    }),
    knex.schema.hasTable("maps").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("maps", (t) => {
        t.increments("id").primary();
        t.integer("template_id").references("map_templates.id");
        t.string("slug").unique();
        t.string("name");
        t.boolean("is_disabled").defaultTo(false);
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
    knex.schema.hasTable("map_templates").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("map_templates", (t) => {
        t.increments("id").primary();
        t.string("url");
        t.string("s3_key");
        t.integer("user_id").references("users.id");
        t.boolean("is_disabled").defaultTo(false);
        t.timestamps();
      });
    }),
    knex.schema.hasTable("pins").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("pins", (t) => {
        t.increments("id").primary();
        t.string("name");
        t.string("icon");
        t.string("s3_key");
        t.enum("type", [
          "friendly",
          "enemy",
          "friendlyBase",
          "enemyBase",
        ]).defaultTo("enemy");
        t.boolean("is_disabled").defaultTo(false);
        t.timestamps();
      });
    }),
    knex.schema.hasTable("media").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("media", (t) => {
        t.increments("id").primary();
        t.string("mimetype");
        t.string("url");
        t.string("s3_key");
        t.integer("user_id").references("users.id");
        t.timestamps();
      });
    }),
    knex.schema.hasTable("map_pins").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("map_pins", (t) => {
        t.increments("id").primary();
        t.integer("map_id").references("maps.id");
        t.integer("pin_id").references("pins.id");
        t.integer("x").defaultTo(0);
        t.integer("y").defaultTo(0);
        t.boolean("is_disabled").defaultTo(false);
        t.timestamps();
      });
    }),
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.dropTableIfExists("user_roles"),
    knex.schema.dropTableIfExists("roles"),

    knex.schema.dropTableIfExists("posts"),
    knex.schema.dropTableIfExists("post_types"),

    knex.schema.dropTableIfExists("map_pins"),
    knex.schema.dropTableIfExists("maps"),
    knex.schema.dropTableIfExists("map_templates"),
    knex.schema.dropTableIfExists("media"),
    knex.schema.dropTableIfExists("pins"),
    knex.schema.dropTableIfExists("users"),
  ]);
};
