import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';

function AvatarModel() {
  const { scene } = useGLTF('/models/avatar.glb');

  return (
    <primitive object={scene} scale={1} position={[0, -1.5, 0]} />
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 2, 0.5]} />
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
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <pointLight position={[0, 3, 2]} intensity={0.5} />
        
        <Suspense fallback={<LoadingFallback />}>
          <AvatarModel />
          <ContactShadows 
            position={[0, -1.5, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2} 
            far={4} 
          />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload('/models/avatar.glb');
