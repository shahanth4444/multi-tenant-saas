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

export default function App(){
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me').then(r => { setMe(r.data.data); setLoading(false) }).catch(()=>{ setLoading(false) })
  }, [])

  if (loading) return <div style={{padding:20}}>Loading...</div>

  return (
    <div>
      <NavBar me={me} onLogout={async ()=>{ await api.post('/auth/logout'); localStorage.removeItem('token'); setMe(null); navigate('/login') }} />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLogin={(m)=>setMe(m)} />} />
        <Route path="/dashboard" element={<ProtectedRoute me={me}><Dashboard me={me}/></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute me={me}><Projects me={me}/></ProtectedRoute>} />
        <Route path="/projects/:projectId" element={<ProtectedRoute me={me}><ProjectDetails me={me}/></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute me={me} requireRole="tenant_admin"><Users me={me}/></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={me?'/dashboard':'/login'} replace />} />
      </Routes>
    </div>
  )
}
