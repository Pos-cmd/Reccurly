import { Link } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

export default function signUp() {
  return (
    <View>
      <Text>sign-I</Text>
      <Link href="/(auth)/sign-in">Sign In</Link>
    </View>
  )
}
