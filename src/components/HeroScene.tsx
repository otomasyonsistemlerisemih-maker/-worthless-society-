"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const ParticleField = () => {
  const ref = useRef<THREE.Points>(null!);
  
  const sphere = useMemo(() => {
    const positions = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    // Almost static, massive spatial rotation
    ref.current.rotation.x -= delta / 30;
    ref.current.rotation.y -= delta / 45;

    // Ultra-slow handheld camera breathing and focus sway (Tarkovsky atmosphere)
    const time = state.clock.getElapsedTime();
    state.camera.position.x = Math.sin(time * 0.12) * 0.06;
    state.camera.position.y = Math.cos(time * 0.08) * 0.06;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#666666" // Faded concrete ash
          size={0.012}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.16}
        />
      </Points>
    </group>
  );
};

const HeroScene = () => {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <color attach="background" args={['#050505']} />
        <ParticleField />
      </Canvas>
    </div>
  );
};

export default HeroScene;
