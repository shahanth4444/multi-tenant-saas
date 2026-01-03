/**
 * Express Application Setup
 * 
 * This module configures and exports the main Express application instance
 * with all necessary middleware, security configurations, and routing.
 * 
 * @module app
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/error.js';

// Initialize Express application
const app = express();

/**
 * Security Middleware Configuration
 * 
 * Helmet helps secure Express apps by setting various HTTP headers
 * to protect against common web vulnerabilities
 */
app.use(helmet());

// Disable x-powered-by header to prevent information disclosure
app.disable('x-powered-by');

/**
 * CORS Configuration
 * 
 * Configure Cross-Origin Resource Sharing to allow requests from
 * the frontend application and local development environments
 */
const allowedOrigins = [config.server.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: false }));

/**
 * Body Parser Middleware
 * 
 * Parse incoming JSON request bodies and make the data available
 * in req.body for all routes
 */
app.use(express.json());

/**
 * HTTP Request Logger
 * 
 * Morgan provides detailed logging of all HTTP requests in development mode
 * for debugging and monitoring purposes
 */
app.use(morgan('dev'));

/**
 * API Routes
 * 
 * Mount all application routes under the /api prefix
 * Routes are defined in the routes/index.js module
 */
app.use('/api', router);

/**
 * Global Error Handler
 * 
 * Catch and handle all errors that occur during request processing
 * Must be registered after all other middleware and routes
 */
app.use(errorHandler);

export default app;
