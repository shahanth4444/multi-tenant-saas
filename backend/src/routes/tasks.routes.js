import express from 'express';
import { auth } from '../middleware/auth.js';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { createTask, listProjectTasks, updateTaskStatus, updateTask } from '../controllers/tasks.controller.js';

const router = express.Router();

router.post('/projects/:projectId/tasks', auth,
  body('title').isString().isLength({ min: 2 }),
  body('description').optional().isString(),
  body('assignedTo').optional().isString(),
  body('priority').optional().isIn(['low','medium','high']),
  body('dueDate').optional().isISO8601(),
  validate,
  createTask
);

router.get('/projects/:projectId/tasks', auth,
  query('status').optional().isIn(['todo','in_progress','completed']),
  query('assignedTo').optional().isString(),
  query('priority').optional().isIn(['low','medium','high']),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  listProjectTasks
);

router.patch('/tasks/:taskId/status', auth,
  body('status').isIn(['todo','in_progress','completed']),
  validate,
  updateTaskStatus
);

router.put('/tasks/:taskId', auth,
  body('title').optional().isString(),
  body('description').optional().isString(),
  body('status').optional().isIn(['todo','in_progress','completed']),
  body('priority').optional().isIn(['low','medium','high']),
  body('assignedTo').optional({ nullable: true }).isString(),
  body('dueDate').optional({ nullable: true }).isISO8601(),
  validate,
  updateTask
);

export default router;
