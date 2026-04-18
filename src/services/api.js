// ============================================================
// API Service Layer - All backend calls go through here
// Swap VITE_API_BASE_URL env var to point at real backend
// ============================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL || null

// ---------- Mock helpers ----------
const mockDelay = (ms = 400) => new Promise(r => setTimeout(r, ms))

const mockResponses = {
  obstacle: (frame) => ({
    status: 'success',
    data: {
      obstacle: Math.random() > 0.7,
      confidence: (0.7 + Math.random() * 0.3).toFixed(2),
      type: ['wall', 'person', 'vehicle', 'step', 'door'][Math.floor(Math.random() * 5)],
      distance: (0.5 + Math.random() * 3).toFixed(1) + 'm',
    }
  }),

  vqa: (image, query) => {
    const responses = {
      default: "I can see a well-lit indoor environment. There appears to be furniture and clear pathways ahead.",
      color: "The dominant colors in the scene are blue, white, and grey.",
      text: "I can see text that reads: 'Exit' with an arrow pointing to the right.",
      person: "There is one person visible, approximately 3 meters ahead of you.",
    }
    const key = Object.keys(responses).find(k => query.toLowerCase().includes(k)) || 'default'
    return {
      status: 'success',
      data: {
        answer: responses[key],
        confidence: (0.8 + Math.random() * 0.2).toFixed(2),
      }
    }
  },

  storeMemory: (entry) => ({
    status: 'success',
    data: { id: `mem_${Date.now()}`, stored: true, entry }
  }),

  queryMemory: (query) => {
    const items = JSON.parse(localStorage.getItem('swm_memories') || '[]')
    const lower = query.toLowerCase()
    const match = items.find(i =>
      i.text?.toLowerCase().includes(lower.split(' ').find(w => w.length > 3) || lower)
    )
    return {
      status: 'success',
      data: {
        found: !!match,
        result: match ? match.text : "I don't have any information about that stored.",
        timestamp: match?.timestamp,
      }
    }
  },

  navigation: (destination) => ({
    status: 'success',
    data: {
      destination,
      steps: [
        { instruction: 'Head north on Main Street', distance: '50 meters', duration: '1 min' },
        { instruction: 'Turn right onto Oak Avenue', distance: '120 meters', duration: '2 min' },
        { instruction: 'Continue straight past the intersection', distance: '80 meters', duration: '1 min' },
        { instruction: `You have arrived at ${destination}`, distance: '0 meters', duration: '0 min' },
      ],
      totalDistance: '250 meters',
      totalDuration: '4 min',
    }
  })
}

// ---------- Core fetch wrapper ----------
async function apiFetch(endpoint, options = {}) {
  if (!BASE_URL) return null // use mock
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// ---------- Public API ----------

/**
 * Send a camera frame for obstacle detection
 * @param {string} frame - base64 encoded image frame
 */
export async function detectObstacle(frame) {
  await mockDelay(200)
  try {
    const real = await apiFetch('/detect/obstacle', {
      method: 'POST',
      body: JSON.stringify({ frame }),
    })
    return real || mockResponses.obstacle(frame)
  } catch {
    return mockResponses.obstacle(frame)
  }
}

/**
 * Visual Question Answering
 * @param {string} image - base64 encoded image
 * @param {string} query - user's voice query
 */
export async function sendVQA(image, query) {
  await mockDelay(600)
  try {
    const real = await apiFetch('/vqa', {
      method: 'POST',
      body: JSON.stringify({ image, query }),
    })
    return real || mockResponses.vqa(image, query)
  } catch {
    return mockResponses.vqa(image, query)
  }
}

/**
 * Store a semantic memory entry
 * @param {{ text: string, category: string, timestamp: number }} data
 */
export async function storeMemory(data) {
  await mockDelay(150)
  // Always persist locally for offline support
  const items = JSON.parse(localStorage.getItem('swm_memories') || '[]')
  items.unshift({ ...data, timestamp: data.timestamp || Date.now() })
  if (items.length > 100) items.pop() // cap at 100 entries
  localStorage.setItem('swm_memories', JSON.stringify(items))

  try {
    const real = await apiFetch('/memory/store', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return real || mockResponses.storeMemory(data)
  } catch {
    return mockResponses.storeMemory(data)
  }
}

/**
 * Query semantic memory
 * @param {string} query - natural language query
 */
export async function queryMemory(query) {
  await mockDelay(300)
  try {
    const real = await apiFetch('/memory/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
    return real || mockResponses.queryMemory(query)
  } catch {
    return mockResponses.queryMemory(query)
  }
}

/**
 * Get navigation directions to a destination
 * @param {string} destination
 * @param {{ lat: number, lng: number }} [currentLocation]
 */
export async function getNavigation(destination, currentLocation = null) {
  await mockDelay(500)
  try {
    const real = await apiFetch('/navigation/route', {
      method: 'POST',
      body: JSON.stringify({ destination, currentLocation }),
    })
    return real || mockResponses.navigation(destination)
  } catch {
    return mockResponses.navigation(destination)
  }
}

/**
 * Get all stored memories
 */
export function getAllMemories() {
  return JSON.parse(localStorage.getItem('swm_memories') || '[]')
}

/**
 * Delete a memory by id
 */
export function deleteMemory(id) {
  const items = JSON.parse(localStorage.getItem('swm_memories') || '[]')
  const updated = items.filter(i => i.id !== id)
  localStorage.setItem('swm_memories', JSON.stringify(updated))
}
