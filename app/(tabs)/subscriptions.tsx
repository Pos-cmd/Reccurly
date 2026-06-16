import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscriptions } from "@/context/SubscriptionsContext";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SubscriptionsScreen = () => {
  const { subscriptions } = useSubscriptions();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredSubscriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return subscriptions;

    return subscriptions.filter(
      (sub) =>
        sub.name.toLowerCase().includes(query) ||
        sub.category?.toLowerCase().includes(query) ||
        sub.plan?.toLowerCase().includes(query)
    );
  }, [searchQuery, subscriptions]);

  const handleToggleExpand = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id));
    },
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: Subscription }) => (
      <SubscriptionCard
        name={item.name}
        price={item.price}
        currency={item.currency}
        icon={item.icon}
        billing={item.billing}
        color={item.color}
        category={item.category}
        plan={item.plan}
        renewalDate={item.renewalDate}
        paymentMethod={item.paymentMethod}
        startDate={item.startDate}
        status={item.status}
        expanded={expandedId === item.id}
        onPress={() => handleToggleExpand(item.id)}
      />
    ),
    [expandedId, handleToggleExpand]
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-5 pt-5">
        <ListHeading title="My Subscriptions" />
        <TextInput
          className="mt-4 rounded-2xl border border-border bg-card px-4 py-3 text-base font-sans text-primary"
          placeholder="Search subscriptions..."
          placeholderTextColor="rgba(0, 0, 0, 0.4)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerClassName="px-5 pt-4 pb-8 gap-3"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-base font-sans-medium text-muted-foreground">
              No subscriptions found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default SubscriptionsScreen
