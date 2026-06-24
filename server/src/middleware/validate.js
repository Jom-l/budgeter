// Wraps a zod schema; validates req.body and replaces it with parsed data.
export function validate(schema) {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}
