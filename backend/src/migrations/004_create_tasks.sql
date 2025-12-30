CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','completed')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  assigned_to UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_project ON tasks(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status, priority);
