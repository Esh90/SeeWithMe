import React, { useEffect, useRef, useState } from 'react'

const STATES = {
  idle: 'idle',
  listening: 'listening',
  processing: 'processing',
  speaking: 'speaking',
}

export default function AnimatedVoiceCircle({ state = 'idle', onClick, disabled }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const timeRef = useRef(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2
    const R = W * 0.38

    function drawFrame(t) {
      ctx.clearRect(0, 0, W, H)

      // --- Outer glow rings ---
      if (state === 'listening' || state === 'speaking') {
        for (let i = 3; i >= 1; i--) {
          const progress = ((t / 1200 + i * 0.33) % 1)
          const ringR = R * (1 + progress * 0.6)
          const alpha = (1 - progress) * 0.15
          ctx.beginPath()
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      }

      // --- Sphere base gradient ---
      const baseGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.05, cx, cy, R)
      if (state === 'idle') {
        baseGrad.addColorStop(0, 'rgba(45, 212, 191, 0.15)')
        baseGrad.addColorStop(0.5, 'rgba(13, 148, 136, 0.08)')
        baseGrad.addColorStop(1, 'rgba(0, 229, 255, 0.04)')
      } else if (state === 'listening') {
        baseGrad.addColorStop(0, 'rgba(0, 229, 255, 0.25)')
        baseGrad.addColorStop(0.5, 'rgba(13, 148, 136, 0.15)')
        baseGrad.addColorStop(1, 'rgba(0, 100, 150, 0.05)')
      } else if (state === 'speaking') {
        baseGrad.addColorStop(0, 'rgba(45, 212, 191, 0.35)')
        baseGrad.addColorStop(0.4, 'rgba(0, 229, 255, 0.2)')
        baseGrad.addColorStop(1, 'rgba(13, 80, 100, 0.08)')
      } else {
        baseGrad.addColorStop(0, 'rgba(100, 150, 200, 0.2)')
        baseGrad.addColorStop(1, 'rgba(30, 80, 120, 0.05)')
      }

      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = baseGrad
      ctx.fill()

      // --- Sphere border ---
      const borderGrad = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R)
      borderGrad.addColorStop(0, 'rgba(0, 229, 255, 0.8)')
      borderGrad.addColorStop(0.5, 'rgba(45, 212, 191, 0.4)')
      borderGrad.addColorStop(1, 'rgba(13, 148, 136, 0.6)')
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = borderGrad
      ctx.lineWidth = 1.5
      ctx.stroke()

      // --- Clipping mask for inner content ---
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R - 2, 0, Math.PI * 2)
      ctx.clip()

      if (state === 'idle') {
        drawIdleWave(ctx, cx, cy, R, t)
      } else if (state === 'listening') {
        drawListeningWave(ctx, cx, cy, R, t)
      } else if (state === 'processing') {
        drawProcessing(ctx, cx, cy, R, t)
      } else if (state === 'speaking') {
        drawSpeakingWave(ctx, cx, cy, R, t)
      }

      ctx.restore()

      // --- Highlight gloss ---
      const glossGrad = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.35, 0, cx - R * 0.1, cy - R * 0.2, R * 0.5)
      glossGrad.addColorStop(0, 'rgba(255,255,255,0.08)')
      glossGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = glossGrad
      ctx.fill()
    }

    function drawIdleWave(ctx, cx, cy, R, t) {
      const speed = t * 0.001
      for (let i = 0; i < 2; i++) {
        ctx.beginPath()
        ctx.moveTo(cx - R, cy + (i === 0 ? -10 : 10))
        for (let x = -R; x <= R; x += 3) {
          const y = Math.sin(x * 0.02 + speed + i * 2) * 15 +
                    Math.sin(x * 0.04 + speed * 1.3 + i) * 8
          ctx.lineTo(cx + x, cy + y + (i === 0 ? -10 : 10))
        }
        const alpha = i === 0 ? 0.4 : 0.25
        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    function drawListeningWave(ctx, cx, cy, R, t) {
      const speed = t * 0.003
      const numLines = 4
      for (let i = 0; i < numLines; i++) {
        ctx.beginPath()
        const yOffset = (i - numLines / 2 + 0.5) * 14
        ctx.moveTo(cx - R, cy + yOffset)
        for (let x = -R; x <= R; x += 2) {
          const amp = 20 + 10 * Math.sin(t * 0.002 + i)
          const y = Math.sin(x * 0.025 + speed + i * 1.2) * amp +
                    Math.sin(x * 0.05 + speed * 0.7) * (amp * 0.4)
          ctx.lineTo(cx + x, cy + yOffset + y)
        }
        const alpha = 0.2 + (i / numLines) * 0.4
        ctx.strokeStyle = i % 2 === 0
          ? `rgba(0, 229, 255, ${alpha})`
          : `rgba(180, 80, 220, ${alpha})`
        ctx.lineWidth = 1.2
        ctx.stroke()
      }
    }

    function drawSpeakingWave(ctx, cx, cy, R, t) {
      const speed = t * 0.004
      const numLines = 5
      for (let i = 0; i < numLines; i++) {
        ctx.beginPath()
        const yOffset = (i - numLines / 2 + 0.5) * 12
        ctx.moveTo(cx - R, cy + yOffset)
        for (let x = -R; x <= R; x += 2) {
          const envelope = 1 - Math.pow(x / R, 2) * 0.3
          const amp = (25 + 15 * Math.sin(t * 0.003 + i * 0.8)) * envelope
          const y = Math.sin(x * 0.03 + speed + i * 0.9) * amp +
                    Math.sin(x * 0.06 - speed * 0.5) * (amp * 0.3)
          ctx.lineTo(cx + x, cy + yOffset + y)
        }
        const alpha = 0.25 + (i / numLines) * 0.5
        const hue = 180 + i * 15
        ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${alpha})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    function drawProcessing(ctx, cx, cy, R, t) {
      const angle = (t * 0.003) % (Math.PI * 2)
      const numDots = 12
      for (let i = 0; i < numDots; i++) {
        const a = angle + (i / numDots) * Math.PI * 2
        const dist = R * 0.55
        const x = cx + Math.cos(a) * dist
        const y = cy + Math.sin(a) * dist
        const alpha = 0.15 + (i / numDots) * 0.6
        const size = 2 + (i / numDots) * 3
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`
        ctx.fill()
      }

      // Inner glow
      const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.4)
      innerGrad.addColorStop(0, `rgba(0, 229, 255, ${0.1 + 0.05 * Math.sin(t * 0.005)})`)
      innerGrad.addColorStop(1, 'rgba(0, 229, 255, 0)')
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.4, 0, Math.PI * 2)
      ctx.fillStyle = innerGrad
      ctx.fill()
    }

    function loop(ts) {
      timeRef.current = ts
      drawFrame(ts)
      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [state])

  const stateLabel = {
    idle: 'Tap to speak',
    listening: 'Listening...',
    processing: 'Processing...',
    speaking: 'Speaking...',
  }[state] || 'Tap to speak'

  return (
    <div
      className={`flex flex-col items-center gap-4 transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      role="button"
      aria-label={stateLabel}
      aria-pressed={state === 'listening'}
    >
      <div
        className="relative cursor-pointer select-none"
        onClick={!disabled ? onClick : undefined}
        style={{ filter: state === 'idle' ? 'drop-shadow(0 0 24px rgba(0,229,255,0.25))' : 'drop-shadow(0 0 40px rgba(0,229,255,0.45))' }}
      >
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="block"
          style={{ maxWidth: '100%' }}
        />
      </div>

      <p
        className="text-xl font-medium tracking-wide"
        style={{ color: '#7ecfc8', letterSpacing: '0.08em' }}
      >
        {stateLabel}
      </p>
    </div>
  )
}
