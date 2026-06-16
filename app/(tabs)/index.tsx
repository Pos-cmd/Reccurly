import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import { HOME_BALANCE, HOME_SUBSCRIPTIONS, UPCOMING_SUBSCRIPTIONS } from "@/constants/data";
import { icons } from "@/constants/icons";
import images from "@/constants/images";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@clerk/expo";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useState } from "react";
import { FlatList, Image, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
 
const SafeAreaView = styled(RNSafeAreaView)
/**
 * Renders the home screen displaying the user's subscription overview.
 *
 * Shows the logged-in user's avatar and name, the current account balance with renewal date,
 * upcoming subscription renewals, and a list of subscriptions with expandable details.
 */
export default function App() {

  const { user } = useUser();
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null)

  const displayName = user?.fullName ?? user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "User";
  const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : images.avatar;

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      
    <FlatList 
      ListHeaderComponent={() => (
        <>
          <View className="home-header">
            <View className="home-user">
              <Image source={avatarSource} className="home-avatar"/>
              <Text className="home-user-name" numberOfLines={1}>{displayName}</Text>
            </View>

            <Image source={icons.add} className="home-add-icon" />
          </View>

          <View className="home-balance-card">
            <Text className="home-balance-label">Balance</Text>

            <View className="home-balance-row">
              <Text className="home-balance-amount">
                {formatCurrency(HOME_BALANCE.amount)}
              </Text>
              <Text className="home-balance-date">
                {(() => {
                  const date = dayjs(HOME_BALANCE.nextRenewalDate);
                  return date.isValid() ? date.format('MM/DD') : 'N/A';
                })()}
              </Text>
            </View>
          </View>

          <View className="mb-5">
            <ListHeading title="Upcoming" />
            <FlatList 
              data={UPCOMING_SUBSCRIPTIONS}
              renderItem={({item}) => (
                <UpcomingSubscriptionCard {...item} />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              ListEmptyComponent={<Text className="home-empty-state">No upcoming renewals yet.</Text>}
            />
          </View>

          <ListHeading title="All Subscription" />
        </>
      )}
      data={HOME_SUBSCRIPTIONS}
      keyExtractor={(item) => item.id}
      renderItem={({item}) => (
        <SubscriptionCard 
          {...item}
          expanded={expandedSubscriptionId === item.id}
          onPress={
            () => setExpandedSubscriptionId((currentId) => (
              currentId === item.id ? null : item.id
            ))
          }
        />
      )}
      extraData={expandedSubscriptionId}
      ItemSeparatorComponent={() => <View className="h-4"/>}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<Text className="home-empty-state">No subscription yet.</Text>}
      contentContainerClassName="pb-30"
    />
    </SafeAreaView>
  );
}
