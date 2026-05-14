import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { Sparkles, CameraOff, Cpu, UserCheck, Camera, RefreshCw, List, X } from 'lucide-react';

import CameraFeed from './components/CameraFeed';
import FaceTracker from './components/FaceTracker';
import BasketModel from './components/BasketModel';

import './App.css';

// Milestone lookup for checklist (ID matching BasketModel)
const MILESTONES = [
  { id: "Student Career", label: "🎓 Student Career" },
  { id: "Admission", label: "📝 Admission" },
  { id: "Exam", label: "✍️ Exam" },
  { id: "FInal Viva", label: "🗣️ Final Viva" },
  { id: "Results", label: "🏆 Results" },
  { id: "Interview", label: "👔 Interview" },
  { id: "JOB", label: "💼 Job" },
  { id: "Increment", label: "💰 Increment" },
  { id: "Boss", label: "🧑‍💼 Boss" },
  { id: "Wife", label: "❤️ Wife" },
  { id: "Weight", label: "⚖️ Weight" },
  { id: "Sabha", label: "🕌 Sabha" }
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
  const [zoom, setZoom] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 📱 Controls mobile slide-out dashboard drawer

  const handleCycleZoom = () => {
    setZoom(prev => {
      if (prev === 1) return 2;
      if (prev === 2) return 3;
      if (prev === 3) return 5;
      return 1;
    });
  };

  // --- Lifted Milestone State ---
  const [selectedItems, setSelectedItems] = useState({
    "Student Career": true,
    "Admission": false,
    "Exam": false,
    "FInal Viva": false,
    "Results": false,
    "Interview": false,
    "JOB": false,
    "Increment": false,
    "Boss": false,
    "Wife": false,
    "Weight": false,
    "Sabha": false,
  });

  const toggleItem = (id) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const dynamicScaleText = "1.18"; // Static display locked at requested 1.18x


  // 🚀 ULTIMATE ASPECT-CORRECT SNAPSHOT ENGINE
  // Intelligently crops the raw high-res camera stream to perfectly match the active
  // viewport aspect ratio, simulating native 'object-fit: cover' and preventing horizontal squishing!
  const handleCapturePhoto = () => {
    if (!videoElement) return;
    const canvas3d = document.querySelector('.canvas-container canvas');
    if (!canvas3d) return;

    // 1. Detect screen viewport aspect ratio (exactly what user sees)
    const clientW = canvas3d.clientWidth;
    const clientH = canvas3d.clientHeight;
    const screenAspect = clientW / clientH;

    // 2. Detect raw camera sensor metrics
    const videoW = videoElement.videoWidth;
    const videoH = videoElement.videoHeight;
    const videoAspect = videoW / videoH;

    // 3. Construct optimal target canvas resolution locked to sensor height for crispness
    const targetH = videoH;
    const targetW = targetH * screenAspect;

    const merged = document.createElement('canvas');
    merged.width = targetW;
    merged.height = targetH;
    const ctx = merged.getContext('2d');

    // 4. Implement 'object-fit: cover' source cropping math WITH ACTIVE DIGITAL ZOOM SUPPORT
    let sWidthUnzoomed = videoW;
    let sHeightUnzoomed = videoH;

    if (screenAspect < videoAspect) {
      // Portrait Mode (Mobile): Viewport is narrower than raw landscape camera.
      // Crop excess horizontal sides to focus on the center vertical strip!
      sWidthUnzoomed = videoH * screenAspect;
    } else {
      // Widescreen Mode (Desktop): Viewport is wider than raw camera aspect.
      // Crop excess top/bottom vertical sections!
      sHeightUnzoomed = videoW / screenAspect;
    }

    const sWidth = sWidthUnzoomed / zoom;
    const sHeight = sHeightUnzoomed / zoom;
    const sx = (videoW - sWidth) / 2;
    const sy = (videoH - sHeight) / 2;

    // 5. Draw Background Video buffer with matching mirror transform
    ctx.save();
    if (isFrontCamera) {
      ctx.translate(targetW, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoElement, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);
    ctx.restore();

    // 6. Overlay 3D Canvas buffer (Proportionally cropped and scaled to match exact visual zoom layer)
    const cx = (canvas3d.width - canvas3d.width / zoom) / 2;
    const cy = (canvas3d.height - canvas3d.height / zoom) / 2;
    const cWidth = canvas3d.width / zoom;
    const cHeight = canvas3d.height / zoom;

    ctx.drawImage(canvas3d, cx, cy, cWidth, cHeight, 0, 0, targetW, targetH);

    // 7. Fire UX effects and initiate file download
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    const link = document.createElement('a');
    link.download = `Sabha_AR_Photo_${Date.now()}.png`;
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
        <div className={`milestones-dashboard-outer ${isMenuOpen ? 'mobile-visible' : 'mobile-hidden'}`}>
          <div className="md-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>🎯 Milestones</span>
              <button 
                className="md-mobile-close-btn" 
                onClick={() => setIsMenuOpen(false)}
                title="Close Menu"
              >
                <X size={16} color="#eab308" />
              </button>
            </div>
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

        {/* 📱 FLOATING MOBILE MENU TOGGLE BUTTON (Shows only on mobile <=820px) */}
        <button 
          className="mobile-menu-toggle glass-panel ripple"
          onClick={() => setIsMenuOpen(prev => !prev)}
          title="Toggle Menu"
        >
          <List size={22} color="white" />
        </button>

        {/* 🎥 HARDWARE-ACCELERATED DIGITAL ZOOM WRAPPER */}
        <div className="zoom-wrapper" style={{ transform: `scale(${zoom})` }}>
          {/* Video Stream */}
          <CameraFeed 
            onVideoReady={setVideoElement} 
            facingMode={isFrontCamera ? "user" : "environment"}
          />

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
                  selectedItems={selectedItems} 
                  videoElement={videoElement} // 👈 Pass live video buffer for perfect crop alignment!
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
        </div>

        {/* Neural Engine (Placed OUTSIDE zoomable container so loading HUD remains stable!) */}
        {videoElement && (
          <FaceTracker 
            videoElement={videoElement} 
            onFaceData={handleFaceData} 
            isActive={true}
          />
        )}

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

            {/* 🔍 DYNAMIC ZOOM CONTROLLER PRESET (UP TO 5x) */}
            <button 
              className="control-btn glass-panel ripple" 
              onClick={handleCycleZoom}
              title="Change Zoom Factor"
            >
              <span className="zoom-indicator-text">{zoom}x</span>
            </button>
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

