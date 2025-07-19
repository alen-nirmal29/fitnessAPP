import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, UserProfile } from '@/types/user';
import { db } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { apiKey } from '@/firebase';


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
          } catch (error: any) {
            set({
              error: error.message || 'Invalid email or password',
              isLoading: false,
            });
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
          } catch (error: any) {
            set({
              error: error.message || 'Failed to create account',
              isLoading: false,
            });
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
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initialize();
        }
      },
    }
  )
);