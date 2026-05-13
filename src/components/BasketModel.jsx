import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Import custom images
import imgStoneBasket from '../images/Stone Basket.png';
import imgAdmission from '../images/Admission.png';
import imgExam from '../images/Exam.png';
import imgIncrement from '../images/Increment.png';
import imgInterview from '../images/Interview.png';
import imgResults from '../images/Results.png';
import imgStudentCareer from '../images/Student Career.png';
import imgWife from '../images/Wife.png';

// Landmarks lookup
const FOREHEAD = 10;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;
const CHIN = 152;

const MILESTONES = [
  { id: "Student Career", label: "🎓 Student Career", img: imgStudentCareer },
  { id: "Admission", label: "📝 Admission", img: imgAdmission },
  { id: "Exam", label: "✍️ Exam", img: imgExam },
  { id: "Results", label: "🏆 Results", img: imgResults },
  { id: "Interview", label: "👔 Interview", img: imgInterview },
  { id: "Increment", label: "💰 Increment", img: imgIncrement },
  { id: "Wife", label: "❤️ Wife", img: imgWife }
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

// 🚀 Primary Exported AR Interface (Accepts selectedItems from parent state)
const BasketModel = ({ faceIndex = 0, faceDataRef, isFrontCamera = true, selectedItems }) => {
  const groupRef = useRef();
  const basketRef = useRef();
  const { viewport } = useThree();

  // Load dynamic textures
  const texStoneBasket = useTexture(imgStoneBasket);
  const texAdmission = useTexture(imgAdmission);
  const texExam = useTexture(imgExam);
  const texIncrement = useTexture(imgIncrement);
  const texInterview = useTexture(imgInterview);
  const texResults = useTexture(imgResults);
  const texStudentCareer = useTexture(imgStudentCareer);
  const texWife = useTexture(imgWife);

  // 🎨 COLOR CALIBRATION: Bind sRGB colorspace to all textures instantly to fix washed out/dim gray colors!
  useMemo(() => {
    const allTex = [
      texStoneBasket, texAdmission, texExam, texIncrement, 
      texInterview, texResults, texStudentCareer, texWife
    ];
    allTex.forEach(t => {
      if (t) {
        t.colorSpace = THREE.SRGBColorSpace; // Standard Web 1:1 color space
        t.needsUpdate = true;
      }
    });
  }, [texStoneBasket, texAdmission, texExam, texIncrement, texInterview, texResults, texStudentCareer, texWife]);

  const textures = useMemo(() => ({
    "Student Career": texStudentCareer,
    "Admission": texAdmission,
    "Exam": texExam,
    "Results": texResults,
    "Interview": texInterview,
    "Increment": texIncrement,
    "Wife": texWife,
  }), [texStudentCareer, texAdmission, texExam, texResults, texInterview, texIncrement, texWife]);

  const activeItems = selectedItems || { "Student Career": true };

  const activeSelected = useMemo(() => {
    return MILESTONES.filter(m => activeItems[m.id]);
  }, [activeItems]);

  const currentScaleRef = useRef(1.0);

  useFrame((state) => {
    // 🚀 FIXED BASKET SCALE: Locked exactly at 1.18x!
    const targetBasketScale = 1.18;
    currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetBasketScale, 0.15);

    if (basketRef.current) {
      basketRef.current.scale.setScalar(currentScaleRef.current);
    }

    // Track face positioning
    if (!faceDataRef?.current || !groupRef.current) return;

    const faceLandmarks = faceDataRef.current[faceIndex];

    if (!faceLandmarks) {
      groupRef.current.visible = THREE.MathUtils.lerp(groupRef.current.visible ? 1 : 0, 0, 0.1) > 0.05;
      return;
    }

    groupRef.current.visible = true;

    const getPoint = (idx) => {
      const pt = faceLandmarks[idx];
      if (!pt) return { x: 0.5, y: 0.5, z: 0 };
      return {
        x: isFrontCamera ? 1.0 - pt.x : pt.x,
        y: pt.y,
        z: pt.z
      };
    };

    const pLeft = getPoint(LEFT_CHEEK);
    const pRight = getPoint(RIGHT_CHEEK);
    const pForehead = getPoint(FOREHEAD);
    const pChin = getPoint(CHIN);

    const faceWidth = Math.sqrt(
      Math.pow(pRight.x - pLeft.x, 2) +
      Math.pow(pRight.y - pLeft.y, 2) +
      Math.pow(pRight.z - pLeft.z, 2)
    );

    const faceHeight = Math.sqrt(
      Math.pow(pForehead.x - pChin.x, 2) +
      Math.pow(pForehead.y - pChin.y, 2) +
      Math.pow(pForehead.z - pChin.z, 2)
    );

    const vRight = new THREE.Vector3(pRight.x - pLeft.x, -(pRight.y - pLeft.y), pRight.z - pLeft.z).normalize();
    const vUpRaw = new THREE.Vector3(pForehead.x - pChin.x, -(pForehead.y - pChin.y), pForehead.z - pChin.z).normalize();
    const vForward = new THREE.Vector3().crossVectors(vRight, vUpRaw).normalize();
    const vUp = new THREE.Vector3().crossVectors(vForward, vRight).normalize();

    const x = (pForehead.x - 0.5) * viewport.width;
    const y = -(pForehead.y - 0.5) * viewport.height;
    const z = pForehead.z * -11.5;

    const headPos = new THREE.Vector3(x, y, z);
    const upwardOffset = faceHeight * (viewport.height * 0.18); 
    const targetPos = headPos.clone().addScaledVector(vUp, upwardOffset);

    const baseScale = viewport.width * 0.64; 
    const targetScaleFactor = faceWidth * baseScale;
    const targetScale = new THREE.Vector3(targetScaleFactor, targetScaleFactor, targetScaleFactor);

    const damping = 0.25;
    groupRef.current.position.lerp(targetPos, damping);
    groupRef.current.scale.lerp(targetScale, damping);

    const rotMat = new THREE.Matrix4();
    rotMat.makeBasis(vRight, vUp, vForward);
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMat);
    groupRef.current.quaternion.slerp(targetQuat, damping);
  });

  return (
    <group ref={groupRef} dispose={null}>
      
      {/* 1. 🧺 Fixed Size Custom Image-Based Basket */}
      <group ref={basketRef}>
        <mesh 
          rotation={[(isFrontCamera ? 1 : -1) * (Math.PI / 24), isFrontCamera ? Math.PI : 0, 0]}
          position={[0, 0.05, 0.0]} 
          castShadow 
          receiveShadow
        >
          <planeGeometry args={[2.4, 1.6]} />
          {/* 🌈 PERFECT 1:1 COLOR UPGRADE: Switched to meshBasicMaterial with toneMapped={false} for zero tint distortion! */}
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
            
            // Elevated start pos from 0.34 to 0.66 as user manually calibrated
            const yPos = 0.66 + index * 0.68;
            
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
                <planeGeometry args={[2.1, 1.4]} />
                {/* 🌈 PERFECT 1:1 COLOR UPGRADE: Renders PNG file exact color without gray/blue 3D light tints! */}
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
