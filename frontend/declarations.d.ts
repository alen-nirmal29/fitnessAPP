declare module '*.riv' {
  const value: number; // Rive React Native expects the asset to be a number (native resource ID)
  export default value;
}