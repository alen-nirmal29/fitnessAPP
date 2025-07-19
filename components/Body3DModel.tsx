import React, { Suspense } from 'react';
import { View } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useGLTF, OrbitControls, Stage } from '@react-three/drei';
import * as THREE from 'three';

// Use raw GitHub URLs for the .glb models
const getModelUrl = (gender: 'male' | 'female') => {
  if (gender === 'female') {
    return 'https://github.com/alen-nirmal29/female_model/raw/main/female_model.glb';
  }
  return 'https://github.com/alen-nirmal29/male_model/raw/main/male_model.glb';
};

function Model({ gender, measurements }: { gender: 'male' | 'female', measurements?: any }) {
  // @ts-ignore
  const { scene } = useGLTF(getModelUrl(gender));
  const groupRef = React.useRef<THREE.Group>(null);

  React.useLayoutEffect(() => {
    if (!groupRef.current) return;

    // Clean previous model if exists
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    // Clone and prepare model
    const model = scene.clone(true);
    model.traverse((child: any) => {
      if (!child.isMesh) return;

      const name = child.name.toLowerCase();

      // Neck
      if (name.includes('neck') && measurements?.neck) {
        const base = 40; // average neck cm
        const scale = Number(measurements.neck) / base;
        const safe = Math.min(Math.max(scale, 0.8), 1.3);
        child.scale.set(safe, safe, safe);
      }

      // Chest
      if (name.includes('chest') && measurements?.chest) {
        const base = 95;
        const scale = Number(measurements.chest) / base;
        const safe = Math.min(Math.max(scale, 0.8), 1.4);
        child.scale.set(safe, 1, safe);
      }

      // Waist
      if (name.includes('waist') && measurements?.waist) {
        const base = 85;
        const scale = Number(measurements.waist) / base;
        const safe = Math.min(Math.max(scale, 0.8), 1.4);
        child.scale.set(safe, 1, safe);
      }

      // Left Arm
      if (name.includes('leftarm') && measurements?.leftarm) {
        const base = 30;
        const scale = Number(measurements.leftarm) / base;
        const safe = Math.min(Math.max(scale, 0.8), 1.4);
        child.scale.set(safe, 1, safe);
      }

      // Right Arm
      if (name.includes('rightarm') && measurements?.rightarm) {
        const base = 30;
        const scale = Number(measurements.rightarm) / base;
        const safe = Math.min(Math.max(scale, 0.8), 1.4);
        child.scale.set(safe, 1, safe);
      }

      // Left Thigh
      if (name.includes('leftthigh') && measurements?.leftthigh) {
        const base = 50;
        const scale = Number(measurements.leftthigh) / base;
        const safe = Math.min(Math.max(scale, 0.8), 1.4);
        child.scale.set(safe, 1, safe);
      }

      // Right Thigh
      if (name.includes('rightthigh') && measurements?.rightthigh) {
        const base = 50;
        const scale = Number(measurements.rightthigh) / base;
        const safe = Math.min(Math.max(scale, 0.8), 1.4);
        child.scale.set(safe, 1, safe);
      }

      child.geometry.computeBoundingBox();
    });

    // Fit the whole model into view
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fitScale = 2.5 / maxDim;

    model.scale.multiplyScalar(fitScale);

    const boxFit = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    boxFit.getCenter(center);
    model.position.set(-center.x, -center.y, -center.z);

    groupRef.current.add(model);
  }, [scene, measurements]);

  return <group ref={groupRef} />;
}

export default function Body3DModel({ gender = 'male', measurements, style = {} }) {
  return (
    <View style={[{ width: '100%', height: 350, backgroundColor: '#181C22', borderRadius: 16, overflow: 'hidden' }, style]}>
      <Canvas camera={{ position: [0, 1.5, 4] }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7]} intensity={1.2} />
        <Suspense fallback={null}>
          <Stage environment={null} intensity={0.6}>
            <Model gender={gender} measurements={measurements} />
          </Stage>
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={true} enableRotate={true} />
      </Canvas>
    </View>
  );
} 
