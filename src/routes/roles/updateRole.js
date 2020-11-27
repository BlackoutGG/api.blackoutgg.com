"use strict";
const RolePermissions = require("./models/RolePermissions");
const Roles = require("./models/Roles");
const User = require("$models/User");
const guard = require("express-jwt-permissions")();

const { param, body } = require("express-validator");
const { validate } = require("$util");

const validators = validate([
  param("id").isNumeric().toInt(10),
  body("details.name").optional().isAlphanumeric().escape().trim(),
  body("details.level")
    .optional()
    .custom((v, { req }) => v >= req.user.level),
  body("remove.*").optional().isNumeric(),
  body("added.*").optional().isNumeric(),
]);

const middleware = [guard.check("update:roles"), validators];

const graphFn = (id, details, added) => {
  const data = { id, created_at: new Date().toISOString() };

  if (details && Object.keys(details)) {
    Object.assign(data, { details });
  }

  if (added && added.length) {
    Object.assign(data, {
      role_perms: added.map((perm) => ({
        role_id: id,
        perm_id: perm,
      })),
    });
  }

  return data;
};

const options = { noDelete: true, relate: true };

const updateRole = async (req, res, next) => {
  const details = req.body.details || null,
    remove = req.body.remove || null,
    added = req.body.added || null;

  console.log(req.body);

  try {
    const results = await Roles.transaction(async (trx) => {
      let toUpdate = {}, token;


      if (remove && remove.length) {
        await RolePermissions.query(trx)
          .whereIn("perm_id", remove)
          .andWhere("role_id", req.params.id)
          .delete();
      }

      // const result = await Roles.query(trx)
      //   .upsertGraph(graphFn(req.params.id, details, added), options)
      //   .returning("*");

      if (added && added.length) {
        const insert = added.map((perm_id) => ({
          role_id: req.params.id,
          perm_id,
        }));

        await RolePermissions.query(trx).insert(insert).returning("*");
      }

      if (added || remove) {
        tokens = await User.query(trx)
          .joinRelated("roles")
          .select("token_id")
          .where("roles.id", req.params.id)
          .distinct();
      }

      if (details && Object.keys(details).length) {
        Object.assign(toUpdate, details);
        console.log(toUpdate);
      }

      const _details = await Roles.query(trx)
        .patch({ updated_at: new Date().toISOString(), ...toUpdate })
        .where("id", req.params.id)
        .first()
        .returning(["id", "name", "level", "created_at", "updated_at"]);

      return { details: _details, tokensIDs };
    });

    /**
     * If a permission changes on a role, we pull all the users with that role
     * and revoke their tokens.
     */
    if (results.tokenIDs && results.tokenIDs.length) {
      let blacklist;

      const stream = req.redis.scanStream({ match: "blacklist:*", count: 100 });

      stream.on("data", (keys) => {
        const ids = result.tokenIDs.map((id) => `blacklist:${id}`);
        blacklist = keys.reduce((output, key) => {
          if (!ids.includes(key)) {
            output.push(key);
          }
          return output;
        }, []);
      });

      stream.on("end", async () => {
        if (blacklist && blacklist.length) {
          const setCommands = blacklist.map((key) => {
            return ["set", key, key, "EX", 60 * 60 * 24];
          });

          await req.redis.multi(setCommands).exec();
        }
      });
    }

    res.status(200).send({ role: results.details });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  path: "/:id",
  method: "PUT",
  middleware,
  handler: updateRole,
};
