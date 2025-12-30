import React, { useState } from 'react'
import api from '../api'

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '', tenantSubdomain: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const r = await api.post('/auth/login', form)
      localStorage.setItem('token', r.data.data.token)
      const me = await api.get('/auth/me')
      onLogin?.(me.data.data)
      window.location.href = '/dashboard'
    } catch (e) {
      setErr(e?.response?.data?.message || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <div className="card-body">
            {err && (
              <div className="error-message mb-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {err}
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  className="input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="label">
                  Tenant Subdomain
                  <span className="text-gray-400 text-xs ml-1">(leave empty for super admin)</span>
                </label>
                <input
                  name="tenantSubdomain"
                  value={form.tenantSubdomain}
                  onChange={onChange}
                  className="input"
                  placeholder="demo"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Super admin: leave empty | Tenant users: enter "demo"
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Register here
                </a>
              </p>
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}
