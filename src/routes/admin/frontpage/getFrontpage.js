"use strict";
const Base = require("$base");
const knex = Base.knex();

const getFrontpage = async function (req, res) {
  const infoblocks = knex("front_page_info").orderBy("order");
  const testimonies = knex("testimonies").orderBy("order");

  const [info, _testimonies] = await Promise.all([
    settings,
    infoblocks,
    testimonies,
  ]);

  res.status(200).send({
    info,
    testimonies: _testimonies,
  });
};

module.exports = {
  path: "/frontpage",
  method: "GET",
  handler: getFrontpage,
};
