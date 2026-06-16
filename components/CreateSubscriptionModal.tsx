import { icons } from "@/constants/icons";
import { clsx } from "clsx";
import dayjs from "dayjs";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

const CATEGORIES = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: "#f9a8d4",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#f5c542",
  Productivity: "#a7f3d0",
  Cloud: "#93c5fd",
  Music: "#d8b4fe",
  Other: "#cbd5e1",
};

const FREQUENCIES = ["Monthly", "Yearly"] as const;

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
}

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<"Monthly" | "Yearly">("Monthly");
  const [category, setCategory] = useState<string>("");
  const [localError, setLocalError] = useState("");

  const priceNum = parseFloat(price);
  const isValid = name.trim().length > 0 && !isNaN(priceNum) && priceNum > 0;

  const handleSubmit = () => {
    if (!isValid) {
      setLocalError("Please enter a valid name and price.");
      return;
    }

    const now = dayjs();
    const renewalDate =
      frequency === "Monthly" ? now.add(1, "month") : now.add(1, "year");

    const newSubscription: Subscription = {
      id: `custom-${name.toLowerCase().replace(/\s+/g, "-")}-${now.unix()}`,
      icon: icons.wallet,
      name: name.trim(),
      price: priceNum,
      currency: "USD",
      category: category || "Other",
      status: "active",
      startDate: now.toISOString(),
      renewalDate: renewalDate.toISOString(),
      billing: frequency,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"],
    };

    onCreate(newSubscription);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("");
    setLocalError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable className="modal-overlay" onPress={handleClose}>
          <Pressable
            className="modal-container"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable className="modal-close" onPress={handleClose}>
                <Text className="modal-close-text">✕</Text>
              </Pressable>
            </View>

            {/* Body */}
            <ScrollView
              className="modal-body"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Name Field */}
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  className={clsx("auth-input", !name.trim() && localError && "auth-input-error")}
                  placeholder="e.g. Netflix"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    setLocalError("");
                  }}
                />
              </View>

              {/* Price Field */}
              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <TextInput
                  className={clsx("auth-input", (isNaN(priceNum) || priceNum <= 0) && localError && "auth-input-error")}
                  placeholder="0.00"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={(t) => {
                    setPrice(t);
                    setLocalError("");
                  }}
                />
              </View>

              {/* Frequency Field */}
              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  {FREQUENCIES.map((freq) => (
                    <Pressable
                      key={freq}
                      className={clsx(
                        "picker-option",
                        frequency === freq && "picker-option-active"
                      )}
                      onPress={() => setFrequency(freq)}
                    >
                      <Text
                        className={clsx(
                          "picker-option-text",
                          frequency === freq && "picker-option-text-active"
                        )}
                      >
                        {freq}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Category Field */}
              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      className={clsx(
                        "category-chip",
                        category === cat && "category-chip-active"
                      )}
                      onPress={() =>
                        setCategory(cat === category ? "" : cat)
                      }
                    >
                      <Text
                        className={clsx(
                          "category-chip-text",
                          category === cat && "category-chip-text-active"
                        )}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Error message */}
              {localError ? (
                <Text className="auth-error">{localError}</Text>
              ) : null}

              {/* Submit Button */}
              <Pressable
                className={clsx(
                  "auth-button",
                  !isValid && "auth-button-disabled"
                )}
                onPress={handleSubmit}
                disabled={!isValid}
              >
                <Text className="auth-button-text">Add Subscription</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
