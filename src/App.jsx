import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { Sparkles, CameraOff, Cpu, UserCheck, Camera, RefreshCw } from 'lucide-react';

import CameraFeed from './components/CameraFeed';
import FaceTracker from './components/FaceTracker';
import BasketModel from './components/BasketModel';

import './App.css';

// Milestone lookup for checklist (ID matching BasketModel)
const MILESTONES = [
  { id: "Student Career", label: "🎓 Student Career" },
  { id: "Admission", label: "📝 Admission" },
  { id: "Exam", label: "✍️ Exam" },
  { id: "Results", label: "🏆 Results" },
  { id: "Interview", label: "👔 Interview" },
  { id: "Increment", label: "💰 Increment" },
  { id: "Wife", label: "❤️ Wife" }
];

function App() {
  const [videoElement, setVideoElement] = useState(null);
  
  const faceDataRef = useRef([]); 
  const [numFaces, setNumFaces] = useState(0); 
  
  const handleFaceData = React.useCallback((landmarksArray) => {
    faceDataRef.current = landmarksArray;
    if (landmarksArray.length !== numFaces) {
      setNumFaces(landmarksArray.length);
    }
  }, [numFaces]);

  // Feature States
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);

  // --- Lifted Milestone State ---
  const [selectedItems, setSelectedItems] = useState({
    "Student Career": true,
    "Admission": false,
    "Exam": false,
    "Results": false,
    "Interview": false,
    "Increment": false,
    "Wife": false,
  });

  const toggleItem = (id) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const dynamicScaleText = "1.18"; // Static display locked at requested 1.18x


  const handleCapturePhoto = () => {
    if (!videoElement) return;
    const canvas3d = document.querySelector('.canvas-container canvas');
    if (!canvas3d) return;

    const outputWidth = videoElement.videoWidth;
    const outputHeight = videoElement.videoHeight;
    const merged = document.createElement('canvas');
    merged.width = outputWidth;
    merged.height = outputHeight;
    const ctx = merged.getContext('2d');

    ctx.save();
    if (isFrontCamera) {
      ctx.translate(outputWidth, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoElement, 0, 0, outputWidth, outputHeight);
    ctx.restore();

    ctx.drawImage(canvas3d, 0, 0, outputWidth, outputHeight);

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    const link = document.createElement('a');
    link.download = `Basket_AR_Snap_${Date.now()}.png`;
    link.href = merged.toDataURL('image/png');
    link.click();
  };

  const handleToggleCamera = () => {
    setIsFrontCamera(prev => !prev);
    faceDataRef.current = [];
    setNumFaces(0);
  };

  const hasFaces = numFaces > 0;

  return (
    <div className="app-container">
      {/* Flash overlay */}
      <div className={`shutter-flash ${isFlashing ? 'active' : ''}`} />

      {/* Decorative aura blobs */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* Top HUD tracking indicators */}
      <div className="hud-container">
        <div className="hud-item glass-panel" style={{flexDirection: 'row', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem'}}>
          <div className={`status-indicator ${hasFaces ? 'active' : ''}`} />
          <span className="hud-label" style={{fontSize: '0.85rem', textTransform: 'none', color: 'white'}}>
            {hasFaces ? `Tracking ${numFaces} Face${numFaces > 1 ? 's' : ''}` : 'Searching...'}
          </span>
        </div>

        <div className="hud-item glass-panel" style={{padding: '0.5rem 1rem'}}>
          <span className="hud-value text-gradient" style={{fontSize: '1.1rem'}}>
            Basket Lens
          </span>
        </div>
      </div>

      {/* Central Viewport */}
      <div className="game-viewport glass-panel">
        
        {/* 🚀 ULTIMATE RENDER UPGRADE: EXTERNAL INTERACTIVE CHECKBOX DASHBOARD */}
        {/* Placed OUTSIDE R3F Canvas, fully operable and catches DOM PointerEvents flawlessly */}
        <div className="milestones-dashboard-outer">
          <div className="md-header">
            <span>🎯 Milestones</span>
            <span style={{ color: '#fde047' }}>📦 Scale: {dynamicScaleText}x</span>
          </div>
          
          <div className="md-checkbox-row">
            {MILESTONES.map((m) => (
              <label 
                key={m.id} 
                className={`md-item ${selectedItems[m.id] ? 'selected' : ''}`}
              >
                <input 
                  type="checkbox"
                  checked={selectedItems[m.id]}
                  onChange={() => toggleItem(m.id)}
                  className="md-checkbox-input"
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>

          <div className="md-footer-text">
            <span>✨ Stack your life stones inside the basket ✨</span>
          </div>
        </div>

        {/* Video Stream */}
        <CameraFeed 
          onVideoReady={setVideoElement} 
          facingMode={isFrontCamera ? "user" : "environment"}
        />

        {/* Neural Engine */}
        {videoElement && (
          <FaceTracker 
            videoElement={videoElement} 
            onFaceData={handleFaceData} 
            isActive={true}
          />
        )}

        {/* 3. 3D WebGL Overlay */}
        <div className="canvas-container">
          <Canvas
            shadows
            camera={{ position: [0, 0, 8], fov: 50 }}
            gl={{ 
              antialias: true, 
              alpha: true,
              preserveDrawingBuffer: true 
            }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
            }}
          >
            <ambientLight intensity={1.0} />
            <directionalLight
              position={[5, 10, 5]}
              intensity={1.2}
              castShadow
            />
            
            <Suspense fallback={null}>
              <Environment preset="city" />
              
              <BasketModel 
                faceIndex={0}
                faceDataRef={faceDataRef} 
                isFrontCamera={isFrontCamera}
                selectedItems={selectedItems} // Pass selected items down to R3F engine!
              />
            </Suspense>

            <ContactShadows
              position={[0, -4, 0]}
              opacity={0.3}
              scale={10}
              blur={3}
              far={4}
            />
          </Canvas>
        </div>

        {/* Bottom Controls */}
        {videoElement && (
          <div className="camera-controls">
            <button 
              className="control-btn glass-panel ripple" 
              onClick={handleToggleCamera}
              title="Flip Camera"
            >
              <RefreshCw size={24} color="white" />
            </button>

            <button 
              className="shutter-btn ripple" 
              onClick={handleCapturePhoto}
              title="Click Photo"
            >
              <div className="shutter-inner" />
            </button>

            <div className="control-btn-spacer" />
          </div>
        )}

        {/* Visual prompts */}
        {!hasFaces && videoElement && (
          <div className="visual-prompt glass-panel" style={{ bottom: '7.5rem' }}>
            <UserCheck className="animate-pulse text-amber-400" size={28} />
            <span style={{fontSize: '0.9rem'}}>Align face inside the camera frame</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

