# Product Requirements Document (PRD)

## User Personas

### Super Admin
- Role: System-level administrator with access across tenants
- Responsibilities: Onboard tenants, manage plans, handle suspensions, audit
- Goals: Maintain platform health and compliance
- Pain Points: Cross-tenant visibility, safe changes without impacting tenants

### Tenant Admin
- Role: Organization administrator
- Responsibilities: Manage users, projects, and tenant profile
- Goals: Productive team workspace, enforce limits and roles
- Pain Points: Keeping users organized, preventing overages

### End User
- Role: Regular team member
- Responsibilities: Work on tasks within projects
- Goals: Clear view of assigned work, simple updates
- Pain Points: Overwhelming UI, slow performance

## Functional Requirements

### Auth
- FR-001: The system shall allow tenant registration with unique subdomain.
- FR-002: The system shall hash passwords using bcrypt.
- FR-003: The system shall authenticate users via JWT expiring in 24 hours.
- FR-004: The system shall provide an endpoint to get current user details.
- FR-005: The system shall support logout semantics (JWT-only).

### Tenant
- FR-006: The system shall isolate tenant data using tenant_id filters.
- FR-007: The system shall allow super_admin to list all tenants with pagination.
- FR-008: The system shall allow tenant_admin to update only tenant name.
- FR-009: The system shall allow super_admin to update plan, limits, and status.

### Users
- FR-010: The system shall allow tenant_admin to add users up to plan limits.
- FR-011: The system shall enforce unique (tenant_id, email) per tenant.
- FR-012: The system shall list users with search, filter, and pagination.
- FR-013: The system shall allow tenant_admin or self to update permitted fields.
- FR-014: The system shall prevent tenant_admin from deleting themselves.

### Projects & Tasks
- FR-015: The system shall allow project creation up to max_projects.
- FR-016: The system shall list projects with search, filters, and counts.
- FR-017: The system shall allow updating and deleting projects with authorization.
- FR-018: The system shall allow creating tasks under a project with validation.
- FR-019: The system shall list tasks with filters and ordering.
- FR-020: The system shall allow updating task status via a specific endpoint.
- FR-021: The system shall allow updating other task fields with validation.
- FR-022: The system shall log important actions to audit_logs.

## Non-Functional Requirements
- NFR-001 (Performance): 90% of API requests shall respond < 200ms under nominal load.
- NFR-002 (Security): All passwords shall be hashed; JWTs shall expire in 24 hours.
- NFR-003 (Scalability): The system shall support at least 100 concurrent users.
- NFR-004 (Availability): The system shall target 99% uptime.
- NFR-005 (Usability): The frontend shall be responsive for desktop and mobile.
