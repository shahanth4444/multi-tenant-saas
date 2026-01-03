/**
 * HTTP Response Utilities
 * 
 * Provides standardized response helper functions for consistent API responses.
 * All responses follow a common format with success flag, message, and data.
 * 
 * @module utils/responses
 */

/**
 * Send 200 OK Response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @returns {Object} JSON response with status 200
 */
export function ok(res, data, message) {
  return res.status(200).json({ success: true, message, data });
}

/**
 * Send 201 Created Response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 * @returns {Object} JSON response with status 201
 */
export function created(res, data, message) {
  return res.status(201).json({ success: true, message, data });
}

/**
 * Send 400 Bad Request Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} JSON response with status 400
 */
export function badRequest(res, message) {
  return res.status(400).json({ success: false, message });
}

/**
 * Send 401 Unauthorized Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} JSON response with status 401
 */
export function unauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({ success: false, message });
}

/**
 * Send 403 Forbidden Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} JSON response with status 403
 */
export function forbidden(res, message = 'Forbidden') {
  return res.status(403).json({ success: false, message });
}

/**
 * Send 404 Not Found Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} JSON response with status 404
 */
export function notFound(res, message = 'Not found') {
  return res.status(404).json({ success: false, message });
}

/**
 * Send 409 Conflict Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} JSON response with status 409
 */
export function conflict(res, message = 'Conflict') {
  return res.status(409).json({ success: false, message });
}

/**
 * Send 500 Internal Server Error Response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} JSON response with status 500
 */
export function serverError(res, message = 'Internal server error') {
  return res.status(500).json({ success: false, message });
}
