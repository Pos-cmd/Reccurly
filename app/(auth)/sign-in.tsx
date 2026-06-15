import { Link } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

export default function SignIn() {
  return (
    <View>
      <Text>Sign In</Text>
      <Link href="/(auth)/sign-up">Create Account</Link>
    </View>
  )
}
