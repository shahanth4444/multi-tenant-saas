/**
 * Main API Router
 * 
 * Aggregates all API route modules and mounts them under their respective paths.
 * All routes are prefixed with /api in the main application.
 * 
 * @module routes/index
 */

import express from 'express';
import authRoutes from './auth.routes.js';
import tenantsRoutes from './tenants.routes.js';
import usersRoutes from './users.routes.js';
import projectsRoutes from './projects.routes.js';
import tasksRoutes from './tasks.routes.js';

const router = express.Router();

// Mount route modules
router.use('/auth', authRoutes);        // Authentication endpoints
router.use('/tenants', tenantsRoutes);  // Tenant management endpoints
router.use('/users', usersRoutes);      // User management endpoints
router.use('/projects', projectsRoutes);// Project management endpoints
router.use('/', tasksRoutes);           // Task management endpoints

export default router;
