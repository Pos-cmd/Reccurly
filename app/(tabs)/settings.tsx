import images from "@/constants/images";
import { useClerk, useUser } from "@clerk/expo";
import { styled } from "nativewind";
import { useCallback } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

/**
 * Renders a settings screen displaying the authenticated user's profile and account options.
 */
export default function Settings() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const displayName =
    user?.fullName ?? user?.firstName ?? "User";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const avatarSource = user?.imageUrl
    ? { uri: user.imageUrl }
    : images.avatar;

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-30"
      >
        {/* Profile header */}
        <View className="mb-8 flex-row items-center gap-4">
          <Image source={avatarSource} className="size-16 rounded-full" />
          <View className="flex-1">
            <Text className="text-xl font-sans-bold text-primary">
              {displayName}
            </Text>
            {email ? (
              <Text className="mt-0.5 text-sm font-sans-medium text-muted-foreground">
                {email}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Settings sections (placeholder) */}
        <View className="gap-4">
          <Text className="text-xs font-sans-semibold uppercase tracking-[1px] text-muted-foreground">
            Account
          </Text>

          <View className="rounded-2xl border border-border bg-card">
            <Pressable className="border-b border-border px-5 py-4">
              <Text className="text-base font-sans-medium text-primary">
                Personal Information
              </Text>
            </Pressable>
            <Pressable className="border-b border-border px-5 py-4">
              <Text className="text-base font-sans-medium text-primary">
                Notifications
              </Text>
            </Pressable>
            <Pressable className="px-5 py-4">
              <Text className="text-base font-sans-medium text-primary">
                Security
              </Text>
            </Pressable>
          </View>

          <Text className="mt-4 text-xs font-sans-semibold uppercase tracking-[1px] text-muted-foreground">
            Data
          </Text>

          <View className="rounded-2xl border border-border bg-card">
            <Pressable className="border-b border-border px-5 py-4">
              <Text className="text-base font-sans-medium text-primary">
                Export Data
              </Text>
            </Pressable>
            <Pressable className="px-5 py-4">
              <Text className="text-base font-sans-medium text-primary">
                Privacy Policy
              </Text>
            </Pressable>
          </View>

          {/* Sign Out */}
          <View className="mt-8">
            <Pressable
              className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 py-4"
              onPress={handleSignOut}
            >
              <Text className="font-sans-bold text-base text-destructive">
                Sign out
              </Text>
            </Pressable>
          </View>

          <Text className="mt-4 text-center font-sans-medium text-xs text-muted-foreground">
            Reccurly v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
