import { useAuth } from "@clerk/expo";
import { Link, Redirect } from "expo-router";
import { styled } from "nativewind";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

/**
 * Renders the onboarding screen for unauthenticated users, with loading and redirect behavior based on authentication status.
 */
export default function Onboarding() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#ea7a53" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView className="auth-safe-area">
      <ScrollView
        className="auth-scroll"
        contentContainerClassName="grow"
        showsVerticalScrollIndicator={false}
      >
        <View className="auth-content">
          {/* Brand Block */}
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

            <Text className="auth-title">Track smarter.</Text>
            <Text className="auth-title">Spend wiser.</Text>

            <Text className="auth-subtitle">
              Monitor all your subscriptions in one place. Get renewal
              reminders, track spending, and take control of your recurring
              payments — effortlessly.
            </Text>
          </View>

          {/* Features */}
          <View className="mt-10 gap-4">
            <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <View className="size-10 items-center justify-center rounded-xl bg-accent/15">
                <Text className="text-lg">📊</Text>
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-base text-primary">
                  All subscriptions at a glance
                </Text>
                <Text className="mt-0.5 font-sans-medium text-sm text-muted-foreground">
                  See every service, plan, and cost in one unified dashboard.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <View className="size-10 items-center justify-center rounded-xl bg-accent/15">
                <Text className="text-lg">🔔</Text>
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-base text-primary">
                  Never miss a renewal
                </Text>
                <Text className="mt-0.5 font-sans-medium text-sm text-muted-foreground">
                  Smart reminders before every billing date so you&apos;re always in
                  control.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <View className="size-10 items-center justify-center rounded-xl bg-accent/15">
                <Text className="text-lg">📈</Text>
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-base text-primary">
                  Insights that pay off
                </Text>
                <Text className="mt-0.5 font-sans-medium text-sm text-muted-foreground">
                  Spot trends, cut waste, and save money with spending
                  analytics.
                </Text>
              </View>
            </View>
          </View>

          {/* CTA Buttons */}
          <View className="mt-12 gap-3">
            <Link href="/(auth)/sign-up" asChild>
              <Pressable accessibilityRole="button" className="auth-button">
                <Text className="auth-button-text">Create free account</Text>
              </Pressable>
            </Link>

            <Link href="/(auth)/sign-in" asChild>
              <Pressable accessibilityRole="button" className="auth-secondary-button">
                <Text className="auth-secondary-button-text">
                  I already have an account
                </Text>
              </Pressable>
            </Link>
          </View>

          {/* Trust footer */}
          <Text className="mt-8 text-center font-sans-medium text-xs text-muted-foreground">
            No credit card required · Free to start · Cancel anytime
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
