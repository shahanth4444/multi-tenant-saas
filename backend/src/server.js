/**
 * Server Entry Point
 * 
 * Initializes the database, sets up health check endpoint,
 * and starts the Express server.
 * 
 * @module server
 */

import { config } from './config.js';
import app from './app.js';
import { initDatabaseAndSeed } from './init.js';
import { query } from './db.js';

/**
 * Start the Application Server
 * 
 * Performs the following startup sequence:
 * 1. Initialize database schema and seed data if configured
 * 2. Register health check endpoint
 * 3. Start HTTP server on configured port
 * 
 * @async
 * @throws {Error} Exits process with code 1 if startup fails
 */
async function start() {
  try {
    // Initialize database schema and optionally seed data
    await initDatabaseAndSeed();

    /**
     * Health Check Endpoint
     * 
     * Returns server and database connection status.
     * Used by load balancers and monitoring systems.
     * 
     * @route GET /api/health
     * @returns {Object} 200 - Health status with database connectivity
     * @returns {Object} 500 - Error status if database is unreachable
     */
    app.get('/api/health', async (req, res) => {
      try {
        // Test database connectivity with simple query
        await query('SELECT 1');
        return res.json({ status: 'ok', database: 'connected' });
      } catch (e) {
        return res.status(500).json({ status: 'error', database: 'disconnected' });
      }
    });

    // Start the HTTP server
    app.listen(config.server.port, () => {
      console.log(`Backend listening on :${config.server.port}`);
    });
  } catch (e) {
    // Log startup errors and exit with failure code
    console.error('Startup error:', e);
    process.exit(1);
  }
}

// Start the application
start();
