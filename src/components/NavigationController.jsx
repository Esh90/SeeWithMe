import React, { useState } from 'react'
import { getNavigation } from '../services/api.js'

export default function NavigationController({ speak, onClose }) {
  const [destination, setDestination] = useState('')
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  async function handleNavigate() {
    if (!destination.trim()) return
    setLoading(true)
    try {
      const result = await getNavigation(destination)
      if (result?.data) {
        setRoute(result.data)
        setCurrentStep(0)
        const intro = `Starting navigation to ${destination}. ${result.data.steps[0]?.instruction}. Distance: ${result.data.steps[0]?.distance}.`
        speak(intro)
      }
    } finally {
      setLoading(false)
    }
  }

  function nextStep() {
    if (!route) return
    const next = currentStep + 1
    if (next < route.steps.length) {
      setCurrentStep(next)
      speak(route.steps[next].instruction + '. Distance: ' + route.steps[next].distance)
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      const prev = currentStep - 1
      setCurrentStep(prev)
      speak(route.steps[prev].instruction)
    }
  }

  function endNavigation() {
    setRoute(null)
    setDestination('')
    setCurrentStep(0)
    speak('Navigation ended.')
    onClose?.()
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(13,148,136,0.3)', border: '1px solid #2dd4bf' }}>
          <span className="text-sm">🧭</span>
        </div>
        <h2 className="text-lg font-semibold" style={{ color: '#e0f7f4' }}>Navigation</h2>
        <button className="ml-auto text-teal-400 text-sm" onClick={onClose}>✕ Close</button>
      </div>

      {!route ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: '#7ecfc8' }}>Enter your destination:</p>
          <input
            type="text"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNavigate()}
            placeholder="Where do you want to go?"
            className="w-full p-4 rounded-xl text-base outline-none"
            style={{
              background: 'rgba(13,148,136,0.1)',
              border: '1px solid rgba(45,212,191,0.3)',
              color: '#e0f7f4',
            }}
          />
          <button
            onClick={handleNavigate}
            disabled={loading || !destination.trim()}
            className="w-full py-4 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', color: '#0a1f1f' }}
          >
            {loading ? 'Finding route...' : 'Start Navigation'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1">
          {/* Destination */}
          <div className="p-3 rounded-xl" style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(45,212,191,0.2)' }}>
            <p className="text-xs mb-1" style={{ color: '#7ecfc8' }}>Navigating to</p>
            <p className="font-semibold" style={{ color: '#e0f7f4' }}>{route.destination}</p>
            <p className="text-xs mt-1" style={{ color: '#7ecfc8' }}>
              {route.totalDistance} · ~{route.totalDuration}
            </p>
          </div>

          {/* Step progress */}
          <div className="flex gap-1">
            {route.steps.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all"
                style={{ background: i <= currentStep ? '#2dd4bf' : 'rgba(45,212,191,0.2)' }} />
            ))}
          </div>

          {/* Current step */}
          <div className="flex-1 p-4 rounded-xl" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)' }}>
            <p className="text-xs mb-2" style={{ color: '#7ecfc8' }}>Step {currentStep + 1} of {route.steps.length}</p>
            <p className="text-lg font-medium leading-snug mb-3" style={{ color: '#e0f7f4' }}>
              {route.steps[currentStep].instruction}
            </p>
            <p className="text-sm" style={{ color: '#7ecfc8' }}>
              {route.steps[currentStep].distance} · {route.steps[currentStep].duration}
            </p>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1 py-3 rounded-xl font-medium disabled:opacity-40 transition-all active:scale-95"
              style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(45,212,191,0.2)', color: '#2dd4bf' }}
            >
              ← Prev
            </button>
            <button
              onClick={() => speak(route.steps[currentStep].instruction)}
              className="px-4 py-3 rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(45,212,191,0.2)', color: '#2dd4bf' }}
              aria-label="Repeat instruction"
            >
              🔊
            </button>
            {currentStep < route.steps.length - 1 ? (
              <button
                onClick={nextStep}
                className="flex-1 py-3 rounded-xl font-medium transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', color: '#0a1f1f' }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={endNavigation}
                className="flex-1 py-3 rounded-xl font-medium transition-all active:scale-95"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5' }}
              >
                End
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
