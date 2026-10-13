import { Navigate, useLocation } from 'react-router-dom'
import LoadingSpinner from './LoadingSpinner'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, loading, role } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner full label="Checking your session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (roles.length > 0 && !roles.includes(role)) {
    const fallback =
      role === 'ADMIN' ? '/admin' : role === 'FARMER' ? '/farmer' : '/buyer'
    return <Navigate to={fallback} replace />
  }

  return children
}