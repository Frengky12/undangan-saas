// src/components/dashboard/DashboardLayout.tsx
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface Props {
  children: React.ReactNode
  title: string
  actions?: React.ReactNode
}

function IconHome() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

const NAV = [
  {
    label: 'Dasbor',
    to: '/dashboard',
    icon: <IconHome />,
    isActive: (path: string) =>
      path === '/dashboard' ||
      path.startsWith('/dashboard/edit') ||
      path.startsWith('/dashboard/tamu'),
  },
  {
    label: 'Buat Undangan',
    to: '/dashboard/buat',
    icon: <IconPlus />,
    isActive: (path: string) => path === '/dashboard/buat',
  },
]

export default function DashboardLayout({ children, title, actions }: Props) {
  const location = useLocation()
  const { profile, signOut } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Tutup sidebar otomatis saat navigasi (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const initials =
    profile?.full_name
      ?.split(' ')
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('') || 'U'

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">

      {/* ── Overlay mobile ─────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-stone-200 flex flex-col
        transition-transform duration-300 ease-in-out
        lg:relative lg:w-56 lg:translate-x-0 lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
      `}>

        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-stone-100 flex-shrink-0">
          <Link to="/dashboard" className="text-sm font-bold text-stone-800 tracking-tight">
            undanganku<span className="text-rose-400">.id</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <IconClose />
          </button>
        </div>

        {/* Navigasi */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => {
            const active = item.isActive(location.pathname)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-stone-100 p-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 mb-2.5 px-1">
            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-stone-700 truncate">
                {profile?.full_name ?? 'Pengguna'}
              </p>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-0.5 ${
                profile?.plan === 'pro'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-stone-100 text-stone-400'
              }`}>
                {profile?.plan === 'pro' ? 'Pro' : 'Free'}
              </span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
          >
            <IconLogout />
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — hanya tampil di mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors flex-shrink-0"
            >
              <IconMenu />
            </button>
            <h1 className="text-sm font-semibold text-stone-800 truncate">{title}</h1>
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              {actions}
            </div>
          )}
        </header>

        {/* Konten */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
