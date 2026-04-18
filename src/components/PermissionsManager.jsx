import React, { useState } from 'react'

export default function PermissionsManager({ onGranted }) {
  const [step, setStep] = useState('intro') // intro | requesting | denied | granted
  const [cameraOk, setCameraOk] = useState(false)
  const [micOk, setMicOk] = useState(false)
  const [error, setError] = useState('')

  async function requestPermissions() {
    setStep('requesting')
    setError('')

    try {
      // Request camera
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      camStream.getTracks().forEach(t => t.stop())
      setCameraOk(true)
    } catch (e) {
      console.warn('Camera denied:', e)
    }

    try {
      // Request microphone
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStream.getTracks().forEach(t => t.stop())
      setMicOk(true)
    } catch (e) {
      console.warn('Mic denied:', e)
    }

    setStep('done')
  }

  function handleContinue() {
    onGranted({ cameraOk, micOk })
  }

  if (step === 'intro') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-8 z-50"
        style={{ background: 'linear-gradient(135deg, #0a1f1f 0%, #0f3333 100%)' }}>

        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-60 animate-ping" />
            <div className="relative w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(13,148,136,0.3)', border: '2px solid #2dd4bf' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="#2dd4bf" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#e0f7f4' }}>SeeWithMe</h1>
            <p className="text-sm" style={{ color: '#7ecfc8' }}>AI Vision Assistant</p>
          </div>
        </div>

        <div className="text-center mb-10 max-w-xs">
          <p className="text-lg mb-3" style={{ color: '#e0f7f4' }}>
            Your intelligent eyes and voice companion
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#7ecfc8' }}>
            SeeWithMe needs access to your camera and microphone to detect obstacles, answer questions about your surroundings, and guide you safely.
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3 mb-10">
          {[
            { icon: '📷', title: 'Camera', desc: 'Detect obstacles & understand surroundings' },
            { icon: '🎤', title: 'Microphone', desc: 'Voice commands & hands-free interaction' },
          ].map(item => (
            <div key={item.title} className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(45,212,191,0.2)' }}>
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-medium text-sm" style={{ color: '#e0f7f4' }}>{item.title}</p>
                <p className="text-xs" style={{ color: '#7ecfc8' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={requestPermissions}
          className="w-full max-w-xs py-4 rounded-2xl font-semibold text-lg transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', color: '#0a1f1f' }}
        >
          Allow Access
        </button>
      </div>
    )
  }

  if (step === 'requesting') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-8 z-50"
        style={{ background: '#0a1f1f' }}>
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-teal-400 animate-spin"
            style={{ borderTopColor: 'transparent' }} />
          <div className="absolute inset-2 rounded-full"
            style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(45,212,191,0.4)' }} />
        </div>
        <p className="text-xl font-medium mb-2" style={{ color: '#e0f7f4' }}>Requesting permissions...</p>
        <p className="text-sm text-center" style={{ color: '#7ecfc8' }}>
          Please allow camera and microphone access when prompted by your browser.
        </p>
      </div>
    )
  }

  // done step — show results
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-8 z-50"
      style={{ background: '#0a1f1f' }}>

      <div className="text-center mb-8">
        <div className="text-5xl mb-4">{cameraOk && micOk ? '✅' : '⚠️'}</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#e0f7f4' }}>
          {cameraOk && micOk ? 'All set!' : 'Partial access'}
        </h2>
        <p className="text-sm" style={{ color: '#7ecfc8' }}>
          {cameraOk && micOk
            ? 'Camera and microphone are ready.'
            : 'Some features may be limited without full permissions.'}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3 mb-8">
        {[
          { label: 'Camera', ok: cameraOk },
          { label: 'Microphone', ok: micOk },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(45,212,191,0.2)' }}>
            <span className="font-medium" style={{ color: '#e0f7f4' }}>{item.label}</span>
            <span className={item.ok ? 'text-teal-400' : 'text-red-400'}>
              {item.ok ? '✓ Granted' : '✗ Denied'}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={handleContinue}
        className="w-full max-w-xs py-4 rounded-2xl font-semibold text-lg transition-all active:scale-95"
        style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', color: '#0a1f1f' }}
      >
        Continue to App
      </button>
    </div>
  )
}
