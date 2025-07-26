import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { User, Mail, Lock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuthStore } from '@/store/auth-store';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

export default function SignupScreen() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<{ name?: string; email?: string; password?: string }>({});

  const { signup, loginWithGoogle, isLoading, error } = useAuthStore();

  // Google OAuth request (no proxy)
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '876432031351-h5hmbv4qj96aci5ngcrfqa4kdvef24s2.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({
      scheme: 'com.rork.fitshape',
      useProxy: false, // No Expo proxy
    }),
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      loginWithGoogle(response.params.id_token).then(() => {
        if (useAuthStore.getState().isAuthenticated) {
          router.replace('/onboarding/profile');
        }
      });
    }
  }, [response]);

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string } = {};

    if (!name) {
      newErrors.name = 'Name is required';
    }
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

  const handleSignup = async () => {
    if (validateForm()) {
      try {
        await signup(email, password, name);
        router.replace('/onboarding/profile');
      } catch (error) {
        console.error('Signup failed:', error);
      }
    }
  };

  const handleGoogleSignup = () => {
    promptAsync({ useProxy: false }); // match redirectUri
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start your fitness journey</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            leftIcon={<User size={20} color={Colors.dark.subtext} />}
          />

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
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            leftIcon={<Lock size={20} color={Colors.dark.subtext} />}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title="Create Account"
            onPress={handleSignup}
            variant="primary"
            size="large"
            style={styles.button}
            isLoading={isLoading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.googleButtonDark}
          onPress={handleGoogleSignup}
          disabled={isLoading || !request}
        >
          <Text style={styles.googleButtonTextDark}>{isLoading ? 'Signing up...' : 'Sign up with Google'}</Text>
        </TouchableOpacity>
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
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
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
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: 24,
  },
  footerText: {
    color: Colors.dark.subtext,
    marginRight: 4,
  },
  footerLink: {
    color: Colors.dark.accent,
    fontWeight: 'bold',
  },
  googleButtonDark: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  googleButtonTextDark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
