import { Suspense, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function FitCameraToObject({ targetRef }: { targetRef: React.RefObject<THREE.Object3D> }) {
  const { camera } = useThree();

  useLayoutEffect(() => {
    // This viewer uses a perspective camera (fov), but R3F types camera as a union.
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const target = targetRef.current;
    if (!target) return;

    // Compute bounds
    const box = new THREE.Box3().setFromObject(target);
    if (!isFinite(box.min.x) || !isFinite(box.max.x)) return;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Recenter model so camera lookAt is stable
    target.position.sub(center);

    const maxSize = Math.max(size.x, size.y, size.z);
    const fov = (camera.fov * Math.PI) / 180;

    // How far we need to be to fit the full height/width into view
    const fitDistance = (maxSize * 0.6) / Math.tan(fov / 2);
    const distance = fitDistance * 1.35; // padding so it doesn't clip edges

    const dir = new THREE.Vector3(1, 0.25, 1).normalize(); // 3/4 view
    camera.position.copy(dir.multiplyScalar(distance));
    camera.lookAt(0, 0, 0);

    camera.near = Math.max(0.01, distance / 100);
    camera.far = distance * 10;
    camera.updateProjectionMatrix();
  }, [camera, targetRef]);

  return null;
}

function AvatarModel() {
  const { scene } = useGLTF('/models/avatar.glb');
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} rotation={[0, -0.4, 0]}>
      <FitCameraToObject targetRef={groupRef} />
      <primitive object={scene} />
    </group>
  );
}

function LoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.8, 1.6, 0.4]} />
      <meshStandardMaterial color="#4f46e5" wireframe />
    </mesh>
  );
}

interface AvatarViewerProps {
  className?: string;
}

export default function AvatarViewer({ className = '' }: AvatarViewerProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ 
          position: [2, 0.5, 3.5],
          fov: 35,
          near: 0.1,
          far: 100
        }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-3, 3, -3]} intensity={0.4} />
        <pointLight position={[0, 2, 3]} intensity={0.6} />
        
        <Suspense fallback={<LoadingFallback />}>
          <AvatarModel />
          <ContactShadows 
            position={[0, -1.4, 0]} 
            opacity={0.5} 
            scale={8} 
            blur={2.5} 
            far={3} 
          />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload('/models/avatar.glb');
