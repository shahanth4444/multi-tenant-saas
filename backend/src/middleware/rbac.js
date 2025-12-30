import { forbidden } from '../utils/responses.js';

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return forbidden(res);
    if (req.user.role !== role) return forbidden(res, 'Insufficient role');
    next();
  };
}

export function requireAnyRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) return forbidden(res);
    if (!roles.includes(req.user.role)) return forbidden(res, 'Insufficient role');
    next();
  };
}

export function isSuper(req) {
  return req.user?.role === 'super_admin';
}
