"use strict";
const multer = require("multer");
const util = require("util");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
const path = require("path");
const { nanoid } = require("nanoid");

const s3 = new aws.S3();

/*** FUNCTION CHECK FILE TYPE***/
const fileFilter = function (req, file, cb) {
  const types = /jpe?g|png|webp|svg|gif/;
  const ext = types.test(path.extname(file.originalname).toLowerCase());
  const mimetype = types.test(file.mimetype);
  if (mimetype && ext) cb(null, true);
  else cb(new Error("Images with types: jpg/jpeg, png, svg or webp only."));
};

/**
 *
 */
const uploadFiles = function (opts) {
  const dest = opts && opts.dest ? opts.dest : "upload/";

  const storage = multerS3({
    s3: s3,
    bucket: opts.bucket,
    acl: opts.acl || "public-read",
    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },
    key(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = dest + nanoid() + ext;
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

  const promise = util.promisify(upload);

  const standard = function (req, res, next) {
    upload(req, res, async (err) => {
      if (err) {
        console.log(err);
        res.status(422).send();
      } else {
        if (req.files === undefined) {
          res.status(422).send("No file selected.");
        } else {
          next();
        }
      }
    });
  };

  return {
    standard,
    promise,
  };
};

const deleteFiles = async (bucket, keys) => {
  if (!bucket) throw new Error("Missing bucket name.");
  if (!Array.isArray(keys)) {
    throw new Error(
      "the keys argument must be an array containing s3 keys for deletion."
    );
  }

  const params = {
    Bucket: bucket,
    Delete: {
      Objects: keys.map((key) => ({ Key: key })),
    },
  };

  try {
    const results = await s3.deleteObjects(params).promise();
    if (results.Errors.length) return Promise.reject(results.Errors);
    else return results;
  } catch (err) {
    return Promise.reject(err);
  }
};

module.exports = { uploadFiles, deleteFiles };
