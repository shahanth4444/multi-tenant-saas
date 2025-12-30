import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function NavBar({ me, onLogout }) {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <nav className="container flex items-center gap-6 py-3">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="font-bold text-lg text-gray-900">Multi-Tenant SaaS</span>
        </Link>

        {/* Navigation Links */}
        {me && (
          <div className="flex items-center gap-1 ml-4">
            <NavLink to="/dashboard" active={isActive('/dashboard')}>Dashboard</NavLink>
            <NavLink to="/projects" active={isActive('/projects')}>Projects</NavLink>
            {me?.role === 'tenant_admin' && (
              <NavLink to="/users" active={isActive('/users')}>Users</NavLink>
            )}
            {me?.role === 'super_admin' && (
              <NavLink to="/tenants" active={isActive('/tenants')}>Tenants</NavLink>
            )}
          </div>
        )}

        {/* User Menu */}
        <div className="ml-auto flex items-center gap-3">
          {me ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium">{me.fullName}</span>
                <span className={`badge ${getRoleBadgeColor(me.role)}`}>
                  {me.role.replace('_', ' ')}
                </span>
                {me.tenant && (
                  <span className="badge badge-info">{me.tenant.subdomain}</span>
                )}
              </div>
              <button onClick={onLogout} className="btn btn-secondary text-sm">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary text-sm">
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
    >
      {children}
    </Link>
  )
}

function getRoleBadgeColor(role) {
  switch (role) {
    case 'super_admin':
      return 'badge-danger'
    case 'tenant_admin':
      return 'badge-primary'
    case 'user':
      return 'badge-gray'
    default:
      return 'badge-gray'
  }
}
