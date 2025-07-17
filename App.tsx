import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';
import { isAuthValid } from './src/utils/apiFetch';
import { ActivityIndicator, View } from 'react-native';
import colors from './src/constants/colors';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      const authValid = await isAuthValid();
      console.log('authValid:', authValid);
      setIsLoggedIn(authValid);
      setIsLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator isLoggedIn={isLoggedIn} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
