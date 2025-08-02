import React, { Suspense } from 'react';
import { View } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useGLTF, Stage, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const getModelUrl = (gender: 'male' | 'female') => {
  if (gender === 'female') {
    return 'https://github.com/alen-nirmal29/female_model/raw/main/female_model.glb';
  }
  return 'https://github.com/alen-nirmal29/male_model/raw/main/male_model.glb';
};

interface Measurements {
  neck?: number;
  chest?: number;
  waist?: number;
  leftarm?: number;
  rightarm?: number;
  leftforehand?: number;
  rightforehand?: number;
  leftthigh?: number;
  rightthigh?: number;
  leftleg?: number;
  rightleg?: number;
}

function Model({ gender, measurements }: { gender: 'male' | 'female', measurements?: Measurements }) {
  const { scene } = useGLTF(getModelUrl(gender));
  const groupRef = React.useRef<THREE.Group>(null);

  React.useLayoutEffect(() => {
    if (!groupRef.current) return;

    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    const model = scene.clone(true);
    model.rotation.set(-Math.PI / 2, 0, 0);

    const baseMeasurements = {
      neck: 40,
      chest: 95,
      waist: 85,
      leftarm: 30,
      rightarm: 30,
      leftforehand: 25,
      rightforehand: 25,
      leftthigh: 50,
      rightthigh: 50,
      leftleg: 45,
      rightleg: 45
    };

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    model.traverse((child: any) => {
      if (child.isBone) {
        const name = child.name;

        const scaleBone = (key: keyof Measurements, axes: [boolean, boolean, boolean]) => {
          const userVal = measurements?.[key];
          const baseVal = baseMeasurements[key];
          if (!userVal || !baseVal) return;

          const scale = clamp(userVal / baseVal, 0.8, 1.4);
          const sx = axes[0] ? scale : 1;
          const sy = axes[1] ? scale : 1;
          const sz = axes[2] ? scale : 1;
          child.scale.set(sx, sy, sz);
        };

        if (name === 'CC_Base_R_Upperarm') scaleBone('rightarm', [true, true, true]);
        if (name === 'CC_Base_L_Upperarm') scaleBone('leftarm', [true, true, true]);
        if (name === 'CC_Base_R_Forearm') scaleBone('rightforehand', [true, true, true]);
        if (name === 'CC_Base_L_Forearm') scaleBone('leftforehand', [true, true, true]);
        if (name === 'CC_Base_R_Thigh') scaleBone('rightthigh', [true, true, true]);
        if (name === 'CC_Base_L_Thigh') scaleBone('leftthigh', [true, true, true]);
        if (name === 'CC_Base_R_Calf') scaleBone('rightleg', [true, true, true]);
        if (name === 'CC_Base_L_Calf') scaleBone('leftleg', [true, true, true]);
        if (name === 'CC_Base_Spine02') scaleBone('chest', [true, false, true]);
        if (name === 'CC_Base_Waist') scaleBone('waist', [true, false, true]);
        if (name === 'CC_Base_NeckTwist01') scaleBone('neck', [true, false, true]);
      }
    });

    // Clamped Auto Scaling to fit view
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fitScale = 1.8 / maxDim;
    const clampedScale = Math.min(Math.max(fitScale, 0.5), 5);
    model.scale.setScalar(clampedScale);

    box.getCenter(size);
    model.position.set(-size.x, -size.y, -size.z);

    groupRef.current.add(model);
  }, [scene, measurements]);

  return <group ref={groupRef} />;
}

interface Body3DModelProps {
  gender?: 'male' | 'female';
  measurements?: Measurements;
  style?: any;
}

export default function Body3DModel({ gender = 'male', measurements, style = {} }: Body3DModelProps) {
  return (
    <View style={[{ width: '100%', height: 350, backgroundColor: '#181C22', borderRadius: 16, overflow: 'hidden' }, style]}>
      <Canvas camera={{ position: [0, 1, 4], fov: 45 }}>
        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight position={[5, 10, 7]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-5, 10, -7]} intensity={0.4} color="#ffffff" />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#ffffff" />

        <Suspense fallback={null}>
          <Stage environment={null} intensity={0.2} shadows={false}>
            <Model gender={gender} measurements={measurements} />
          </Stage>
        </Suspense>

        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          enableRotate={true}
          minPolarAngle={Math.PI / 6} 
          maxPolarAngle={Math.PI * 5 / 6}
          minDistance={2.5}
          maxDistance={6}
          target={[0, 0, 0]}
        />
      </Canvas>
    </View>
  );
}
