const { isThisQuarter } = require("date-fns");

module.exports = function dateMixin(Model) {
  const date = new Date().toISOString();
  return class extends Model {
    $beforeInsert(context) {
      super.$beforeInsert(context);
      this.created_at = date;
      this.updated_at = date;
    }

    $beforeUpdate(context) {
      super.$beforeUpdate(context);
      this.updated_at = date;
    }
  };
};
