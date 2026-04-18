import { useState, useRef, useCallback, useEffect } from 'react'

const PRIORITY_INTERRUPT = 10
const PRIORITY_NORMAL = 5

export function useVoice() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(true)

  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)
  const utteranceQueueRef = useRef([])
  const currentPriorityRef = useRef(0)
  const onResultRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      const text = result[0].transcript
      setTranscript(text)
      if (result.isFinal && onResultRef.current) {
        onResultRef.current(text.trim())
      }
    }

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      synthRef.current?.cancel()
    }
  }, [])

  const startListening = useCallback((onResult) => {
    if (!recognitionRef.current || isListening) return
    onResultRef.current = onResult
    synthRef.current?.cancel()
    setTranscript('')
    try {
      recognitionRef.current.start()
    } catch (e) {
      console.warn('Could not start recognition:', e)
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const speak = useCallback((text, { priority = PRIORITY_NORMAL, interrupt = false } = {}) => {
    if (!synthRef.current) return Promise.resolve()

    return new Promise((resolve) => {
      if (interrupt || priority >= PRIORITY_INTERRUPT) {
        synthRef.current.cancel()
        recognitionRef.current?.abort()
        currentPriorityRef.current = priority
      }

      if (isSpeaking && priority < currentPriorityRef.current) {
        resolve()
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      utterance.lang = 'en-US'

      utterance.onstart = () => {
        setIsSpeaking(true)
        currentPriorityRef.current = priority
      }
      utterance.onend = () => {
        setIsSpeaking(false)
        currentPriorityRef.current = 0
        resolve()
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        resolve()
      }

      synthRef.current.speak(utterance)
    })
  }, [isSpeaking])

  const speakUrgent = useCallback((text) => {
    return speak(text, { priority: PRIORITY_INTERRUPT, interrupt: true })
  }, [speak])

  const cancelSpeech = useCallback(() => {
    synthRef.current?.cancel()
    setIsSpeaking(false)
  }, [])

  return {
    isListening,
    isSpeaking,
    transcript,
    supported,
    startListening,
    stopListening,
    speak,
    speakUrgent,
    cancelSpeech,
  }
}
