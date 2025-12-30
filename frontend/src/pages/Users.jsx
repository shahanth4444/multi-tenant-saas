import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Users({ me }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'user' })
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const tId = me?.tenant?.id
    const qs = new URLSearchParams()
    if (search) qs.set('search', search)
    if (role) qs.set('role', role)
    const r = await api.get(`/tenants/${tId}/users${qs.toString() ? `?${qs.toString()}` : ''}`)
    setUsers(r.data.data.users || [])
    setLoading(false)
  }
  useEffect(() => { if (me?.tenant?.id) load() }, [me?.tenant?.id, search, role])

  async function add() {
    const tId = me?.tenant?.id
    await api.post(`/tenants/${tId}/users`, form)
    setShow(false)
    setForm({ email: '', fullName: '', password: '', role: 'user' })
    await load()
  }

  async function remove(id) {
    if (!confirm('Delete user?')) return
    await api.delete(`/users/${id}`)
    await load()
  }

  return (
    <div className="container py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Users
        </h1>
        <p className="text-gray-600">Manage team members and their roles</p>
      </div>

      {/* Filters & Actions */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                placeholder="🔍 Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input w-full"
              />
            </div>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="input sm:w-48"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="tenant_admin">Tenant Admin</option>
            </select>
            <button onClick={() => setShow(true)} className="btn btn-primary whitespace-nowrap">
              <svg className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-8">
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div className="empty-state-title">No users found</div>
              <div className="empty-state-subtitle">
                {search || role ? 'Try adjusting your filters' : 'Add your first team member to get started'}
              </div>
              {!search && !role && (
                <button onClick={() => setShow(true)} className="btn btn-primary mt-4">
                  Add User
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u, idx) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-pink-50/30 transition-colors animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                            {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="font-medium text-gray-900">{u.fullName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${getRoleBadge(u.role)}`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-gray'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => remove(u.id)}
                          className="text-red-600 hover:text-red-700 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {show && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setShow(false)}
        >
          <div
            className="card max-w-lg w-full animate-slide-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="card-header flex items-center justify-between">
              <h3 className="text-xl font-semibold">Add New User</h3>
              <button
                onClick={() => setShow(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input"
                  placeholder="user@example.com"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Full Name</label>
                <input
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="input"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="label">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="input"
                >
                  <option value="user">User</option>
                  <option value="tenant_admin">Tenant Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={add} className="btn btn-primary flex-1">
                  Add User
                </button>
                <button onClick={() => setShow(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getRoleBadge(role) {
  switch (role) {
    case 'tenant_admin':
      return 'badge-primary'
    case 'user':
      return 'badge-info'
    default:
      return 'badge-gray'
  }
}
