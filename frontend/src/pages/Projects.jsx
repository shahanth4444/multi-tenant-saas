import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', status: 'active' })
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const q = new URLSearchParams()
    if (filter) q.set('status', filter)
    if (search) q.set('search', search)
    const r = await api.get('/projects' + (q.toString() ? `?${q.toString()}` : ''))
    setProjects(r.data.data.projects || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [filter, search])

  async function create() {
    await api.post('/projects', form)
    setShow(false)
    setForm({ name: '', description: '', status: 'active' })
    await load()
  }

  async function remove(id) {
    if (!confirm('Delete project?')) return
    await api.delete('/projects/' + id)
    await load()
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
        <p className="text-gray-600">Manage and organize your projects</p>
      </div>

      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input flex-1"
            />
            <select value={filter} onChange={e => setFilter(e.target.value)} className="input sm:w-40">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="completed">Completed</option>
            </select>
            <button onClick={() => setShow(true)} className="btn btn-primary whitespace-nowrap">
              + New Project
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="card-body">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-state-title">No projects found</div>
              <div className="empty-state-subtitle">
                {search || filter ? 'Try adjusting your filters' : 'Create your first project'}
              </div>
              {!search && !filter && (
                <button onClick={() => setShow(true)} className="btn btn-primary mt-4">Create Project</button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <div key={p.id} className="card hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{p.name}</h3>
                  <span className={`badge ${statusColor(p.status)}`}>{p.status}</span>
                </div>
                {p.description && <p className="text-gray-600 text-sm mb-3">{p.description}</p>}
                <div className="text-sm text-gray-500 mb-4">{p.taskCount || 0} tasks</div>
                <div className="flex gap-2">
                  <Link to={`/projects/${p.id}`} className="btn btn-primary flex-1 text-sm">View</Link>
                  <button onClick={() => remove(p.id)} className="btn btn-secondary text-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShow(false)}>
          <div className="card max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="card-header">Create New Project</div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Project Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Enter project name" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input min-h-[80px]" placeholder="Describe your project..." />
              </div>
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={create} className="btn btn-primary flex-1">Create</button>
                <button onClick={() => setShow(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function statusColor(status) {
  switch (status) {
    case 'active': return 'badge-primary'
    case 'archived': return 'badge-gray'
    case 'completed': return 'badge-success'
    default: return 'badge-gray'
  }
}
