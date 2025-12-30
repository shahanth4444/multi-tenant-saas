# Architecture

## System Architecture Diagram
- Browser (React SPA) → Backend (Express API) → PostgreSQL (database)
- JWT Auth flow: Login issues token; subsequent requests include Authorization: Bearer <token>
- CORS allows origin FRONTEND_URL; services communicate via Docker service names

A Mermaid diagram is included below; export to PNG for final docs:

```mermaid
graph LR
  A[Browser] -->|HTTP 3000| B[Frontend]
  B -->|HTTP 5000 /api| C[Backend]
  C -->|5432| D[(PostgreSQL)]
  C -.->|JWT| A
```

## Database ERD
```mermaid
erDiagram
  tenants ||--o{ users : has
  tenants ||--o{ projects : has
  tenants ||--o{ audit_logs : has
  projects ||--o{ tasks : has
  users ||--o{ projects : created_by
  users ||--o{ tasks : assigned_to

  tenants {
    uuid id PK
    string name
    string subdomain
    enum status
    enum subscription_plan
    int max_users
    int max_projects
    timestamptz created_at
    timestamptz updated_at
  }
  users {
    uuid id PK
    uuid tenant_id FK
    string email
    string password_hash
    string full_name
    enum role
    bool is_active
    timestamptz created_at
    timestamptz updated_at
  }
  projects {
    uuid id PK
    uuid tenant_id FK
    string name
    text description
    enum status
    uuid created_by FK
    timestamptz created_at
    timestamptz updated_at
  }
  tasks {
    uuid id PK
    uuid project_id FK
    uuid tenant_id FK
    string title
    text description
    enum status
    enum priority
    uuid assigned_to FK
    date due_date
    timestamptz created_at
    timestamptz updated_at
  }
  audit_logs {
    uuid id PK
    uuid tenant_id FK
    uuid user_id FK
    string action
    string entity_type
    string entity_id
    string ip_address
    timestamptz created_at
  }
```

## API Architecture
- Auth: POST /api/auth/register-tenant, POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
- Tenants: GET /api/tenants/:tenantId, PUT /api/tenants/:tenantId, GET /api/tenants (super_admin)
- Users: POST /api/tenants/:tenantId/users, GET /api/tenants/:tenantId/users, PUT /api/users/:userId, DELETE /api/users/:userId
- Projects: POST /api/projects, GET /api/projects, PUT /api/projects/:projectId, DELETE /api/projects/:projectId
- Tasks: POST /api/projects/:projectId/tasks, GET /api/projects/:projectId/tasks, PATCH /api/tasks/:taskId/status, PUT /api/tasks/:taskId

Auth requirements and roles are enforced per endpoint as specified.
