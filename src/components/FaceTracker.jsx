import React, { useEffect, useRef, useState } from "react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

let globalVisionPromise = null;
let cachedLandmarker = null;
// Bump this string whenever landmarker config changes — forces cache invalidation on hot reload
const LANDMARKER_VERSION = 'v5-float16-cpu';
let cachedVersion = null;

function getVisionPromise() {
  if (!globalVisionPromise) {
    globalVisionPromise = FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
    );
  }
  return globalVisionPromise;
}

const FaceTracker = ({
  videoElement,
  onFaceData,
  onZoomChange,
  isActive = true,
}) => {
  const [isLoading, setIsLoading] = useState(!cachedLandmarker);

  const requestRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  // ==============================
  // SMOOTHING VALUES
  // ==============================

  const smoothZoomRef = useRef(1);
  const smoothCenterRef = useRef({ x: 0.5, y: 0.5 });

  // ==============================
  // INITIALIZE LANDMARKER
  // ==============================

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (cachedLandmarker && cachedVersion === LANDMARKER_VERSION) {
        setIsLoading(false);
        return;
      }
      // Config changed — recreate the landmarker with updated settings
      cachedLandmarker = null;

      try {
        const vision = await getVisionPromise();

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            // CPU delegate is more reliable across browsers/devices than GPU
            delegate: "CPU",
          },

          runningMode: "VIDEO",
          numFaces: 1,

          // ==============================
          // HIGH ACCURACY SETTINGS
          // ==============================

          minFaceDetectionConfidence: 0.4,
          minTrackingConfidence: 0.4,
          minFacePresenceConfidence: 0.4,

          outputFaceBlendshapes: false,
        });

        if (!isMounted) return;

        cachedLandmarker = landmarker;
        cachedVersion = LANDMARKER_VERSION;
        setIsLoading(false);
      } catch (err) {
        console.error(err);
      }
    }

    init();

    return () => {
      isMounted = false;

      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // ==============================
  // MAIN DETECTION LOOP
  // ==============================

  useEffect(() => {
    if (
      !videoElement ||
      !cachedLandmarker ||
      !isActive ||
      isLoading
    )
      return;

    const detect = () => {
      if (
        !videoElement ||
        (videoElement instanceof HTMLVideoElement && (videoElement.paused || videoElement.ended))
      ) {
        requestRef.current = requestAnimationFrame(detect);
        return;
      }

      // ==============================
      // RUN ONLY ON NEW DATA FRAME
      // ==============================

      const isImage = videoElement instanceof HTMLImageElement;
      let shouldDetect = false;

      if (isImage) {
        shouldDetect = true;
      } else if (videoElement.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = videoElement.currentTime;
        shouldDetect = true;
      }

      if (shouldDetect) {
        const now = performance.now();

        try {
          const results = cachedLandmarker.detectForVideo(
            videoElement,
            now
          );

          if (
            results &&
            results.faceLandmarks &&
            results.faceLandmarks.length > 0
          ) {
            const landmarks = results.faceLandmarks[0];

            // ==============================
            // IMPORTANT LANDMARKS
            // ==============================

            const leftEye = landmarks[33];
            const rightEye = landmarks[263];
            const nose = landmarks[1];

            // ==============================
            // EYE DISTANCE
            // ==============================

            const dx = rightEye.x - leftEye.x;
            const dy = rightEye.y - leftEye.y;

            const eyeDistance = Math.sqrt(dx * dx + dy * dy);

            // ==============================
            // DEPTH USING Z AXIS
            // ==============================

            const avgDepth =
              (leftEye.z + rightEye.z + nose.z) / 3;

            // ==============================
            // COMBINED ZOOM CALCULATION
            // ==============================

            const zoomFromEyes = eyeDistance * 4.2;

            const zoomFromDepth = 1 - avgDepth * 2.5;

            let targetZoom =
              zoomFromEyes * 0.7 +
              zoomFromDepth * 0.3;

            // ==============================
            // LIMIT ZOOM RANGE
            // ==============================

            targetZoom = Math.max(1, Math.min(3, targetZoom));

            // ==============================
            // ULTRA SMOOTH FILTER
            // ==============================

            const zoomSmoothness = 0.08;

            smoothZoomRef.current +=
              (targetZoom - smoothZoomRef.current) *
              zoomSmoothness;

            // ==============================
            // FACE CENTER
            // ==============================

            const targetCenter = {
              x: nose.x,
              y: nose.y,
            };

            // ==============================
            // CENTER SMOOTHING
            // ==============================

            const centerSmoothness = 0.12;

            smoothCenterRef.current.x +=
              (targetCenter.x -
                smoothCenterRef.current.x) *
              centerSmoothness;

            smoothCenterRef.current.y +=
              (targetCenter.y -
                smoothCenterRef.current.y) *
              centerSmoothness;

            // ==============================
            // SEND DATA TO PARENT
            // ==============================

            onZoomChange?.({
              zoom: smoothZoomRef.current,
              center: smoothCenterRef.current,
              rawZoom: targetZoom,
              eyeDistance,
              depth: avgDepth,
            });

            onFaceData?.(results.faceLandmarks);
          } else {
            onFaceData?.([]);
          }
        } catch (err) {
          console.log(err);
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
  }, [
    videoElement,
    isActive,
    isLoading,
    onFaceData,
    onZoomChange,
  ]);

  return null;
};

getVisionPromise();

export default FaceTracker;