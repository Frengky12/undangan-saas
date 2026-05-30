// src/pages/invitation/InvitationPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { usePublicInvitation } from '../../hooks/useInvitations'
import { useRsvp, usePublicGuests } from '../../hooks/useGuests'
import type { ThemeId } from '../../types/database'

function resolveAudioUrl(url: string): string {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (match) return `https://drive.google.com/uc?id=${match[1]}&export=download&confirm=t`
  return url
}

type ThemeCfg = {
  heroBg: string
  coverBg: string
  accent: string
  accentText: string
  accentBtn: string
  submitBtn: string
  ring: string
  photoBorder: string
  sectionBg: string
  cardBg: string
  countdownBox: string
  ornamentColor: string | null
  font: string
  photoShape: string
  dividerColor: string
}

const THEMES: Record<ThemeId, ThemeCfg> = {
  floral: {
    heroBg:       'bg-gradient-to-b from-rose-50 via-pink-50/30 to-stone-50',
    coverBg:      'bg-gradient-to-b from-rose-100 via-rose-50 to-pink-50',
    accent:       'text-rose-300',
    accentText:   'text-rose-400',
    accentBtn:    'border-rose-200 text-rose-400 hover:bg-rose-50',
    submitBtn:    'bg-rose-400 hover:bg-rose-500',
    ring:         'focus:ring-rose-200',
    photoBorder:  'border-white shadow-xl shadow-rose-200/50',
    sectionBg:    'bg-white',
    cardBg:       'bg-rose-50/60 border border-rose-100',
    countdownBox: 'bg-white border border-rose-100 shadow-sm',
    ornamentColor: '#f43f5e',
    font:         'font-serif',
    photoShape:   'rounded-full',
    dividerColor: 'bg-rose-200/60',
  },
  modern: {
    heroBg:       'bg-gradient-to-b from-slate-100 via-slate-50 to-white',
    coverBg:      'bg-gradient-to-b from-slate-200 via-slate-100 to-slate-50',
    accent:       'text-indigo-400',
    accentText:   'text-indigo-500',
    accentBtn:    'border-indigo-200 text-indigo-400 hover:bg-indigo-50',
    submitBtn:    'bg-indigo-500 hover:bg-indigo-600',
    ring:         'focus:ring-indigo-200',
    photoBorder:  'border-white shadow-xl shadow-slate-200/50',
    sectionBg:    'bg-slate-50',
    cardBg:       'bg-white border border-slate-200',
    countdownBox: 'bg-white border border-slate-200 shadow-sm',
    ornamentColor: null,
    font:         'font-sans',
    photoShape:   'rounded-2xl',
    dividerColor: 'bg-slate-300/60',
  },
  klasik: {
    heroBg:       'bg-gradient-to-b from-amber-50 via-yellow-50/20 to-stone-100',
    coverBg:      'bg-gradient-to-b from-amber-100 via-amber-50 to-yellow-50',
    accent:       'text-amber-500',
    accentText:   'text-amber-600',
    accentBtn:    'border-amber-300 text-amber-600 hover:bg-amber-50',
    submitBtn:    'bg-amber-500 hover:bg-amber-600',
    ring:         'focus:ring-amber-200',
    photoBorder:  'border-amber-100 shadow-xl shadow-amber-200/50',
    sectionBg:    'bg-amber-50/40',
    cardBg:       'bg-amber-50 border border-amber-100',
    countdownBox: 'bg-white border border-amber-100 shadow-sm',
    ornamentColor: '#f59e0b',
    font:         'font-serif',
    photoShape:   'rounded-full',
    dividerColor: 'bg-amber-200/70',
  },
}

function FloralOrnament({ color }: { color: string }) {
  return (
    <svg className="w-20 h-6 opacity-30" viewBox="0 0 100 30" fill={color}>
      <path d="M50 15 C40 5 20 5 10 15 C20 25 40 25 50 15Z" />
      <path d="M50 15 C60 5 80 5 90 15 C80 25 60 25 50 15Z" />
      <circle cx="50" cy="15" r="3" />
    </svg>
  )
}

function KlasikOrnament({ color }: { color: string }) {
  return (
    <svg className="w-24 h-6 opacity-30" viewBox="0 0 120 30" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M5 15 L28 6 L33 15 L28 24 L5 15Z" />
      <path d="M115 15 L92 6 L87 15 L92 24 L115 15Z" />
      <line x1="36" y1="15" x2="84" y2="15" />
      <circle cx="60" cy="15" r="4" fill={color} fillOpacity="0.15" />
      <circle cx="60" cy="15" r="2" fill={color} fillOpacity="0.4" />
    </svg>
  )
}

function SectionTitle({ label, t }: { label: string; t: ThemeCfg }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className={`h-px flex-1 ${t.dividerColor}`} />
      <p className={`text-[10px] tracking-[.3em] ${t.accentText} uppercase whitespace-nowrap font-medium`}>{label}</p>
      <div className={`h-px flex-1 ${t.dividerColor}`} />
    </div>
  )
}

function IconCalendar({ cls }: { cls: string }) {
  return (
    <svg className={`w-3.5 h-3.5 flex-shrink-0 ${cls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function IconClock({ cls }: { cls: string }) {
  return (
    <svg className={`w-3.5 h-3.5 flex-shrink-0 ${cls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconPin({ cls }: { cls: string }) {
  return (
    <svg className={`w-3.5 h-3.5 flex-shrink-0 ${cls}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  )
}

export default function InvitationPage() {
  const { slug } = useParams<{ slug: string }>()
  const { invitation, loading, notFound } = usePublicInvitation(slug!)
  const { submitRsvp, submitting, submitted } = useRsvp(invitation?.id ?? '')
  const { guests: ucapan } = usePublicGuests(invitation?.id ?? '')

  const [opened, setOpened] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [rsvpForm, setRsvpForm] = useState({ name: '', phone: '', attendance: 'hadir' as const, message: '' })
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [musicError, setMusicError] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

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

  function openInvitation() {
    setOpened(true)
    const audio = audioRef.current
    if (!audio) return
    const tryPlay = () => audio.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false))
    // Audio sudah siap → langsung play; belum siap → tunggu event canplay
    if (audio.readyState >= 3) tryPlay()
    else audio.addEventListener('canplay', tryPlay, { once: true })
  }

  function toggleMusic() {
    const audio = audioRef.current
    if (!audio) return
    if (musicPlaying) { audio.pause(); setMusicPlaying(false) }
    else audio.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false))
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
  const themeId = invitation!.theme_id
  const t = THEMES[themeId] ?? THEMES.floral

  const inputCls = `w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 ${t.ring} bg-white`
  const fmt = (dateStr: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(dateStr).toLocaleDateString('id-ID', opts)

  const Ornament = () => {
    if (themeId === 'floral' && t.ornamentColor) return <FloralOrnament color={t.ornamentColor} />
    if (themeId === 'klasik' && t.ornamentColor) return <KlasikOrnament color={t.ornamentColor} />
    return null
  }

  return (
    <div className={`min-h-screen ${t.font}`}>

      {d.musicUrl && (
        <audio
          ref={audioRef}
          src={resolveAudioUrl(d.musicUrl)}
          loop
          preload="auto"
          onError={() => setMusicError(true)}
        />
      )}

      {/* ── Cover Screen ─────────────────────────────────── */}
      <div className={`fixed inset-0 z-40 flex flex-col items-center justify-center px-8 text-center transition-all duration-700 ease-in-out ${t.coverBg} ${opened ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'}`}>
        <Ornament />

        <p className={`text-[10px] tracking-[.3em] uppercase ${t.accentText} mt-5 mb-6`}>
          Bismillahirrahmanirrahim
        </p>

        {d.photoUrl && (
          <img
            src={d.photoUrl}
            alt="foto pengantin"
            className={`w-24 h-24 object-cover border-4 mb-5 ${t.photoBorder} ${t.photoShape}`}
          />
        )}

        <p className="text-xs text-stone-400 italic max-w-xs leading-relaxed mb-6">
          {d.quranVerse || '"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri..."'}
        </p>

        <h1 className="text-3xl font-light text-stone-700">{d.groomName}</h1>
        <div className="flex items-center gap-3 my-2">
          <div className={`h-px w-8 ${t.dividerColor}`} />
          <span className={`${t.accent} text-lg`}>&</span>
          <div className={`h-px w-8 ${t.dividerColor}`} />
        </div>
        <h1 className="text-3xl font-light text-stone-700">{d.brideName}</h1>

        {d.resepsiDate && (
          <p className="text-xs text-stone-400 mt-4 tracking-widest">
            {fmt(d.resepsiDate, { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}

        <div className="mt-5 mb-7"><Ornament /></div>

        <button
          onClick={openInvitation}
          className={`px-7 py-2.5 rounded-full text-sm font-medium text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${t.submitBtn}`}
        >
          ✉ Buka Undangan
        </button>
        <p className="text-[10px] text-stone-300 mt-3">Sentuh untuk membuka</p>
      </div>

      {/* ── Floating musik (selalu di atas, tidak terpengaruh layer) ── */}
      {d.musicUrl && opened && !musicError && (
        <button
          onClick={toggleMusic}
          aria-label={musicPlaying ? 'Pause musik' : 'Play musik'}
          className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 ${t.submitBtn}`}
        >
          {musicPlaying ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {musicPlaying && <span className={`absolute inset-0 rounded-full animate-ping opacity-20 ${t.submitBtn}`} />}
        </button>
      )}

      {/* ── Konten Utama ─────────────────────────────────── */}
      <div className={`transition-opacity duration-500 ${opened ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>

        {/* ── Hero ─────────────────────────────── */}
        <section className={`relative min-h-screen flex flex-col items-center justify-center text-center px-6 pb-16 ${t.heroBg} overflow-hidden`}>
          {t.ornamentColor && (
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: themeId === 'klasik'
                  ? `repeating-linear-gradient(45deg, ${t.ornamentColor} 0, ${t.ornamentColor} 1px, transparent 0, transparent 50%)`
                  : `radial-gradient(circle, ${t.ornamentColor} 1px, transparent 1px)`,
                backgroundSize: themeId === 'klasik' ? '24px 24px' : '36px 36px',
              }}
            />
          )}

          <div className="mb-4"><Ornament /></div>

          <p className={`text-[10px] tracking-[.3em] ${t.accentText} uppercase mb-6`}>
            Bismillahirrahmanirrahim
          </p>

          {d.photoUrl && (
            <img
              src={d.photoUrl}
              alt="foto pengantin"
              className={`w-40 h-40 object-cover border-4 mb-8 ${t.photoBorder} ${t.photoShape}`}
            />
          )}

          {d.quranVerse && (
            <p className="text-sm text-stone-400 italic max-w-xs mb-8 leading-relaxed">{d.quranVerse}</p>
          )}

          <p className="text-xs text-stone-400 tracking-[.2em] uppercase mb-4">Pernikahan</p>

          <h1 className="text-4xl font-light text-stone-700">{d.groomName}</h1>
          <div className="flex items-center gap-4 my-3">
            <div className={`h-px w-14 ${t.dividerColor}`} />
            <span className={`${t.accent} text-2xl font-light`}>&</span>
            <div className={`h-px w-14 ${t.dividerColor}`} />
          </div>
          <h1 className="text-4xl font-light text-stone-700">{d.brideName}</h1>

          {(d.groomFather || d.brideFather) && (
            <p className="text-xs text-stone-400 mt-4 leading-relaxed max-w-[280px]">
              {d.groomFather && `Putra dari ${d.groomFather}`}
              {d.groomFather && d.brideFather && ' · '}
              {d.brideFather && `Putri dari ${d.brideFather}`}
            </p>
          )}

          {d.resepsiDate && (
            <p className="text-xs text-stone-400 mt-5 tracking-widest uppercase">
              {fmt(d.resepsiDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          <div className="mt-6"><Ornament /></div>
          <div className="mt-6 text-stone-300 text-xs animate-bounce">↓</div>
        </section>

        {/* ── Countdown ────────────────────────── */}
        <section className={`py-14 px-6 text-center ${t.sectionBg}`}>
          <SectionTitle label="Menuju Hari Bahagia" t={t} />
          <div className="flex justify-center gap-3">
            {[
              { val: timeLeft.days, label: 'Hari' },
              { val: timeLeft.hours, label: 'Jam' },
              { val: timeLeft.minutes, label: 'Menit' },
              { val: timeLeft.seconds, label: 'Detik' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${t.countdownBox}`}>
                  <span className="text-2xl font-light text-stone-700 tabular-nums">
                    {String(val).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 mt-2 tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Info Acara ───────────────────────── */}
        <section className="py-14 px-6 max-w-sm mx-auto">
          <SectionTitle label="Detail Acara" t={t} />

          {d.openingText && (
            <p className="text-sm text-stone-500 text-center leading-relaxed italic mb-10">{d.openingText}</p>
          )}

          <div className="space-y-4">
            {d.akadDate && (
              <div className={`rounded-2xl p-5 ${t.cardBg}`}>
                <p className={`text-[10px] tracking-[.2em] uppercase ${t.accentText} font-semibold mb-3`}>Akad Nikah</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IconCalendar cls={t.accentText} />
                    <p className="text-sm text-stone-700">
                      {fmt(d.akadDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconClock cls={t.accentText} />
                    <p className="text-sm text-stone-500">Pukul {d.akadTime} WIB</p>
                  </div>
                </div>
              </div>
            )}

            <div className={`rounded-2xl p-5 ${t.cardBg}`}>
              <p className={`text-[10px] tracking-[.2em] uppercase ${t.accentText} font-semibold mb-3`}>Resepsi Pernikahan</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <IconCalendar cls={t.accentText} />
                  <p className="text-sm text-stone-700">
                    {fmt(d.resepsiDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <IconClock cls={t.accentText} />
                  <p className="text-sm text-stone-500">Pukul {d.resepsiTime} WIB</p>
                </div>
                {d.venue && (
                  <div className="flex items-start gap-2">
                    <IconPin cls={`${t.accentText} mt-0.5`} />
                    <div>
                      <p className="text-sm text-stone-700 font-medium">{d.venue}</p>
                      {d.address && <p className="text-xs text-stone-400 mt-0.5">{d.address}</p>}
                    </div>
                  </div>
                )}
              </div>
              {d.mapsUrl && (
                <a
                  href={d.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 mt-4 px-4 py-1.5 border rounded-full text-xs transition-colors ${t.accentBtn}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                  Buka Google Maps
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ── Galeri Foto ──────────────────────── */}
        {d.photos && d.photos.length > 0 && (
          <section className={`py-14 px-6 ${t.sectionBg}`}>
            <div className="max-w-sm mx-auto">
              <SectionTitle label="Galeri Foto" t={t} />
              <div className="grid grid-cols-2 gap-2">
                {d.photos.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setLightboxIndex(i)}
                    className="aspect-square overflow-hidden rounded-2xl focus:outline-none"
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
            </div>
          </section>
        )}

        {/* ── Lightbox ─────────────────────────── */}
        {lightboxIndex !== null && d.photos && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none">×</button>
            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 text-3xl"
              >‹</button>
            )}
            <img
              src={d.photos[lightboxIndex]}
              alt={`Foto ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {lightboxIndex < d.photos.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 text-3xl"
              >›</button>
            )}
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm tabular-nums">
              {lightboxIndex + 1} / {d.photos.length}
            </p>
          </div>
        )}

        {/* ── RSVP ─────────────────────────────── */}
        <section className="py-14 px-6">
          <div className="max-w-sm mx-auto">
            <SectionTitle label="Konfirmasi Kehadiran" t={t} />
            {submitted ? (
              <div className={`text-center py-10 rounded-2xl ${t.cardBg}`}>
                <p className="text-3xl mb-3">🌸</p>
                <p className="text-stone-600 text-sm font-medium">Terima kasih!</p>
                <p className="text-stone-400 text-sm mt-1">Kami sangat menantikan kehadiran Anda.</p>
              </div>
            ) : (
              <form onSubmit={handleRsvp} className="space-y-4">
                <div>
                  <label className="block text-xs text-stone-500 mb-1.5">Nama lengkap *</label>
                  <input
                    required type="text"
                    value={rsvpForm.name}
                    onChange={(e) => setRsvpForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nama Anda"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1.5">No. WhatsApp</label>
                  <input
                    type="tel"
                    value={rsvpForm.phone}
                    onChange={(e) => setRsvpForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1.5">Konfirmasi kehadiran</label>
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
                  <label className="block text-xs text-stone-500 mb-1.5">Ucapan & doa</label>
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
                  className={`w-full py-3 disabled:opacity-60 text-white text-sm rounded-xl transition-colors font-medium ${t.submitBtn}`}
                >
                  {submitting ? 'Mengirim...' : 'Kirim Konfirmasi'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* ── Ucapan & Doa ─────────────────────── */}
        {ucapan.length > 0 && (
          <section className={`py-14 px-6 ${t.sectionBg}`}>
            <div className="max-w-sm mx-auto">
              <SectionTitle label="Ucapan & Doa" t={t} />
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {ucapan.map((g) => (
                  <div key={g.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-stone-700">{g.name}</p>
                      <p className="text-[10px] text-stone-300 whitespace-nowrap mt-0.5">
                        {new Date(g.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    {g.message && (
                      <p className="text-xs text-stone-500 italic mt-1.5 leading-relaxed">
                        &ldquo;{g.message}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Penutup ───────────────────────────── */}
        <section className={`py-14 px-8 text-center ${t.heroBg}`}>
          <div className="max-w-xs mx-auto">
            <div className="flex justify-center mb-5"><Ornament /></div>
            <p className="text-sm text-stone-500 leading-relaxed italic">
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.
            </p>
            <p className={`text-xs ${t.accentText} mt-5`}>Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh</p>
          </div>
        </section>

        {/* ── Footer ───────────────────────────── */}
        <footer className="py-6 text-center bg-stone-800">
          <p className="text-xs text-stone-400">
            Dibuat dengan <span className="text-rose-400">♡</span> di{' '}
            <span className="text-stone-300">undanganku.id</span>
          </p>
        </footer>

      </div>
    </div>
  )
}
