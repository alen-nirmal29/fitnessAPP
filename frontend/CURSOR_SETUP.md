# Running FitTransform App in Cursor

## Prerequisites

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

3. **Git** (if not already installed)
   - Download from [git-scm.com](https://git-scm.com/)

## Setup Instructions

### Step 1: Clean Installation

1. **Delete problematic files/folders:**
   ```bash
   rm -rf node_modules
   rm -rf .expo
   rm package-lock.json
   rm yarn.lock
   rm bun.lock
   ```

2. **Replace package.json:**
   ```bash
   cp package-cursor.json package.json
   ```

### Step 2: Install Dependencies

```bash
npm install
```

If you encounter dependency conflicts, use:
```bash
npm install --legacy-peer-deps
```

### Step 3: Start the Development Server

```bash
npm start
```

This will open the Expo development server. You can then:
- Press `w` to open in web browser
- Scan QR code with Expo Go app on your phone
- Press `i` for iOS simulator (if on Mac)
- Press `a` for Android emulator

## Troubleshooting

### Common Issues:

1. **Metro bundler cache issues:**
   ```bash
   npx expo start --clear
   ```

2. **Port conflicts:**
   ```bash
   npx expo start --port 8081
   ```

3. **TypeScript errors:**
   ```bash
   npx tsc --noEmit
   ```

4. **Dependency conflicts:**
   ```bash
   npm install --legacy-peer-deps --force
   ```

### If you still get errors:

1. **Complete reset:**
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install --legacy-peer-deps
   ```

2. **Use Yarn instead of npm:**
   ```bash
   npm install -g yarn
   yarn install
   yarn start
   ```

## Key Changes Made

1. **Removed problematic 3D dependencies:**
   - `@react-three/fiber`
   - `@react-three/drei`
   - `three`
   - `expo-gl`

2. **Simplified package.json:**
   - Removed custom Rork scripts
   - Used standard Expo scripts
   - Removed conflicting dependencies

3. **Fixed 3D Model Component:**
   - Replaced 3D canvas with 2D visualization
   - Removed worker dependencies that cause "window is not defined" errors

4. **Fixed logout functionality:**
   - Improved state management
   - Better navigation handling

## Development Tips

1. **Use Expo Go app** on your phone for the best development experience
2. **Enable hot reload** by shaking your device or pressing `r` in terminal
3. **Check console logs** in the terminal for debugging
4. **Use TypeScript** for better development experience

## Production Build

When ready for production:
```bash
npx expo build:web
# or
npx expo build:android
npx expo build:ios
```

## Support

If you encounter any issues:
1. Check the Expo documentation: [docs.expo.dev](https://docs.expo.dev)
2. Clear cache and restart: `npx expo start --clear`
3. Check for TypeScript errors: `npx tsc --noEmit`