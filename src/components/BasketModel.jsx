import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Import custom images
import imgStoneBasket from '../images/Stone Basket.png';
import imgStudentCareer from '../images/Student Career.png';
import imgAdmission from '../images/Admission.png';
import imgExam from '../images/Exam.png';
import imgFinalViva from '../images/FInal Viva.png';
import imgResults from '../images/Final Results.png';
import imgInterview from '../images/Interview.png';
import imgJob from '../images/JOB.png';
import imgIncrement from '../images/Increment.png';
import imgBoss from '../images/Boss.png';
import imgWife from '../images/Wife.png';
import imgWeight from '../images/Weight.png';
import imgSabha from '../images/Sabha.png';

// Landmarks lookup
const FOREHEAD = 10;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;
const CHIN = 152;

const MILESTONES = [
  { id: "Student Career", label: "🎓 Student Career", img: imgStudentCareer },
  { id: "Admission", label: "📝 Admission", img: imgAdmission },
  { id: "Exam", label: "✍️ Exam", img: imgExam },
  { id: "FInal Viva", label: "🗣️ Final Viva", img: imgFinalViva },
  { id: "Results", label: "🏆 Results", img: imgResults },
  { id: "Interview", label: "👔 Interview", img: imgInterview },
  { id: "JOB", label: "💼 Job", img: imgJob },
  { id: "Increment", label: "💰 Increment", img: imgIncrement },
  { id: "Boss", label: "🧑‍💼 Boss", img: imgBoss },
  { id: "Wife", label: "❤️ Wife", img: imgWife },
  { id: "Weight", label: "⚖️ Weight", img: imgWeight },
  { id: "Sabha", label: "🕌 Sabha", img: imgSabha }
];

// 🌟 Floating Stardust Effect
const MagicalDust = () => {
  const pointsRef = useRef();
  const count = 300;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = Math.random() * 2.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5 - 0.5;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.06;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#dbbc87" size={0.025} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
};

// 🚀 Primary Exported AR Interface
const BasketModel = ({ faceIndex = 0, faceDataRef, isFrontCamera = true, selectedItems, videoElement, zoom = 1 }) => {
  const groupRef = useRef();
  const basketRef = useRef();
  const { viewport } = useThree();

  // Load dynamic textures
  const texStoneBasket = useTexture(imgStoneBasket);
  const texStudentCareer = useTexture(imgStudentCareer);
  const texAdmission = useTexture(imgAdmission);
  const texExam = useTexture(imgExam);
  const texFinalViva = useTexture(imgFinalViva);
  const texResults = useTexture(imgResults);
  const texInterview = useTexture(imgInterview);
  const texJob = useTexture(imgJob);
  const texIncrement = useTexture(imgIncrement);
  const texBoss = useTexture(imgBoss);
  const texWife = useTexture(imgWife);
  const texWeight = useTexture(imgWeight);
  const texSabha = useTexture(imgSabha);

  // 🎨 COLOR CALIBRATION
  useMemo(() => {
    const allTex = [
      texStoneBasket, texStudentCareer, texAdmission, texExam,
      texFinalViva, texResults, texInterview, texJob,
      texIncrement, texBoss, texWife, texWeight, texSabha
    ];
    allTex.forEach(t => {
      if (t) {
        t.colorSpace = THREE.SRGBColorSpace;
        t.needsUpdate = true;
      }
    });
  }, [
    texStoneBasket, texStudentCareer, texAdmission, texExam,
    texFinalViva, texResults, texInterview, texJob,
    texIncrement, texBoss, texWife, texWeight, texSabha
  ]);

  const textures = useMemo(() => ({
    "Student Career": texStudentCareer,
    "Admission": texAdmission,
    "Exam": texExam,
    "FInal Viva": texFinalViva,
    "Results": texResults,
    "Interview": texInterview,
    "JOB": texJob,
    "Increment": texIncrement,
    "Boss": texBoss,
    "Wife": texWife,
    "Weight": texWeight,
    "Sabha": texSabha,
  }), [
    texStudentCareer, texAdmission, texExam, texFinalViva, texResults,
    texInterview, texJob, texIncrement, texBoss, texWife, texWeight, texSabha
  ]);

  const activeItems = selectedItems || { "Student Career": true };

  const activeSelected = useMemo(() => {
    return MILESTONES.filter(m => activeItems[m.id]);
  }, [activeItems]);

  const currentScaleRef = useRef(1.0);
  const presenceScaleRef = useRef(0.0); // 📏 KINEMATIC ZOOM: Tracks 0..1 presence status
  const lastTrackedScaleRef = useRef(0.0); // 💾 PRESERVATION: Holds geometry for exit zoom

  useFrame((state) => {
    // 🚀 FIXED BASKET SCALE
    const targetBasketScale = 1.18;
    currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetBasketScale, 0.15);

    if (basketRef.current) {
      basketRef.current.scale.setScalar(currentScaleRef.current);
    }

    // Track face positioning
    if (!faceDataRef?.current || !groupRef.current) return;

    const faceLandmarks = faceDataRef.current[faceIndex];

    // 🏃‍♂️ TRACKING EXIT: Face lost, trigger smooth Zoom-Out shrink!
    if (!faceLandmarks) {
      presenceScaleRef.current = THREE.MathUtils.lerp(presenceScaleRef.current, 0.0, 0.16);
      
      // Hold the last valid tracking position and shrink the overall scale to zero!
      const exitScale = lastTrackedScaleRef.current * presenceScaleRef.current;
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, exitScale, 0.2));
      
      if (presenceScaleRef.current < 0.005) {
        groupRef.current.visible = false;
      }
      return;
    }

    // 🚀 TRACKING ENTRANCE: Face found, activate group and zoom-in presence to 1.0!
    groupRef.current.visible = true;
    presenceScaleRef.current = THREE.MathUtils.lerp(presenceScaleRef.current, 1.0, 0.10);

    // 📏 MATHEMATICAL ALIGNMENT CORRECTION FOR VIEWPORT CROPPING
    // Translates raw detected points (0..1) into viewport-aware spaces, removing standard mobile-shift offsets
    const getPoint = (idx) => {
      const pt = faceLandmarks[idx];
      if (!pt) return { x: 0.5, y: 0.5, z: 0 };

      let rawX = isFrontCamera ? 1.0 - pt.x : pt.x;
      let rawY = pt.y;

      let correctedX = rawX;
      let correctedY = rawY;

      // Corrects for 'object-fit: cover' aspect discrepancies (e.g. landscape camera vs portrait phone screen)
      if (videoElement && videoElement.videoWidth && videoElement.videoHeight) {
        const vW = videoElement.videoWidth;
        const vH = videoElement.videoHeight;
        const videoAspect = vW / vH;
        const canvasAspect = viewport.width / viewport.height;

        if (canvasAspect < videoAspect) {
          // Mobile Portrait: video is cropped heavily on horizontal left/right sides!
          const scale = videoAspect / canvasAspect;
          correctedX = (rawX - 0.5) * scale + 0.5;
        } else {
          // Desktop Widescreen: video may be cropped slightly on top/bottom!
          const scale = canvasAspect / videoAspect;
          correctedY = (rawY - 0.5) * scale + 0.5;
        }
      }

      return {
        x: correctedX,
        y: correctedY,
        z: pt.z
      };
    };

    const pLeft = getPoint(LEFT_CHEEK);
    const pRight = getPoint(RIGHT_CHEEK);
    const pForehead = getPoint(FOREHEAD);
    const pChin = getPoint(CHIN);

    // Use the aspect-corrected coordinates to generate physically sound widths!
    const faceWidth = Math.sqrt(
      Math.pow(pRight.x - pLeft.x, 2) +
      Math.pow(pRight.y - pLeft.y, 2)
    );

    const faceHeight = Math.sqrt(
      Math.pow(pForehead.x - pChin.x, 2) +
      Math.pow(pForehead.y - pChin.y, 2)
    );

    const vRight = new THREE.Vector3(pRight.x - pLeft.x, -(pRight.y - pLeft.y), pRight.z - pLeft.z).normalize();
    const vUpRaw = new THREE.Vector3(pForehead.x - pChin.x, -(pForehead.y - pChin.y), pForehead.z - pChin.z).normalize();
    const vForward = new THREE.Vector3().crossVectors(vRight, vUpRaw).normalize();
    const vUp = new THREE.Vector3().crossVectors(vForward, vRight).normalize();

    // 📏 PERSPECTIVE PROJECTION LOCK
    const cameraZ = 8; // Defined distance of perspective camera inside Canvas
    const z = pForehead.z * -11.5;
    
    // Compute projection scale to correct perspective division shift as face moves depth-wise or off-axis
    const projectionScale = (cameraZ - z) / cameraZ;

    // Compute exact pixel-perfect viewport coordinates, dynamically scaled to active depth plane!
    const x = (pForehead.x - 0.5) * viewport.width * projectionScale;
    const y = -(pForehead.y - 0.5) * viewport.height * projectionScale;

    const headPos = new THREE.Vector3(x, y, z);
    
    // Compute physical heights at target depth so offset remains constant and locked above head
    const physicalFaceHeight = faceHeight * viewport.height * projectionScale;
    
    // 📏 ZOOM-ADAPTIVE BOUNDING: As magnification increases, gently nest the basket tighter onto the head.
    // This guarantees the basket stays fully visible inside highly cropped zoomed viewports!
    const zoomCorrection = zoom === 1 ? 1.0 : zoom === 2 ? 0.86 : zoom === 3 ? 0.76 : 0.66;
    const upwardOffset = physicalFaceHeight * (0.18 * zoomCorrection);
    
    const targetPos = headPos.clone().addScaledVector(vUp, upwardOffset);

    const damping = 0.25;
    groupRef.current.position.lerp(targetPos, damping);

    // 🚀 ABSOLUTE PHYSICAL SCALING: Translate 2D screen size into constant 3D world units
    const physicalFaceWidth = faceWidth * viewport.width * projectionScale;
    
    // Multiply physical width by the exact pre-configured user constant (0.50)
    const targetScaleFactor = physicalFaceWidth * 0.50;
    
    // Store for the graceful exit animation later!
    lastTrackedScaleRef.current = targetScaleFactor;

    // Apply entrance dynamic zoom factor!
    const finalScaleFactor = targetScaleFactor * presenceScaleRef.current;
    const targetScale = new THREE.Vector3(finalScaleFactor, finalScaleFactor, finalScaleFactor);

    groupRef.current.scale.lerp(targetScale, damping);

    const rotMat = new THREE.Matrix4();
    rotMat.makeBasis(vRight, vUp, vForward);
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMat);
    groupRef.current.quaternion.slerp(targetQuat, damping);
  });

  return (
    <group ref={groupRef} dispose={null}>

      {/* 1. 🧺 Enlarged Fixed Size Custom Image-Based Basket */}
      <group ref={basketRef}>
        <mesh
          rotation={[(isFrontCamera ? 1 : -1) * (Math.PI / 24), isFrontCamera ? Math.PI : 0, 0]}
          position={[0, 0.05, 0.0]}
          castShadow
          receiveShadow
        >
          {/* 🚀 ENLARGED GEOMETRY: Widened base size to 2.65 to guarantee huge presence on screen! */}
          <planeGeometry args={[2.65, 1.76]} />
          {/* 🌈 PERFECT 1:1 COLOR UPGRADE */}
          <meshBasicMaterial
            map={texStoneBasket}
            transparent={true}
            alphaTest={0.15}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* 2. 🪨 ENLARGED 3D Selected Milestone Pictures Stack */}
      <group>
        {activeSelected.length === 0 ? (
          <Html center position={[0, 0.8, 0.1]} distanceFactor={4.5}>
            <div className="text-amber-500/75 font-mono text-xs italic tracking-widest bg-stone-950/80 px-5 py-2.5 rounded-full border border-amber-500/30 shadow-2xl animate-pulse select-none pointer-events-none">
              💡 Check milestones to stack items!
            </div>
          </Html>
        ) : (
          activeSelected.map((item, index) => {
            const texture = textures[item.id];

            // Increased the step slightly from 0.60 to 0.66 to reach the absolute perfect visual gap!
            const yPos = 0.72 + index * 0.66;

            const xOffset = (index % 2 === 0 ? -0.035 : 0.035);
            const zOffset = 0.15 + (index * 0.015);
            const zRot = (index % 2 === 0 ? -0.035 : 0.035);
            const xRot = (isFrontCamera ? 1 : -1) * (Math.PI / 14);

            return (
              <mesh
                key={item.id}
                position={[xOffset, yPos, zOffset]}
                rotation={[xRot, isFrontCamera ? Math.PI : 0, zRot]}
                castShadow
                receiveShadow
              >
                {/* 🚀 ENLARGED STONE GEOMETRY: Upscaled to 2.3 to fit fully across the expanded 2.65 wide basket! */}
                <planeGeometry args={[2.3, 1.53]} />
                <meshBasicMaterial
                  map={texture}
                  transparent={true}
                  alphaTest={0.15}
                  side={THREE.DoubleSide}
                  toneMapped={false}
                />
              </mesh>
            );
          })
        )}
      </group>

      {/* 3. 🌟 Particle Atmosphere */}
      <MagicalDust />

    </group>
  );
};

// Preload
useTexture.preload(imgStoneBasket);
MILESTONES.forEach(m => {
  useTexture.preload(m.img);
});

export default BasketModel;
