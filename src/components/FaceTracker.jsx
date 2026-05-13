import React, { useEffect, useState, useRef } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { Loader2, Camera, Cpu } from 'lucide-react';

// --- OPTIMIZATION: Quick Initialize Module Cache ---
// Initialize WASM loader immediately at the module level to begin streaming data
// BEFORE the component even mounts, saving up to several seconds of idle time.
let globalVisionPromise = null;
let cachedLandmarker = null;

function getVisionPromise() {
  if (!globalVisionPromise) {
    globalVisionPromise = FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
    );
  }
  return globalVisionPromise;
}

const FaceTracker = ({ videoElement, onFaceData, isActive = true }) => {
  const [isLoading, setIsLoading] = useState(!cachedLandmarker);
  const [statusMessage, setStatusMessage] = useState('Engaging AI Neural Tracker...');
  const [error, setError] = useState(null);
  
  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  useEffect(() => {
    let isMounted = true;

    async function initLandmarker() {
      // Instant return if already cached in memory
      if (cachedLandmarker) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        setStatusMessage('Streaming Neural Networks...');
        const vision = await getVisionPromise();

        if (!isMounted) return;
        
        setStatusMessage('Calibrating Face Matrix...');
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: false,
          runningMode: "VIDEO",
          numFaces: 1 // ⚡ OPTIMIZATION: Set to exactly 1 face for maximum performance and stability!
        });

        if (!isMounted) {
          faceLandmarker.close();
          return;
        }

        cachedLandmarker = faceLandmarker;
        setIsLoading(false);
        console.log("⚡ AI Face Tracker initialized instantly via cache.");
      } catch (err) {
        console.error("Failed to initialize face landmarker:", err);
        if (isMounted) {
          setError("Face tracking startup failed. Retrying...");
          setIsLoading(false);
        }
      }
    }

    initLandmarker();

    return () => {
      isMounted = false;
      // NOTE: We DELIBERATELY do not close the cachedLandmarker here, 
      // so it remains warm and ready for immediate hot-reloading!
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Ref to track last execution time for FPS throttling
  const lastDetectionTimeRef = useRef(0);

  useEffect(() => {
    if (!videoElement || !cachedLandmarker || !isActive || isLoading) return;

    const detect = () => {
      if (!videoElement || videoElement.paused || videoElement.ended) {
        requestRef.current = requestAnimationFrame(detect);
        return;
      }

      const timestamp = performance.now();
      const timeSinceLastDetection = timestamp - lastDetectionTimeRef.current;
      
      // ⚡ OPTIMIZATION: Cap detection at max ~30 FPS (33ms) to save significant CPU cycles.
      // High frequency camera feeds (e.g. 60FPS) are downsampled here, while Three.js
      // lerping ensures everything still feels completely buttery smooth!
      if (videoElement.currentTime !== lastVideoTimeRef.current && timeSinceLastDetection >= 33) {
        lastVideoTimeRef.current = videoElement.currentTime;
        lastDetectionTimeRef.current = timestamp;

        try {
          const results = cachedLandmarker.detectForVideo(videoElement, timestamp);
          if (results && results.faceLandmarks) {
            // Pass the full array of detected faces
            onFaceData(results.faceLandmarks);
          } else {
            onFaceData([]);
          }
        } catch (e) {
          // Silently handle occasional frame dropped errors
        }
      }

      requestRef.current = requestAnimationFrame(detect);
    };

    requestRef.current = requestAnimationFrame(detect);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [videoElement, onFaceData, isActive, isLoading]);

  if (isLoading) {
    return (
      <div className="tracker-loader glass-panel">
        <Loader2 className="animate-spin text-indigo-400" size={48} />
        <p className="loading-text">{statusMessage}</p>
        <div className="status-icons">
          <span className="status-tag"><Camera size={14} /> Camera Connected</span>
          <span className="status-tag"><Cpu size={14} /> GPU Acceleration</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tracker-loader glass-panel error">
        <div className="error-circle">!</div>
        <p className="loading-text text-rose-400">{error}</p>
      </div>
    );
  }

  return null; // Tracker operates invisibly once loaded
};

// Pre-warm WASM bundle asynchronously during module evaluation
getVisionPromise();

export default FaceTracker;
