import React, { Suspense, useRef, useLayoutEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URLS = {
  male: 'https://3d-models-rose.vercel.app/male_model.glb',
  female: 'https://3d-models-rose.vercel.app/female_model.glb',
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

interface ModelProps {
  gender: 'male' | 'female';
  measurements?: Measurements;
}

function Model({ gender, measurements }: ModelProps) {
  const modelUrl = MODEL_URLS[gender];
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.clear();

    const model = scene.clone(true);

    const baseMeasurements: Required<Measurements> = {
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
      rightleg: 45,
    };

    const clamp = (val: number, min: number, max: number) =>
      Math.min(Math.max(val, min), max);

    model.traverse((child: any) => {
      if (!child.isBone) return;
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
    });

    // ✅ LARGER SCALE + PERFECT CENTERING
    model.scale.set(50, 50, 50); // Much larger scale for better visibility
    model.position.set(0, 0, 0); // Perfect center position

    groupRef.current.add(model);
  }, [scene, measurements]);

  return <group ref={groupRef} />;
}

interface Body3DModelProps {
  gender?: 'male' | 'female';
  measurements?: Measurements;
  style?: any;
}

export default function Body3DModel({
  gender = 'male',
  measurements,
  style = {},
}: Body3DModelProps) {
  return (
    <View style={[styles.container, style]}>
      <Canvas camera={{ position: [0, 0, 80], fov: 35 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[0, 20, 30]} intensity={0.8} />
        <directionalLight position={[0, -20, -30]} intensity={0.3} />
        <Suspense fallback={null}>
          <Model gender={gender} measurements={measurements} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={(Math.PI * 3) / 4}
          minDistance={50}
          maxDistance={120}
          target={[0, 0, 0]}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 350,
    backgroundColor: '#181C22',
    borderRadius: 16,
    overflow: 'hidden',
  },
});
