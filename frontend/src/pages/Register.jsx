import React, { useState } from 'react'
import api from '../api'

export default function Register() {
  const [form, setForm] = useState({ tenantName: '', subdomain: '', adminEmail: '', adminFullName: '', adminPassword: '', confirm: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    setErr(''); setMsg('')
    if (form.adminPassword !== form.confirm) { setErr('Passwords do not match'); return }
    setLoading(true)
    try {
      await api.post('/auth/register-tenant', {
        tenantName: form.tenantName,
        subdomain: form.subdomain.toLowerCase(),
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
        adminFullName: form.adminFullName,
      })
      setMsg('Registered successfully! You can now login.')
    } catch (e) { setErr(e?.response?.data?.message || 'Registration failed') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Create Organization</h2>
          <p className="mt-2 text-gray-600">Register your tenant to get started</p>
        </div>

        <div className="card">
          <div className="card-body">
            {msg && <div className="success-message mb-4">{msg}</div>}
            {err && <div className="error-message mb-4">{err}</div>}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Organization Name</label>
                  <input name="tenantName" value={form.tenantName} onChange={onChange} required className="input" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="label">Subdomain</label>
                  <input name="subdomain" value={form.subdomain} onChange={onChange} required className="input" placeholder="acme" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Admin Email</label>
                  <input type="email" name="adminEmail" value={form.adminEmail} onChange={onChange} required className="input" placeholder="admin@acme.com" />
                </div>
                <div>
                  <label className="label">Admin Full Name</label>
                  <input name="adminFullName" value={form.adminFullName} onChange={onChange} required className="input" placeholder="John Doe" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Password</label>
                  <input type="password" name="adminPassword" value={form.adminPassword} onChange={onChange} required className="input" placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" name="confirm" value={form.confirm} onChange={onChange} required className="input" placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full mt-4">
                {loading ? 'Registering...' : 'Create Organization'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account? <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
