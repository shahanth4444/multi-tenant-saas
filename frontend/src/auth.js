/**
 * Authentication Utilities
 * 
 * Provides helper functions for managing JWT tokens in localStorage.
 * Used for client-side authentication state management.
 * 
 * @module auth
 */

/**
 * Store JWT Token
 * 
 * Saves the JWT token to localStorage for persistent authentication.
 * 
 * @param {string} t - JWT token string
 */
export function setToken(t) { localStorage.setItem('token', t) }

/**
 * Retrieve JWT Token
 * 
 * Gets the stored JWT token from localStorage.
 * 
 * @returns {string|null} JWT token or null if not found
 */
export function getToken() { return localStorage.getItem('token') }

/**
 * Clear JWT Token
 * 
 * Removes the JWT token from localStorage (used during logout).
 */
export function clearToken() { localStorage.removeItem('token') }
