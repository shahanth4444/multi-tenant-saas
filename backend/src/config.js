/**
 * Application Configuration Module
 * 
 * Centralizes all application configuration settings loaded from environment variables.
 * Uses dotenv to load variables from .env file in development.
 * 
 * @module config
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Application Configuration Object
 * 
 * @typedef {Object} Config
 * @property {Object} db - Database connection configuration
 * @property {string} db.host - PostgreSQL host address
 * @property {number} db.port - PostgreSQL port number
 * @property {string} db.database - Database name
 * @property {string} db.user - Database username
 * @property {string} db.password - Database password
 * 
 * @property {Object} jwt - JSON Web Token configuration
 * @property {string} jwt.secret - Secret key for signing JWTs
 * @property {string} jwt.expiresIn - Token expiration time (e.g., '24h', '7d')
 * 
 * @property {Object} server - Server configuration
 * @property {number} server.port - Port number for the Express server
 * @property {string} server.env - Environment mode (development/production)
 * @property {string} server.frontendUrl - Frontend application URL for CORS
 * 
 * @property {boolean} seedOnStart - Whether to seed database on application start
 */
export const config = {
  // Database connection settings
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'saas_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  // JWT authentication settings
  jwt: {
    secret: process.env.JWT_SECRET || 'change_me_to_long_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Server configuration
  server: {
    port: Number(process.env.PORT || 5000),
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Database seeding flag
  seedOnStart: (process.env.SEED_ON_START || 'false').toLowerCase() === 'true',
};
