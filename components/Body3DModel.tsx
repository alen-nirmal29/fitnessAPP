import React, { Suspense } from 'react';
import { View } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useGLTF, OrbitControls, Stage } from '@react-three/drei';

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

  // Calculate scale factors based on measurements (simple proportional scaling)
  const scaleX = measurements
    ? ((Number(measurements.chest) + Number(measurements.waist) + Number(measurements.leftarm) + Number(measurements.rightarm)) / 4) / 50
    : 1;
  const scaleY = measurements
    ? ((Number(measurements.neck) + Number(measurements.leftthigh) + Number(measurements.rightthigh)) / 3) / 40
    : 1;
  const scaleZ = 1; // You can use another measurement for depth if desired

  return <primitive object={scene} scale={[scaleX, scaleY, scaleZ]} />;
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