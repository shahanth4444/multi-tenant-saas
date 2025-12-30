import { validationResult } from 'express-validator';
import { badRequest } from '../utils/responses.js';

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequest(res, errors.array().map(e => `${e.param}: ${e.msg}`).join(', '));
  }
  next();
}
