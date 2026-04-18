import React, { useState, useCallback } from 'react'
import { sendVQA, storeMemory, queryMemory } from '../services/api.js'

const COMMANDS = {
  navigate: /\b(navigate|go to|take me to|directions? to)\b/i,
  vqa: /\b(what|describe|tell me|look|see|read|identify|find)\b/i,
  storeMemory: /\b(remember|store|save|note)\b/i,
  queryMemory: /\b(where|what did i|find|recall|forgot)\b/i,
  help: /\b(help|what can you do|commands?)\b/i,
  stop: /\b(stop|cancel|quiet|silence)\b/i,
}

const HELP_TEXT = `I can help you with: obstacle detection, visual questions like what do you see, navigation to a destination, and storing memories like remember my keys are on the table. Just speak naturally!`

export default function VoiceAssistant({
  speak,
  captureFrame,
  onNavigate,
  onOpenMemory,
  setOrbState,
}) {
  const [lastCommand, setLastCommand] = useState(null)

  const processCommand = useCallback(async (transcript) => {
    const text = transcript.toLowerCase().trim()
    setLastCommand(transcript)

    if (COMMANDS.stop.test(text)) {
      speak('Stopped.')
      return 'idle'
    }

    if (COMMANDS.help.test(text)) {
      setOrbState('speaking')
      await speak(HELP_TEXT)
      setOrbState('idle')
      return 'idle'
    }

    if (COMMANDS.navigate.test(text)) {
      const dest = text
        .replace(/(navigate|go to|take me to|directions? to)/i, '')
        .replace(/\b(please|can you|i want to|i need to)\b/gi, '')
        .trim()
      if (dest) {
        onNavigate?.(dest)
        await speak(`Starting navigation to ${dest}`)
      } else {
        await speak('Where would you like to go?')
      }
      return 'idle'
    }

    if (COMMANDS.storeMemory.test(text)) {
      const memText = text
        .replace(/\b(remember|store|save|note that?)\b/i, '')
        .trim()
      if (memText) {
        setOrbState('processing')
        await storeMemory({ text: memText, timestamp: Date.now() })
        setOrbState('speaking')
        await speak(`Got it! I'll remember: ${memText}`)
        setOrbState('idle')
      } else {
        onOpenMemory?.()
      }
      return 'idle'
    }

    if (COMMANDS.queryMemory.test(text)) {
      setOrbState('processing')
      const result = await queryMemory(text)
      setOrbState('speaking')
      await speak(result?.data?.result || "I don't have that stored.")
      setOrbState('idle')
      return 'idle'
    }

    if (COMMANDS.vqa.test(text)) {
      const frame = captureFrame?.()
      setOrbState('processing')
      const result = await sendVQA(frame || '', transcript)
      setOrbState('speaking')
      await speak(result?.data?.answer || 'I could not analyze the scene right now.')
      setOrbState('idle')
      return 'idle'
    }

    // Fallback: treat as VQA
    const frame = captureFrame?.()
    setOrbState('processing')
    const result = await sendVQA(frame || '', transcript)
    setOrbState('speaking')
    await speak(result?.data?.answer || "I'm not sure about that. Try asking me what you see, or say help for a list of commands.")
    setOrbState('idle')
    return 'idle'
  }, [speak, captureFrame, onNavigate, onOpenMemory, setOrbState])

  return { processCommand, lastCommand }
}
