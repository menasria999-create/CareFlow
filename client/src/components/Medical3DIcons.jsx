import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Cylinder, Box, Torus } from '@react-three/drei';

function Heart() {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    const scale = 1 + Math.sin(clock.getElapsedTime() * 5) * 0.05;
    meshRef.current.scale.set(scale, scale, scale);
  });
  return (
    <group ref={meshRef}>
      <Sphere args={[0.5, 32, 32]} position={[-0.4, 0, 0]} color="#e34234" />
      <Sphere args={[0.5, 32, 32]} position={[0.4, 0, 0]} color="#e34234" />
      <Cylinder args={[0.4, 0.4, 0.8, 32]} position={[0, -0.3, 0]} color="#c62828" />
      <Box args={[0.6, 0.2, 0.4]} position={[0, 0.3, 0]} color="#b71c1c" />
    </group>
  );
}

function Capsule({ color = "#4caf50" }) {
  return (
    <group>
      <Cylinder args={[0.4, 0.4, 0.8, 32]} color={color} />
      <Sphere args={[0.4, 32, 32]} position={[0, 0.45, 0]} color={color} />
      <Sphere args={[0.4, 32, 32]} position={[0, -0.45, 0]} color={color} />
      <Cylinder args={[0.35, 0.35, 0.05, 32]} position={[0, 0.7, 0]} color="#ffd54f" />
      <Cylinder args={[0.35, 0.35, 0.05, 32]} position={[0, -0.7, 0]} color="#ffd54f" />
    </group>
  );
}

function Stethoscope() {
  return (
    <group>
      <Torus args={[0.6, 0.1, 32, 100]} rotation={[Math.PI / 2, 0, 0]} color="#607d8b" />
      <Cylinder args={[0.08, 0.08, 1.2, 8]} position={[0.6, 0.4, 0]} color="#455a64" />
      <Cylinder args={[0.08, 0.08, 1.2, 8]} position={[-0.6, 0.4, 0]} color="#455a64" />
      <Sphere args={[0.15, 32, 32]} position={[0.6, 1.0, 0]} color="#37474f" />
      <Sphere args={[0.15, 32, 32]} position={[-0.6, 1.0, 0]} color="#37474f" />
      <Box args={[0.4, 0.2, 0.6]} position={[0, -0.4, 0]} color="#78909c" />
    </group>
  );
}

function Pill() {
  return (
    <group>
      <Cylinder args={[0.5, 0.5, 0.3, 32]} color="#ff9800" />
      <Cylinder args={[0.45, 0.45, 0.1, 32]} position={[0, 0.2, 0]} color="#ffc107" />
      <Cylinder args={[0.45, 0.45, 0.1, 32]} position={[0, -0.2, 0]} color="#ffc107" />
    </group>
  );
}

export default function Medical3DIcon({ type, style = { width: '100%', height: '250px' } }) {
  let Model;
  switch (type) {
    case 'heart': Model = Heart; break;
    case 'capsule': Model = Capsule; break;
    case 'stethoscope': Model = Stethoscope; break;
    case 'pill': Model = Pill; break;
    default: Model = Capsule;
  }
  return (
    <div style={style}>
      <Canvas camera={{ position: [2, 2, 2], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, 5, 0]} intensity={0.5} />
        <pointLight position={[0, 2, 2]} intensity={0.8} />
        <Model />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} />
      </Canvas>
    </div>
  );
}