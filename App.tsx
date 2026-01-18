import { StatusBar } from 'expo-status-bar';
import React from 'react';
import AppNavigator, { Theme } from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: Theme.background }}>
      <AppNavigator />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}