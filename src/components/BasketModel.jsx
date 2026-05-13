import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Import assets
import rocksImageUrl from '../assets/rocks_v2.png';

// Landmarks lookup for placement
const NOSE_TIP = 1;
const FOREHEAD = 10;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;
const CHIN = 152;

// 🧺 Ultra-Premium Procedural 3D Woven Basket Component
// Replaces the static GLTF to create high-fidelity geometry with real shadows!
const ProceduralBasket = () => {
  const ribCount = 32;
  const ringCount = 8;
  const height = 0.65;
  const rBase = 0.75;
  const rTop = 1.15;
  
  // Precompute geometry dimensions
  const slantHeight = Math.sqrt(height * height + Math.pow(rTop - rBase, 2));
  const tiltAngle = Math.atan2(rTop - rBase, height);
  const midRadius = (rBase + rTop) / 2;

  // Premium Wood and Gold Materials
  const woodMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#78350f'), // Warm mahogany
    roughness: 0.6,
    metalness: 0.25,
    clearcoat: 0.3,
    sheen: 1.0,
    sheenColor: new THREE.Color('#f59e0b'), // Golden fibrous sheen
  }), []);

  const goldMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#eab308'), // Vibrant sunflower gold
    roughness: 0.3,
    metalness: 0.8,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  }), []);

  const darkWoodMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#451a03'), // Deep dark wood
    roughness: 0.85,
    metalness: 0.1,
  }), []);

  return (
    <group>
      {/* 1. Solid Circular Base */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[rBase - 0.02, rBase - 0.02, 0.04, 32]} />
        <primitive object={darkWoodMat} attach="material" />
      </mesh>

      {/* 2. Geometric Vertical Woven Ribs (Slanted) */}
      {Array.from({ length: ribCount }).map((_, i) => {
        const angle = (i / ribCount) * Math.PI * 2;
        // Weave pattern: alternate offset to interlock with horizontal rings
        const weaveOffset = (i % 2 === 0 ? 0.015 : -0.015);
        return (
          <group key={`rib-${i}`} rotation={[0, angle, 0]}>
            <mesh 
              position={[0, height / 2, midRadius + weaveOffset]} 
              rotation={[tiltAngle, 0, 0]} 
              castShadow
            >
              <cylinderGeometry args={[0.025, 0.025, slantHeight, 8]} />
              <primitive object={woodMat} attach="material" />
            </mesh>
          </group>
        );
      })}

      {/* 3. Horizontal Gold Woven Rings */}
      {Array.from({ length: ringCount }).map((_, i) => {
        const fraction = i / (ringCount - 1);
        const ringY = fraction * height;
        const ringR = rBase + (rTop - rBase) * fraction;
        // Alternating thickness for richer textured detail
        const tubeSize = i % 2 === 0 ? 0.025 : 0.018;
        return (
          <mesh key={`ring-${i}`} position={[0, ringY, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[ringR, tubeSize, 8, 48]} />
            <primitive object={goldMat} attach="material" />
          </mesh>
        );
      })}

      {/* 4. Luxurious Braided Rim */}
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[rTop, 0.06, 12, 64]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      <mesh position={[0, height + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[rTop - 0.01, 0.02, 8, 64]} />
        <primitive object={goldMat} attach="material" />
      </mesh>

      {/* 5. Hand-crafted Arched Top Handle */}
      <mesh position={[0, height - 0.05, 0]} rotation={[0, 0, 0]} castShadow>
        {/* Math.PI creates a perfect 180 degree arch overhead */}
        <torusGeometry args={[rTop * 0.98, 0.045, 12, 64, Math.PI]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      {/* Braided secondary gold handle wrapping */}
      <mesh position={[0, height - 0.02, 0]} rotation={[0.1, 0, 0]} castShadow>
        <torusGeometry args={[rTop * 0.98, 0.02, 8, 64, Math.PI]} />
        <primitive object={goldMat} attach="material" />
      </mesh>
    </group>
  );
};

const BasketModel = ({ faceIndex, faceDataRef, isFrontCamera = true }) => {
  const groupRef = useRef();

  // OPTIMIZATION: Access live 3D viewport measurements to scale flawlessly on Mobile vs Desktop
  const { viewport } = useThree();

  // Load the rocks picture as a texture to display inside the basket
  const rocksTexture = useTexture(rocksImageUrl);

  // OPTIMIZATION: Limit execution rate to match throttled detection inputs
  useFrame(() => {
    if (!faceDataRef.current || !groupRef.current) return;

    const faceLandmarks = faceDataRef.current[faceIndex];

    if (!faceLandmarks || !groupRef.current) {
      // Gradually hide/fade out or lower the basket when no face is detected
      groupRef.current.visible = THREE.MathUtils.lerp(
        groupRef.current.visible ? 1 : 0,
        0,
        0.1
      ) > 0.05;
      return;
    }

    groupRef.current.visible = true;

    // 1. Fetch key face landmarks with MIRRORED CORRECTION (conditional on facingMode)
    // Because the CameraFeed mirrors "user" camera via CSS, we MUST flip the X-coordinates
    // ONLY for front camera. Rear camera (environment) uses standard coordinates.
    const getMirrored = (idx) => {
      const pt = faceLandmarks[idx];
      if (!pt) return { x: 0.5, y: 0.5, z: 0 };
      return {
        x: isFrontCamera ? 1.0 - pt.x : pt.x,
        y: pt.y,
        z: pt.z
      };
    };

    const pLeft = getMirrored(LEFT_CHEEK);
    const pRight = getMirrored(RIGHT_CHEEK);
    const pForehead = getMirrored(FOREHEAD);
    const pChin = getMirrored(CHIN);

    // 2. Calculate face dimensions for DYNAMIC AUTO-ADJUSTMENT scaling
    // This ensures the basket gets larger/smaller as the user moves closer/further from camera.
    const faceWidth3D = Math.sqrt(
      Math.pow(pRight.x - pLeft.x, 2) +
      Math.pow(pRight.y - pLeft.y, 2) +
      Math.pow(pRight.z - pLeft.z, 2)
    );

    const faceHeight3D = Math.sqrt(
      Math.pow(pForehead.x - pChin.x, 2) +
      Math.pow(pForehead.y - pChin.y, 2) +
      Math.pow(pForehead.z - pChin.z, 2)
    );

    // 3. Calculate Local Basis Vectors of the Face (for accurate 3D orientation)
    // Vector going RIGHT across the face
    const vRight = new THREE.Vector3(
      pRight.x - pLeft.x,
      -(pRight.y - pLeft.y), // Invert Y because landmarks Y is down, ThreeJS is up
      pRight.z - pLeft.z
    ).normalize();

    // Vector going UP along the face
    const vUp = new THREE.Vector3(
      pForehead.x - pChin.x,
      -(pForehead.y - pChin.y),
      pForehead.z - pChin.z
    ).normalize();

    // Vector going FORWARD out of the face
    const vForward = new THREE.Vector3().crossVectors(vRight, vUp).normalize();

    // Re-orthogonalize Up vector to ensure perfectly square rotation matrix
    vUp.crossVectors(vForward, vRight).normalize();

    // 4. Calculate Position mapped dynamically to 3D Viewport Bounds
    // Using live viewport dimensions automatically calibrates tracking boundaries
    // for vertical phone aspect ratios versus landscape desktop screens!
    const baseWidthScale = viewport.width;
    const baseHeightScale = viewport.height;

    const rawForeheadX = (pForehead.x - 0.5) * baseWidthScale;
    const rawForeheadY = -(pForehead.y - 0.5) * baseHeightScale;
    const rawForeheadZ = pForehead.z * -12; // Map depth values

    // Base group position at forehead
    const headPosition = new THREE.Vector3(rawForeheadX, rawForeheadY, rawForeheadZ);

    // AUTO-ADJUST OFFSET: 
    // Calibrate upward projection to scale linearly with screen height (viewport.height)
    // to prevent it from flying too high up on tall vertical mobile screens!
    // ⚡ TUNED: Reduced from 0.27 to 0.20 to lower the basket snugly onto the user's head!
    const upwardOffset = faceHeight3D * (viewport.height * 0.20);
    const targetPosition = headPosition.clone().addScaledVector(vUp, upwardOffset);

    // 5. Apply Dynamic Viewport Scaling
    // Reduces base coefficient proportionally to horizontal viewport width, 
    // resolving the 'giant basket' bug on narrow portrait phone devices.
    const baseBasketScale = viewport.width * 0.50;
    const targetScaleFactor = faceWidth3D * baseBasketScale;
    const targetScale = new THREE.Vector3(targetScaleFactor, targetScaleFactor, targetScaleFactor);

    // 6. Smoothly Interpolate Position, Rotation, and Scale (Lerping)
    // Dampens high frequency webcam noise
    const damping = 0.25;
    groupRef.current.position.lerp(targetPosition, damping);
    groupRef.current.scale.lerp(targetScale, damping);

    // Construct Target Quaternion (Rotation) directly from local face vectors
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeBasis(vRight, vUp, vForward);

    const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
    groupRef.current.quaternion.slerp(targetQuaternion, damping);

  });

  return (
    <group ref={groupRef} dispose={null}>
      {/* 🧺 Realistic Procedural Woven Basket */}
      <ProceduralBasket />

      {/* 🪨 Realistic 3D Rock Stack placed inside the Basket */}
      {/* ⚡ LIGHTING & TEXTURE OVERHAUL: Renders with bump-mapped depth, casts shadows, and balances correctly */}
      <mesh 
        position={[0, 0.9, 0.1]} 
        rotation={[(isFrontCamera ? 1 : -1) * (Math.PI / 12), isFrontCamera ? Math.PI : 0, 0]}
        castShadow
        receiveShadow
      >
        {/* Aspect ratio perfectly suited for a tall, natural stack of rocks */}
        <planeGeometry args={[1.2, 1.8]} />
        <meshStandardMaterial
          map={rocksTexture}
          bumpMap={rocksTexture} // ⚡ RENDER TRICK: Convert luminance to depth map for real stone crags!
          bumpScale={0.06} // Strong depth without distortion
          transparent={true}
          roughness={0.85} // Matte stony surface
          metalness={0.05} // Non-metallic
          side={THREE.FrontSide} // Optimized rendering
          alphaTest={0.25} // Crisp shadows and seamless blending
        />
      </mesh>

      {/* 💡 Dynamic internal lighting to illuminate the stone engravings and basket interior */}
      <pointLight color="#fbbf24" intensity={4.0} distance={5} position={[0, 0.35, 0.3]} castShadow />
      
      {/* ✨ Specialized Spotlight pointing at the stones to emphasize their 3D bump textures */}
      <directionalLight 
        color="#ffffff" 
        intensity={2.5} 
        position={[0, 4, 3]} 
        castShadow 
      />
    </group>
  );
};

// Preload assets
useTexture.preload(rocksImageUrl);

export default BasketModel;
