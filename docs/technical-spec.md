# Technical Specification

## Project Structure

backend/
  - Dockerfile
  - package.json
  - .env (committed in repo for evaluation)
  - src/
    - server.js
    - app.js
    - config.js
    - db.js
    - init.js (migrations + seeds)
    - middleware/
      - auth.js
      - rbac.js
      - tenant.js
      - error.js
      - validate.js
    - utils/
      - responses.js
      - audit.js
    - routes/
      - index.js
      - auth.routes.js
      - tenants.routes.js
      - users.routes.js
      - projects.routes.js
      - tasks.routes.js
    - controllers/
      - auth.controller.js
      - tenants.controller.js
      - users.controller.js
      - projects.controller.js
      - tasks.controller.js
    - migrations/
      - 001_create_tenants.sql
      - 002_create_users.sql
      - 003_create_projects.sql
      - 004_create_tasks.sql
      - 005_create_audit_logs.sql
frontend/
  - Dockerfile
  - package.json
  - index.html
  - vite.config.js
  - src/
    - main.jsx
    - App.jsx
    - api.js
    - auth.js
    - components/
      - NavBar.jsx
      - ProtectedRoute.jsx
    - pages/
      - Register.jsx
      - Login.jsx
      - Dashboard.jsx
      - Projects.jsx
      - ProjectDetails.jsx
      - Users.jsx

## Development Setup Guide

### Prerequisites
- Node.js 18+
- Docker Desktop

### Environment variables (backend)
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- JWT_SECRET, JWT_EXPIRES_IN
- PORT, NODE_ENV, FRONTEND_URL

### Local run (optional)
1. Start Postgres or use Docker DB service.
2. Install backend deps and start:
   - npm install
   - npm run dev
3. Install frontend deps and start:
   - npm install
   - npm run dev

### Docker (evaluation path)
- One command: `docker-compose up -d --build`
- Health check: `curl http://localhost:5000/api/health`

Migrations and seeds run automatically on backend startup.
