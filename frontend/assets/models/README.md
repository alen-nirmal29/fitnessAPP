# 3D Models

This directory previously contained local .glb model files.

## Current Implementation

The app now uses .fbx format models loaded directly from GitHub repositories:

- **Male Model**: `male_human_model.fbx` from [alen-nirmal29/male_model](https://github.com/alen-nirmal29/male_model.git)
- **Female Model**: `female_human_model.fbx` from [alen-nirmal29/female_model](https://github.com/alen-nirmal29/female_model.git)

## Model Loading

Models are loaded dynamically using `useFBX` from @react-three/drei:

```typescript
const scene = useFBX(getModelUrl(gender));
```

## Benefits of .fbx Format

- Better compatibility with 3D modeling software
- More detailed mesh structure
- Improved material and texture support
- Better animation support (if needed in future)

## Migration Notes

- Changed from `useGLTF` to `useFBX`
- Updated model URLs to point to GitHub repositories
- Maintained all existing functionality and measurement scaling 