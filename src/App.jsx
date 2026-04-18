import React, { useState, useCallback, useRef, useEffect } from 'react'
import PermissionsManager from './components/PermissionsManager.jsx'
import AnimatedVoiceCircle from './components/AnimatedVoiceCircle.jsx'
import ObstacleHandler from './components/ObstacleHandler.jsx'
import NavigationController from './components/NavigationController.jsx'
import MemoryManager from './components/MemoryManager.jsx'
import { useVoice } from './hooks/useVoice.js'
import { useCamera } from './hooks/useCamera.js'
import { sendVQA, storeMemory, queryMemory, getAllMemories } from './services/api.js'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const INITIAL_ACTIVITIES = [
  { id: 1, label: 'Went to Shop', time: '12:00 AM' },
  { id: 2, label: 'Crossed road', time: 'MON, 5:00 AM' },
  { id: 3, label: 'Went to coffee shop', time: 'TUE, 8:00 AM' },
  { id: 4, label: 'Went for walking', time: 'SUN, 12:00 AM' },
]

export default function App() {
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [orbState, setOrbState] = useState('idle')
  const [activePanel, setActivePanel] = useState(null)
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES)
  const [transcript, setTranscript] = useState('')
  const [showCamera, setShowCamera] = useState(false)

  const { isListening, isSpeaking, speak, speakUrgent, startListening, stopListening } = useVoice()
  const { stream, requestCamera, captureFrame, attachToVideo } = useCamera()
  const videoRef = useRef(null)

  useEffect(() => {
    if (isListening) setOrbState('listening')
    else if (isSpeaking) setOrbState('speaking')
    else if (orbState === 'listening' || orbState === 'speaking') setOrbState('idle')
  }, [isListening, isSpeaking])

  useEffect(() => {
    if (videoRef.current && stream) attachToVideo(videoRef.current)
  }, [stream, attachToVideo])

  function addActivity(label) {
    const day = DAYS[new Date().getDay()]
    const now = new Date()
    const h = now.getHours() % 12 || 12
    const m = String(now.getMinutes()).padStart(2, '0')
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM'
    setActivities(prev => [{ id: Date.now(), label, time: `${day}, ${h}:${m} ${ampm}` }, ...prev].slice(0, 8))
  }

  async function processVoiceCommand(text) {
    setTranscript(text)
    const lower = text.toLowerCase()

    if (/\b(stop|cancel|quiet)\b/.test(lower)) { setOrbState('idle'); return }

    if (/\b(navigate|go to|take me to|directions)\b/.test(lower)) {
      addActivity('Used navigation')
      setActivePanel('nav')
      return
    }

    if (/\b(remember|store|save)\b/.test(lower)) {
      const mem = lower.replace(/\b(remember|store|save)\b/i, '').trim()
      if (mem) {
        setOrbState('processing')
        await storeMemory({ text: mem, timestamp: Date.now() })
        setOrbState('speaking')
        await speak('Got it. Memory saved.')
        setOrbState('idle')
        addActivity('Stored memory')
      } else { setActivePanel('memory') }
      return
    }

    if (/\b(where|find|recall)\b/.test(lower)) {
      setOrbState('processing')
      const res = await queryMemory(text)
      setOrbState('speaking')
      await speak(res?.data?.result || "I don't have that stored.")
      setOrbState('idle')
      return
    }

    if (/\b(help|what can you do)\b/.test(lower)) {
      setOrbState('speaking')
      await speak('I can detect obstacles, describe your surroundings, navigate to destinations, and store memories. Just tap and speak!')
      setOrbState('idle')
      return
    }

    const frame = captureFrame()
    setOrbState('processing')
    addActivity('Asked about surroundings')
    const res = await sendVQA(frame || '', text)
    setOrbState('speaking')
    await speak(res?.data?.answer || 'I could not analyze the scene right now.')
    setOrbState('idle')
  }

  function handleOrbClick() {
    if (isListening) { stopListening(); setOrbState('idle') }
    else {
      setOrbState('listening')
      startListening((text) => processVoiceCommand(text))
    }
  }

  function handlePermissionsGranted(perms) {
    setPermissionsGranted(true)
    if (perms.cameraOk) requestCamera()
    setTimeout(() => speak('Welcome to SeeWithMe. Tap the circle to speak, or say help for commands.'), 600)
  }

  if (!permissionsGranted) return <PermissionsManager onGranted={handlePermissionsGranted} />

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a1f1f 0%, #0d2b2b 50%, #0a2020 100%)' }}>

      {stream && showCamera && (
        <div className="absolute inset-0 z-0">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(10,31,31,.85) 0%,rgba(10,31,31,.5) 50%,rgba(10,31,31,.85) 100%)' }} />
        </div>
      )}

      <ObstacleHandler
        captureFrame={captureFrame}
        speakUrgent={speakUrgent}
        active={!!stream}
        onObstacleDetected={() => addActivity('Detected obstacle')}
      />

      {/* HEADER */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(45,212,191,0.12)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(13,148,136,0.3)', border: '1.5px solid #2dd4bf' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="#2dd4bf" strokeWidth="2.5">
              <circle cx="12" cy="12" r="4" /><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold" style={{ color: '#e0f7f4' }}>SeeWithMe</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-px h-5" style={{ background: 'rgba(45,212,191,0.2)' }} />
          <button onClick={() => setShowCamera(c => !c)}
            className="p-2 rounded-full transition-all active:scale-90"
            style={{ background: showCamera ? 'rgba(13,148,136,0.3)' : 'transparent', color: '#7ecfc8' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          </button>
          <div className="w-px h-5" style={{ background: 'rgba(45,212,191,0.2)' }} />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#0d9488,#2dd4bf)', color: '#0a1f1f' }}>MJ</div>
            <span className="text-sm font-medium hidden sm:block" style={{ color: '#e0f7f4' }}>Muhammad Jamil</span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="relative z-10 flex flex-1 overflow-hidden">
        {/* Left - Activities */}
        <aside className="w-40 md:w-52 flex-shrink-0 p-4 flex flex-col gap-3 overflow-y-auto">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7ecfc8' }}>Activities</h2>
          <div className="flex flex-col gap-2">
            {activities.slice(0, 6).map((act, i) => (
              <div key={act.id} className="activity-item px-3 py-2 rounded-xl"
                style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(45,212,191,0.18)', animationDelay: `${i * 0.05}s` }}>
                <p className="text-xs font-medium leading-tight" style={{ color: '#e0f7f4' }}>{act.label}</p>
                <p style={{ color: '#7ecfc8', fontSize: '10px' }} className="mt-0.5">{act.time}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* Center */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-2">
          {transcript && (
            <div className="px-4 py-2 rounded-full text-xs max-w-[200px] text-center truncate"
              style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(45,212,191,0.2)', color: '#7ecfc8' }}>
              "{transcript}"
            </div>
          )}
          <AnimatedVoiceCircle state={orbState} onClick={handleOrbClick} />
          <button onClick={handleOrbClick}
            className="mt-1 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: isListening ? 'linear-gradient(135deg,#0d9488,#2dd4bf)' : 'rgba(13,148,136,0.25)',
              border: '1.5px solid rgba(45,212,191,0.4)',
              boxShadow: isListening ? '0 0 20px rgba(0,229,255,0.4)' : 'none',
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={isListening ? '#0a1f1f' : '#2dd4bf'} strokeWidth="2" className="w-5 h-5">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </div>

        {/* Right - Settings */}
        <aside className="w-28 md:w-36 flex-shrink-0 p-4 flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7ecfc8' }}>Settings</h2>
          <div className="flex flex-col gap-3">
            {[
              { id: 'profile', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#7ecfc8" strokeWidth="1.5" className="w-7 h-7"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: 'USER PROFILE' },
              { id: 'nav', icon: <span className="text-2xl">🧭</span>, label: 'NAVIGATE' },
              { id: 'memory', icon: <span className="text-2xl">🧠</span>, label: 'MEMORY' },
            ].map(item => (
              <button key={item.id} onClick={() => setActivePanel(p => p === item.id ? null : item.id)}
                className="settings-item aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
                style={{
                  background: activePanel === item.id ? 'rgba(13,148,136,0.35)' : 'rgba(13,148,136,0.15)',
                  border: '1px solid rgba(45,212,191,0.2)',
                }}>
                {item.icon}
                <span style={{ color: '#7ecfc8', fontSize: '8px' }} className="uppercase tracking-wide font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </aside>
      </main>

      {/* BOTTOM NAV */}
      <nav className="relative z-10 flex justify-center pb-6 pt-2">
        <div className="nav-pill flex items-center gap-1 px-4 py-3 rounded-2xl">
          {[
            { label: 'Home', action: () => setActivePanel(null), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
            { label: 'Profile', action: () => setActivePanel(p => p === 'profile' ? null : 'profile'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
            { label: 'Logout', action: () => setPermissionsGranted(false), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              className="w-12 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90"
              style={{ color: '#7ecfc8' }} aria-label={item.label}>
              {item.icon}
            </button>
          ))}
        </div>
      </nav>

      {/* SLIDE-UP PANEL */}
      {activePanel && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end"
          onClick={e => e.target === e.currentTarget && setActivePanel(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
          <div className="relative rounded-t-3xl overflow-hidden flex flex-col"
            style={{ background: 'linear-gradient(180deg,#0f3333 0%,#0a1f1f 100%)', border: '1px solid rgba(45,212,191,0.2)', maxHeight: '75vh', minHeight: '50vh', animation: 'slideUp 0.3s ease-out' }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(45,212,191,0.3)' }} />
            </div>
            <div className="flex-1 overflow-y-auto">
              {activePanel === 'nav' && <NavigationController speak={speak} onClose={() => setActivePanel(null)} />}
              {activePanel === 'memory' && <MemoryManager speak={speak} onClose={() => setActivePanel(null)} />}
              {activePanel === 'profile' && (
                <div className="p-6 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
                    style={{ background: 'linear-gradient(135deg,#0d9488,#2dd4bf)', color: '#0a1f1f' }}>MJ</div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold" style={{ color: '#e0f7f4' }}>Muhammad Jamil</h3>
                    <p className="text-sm" style={{ color: '#7ecfc8' }}>SeeWithMe User</p>
                  </div>
                  <div className="w-full space-y-3">
                    {[
                      { label: 'Activities logged', value: activities.length },
                      { label: 'Memories stored', value: getAllMemories().length },
                      { label: 'Camera', value: stream ? 'Active' : 'Inactive' },
                      { label: 'Voice', value: 'Enabled' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center p-3 rounded-xl"
                        style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(45,212,191,0.15)' }}>
                        <span className="text-sm" style={{ color: '#7ecfc8' }}>{item.label}</span>
                        <span className="text-sm font-medium" style={{ color: '#2dd4bf' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActivePanel(null)}
                    className="w-full py-3 rounded-xl font-medium transition-all active:scale-95"
                    style={{ background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(45,212,191,0.2)', color: '#2dd4bf' }}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
