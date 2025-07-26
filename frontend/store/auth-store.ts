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
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: () => void;
  initialize: () => void;
  setInOnboarding: (inOnboarding: boolean) => void;
  setUser: (user: UserProfile, idToken?: string, refreshToken?: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
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

      setUser: (user, idToken, refreshToken) => {
        set({
          isAuthenticated: true,
          user,
          idToken,
          refreshToken,
          isLoading: false,
        });
      },

      login: async (email, password) => {
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

          get().setUser(userProfile, data.idToken, data.refreshToken);
        } catch (error: any) {
          set({
            error: error.message || 'Invalid email or password',
            isLoading: false,
          });
        }
      },

      signup: async (email, password, name) => {
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

          const userProfile: UserProfile = {
            id: data.localId,
            email: data.email,
            name,
            hasCompletedOnboarding: false,
          };
          await setDoc(doc(db, 'users', data.localId), userProfile);

          get().setUser(userProfile, data.idToken, data.refreshToken);
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
        } finally {
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

      updateProfile: async (profile) => {
        const { user } = get();
        if (!user || !user.id) {
          console.error('Cannot update profile: user or user.id is undefined');
          throw new Error('User not authenticated');
        }

        const updatedUser = {
          ...user,
          ...profile,
          hasCompletedOnboarding: true,
        };

        await setDoc(doc(db, 'users', user.id), updatedUser);
        set({ user: updatedUser });
      },

      completeOnboarding: () => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, hasCompletedOnboarding: true };
          set({ user: updatedUser, isInOnboarding: false });
          setDoc(doc(db, 'users', user.id), updatedUser, { merge: true });
        }
      },

      setInOnboarding: (inOnboarding: boolean) => {
        set({ isInOnboarding: inOnboarding });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initialize();
          console.log('Auth state rehydrated:', state);
        }
      },
    }
  )
);
