import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AddEditScreen from '../screens/AddEditScreen';

// Minimal Theme definition required here for background styling
export const Theme = {
    primary: '#2563EB',
    secondary: '#F3F4F6',
    text_dark: '#1F2937',
    background: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
};

export type RootStackParamList = {
  Home: undefined;
  AddEdit: { id?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Theme.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddEdit" component={AddEditScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;