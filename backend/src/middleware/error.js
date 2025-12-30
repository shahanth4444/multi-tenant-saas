import { serverError } from '../utils/responses.js';

export function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  const message = err?.message || 'Internal server error';
  return serverError(res, message);
}
