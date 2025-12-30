import express from 'express';
import { auth } from '../middleware/auth.js';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { createProject, listProjects, updateProject, deleteProject } from '../controllers/projects.controller.js';

const router = express.Router();

router.post('/', auth,
  body('name').isString().isLength({ min: 2 }),
  body('description').optional().isString(),
  body('status').optional().isIn(['active','archived','completed']),
  validate,
  createProject
);

router.get('/', auth,
  query('status').optional().isIn(['active','archived','completed']),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  listProjects
);

router.put('/:projectId', auth,
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('status').optional().isIn(['active','archived','completed']),
  validate,
  updateProject
);

router.delete('/:projectId', auth, deleteProject);

export default router;
