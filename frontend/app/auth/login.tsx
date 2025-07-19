import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image as RNImage } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuthStore } from '@/store/auth-store';
import BackButton from '@/components/BackButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { login, loginWithGoogle, isLoading, error, isAuthenticated } = useAuthStore();

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
    if (validateForm()) {
      try {
        await login(email, password);
        // Force navigation to main app after successful login
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Login failed:', error);
      }
    }
  };

  const handleBack = () => {
    router.replace('/');
  };

  const handleSignup = () => {
    router.push('/auth/signup');
  };

  const handleGoogleLogin = async () => {
    console.log('Google login button pressed');
    try {
      await loginWithGoogle();
      // Only navigate if authenticated
      if (useAuthStore.getState().isAuthenticated) {
        router.replace('/(tabs)');
      }
    } catch (e) {
      // Error is handled in the store
      console.log('Google login error', e);
    }
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
          {/* Removed BackButton to prevent navigating back from Welcome Back screen */}
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
          <TouchableOpacity onPress={() => {}} style={styles.forgotPasswordRow}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Button
            title="Login"
            onPress={handleLogin}
            variant="primary"
            size="xlarge"
            style={[styles.button, {minHeight: 48, marginTop: 16, marginBottom: 16}]}
            isLoading={isLoading}
          />
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.divider} />
          </View>
          <TouchableOpacity style={styles.googleButtonDark} onPress={handleGoogleLogin} disabled={isLoading}>
            <RNImage
              source={require('../../assets/images/google-logo.png')}
              style={styles.googleLogo}
              resizeMode="contain"
            />
            <Text style={styles.googleButtonTextDark}>{isLoading ? 'Signing in...' : 'Sign in with Google'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
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
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 24,
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 0,
    marginTop: 0,
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
  forgotPasswordRow: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
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
  googleButtonDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 0,
    alignSelf: 'center',
    minWidth: 220,
    maxWidth: 320,
  },
  googleButtonTextDark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});