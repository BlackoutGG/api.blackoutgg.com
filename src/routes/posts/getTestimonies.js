"use strict";
const Testimony = require("$models/Testimony");
const { query } = require("express-validator");
const { validate } = require("$util");

const columns = ["id", "avatar", "username"];

const getTestimonies = async function (req, res) {
  const prevCursor = req.query.prevCursor,
    nextCursor = req.query.nextCursor;

  const testimonies = Testimony.query()
    .orderBy("order", "asc")
    .select(columns)
    .limit(req.query.limit || 10);

  let query;

  if (nextCursor) {
    query = await testimonies.clone().cursorPage(nextCursor);
  } else if (prevCursor) {
    query = await testimonies.clone().cursorPage(prevCursor);
  } else {
    query = await testimonies.clone().cursorPage();
  }

  console.log(query);

  res.status(200).send(query);
};

module.exports = {
  path: "/",
  method: "GET",
  middleware: [
    validate([query("nextCursor").optional().isString().escape().trim()]),
  ],
  handler: getTestimonies,
};
