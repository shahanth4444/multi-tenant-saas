import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { registerTenant, login, me, logout } from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register-tenant',
  body('tenantName').isString().isLength({ min: 2 }),
  body('subdomain').isString().isLength({ min: 3 }),
  body('adminEmail').isEmail(),
  body('adminPassword').isString().isLength({ min: 8 }),
  body('adminFullName').isString().isLength({ min: 2 }),
  validate,
  registerTenant
);

router.post('/login',
  body('email').isEmail(),
  body('password').isString().isLength({ min: 8 }),
  body('tenantSubdomain').optional().isString(),
  body('tenantId').optional().isString(),
  validate,
  login
);

router.get('/me', auth, me);
router.post('/logout', auth, logout);

export default router;
