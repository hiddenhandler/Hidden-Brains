import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import { setUserId } from '../lib/db'

const AuthContext = createContext({ user: null, loading: false })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setUserId(null)
      setLoading(false)
      return
    }

    try {
      supabase.auth.getSession().then(({ data }) => {
        const u = data?.session?.user || null
        setUser(u)
        setUserId(u?.id || null)
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user || null
        setUser(u)
        setUserId(u?.id || null)
      })

      return () => data?.subscription?.unsubscribe()
    } catch (e) {
      console.error('Auth error:', e)
      setLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext) || { user: null, loading: false }
}
