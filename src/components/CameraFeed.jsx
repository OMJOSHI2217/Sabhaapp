import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const CameraFeed = forwardRef(({ onVideoReady, facingMode = "user" }, ref) => {
  const videoRef = useRef(null);

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

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 }, // Upgrade resolution for crisper photo clicks
            height: { ideal: 720 },
            facingMode: facingMode
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            if (onVideoReady) {
              onVideoReady(videoRef.current);
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
      <div className="camera-overlay"></div>
    </div>
  );
});

CameraFeed.displayName = 'CameraFeed';

export default CameraFeed;
