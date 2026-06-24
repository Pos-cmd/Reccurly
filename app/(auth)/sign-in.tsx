import { useAuth, useSignIn } from "@clerk/expo";
import { clsx } from "clsx";
import { Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

/**
 * Validates the basic structure of an email address.
 *
 * @returns `true` if the email matches the pattern `something@something.something`, `false` otherwise.
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Renders the authentication screen for signing in with email and password, including multi-factor verification.
 *
 * Automatically redirects to the main app if the user is already authenticated. Displays a loading indicator while initializing auth state. Otherwise, presents either a code verification interface for MFA challenges or the email/password sign-in form based on the current authentication status.
 *
 * @returns A React Native screen component, or `null` if redirecting due to being already signed in.
 */
export default function SignIn() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signIn, errors: clerkErrors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");

  const isSubmitting = fetchStatus === "fetching";

  // Client Trust / MFA code needed
  const needsClientTrust = signIn?.status === "needs_client_trust";
  const needsSecondFactor = signIn?.status === "needs_second_factor";
  const needsCode = needsClientTrust || needsSecondFactor;

  // ── Step 1: Email + Password ────────────────────────────────────
  const handleSignIn = useCallback(async () => {
    setLocalError("");

    if (!email.trim() || !password) {
      setLocalError("Email and password are required.");
      return;
    }
    if (!isValidEmail(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    // If we're already in client_trust/second_factor state, try MFA code
    if (needsClientTrust) {
      const emailCodeFactor = signIn.supportedSecondFactors?.find(
        (f) => f.strategy === "email_code"
      );
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
        return;
      }
    }

    const { error } = await signIn.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) {
      setLocalError(
        clerkErrors?.fields?.identifier?.message ??
          clerkErrors?.fields?.password?.message ??
          error.message ??
          "Invalid email or password. Please try again."
      );
      return;
    }

    // Check post-sign-in status
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          const url = decorateUrl("/(tabs)");
          if (url.startsWith("http")) {
            Linking.openURL(url);
          } else {
            router.push(url as any);
          }
        },
      });
    } else if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors?.find(
        (f) => f.strategy === "email_code"
      );
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    }
    // needs_second_factor is handled in the UI
  }, [email, password, signIn, clerkErrors, router, needsClientTrust]);

  // ── MFA / Client Trust code verification ────────────────────────
  const handleVerifyCode = useCallback(async () => {
    setLocalError("");

    if (!code.trim() || code.trim().length < 6) {
      setLocalError("Please enter the 6-digit code.");
      return;
    }

    if (needsClientTrust) {
      const { error } = await signIn.mfa.verifyEmailCode({
        code: code.trim(),
      });
      if (error) {
        setLocalError(
          clerkErrors?.fields?.code?.message ??
            error.message ??
            "Invalid code. Please try again."
        );
        return;
      }
    } else if (needsSecondFactor) {
      const totpFactor = signIn.supportedSecondFactors?.find(
        (f) => f.strategy === "totp"
      );
      if (totpFactor) {
        const { error } = await signIn.mfa.verifyTOTP({ code: code.trim() });
        if (error) {
          setLocalError(
            clerkErrors?.fields?.code?.message ??
              error.message ??
              "Invalid code. Please try again."
          );
          return;
        }
      } else {
        // Try email code as fallback
        const { error } = await signIn.mfa.verifyEmailCode({
          code: code.trim(),
        });
        if (error) {
          setLocalError(
            clerkErrors?.fields?.code?.message ??
              error.message ??
              "Invalid code. Please try again."
          );
          return;
        }
      }
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          const url = decorateUrl("/(tabs)");
          if (url.startsWith("http")) {
            Linking.openURL(url);
          } else {
            router.push(url as any);
          }
        },
      });
    }
  }, [code, signIn, clerkErrors, router, needsClientTrust, needsSecondFactor]);

  // ── Redirect if already signed in ──────────────────────────────
  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace("/(tabs)");
    }
  }, [authLoaded, isSignedIn, router])

  if (!authLoaded) {
    return (
      <View className="auth-loader">
        <ActivityIndicator size="large" color="#ea7a53" />
      </View>
    );
  }

  // ── MFA / Client Trust code UI ──────────────────────────────────
  if (needsCode) {
    return (
      <SafeAreaView className="auth-safe-area">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            className="auth-scroll"
            contentContainerClassName="grow"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="auth-content">
              <Pressable
                className="auth-back"
                onPress={() => {
                  signIn.reset();
                  setCode("");
                  setLocalError("");
                }}
              >
                <Text className="auth-back-text">← Start over</Text>
              </Pressable>

              <View className="auth-brand-block">
                <Text className="auth-title">Verify your identity</Text>
                <Text className="auth-subtitle">
                  {needsClientTrust
                    ? "We sent a verification code to your email for additional security."
                    : "Enter your two-factor authentication code."}
                </Text>
              </View>

              <View className="auth-card">
                <View className="auth-form">
                  <View className="auth-field">
                    <Text className="auth-label">
                      {needsClientTrust
                        ? "Verification code"
                        : "Authentication code"}
                    </Text>
                    <TextInput
                      className={clsx(
                        "auth-code-input",
                        localError && "auth-code-input-error"
                      )}
                      placeholder="000000"
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                      value={code}
                      onChangeText={(t) => {
                        setCode(t.replace(/[^0-9]/g, ""));
                        setLocalError("");
                      }}
                      editable={!isSubmitting}
                    />
                    {localError ? (
                      <Text className="auth-error">{localError}</Text>
                    ) : null}
                  </View>

                  <Pressable
                    className={clsx(
                      "auth-button",
                      (isSubmitting || code.trim().length < 6) && "auth-button-disabled"
                    )}
                    onPress={handleVerifyCode}
                    disabled={isSubmitting || code.trim().length < 6}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#081126" />
                    ) : (
                      <Text className="auth-button-text">Verify</Text>
                    )}
                  </Pressable>
                </View>

                {needsClientTrust && (
                  <Pressable
                    className="auth-resend"
                    onPress={() => signIn.mfa.sendEmailCode()}
                    disabled={isSubmitting}
                  >
                    <Text
                      className={clsx(
                        isSubmitting ? "auth-resend-disabled" : "auth-resend-text"
                      )}
                    >
                      Resend code
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Sign-in form UI ─────────────────────────────────────────────
  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="grow"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="auth-content">

            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <View className="auth-logo-mark">
                  <Text className="auth-logo-mark-text">R</Text>
                </View>
                <View>
                  <Text className="auth-wordmark">Reccurly</Text>
                  <Text className="auth-wordmark-sub">
                    Subscription tracking
                  </Text>
                </View>
              </View>

              <Text className="auth-title">Welcome back</Text>
              <Text className="auth-subtitle">
                Sign in to continue tracking your subscriptions.
              </Text>
            </View>

            <View className="auth-card">
              <View className="auth-form">
                {/* Email */}
                <View className="auth-field">
                  <Text className="auth-label">Email</Text>
                  <TextInput
                    className={clsx(
                      "auth-input",
                      !email && localError && "auth-input-error"
                    )}
                    placeholder="you@example.com"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setLocalError("");
                    }}
                    editable={!isSubmitting}
                  />
                </View>

                {/* Password */}
                <View className="auth-field">
                  <View className="flex-row items-center justify-between">
                    <Text className="auth-label">Password</Text>
                  </View>
                  <TextInput
                    className={clsx(
                      "auth-input",
                      !password && localError && "auth-input-error"
                    )}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    secureTextEntry
                    autoComplete="current-password"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      setLocalError("");
                    }}
                    editable={!isSubmitting}
                  />
                </View>

                {/* Local error */}
                {localError ? (
                  <Text className="auth-error">{localError}</Text>
                ) : null}

                {/* Submit */}
                <Pressable
                  className={clsx(
                    "auth-button",
                    isSubmitting && "auth-button-disabled"
                  )}
                  onPress={handleSignIn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#081126" />
                  ) : (
                    <Text className="auth-button-text">Sign in</Text>
                  )}
                </Pressable>
              </View>

              {/* Divider */}
              <View className="auth-divider-row">
                <View className="auth-divider-line" />
                <Text className="auth-divider-text">New to Reccurly?</Text>
                <View className="auth-divider-line" />
              </View>

              <Link href="/(auth)/sign-up" asChild>
                <Pressable className="auth-secondary-button">
                  <Text className="auth-secondary-button-text">
                    Create account
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
