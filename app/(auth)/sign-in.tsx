import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

export default function signIn() {
  return (
    <View>
      <Text>sign-I</Text>
      <Link href="/(auth)/sign-up">Create Account</Link>
    </View>
  )
}
