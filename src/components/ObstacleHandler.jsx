import React, { useEffect, useRef, useState, useCallback } from 'react'
import { detectObstacle } from '../services/api.js'

const DETECTION_INTERVAL_MS = 2500
const ALERT_DISPLAY_MS = 4000

export default function ObstacleHandler({ captureFrame, speakUrgent, active, onObstacleDetected }) {
  const [alert, setAlert] = useState(null)
  const intervalRef = useRef(null)
  const alertTimerRef = useRef(null)

  const runDetection = useCallback(async () => {
    if (!active) return
    const frame = captureFrame()
    if (!frame) return

    try {
      const result = await detectObstacle(frame)
      if (result?.data?.obstacle) {
        const msg = `STOP! Obstacle ahead. ${result.data.type || 'Object'} detected at ${result.data.distance || 'close range'}.`
        setAlert({ msg, type: result.data.type, distance: result.data.distance })
        speakUrgent(msg)
        onObstacleDetected?.(result.data)

        clearTimeout(alertTimerRef.current)
        alertTimerRef.current = setTimeout(() => setAlert(null), ALERT_DISPLAY_MS)
      }
    } catch (e) {
      console.warn('Obstacle detection error:', e)
    }
  }, [active, captureFrame, speakUrgent, onObstacleDetected])

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS)
    }
    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(alertTimerRef.current)
    }
  }, [active, runDetection])

  if (!alert) return null

  return (
    <div
      className="fixed top-20 left-4 right-4 z-50 p-4 rounded-2xl obstacle-alert animate-pulse"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">⚠️</div>
        <div>
          <p className="font-bold text-red-300 text-lg">OBSTACLE DETECTED</p>
          <p className="text-sm text-red-200">
            {alert.type && `${alert.type}`}
            {alert.distance && ` — ${alert.distance}`}
          </p>
        </div>
        <button
          className="ml-auto text-red-300 text-xl"
          onClick={() => setAlert(null)}
          aria-label="Dismiss alert"
        >✕</button>
      </div>
    </div>
  )
}
