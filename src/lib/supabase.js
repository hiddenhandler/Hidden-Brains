import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = (url && key) ? createClient(url, key) : null

export async function signInWithGoogle() {
  if (!supabase) return { error: 'Not configured' }
  try {
    return await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  } catch (e) { return { error: e } }
}

export async function signOut() {
  if (!supabase) return
  try { await supabase.auth.signOut() } catch {}
}
