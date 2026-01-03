/**
 * Main Application Component
 * 
 * Root component that handles routing, authentication state, and navigation.
 * Fetches user profile on mount and manages global authentication state.
 * 
 * @component
 */

import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetails from './pages/ProjectDetails'
import Users from './pages/Users'
import api from './api'

/**
 * App Component
 * 
 * @returns {JSX.Element} Application with routing and navigation
 */
export default function App() {
  const [me, setMe] = useState(null)          // Current user profile
  const [loading, setLoading] = useState(true) // Loading state during auth check
  const navigate = useNavigate()

  /**
   * Fetch Current User Profile
   * 
   * On component mount, checks for stored token and fetches user profile.
   * Sets loading to false after completion or error.
   */
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    // Fetch user profile if token exists
    api.get('/auth/me').then(r => { setMe(r.data.data); setLoading(false) }).catch(() => { setLoading(false) })
  }, [])

  // Show loading indicator while checking authentication
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>

  /**
   * Handle User Logout
   * 
   * Calls logout API, clears token, resets user state, and redirects to login.
   */
  const handleLogout = async () => {
    await api.post('/auth/logout')
    localStorage.removeItem('token')
    setMe(null)
    navigate('/login')
  }

  return (
    <div>
      <NavBar me={me} onLogout={handleLogout} />
      <Routes>
        {/* Public routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLogin={(m) => setMe(m)} />} />

        {/* Protected routes - require authentication */}
        <Route path="/dashboard" element={<ProtectedRoute me={me}><Dashboard me={me} /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute me={me}><Projects me={me} /></ProtectedRoute>} />
        <Route path="/projects/:projectId" element={<ProtectedRoute me={me}><ProjectDetails me={me} /></ProtectedRoute>} />

        {/* Admin-only routes */}
        <Route path="/users" element={<ProtectedRoute me={me} requireRole="tenant_admin"><Users me={me} /></ProtectedRoute>} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to={me ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </div>
  )
}
