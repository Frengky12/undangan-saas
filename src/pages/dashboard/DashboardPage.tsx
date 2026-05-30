// src/pages/dashboard/DashboardPage.tsx
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useInvitations } from '../../hooks/useInvitations'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const THEME_LABELS: Record<string, string> = {
  floral: 'Floral Islami',
  modern: 'Modern Elegan',
  klasik: 'Klasik Mewah',
}

export default function DashboardPage() {
  const { profile } = useAuthStore()
  const { invitations, loading, deleteInvitation } = useInvitations()

  const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin
  const activeCount = invitations.filter((i) => i.is_active).length

  return (
    <DashboardLayout
      title="Dasbor"
      actions={
        <Link
          to="/dashboard/buat"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Buat Undangan
        </Link>
      }
    >
      {/* ── Statistik ─────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: 'Total Undangan',
            value: String(invitations.length),
            sub: 'semua undangan',
            color: 'text-stone-700',
          },
          {
            label: 'Undangan Aktif',
            value: String(activeCount),
            sub: `${invitations.length - activeCount} nonaktif`,
            color: 'text-green-600',
          },
          {
            label: 'Plan Saat Ini',
            value: profile?.plan === 'pro' ? 'Pro' : 'Free',
            sub: profile?.plan === 'pro' ? 'Undangan tidak terbatas' : '1 undangan aktif',
            color: profile?.plan === 'pro' ? 'text-rose-500' : 'text-stone-500',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white border border-stone-200 rounded-xl p-5">
            <p className="text-xs text-stone-400 mb-2">{label}</p>
            <p className={`text-2xl font-semibold ${color}`}>{value}</p>
            <p className="text-xs text-stone-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tabel undangan ────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
          <p className="text-sm font-medium text-stone-700">Daftar Undangan</p>
          <p className="text-xs text-stone-400">{invitations.length} total</p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-stone-400 text-sm">Memuat...</div>
        ) : invitations.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-stone-400 text-sm">Belum ada undangan.</p>
            <Link
              to="/dashboard/buat"
              className="text-sm text-rose-400 hover:text-rose-600 transition-colors"
            >
              Buat undangan pertama →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-100">
                  <th className="text-left text-xs font-medium text-stone-400 px-5 py-3">Pengantin</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-4 py-3">Tanggal Resepsi</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-4 py-3">Tema</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-4 py-3">Link</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-stone-400 px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-stone-800">
                        {inv.data.groomName} & {inv.data.brideName}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-stone-500">
                      {inv.data.resepsiDate
                        ? new Date(inv.data.resepsiDate).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-stone-500">
                      {THEME_LABELS[inv.theme_id] ?? inv.theme_id}
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={`${APP_URL}/u/${inv.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-rose-400 hover:text-rose-600 hover:underline text-xs font-mono"
                      >
                        /u/{inv.slug}
                      </a>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
                        inv.is_active
                          ? 'bg-green-50 text-green-600'
                          : 'bg-stone-100 text-stone-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          inv.is_active ? 'bg-green-500' : 'bg-stone-400'
                        }`} />
                        {inv.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/dashboard/edit/${inv.id}`}
                          className="px-2.5 py-1 text-xs border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-600 transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/dashboard/tamu/${inv.id}`}
                          className="px-2.5 py-1 text-xs border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-600 transition-colors"
                        >
                          Tamu
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm('Hapus undangan ini?')) deleteInvitation(inv.id)
                          }}
                          className="px-2.5 py-1 text-xs border border-red-100 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
