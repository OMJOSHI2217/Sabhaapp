import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { Sparkles, CameraOff, Cpu, UserCheck, Camera, RefreshCw } from 'lucide-react';

import CameraFeed from './components/CameraFeed';
import FaceTracker from './components/FaceTracker';
import BasketModel from './components/BasketModel';

import './App.css';

function App() {
  const [videoElement, setVideoElement] = useState(null);
  const [detectedFaces, setDetectedFaces] = useState([]); // 👈 Switched to array for Multi-Face support
  
  // Feature States: Front/Rear camera toggle and Shutter visual flash
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);

  // Advanced Merge Capture Routine:
  // Stitches the raw HTML5 Video Buffer and the WebGL Drawing Buffer into a single 
  // high-resolution PNG image while maintaining correct spatial mirroring
  const handleCapturePhoto = () => {
    if (!videoElement) return;

    const canvas3d = document.querySelector('.canvas-container canvas');
    if (!canvas3d) return;

    // Step 1: Compute full sensor resolution
    const outputWidth = videoElement.videoWidth;
    const outputHeight = videoElement.videoHeight;

    // Step 2: Construct transient merging canvas
    const merged = document.createElement('canvas');
    merged.width = outputWidth;
    merged.height = outputHeight;
    const ctx = merged.getContext('2d');

    // Step 3: Render Background (Conditional horizontal inversion for front camera)
    ctx.save();
    if (isFrontCamera) {
      ctx.translate(outputWidth, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoElement, 0, 0, outputWidth, outputHeight);
    ctx.restore();

    // Step 4: Overlay 3D Buffer (R3F aligns automatically by stretching canvas mapping)
    ctx.drawImage(canvas3d, 0, 0, outputWidth, outputHeight);

    // Step 5: Fire visual Flash UX triggers
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    // Step 6: Initiate dynamic filesystem downloader
    const link = document.createElement('a');
    link.download = `Basket_AR_Snap_${Date.now()}.png`;
    link.href = merged.toDataURL('image/png');
    link.click();
  };

  // Camera Rotation trigger
  const handleToggleCamera = () => {
    setIsFrontCamera(prev => !prev);
    setDetectedFaces([]); // Force neural engine recalibration on hardware switch
  };

  const hasFaces = detectedFaces.length > 0;

  return (
    <div className="app-container">
      {/* Flash feedback overlay */}
      <div className={`shutter-flash ${isFlashing ? 'active' : ''}`} />

      {/* Decorative Background Aura Blobs */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* Sleek Top Badge Indicators */}
      <div className="hud-container">
        <div className="hud-item glass-panel" style={{flexDirection: 'row', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem'}}>
          <div className={`status-indicator ${hasFaces ? 'active' : ''}`} />
          <span className="hud-label" style={{fontSize: '0.85rem', textTransform: 'none', color: 'white'}}>
            {hasFaces ? `Tracking ${detectedFaces.length} Face${detectedFaces.length > 1 ? 's' : ''}` : 'Searching...'}
          </span>
        </div>

        <div className="hud-item glass-panel" style={{padding: '0.5rem 1rem'}}>
          <span className="hud-value text-gradient" style={{fontSize: '1.1rem'}}>
            Basket Lens
          </span>
        </div>
      </div>

      {/* Central Augmented Reality Frame */}
      <div className="game-viewport glass-panel">
        
        {/* 1. Augmented Video Stream */}
        <CameraFeed 
          onVideoReady={setVideoElement} 
          facingMode={isFrontCamera ? "user" : "environment"}
        />

        {/* 2. Neural Engine Face Landmarker */}
        {videoElement && (
          <FaceTracker 
            videoElement={videoElement} 
            onFaceData={setDetectedFaces} 
            isActive={true}
          />
        )}

        {/* 3. Interactive 3D WebGL Overlay */}
        <div className="canvas-container">
          <Canvas
            shadows
            camera={{ position: [0, 0, 8], fov: 50 }}
            gl={{ 
              antialias: true, 
              alpha: true,
              preserveDrawingBuffer: true // 👈 ESSENTIAL: Prevents clearing buffer to allow capturing snapshots!
            }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0); // Force transparency
            }}
          >
            <ambientLight intensity={1.0} />
            <directionalLight
              position={[5, 10, 5]}
              intensity={1.2}
              castShadow
            />
            
            {/* PBR Environment Mapping */}
            <Suspense fallback={null}>
              <Environment preset="city" />
              
              {/* DYNAMIC MULTI-FACE RENDERER:
                  Maps over every detected face in the viewport, dynamically instantiating 
                  independent, auto-adjusting 3D BasketModels for each! */}
              {detectedFaces.map((landmarks, idx) => (
                <BasketModel 
                  key={`basket-face-${idx}`}
                  faceLandmarks={landmarks} 
                  isFrontCamera={isFrontCamera}
                />
              ))}
            </Suspense>

            {/* Soft Contact Shadow map */}
            <ContactShadows
              position={[0, -4, 0]}
              opacity={0.3}
              scale={10}
              blur={3}
              far={4}
            />
          </Canvas>
        </div>

        {/* UI Camera Control Suite (Bottom Floating Bar) */}
        {videoElement && (
          <div className="camera-controls">
            {/* Toggle Camera Button */}
            <button 
              className="control-btn glass-panel ripple" 
              onClick={handleToggleCamera}
              title="Flip Camera"
            >
              <RefreshCw size={24} color="white" />
            </button>

            {/* Huge Shutter Capture Button */}
            <button 
              className="shutter-btn ripple" 
              onClick={handleCapturePhoto}
              title="Click Photo"
            >
              <div className="shutter-inner" />
            </button>

            {/* Aesthetic Spacer Placeholder to balance flexbox */}
            <div className="control-btn-spacer" />
          </div>
        )}

        {/* Interactive Visual Prompt Overlay */}
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
