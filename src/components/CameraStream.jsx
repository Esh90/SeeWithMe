import React, { useEffect, useRef } from 'react'

export default function CameraStream({ stream, visible = false }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  if (!visible) return null

  return (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover opacity-20"
        style={{ transform: 'scaleX(-1)' }}
      />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(10,31,31,0.7) 0%, transparent 40%, transparent 60%, rgba(10,31,31,0.8) 100%)' }} />
    </div>
  )
}
