import type { ThemeId } from '../../types/database'

export type ThemeCfg = {
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
  particleColor: string
  glowColor: string
  shimmer: boolean
}

export const THEMES: Record<ThemeId, ThemeCfg> = {
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
    particleColor: 'bg-rose-300',
    glowColor:    'shadow-rose-300/60',
    shimmer:      false,
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
    particleColor: 'bg-indigo-300',
    glowColor:    'shadow-indigo-300/40',
    shimmer:      false,
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
    particleColor: 'bg-amber-300',
    glowColor:    'shadow-amber-300/60',
    shimmer:      true,
  },
}
