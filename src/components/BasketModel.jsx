import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Import the GLB model directly as a static URL asset using Vite's ?url query
import basketModelUrl from '../models/basket.glb?url';

// Landmarks lookup for placement
const NOSE_TIP = 1;
const FOREHEAD = 10;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;
const CHIN = 152;

const BasketModel = ({ faceIndex, faceDataRef, isFrontCamera = true }) => {
  const groupRef = useRef();
  
  // OPTIMIZATION: Access live 3D viewport measurements to scale flawlessly on Mobile vs Desktop
  const { viewport } = useThree();
  
  // Use R3F GLTF loader to load our generated basket
  const { scene, materials } = useGLTF(basketModelUrl);

  // Clone the scene to avoid shared state issues and customize materials
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    // Style the basket to look ultra-modern
    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Replace basic material with high quality glassmorphic / metallic physical material
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#d97706'), // Amber/Gold
          roughness: 0.2,
          metalness: 0.8,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          transmission: 0.3, // Glassy transmission
          thickness: 0.5,
          ior: 1.5,
        });
      }
    });

    // VISUAL TILT ADJUSTMENT:
    // Tilt the entire basket forward slightly (15 degrees) so users look INTO the basket 
    // rather than underneath it, making the Cavity clearly visible!
    clonedScene.rotation.x = Math.PI / 12;
  }, [clonedScene]);

  // Core tracking logic running inside Three.js loop (60 FPS)
  useFrame((state, delta) => {
    // ⚡ OPTIMIZATION: Directly extract coordinates from the mutable ref!
    // This runs on the rendering thread and NEVER triggers a React reconcile pass.
    const faceLandmarks = faceDataRef.current ? faceDataRef.current[faceIndex] : null;

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
      {/* Main imported GLB mesh */}
      <primitive object={clonedScene} />
      
      {/* Add a natural localized ambient light inside the basket for gentle illumination */}
      <pointLight color="#f59e0b" intensity={1.2} distance={4} position={[0, 0.3, 0]} />
    </group>
  );
};

// Preload GLB asset
useGLTF.preload(basketModelUrl);

export default BasketModel;
