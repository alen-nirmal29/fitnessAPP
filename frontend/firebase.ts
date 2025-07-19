import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBOgRlgy2U4hPbEPoRWscZwqkGlp8FWT2I',
  authDomain: 'fitness-app-69a27.firebaseapp.com',
  projectId: 'fitness-app-69a27',
  storageBucket: 'fitness-app-69a27.appspot.com',
  messagingSenderId: '876432031351',
  appId: '1:876432031351:web:b69eaa1decc6508e3d5072',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Export apiKey for REST API usage
export const apiKey = firebaseConfig.apiKey;

export { app, db }; 