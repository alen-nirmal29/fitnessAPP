import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image as RNImage,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuthStore } from '@/store/auth-store';

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { apiKey } from '@/firebase';

WebBrowser.maybeCompleteAuthSession();

const clientId = '876432031351-h5hmbv4qj96aci5ngcrfqa4kdvef24s2.apps.googleusercontent.com';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  const { login, isAuthenticated, isInitialized, user } = useAuthStore();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId,
    redirectUri: makeRedirectUri({ 
      scheme: 'com.rork.fitshape',
      useProxy: false,
    }),
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      (async () => {
        setIsLoading(true);
        setErrorState(null);
        try {
          const redirectUri = makeRedirectUri({ scheme: 'com.rork.fitshape',useProxy: false });
          const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postBody: `id_token=${response.params.id_token}&providerId=google.com`,
              requestUri: redirectUri,
              returnIdpCredential: true,
              returnSecureToken: true,
            }),
          });

          const data = await res.json();
          if (data.error) throw new Error(data.error.message);

          // Store user data in Zustand
          useAuthStore.getState().setUser(data);

          setIsLoading(false);
          router.replace('/(tabs)'); // Redirect after login
        } catch (e: any) {
          setErrorState(e.message || 'Google sign-in failed');
          setIsLoading(false);
        }
      })();
    }
  }, [response]);

  // Redirect logged in users away from login screen
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, isAuthenticated, user]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorState(null);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setErrorState(e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  const handleGoogleLogin = async () => {
    setErrorState(null);
    try {
      await promptAsync({ useProxy: false });
    } catch (e) {
      setErrorState('Google login error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your fitness journey</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            leftIcon={<Mail size={20} color={Colors.dark.subtext} />}
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            leftIcon={<Lock size={20} color={Colors.dark.subtext} />}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title="Login"
            onPress={handleLogin}
            variant="primary"
            size="large"
            style={styles.button}
            isLoading={isLoading}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={isLoading}>
            <RNImage
              source={require('../../assets/images/google-logo.png')}
              style={styles.googleLogo}
              resizeMode="contain"
            />
            <Text style={styles.googleButtonText}>{isLoading ? 'Signing in...' : 'Sign in with Google'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignup}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
  },
  form: {
    marginBottom: 24,
  },
  button: {
    marginTop: 24,
  },
  errorText: {
    color: Colors.dark.error,
    marginTop: 8,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 8,
  },
  orText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'center',
    minWidth: 220,
    maxWidth: 320,
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#fff',
    fontSize: 16,
  },
  footerLink: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: '500',
  },
});
