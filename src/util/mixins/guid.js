"use strict";
const uuid = require("uuid4");

module.exports = (options) => {
  options = Object.assign({ field: "id", generateGuid: () => uuid() }, options);

  return (Model) => {
    return class extends Model {
      $beforeInsert(context) {
        const parent = super.$beforeInsert(context);

        return Promise.resolve(parent)
          .then(
            () =>
              this[options.field] || options.generateGuid.call(this, context)
          )
          .then((guid) => (this[options.field] = guid));
      }
    };
  };
};
