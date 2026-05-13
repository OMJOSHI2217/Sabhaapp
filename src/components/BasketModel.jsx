import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Landmarks lookup for placement
const FOREHEAD = 10;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;
const CHIN = 152;

// Sequence data
const SEQUENCE_WORDS = ["JOB", "VIVA", "ASSIGNMENT", "EXAM"];
const SCALE_INCREMENT = 0.35;

// 🧺 Premium Procedural 3D Woven Basket Component
const ProceduralBasket = ({ scale = 1.0 }) => {
  const height = 0.85;
  const rBase = 0.76;
  const rTop = 1.05;
  const ribCount = 36;
  const ringCount = 9;
  
  const slantHeight = Math.sqrt(height * height + Math.pow(rTop - rBase, 2));
  const tiltAngle = Math.atan2(rTop - rBase, height);
  const midRadius = (rBase + rTop) / 2;

  // Procedural materials from HTML
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#8b5a2b', 
    roughness: 0.55, 
    metalness: 0.2 
  }), []);

  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#e5b83c', 
    roughness: 0.3, 
    metalness: 0.75, 
    emissive: '#442200', 
    emissiveIntensity: 0.1 
  }), []);

  const darkWoodMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#5a3a1a', 
    roughness: 0.8 
  }), []);

  // Elegant spline-curve handle
  const handleCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.95, height - 0.05, 0.55),
    new THREE.Vector3(0.45, height + 0.35, 0.85),
    new THREE.Vector3(0, height + 0.52, 0.92),
    new THREE.Vector3(-0.45, height + 0.35, 0.85),
    new THREE.Vector3(-0.95, height - 0.05, 0.55)
  ]), [height]);

  // 35 randomized interior pebbles
  const pebbleData = useMemo(() => {
    return Array.from({ length: 35 }).map(() => ({
      pos: [
        (Math.random() - 0.5) * 1.15,
        0.1 + Math.random() * 0.3,
        (Math.random() - 0.5) * 1.15
      ],
      rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      scale: 0.03 + Math.random() * 0.02
    }));
  }, []);

  return (
    <group position={[0, -0.1, 0]}>
      {/* 1. Solid Dark Wood Base */}
      <mesh position={[0, 0.02, 0]} receiveShadow castShadow material={darkWoodMat}>
        <cylinderGeometry args={[rBase - 0.02, rBase - 0.02, 0.06, 32]} />
      </mesh>

      {/* 2. 36 Interweaving Ribs */}
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

      {/* 3. 9 Horizontal Rings (Wood/Gold alternation) */}
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
            <torusGeometry args={[ringRad, isGold ? 0.022 : 0.018, 24, 80]} />
          </mesh>
        );
      })}

      {/* 4. Luxurious Woven Rim */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={woodMat}>
        <torusGeometry args={[rTop, 0.055, 24, 96]} />
      </mesh>
      <mesh position={[0, height + 0.025, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={goldMat}>
        <torusGeometry args={[rTop - 0.02, 0.023, 16, 96]} />
      </mesh>

      {/* 5. Elegant Curved Double-Handle */}
      <mesh castShadow material={woodMat}>
        <tubeGeometry args={[handleCurve, 28, 0.045, 10, false]} />
      </mesh>
      <mesh castShadow material={goldMat}>
        <tubeGeometry args={[handleCurve, 28, 0.018, 8, false]} />
      </mesh>

      {/* 6. Scatter of Interior Pebbles */}
      {pebbleData.map((peb, i) => (
        <mesh key={`peb-${i}`} position={peb.pos} rotation={peb.rot} castShadow>
          <dodecahedronGeometry args={[peb.scale]} />
          <meshStandardMaterial color="#9e8b72" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

// 🪨 Dynamic Stone Stack Component (cycles through JOB, VIVA, ASSIGNMENT, EXAM)
const SequentialStone = ({ currentWord, bumpFactor }) => {
  const groupRef = useRef();
  const stoneRef = useRef();
  
  // Additional small decorative stones revolving around base
  const smallStoneMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: '#9aa9b3', 
    roughness: 0.55 
  }), []);

  useFrame((state) => {
    if (groupRef.current) {
      // Gently rotate the decorative ring
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
    if (stoneRef.current) {
      // Apply dynamic bump scale and subtle idle hover
      const bumpScale = 1.0 + bumpFactor * 0.15;
      const hover = Math.sin(state.clock.elapsedTime * 2.5) * 0.03;
      stoneRef.current.scale.set(0.9 * bumpScale, 0.7 * bumpScale + hover, 0.85 * bumpScale);
    }
  });

  return (
    <group position={[0, 0.45, 0.15]}>
      {/* 1. The Main Central Dynamic Stone */}
      <mesh ref={stoneRef} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.55]} />
        <meshStandardMaterial 
          color="#b7aa87" 
          roughness={0.4} 
          metalness={0.08} 
          emissive="#332200" 
          emissiveIntensity={0.15} 
        />
      </mesh>

      {/* 2. Dynamic Floating Text Label */}
      <Html 
        position={[0, 0.58, 0.12]} 
        center 
        distanceFactor={4.5}
        zIndexRange={[10, 100]}
      >
        <div style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: "15px",
          fontWeight: "800",
          fontStyle: "italic",
          color: "#fdf0d5",
          textShadow: "2px 2px 0px #3a2a1f, 2px 2px 6px black",
          letterSpacing: "3px",
          background: "rgba(20, 15, 8, 0.82)",
          padding: "7px 18px",
          borderRadius: "50px",
          borderLeft: "4px solid #e5b83c",
          borderRight: "1px solid #b5762e",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
          boxShadow: "0 5px 15px rgba(0,0,0,0.4)",
          transform: `scale(${1.0 + bumpFactor * 0.1})`,
          transition: 'transform 0.1s ease-out'
        }}>
          {currentWord}
        </div>
      </Html>

      {/* 3. Revolving Small Decorative Stone Ring */}
      <group ref={groupRef}>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const rad = 0.85;
          return (
            <mesh 
              key={`small-stone-${i}`} 
              position={[Math.cos(angle) * rad, 0.2 + Math.sin(angle * 2) * 0.1, Math.sin(angle) * rad]} 
              castShadow
              material={smallStoneMat}
            >
              <dodecahedronGeometry args={[0.12]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

// 🌟 Magical Particle Cloud
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

// 🚀 Main Exported Face Tracking Basket Model
const BasketModel = ({ faceIndex = 0, faceDataRef, isFrontCamera = true }) => {
  const groupRef = useRef();
  const basketRef = useRef();
  const glowRef = useRef();
  const spotRef = useRef();
  const bumpRef = useRef(0);
  
  const { viewport } = useThree();

  // Sequence State Management
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentScaleRef = useRef(1.0);

  // Cycle word every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SEQUENCE_WORDS.length);
      bumpRef.current = 1.0; // Trigger dynamic scaling pop and light flash!
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useFrame((state) => {
    // Decay pop/bump factor smoothly
    bumpRef.current = THREE.MathUtils.lerp(bumpRef.current, 0, 0.15);

    // Smoothly grow basket scale (target scale is 1.0 + increment)
    const targetProceduralScale = 1.0 + currentIndex * SCALE_INCREMENT;
    currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetProceduralScale, 0.12);

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

    // Dynamic Light Updates (flashes bright on word change)
    const time = state.clock.elapsedTime;
    if (glowRef.current) {
      const baseIntensity = 1.4 + Math.sin(time * 3) * 0.3;
      const flashEffect = bumpRef.current * 1.2;
      glowRef.current.intensity = baseIntensity + flashEffect;
    }
    if (spotRef.current) {
      spotRef.current.intensity = 0.8 + Math.sin(time * 2.0) * 0.15;
    }

    // Mirror mapping
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

    // Dimensions
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

    // Orientation
    const vRight = new THREE.Vector3(pRight.x - pLeft.x, -(pRight.y - pLeft.y), pRight.z - pLeft.z).normalize();
    const vUpRaw = new THREE.Vector3(pForehead.x - pChin.x, -(pForehead.y - pChin.y), pForehead.z - pChin.z).normalize();
    const vForward = new THREE.Vector3().crossVectors(vRight, vUpRaw).normalize();
    const vUp = new THREE.Vector3().crossVectors(vForward, vRight).normalize();

    // Positioning
    const x = (pForehead.x - 0.5) * viewport.width;
    const y = -(pForehead.y - 0.5) * viewport.height;
    const z = pForehead.z * -12;

    const headPos = new THREE.Vector3(x, y, z);
    const upwardOffset = faceHeight * (viewport.height * 0.21); 
    const targetPos = headPos.clone().addScaledVector(vUp, upwardOffset);

    // Global face scale factor
    const baseScale = viewport.width * 0.45; 
    const targetScaleFactor = faceWidth * baseScale;
    const targetScale = new THREE.Vector3(targetScaleFactor, targetScaleFactor, targetScaleFactor);

    const damping = 0.25;
    groupRef.current.position.lerp(targetPos, damping);
    groupRef.current.scale.lerp(targetScale, damping);

    // Rotations
    const rotMat = new THREE.Matrix4();
    rotMat.makeBasis(vRight, vUp, vForward);
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMat);
    groupRef.current.quaternion.slerp(targetQuat, damping);
  });

  const activeWord = SEQUENCE_WORDS[currentIndex];

  return (
    <group ref={groupRef} dispose={null}>
      {/* 📜 Fullscreen DOM HUD Layer */}
      <Html fullscreen style={{ pointerEvents: 'none', userSelect: 'none' }}>
        {/* Left corner current sequence HUD */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '12px 26px',
          borderRadius: '50px',
          color: '#eab308',
          fontFamily: 'monospace',
          fontSize: '16px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          borderBottom: '2px solid #eab308',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 200
        }}>
          📜 CURRENT: <span style={{ color: '#fef08a' }}>{activeWord}</span>
        </div>

        {/* Right side size scale HUD */}
        <div style={{
          position: 'absolute',
          bottom: '90px',
          right: '20px',
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          padding: '8px 18px',
          borderRadius: '25px',
          color: '#eab308',
          fontSize: '11px',
          fontFamily: 'monospace',
          borderLeft: '2px solid #eab308',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 200
        }}>
          📏 Basket Scale: <span style={{ fontWeight: 'bold' }}>{currentScaleRef.current.toFixed(2)}x</span>
        </div>
      </Html>

      {/* 1. 🧺 Woven Basket Group (animates procedural scaling) */}
      <group ref={basketRef}>
        <ProceduralBasket />
      </group>

      {/* 2. 🪨 Sequential Main Stone & Orbiting Stones */}
      <SequentialStone currentWord={activeWord} bumpFactor={bumpRef.current} />

      {/* 3. 🌟 Particle Cloud */}
      <MagicalDust />

      {/* 4. 💡 Illumination Structure */}
      <ambientLight intensity={0.55} color="#404060" />
      
      <pointLight 
        ref={glowRef}
        color="#f59e0b" 
        intensity={1.4} 
        distance={4} 
        position={[0, 0.7, 0.3]} 
        castShadow 
      />

      <spotLight 
        ref={spotRef}
        color="#ffdd99" 
        intensity={0.8} 
        position={[0, 3.2, 0.8]} 
        castShadow 
      />
      
      <pointLight color="#88aaff" intensity={0.5} position={[-1.2, 2.5, -2]} />
    </group>
  );
};

export default BasketModel;
