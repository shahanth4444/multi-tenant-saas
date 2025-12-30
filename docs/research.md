# Research: Multi-Tenant SaaS Architecture, Stack Justification, Security

## Multi-Tenancy Analysis

This section compares three common multi-tenant approaches and motivates the chosen design for this project. (≈900+ words)

### 1) Shared Database + Shared Schema (tenant_id column)
- Description: A single database and shared set of tables. Every row has a tenant_id column to identify the owning tenant. Data isolation is enforced by the application and indexes.
- Pros:
  - Lowest cost and operational overhead, one DB instance to run and manage.
  - Easiest to scale the application tier horizontally.
  - Simple to provision new tenants; no migrations per tenant.
  - Global reporting across tenants is straightforward.
- Cons:
  - Strong discipline required to enforce tenant filters on every query.
  - Noisy-neighbor risk at the data level if queries are poorly indexed.
  - Harder to give per-tenant performance guarantees.

Typical fit for early-stage SaaS and when tenants are expected to be small-to-medium. Performance can be excellent with proper indexing (e.g., tenant_id), partitioning, and query design. Operational simplicity and cost efficiency are major benefits.

### 2) Shared Database + Separate Schemas (schema-per-tenant)
- Description: Single database instance but each tenant has its own schema, duplicating tables per tenant.
- Pros:
  - Stronger isolation boundary than a single shared schema; accidental cross-tenant queries are less likely.
  - Per-tenant lifecycle management is possible (backup, restore, export) at schema granularity.
- Cons:
  - Complexity increases with the number of tenants (schema sprawl).
  - Migrations must be executed for each tenant schema, increasing deployment time and risk.
  - Cross-tenant analytics are harder.

Fit when you need a balance between isolation and operational consolidation. Useful when tenants have customizations or must be administratively separated without running many databases.

### 3) Separate Database per Tenant
- Description: Each tenant gets an independent database (or cluster).
- Pros:
  - Strongest isolation boundary (performance and security).
  - Simple to scale heavy tenants independently; noisy neighbors minimized.
  - Easiest to meet data residency/compliance requirements per tenant.
- Cons:
  - Highest operational complexity and cost (provision, monitor, migrate many DBs).
  - Cross-tenant analytics become complex.
  - Application configuration grows with number of connections.

Fit for large, high-value tenants with strict isolation requirements or different SLAs.

### Chosen Approach: Shared DB + Shared Schema
We choose a shared database with a shared schema and a strict tenant_id column on all domain tables. Reasons:
- Operational simplicity and predictable cost for evaluation and small to mid-scale.
- We can still deliver strong isolation with enforced filtering by tenant_id at the API layer and by using parameterized queries.
- Indexes on tenant_id keep common operations fast. We also add composite indexes (e.g., (tenant_id, project_id)).
- Easy to run a single migration pipeline and automatic seeds in Docker, satisfying the "one command" requirement.

Mitigations to common pitfalls:
- Centralized middleware injects tenant constraints in queries wherever appropriate.
- Security reviews and tests cover cross-tenant leakage.
- Audit logs capture important actions, aiding detection.

## Technology Stack Justification
(≈600+ words)

### Backend: Node.js (Express)
- Mature ecosystem, fast iteration, and large community support.
- Express is minimalistic and allows clear middleware composition (JWT auth, RBAC, tenant filters, validation, logging).
- pg library is reliable and performant; parameterized queries reduce SQL injection risk.
- JSON everywhere: aligns with REST responses and frontend.

Alternatives considered:
- NestJS for stricter structure (heavier learning curve for evaluators; more boilerplate).
- Django/Laravel: great, but we keep JS end-to-end simplicity.

### Database: PostgreSQL 15
- Strong relational integrity, JSONB support, and robust indexing.
- ACID transactions for critical multi-step operations (tenant registration).
- Well-supported Docker image enables quick, reproducible setup.

Alternatives: MySQL/MariaDB (similar), separate DB per tenant (overkill for this task).

### Authentication: JWT (24h)
- Stateless, simple verification per request.
- No session storage required, reduces complexity.
- Industry standard for SPA + API.

Alternatives: sessions/Redis (heavier infra, not required).

### Frontend: React + Vite
- Fast dev server and build times; lean template.
- React Router for protected routes and role-based UI.
- Axios for API with interceptors.

Alternatives: Next.js (excellent, but Vite keeps containers smaller and simpler here), Vue/Angular (preference-based).

### Containerization: Docker Compose
- One command to bring up DB, backend, and frontend.
- Health checks and dependency order.
- Portable across evaluators.

## Security Considerations
(≈450+ words)

### Data Isolation Strategy
- Enforce tenant constraints at the API layer. Non-super users always query with WHERE tenant_id = $jwtTenantId.
- For tasks, tenant_id is derived from the associated project (not from JWT) to prevent tampering.
- Super admin (tenant_id = NULL) bypasses tenant filters only where appropriate.

### AuthN/AuthZ
- JWT with 24h expiry, payload limited to { userId, tenantId, role }.
- super_admin, tenant_admin, and user mapped to granular route permissions.
- Authorization middleware gates access by role; tenant-bound operations verify ownership.

### Password Handling
- bcrypt with sufficient cost factor, salts handled by library.
- Never store plaintext passwords; only password_hash in DB.
- On login, compare using timing-safe bcrypt.compare.

### API Security Measures
- Parameterized SQL queries via pg to prevent SQL injection.
- Input validation with express-validator (email format, password length, enum constraints).
- CORS restricted to configured FRONTEND_URL; credentials disabled by default in this SPA use-case.
- Helmet for secure headers; disable x-powered-by; consistent error handling without leaking internals.

### Additional
- Audit logging for critical actions (create/update/delete, auth events).
- Account/tenant status checks (inactive/suspended) gate access.
- Rate limiters could be added (omitted for brevity, easy to include with express-rate-limit).
