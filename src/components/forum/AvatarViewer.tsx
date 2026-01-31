import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarModelProps {
  autoRotate?: boolean;
}

function AvatarModel({ autoRotate = true }: AvatarModelProps) {
  const { scene } = useGLTF('/models/avatar.glb');
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1} position={[0, -1, 0]} />
    </group>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4f46e5" wireframe />
    </mesh>
  );
}

interface AvatarViewerProps {
  className?: string;
  autoRotate?: boolean;
}

export default function AvatarViewer({ className = '', autoRotate = true }: AvatarViewerProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <pointLight position={[0, 2, 0]} intensity={0.5} />
        
        <Suspense fallback={<LoadingFallback />}>
          <AvatarModel autoRotate={autoRotate} />
          <ContactShadows 
            position={[0, -1, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2} 
            far={4} 
          />
          <Environment preset="studio" />
        </Suspense>
        
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload('/models/avatar.glb');
