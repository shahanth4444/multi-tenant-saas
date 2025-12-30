import express from 'express';
import { auth } from '../middleware/auth.js';
import { body, query as q } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';
import { ensureTenantAccess } from '../middleware/tenant.js';
import { getTenantDetails, updateTenant, listTenants } from '../controllers/tenants.controller.js';

const router = express.Router();

router.get('/:tenantId', auth, ensureTenantAccess, getTenantDetails);

router.put('/:tenantId', auth,
  body('name').optional().isString(),
  body('status').optional().isIn(['active','suspended','trial']),
  body('subscriptionPlan').optional().isIn(['free','pro','enterprise']),
  body('maxUsers').optional().isInt({ min: 1 }),
  body('maxProjects').optional().isInt({ min: 1 }),
  validate,
  updateTenant
);

router.get('/', auth, requireRole('super_admin'),
  q('page').optional().isInt({ min: 1 }),
  q('limit').optional().isInt({ min: 1, max: 100 }),
  q('status').optional().isIn(['active','suspended','trial']),
  q('subscriptionPlan').optional().isIn(['free','pro','enterprise']),
  validate,
  listTenants
);

export default router;
