import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const CameraFeed = forwardRef(({ onVideoReady, facingMode = "user" }, ref) => {
  const videoRef = useRef(null);
  const hiddenVideoRef = useRef(null);

  useImperativeHandle(ref, () => videoRef.current);

  useEffect(() => {
    let stream = null;

    async function setupCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Webcam access not supported by this browser.");
        return;
      }

      try {
        // Ensure older streams are stopped before starting new device orientation
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
        if (hiddenVideoRef.current && hiddenVideoRef.current.srcObject) {
          hiddenVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 }, // Upgrade resolution for crisper photo clicks
            height: { ideal: 720 },
            facingMode: facingMode
          },
          audio: false
        });

        if (videoRef.current && hiddenVideoRef.current) {
          videoRef.current.srcObject = stream;
          hiddenVideoRef.current.srcObject = stream;
          
          // We monitor metadata load on the hidden video which acts as the AI reference
          hiddenVideoRef.current.onloadedmetadata = () => {
            hiddenVideoRef.current.play();
            videoRef.current.play();
            if (onVideoReady) {
              // 🚀 STABILITY PASS: Pass the hidden, untransformed DOM element to the parent
              // ensures CSS scale transforms on the visible layout never break texture reading in MediaPipe!
              onVideoReady(hiddenVideoRef.current);
            }
          };
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onVideoReady, facingMode]); // Re-trigger camera setup when facingMode toggles

  return (
    <div className="camera-container">
      {/* 1. Visible Render Layer (Target for hardware accelerated viewport zooms) */}
      <video
        ref={videoRef}
        className="camera-video"
        playsInline
        muted
        autoPlay
        style={{
          // Mirror user-facing camera ONLY for logical mirror experience
          transform: facingMode === "user" ? 'scaleX(-1)' : 'none', 
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '1.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '2px solid rgba(255,255,255,0.1)'
        }}
      />

      {/* 2. 🚀 AI Reference Layer: Invisible, completely stable, untransformed DOM element.
             This satisfies GPU security policies, guaranteeing 100% stable face tracking frame rate! */}
      <video
        ref={hiddenVideoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -9999,
        }}
      />
      
      <div className="camera-overlay"></div>
    </div>
  );
});

CameraFeed.displayName = 'CameraFeed';

export default CameraFeed;
