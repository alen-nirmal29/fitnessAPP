/**
 * Clear all local storage data for the fitness app
 * Run this in browser console or React Native debugger to clear all stored data
 */

const clearAllLocalData = () => {
  console.log('🧹 Starting to clear all local storage data...');
  
  // List of all possible keys that might contain app data
  const keysToRemove = [
    // Auth related
    'accessToken',
    'refreshToken',
    'auth-storage',
    'auth-store-storage',
    'auth-store',
    'user-data',
    'user-profile',
    'auth-data',
    
    // Workout related
    'workout-session-storage',
    'workout-store-storage',
    'workout-data',
    'workout-sessions',
    'workout-plans',
    'exercise-data',
    'session-data',
    
    // Progress related
    'progress-data',
    'progress-store-storage',
    'measurements-data',
    'body-composition-data',
    'goals-data',
    'analytics-data',
    
    // Google Auth related
    'google-auth-token',
    'google-id-token',
    'google-user-data',
    'google-auth-state',
    'google-refresh-token',
    'google-access-token',
    'expo.auth.session',
    'expo.auth.session.*',
    
    // General app data
    'app-settings',
    'app-config',
    'user-preferences',
    'onboarding-data',
    'profile-data',
    'settings-data',
    
    // Zustand stores
    'workout-store-storage',
    'auth-store-storage',
    'progress-store-storage',
    'session-store-storage',
    
    // AsyncStorage keys (React Native)
    '@react-native-async-storage/async-storage:workout-store-storage',
    '@react-native-async-storage/async-storage:auth-store-storage',
    '@react-native-async-storage/async-storage:progress-store-storage',
    '@react-native-async-storage/async-storage:session-store-storage',
    
    // Expo Auth Session
    'expo.auth.session',
    'expo.auth.session.*',
    'expo.auth.session.google',
    'expo.auth.session.google.*',
  ];
  
  let removedCount = 0;
  let errorCount = 0;
  
  // Clear specific keys
  keysToRemove.forEach(key => {
    try {
      if (typeof localStorage !== 'undefined') {
        // Browser environment
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`✅ Removed: ${key}`);
          removedCount++;
        }
      } else if (typeof AsyncStorage !== 'undefined') {
        // React Native environment
        AsyncStorage.removeItem(key)
          .then(() => {
            console.log(`✅ Removed: ${key}`);
            removedCount++;
          })
          .catch(error => {
            console.log(`❌ Error removing ${key}:`, error);
            errorCount++;
          });
      }
    } catch (error) {
      console.log(`❌ Error removing ${key}:`, error);
      errorCount++;
    }
  });
  
  // Clear all keys that contain app-related terms
  const clearPatternKeys = () => {
    const allKeys = [];
    
    if (typeof localStorage !== 'undefined') {
      // Browser environment
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) allKeys.push(key);
      }
    }
    
    const patterns = [
      'workout',
      'auth',
      'progress',
      'session',
      'user',
      'profile',
      'google',
      'fitness',
      'exercise',
      'measurement',
      'goal',
      'onboarding',
      'body',
      'composition',
      'analytics',
      'store',
      'storage',
      'token',
      'data',
      'expo',
      'auth.session'
    ];
    
    allKeys.forEach(key => {
      const lowerKey = key.toLowerCase();
      const shouldRemove = patterns.some(pattern => lowerKey.includes(pattern));
      
      if (shouldRemove) {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(key);
            console.log(`✅ Removed pattern match: ${key}`);
            removedCount++;
          }
        } catch (error) {
          console.log(`❌ Error removing pattern match ${key}:`, error);
          errorCount++;
        }
      }
    });
  };
  
  // Clear pattern-based keys
  clearPatternKeys();
  
  // Clear all localStorage if possible (nuclear option)
  const clearAllStorage = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
        console.log('🧨 Cleared ALL localStorage data');
        removedCount += localStorage.length;
      }
    } catch (error) {
      console.log('❌ Error clearing all storage:', error);
      errorCount++;
    }
  };
  
  // Clear AsyncStorage completely (React Native)
  const clearAllAsyncStorage = async () => {
    try {
      if (typeof AsyncStorage !== 'undefined') {
        const keys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(keys);
        console.log('🧨 Cleared ALL AsyncStorage data');
        removedCount += keys.length;
      }
    } catch (error) {
      console.log('❌ Error clearing AsyncStorage:', error);
      errorCount++;
    }
  };
  
  // Uncomment the lines below for nuclear option (clears everything)
  // clearAllStorage();
  // clearAllAsyncStorage();
  
  console.log(`\n📊 Clear operation completed:`);
  console.log(`✅ Successfully removed: ${removedCount} items`);
  console.log(`❌ Errors encountered: ${errorCount}`);
  console.log('🎉 Local storage cleanup complete!');
  
  return {
    removedCount,
    errorCount,
    success: errorCount === 0
  };
};

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  console.log('🚀 Auto-running clearAllLocalData...');
  clearAllLocalData();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clearAllLocalData };
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.clearAllLocalData = clearAllLocalData;
}

console.log('📝 clearLocalData.js loaded successfully');
console.log('💡 Run clearAllLocalData() to clear all local storage data'); 