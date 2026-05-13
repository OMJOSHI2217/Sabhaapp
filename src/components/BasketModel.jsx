import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Landmarks lookup for placement
const FOREHEAD = 10;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;
const CHIN = 152;

// Sequence parameters from polished HTML
const SEQUENCE_WORDS = ["JOB", "VIVA", "ASSIGNMENT", "EXAM"];
const SCALE_STEP = 0.4; // Dramatically increased growth rate per word

// 🧺 Handcrafted Procedural 3D Woven Basket Component
const ProceduralBasket = () => {
  const height = 0.85;
  const rBase = 0.76;
  const rTop = 1.05;
  const ribCount = 36;
  const ringCount = 9;
  
  const slantHeight = Math.sqrt(height * height + Math.pow(rTop - rBase, 2));
  const tiltAngle = Math.atan2(rTop - rBase, height);
  const midRadius = (rBase + rTop) / 2;

  // Materials optimized for AR realism
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#8b5a2b', 
    roughness: 0.55, 
    metalness: 0.2 
  }), []);

  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#e5b83c', 
    roughness: 0.28, 
    metalness: 0.78, 
    emissive: '#442200', 
    emissiveIntensity: 0.12 
  }), []);

  const darkWoodMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#5a3a1a', 
    roughness: 0.8 
  }), []);

  // Spline-based arching handle
  const handleCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.95, height - 0.05, 0.55),
    new THREE.Vector3(0.45, height + 0.35, 0.85),
    new THREE.Vector3(0, height + 0.52, 0.92),
    new THREE.Vector3(-0.45, height + 0.35, 0.85),
    new THREE.Vector3(-0.95, height - 0.05, 0.55)
  ]), [height]);

  // Generates 40 rich randomized interior pebbles
  const pebbleData = useMemo(() => {
    return Array.from({ length: 40 }).map(() => ({
      pos: [
        (Math.random() - 0.5) * 1.2,
        0.08 + Math.random() * 0.32,
        (Math.random() - 0.5) * 1.2
      ],
      rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      scale: 0.04 + Math.random() * 0.015
    }));
  }, []);

  return (
    <group position={[0, -0.12, 0]}>
      {/* 1. Base Disc */}
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow material={darkWoodMat}>
        <cylinderGeometry args={[rBase - 0.02, rBase - 0.02, 0.07, 32]} />
      </mesh>

      {/* 2. 36 Ribs */}
      {Array.from({ length: ribCount }).map((_, i) => {
        const angle = (i / ribCount) * Math.PI * 2;
        return (
          <mesh 
            key={`rib-${i}`} 
            position={[Math.cos(angle) * midRadius, height / 2, Math.sin(angle) * midRadius]} 
            rotation={[tiltAngle * 0.7, 0, -angle]} 
            castShadow
            material={woodMat}
          >
            <cylinderGeometry args={[0.028, 0.028, slantHeight, 6]} />
          </mesh>
        );
      })}

      {/* 3. Alternating Torus Rings */}
      {Array.from({ length: ringCount }).map((_, i) => {
        const t = i / (ringCount - 1);
        const yPos = t * height;
        const ringRad = rBase + (rTop - rBase) * t;
        const isGold = (i % 3 === 1);
        return (
          <mesh 
            key={`ring-${i}`} 
            position={[0, yPos, 0]} 
            rotation={[Math.PI / 2, 0, 0]} 
            castShadow
            material={isGold ? goldMat : woodMat}
          >
            <torusGeometry args={[ringRad, isGold ? 0.023 : 0.018, 24, 80]} />
          </mesh>
        );
      })}

      {/* 4. Hand-polished Rim */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={woodMat}>
        <torusGeometry args={[rTop, 0.058, 24, 96]} />
      </mesh>
      <mesh position={[0, height + 0.025, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={goldMat}>
        <torusGeometry args={[rTop - 0.02, 0.024, 16, 96]} />
      </mesh>

      {/* 5. Braided Curved Dual-Handle */}
      <mesh castShadow material={woodMat}>
        <tubeGeometry args={[handleCurve, 28, 0.048, 10, false]} />
      </mesh>
      <mesh castShadow material={goldMat}>
        <tubeGeometry args={[handleCurve, 28, 0.02, 8, false]} />
      </mesh>

      {/* 6. 40 Pebbles Cluster */}
      {pebbleData.map((peb, i) => (
        <mesh key={`peb-${i}`} position={peb.pos} rotation={peb.rot} castShadow>
          <dodecahedronGeometry args={[peb.scale]} />
          <meshStandardMaterial color="#9e8b72" roughness={0.65} />
        </mesh>
      ))}
    </group>
  );
};

// 🪨 Dynamic Milestone Stone (Enlarged + orbiting ring of 10 small stones)
const SequentialStone = ({ currentWord, bumpFactor }) => {
  const ringRef = useRef();
  const stoneRef = useRef();
  
  // Material for surrounding ring stones
  const ringStoneMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#9aa9b3', 
    roughness: 0.55 
  }), []);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.elapsedTime * 0.35;
    }
    if (stoneRef.current) {
      const bump = 1.0 + bumpFactor * 0.15;
      const idleHover = Math.sin(state.clock.elapsedTime * 2.5) * 0.03;
      stoneRef.current.scale.set(0.92 * bump, 0.72 * bump + idleHover, 0.88 * bump);
    }
  });

  return (
    <group position={[0, 0.48, 0.18]}>
      {/* 1. Enlarged Central Dodecahedron Stone */}
      <mesh ref={stoneRef} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.58]} />
        <meshStandardMaterial 
          color="#c3b59b" 
          roughness={0.4} 
          metalness={0.07} 
          emissive="#332200" 
          emissiveIntensity={0.1} 
        />
      </mesh>

      {/* 2. Responsive "Cinema" Stylized Floating HUD Text */}
      <Html 
        position={[0, 0.65, 0.15]} 
        center 
        distanceFactor={4.5}
        zIndexRange={[10, 100]}
      >
        <div style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: "16px",
          fontWeight: "800",
          fontStyle: "italic",
          color: "#fdf0d5",
          textShadow: "3px 3px 0px #3a2a1f, 2px 2px 6px black",
          letterSpacing: "3px",
          background: "rgba(20, 15, 8, 0.86)",
          padding: "8px 24px",
          borderRadius: "60px",
          borderLeft: "4px solid #eab308",
          borderRight: "1px solid #b5762e",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
          boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
          transform: `scale(${1.0 + bumpFactor * 0.1})`,
          transition: 'transform 0.1s ease-out'
        }}>
          {currentWord}
        </div>
      </Html>

      {/* 3. Expanded 10 Orbiting Small Stone Ring */}
      <group ref={ringRef}>
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const rad = 0.9; // Calibrated radius
          return (
            <mesh 
              key={`orb-stone-${i}`} 
              position={[Math.cos(angle) * rad, 0.15 + Math.sin(angle * 1.5) * 0.1, Math.sin(angle) * rad]} 
              castShadow
              material={ringStoneMat}
            >
              <dodecahedronGeometry args={[0.13]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

// 🌟 Floating Stardust System
const MagicalDust = () => {
  const pointsRef = useRef();
  const count = 400;

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
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#dbbc87" size={0.025} transparent opacity={0.45} sizeAttenuation />
    </points>
  );
};

// 🚀 Ported AR Core Face Tracking Model
const BasketModel = ({ faceIndex = 0, faceDataRef, isFrontCamera = true }) => {
  const groupRef = useRef();
  const basketRef = useRef();
  const glowRef = useRef();
  const spotRef = useRef();
  const bumpRef = useRef(0);
  
  const { viewport } = useThree();

  // Sequential word rotation states
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentScaleRef = useRef(1.0);

  // Sequence loop: rotates every 4.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SEQUENCE_WORDS.length);
      bumpRef.current = 1.0; // Fires pop triggers
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useFrame((state) => {
    // Decay pops
    bumpRef.current = THREE.MathUtils.lerp(bumpRef.current, 0, 0.15);

    // Increment and smoothly interpolate basket growth
    const targetBasketScale = 1.0 + currentIndex * SCALE_STEP;
    currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetBasketScale, 0.12);

    if (basketRef.current) {
      basketRef.current.scale.setScalar(currentScaleRef.current);
    }

    if (!faceDataRef?.current || !groupRef.current) return;

    const faceLandmarks = faceDataRef.current[faceIndex];

    if (!faceLandmarks) {
      groupRef.current.visible = THREE.MathUtils.lerp(groupRef.current.visible ? 1 : 0, 0, 0.1) > 0.05;
      return;
    }

    groupRef.current.visible = true;

    // Real-time Lighting Pulses (from Vanilla code)
    const time = state.clock.elapsedTime;
    if (glowRef.current) {
      const pulse = 1.4 + Math.sin(time * 4) * 0.3;
      const popFlash = bumpRef.current * 1.4;
      glowRef.current.intensity = pulse + popFlash;
    }
    if (spotRef.current) {
      spotRef.current.intensity = 0.9 + Math.sin(time * 2.0) * 0.2;
    }

    // Math mapping
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

    // 3D Basis Vectors
    const vRight = new THREE.Vector3(pRight.x - pLeft.x, -(pRight.y - pLeft.y), pRight.z - pLeft.z).normalize();
    const vUpRaw = new THREE.Vector3(pForehead.x - pChin.x, -(pForehead.y - pChin.y), pForehead.z - pChin.z).normalize();
    const vForward = new THREE.Vector3().crossVectors(vRight, vUpRaw).normalize();
    const vUp = new THREE.Vector3().crossVectors(vForward, vRight).normalize();

    // Projection onto live AR Viewport
    const x = (pForehead.x - 0.5) * viewport.width;
    const y = -(pForehead.y - 0.5) * viewport.height;
    const z = pForehead.z * -11.5;

    const headPos = new THREE.Vector3(x, y, z);
    const upwardOffset = faceHeight * (viewport.height * 0.22); 
    const targetPos = headPos.clone().addScaledVector(vUp, upwardOffset);

    // Global Group Scale Calibration
    const baseScale = viewport.width * 0.46; 
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

  const activeWord = SEQUENCE_WORDS[currentIndex];

  return (
    <group ref={groupRef} dispose={null}>
      {/* 📺 Integrated Floating AR HUD HUD Overlays */}
      <Html fullscreen style={{ pointerEvents: 'none', userSelect: 'none' }}>
        {/* 📜 Top Left: Live Sequence Info */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '12px 24px',
          borderRadius: '50px',
          color: '#eab308',
          fontFamily: 'monospace',
          fontSize: '15px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          borderBottom: '2px solid #eab308',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 200
        }}>
          📜 CURRENT: <span style={{ color: '#fef08a' }}>{activeWord}</span>
        </div>

        {/* ✨ Top Right: Dynamic AR Sequence Badge */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          padding: '6px 14px',
          borderRadius: '30px',
          color: '#ccc',
          fontSize: '10px',
          fontFamily: 'monospace',
          zIndex: 200
        }}>
          ✨ AR SEQUENCE | JOB → VIVA → ASSIGNMENT → EXAM ✨
        </div>

        {/* 🎯 Bottom Left: Core HUD Instructions */}
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '20px',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          padding: '5px 12px',
          borderRadius: '20px',
          fontSize: '10px',
          color: '#aaa',
          fontFamily: 'monospace',
          zIndex: 200
        }}>
          🎯 Position your face in frame | Basket follows your head
        </div>

        {/* 📦 Bottom Right: Polished Basket Growth Badge */}
        <div style={{
          position: 'absolute',
          bottom: '100px',
          right: '20px',
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          padding: '6px 14px',
          borderRadius: '30px',
          color: '#eab308',
          fontSize: '12px',
          fontFamily: 'monospace',
          borderLeft: '2px solid #eab308',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 200
        }}>
          📦 Basket Size: {currentScaleRef.current.toFixed(2)}x
        </div>
      </Html>

      {/* 1. 🧺 Scaling Basket Group */}
      <group ref={basketRef}>
        <ProceduralBasket />
      </group>

      {/* 2. 🪨 Polished Stone Monument */}
      <SequentialStone currentWord={activeWord} bumpFactor={bumpRef.current} />

      {/* 3. 🌟 Particle Swirl */}
      <MagicalDust />

      {/* 4. 💡 Handcrafted Lighting Set (Rich Realism) */}
      <ambientLight intensity={0.7} color="#404060" />
      
      <pointLight 
        ref={glowRef}
        color="#d48c54" 
        intensity={1.4} 
        distance={4.5} 
        position={[0, 0.8, 0.25]} 
        castShadow 
      />

      <spotLight 
        ref={spotRef}
        color="#ffdd99" 
        intensity={1.0} 
        position={[0, 3.5, 0.9]} 
        castShadow 
      />
      
      <pointLight color="#88aaff" intensity={0.55} position={[-1.2, 2.5, -2]} />
    </group>
  );
};

export default BasketModel;
