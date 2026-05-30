// src/pages/auth/AuthPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      })
      if (error) toast.error(error.message)
      else {
        toast.success('Akun berhasil dibuat! Cek email kamu untuk konfirmasi sebelum login.')
        setMode('login')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) toast.error(
        error.message === 'Email not confirmed'
          ? 'Email belum dikonfirmasi. Cek inbox/spam kamu.'
          : error.message === 'Invalid login credentials'
          ? 'Email atau password salah.'
          : error.message
      )
      else navigate('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">
            undanganku<span className="text-rose-400">.id</span>
          </h1>
          <p className="text-sm text-stone-500 mt-1">Undangan digital pernikahan Islami</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          {/* Tab mode */}
          <div className="flex gap-1 bg-stone-100 rounded-lg p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-sm rounded-md transition-all ${
                  mode === m
                    ? 'bg-white text-stone-800 shadow-sm font-medium'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {m === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-stone-600 mb-1">Nama lengkap</label>
                <input
                  name="fullName"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Nama kamu"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-stone-600 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="email@kamu.com"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
              />
            </div>
            <div>
              <label className="block text-sm text-stone-600 mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 karakter"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-rose-400 hover:bg-rose-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Buat Akun'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
