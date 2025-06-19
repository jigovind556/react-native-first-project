import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { resetPassword } from '../services/authService';
import colors from '../constants/colors';
import strings from '../constants/strings';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { email } = route.params || {};
  const [otp, setOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', strings.passwordsDoNotMatch);
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(email, otp, newPassword);
      setLoading(false);
      
      if (response.success) {
        Alert.alert('Success', strings.passwordResetSuccess, [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]);
      } else {
        Alert.alert('Error', strings.errorResetPassword);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', strings.errorResetPassword);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.resetPassword}</Text>
      
      <View style={styles.formContainer}>
        <Text style={styles.emailText}>Email: {email}</Text>
        
        <TextInput
          style={styles.input}
          placeholder={strings.enterOTP}
          value={otp}
          onChangeText={setOTP}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder={strings.newPassword}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder={strings.confirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>{strings.resetPasswordButton}</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{strings.backToLogin}</Text>
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
  emailText: {
    fontSize: 16,
    marginBottom: 15,
    color: colors.grey,
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
  resetButton: {
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
  backButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
  }
});

export default ResetPasswordScreen;
