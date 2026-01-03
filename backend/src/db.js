/**
 * Database Connection Module
 * 
 * Manages PostgreSQL database connections using connection pooling
 * and provides utilities for executing queries and transactions.
 * 
 * @module db
 */

import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

/**
 * PostgreSQL Connection Pool
 * 
 * Maintains a pool of database connections for efficient resource management.
 * Connections are automatically reused and managed by the pool.
 * 
 * @type {Pool}
 */
export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
});

/**
 * Execute a SQL Query
 * 
 * Executes a parameterized SQL query using the connection pool.
 * Automatically handles connection acquisition and release.
 * 
 * @async
 * @param {string} text - SQL query string with optional parameter placeholders ($1, $2, etc.)
 * @param {Array} params - Array of parameter values to bind to the query
 * @returns {Promise<Object>} Query result object containing rows and metadata
 * 
 * @example
 * const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
 */
export async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Execute Function Within a Transaction
 * 
 * Wraps a database operation in a transaction with automatic commit/rollback.
 * Ensures data consistency by rolling back all changes if any error occurs.
 * 
 * @async
 * @param {Function} fn - Async function that receives a database client and performs operations
 * @returns {Promise<*>} Result returned by the provided function
 * @throws {Error} Re-throws any error after rolling back the transaction
 * 
 * @example
 * await withTransaction(async (client) => {
 *   await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
 *   await client.query('INSERT INTO audit_log (action) VALUES ($1)', ['user_created']);
 * });
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    // Begin transaction
    await client.query('BEGIN');

    // Execute the provided function with the client
    const result = await fn(client);

    // Commit transaction if successful
    await client.query('COMMIT');
    return result;
  } catch (err) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    throw err;
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}
