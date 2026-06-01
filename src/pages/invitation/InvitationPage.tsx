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
import { Confetti } from '../../components/invitation/Confetti'
import type { ThemeId, StoryMilestone, BankAccount } from '../../types/database'

function resolveAudioUrl(url: string): string {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (match) return `https://drive.google.com/uc?id=${match[1]}&export=download&confirm=t`
  return url
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop || document.body.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? Math.min((scrolled / total) * 100, 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return progress
}

function toCalDate(dateStr: string, timeStr: string) {
  // Format YYYYMMDDTHHMMSS untuk Google Calendar & ICS
  const [y, m, d] = dateStr.split('-')
  const [hh, mm] = timeStr.split(':')
  return `${y}${m}${d}T${hh}${mm}00`
}

function toCalDateEnd(dateStr: string, timeStr: string, durationHours = 3) {
  const dt = new Date(`${dateStr}T${timeStr}:00`)
  dt.setHours(dt.getHours() + durationHours)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`
}

function buildGoogleCalUrl(title: string, dateStr: string, timeStr: string, location: string, description: string) {
  const start = toCalDate(dateStr, timeStr)
  const end   = toCalDateEnd(dateStr, timeStr)
  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     title,
    dates:    `${start}/${end}`,
    location,
    details:  description,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function downloadIcs(title: string, dateStr: string, timeStr: string, location: string, description: string) {
  const start = toCalDate(dateStr, timeStr)
  const end   = toCalDateEnd(dateStr, timeStr)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//undanganku.id//ID',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'undangan.ics'
  a.click()
  URL.revokeObjectURL(url)
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

function useCopyToClipboard() {
  const [copied, setCopied] = useState<string | null>(null)
  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }
  return { copied, copy }
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
  const [showConfetti, setShowConfetti] = useState(false)
  const scrollProgress = useScrollProgress()
  const { copied, copy } = useCopyToClipboard()
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
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 4500)
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

  const progressColor = themeId === 'klasik'
    ? 'linear-gradient(90deg, #d97706, #fcd34d, #d97706)'
    : themeId === 'modern'
    ? 'linear-gradient(90deg, #6366f1, #a5b4fc, #6366f1)'
    : 'linear-gradient(90deg, #f43f5e, #fb923c, #f43f5e)'

  const calTitle       = `Pernikahan ${d.groomName} & ${d.brideName}`
  const calLocation    = [d.venue, d.address].filter(Boolean).join(', ')
  const calDescription = d.openingText ?? `Pernikahan ${d.groomName} & ${d.brideName}`

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

      <Confetti themeId={themeId} active={showConfetti} />

      {/* ── Scroll Progress Bar ──────────────────────────── */}
      {opened && (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px]" style={{ background: 'rgba(0,0,0,0.06)' }}>
          <div
            className="h-full"
            style={{
              width: `${scrollProgress}%`,
              background: progressColor,
              transition: 'width 0.1s linear',
              backgroundSize: '200% auto',
              animation: 'shimmer 3s linear infinite',
            }}
          />
        </div>
      )}

      {/* ── Cover Screen ─────────────────────────────────── */}
      <div
        className="fixed inset-0 z-40 overflow-hidden"
        style={{
          transition: 'opacity 0.7s ease, transform 0.7s ease',
          opacity: openAnim ? 0 : 1,
          transform: openAnim ? 'scale(1.08)' : 'scale(1)',
          pointerEvents: openAnim ? 'none' : 'auto',
        }}
      >

        {/* ══ FLORAL COVER ══════════════════════════════════════════ */}
        {themeId === 'floral' && (
          <>
            {/* Blurred photo background */}
            {d.photoUrl
              ? <img src={d.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'blur(22px) brightness(0.38) saturate(1.3)', transform: 'scale(1.08)' }} />
              : <div className="absolute inset-0 bg-gradient-to-b from-rose-200 via-pink-100 to-rose-50" />
            }
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(136,19,55,0.2) 0%, rgba(0,0,0,0.3) 70%)' }} />
            <FloatingParticles themeId="floral" />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-center"
              style={{ opacity: coverReady ? 1 : 0, transition: 'opacity 0.5s ease' }}>
              <div style={{ animation: 'fadeIn 0.8s 0.1s ease forwards', opacity: 0 }}>
                <SectionOrnament themeId="floral" ornamentColor="#ffffff" />
              </div>
              <p className="text-[10px] tracking-[.3em] uppercase text-white/70 mt-4 mb-5"
                style={{ animation: 'fadeIn 1s 0.3s ease forwards', opacity: 0 }}>
                Bismillahirrahmanirrahim
              </p>
              {d.photoUrl && (
                <div style={{ animation: 'slideUp 0.8s 0.4s ease forwards', opacity: 0 }}>
                  <img src={d.photoUrl} alt="foto pengantin"
                    className="w-36 h-36 object-cover rounded-full border-4 border-white/90 shadow-2xl photo-3d"
                    style={{ boxShadow: '0 0 40px rgba(244,63,94,0.5), 0 8px 32px rgba(0,0,0,0.4)' }} />
                </div>
              )}
              <p className="text-xs italic max-w-xs leading-relaxed my-5 text-white/65"
                style={{ animation: 'fadeIn 1s 0.6s ease forwards', opacity: 0 }}>
                {d.quranVerse || 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا (QS. Ar-Rum: 21)'}
              </p>
              <h1 className="text-4xl font-light text-white drop-shadow-lg"
                style={{ animation: 'nameReveal 0.9s 0.8s ease forwards', opacity: 0 }}>{d.groomName}</h1>
              <div className="flex items-center gap-4 my-2.5" style={{ animation: 'fadeIn 0.6s 1.1s ease forwards', opacity: 0 }}>
                <div className="h-px w-10 bg-white/40" />
                <span className="text-2xl text-rose-300">&amp;</span>
                <div className="h-px w-10 bg-white/40" />
              </div>
              <h1 className="text-4xl font-light text-white drop-shadow-lg"
                style={{ animation: 'nameReveal 0.9s 1.2s ease forwards', opacity: 0 }}>{d.brideName}</h1>
              {d.resepsiDate && (
                <p className="text-xs text-white/50 mt-4 tracking-widest uppercase"
                  style={{ animation: 'fadeIn 0.8s 1.5s ease forwards', opacity: 0 }}>
                  {fmt(d.resepsiDate, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <div className="mt-5 mb-6" style={{ animation: 'fadeIn 0.8s 1.5s ease forwards', opacity: 0 }}>
                <SectionOrnament themeId="floral" ornamentColor="#ffffff" />
              </div>
              <button onClick={openInvitation}
                className="px-8 py-3 rounded-full text-sm font-medium text-white bg-rose-400/80 hover:bg-rose-400 shadow-xl transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
                style={{ animation: `fadeIn 0.8s 1.7s ease forwards, ${glowAnim}`, opacity: 0, animationFillMode: 'forwards' }}>
                ✉ Buka Undangan
              </button>
              <p className="text-[10px] text-white/35 mt-3"
                style={{ animation: 'fadeIn 0.8s 1.9s ease forwards', opacity: 0 }}>
                Sentuh untuk membuka
              </p>
            </div>
          </>
        )}

        {/* ══ MODERN COVER ══════════════════════════════════════════ */}
        {themeId === 'modern' && (
          <>
            {/* Top: foto */}
            <div className="absolute top-0 left-0 right-0 overflow-hidden" style={{ height: '48%' }}>
              {d.photoUrl
                ? <img src={d.photoUrl} alt="foto pengantin" className="w-full h-full object-cover"
                    style={{ objectPosition: 'center 20%' }} />
                : <div className="w-full h-full bg-gradient-to-b from-slate-300 to-slate-200 flex items-center justify-center">
                    <svg className="w-20 h-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
              }
              {/* Diagonal cut */}
              <div className="absolute bottom-0 left-0 right-0 h-16"
                style={{ background: '#f8fafc', clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }} />
              {/* Geometric overlays */}
              <div className="absolute top-4 left-4 w-16 h-16 border border-white/30 rounded-full geo-rotate" style={{ animationDuration: '20s' }} />
              <div className="absolute top-6 right-6 w-10 h-10 border border-white/20 rotate-45 geo-rotate" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
            </div>

            {/* Bottom: teks */}
            <div className="absolute left-0 right-0 bottom-0 bg-slate-50 flex flex-col items-center justify-center px-8 text-center"
              style={{ top: '43%' }}>
              <FloatingParticles themeId="modern" />
              <div className="relative z-10" style={{ opacity: coverReady ? 1 : 0, transition: 'opacity 0.5s ease' }}>
                <div className="mb-4" style={{ animation: 'fadeIn 0.8s 0.2s ease forwards', opacity: 0 }}>
                  <SectionOrnament themeId="modern" ornamentColor={null} />
                </div>
                <p className="text-[10px] tracking-[.3em] uppercase text-indigo-400 mb-4"
                  style={{ animation: 'fadeIn 0.8s 0.3s ease forwards', opacity: 0 }}>
                  Bismillahirrahmanirrahim
                </p>
                <h1 className="text-3xl font-light text-slate-700"
                  style={{ animation: 'nameReveal 0.9s 0.5s ease forwards', opacity: 0 }}>{d.groomName}</h1>
                <div className="flex items-center gap-3 my-2" style={{ animation: 'fadeIn 0.6s 0.8s ease forwards', opacity: 0 }}>
                  <div className="h-px w-8 bg-indigo-200" />
                  <span className="text-xl text-indigo-400">&amp;</span>
                  <div className="h-px w-8 bg-indigo-200" />
                </div>
                <h1 className="text-3xl font-light text-slate-700"
                  style={{ animation: 'nameReveal 0.9s 0.9s ease forwards', opacity: 0 }}>{d.brideName}</h1>
                {d.resepsiDate && (
                  <p className="text-[10px] text-slate-400 mt-3 tracking-widest uppercase"
                    style={{ animation: 'fadeIn 0.8s 1.2s ease forwards', opacity: 0 }}>
                    {fmt(d.resepsiDate, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <p className="text-[10px] italic text-slate-400 max-w-[220px] leading-relaxed mt-3 mb-5"
                  style={{ animation: 'fadeIn 0.8s 1.3s ease forwards', opacity: 0 }}>
                  {d.quranVerse?.split('(')[0]?.trim() || 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم'}
                </p>
                <button onClick={openInvitation}
                  className="px-7 py-2.5 rounded-full text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg transition-all hover:scale-105 active:scale-95"
                  style={{ animation: `fadeIn 0.8s 1.5s ease forwards, ${glowAnim}`, opacity: 0, animationFillMode: 'forwards' }}>
                  ✉ Buka Undangan
                </button>
                <p className="text-[10px] text-slate-300 mt-2.5"
                  style={{ animation: 'fadeIn 0.8s 1.7s ease forwards', opacity: 0 }}>
                  Sentuh untuk membuka
                </p>
              </div>
            </div>
          </>
        )}

        {/* ══ KLASIK COVER ══════════════════════════════════════════ */}
        {themeId === 'klasik' && (
          <>
            {/* Gold gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-100" />
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: `repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 1px, transparent 0, transparent 50%)`, backgroundSize: '20px 20px' }} />

            {/* Corner ornaments SVG */}
            {[
              'top-3 left-3 rotate-0',
              'top-3 right-3 rotate-90',
              'bottom-3 right-3 rotate-180',
              'bottom-3 left-3 -rotate-90',
            ].map((pos, i) => (
              <svg key={i} className={`absolute w-16 h-16 opacity-20 ${pos}`} viewBox="0 0 60 60" fill="none" stroke="#f59e0b" strokeWidth="1.2">
                <path d="M5 5 L5 25 M5 5 L25 5" />
                <path d="M5 12 L5 18 M12 5 L18 5" />
                <circle cx="5" cy="5" r="2" fill="#f59e0b" />
                <path d="M15 15 C15 8 22 5 30 5" strokeDasharray="2 3" />
              </svg>
            ))}

            <FloatingParticles themeId="klasik" />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-center"
              style={{ opacity: coverReady ? 1 : 0, transition: 'opacity 0.5s ease' }}>
              <div style={{ animation: 'fadeIn 0.8s 0.1s ease forwards', opacity: 0 }}>
                <SectionOrnament themeId="klasik" ornamentColor="#f59e0b" />
              </div>
              <p className="text-[10px] tracking-[.3em] uppercase text-amber-600 mt-4 mb-5"
                style={{ animation: 'fadeIn 1s 0.3s ease forwards', opacity: 0 }}>
                Bismillahirrahmanirrahim
              </p>

              {/* Foto dalam bingkai oval gold */}
              {d.photoUrl && (
                <div className="mb-5 relative" style={{ animation: 'slideUp 0.8s 0.4s ease forwards', opacity: 0 }}>
                  <div className="w-36 h-36 rounded-full overflow-hidden photo-3d"
                    style={{
                      border: '4px solid #f59e0b',
                      boxShadow: '0 0 0 2px #fcd34d, 0 0 0 6px #f59e0b40, 0 0 30px rgba(245,158,11,0.5)',
                    }}>
                    <img src={d.photoUrl} alt="foto pengantin" className="w-full h-full object-cover" />
                  </div>
                  {/* Sparkle di sekitar foto */}
                  {['top-0 left-2', 'top-2 right-0', 'bottom-1 left-0', 'bottom-0 right-2'].map((pos, i) => (
                    <div key={i} className={`absolute ${pos} w-2 h-2`}
                      style={{ animation: `twinkle ${1.5 + i * 0.3}s ${i * 0.2}s ease-in-out infinite` }}>
                      <svg viewBox="0 0 10 10" fill="#f59e0b">
                        <path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs italic max-w-xs leading-relaxed mb-5 text-amber-800/70"
                style={{ animation: 'fadeIn 1s 0.6s ease forwards', opacity: 0 }}>
                {d.quranVerse || 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا (QS. Ar-Rum: 21)'}
              </p>
              <h1 className="text-4xl font-light shimmer-gold"
                style={{ animation: 'nameReveal 0.9s 0.8s ease forwards', opacity: 0 }}>{d.groomName}</h1>
              <div className="flex items-center gap-4 my-2.5" style={{ animation: 'fadeIn 0.6s 1.1s ease forwards', opacity: 0 }}>
                <div className="h-px w-10 bg-amber-300/70" />
                <span className="text-2xl shimmer-gold">&amp;</span>
                <div className="h-px w-10 bg-amber-300/70" />
              </div>
              <h1 className="text-4xl font-light shimmer-gold"
                style={{ animation: 'nameReveal 0.9s 1.2s ease forwards', opacity: 0 }}>{d.brideName}</h1>
              {d.resepsiDate && (
                <p className="text-xs text-amber-700/60 mt-4 tracking-widest uppercase"
                  style={{ animation: 'fadeIn 0.8s 1.5s ease forwards', opacity: 0 }}>
                  {fmt(d.resepsiDate, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <div className="mt-4 mb-6" style={{ animation: 'fadeIn 0.8s 1.5s ease forwards', opacity: 0 }}>
                <SectionOrnament themeId="klasik" ornamentColor="#f59e0b" />
              </div>
              <button onClick={openInvitation}
                className="px-8 py-3 rounded-full text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 shadow-xl transition-all hover:scale-105 active:scale-95"
                style={{ animation: `fadeIn 0.8s 1.7s ease forwards, ${glowAnim}`, opacity: 0, animationFillMode: 'forwards' }}>
                ✉ Buka Undangan
              </button>
              <p className="text-[10px] text-amber-400/60 mt-3"
                style={{ animation: 'fadeIn 0.8s 1.9s ease forwards', opacity: 0 }}>
                Sentuh untuk membuka
              </p>
            </div>
          </>
        )}
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

              {/* ── Add to Calendar ── */}
              <div className="flex gap-2 mt-3 flex-wrap">
                <a
                  href={buildGoogleCalUrl(calTitle, d.resepsiDate, d.resepsiTime, calLocation, calDescription)}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 border rounded-full text-xs transition-colors ${t.accentBtn}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Google Calendar
                </a>
                <button
                  onClick={() => downloadIcs(calTitle, d.resepsiDate, d.resepsiTime, calLocation, calDescription)}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 border rounded-full text-xs transition-colors ${t.accentBtn}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Simpan (.ics)
                </button>
              </div>
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

        {/* ── Our Story ────────────────────────── */}
        {d.story && d.story.length > 0 && (
          <RevealSection className="py-14 px-6">
            <div className="max-w-sm mx-auto">
              <SectionTitleComp label="Kisah Kami" t={t} />
              <div className="relative">
                {/* Garis vertikal tengah */}
                <div className={`absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 ${t.dividerColor}`} />
                <div className="space-y-8">
                  {(d.story as StoryMilestone[]).map((item, i) => {
                    const isLeft = i % 2 === 0
                    return (
                      <div key={i} className={`flex items-start gap-4 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
                        style={{ animation: `slideUp 0.6s ${i * 0.15}s ease both` }}>
                        <div className="flex-1 text-right" style={{ visibility: isLeft ? 'visible' : 'hidden' }}>
                          {isLeft && (
                            <div className={`inline-block rounded-2xl p-4 tilt-card ${t.cardBg}`}>
                              <p className={`text-[10px] font-semibold tracking-widest ${t.accentText} mb-1`}>{item.year}</p>
                              <p className="text-sm font-medium text-stone-700 mb-1">{item.title}</p>
                              <p className="text-xs text-stone-400 leading-relaxed">{item.description}</p>
                            </div>
                          )}
                        </div>
                        {/* Dot tengah */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md`}
                            style={{ background: t.ornamentColor ?? '#6366f1' }} />
                        </div>
                        <div className="flex-1" style={{ visibility: isLeft ? 'hidden' : 'visible' }}>
                          {!isLeft && (
                            <div className={`inline-block rounded-2xl p-4 tilt-card ${t.cardBg}`}>
                              <p className={`text-[10px] font-semibold tracking-widest ${t.accentText} mb-1`}>{item.year}</p>
                              <p className="text-sm font-medium text-stone-700 mb-1">{item.title}</p>
                              <p className="text-xs text-stone-400 leading-relaxed">{item.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </RevealSection>
        )}

        {/* ── Angpao Digital ───────────────────── */}
        {((d.bankAccounts && d.bankAccounts.length > 0) || d.qrisUrl) && (
          <RevealSection className={`py-14 px-6 ${t.sectionBg}`}>
            <div className="max-w-sm mx-auto">
              <SectionTitleComp label="Hadiah Pernikahan" t={t} />
              <p className="text-xs text-stone-400 text-center mb-6 leading-relaxed">
                Doa restu Anda adalah hadiah terbaik bagi kami. Jika ingin memberikan hadiah, berikut informasinya.
              </p>
              <div className="space-y-3">
                {(d.bankAccounts as BankAccount[] | undefined)?.map((acc, i) => (
                  <div key={i} className={`rounded-2xl p-4 tilt-card ${t.cardBg}`}
                    style={{ animation: `slideUp 0.5s ${i * 0.1}s ease both` }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-[10px] font-semibold tracking-widest uppercase ${t.accentText} mb-1`}>{acc.bank}</p>
                        <p className="text-lg font-light text-stone-700 tracking-widest">{acc.accountNumber}</p>
                        <p className="text-xs text-stone-400 mt-0.5">a.n. {acc.accountName}</p>
                      </div>
                      <button
                        onClick={() => copy(acc.accountNumber, `bank-${i}`)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${t.accentBtn} ${copied === `bank-${i}` ? 'scale-95' : 'hover:scale-105'}`}
                      >
                        {copied === `bank-${i}` ? '✓ Disalin' : 'Salin'}
                      </button>
                    </div>
                  </div>
                ))}
                {d.qrisUrl && (
                  <div className={`rounded-2xl p-5 text-center ${t.cardBg}`}>
                    <p className={`text-[10px] font-semibold tracking-widest uppercase ${t.accentText} mb-3`}>QRIS</p>
                    <img src={d.qrisUrl} alt="QRIS" className="w-40 h-40 object-contain mx-auto rounded-xl" />
                    <p className="text-xs text-stone-400 mt-2">Scan untuk transfer</p>
                  </div>
                )}
              </div>
            </div>
          </RevealSection>
        )}

        {/* ── Live Streaming ───────────────────── */}
        {d.liveStreamUrl && (
          <RevealSection className="py-10 px-6">
            <div className="max-w-sm mx-auto">
              <div className={`rounded-2xl p-5 text-center ${t.cardBg}`}>
                <div className="flex justify-center mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.submitBtn}`}>
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <p className={`text-sm font-medium ${themeId === 'klasik' ? 'text-amber-900' : 'text-stone-700'} mb-1`}>
                  Saksikan Secara Online
                </p>
                <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                  Tidak bisa hadir? Ikuti momen bahagia kami secara langsung melalui live streaming.
                </p>
                <a
                  href={d.liveStreamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${t.submitBtn}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Tonton Live Stream
                </a>
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
