module.exports = (options) => {
  options = Object.assign(
    { createdAtField: "created_at", updatedAtField: "updated_at" },
    options
  );

  const date = new Date().toISOString();

  return (Model) => {
    return class extends Model {
      $beforeInsert(context) {
        super.$beforeInsert(context);
        this[options.createdAtField] = date;
        this[options.updatedAtField] = date;
      }
      $beforeUpdate(context) {
        super.$beforeUpdate(context);
        this[options.updatedAtField] = date;
      }
    };
  };
};
