# API Documentation

All responses follow: { success: boolean, message?: string, data?: any }
Auth uses Authorization: Bearer <jwt>.

## Health
- GET /api/health → { status: "ok", database: "connected" }

## Auth
- POST /api/auth/register-tenant (public)
  - Body: { tenantName, subdomain, adminEmail, adminPassword, adminFullName }
  - 201 → data: { tenantId, subdomain, adminUser }
- POST /api/auth/login (public)
  - Body: { email, password, tenantSubdomain | tenantId }
  - 200 → data: { user, token, expiresIn }
- GET /api/auth/me (auth)
  - 200 → data: user + tenant info
- POST /api/auth/logout (auth)
  - 200 → message

## Tenants
- GET /api/tenants/:tenantId (auth; same-tenant or super)
  - 200 → data: tenant + stats
- PUT /api/tenants/:tenantId (auth; tenant_admin: name only, super: all fields)
  - 200 → message + updated
- GET /api/tenants (auth; super only)
  - Query: page, limit, status, subscriptionPlan
  - 200 → data: tenants[], pagination

## Users
- POST /api/tenants/:tenantId/users (auth; tenant_admin)
  - Body: { email, password, fullName, role }
  - 201 → data: new user (no password_hash)
- GET /api/tenants/:tenantId/users (auth; same-tenant)
  - Query: search, role, page, limit
  - 200 → data: users[], total, pagination
- PUT /api/users/:userId (auth; tenant_admin or self/limited)
  - Body: { fullName?, role?, isActive? }
  - 200 → message + updated
- DELETE /api/users/:userId (auth; tenant_admin)
  - 200 → message

## Projects
- POST /api/projects (auth)
  - Body: { name, description?, status? }
  - 201 → data: project
- GET /api/projects (auth)
  - Query: status, search, page, limit
  - 200 → data: projects[], total, pagination
- PUT /api/projects/:projectId (auth; tenant_admin or creator)
  - 200 → message + updated
- DELETE /api/projects/:projectId (auth; tenant_admin or creator)
  - 200 → message

## Tasks
- POST /api/projects/:projectId/tasks (auth)
  - Body: { title, description?, assignedTo?, priority?, dueDate? }
  - 201 → data: task
- GET /api/projects/:projectId/tasks (auth)
  - Query: status, assignedTo, priority, search, page, limit
  - 200 → data: tasks[], total, pagination
- PATCH /api/tasks/:taskId/status (auth)
  - Body: { status }
  - 200 → data: { id, status, updatedAt }
- PUT /api/tasks/:taskId (auth)
  - Body: { title?, description?, status?, priority?, assignedTo?, dueDate? }
  - 200 → message + updated
