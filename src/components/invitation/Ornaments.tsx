import type { ThemeId } from '../../types/database'

export function FloralOrnament({ color }: { color: string }) {
  return (
    <svg className="w-24 h-8 opacity-40" viewBox="0 0 120 30" fill={color}>
      <path d="M60 15 C48 3 24 3 10 15 C24 27 48 27 60 15Z" />
      <path d="M60 15 C72 3 96 3 110 15 C96 27 72 27 60 15Z" />
      <circle cx="60" cy="15" r="4" fill={color} />
      <circle cx="60" cy="15" r="2" fill="white" fillOpacity="0.6" />
      <circle cx="28" cy="15" r="2" fill={color} fillOpacity="0.4" />
      <circle cx="92" cy="15" r="2" fill={color} fillOpacity="0.4" />
    </svg>
  )
}

export function KlasikOrnament({ color }: { color: string }) {
  return (
    <svg className="w-32 h-8 opacity-50" viewBox="0 0 160 30" fill="none" stroke={color} strokeWidth="1.2">
      <path d="M5 15 L22 5 L28 15 L22 25 L5 15Z" />
      <path d="M155 15 L138 5 L132 15 L138 25 L155 15Z" />
      <line x1="31" y1="15" x2="62" y2="15" />
      <line x1="98" y1="15" x2="129" y2="15" />
      <circle cx="80" cy="15" r="8" fill={color} fillOpacity="0.08" />
      <circle cx="80" cy="15" r="5" fill={color} fillOpacity="0.15" />
      <circle cx="80" cy="15" r="2.5" fill={color} fillOpacity="0.5" />
      <line x1="62" y1="15" x2="72" y2="15" />
      <line x1="88" y1="15" x2="98" y2="15" />
      <circle cx="72" cy="15" r="1.5" fill={color} />
      <circle cx="88" cy="15" r="1.5" fill={color} />
    </svg>
  )
}

export function ModernOrnament() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-px bg-indigo-300/60" />
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-300/60" />
      <div className="w-2.5 h-2.5 rotate-45 border border-indigo-300/60" />
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-300/60" />
      <div className="w-8 h-px bg-indigo-300/60" />
    </div>
  )
}

export function SectionOrnament({ themeId, ornamentColor }: { themeId: ThemeId; ornamentColor: string | null }) {
  if (themeId === 'floral' && ornamentColor) return <FloralOrnament color={ornamentColor} />
  if (themeId === 'klasik' && ornamentColor) return <KlasikOrnament color={ornamentColor} />
  if (themeId === 'modern') return <ModernOrnament />
  return null
}
