import { useEffect, useMemo, useRef } from 'react'
import type { ThemeId } from '../../types/database'

const THEME_COLORS: Record<ThemeId, string[]> = {
  floral:  ['#f43f5e', '#fb7185', '#fda4af', '#fce7f3', '#ffffff', '#f9a8d4'],
  modern:  ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#ffffff', '#e0e7ff'],
  klasik:  ['#f59e0b', '#fcd34d', '#fde68a', '#ffffff', '#d97706', '#92400e'],
}

type Piece = {
  id: number
  x: number
  color: string
  size: number
  delay: number
  duration: number
  rotation: number
  shape: 'rect' | 'circle' | 'ribbon'
  swayAmp: number
}

export function Confetti({ themeId, active }: { themeId: ThemeId; active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const colors = THEME_COLORS[themeId] ?? THEME_COLORS.floral

  const pieces = useMemo<Piece[]>(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2,
      rotation: Math.random() * 720,
      shape: (['rect', 'circle', 'ribbon'] as const)[Math.floor(Math.random() * 3)],
      swayAmp: 30 + Math.random() * 60,
    }))
  , []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[60] overflow-hidden"
    >
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-20px',
            width: p.shape === 'ribbon' ? p.size * 0.4 : p.size,
            height: p.shape === 'ribbon' ? p.size * 2.5 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'ribbon' ? '2px' : '2px',
            opacity: 0.9,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
            '--sway': `${p.swayAmp}px`,
            '--rot': `${p.rotation}deg`,
          } as React.CSSProperties}
        />
      ))}

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          25%  { transform: translateY(25vh) translateX(var(--sway)) rotate(calc(var(--rot) * 0.3)); }
          50%  { transform: translateY(50vh) translateX(0) rotate(calc(var(--rot) * 0.6)); }
          75%  { transform: translateY(75vh) translateX(calc(var(--sway) * -0.5)) rotate(calc(var(--rot) * 0.8)); }
          100% { transform: translateY(105vh) translateX(0) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
