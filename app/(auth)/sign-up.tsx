import { useAuth, useSignUp } from "@clerk/expo";
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function SignUp() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signUp, errors: clerkErrors, fetchStatus } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");

  const isSubmitting = fetchStatus === "fetching";

  const needsVerification =
    signUp &&
    signUp.status === "missing_requirements" &&
    (signUp.unverifiedFields ?? []).includes("email_address") &&
    (signUp.missingFields ?? []).length === 0;

  // ── Step 1: Email + Password ────────────────────────────────────
  const handleSignUp = useCallback(async () => {
    setLocalError("");

    if (!email.trim() || !password || !confirmPassword) {
      setLocalError("All fields are required.");
      return;
    }
    if (!isValidEmail(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords don't match.");
      return;
    }

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) {
      setLocalError(
        clerkErrors?.fields?.emailAddress?.message ??
          clerkErrors?.fields?.password?.message ??
          error.message ??
          "Something went wrong. Please try again."
      );
      return;
    }

    // Send verification code
    await signUp.verifications.sendEmailCode();
  }, [email, password, confirmPassword, signUp, clerkErrors]);

  // ── Step 2: Verify email code ───────────────────────────────────
  const handleVerify = useCallback(async () => {
    setLocalError("");

    if (!code.trim() || code.trim().length < 6) {
      setLocalError("Please enter the 6-digit code.");
      return;
    }

    const { error } = await signUp.verifications.verifyEmailCode({
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

    if (signUp.status === "complete") {
      await signUp.finalize({
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
  }, [code, signUp, clerkErrors, router]);

  const handleResendCode = useCallback(async () => {
    await signUp.verifications.sendEmailCode();
  }, [signUp]);

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

  // ── Verification step UI ────────────────────────────────────────
  if (needsVerification) {
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
              {/* Back button */}
              <Pressable
                className="auth-back"
                onPress={() => signUp.reset()}
              >
                <Text className="auth-back-text">← Change email</Text>
              </Pressable>

              <View className="auth-brand-block">
                <Text className="auth-title">Check your email</Text>
                <Text className="auth-subtitle">
                  We sent a 6-digit verification code to{" "}
                  <Text className="font-sans-bold text-primary">
                    {email || signUp.emailAddress}
                  </Text>
                </Text>
              </View>

              <View className="auth-card">
                <View className="auth-form">
                  <View className="auth-field">
                    <Text className="auth-label">Verification code</Text>
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
                    onPress={handleVerify}
                    disabled={isSubmitting || code.trim().length < 6}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#081126" />
                    ) : (
                      <Text className="auth-button-text">Verify email</Text>
                    )}
                  </Pressable>
                </View>

                <Pressable
                  className="auth-resend"
                  onPress={handleResendCode}
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
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Sign-up form UI ──────────────────────────────────────────────
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

              <Text className="auth-title">Create your account</Text>
              <Text className="auth-subtitle">
                Start tracking your subscriptions in under a minute.
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
                  <Text className="auth-label">Password</Text>
                  <TextInput
                    className={clsx(
                      "auth-input",
                      !password && localError && "auth-input-error"
                    )}
                    placeholder="At least 8 characters"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    secureTextEntry
                    autoComplete="new-password"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      setLocalError("");
                    }}
                    editable={!isSubmitting}
                  />
                  <Text className="auth-helper">
                    Must be at least 8 characters.
                  </Text>
                </View>

                {/* Confirm Password */}
                <View className="auth-field">
                  <Text className="auth-label">Confirm password</Text>
                  <TextInput
                    className={clsx(
                      "auth-input",
                      !confirmPassword && localError && "auth-input-error"
                    )}
                    placeholder="Re-enter your password"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    secureTextEntry
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
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
                  onPress={handleSignUp}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#081126" />
                  ) : (
                    <Text className="auth-button-text">Create account</Text>
                  )}
                </Pressable>
              </View>

              {/* Divider */}
              <View className="auth-divider-row">
                <View className="auth-divider-line" />
                <Text className="auth-divider-text">Already a member?</Text>
                <View className="auth-divider-line" />
              </View>

              <Link href="/(auth)/sign-in" asChild>
                <Pressable className="auth-secondary-button">
                  <Text className="auth-secondary-button-text">Sign in</Text>
                </Pressable>
              </Link>
            </View>

            <Text className="mt-6 text-center font-sans-medium text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy
              Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
