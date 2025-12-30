import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Dashboard({ me }) {
  const [projects, setProjects] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/projects?limit=5').then(r => setProjects(r.data.data.projects || []))
  }, [])

  useEffect(() => {
    (async () => {
      const pr = await api.get('/projects?limit=10')
      const projs = pr.data.data.projects || []
      const all = []
      for (const p of projs) {
        const t = await api.get(`/projects/${p.id}/tasks?assignedTo=${me?.id}`)
        all.push(...(t.data.data.tasks || []))
      }
      setMyTasks(all)
      setLoading(false)
    })()
  }, [me?.id])

  const stats = {
    totalProjects: projects.length,
    totalTasks: myTasks.length,
    completedTasks: myTasks.filter(t => t.status === 'completed').length,
    pendingTasks: myTasks.filter(t => t.status !== 'completed').length,
  }

  return (
    <div className="container py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back{me?.fullName ? `, ${me.fullName}` : ''} 👋
        </h1>
        <p className="text-gray-600">Here's an overview of your work</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Projects" value={stats.totalProjects} color="blue" />
        <StatCard title="My Tasks" value={stats.totalTasks} color="cyan" />
        <StatCard title="Completed" value={stats.completedTasks} color="green" />
        <StatCard title="Pending" value={stats.pendingTasks} color="yellow" />
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="card">
          <div className="card-header">Recent Projects</div>
          <div className="card-body">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No projects yet</div>
                <div className="empty-state-subtitle">Create your first project to get started</div>
              </div>
            ) : (
              <ul className="space-y-2">
                {projects.map(p => (
                  <li key={p.id} className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <a href={`/projects/${p.id}`} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-sm text-gray-600">{p.taskCount || 0} tasks</div>
                      </div>
                      <span className={`badge ${badgeColor(p.status)}`}>{p.status}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* My Tasks */}
        <div className="card">
          <div className="card-header">My Tasks</div>
          <div className="card-body">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : myTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No assigned tasks</div>
                <div className="empty-state-subtitle">Tasks assigned to you will appear here</div>
              </div>
            ) : (
              <ul className="space-y-2">
                {myTasks.slice(0, 5).map(t => (
                  <li key={t.id} className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{t.title}</div>
                        <div className="text-sm text-gray-600">Priority: {t.priority}</div>
                      </div>
                      <span className={`badge ${priorityColor(t.priority)}`}>{t.priority}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    cyan: 'bg-cyan-50 border-cyan-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
  }

  return (
    <div className={`stat-card ${colors[color]} border`}>
      <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

function badgeColor(status) {
  switch (status) {
    case 'active': return 'badge-primary'
    case 'archived': return 'badge-gray'
    case 'completed': return 'badge-success'
    default: return 'badge-gray'
  }
}

function priorityColor(p) {
  switch (p) {
    case 'high': return 'badge-danger'
    case 'medium': return 'badge-warning'
    case 'low': return 'badge-info'
    default: return 'badge-gray'
  }
}
