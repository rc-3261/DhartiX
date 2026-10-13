import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api'
import { clearTokens, getTokens, setTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    const { access } = getTokens()
    if (!access) {
      setLoading(false)
      return
    }
    try {
      const res = await api.profile()
      setUser(res.data)
    } catch (e) {
      clearTokens()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const login = useCallback(async (data) => {
    const res = await api.login(data)
    setTokens(res.data.access, res.data.refresh)
    const profile = await api.profile()
    setUser(profile.data)
    return profile.data
  }, [])

  const register = useCallback(async (data) => {
    const res = await api.register(data)
    setTokens(res.data.access, res.data.refresh)
    setUser(res.data)
    return res.data
  }, [])

  const logout = useCallback(async () => {
    const { refresh } = getTokens()
    try {
      if (refresh) await api.logout(refresh)
    } catch (e) {
      // ignore
    }
    clearTokens()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const profile = await api.profile()
    setUser(profile.data)
    return profile.data
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    role: user?.role || null,
    isFarmer: user?.role === 'FARMER',
    isBuyer: user?.role === 'BUYER',
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    loadProfile,
    refreshUser,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}