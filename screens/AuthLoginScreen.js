import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../components/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID =
  '477414873813-g1p23m77j5r4pfvfqo8j33dn08le4pa2.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID =
  '477414873813-jjivjjv58fku1keuokmsvvbcuuek68ti.apps.googleusercontent.com';
const IS_EXPO_GO = Constants.appOwnership === 'expo';

let GoogleSignin = null;
let statusCodes = {};
if (Platform.OS !== 'web' && !IS_EXPO_GO) {
  ({ GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin'));
}

export default function AuthLoginScreen({ onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signIn, signUp, signInGoogle, clearError } = useAuth();

  const googleRequestConfig = useMemo(
    () => ({
      expoClientId: GOOGLE_WEB_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      webClientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
      selectAccount: true,
    }),
    []
  );

  const [, googleResponse, promptAsync] = Google.useAuthRequest(googleRequestConfig);

  useEffect(() => {
    if (Platform.OS !== 'web' && GoogleSignin) {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        scopes: ['profile', 'email'],
      });
    }
  }, []);

  useEffect(() => {
    const finishGoogleAuth = async () => {
      if (googleResponse?.type !== 'success') {
        if (googleResponse?.type === 'error') {
          const message = googleResponse.error?.message || 'Google sign-in failed.';
          Alert.alert('Google Sign-In Failed', message);
          setGoogleLoading(false);
        }
        return;
      }

      try {
        const idToken = googleResponse.params?.id_token || null;
        const accessToken =
          googleResponse.authentication?.accessToken || googleResponse.params?.access_token || null;

        if (!idToken) {
          throw new Error('No Google ID token was returned.');
        }

        await signInGoogle(idToken, accessToken);
      } catch (error) {
        Alert.alert('Google Sign-In Failed', error.message || 'Unable to sign in with Google.');
      } finally {
        setGoogleLoading(false);
      }
    };

    finishGoogleAuth();
  }, [googleResponse, signInGoogle]);

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setIsLoading(true);
      clearError();
      await signIn(email.trim(), password);
    } catch (error) {
      Alert.alert('Sign In Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      clearError();
      await signUp(email.trim(), password, displayName.trim() || null);
      Alert.alert('Success', 'Account created successfully!');
    } catch (error) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      clearError();

      if (Platform.OS === 'web') {
        await signInGoogle();
        setGoogleLoading(false);
        return;
      }

      if (IS_EXPO_GO) {
        const result = await promptAsync({ useProxy: true, showInRecents: true });
        if (result?.type !== 'success') {
          setGoogleLoading(false);
        }
        return;
      }

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo?.data?.idToken || userInfo?.idToken || null;

      if (!idToken) {
        throw new Error('No Google ID token was returned.');
      }

      await signInGoogle(idToken, null);
      setGoogleLoading(false);
    } catch (error) {
      if (Platform.OS !== 'web' && !IS_EXPO_GO) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          setGoogleLoading(false);
          return;
        }

        if (error.code === statusCodes.IN_PROGRESS) {
          Alert.alert('Google Sign-In', 'Google sign-in is already in progress.');
          setGoogleLoading(false);
          return;
        }

        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert(
            'Google Sign-In Failed',
            'Google Play Services is not available on this device.'
          );
          setGoogleLoading(false);
          return;
        }
      }

      const message = error.message || 'Unable to sign in with Google.';
      if (Platform.OS === 'web') {
        console.error('Web Google sign-in failed:', error);
        if (typeof window !== 'undefined') {
          window.alert(`Google Sign-In Failed

${message}`);
        }
      } else {
        Alert.alert('Google Sign-In Failed', message);
      }
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroPanel}>
          <View style={styles.brandRow}>
            <View style={styles.logoHalo}>
              <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.brandTextWrap}>
              <Text style={styles.eyebrow}>Smart spending starts here</Text>
              <Text style={styles.title}>SpendSmart</Text>
              <Text style={styles.subtitle}>
                {isSignUp
                  ? 'Create your account and start tracking with a cleaner budget flow.'
                  : 'Sign in to manage expenses, budgets, and insights in one place.'}
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricChip}>
              <Ionicons name="wallet-outline" size={15} color="#22B7E8" />
              <Text style={styles.metricText}>Budget management</Text>
            </View>
            <View style={styles.metricChip}>
              <Ionicons name="analytics-outline" size={15} color="#22B7E8" />
              <Text style={styles.metricText}>Budget insights</Text>
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>{isSignUp ? 'Create account' : 'Welcome back'}</Text>
            <Text style={styles.formSubtitleText}>
              {isSignUp ? 'Use email or Google to get started.' : 'Continue with your email or Google account.'}
            </Text>
          </View>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#70727B"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#70727B"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#70727B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {!isSignUp && (
            <TouchableOpacity onPress={onForgotPassword}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={isSignUp ? handleEmailSignUp : handleEmailSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#050505" />
            ) : (
              <Text style={styles.primaryButtonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={isLoading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.googleButtonContent}>
                <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.toggleLink}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 36,
  },
  heroPanel: {
    backgroundColor: '#0E0E10',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1C1C20',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoHalo: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: '#131316',
    borderWidth: 1,
    borderColor: '#232329',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  brandTextWrap: {
    flex: 1,
  },
  eyebrow: {
    color: '#22B7E8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 15,
    lineHeight: 22,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    flexWrap: 'wrap',
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#141418',
    borderWidth: 1,
    borderColor: '#232329',
  },
  metricText: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#F6F9FC',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E6ECF5',
  },
  formHeader: {
    marginBottom: 18,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#121212',
    marginBottom: 6,
  },
  formSubtitleText: {
    fontSize: 14,
    color: '#68707D',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE6F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: '#121212',
  },
  forgotPassword: {
    color: '#22B7E8',
    textAlign: 'right',
    marginBottom: 20,
    fontSize: 14,
    fontWeight: '700',
  },
  button: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#22B7E8',
  },
  primaryButtonText: {
    color: '#050505',
    fontSize: 16,
    fontWeight: '800',
  },
  googleButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  toggleText: {
    color: '#68707D',
    fontSize: 14,
  },
  toggleLink: {
    color: '#22B7E8',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
});
