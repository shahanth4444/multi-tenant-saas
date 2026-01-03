/**
 * Input Validation Middleware
 * 
 * Processes validation results from express-validator and returns errors.
 * Used after validation rules in route definitions.
 * 
 * @module middleware/validate
 */

import { validationResult } from 'express-validator';
import { badRequest } from '../utils/responses.js';

/**
 * Validate Request Input
 * 
 * Checks validation results and returns 400 error if validation fails.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} 400 - If validation errors exist
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequest(res, errors.array().map(e => `${e.param}: ${e.msg}`).join(', '));
  }
  next();
}
