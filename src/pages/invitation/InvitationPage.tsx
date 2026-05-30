// src/pages/invitation/InvitationPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { usePublicInvitation } from '../../hooks/useInvitations'
import { useRsvp, usePublicGuests } from '../../hooks/useGuests'
import type { ThemeId } from '../../types/database'

// Konversi link Google Drive /view ke URL streaming langsung
function resolveAudioUrl(url: string): string {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`
  return url
}

// ── Konfigurasi visual per tema ───────────────────────────
type ThemeCfg = {
  heroBg: string
  accent: string
  accentBtn: string
  submitBtn: string
  ring: string
  photoBorder: string
  sectionBg: string
  ornamentColor: string | null  // null = tidak ada ornamen
  font: string
  photoShape: string
}

const THEMES: Record<ThemeId, ThemeCfg> = {
  floral: {
    heroBg:       'bg-gradient-to-b from-rose-50 to-stone-50',
    accent:       'text-rose-300',
    accentBtn:    'border-rose-200 text-rose-400 hover:bg-rose-50',
    submitBtn:    'bg-rose-400 hover:bg-rose-500',
    ring:         'focus:ring-rose-200',
    photoBorder:  'border-white',
    sectionBg:    'bg-white',
    ornamentColor: '#f43f5e',
    font:         'font-serif',
    photoShape:   'rounded-full',
  },
  modern: {
    heroBg:       'bg-gradient-to-b from-slate-100 to-white',
    accent:       'text-indigo-400',
    accentBtn:    'border-indigo-200 text-indigo-400 hover:bg-indigo-50',
    submitBtn:    'bg-indigo-500 hover:bg-indigo-600',
    ring:         'focus:ring-indigo-200',
    photoBorder:  'border-slate-200',
    sectionBg:    'bg-slate-50',
    ornamentColor: null,
    font:         'font-sans',
    photoShape:   'rounded-2xl',
  },
  klasik: {
    heroBg:       'bg-gradient-to-b from-amber-50 to-stone-100',
    accent:       'text-amber-500',
    accentBtn:    'border-amber-200 text-amber-500 hover:bg-amber-50',
    submitBtn:    'bg-amber-500 hover:bg-amber-600',
    ring:         'focus:ring-amber-200',
    photoBorder:  'border-amber-100',
    sectionBg:    'bg-amber-50/40',
    ornamentColor: '#f59e0b',
    font:         'font-serif',
    photoShape:   'rounded-full',
  },
}

export default function InvitationPage() {
  const { slug } = useParams<{ slug: string }>()
  const { invitation, loading, notFound } = usePublicInvitation(slug!)
  const { submitRsvp, submitting, submitted } = useRsvp(invitation?.id ?? '')
  const { guests: ucapan } = usePublicGuests(invitation?.id ?? '')

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [rsvpForm, setRsvpForm] = useState({ name: '', phone: '', attendance: 'hadir' as const, message: '' })
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Countdown timer
  useEffect(() => {
    if (!invitation?.data.resepsiDate) return
    const target = new Date(invitation.data.resepsiDate + 'T' + (invitation.data.resepsiTime || '00:00')).getTime()

    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) return
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [invitation])

  // Keyboard navigation untuk lightbox
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightboxIndex === null) return
      const photos = invitation?.data.photos ?? []
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1)
      if (e.key === 'ArrowRight' && lightboxIndex < photos.length - 1) setLightboxIndex(lightboxIndex + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, invitation?.data.photos])

  function toggleMusic() {
    const audio = audioRef.current
    if (!audio) return
    if (musicPlaying) {
      audio.pause()
      setMusicPlaying(false)
    } else {
      audio.play().then(() => setMusicPlaying(true)).catch(() => {})
    }
  }

  async function handleRsvp(e: React.FormEvent) {
    e.preventDefault()
    await submitRsvp(rsvpForm)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50">
      <p className="text-rose-300 text-sm animate-pulse">Membuka undangan...</p>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <p className="text-4xl mb-3">💌</p>
        <p className="text-stone-500">Undangan tidak ditemukan</p>
      </div>
    </div>
  )

  const d = invitation!.data
  const t = THEMES[invitation!.theme_id] ?? THEMES.floral

  const inputCls = `w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 ${t.ring} bg-white`

  return (
    <div className={`min-h-screen bg-stone-50 ${t.font}`}>

      {/* ── Audio & tombol musik floating ─────────── */}
      {d.musicUrl && (
        <>
          <audio ref={audioRef} src={resolveAudioUrl(d.musicUrl)} loop />
          <button
            onClick={toggleMusic}
            aria-label={musicPlaying ? 'Pause musik' : 'Play musik'}
            className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 ${t.submitBtn}`}
          >
            {musicPlaying ? (
              /* Pause icon */
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              /* Play icon */
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            {/* Animasi ring saat playing */}
            {musicPlaying && (
              <span className={`absolute inset-0 rounded-full animate-ping opacity-30 ${t.submitBtn}`} />
            )}
          </button>
        </>
      )}

      {/* ── Hero ─────────────────────────────────────── */}
      <section className={`relative min-h-screen flex flex-col items-center justify-center text-center px-6 ${t.heroBg} overflow-hidden`}>
        {/* Ornamen latar (floral & klasik) */}
        {t.ornamentColor && (
          <div
            className="absolute inset-0 opacity-5 pointer-events-none select-none"
            style={{
              backgroundImage: invitation!.theme_id === 'klasik'
                ? `repeating-linear-gradient(45deg, ${t.ornamentColor} 0, ${t.ornamentColor} 1px, transparent 0, transparent 50%)`
                : `radial-gradient(circle, ${t.ornamentColor} 1px, transparent 1px)`,
              backgroundSize: invitation!.theme_id === 'klasik' ? '20px 20px' : '32px 32px',
            }}
          />
        )}

        {d.photoUrl && (
          <img
            src={d.photoUrl}
            alt="foto pengantin"
            className={`w-40 h-40 object-cover border-4 shadow-lg mb-6 ${t.photoBorder} ${t.photoShape}`}
          />
        )}

        <p className={`text-xs tracking-[.25em] ${t.accent} uppercase mb-2`}>
          Bismillahirrahmanirrahim
        </p>
        {d.quranVerse && (
          <p className="text-sm text-stone-500 italic max-w-xs mb-6 leading-relaxed">{d.quranVerse}</p>
        )}

        <h1 className="text-4xl font-light text-stone-700 leading-tight">
          {d.groomName}
          <span className={`block ${t.accent} text-2xl my-1`}>&</span>
          {d.brideName}
        </h1>

        {(d.groomFather || d.brideFather) && (
          <p className="text-xs text-stone-400 mt-3 leading-relaxed">
            {d.groomFather && `Putra dari Bapak ${d.groomFather}`}
            {d.groomFather && d.brideFather && ' · '}
            {d.brideFather && `Putri dari Bapak ${d.brideFather}`}
          </p>
        )}

        <p className="text-xs text-stone-400 mt-6 tracking-widest uppercase">
          {d.resepsiDate
            ? new Date(d.resepsiDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : ''}
        </p>

        <div className="mt-2 text-stone-300 text-xs animate-bounce">↓</div>
      </section>

      {/* ── Countdown ────────────────────────────────── */}
      <section className={`py-12 px-6 text-center ${t.sectionBg}`}>
        <p className={`text-xs tracking-widest ${t.accent} uppercase mb-6`}>Menuju hari bahagia</p>
        <div className="flex justify-center gap-4">
          {[
            { val: timeLeft.days,    label: 'Hari' },
            { val: timeLeft.hours,   label: 'Jam' },
            { val: timeLeft.minutes, label: 'Menit' },
            { val: timeLeft.seconds, label: 'Detik' },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-light text-stone-700 w-14 tabular-nums">
                {String(val).padStart(2, '0')}
              </div>
              <div className="text-xs text-stone-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Info Acara ───────────────────────────────── */}
      <section className="py-12 px-6 max-w-sm mx-auto space-y-8">
        <p className="text-sm text-stone-500 text-center leading-relaxed italic">
          {d.openingText}
        </p>

        {/* Akad */}
        {d.akadDate && (
          <div className="text-center">
            <p className={`text-xs tracking-widest ${t.accent} uppercase mb-2`}>Akad Nikah</p>
            <p className="text-stone-700">
              {new Date(d.akadDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-stone-500">Pukul {d.akadTime} WIB</p>
          </div>
        )}

        {/* Resepsi */}
        <div className="text-center">
          <p className={`text-xs tracking-widest ${t.accent} uppercase mb-2`}>Resepsi Pernikahan</p>
          <p className="text-stone-700">
            {new Date(d.resepsiDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-sm text-stone-500">Pukul {d.resepsiTime} WIB</p>
          <p className="text-sm text-stone-600 font-medium mt-2">{d.venue}</p>
          <p className="text-xs text-stone-400">{d.address}</p>
          {d.mapsUrl && (
            <a
              href={d.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className={`inline-block mt-3 px-4 py-1.5 border rounded-full text-xs transition-colors ${t.accentBtn}`}
            >
              Buka Google Maps →
            </a>
          )}
        </div>
      </section>

      {/* ── Galeri Foto ──────────────────────────────── */}
      {d.photos && d.photos.length > 0 && (
        <section className={`py-12 px-6 ${t.sectionBg}`}>
          <p className={`text-xs tracking-widest ${t.accent} uppercase text-center mb-6`}>
            Galeri Foto
          </p>
          <div className="max-w-sm mx-auto grid grid-cols-2 gap-2">
            {d.photos.map((url, i) => (
              <button
                key={url}
                onClick={() => setLightboxIndex(i)}
                className="aspect-square overflow-hidden rounded-xl focus:outline-none"
              >
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Lightbox ─────────────────────────────────── */}
      {lightboxIndex !== null && d.photos && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Tombol tutup */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none"
          >
            ×
          </button>

          {/* Tombol prev */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
              className="absolute left-4 text-white/70 hover:text-white text-4xl leading-none px-2 py-4"
            >
              ‹
            </button>
          )}

          {/* Foto */}
          <img
            src={d.photos[lightboxIndex]}
            alt={`Foto ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Tombol next */}
          {lightboxIndex < d.photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
              className="absolute right-4 text-white/70 hover:text-white text-4xl leading-none px-2 py-4"
            >
              ›
            </button>
          )}

          {/* Counter */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm tabular-nums">
            {lightboxIndex + 1} / {d.photos.length}
          </p>
        </div>
      )}

      {/* ── RSVP ─────────────────────────────────────── */}
      <section className={`py-12 px-6 max-w-sm mx-auto ${t.sectionBg} rounded-2xl`}>
        <p className={`text-xs tracking-widest ${t.accent} uppercase text-center mb-6`}>
          Konfirmasi Kehadiran
        </p>

        {submitted ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">🌸</p>
            <p className="text-stone-600 text-sm">Terima kasih telah mengkonfirmasi.</p>
            <p className="text-stone-400 text-sm">Kami sangat menantikan kehadiran Anda.</p>
          </div>
        ) : (
          <form onSubmit={handleRsvp} className="space-y-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Nama lengkap *</label>
              <input
                required
                type="text"
                value={rsvpForm.name}
                onChange={(e) => setRsvpForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nama Anda"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">No. WhatsApp</label>
              <input
                type="tel"
                value={rsvpForm.phone}
                onChange={(e) => setRsvpForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="08xxxxxxxxxx"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Konfirmasi kehadiran</label>
              <select
                value={rsvpForm.attendance}
                onChange={(e) => setRsvpForm(p => ({ ...p, attendance: e.target.value as 'hadir' }))}
                className={inputCls}
              >
                <option value="hadir">Insya Allah hadir</option>
                <option value="tidak_hadir">Berhalangan hadir</option>
                <option value="belum_konfirmasi">Belum bisa konfirmasi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Ucapan & doa</label>
              <textarea
                value={rsvpForm.message}
                rows={3}
                onChange={(e) => setRsvpForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Tuliskan ucapan dan doa untuk pengantin..."
                className={`${inputCls} resize-none`}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 disabled:opacity-60 text-white text-sm rounded-xl transition-colors ${t.submitBtn}`}
            >
              {submitting ? 'Mengirim...' : 'Kirim Konfirmasi'}
            </button>
          </form>
        )}
      </section>

      {/* ── Ucapan & Doa ─────────────────────────────── */}
      {ucapan.length > 0 && (
        <section className="py-12 px-6 max-w-sm mx-auto">
          <p className={`text-xs tracking-widest ${t.accent} uppercase text-center mb-6`}>
            Ucapan & Doa
          </p>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {ucapan.map((g) => (
              <div key={g.id} className={`${t.sectionBg} rounded-xl p-4`}>
                <p className="text-sm font-medium text-stone-700">{g.name}</p>
                <p className="text-xs text-stone-500 italic mt-1 leading-relaxed">&ldquo;{g.message}&rdquo;</p>
                <p className="text-xs text-stone-300 mt-2">
                  {new Date(g.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="py-8 text-center">
        <p className="text-xs text-stone-300">Dibuat dengan ♡ di undanganku.id</p>
      </footer>
    </div>
  )
}
