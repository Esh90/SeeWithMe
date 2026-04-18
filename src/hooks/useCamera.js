import { useState, useRef, useCallback, useEffect } from 'react'

export function useCamera() {
  const [stream, setStream] = useState(null)
  const [permission, setPermission] = useState('pending') // pending | granted | denied
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(document.createElement('canvas'))

  const requestCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      setStream(mediaStream)
      setPermission('granted')
      setError(null)
      return mediaStream
    } catch (err) {
      console.error('Camera error:', err)
      setPermission('denied')
      setError(err.message)
      return null
    }
  }, [])

  const attachToVideo = useCallback((videoElement) => {
    if (videoElement && stream) {
      videoElement.srcObject = stream
      videoRef.current = videoElement
    }
  }, [stream])

  const captureFrame = useCallback((quality = 0.6) => {
    const video = videoRef.current
    if (!video || !stream) return null

    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', quality).split(',')[1] // base64 only
  }, [stream])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
      setPermission('pending')
    }
  }, [stream])

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [stream])

  return {
    stream,
    permission,
    error,
    requestCamera,
    attachToVideo,
    captureFrame,
    stopCamera,
  }
}
