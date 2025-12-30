import express from 'express';
import { auth } from '../middleware/auth.js';
import { body, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { addUser, listUsers, updateUser, deleteUser } from '../controllers/users.controller.js';

const router = express.Router();

router.post('/tenants/:tenantId/users', auth,
  body('email').isEmail(),
  body('password').isString().isLength({ min: 8 }),
  body('fullName').isString().isLength({ min: 2 }),
  body('role').optional().isIn(['user','tenant_admin']),
  validate,
  addUser
);

router.get('/tenants/:tenantId/users', auth,
  query('search').optional().isString(),
  query('role').optional().isIn(['user','tenant_admin','super_admin']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  listUsers
);

router.put('/:userId', auth,
  body('fullName').optional().isString().isLength({ min: 2 }),
  body('role').optional().isIn(['user','tenant_admin']),
  body('isActive').optional().isBoolean(),
  validate,
  updateUser
);

router.delete('/:userId', auth, deleteUser);

export default router;
