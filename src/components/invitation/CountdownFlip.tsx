import { useEffect, useRef, useState } from 'react'

type FlipCardProps = { value: number; label: string; boxCls: string }

function FlipCard({ value, label, boxCls }: FlipCardProps) {
  const [displayVal, setDisplayVal] = useState(value)
  const [flipping, setFlipping] = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    if (value === prevRef.current) return
    setFlipping(true)
    const t = setTimeout(() => {
      setDisplayVal(value)
      setFlipping(false)
      prevRef.current = value
    }, 300)
    return () => clearTimeout(t)
  }, [value])

  const str = String(displayVal).padStart(2, '0')

  return (
    <div className="text-center">
      <div
        className={`relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden ${boxCls}`}
        style={{ perspective: '400px' }}
      >
        <div
          style={{
            transition: 'transform 0.3s ease, opacity 0.3s ease',
            transform: flipping ? 'rotateX(-90deg) scale(0.8)' : 'rotateX(0deg) scale(1)',
            opacity: flipping ? 0 : 1,
          }}
        >
          <span className="text-2xl font-light text-stone-700 tabular-nums">{str}</span>
        </div>
      </div>
      <p className="text-[10px] text-stone-400 mt-2 tracking-wide">{label}</p>
    </div>
  )
}

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number }

export function CountdownFlip({ timeLeft, boxCls }: { timeLeft: TimeLeft; boxCls: string }) {
  return (
    <div className="flex justify-center gap-3">
      <FlipCard value={timeLeft.days}    label="Hari"   boxCls={boxCls} />
      <FlipCard value={timeLeft.hours}   label="Jam"    boxCls={boxCls} />
      <FlipCard value={timeLeft.minutes} label="Menit"  boxCls={boxCls} />
      <FlipCard value={timeLeft.seconds} label="Detik"  boxCls={boxCls} />
    </div>
  )
}
