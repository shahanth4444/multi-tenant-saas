import express from 'express';
import authRoutes from './auth.routes.js';
import tenantsRoutes from './tenants.routes.js';
import usersRoutes from './users.routes.js';
import projectsRoutes from './projects.routes.js';
import tasksRoutes from './tasks.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/tenants', tenantsRoutes);
router.use('/users', usersRoutes);
router.use('/projects', projectsRoutes);
router.use('/', tasksRoutes);

export default router;
