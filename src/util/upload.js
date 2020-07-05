"use strict";
const multer = require("multer");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
const path = require("path");

const s3 = new aws.S3();

/*** FUNCTION CHECK FILE TYPE***/
const fileFilter = function (req, file, cb) {
  const types = /png|webp/;
  const ext = types.test(path.extname(file.originalname).toLowerCase());
  const mimetype = types.test(file.mimetype);
  if (mimetype && ext) cb(null, true);
  else cb(new Error("Images with types: 'png' or 'webp' only."));
};

/**
 *
 */
module.exports = function (opts) {
  opts.dest = typeof opts.dest === undefined ? "maps/" : opts.dest;

  const storage = multerS3({
    s3: s3,
    bucket: opts.bucket,
    acl: opts.acl || "public-read",
    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },
    key(req, file, cb) {
      console.log(file);
      const ext = path.extname(file.originalname).toLowerCase();
      const name = opts.dest + Date.now() + ext;
      cb(null, name);
    },
  });

  const config = {
    fileFilter,
    limits: {
      fileSize: process.env.MAX_FILE_SIZE,
    },
    storage,
  };

  const upload = multer(config).fields(opts.fields);

  return function (req, res, next) {
    upload(req, res, async (err) => {
      console.log("file", req.file || req.files);
      if (err) {
        console.log(err);
        res.boom.badImplementation();
      } else {
        if (req.files === undefined) {
          console.log("Error: no file selected.");
          res.boom.badImplementation("No file selected.");
        } else {
          next();
        }
      }
    });
  };
};
