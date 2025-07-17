import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { loginUser, checkAuthStatus } from '../services/authService';
import colors from '../constants/colors';
import strings from '../constants/strings';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Check if user is already logged in on screen mount
    const checkAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        
        if (authStatus.isAuthenticated) {
          // If already logged in, navigate to Dashboard
          navigation.replace('Dashboard');
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        // Continue showing login screen if there's an error
      }
    };
    
    checkAuth();
  }, [navigation]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(username, password);
      setLoading(false);

      if (response.success) {
        // Navigate to Dashboard screen after successful login and replace the route
        // so the user can't go back to the login screen using the back button
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Error', response.error || strings.errorLogin);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', strings.errorLogin);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.login}</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder={strings.username}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder={strings.password}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>{strings.loginButton}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>
            {strings.forgotPasswordLink}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupText}>{strings.noAccount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: colors.primary,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
  },
  loginButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    marginTop: 15,
    alignSelf: 'center',
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
  },
  signupButton: {
    marginTop: 15,
    alignSelf: 'center',
  },
  signupText: {
    color: colors.primary,
    fontSize: 14,
  },
});

export default LoginScreen;
