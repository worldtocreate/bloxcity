import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';

function AvatarModel() {
  const { scene } = useGLTF('/models/avatar.glb');

  return (
    <group rotation={[0, -0.4, 0]}>
      <primitive object={scene} scale={0.02} position={[0, -1.5, 0]} />
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
            position={[0, -1.2, 0]} 
            opacity={0.5} 
            scale={6} 
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
