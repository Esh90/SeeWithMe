# SeeWithMe – AI Vision Assistant

A voice-first PWA for visually impaired users. Pixel-perfect recreation of the provided design.

## Quick Start

```bash
npm install
npm run dev
```

Open ---Live url

## Build for Production
```bash
npm run build
npm run preview
```

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- Web Speech API (STT + TTS)
- PWA (vite-plugin-pwa)
- Canvas API (animated voice orb)

## Features
- 🎙️ Voice-native interaction (tap orb or mic button)
- 👁️ Obstacle detection (mocked, backend-ready)
- 🗺️ Step-by-step navigation
- 🧠 Semantic memory (store & query)
- 📷 Camera stream background
- 📱 Installable PWA

## Backend Integration
Edit `src/services/api.js` and set:
```
VITE_API_BASE_URL=https://your-api.com
```
All mock functions have identical real API signatures.

## Commands (Voice)
- "What do you see?" → VQA
- "Navigate to the park" → Navigation
- "Remember my keys are on the table" → Store memory
- "Where are my keys?" → Query memory
- "Help" → List commands
- "Stop" → Cancel
