"use strict";
module.exports = function filterQuery(query, filters) {
  if (filters && Object.keys(filters).length) {
    Object.entries(filters).forEach(([key, val]) => {
      query =
        val && Array.isArray(val)
          ? query.whereIn(key, val)
          : query.andWhere(key, val);
    });
  }

  return query;
};
