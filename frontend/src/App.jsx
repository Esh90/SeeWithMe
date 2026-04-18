import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Navigation, Eye, Mic, Search, Camera } from 'lucide-react';
import './index.css';

const WS_URL = 'ws://127.0.0.1:8000/ws/video';
const VQA_API = 'http://127.0.0.1:8000/api/vqa';
const NAV_API = 'http://127.0.0.1:8000/api/navigate';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamIntervalRef = useRef(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'warning'|'navigation', message: '' }
  const [vqaQuery, setVqaQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Voice Synthesis Setup ---
  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel previous
      const msg = new SpeechSynthesisUtterance(text);
      msg.rate = 1.0;
      window.speechSynthesis.speak(msg);
    }
  }, []);

  // Handle incoming alerts
  useEffect(() => {
    if (alert) {
      speak(alert.message);
      // Auto-clear alert after 5s unless it's a danger we want to keep
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert, speak]);

  // --- Core Initialization (Camera & WebSocket) ---
  useEffect(() => {
    let activeStream = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
      }
    };

    const startWebSocket = () => {
      const ws = new WebSocket(WS_URL);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = (e) => console.error('WS Error:', e);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'warning' || data.type === 'navigation') {
            setAlert(data);
          }
        } catch (e) {
          // not json
        }
      };
      wsRef.current = ws;
    };

    startCamera();
    startWebSocket();

    // Frame capture loop
    streamIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN && videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth || 640;
        canvasRef.current.height = videoRef.current.videoHeight || 480;
        if (canvasRef.current.width > 0) {
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          // Compress heavily for the no-lag demo
          const base64Frame = canvasRef.current.toDataURL('image/jpeg', 0.5);
          wsRef.current.send(base64Frame);
        }
      }
    }, 500); // 2 fps for balance between responsiveness and load

    return () => {
      if (activeStream) activeStream.getTracks().forEach(t => t.stop());
      if (wsRef.current) wsRef.current.close();
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  // --- VQA Feature ---
  const handleAskQuestion = async () => {
    if (!vqaQuery.trim() || !videoRef.current || !canvasRef.current) return;
    
    setIsProcessing(true);
    try {
      // Capture High Res Frame for VQA
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      canvasRef.current.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('image', blob, 'frame.jpg');
        formData.append('query', vqaQuery);
        
        try {
          const res = await fetch(VQA_API, { method: 'POST', body: formData });
          const data = await res.json();
          setAlert({ type: 'info', message: data.answer });
          setVqaQuery('');
        } catch(e) {
          console.error(e);
          setAlert({ type: 'warning', message: 'Network error reaching AI.' });
        } finally {
          setIsProcessing(false);
        }
      }, 'image/jpeg', 0.9);
      
    } catch(e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      {/* Background Camera */}
      <video ref={videoRef} autoPlay playsInline muted className="camera-view" />
      <div className="vignette"></div>
      
      {/* Hidden Canvas for Extracting Frames */}
      <canvas ref={canvasRef} className="hidden-canvas" />

      {/* HUD Layer */}
      <div className="hud-overlay">
        
        {/* Top: Status */}
        <div className="hud-top">
          <div className="glass-pill status-indicator">
            <div className={`status-dot ${wsConnected ? 'active' : 'error'}`}></div>
            <span>{wsConnected ? 'Edge Active' : 'Connecting...'}</span>
          </div>
          <div className="glass-pill status-indicator">
            <Camera size={16} />
            <span>Live</span>
          </div>
        </div>

        {/* Center: Alerts */}
        <div className="hud-center">
          {alert && (
            <div className={`alert-box ${alert.type}`}>
              {alert.type === 'warning' ? (
                <>
                  <h3>⚠️ Hazard Detected</h3>
                  <p>{alert.message}</p>
                </>
              ) : alert.type === 'navigation' ? (
                 <>
                  <h3>📍 Navigation</h3>
                  <p>{alert.message}</p>
                </>
              ) : (
                <>
                  <h3>👁️ See With Me</h3>
                  <p>{alert.message}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom: Ask Input */}
        <div className="hud-bottom glass-panel" style={{ padding: '1rem', borderRadius: '24px' }}>
          <h4 style={{ marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Ask about your environment
          </h4>
          <div className="input-group">
            <input 
              type="text" 
              className="glass-input" 
              placeholder="e.g. What is the total on this receipt?"
              value={vqaQuery}
              onChange={(e) => setVqaQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
              disabled={isProcessing}
            />
            <button 
              className="icon-btn" 
              onClick={handleAskQuestion}
              disabled={isProcessing || !vqaQuery.trim()}
            >
              {isProcessing ? <div style={{width:'20px', height:'20px', border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite'}} /> : <Search size={22} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
