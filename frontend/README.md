# FitTransform Frontend

A React Native fitness app with 3D body modeling capabilities.

## 3D Models

The app uses .fbx format 3D models for body visualization:

- **Male Model**: `male_human_model.fbx` from [alen-nirmal29/male_model](https://github.com/alen-nirmal29/male_model.git)
- **Female Model**: `female_human_model.fbx` from [alen-nirmal29/female_model](https://github.com/alen-nirmal29/female_model.git)

## Features

- **3D Body Modeling**: Interactive 3D body models with measurement scaling
- **Cross-Platform**: Works on iOS, Android, and Web
- **Real-time Updates**: Live measurement adjustments with visual feedback
- **Gender-Specific Models**: Separate models for male and female users

## Model Integration

The 3D models are loaded directly from GitHub repositories and support:
- Real-time measurement scaling
- Interactive rotation and zoom
- Platform-specific optimizations
- Responsive design across devices

## Technical Details

- **Format**: .fbx (Autodesk FBX)
- **Loading**: Uses `useFBX` from @react-three/drei
- **Rendering**: Three.js with React Three Fiber
- **Platform**: React Native with Expo
