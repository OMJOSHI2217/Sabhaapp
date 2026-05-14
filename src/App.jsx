import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { Sparkles, CameraOff, Cpu, UserCheck, Camera, RefreshCw, Plus, Minus, Layers, X, Upload, Image as ImageIcon } from 'lucide-react';

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
  const [showBasket, setShowBasket] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 820);

  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(5, parseFloat((prev + 0.5).toFixed(1))));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(1, parseFloat((prev - 0.5).toFixed(1))));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
      setVideoElement(null);
      faceDataRef.current = [];
      setNumFaces(0);
      setZoom(1); // Reset zoom to 1.0x to ensure user sees unzoomed picture initially
      // Automatically open side panel to let user select milestones
      setSidebarOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    setVideoElement(null);
    faceDataRef.current = [];
    setNumFaces(0);
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

  const dynamicScaleText = "1.18";
  const checkedCount = Object.values(selectedItems).filter(Boolean).length;


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

    // 2. Detect raw media metrics
    const isImage = videoElement instanceof HTMLImageElement;
    const videoW = isImage ? videoElement.naturalWidth : videoElement.videoWidth;
    const videoH = isImage ? videoElement.naturalHeight : videoElement.videoHeight;
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
    const shouldMirror = !isImage && isFrontCamera;
    if (shouldMirror) {
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
      <div 
        className={`game-viewport glass-panel${uploadedImage && videoElement instanceof HTMLImageElement ? ' image-mode-active' : ''}`}
        style={uploadedImage && videoElement instanceof HTMLImageElement && videoElement.naturalWidth ? {
          aspectRatio: `${videoElement.naturalWidth} / ${videoElement.naturalHeight}`,
          '--viewport-width': `min(90vw, calc(80vh * ${videoElement.naturalWidth / videoElement.naturalHeight}), 1080px)`
        } : {}}
      >
        
        {/* Floating open button — visible only when panel is collapsed */}
        {!sidebarOpen && (
          <button className="sidebar-open-btn ripple" onClick={() => setSidebarOpen(true)}>
            <Layers size={20} color="#eab308" />
            {checkedCount > 0 && <span className="sidebar-badge">{checkedCount}</span>}
          </button>
        )}

        {/* Milestones Panel — collapsible */}
        <div className={`milestones-dashboard-outer${sidebarOpen ? '' : ' panel-hidden'}`}>
          <div className="md-header">
            <div className="md-header-row">
              <span>🎯 Milestones</span>
              <button className="panel-close-btn" onClick={() => setSidebarOpen(false)} title="Hide panel">
                <X size={13} color="rgba(255,255,255,0.7)" />
              </button>
            </div>
            <span style={{ color: '#fde047' }}>📦 Scale: {dynamicScaleText}x</span>
          </div>
          
          <div className="md-checkbox-row">
            {/* 🧺 MASTER BASKET TOGGLE */}
            <label 
              className={`md-item ${showBasket ? 'selected' : ''}`} 
              style={{ borderLeft: '3px solid #eab308', background: showBasket ? 'rgba(234, 179, 8, 0.22)' : 'rgba(255, 255, 255, 0.03)' }}
            >
              <input 
                type="checkbox"
                checked={showBasket}
                onChange={() => setShowBasket(prev => !prev)}
                className="md-checkbox-input"
              />
              <span style={{ fontWeight: 'bold', color: '#fde047' }}>🧺 Stone Basket</span>
            </label>

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

        {/* 🎥 HARDWARE-ACCELERATED DIGITAL ZOOM WRAPPER */}
        <div className="zoom-wrapper" style={{ transform: `scale(${zoom})` }}>
          {uploadedImage ? (
            <div className="camera-container">
              <img
                ref={imageRef}
                src={uploadedImage}
                alt="Uploaded photo"
                className="camera-video"
                onLoad={() => {
                  if (imageRef.current) {
                    setVideoElement(imageRef.current);
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'fill', // Perfect 1:1 coverage driven by aspect-locked viewport styling
                  borderRadius: '1.5rem',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  border: '2px solid rgba(255,255,255,0.1)',
                  transform: 'none'
                }}
              />
              <div className="camera-overlay"></div>
            </div>
          ) : (
            /* Video Stream */
            <CameraFeed 
              onVideoReady={setVideoElement} 
              facingMode={isFrontCamera ? "user" : "environment"}
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
                  isFrontCamera={uploadedImage ? false : isFrontCamera}
                  selectedItems={selectedItems} 
                  videoElement={videoElement}
                  zoom={zoom} // 👈 Pass active zoom factor for dynamic offset adaptations!
                  showBasket={showBasket}
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
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              style={{ display: 'none' }} 
            />

            {uploadedImage ? (
              <button 
                className="control-btn glass-panel ripple" 
                onClick={handleClearImage}
                title="Back to Live"
                style={{ borderColor: '#eab308' }}
              >
                <Camera size={24} color="#eab308" />
              </button>
            ) : (
              <button 
                className="control-btn glass-panel ripple" 
                onClick={handleToggleCamera}
                title="Flip Camera"
              >
                <RefreshCw size={24} color="white" />
              </button>
            )}

            <button 
              className="control-btn glass-panel ripple" 
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Upload Image"
            >
              <Upload size={24} color="white" />
            </button>

            <button 
              className="shutter-btn ripple" 
              onClick={handleCapturePhoto}
              title="Click Photo"
            >
              <div className="shutter-inner" />
            </button>

            {/* 🔍 ADVANCED ZOOM POD (+ / - CONTROLS) */}
            <div className="zoom-control-pod glass-panel">
              <button 
                className="zoom-action-btn ripple" 
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                title="Zoom Out"
              >
                <Minus size={16} color="white" />
              </button>
              
              <span className="zoom-display-text">{zoom.toFixed(1)}x</span>
              
              <button 
                className="zoom-action-btn ripple" 
                onClick={handleZoomIn}
                disabled={zoom >= 5}
                title="Zoom In"
              >
                <Plus size={16} color="white" />
              </button>
            </div>
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

