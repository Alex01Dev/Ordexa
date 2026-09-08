import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { initDatabase } from './src/database/schema';
import { AppNavigator } from './src/navigation/AppNavigator';
import { View, ActivityIndicator } from 'react-native';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDatabase();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}