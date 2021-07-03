exports.up = function (knex) {
  return Promise.all([
    knex.schema.hasTable("users").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("users", (t) => {
        t.increments("id").primary();
        t.string("discord_id").unique();
        t.string("email").unique();
        t.string("username").unique();
        t.string("first_name");
        t.string("last_name");
        t.string("location");
        t.string("birthday");
        t.enum("gender", ["Male", "Female", "Other"]);
        t.text("description");
        t.string("password");
        t.string("avatar");
        t.index("discord_id");
        t.boolean("active").defaultTo(false);
        t.integer("login_attempts").defaultTo(0);
        t.date("last_activation_email_sent");
        t.date("last_password_reset_sent");
        t.date("last_signed_in");
        t.timestamps();
      });
    }),
    knex.schema.hasTable("user_sessions").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("user_sessions", (t) => {
        t.increments("id").primary();
        t.integer("user_id").references("users.id");
        t.string("token_id");
        t.string("refresh_token_id");
        t.timestamp("expires");
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
        t.boolean("is_deletable").default(true);
        t.boolean("is_removable").default(true);
        t.timestamps();
      });
    }),
    knex.schema.hasTable("role_policies").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("role_policies", (t) => {
        t.integer("role_id")
          .references("id")
          .inTable("roles")
          .onDelete("CASCADE");
        t.integer("policy_id")
          .references("id")
          .inTable("policies")
          .onDelete("CASCADE");
      });
    }),
    knex.schema.hasTable("policies").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("policies", (t) => {
        t.increments("id").primary();
        t.enum("action", ["view", "add", "update", "delete"]);
        // t.string("action");
        t.enum("target", ["own", "all"]);
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
    knex.schema.hasTable("user_policies").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("user_policies", (t) => {
        t.integer("user_id")
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        t.integer("policy_id")
          .references("id")
          .inTable("policies")
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
    knex.schema.hasTable("testimonies").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("testimonies", (t) => {
        t.increments("id").primary();
        t.integer("order");
        t.string("author");
        t.string("avatar");
        t.text("text");
        t.timestamps();
      });
    }),
    knex.schema.hasTable("settings").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("settings", (t) => {
        t.increments("id").primary();
        t.boolean("show_history_carousel_on_frontpage").defaultTo(true);
        t.boolean("show_video").defaultTo(true);
        t.boolean("show_video_on_mobile").defaultTo(true);
        t.boolean("show_testimonies").defaultTo(true);

        t.boolean("show_recruitment_button").defaultTo(true);
        t.boolean("enable_social_authentication").defaultTo(true);
        t.integer("password_reset_request_ttl_in_minutes").defaultTo(10);
        t.integer("password_reset_resend_timer_in_minutes").defaultTo(10);
        t.integer("user_activation_request_ttl_in_minutes").defaultTo(10);
        t.integer("user_activation_resend_timer_in_minutes").defaultTo(10);
        t.string("front_page_video_url").defaultTo(
          "https://blackout-gaming.s3.amazonaws.com/video/0001-0876.webm"
        );
      });
    }),

    // knex.schema.hasTable("front_page_info").then((exists) => {
    //   if (exists) return;
    //   return knex.schema.createTable("front_page_info", (t) => {
    //     t.increments("id").primary();
    //     t.integer("order");
    //     t.string("title");
    //     t.string("text");
    //     t.enum("position", ["left", "right"]).defaultTo("right");
    //     t.string("image");
    //     t.timestamps();
    //   });
    // }),
    // knex.schema.hasTable("events").then((exists) => {
    //   if (exists) return;
    //   return knex.schema.createTable("events", (t) => {
    //     t.increments("id").primary();
    //     t.integer("category_id").references("categories.id").defaultTo(1);
    //     t.integer("user_id")
    //       .references("users.id")
    //       .onUpdate("CASCADE")
    //       .onDelete("CASCADE");
    //     t.string("title");
    //     t.string("start_time");
    //     t.string("end_time");
    //     t.string("color");
    //     t.enum("interval", ["once", "daily", "weekly", "monthly"]).defaultTo(
    //       "once"
    //     );
    //     t.text("description");
    //     t.boolean("rvsp").defaultTo(false);
    //     t.boolean("all_day").defaultTo(false);
    //     t.index("user_id");
    //     t.timestamps();
    //   });
    // }),
    // knex.schema.hasTable("event_meta").then((exists) => {
    //   if (exists) return;
    //   return knex.schema.createTable("event_meta", (t) => {
    //     t.increments("id").primary();
    //     t.string("group_id").nullable();
    //     t.integer("event_id")
    //       .references("events.id")
    //       .onDelete("CASCADE")
    //       .onUpdate("CASCADE");
    //     t.date("start_date");
    //     t.date("end_date");
    //   });
    // }),
    // // knex.schema.raw("ALTER TABLE events_meta ADD duration daterange"),
    // knex.schema.hasTable("event_roles").then((exists) => {
    //   if (exists) return;
    //   return knex.schema.createTable("event_roles", (t) => {
    //     t.integer("event_id")
    //       .references("events.id")
    //       .onUpdate("CASCADE")
    //       .onDelete("CASCADE");
    //     t.integer("role_id")
    //       .references("roles.id")
    //       .onUpdate("CASCADE")
    //       .onDelete("CASCADE");
    //   });
    // }),
    // knex.schema.hasTable("event_participants").then((exists) => {
    //   if (exists) return;
    //   return knex.schema.createTable("event_participants", (t) => {
    //     t.integer("event_id")
    //       .references("event_meta.id")
    //       .onUpdate("CASCADE")
    //       .onDelete("CASCADE");
    //     t.integer("user_id")
    //       .references("users.id")
    //       .onUpdate("CASCADE")
    //       .onDelete("CASCADE");
    //   });
    // }),
    knex.schema.hasTable("categories").then((exists) => {
      if (exists) return;
      return knex.schema.createTable("categories", (t) => {
        t.increments("id").primary();
        t.string("name");
        t.boolean("enable_recruitment").defaultTo(false);
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
          .onUpdate("CASCADE")
          .onDelete("CASCADE");
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
        t.integer("owner_id").references("users.id");
        t.timestamps();
      });
    }),
  ]);
};

exports.down = async function (knex) {
  try {
    await knex.raw(
      `DROP TABLE IF EXISTS user_form_fields, 
      user_forms, user_sessions, user_policies, form_fields, fields, 
      forms, menu_tree, menu, event_participants, 
      event_roles, event_meta, events, categories, 
      user_roles, role_policies, policies, 
      users, roles, media, posts, post_types, testimonies, 
      settings, front_page_info`
    );
  } catch (err) {
    throw err;
  }
};
