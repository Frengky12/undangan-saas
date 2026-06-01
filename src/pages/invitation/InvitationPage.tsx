// src/pages/invitation/InvitationPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { usePublicInvitation } from '../../hooks/useInvitations'
import { useRsvp, usePublicGuests } from '../../hooks/useGuests'
import { useReveal } from '../../hooks/useReveal'
import { THEMES } from '../../components/invitation/themes'
import { SectionOrnament } from '../../components/invitation/Ornaments'
import { FloatingParticles } from '../../components/invitation/FloatingParticles'
import { CountdownFlip } from '../../components/invitation/CountdownFlip'
import type { ThemeId } from '../../types/database'

function resolveAudioUrl(url: string): string {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (match) return `https://drive.google.com/uc?id=${match[1]}&export=download&confirm=t`
  return url
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

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal()
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`${className} reveal-hidden ${visible ? 'reveal-visible' : ''}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </section>
  )
}

type ThemeCfg = typeof THEMES[ThemeId]

function SectionTitleComp({ label, t }: { label: string; t: ThemeCfg }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className={`h-px flex-1 ${t.dividerColor}`} />
      <p className={`text-[10px] tracking-[.3em] ${t.accentText} uppercase whitespace-nowrap font-medium`}>{label}</p>
      <div className={`h-px flex-1 ${t.dividerColor}`} />
    </div>
  )
}

export default function InvitationPage() {
  const { slug } = useParams<{ slug: string }>()
  const { invitation, loading, notFound } = usePublicInvitation(slug!)
  const { submitRsvp, submitting, submitted } = useRsvp(invitation?.id ?? '')
  const { guests: ucapan } = usePublicGuests(invitation?.id ?? '')

  const [opened, setOpened] = useState(false)
  const [openAnim, setOpenAnim] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [rsvpForm, setRsvpForm] = useState({ name: '', phone: '', attendance: 'hadir' as const, message: '' })
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [musicError, setMusicError] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [coverReady, setCoverReady] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setCoverReady(true), 300)
    return () => clearTimeout(t)
  }, [])

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
    setOpenAnim(true)
    setTimeout(() => setOpened(true), 600)
    const audio = audioRef.current
    if (!audio) return
    const tryPlay = () => audio.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false))
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
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-400 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-rose-300 text-sm">Membuka undangan...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center animate-fade-in">
        <p className="text-5xl mb-4">💌</p>
        <p className="text-stone-500">Undangan tidak ditemukan</p>
      </div>
    </div>
  )

  const d = invitation!.data
  const themeId = invitation!.theme_id
  const t = THEMES[themeId] ?? THEMES.floral

  const inputCls = `w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 ${t.ring} bg-white transition-shadow`
  const fmt = (dateStr: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(dateStr).toLocaleDateString('id-ID', opts)

  const glowAnim = themeId === 'floral'
    ? 'pulseGlow 2.5s ease-in-out infinite'
    : themeId === 'klasik'
    ? 'pulseGlowAmber 2.5s ease-in-out infinite'
    : 'pulseGlowIndigo 2.5s ease-in-out infinite'

  const ampColor = themeId === 'klasik'
    ? 'shimmer-gold'
    : themeId === 'modern'
    ? 'text-indigo-400'
    : 'gradient-text'

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
      <div
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center px-8 text-center ${t.coverBg} overflow-hidden`}
        style={{
          transition: 'opacity 0.6s ease, transform 0.6s ease',
          opacity: openAnim ? 0 : 1,
          transform: openAnim ? 'scale(1.08)' : 'scale(1)',
          pointerEvents: openAnim ? 'none' : 'auto',
        }}
      >
        <FloatingParticles themeId={themeId} />

        {/* Background geometric (modern only) */}
        {themeId === 'modern' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-indigo-200/30 rounded-full geo-rotate" style={{ animationDuration: '25s' }} />
            <div className="absolute top-1/3 right-1/4 w-20 h-20 border border-indigo-200/20 rotate-45 geo-rotate" style={{ animationDuration: '18s', animationDirection: 'reverse' }} />
            <div className="absolute bottom-1/4 left-1/3 w-16 h-16 border border-indigo-100/30 rounded-full geo-rotate" style={{ animationDuration: '30s' }} />
          </div>
        )}

        <div
          className="relative z-10 flex flex-col items-center"
          style={{ opacity: coverReady ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >
          <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both', opacity: 0 }}>
            <SectionOrnament themeId={themeId} ornamentColor={t.ornamentColor} />
          </div>

          <p
            className={`text-[10px] tracking-[.3em] uppercase ${t.accentText} mt-5 mb-6`}
            style={{ animation: 'fadeIn 1s 0.3s ease forwards', opacity: 0 }}
          >
            Bismillahirrahmanirrahim
          </p>

          {d.photoUrl && (
            <div
              className="mb-5"
              style={{ animation: 'slideUp 0.8s 0.4s ease forwards', opacity: 0 }}
            >
              <img
                src={d.photoUrl}
                alt="foto pengantin"
                className={`w-24 h-24 object-cover border-4 photo-3d ${t.photoBorder} ${t.photoShape}`}
              />
            </div>
          )}

          <p
            className="text-xs text-stone-400 italic max-w-xs leading-relaxed mb-6"
            style={{ animation: 'fadeIn 1s 0.6s ease forwards', opacity: 0 }}
          >
            {d.quranVerse || 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا (QS. Ar-Rum: 21)'}
          </p>

          <h1
            className="text-3xl font-light text-stone-700"
            style={{ animation: 'nameReveal 0.9s 0.8s ease forwards', opacity: 0 }}
          >
            {d.groomName}
          </h1>

          <div
            className="flex items-center gap-3 my-2"
            style={{ animation: 'fadeIn 0.6s 1.1s ease forwards', opacity: 0 }}
          >
            <div className={`h-px w-8 ${t.dividerColor}`} />
            <span className={`text-lg ${ampColor}`}>&amp;</span>
            <div className={`h-px w-8 ${t.dividerColor}`} />
          </div>

          <h1
            className="text-3xl font-light text-stone-700"
            style={{ animation: 'nameReveal 0.9s 1.2s ease forwards', opacity: 0 }}
          >
            {d.brideName}
          </h1>

          {d.resepsiDate && (
            <p
              className="text-xs text-stone-400 mt-4 tracking-widest"
              style={{ animation: 'fadeIn 0.8s 1.5s ease forwards', opacity: 0 }}
            >
              {fmt(d.resepsiDate, { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          <div
            className="mt-5 mb-7"
            style={{ animation: 'fadeIn 0.8s 1.6s ease forwards', opacity: 0 }}
          >
            <SectionOrnament themeId={themeId} ornamentColor={t.ornamentColor} />
          </div>

          <button
            onClick={openInvitation}
            className={`relative px-8 py-3 rounded-full text-sm font-medium text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${t.submitBtn}`}
            style={{
              animation: `fadeIn 0.8s 1.8s ease forwards, ${glowAnim}`,
              opacity: 0,
              animationFillMode: 'forwards',
            }}
          >
            ✉ Buka Undangan
          </button>
          <p
            className="text-[10px] text-stone-300 mt-3"
            style={{ animation: 'fadeIn 0.8s 2s ease forwards', opacity: 0 }}
          >
            Sentuh untuk membuka
          </p>
        </div>
      </div>

      {/* ── Floating musik ──────────────────────────────────── */}
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

      {/* ── Konten Utama ─────────────────────────────────────── */}
      <div style={{ opacity: opened ? 1 : 0, transition: 'opacity 0.5s ease 0.3s', pointerEvents: opened ? 'auto' : 'none' }}>

        {/* ── Hero ─────────────────────────────── */}
        <section className={`relative min-h-screen flex flex-col items-center justify-center text-center px-6 pb-16 ${t.heroBg} overflow-hidden`}>

          {/* Background pattern */}
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

          {/* Modern geometric background */}
          {themeId === 'modern' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
              <div className="absolute -top-20 -right-20 w-64 h-64 border border-indigo-200 rounded-full geo-rotate" style={{ animationDuration: '40s' }} />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 border border-indigo-100 rounded-full geo-rotate" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center animate-slide-up">
            <div className="mb-4">
              <SectionOrnament themeId={themeId} ornamentColor={t.ornamentColor} />
            </div>

            <p className={`text-[10px] tracking-[.3em] ${t.accentText} uppercase mb-6`}>
              Bismillahirrahmanirrahim
            </p>

            {d.photoUrl && (
              <div className={`w-44 h-44 mb-8 photo-3d border-4 overflow-hidden ${t.photoBorder} ${t.photoShape}`}
                style={{ filter: themeId === 'klasik' ? 'drop-shadow(0 0 20px rgba(245,158,11,0.3))' : undefined }}
              >
                <img
                  src={d.photoUrl}
                  alt="foto pengantin"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {d.quranVerse && (
              <p className="text-sm text-stone-400 italic max-w-xs mb-8 leading-relaxed">{d.quranVerse}</p>
            )}

            <p className="text-xs text-stone-400 tracking-[.2em] uppercase mb-4">Pernikahan</p>

            <h1 className={`text-4xl font-light ${themeId === 'klasik' ? 'text-amber-900' : 'text-stone-700'}`}>
              {d.groomName}
            </h1>
            <div className="flex items-center gap-4 my-3">
              <div className={`h-px w-14 ${t.dividerColor}`} />
              <span className={`text-3xl font-light ${ampColor}`}>&amp;</span>
              <div className={`h-px w-14 ${t.dividerColor}`} />
            </div>
            <h1 className={`text-4xl font-light ${themeId === 'klasik' ? 'text-amber-900' : 'text-stone-700'}`}>
              {d.brideName}
            </h1>

            {(d.groomFather || d.groomMother || d.brideFather || d.brideMother) && (
              <div className="mt-4 space-y-1">
                {(d.groomFather || d.groomMother) && (
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Putra dari{' '}
                    {[d.groomFather && `Bapak ${d.groomFather}`, d.groomMother && `Ibu ${d.groomMother}`]
                      .filter(Boolean).join(' & ')}
                  </p>
                )}
                {(d.brideFather || d.brideMother) && (
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Putri dari{' '}
                    {[d.brideFather && `Bapak ${d.brideFather}`, d.brideMother && `Ibu ${d.brideMother}`]
                      .filter(Boolean).join(' & ')}
                  </p>
                )}
              </div>
            )}

            {d.resepsiDate && (
              <p className="text-xs text-stone-400 mt-5 tracking-widest uppercase">
                {fmt(d.resepsiDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}

            <div className="mt-6">
              <SectionOrnament themeId={themeId} ornamentColor={t.ornamentColor} />
            </div>
            <div className="mt-6 text-stone-300 text-xs" style={{ animation: 'floatY 2s ease-in-out infinite' }}>↓</div>
          </div>
        </section>

        {/* ── Countdown ────────────────────────── */}
        <RevealSection className={`py-14 px-6 text-center ${t.sectionBg}`}>
          <SectionTitleComp label="Menuju Hari Bahagia" t={t} />
          <CountdownFlip timeLeft={timeLeft} boxCls={t.countdownBox} />
        </RevealSection>

        {/* ── Info Acara ───────────────────────── */}
        <RevealSection className="py-14 px-6 max-w-sm mx-auto">
          <SectionTitleComp label="Detail Acara" t={t} />

          {d.openingText && (
            <p className="text-sm text-stone-500 text-center leading-relaxed italic mb-10">{d.openingText}</p>
          )}

          <div className="space-y-4">
            {d.akadDate && (
              <div className={`rounded-2xl p-5 tilt-card ${t.cardBg}`}>
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

            <div className={`rounded-2xl p-5 tilt-card ${t.cardBg}`}>
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
        </RevealSection>

        {/* ── Galeri Foto ──────────────────────── */}
        {d.photos && d.photos.length > 0 && (
          <RevealSection className={`py-14 px-6 ${t.sectionBg}`}>
            <div className="max-w-sm mx-auto">
              <SectionTitleComp label="Galeri Foto" t={t} />
              <div className="grid grid-cols-2 gap-2">
                {d.photos.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setLightboxIndex(i)}
                    className={`overflow-hidden focus:outline-none group ${
                      i === 0 ? 'col-span-2 aspect-video rounded-3xl' : 'aspect-square rounded-2xl'
                    }`}
                    style={{
                      animation: `slideUp 0.6s ${0.1 * i}s ease both`,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                  >
                    <img
                      src={url}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          </RevealSection>
        )}

        {/* ── Lightbox ─────────────────────────── */}
        {lightboxIndex !== null && d.photos && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
            style={{ animation: 'fadeIn 0.2s ease' }}
          >
            <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl leading-none transition-colors">×</button>
            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 text-3xl transition-all"
              >‹</button>
            )}
            <img
              src={d.photos[lightboxIndex]}
              alt={`Foto ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
              style={{ animation: 'slideUp 0.3s ease' }}
              onClick={(e) => e.stopPropagation()}
            />
            {lightboxIndex < d.photos.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 text-3xl transition-all"
              >›</button>
            )}
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-sm tabular-nums">
              {lightboxIndex + 1} / {d.photos.length}
            </p>
          </div>
        )}

        {/* ── RSVP ─────────────────────────────── */}
        <RevealSection className="py-14 px-6">
          <div className="max-w-sm mx-auto">
            <SectionTitleComp label="Konfirmasi Kehadiran" t={t} />
            {submitted ? (
              <div className={`text-center py-10 rounded-2xl ${t.cardBg}`} style={{ animation: 'slideUp 0.5s ease' }}>
                <p className="text-4xl mb-3">🌸</p>
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
                  <label className="block text-xs text-stone-500 mb-1.5">Ucapan &amp; doa</label>
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
                  className={`w-full py-3 disabled:opacity-60 text-white text-sm rounded-xl transition-all font-medium hover:scale-[1.02] active:scale-95 ${t.submitBtn}`}
                  style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}
                >
                  {submitting ? 'Mengirim...' : 'Kirim Konfirmasi'}
                </button>
              </form>
            )}
          </div>
        </RevealSection>

        {/* ── Ucapan & Doa ─────────────────────── */}
        {ucapan.length > 0 && (
          <RevealSection className={`py-14 px-6 ${t.sectionBg}`}>
            <div className="max-w-sm mx-auto">
              <SectionTitleComp label="Ucapan &amp; Doa" t={t} />
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {ucapan.map((g, i) => (
                  <div
                    key={g.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm border border-stone-100 ${i % 2 === 0 ? 'tilt-card' : ''}`}
                    style={{
                      animation: `slideUp 0.5s ${i * 0.08}s ease both`,
                      borderLeft: i % 2 === 0 && t.ornamentColor ? `3px solid ${t.ornamentColor}40` : undefined,
                    }}
                  >
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
          </RevealSection>
        )}

        {/* ── Penutup ───────────────────────────── */}
        <RevealSection className={`py-16 px-8 text-center ${t.heroBg} relative overflow-hidden`}>
          <FloatingParticles themeId={themeId} />
          <div className="max-w-xs mx-auto relative z-10">
            <div className="flex justify-center mb-5">
              <SectionOrnament themeId={themeId} ornamentColor={t.ornamentColor} />
            </div>
            <p className="text-sm text-stone-500 leading-relaxed italic">
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.
            </p>
            <p className={`text-xs ${t.accentText} mt-5`}>Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh</p>
          </div>
        </RevealSection>

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
