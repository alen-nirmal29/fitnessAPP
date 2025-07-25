import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, UserProfile } from '@/types/user';
import { db } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { apiKey } from '@/firebase';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';


interface AuthStore extends AuthState {
  isInitialized: boolean;
  isInOnboarding: boolean;
  idToken?: string;
  refreshToken?: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  initialize: () => void;
  setInOnboarding: (inOnboarding: boolean) => void;
  loginWithGoogle: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => {
      return {
        isAuthenticated: false,
        isLoading: false,
        isInitialized: false,
        isInOnboarding: false,
        user: null,
        error: null,
        idToken: undefined,
        refreshToken: undefined,

        initialize: () => {
          set({ isInitialized: true });
        },

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          try {
            const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password, returnSecureToken: true }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            // Fetch user profile from Firestore
            const userDoc = await getDoc(doc(db, 'users', data.localId));
            let userProfile: UserProfile;
            if (userDoc.exists()) {
              userProfile = userDoc.data() as UserProfile;
            } else {
              userProfile = {
                id: data.localId,
                email: data.email,
                name: '',
                hasCompletedOnboarding: false,
              };
              await setDoc(doc(db, 'users', data.localId), userProfile);
            }
            set({
              isAuthenticated: true,
              user: userProfile,
              idToken: data.idToken,
              refreshToken: data.refreshToken,
              isLoading: false,
            });
            console.log('Auth state after login:', get());
          } catch (error: any) {
            set({
              error: error.message || 'Invalid email or password',
              isLoading: false,
            });
            console.log('Login error:', error);
          }
        },

        signup: async (email: string, password: string, name: string) => {
          set({ isLoading: true, error: null });
          try {
            const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password, returnSecureToken: true }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            // Create user profile in Firestore
            const userProfile: UserProfile = {
              id: data.localId,
              email: data.email,
              name,
              hasCompletedOnboarding: false,
            };
            await setDoc(doc(db, 'users', data.localId), userProfile);
            set({
              isAuthenticated: true,
              user: userProfile,
              idToken: data.idToken,
              refreshToken: data.refreshToken,
              isLoading: false,
            });
            console.log('Auth state after signup:', get());
          } catch (error: any) {
            set({
              error: error.message || 'Failed to create account',
              isLoading: false,
            });
            console.log('Signup error:', error);
          }
        },

        logout: async () => {
          set({ isLoading: true });
          try {
            await AsyncStorage.removeItem('auth-storage');
            await AsyncStorage.removeItem('workout-storage');
            await AsyncStorage.removeItem('workout-session-storage');
            set({
              isAuthenticated: false,
              user: null,
              error: null,
              isLoading: false,
              isInitialized: true,
              isInOnboarding: false,
              idToken: undefined,
              refreshToken: undefined,
            });
          } catch (error) {
            set({
              isAuthenticated: false,
              user: null,
              error: null,
              isLoading: false,
              isInitialized: true,
              isInOnboarding: false,
              idToken: undefined,
              refreshToken: undefined,
            });
          }
        },

        updateProfile: (profile: Partial<UserProfile>) => {
          const { user } = get();
          if (user) {
            const updatedUser = {
              ...user,
              ...profile,
            };
            set({ user: updatedUser });
            setDoc(doc(db, 'users', user.id), updatedUser, { merge: true });
          }
        },

        completeOnboarding: () => {
          const { user } = get();
          if (user) {
            const updatedUser = {
              ...user,
              hasCompletedOnboarding: true,
            };
            set({
              user: updatedUser,
              isInOnboarding: false,
            });
            setDoc(doc(db, 'users', user.id), updatedUser, { merge: true });
          }
        },

        setInOnboarding: (inOnboarding: boolean) => {
          set({ isInOnboarding: inOnboarding });
        },

        loginWithGoogle: async () => {
          set({ isLoading: true, error: null });
          try {
            const clientId = '876432031351-h5hmbv4qj96aci5ngcrfqa4kdvef24s2.apps.googleusercontent.com';
            // 'useProxy' is not a valid property for makeRedirectUri or promptAsync in the latest expo-auth-session
            const redirectUri = makeRedirectUri({ scheme: 'com.rork.fitshape' });
            const discovery = {
              authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
              tokenEndpoint: 'https://oauth2.googleapis.com/token',
              revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
            };
            const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
              clientId,
              redirectUri,
            });
            const result = await promptAsync();
            if (result.type === 'success' && result.params.id_token) {
              const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${apiKey}`;
              const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  postBody: `id_token=${result.params.id_token}&providerId=google.com`,
                  requestUri: redirectUri,
                  returnIdpCredential: true,
                  returnSecureToken: true,
                }),
              });
              const data = await res.json();
              if (data.error) throw new Error(data.error.message);
              // Fetch or create user profile in Firestore
              const userDoc = await getDoc(doc(db, 'users', data.localId));
              let userProfile: UserProfile;
              if (userDoc.exists()) {
                userProfile = userDoc.data() as UserProfile;
              } else {
                userProfile = {
                  id: data.localId,
                  email: data.email,
                  name: '',
                  hasCompletedOnboarding: false,
                };
                await setDoc(doc(db, 'users', data.localId), userProfile);
              }
              set({
                isAuthenticated: true,
                user: userProfile,
                idToken: data.idToken,
                refreshToken: data.refreshToken,
                isLoading: false,
              });
            } else {
              set({ error: 'Google sign-in cancelled or failed', isLoading: false });
            }
          } catch (error: any) {
            set({ error: error.message || 'Google sign-in failed', isLoading: false });
          }
        },
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initialize();
          console.log('Auth state rehydrated:', state);
        } else {
          console.log('No auth state to rehydrate.');
        }
      },
    }
  )
);