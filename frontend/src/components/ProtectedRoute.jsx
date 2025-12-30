import React from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ me, requireRole, children }){
  if (!me) return <Navigate to="/login" replace />
  if (requireRole && me.role !== requireRole) return <Navigate to="/dashboard" replace />
  return children
}
