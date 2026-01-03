/**
 * Error Handling Middleware
 * 
 * Global error handler for Express application.
 * Catches all errors and returns standardized error responses.
 * 
 * @module middleware/error
 */

import { serverError } from '../utils/responses.js';

/**
 * Global Error Handler
 * 
 * Catches all errors thrown in routes and middleware.
 * Must be registered after all other middleware and routes.
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} 500 - Internal server error response
 */
export function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error(err);

  // Avoid sending response if headers already sent
  if (res.headersSent) return next(err);

  const message = err?.message || 'Internal server error';
  return serverError(res, message);
}
