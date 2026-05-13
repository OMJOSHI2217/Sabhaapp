import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Landmarks lookup for placement
const FOREHEAD = 10;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;
const CHIN = 152;

// 🧺 Ultra-Premium Procedural 3D Woven Basket Component from HTML
const ProceduralBasket = () => {
  const height = 0.85;
  const rBase = 0.76;
  const rTop = 1.05;
  const ribCount = 36;
  const ringCount = 9;
  
  const slantHeight = Math.sqrt(height * height + Math.pow(rTop - rBase, 2));
  const tiltAngle = Math.atan2(rTop - rBase, height);
  const midRadius = (rBase + rTop) / 2;

  // Procedural materials mapped precisely from the HTML
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

  // Elegant spline-curve handle from HTML
  const handleCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.95, height - 0.05, 0.55),
    new THREE.Vector3(0.45, height + 0.35, 0.85),
    new THREE.Vector3(0, height + 0.52, 0.92),
    new THREE.Vector3(-0.45, height + 0.35, 0.85),
    new THREE.Vector3(-0.95, height - 0.05, 0.55)
  ]), [height]);

  // Generate 35 randomized interior pebbles
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
            rotation={[tiltAngle * 0.7, 0, -angle]} // Converted to Z rotation offset
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

// 🪨 3D Dodecahedron Stone Stack with Floating Perspectived HTML Text Labels
const StoneStack = () => {
  const stonesData = [
    { pos: [-0.08, 0.35, 0.2], scale: [0.65, 0.38, 0.6], color: '#9aa9b3', word: "WISDOM", rotY: 0.05 },
    { pos: [0.48, 0.55, -0.12], scale: [0.58, 0.44, 0.52], color: '#b7aa87', word: "STRENGTH", rotY: -0.1 },
    { pos: [-0.55, 0.5, -0.05], scale: [0.6, 0.42, 0.55], color: '#8f9b9f', word: "HARMONY", rotY: 0.12 },
    { pos: [0.08, 0.82, 0.25], scale: [0.55, 0.36, 0.5], color: '#c3b59b', word: "PEACE", rotY: 0.0 },
    { pos: [-0.25, 0.95, -0.25], scale: [0.48, 0.35, 0.44], color: '#9dadb5', word: "JOY", rotY: 0.08 },
    { pos: [0.38, 0.92, -0.28], scale: [0.52, 0.38, 0.48], color: '#b5a57c', word: "GRACE", rotY: -0.05 }
  ];

  return (
    <group>
      {/* Base foundation stone */}
      <mesh position={[0, 0.18, 0.02]} scale={[0.9, 0.35, 0.9]} castShadow>
        <dodecahedronGeometry args={[0.5]} />
        <meshStandardMaterial color="#7c8a7c" roughness={0.7} />
      </mesh>

      {/* The Floating Pillars of Strength with styled labels */}
      {stonesData.map((stone, i) => {
        const yLabelOffset = stone.scale[1] * 0.6 + 0.12;
        return (
          <group key={`stone-${i}`} position={stone.pos} rotation={[0, stone.rotY, 0]}>
            {/* The actual physical 3D Stone Mesh */}
            <mesh scale={stone.scale} castShadow receiveShadow>
              <dodecahedronGeometry args={[0.45]} />
              <meshStandardMaterial color={stone.color} roughness={0.45} metalness={0.05} />
            </mesh>

            {/* HTML Label that behaves exactly like CSS2DRenderer but is fully responsive */}
            <Html 
              position={[0, yLabelOffset, 0.06]} 
              center 
              distanceFactor={4.5} 
              zIndexRange={[10, 100]}
            >
              <div style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: "13px",
                fontWeight: "800",
                fontStyle: "italic",
                color: "#f2e8cf",
                textShadow: "1.5px 1.5px 0px #3a2a1f, 1px 1px 4px black",
                letterSpacing: "2px",
                background: "rgba(30, 20, 12, 0.72)",
                padding: "4px 14px",
                borderRadius: "40px",
                borderLeft: "3px solid #e5b83c",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                userSelect: "none",
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
              }}>
                {stone.word}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// 🌟 Swirling Magical Particle Cloud Component
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
        <bufferAttribute 
          attach="attributes-position" 
          count={count} 
          array={positions} 
          itemSize={3} 
        />
      </bufferGeometry>
      <pointsMaterial 
        color="#dbbc87" 
        size={0.025} 
        transparent 
        opacity={0.45} 
        sizeAttenuation 
      />
    </points>
  );
};

// 🚀 Main Exported Face Tracking Basket Model
const BasketModel = ({ faceIndex = 0, faceDataRef, isFrontCamera = true }) => {
  const groupRef = useRef();
  const glowRef = useRef();
  const spotRef = useRef();
  
  const { viewport } = useThree();

  useFrame((state) => {
    if (!faceDataRef?.current || !groupRef.current) return;

    const faceLandmarks = faceDataRef.current[faceIndex];

    if (!faceLandmarks) {
      // Fade out gently if no face is visible
      groupRef.current.visible = THREE.MathUtils.lerp(groupRef.current.visible ? 1 : 0, 0, 0.1) > 0.05;
      return;
    }

    groupRef.current.visible = true;

    // Pulse the interior point lights from HTML
    const time = state.clock.elapsedTime;
    if (glowRef.current) {
      glowRef.current.intensity = 1.2 + Math.sin(time * 3.5) * 0.3;
    }
    if (spotRef.current) {
      spotRef.current.intensity = 0.9 + Math.sin(time * 2.0) * 0.15;
    }

    // Fetch landmarks with frontend camera correction
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

    // Compute dimensional vectors
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

    // Build local basis matrix
    const vRight = new THREE.Vector3(
      pRight.x - pLeft.x,
      -(pRight.y - pLeft.y),
      pRight.z - pLeft.z
    ).normalize();

    const vUpRaw = new THREE.Vector3(
      pForehead.x - pChin.x,
      -(pForehead.y - pChin.y),
      pForehead.z - pChin.z
    ).normalize();

    const vForward = new THREE.Vector3().crossVectors(vRight, vUpRaw).normalize();
    const vUp = new THREE.Vector3().crossVectors(vForward, vRight).normalize();

    // Mapping coordinates dynamically to Viewport
    const x = (pForehead.x - 0.5) * viewport.width;
    const y = -(pForehead.y - 0.5) * viewport.height;
    const z = pForehead.z * -12;

    const headPos = new THREE.Vector3(x, y, z);
    const upwardOffset = faceHeight * (viewport.height * 0.22); 
    const targetPos = headPos.clone().addScaledVector(vUp, upwardOffset);

    // Scaling
    const baseScale = viewport.width * 0.45; 
    const targetScaleFactor = faceWidth * baseScale;
    const targetScale = new THREE.Vector3(targetScaleFactor, targetScaleFactor, targetScaleFactor);

    // Smooth movement lerping
    const damping = 0.25;
    groupRef.current.position.lerp(targetPos, damping);
    groupRef.current.scale.lerp(targetScale, damping);

    // Create quaternion rotation
    const rotMat = new THREE.Matrix4();
    rotMat.makeBasis(vRight, vUp, vForward);
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMat);
    groupRef.current.quaternion.slerp(targetQuat, damping);
  });

  return (
    <group ref={groupRef} dispose={null}>
      {/* 1. 🧺 Woven Procedural Basket */}
      <ProceduralBasket />

      {/* 2. 🪨 Floating Stone Stack with Perspectived Styled HTML Text */}
      <StoneStack />

      {/* 3. 🌟 Magical Particle Cloud */}
      <MagicalDust />

      {/* 4. 💡 Dynamic Inner Illumination & Accent Lights */}
      <ambientLight intensity={0.55} color="#404060" />
      
      {/* Inner glowing PointLight from HTML */}
      <pointLight 
        ref={glowRef}
        color="#f59e0b" 
        intensity={1.5} 
        distance={4} 
        position={[0, 0.6, 0.3]} 
        castShadow 
      />

      {/* Dramatic Spotlight for stone texturing from HTML */}
      <spotLight 
        ref={spotRef}
        color="#ffdd99" 
        intensity={0.9} 
        position={[0, 3.2, 0.8]} 
        castShadow 
      />
      
      {/* Subtle cold rim light from HTML */}
      <pointLight 
        color="#88aaff" 
        intensity={0.5} 
        position={[-1.2, 2.5, -2]} 
      />
    </group>
  );
};

export default BasketModel;
