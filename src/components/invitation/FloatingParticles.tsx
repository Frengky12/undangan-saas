import { useMemo } from 'react'
import type { ThemeId } from '../../types/database'

type Particle = { id: number; x: number; size: number; delay: number; duration: number; opacity: number; rotation: number }

function randomParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 6 + Math.random() * 10,
    delay: Math.random() * 8,
    duration: 8 + Math.random() * 10,
    opacity: 0.2 + Math.random() * 0.4,
    rotation: Math.random() * 360,
  }))
}

function FloralPetal({ p }: { p: Particle }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${p.x}%`,
        top: '-40px',
        width: p.size,
        height: p.size,
        opacity: p.opacity,
        animation: `floatDown ${p.duration}s ${p.delay}s infinite linear`,
        transform: `rotate(${p.rotation}deg)`,
      }}
    >
      <svg viewBox="0 0 24 24" fill="#f43f5e">
        <ellipse cx="12" cy="7" rx="5" ry="8" />
        <ellipse cx="12" cy="17" rx="5" ry="8" transform="rotate(180 12 12)" />
      </svg>
    </div>
  )
}

function StarParticle({ p }: { p: Particle }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${p.x}%`,
        top: '-20px',
        width: p.size * 0.6,
        height: p.size * 0.6,
        opacity: p.opacity,
        animation: `floatDown ${p.duration}s ${p.delay}s infinite linear, twinkle 2s ${p.delay}s infinite ease-in-out`,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #fcd34d 0%, #f59e0b 60%, transparent 100%)',
        boxShadow: '0 0 6px 2px rgba(245,158,11,0.4)',
      }}
    />
  )
}

function GeoDot({ p }: { p: Particle }) {
  const shapes = ['rounded-full', 'rotate-45']
  const isCircle = p.id % 2 === 0
  return (
    <div
      className={`absolute pointer-events-none bg-indigo-400 ${shapes[p.id % 2]}`}
      style={{
        left: `${p.x}%`,
        top: '-20px',
        width: p.size * 0.5,
        height: p.size * 0.5,
        opacity: p.opacity * 0.6,
        animation: `floatDown ${p.duration}s ${p.delay}s infinite linear`,
        transform: isCircle ? undefined : `rotate(45deg)`,
      }}
    />
  )
}

export function FloatingParticles({ themeId }: { themeId: ThemeId }) {
  const particles = useMemo(() => randomParticles(18), [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => {
        if (themeId === 'floral') return <FloralPetal key={p.id} p={p} />
        if (themeId === 'klasik') return <StarParticle key={p.id} p={p} />
        return <GeoDot key={p.id} p={p} />
      })}
    </div>
  )
}
