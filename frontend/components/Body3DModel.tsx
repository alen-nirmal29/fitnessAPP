import React, { Suspense } from 'react';
import { View } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useGLTF, OrbitControls, Stage, useFBX } from '@react-three/drei';
import * as THREE from 'three';

// Use raw GitHub URLs for the .fbx models
const getModelUrl = (gender: 'male' | 'female') => {
  if (gender === 'female') {
    return 'https://github.com/alen-nirmal29/female_model/raw/main/female_human_model.fbx';
  }
  return 'https://github.com/alen-nirmal29/male_model/raw/main/male_human_model.fbx';
};

interface Measurements {
  neck?: number;
  chest?: number;
  waist?: number;
  leftarm?: number;
  rightarm?: number;
  leftthigh?: number;
  rightthigh?: number;
}

function Model({ gender, measurements }: { gender: 'male' | 'female', measurements?: Measurements }) {
  const scene = useFBX(getModelUrl(gender));
  const groupRef = React.useRef<THREE.Group>(null);

  React.useLayoutEffect(() => {
    if (!groupRef.current) return;

    // Clean previous content
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    const model = scene.clone(true);

    // Rotate the model so it stands upright (legs down)
    model.rotation.set(-Math.PI / 2, 0, 0);

    // Safely apply measurement scaling
    model.traverse((child: any) => {
      if (!child.isMesh) return;

      // Log mesh names for debugging
      console.log("Processing mesh:", child.name);

      // Make material visible for debug
      child.material.color.setHex(0x808080);
      child.material.roughness = 0.7;
      child.material.metalness = 0.2;
      child.material.needsUpdate = true;

      const name = child.name.toLowerCase();

      const scalePart = (base: number, value: number, partName: string) => {
        console.log(`Scaling ${partName}:`, value, 'base:', base);
        const scale = Math.min(Math.max(value / base, 0.8), 1.4);
        child.scale.set(1, 1, 1); // reset first
        child.scale.multiplyScalar(scale);
        console.log(`Applied scale ${scale} to ${partName}`);
      };

      // Try to match body parts based on mesh names and positions
      // Since the exact names aren't matching, we'll use a more flexible approach
      
      // Check if this mesh contains any of our target body part names
      const hasBodyPart = (partName: string) => {
        return name.includes(partName) || 
               child.name.includes(partName) || 
               child.name.toLowerCase().includes(partName);
      };

      // Map mesh numbers to body parts based on typical model structure
      // You may need to adjust these mappings based on your specific model
      const meshToBodyPart: { [key: string]: string } = {
        'imagetostl_mesh2002': 'chest',
        'imagetostl_mesh2003': 'neck', 
        'imagetostl_mesh2004': 'waist',
        'imagetostl_mesh2005': 'leftthigh',
        'imagetostl_mesh2006': 'rightthigh',
        'imagetostl_mesh2007': 'rightarm',
        'leftarm': 'leftarm' // This one is already working
      };

      // Try exact mesh name matching first
      if (meshToBodyPart[child.name]) {
        const bodyPart = meshToBodyPart[child.name];
        console.log(`Found body part ${bodyPart} in mesh ${child.name}`);
        
        if (bodyPart === 'neck' && measurements?.neck) scalePart(40, measurements.neck, 'neck');
        if (bodyPart === 'chest' && measurements?.chest) scalePart(95, measurements.chest, 'chest');
        if (bodyPart === 'waist' && measurements?.waist) scalePart(85, measurements.waist, 'waist');
        if (bodyPart === 'leftarm' && measurements?.leftarm) scalePart(30, measurements.leftarm, 'leftarm');
        if (bodyPart === 'rightarm' && measurements?.rightarm) scalePart(30, measurements.rightarm, 'rightarm');
        if (bodyPart === 'leftthigh' && measurements?.leftthigh) scalePart(50, measurements.leftthigh, 'leftthigh');
        if (bodyPart === 'rightthigh' && measurements?.rightthigh) scalePart(50, measurements.rightthigh, 'rightthigh');
      }
      // Fallback to partial name matching
      else if (hasBodyPart('neck') && measurements?.neck) scalePart(40, measurements.neck, 'neck');
      else if (hasBodyPart('chest') && measurements?.chest) scalePart(95, measurements.chest, 'chest');
      else if (hasBodyPart('waist') && measurements?.waist) scalePart(85, measurements.waist, 'waist');
      else if (hasBodyPart('leftarm') && measurements?.leftarm) scalePart(30, measurements.leftarm, 'leftarm');
      else if (hasBodyPart('rightarm') && measurements?.rightarm) scalePart(30, measurements.rightarm, 'rightarm');
      else if (hasBodyPart('leftthigh') && measurements?.leftthigh) scalePart(50, measurements.leftthigh, 'leftthigh');
      else if (hasBodyPart('rightthigh') && measurements?.rightthigh) scalePart(50, measurements.rightthigh, 'rightthigh');
    });

    // Fit model to view
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fitScale = 1.8 / maxDim;

    model.scale.setScalar(fitScale); // uniform scale
    box.getCenter(size);
    model.position.set(-size.x, -size.y, -size.z); // center the model

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
        {/* Improved lighting setup for grey model */}
        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight position={[5, 10, 7]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-5, 10, -7]} intensity={0.4} color="#ffffff" />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#ffffff" />
        
        <Suspense fallback={null}>
          <Stage environment={null} intensity={0.2} shadows={false}>
            <Model gender={gender} measurements={measurements} />
          </Stage>
        </Suspense>
        
        {/* Improved camera controls for upright model */}
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          enableRotate={true}
          minPolarAngle={Math.PI / 6} // Allow more vertical rotation
          maxPolarAngle={Math.PI * 5 / 6}
          minDistance={2.5}
          maxDistance={6}
          target={[0, 0, 0]} // Look at center
        />
      </Canvas>
    </View>
  );
} 
