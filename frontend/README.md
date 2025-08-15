# FitTransform Frontend

A React Native fitness app with 2D body modeling capabilities using Rive animations.

## 2D Models

The app uses .riv format 2D models for body visualization:

- **Male Model**: `male_human_rigged.riv` 
- **Female Model**: `female_human_rigged.riv`

## Features

- **2D Body Modeling**: Interactive 2D body models with measurement scaling
- **Cross-Platform**: Works on iOS, Android, and Web
- **Real-time Updates**: Live measurement adjustments with visual feedback
- **Gender-Specific Models**: Separate models for male and female users

## Model Integration

The 2D models are loaded from the assets directory and support:
- Real-time measurement scaling
- Interactive bone manipulation
- Platform-specific optimizations
- Responsive design across devices

## Technical Details

- **Format**: .riv (Rive Animation)
- **Loading**: Uses `rive-react-native`
- **Rendering**: Rive Runtime for React Native
- **Platform**: React Native with Expo
