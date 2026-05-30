// src/App.tsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'

// Pages
import AuthPage        from './pages/auth/AuthPage'
import DashboardPage   from './pages/dashboard/DashboardPage'
import EditorPage      from './pages/dashboard/EditorPage'
import GuestsPage      from './pages/dashboard/GuestsPage'
import InvitationPage  from './pages/invitation/InvitationPage'

// ── Auth Guard ─────────────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">Memuat...</div>
  return user ? <>{children}</> : <Navigate to="/auth" replace />
}

export default function App() {
  const { setSession, fetchProfile } = useAuthStore()

  useEffect(() => {
    // Ambil session saat app pertama load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile()
      useAuthStore.setState({ loading: false })
    })

    // Listen perubahan auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile()
      else useAuthStore.setState({ loading: false })
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontSize: '13px', borderRadius: '10px' },
          duration: 3000,
        }}
      />
      <Routes>
        {/* Publik */}
        <Route path="/auth"     element={<AuthPage />} />
        <Route path="/u/:slug"  element={<InvitationPage />} />
        <Route path="/"         element={<Navigate to="/dashboard" replace />} />

        {/* Private - butuh login */}
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        } />
        <Route path="/dashboard/buat" element={
          <PrivateRoute><EditorPage /></PrivateRoute>
        } />
        <Route path="/dashboard/edit/:id" element={
          <PrivateRoute><EditorPage /></PrivateRoute>
        } />
        <Route path="/dashboard/tamu/:id" element={
          <PrivateRoute><GuestsPage /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
