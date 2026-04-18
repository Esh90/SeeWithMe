import React, { useState, useEffect } from 'react'
import { storeMemory, queryMemory, getAllMemories } from '../services/api.js'

export default function MemoryManager({ speak, onClose }) {
  const [memories, setMemories] = useState([])
  const [query, setQuery] = useState('')
  const [newMemory, setNewMemory] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('store') // store | query | list

  useEffect(() => {
    setMemories(getAllMemories())
  }, [])

  async function handleStore() {
    if (!newMemory.trim()) return
    setLoading(true)
    try {
      await storeMemory({ text: newMemory, category: 'user', timestamp: Date.now() })
      speak(`Stored: ${newMemory}`)
      setNewMemory('')
      setMemories(getAllMemories())
    } finally {
      setLoading(false)
    }
  }

  async function handleQuery() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await queryMemory(query)
      setResult(res?.data?.result || 'No information found.')
      speak(res?.data?.result || 'I could not find that information.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(13,148,136,0.3)', border: '1px solid #2dd4bf' }}>
          <span className="text-sm">🧠</span>
        </div>
        <h2 className="text-lg font-semibold" style={{ color: '#e0f7f4' }}>Memory</h2>
        <button className="ml-auto text-teal-400 text-sm" onClick={onClose}>✕ Close</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['store', 'query', 'list'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all"
            style={{
              background: tab === t ? 'rgba(13,148,136,0.4)' : 'rgba(13,148,136,0.1)',
              border: tab === t ? '1px solid #2dd4bf' : '1px solid rgba(45,212,191,0.15)',
              color: tab === t ? '#2dd4bf' : '#7ecfc8',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Store tab */}
      {tab === 'store' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: '#7ecfc8' }}>Save something to remember later:</p>
          <textarea
            value={newMemory}
            onChange={e => setNewMemory(e.target.value)}
            placeholder='e.g. "Keys are on the kitchen table"'
            rows={3}
            className="w-full p-4 rounded-xl text-sm outline-none resize-none"
            style={{
              background: 'rgba(13,148,136,0.1)',
              border: '1px solid rgba(45,212,191,0.3)',
              color: '#e0f7f4',
            }}
          />
          <button
            onClick={handleStore}
            disabled={loading || !newMemory.trim()}
            className="w-full py-4 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', color: '#0a1f1f' }}
          >
            {loading ? 'Saving...' : '💾 Save Memory'}
          </button>
        </div>
      )}

      {/* Query tab */}
      {tab === 'query' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: '#7ecfc8' }}>Ask about something you stored:</p>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuery()}
            placeholder='e.g. "Where are my keys?"'
            className="w-full p-4 rounded-xl text-base outline-none"
            style={{
              background: 'rgba(13,148,136,0.1)',
              border: '1px solid rgba(45,212,191,0.3)',
              color: '#e0f7f4',
            }}
          />
          <button
            onClick={handleQuery}
            disabled={loading || !query.trim()}
            className="w-full py-4 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0d9488, #2dd4bf)', color: '#0a1f1f' }}
          >
            {loading ? 'Searching...' : '🔍 Search Memory'}
          </button>
          {result && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)' }}>
              <p className="text-xs mb-1" style={{ color: '#7ecfc8' }}>Result:</p>
              <p style={{ color: '#e0f7f4' }}>{result}</p>
            </div>
          )}
        </div>
      )}

      {/* List tab */}
      {tab === 'list' && (
        <div className="flex flex-col gap-2 overflow-y-auto flex-1">
          {memories.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#7ecfc8' }}>
              <p className="text-4xl mb-3">🧠</p>
              <p>No memories stored yet</p>
            </div>
          ) : (
            memories.map((mem, idx) => (
              <div key={mem.id || idx}
                className="p-3 rounded-xl"
                style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(45,212,191,0.15)' }}>
                <p className="text-sm" style={{ color: '#e0f7f4' }}>{mem.text}</p>
                <p className="text-xs mt-1" style={{ color: '#7ecfc8' }}>
                  {mem.timestamp ? new Date(mem.timestamp).toLocaleString() : ''}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
