import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import colors from '../constants/colors';
import strings from '../constants/strings';
import config from '../constants/config';

const ImagePickerModal = ({ visible, onClose, onImageSelect, currentCount = 0 }) => {
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasStoragePermission, setHasStoragePermission] = useState(false);

  const options = {
    mediaType: 'photo',
    quality: 0.7,
    maxWidth: 800,
    maxHeight: 800,
    includeBase64: false,
    saveToPhotos: false,
    selectionLimit: 1, // Default to 1 for camera
  };
  
  // Check permissions when component mounts and when modal becomes visible
  useEffect(() => {
    if (visible) {
      checkCameraPermission();
      checkStoragePermission();
    }
  }, [visible]);

  // Check camera permission
  const checkCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        setHasCameraPermission(result);
        return result;
      } catch (error) {
        console.error('Error checking camera permission:', error);
        return false;
      }
    } else {
      // For iOS, permissions are handled by the image picker
      return true;
    }
  };

  // Check storage permission
  const checkStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API 33+), use the specific photo library permission
        // For older versions, use READ_EXTERNAL_STORAGE
        const permission = parseInt(Platform.Version, 10) >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const result = await PermissionsAndroid.check(permission);
        setHasStoragePermission(result);
        return result;
      } catch (error) {
        console.error('Error checking storage permission:', error);
        return false;
      }
    } else {
      // For iOS, permissions are handled by the image picker
      return true;
    }
  };
  
  // Request camera permission
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "This app needs access to your camera to take photos for evidence capture.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        
        const permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasCameraPermission(permissionGranted);
        return permissionGranted;
      } catch (err) {
        console.warn('Error requesting camera permission:', err);
        return false;
      }
    } else {
      // For iOS, permissions are handled by the image picker
      setHasCameraPermission(true);
      return true;
    }
  };
  
  // Open app settings
  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Check if permission is already granted
      let hasPermission = await checkCameraPermission();
      
      // If not granted, request it
      if (!hasPermission) {
        hasPermission = await requestCameraPermission();
      }
      
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to take photos. Would you like to open settings to grant permission?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: openSettings }
          ]
        );
        return;
      }
      
      // Camera only takes one photo at a time
      const cameraOptions = {
        ...options,
        selectionLimit: 1,
      };
      
      const result = await launchCamera(cameraOptions);
      
      if (result.didCancel) {
        console.log('User cancelled taking a photo');
      } else if (result.errorCode) {
        console.log('Image picker error: ', result.errorMessage);
        
        // Handle specific error codes
        if (result.errorCode === 'camera_unavailable') {
          Alert.alert("Error", "Camera is not available on this device");
        } else if (result.errorCode === 'permission') {
          Alert.alert(
            "Permission Denied",
            "Camera permission is required. Would you like to open settings to grant permission?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: openSettings }
            ]
          );
        } else {
          Alert.alert("Error", `Camera error: ${result.errorMessage}`);
        }
      } else if (result.assets && result.assets.length > 0) {
        // Wrap the single image in an array for consistent handling with gallery selection
        const images = result.assets.map(image => ({
          ...image,
          timestamp: new Date()
        }));
        
        onImageSelect(images);
        onClose();
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  // Request storage permission for Android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API 33+), use the specific photo library permission
        // For older versions, use READ_EXTERNAL_STORAGE
        const permission = parseInt(Platform.Version, 10) >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted = await PermissionsAndroid.request(
          permission,
          {
            title: "Photo Library Access Permission",
            message: "This app needs access to your photo library to select images.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        
        const permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasStoragePermission(permissionGranted);
        return permissionGranted;
      } catch (err) {
        console.warn('Error requesting storage permission:', err);
        return false;
      }
    }
    // For iOS, permissions are handled by the image picker
    return true;
  };

  const handleChooseFromGallery = async () => {
    try {
      // Check if permission is already granted
      let hasPermission = await checkStoragePermission();
      
      // If not granted, request it
      if (Platform.OS === 'android' && !hasPermission) {
        hasPermission = await requestStoragePermission();
      }
      
      if (Platform.OS === 'android' && !hasPermission) {
        Alert.alert(
          "Permission Required",
          "Photo library access is needed to select images. Would you like to open settings to grant permission?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: openSettings }
          ]
        );
        return;
      }
      
      // Update options for multiple selection (up to maxImagesAllowed total)
      const maxImages = config.maxImagesAllowed;
      const remainingSlots = maxImages - currentCount;
      const galleryOptions = {
        ...options,
        selectionLimit: Math.max(1, remainingSlots), // Allow selection up to remaining slots, min 1
        mediaType: 'photo', 
        includeBase64: false,
      };

      const result = await launchImageLibrary(galleryOptions);
      
      if (result.didCancel) {
        console.log('User cancelled image picker');
      } else if (result.errorCode) {
        console.log('Image picker error: ', result.errorMessage);
        
        if (result.errorCode === 'permission') {
          Alert.alert(
            "Permission Denied",
            "Photo library access is required. Would you like to open settings to grant permission?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: openSettings }
            ]
          );
        } else {
          Alert.alert("Error", `Gallery error: ${result.errorMessage}`);
        }
      } else if (result.assets && result.assets.length > 0) {
        // Add timestamp to each image
        const images = result.assets.map(image => ({
          ...image,
          timestamp: new Date()
        }));
        
        onImageSelect(images);
        onClose();
      }
    } catch (error) {
      console.log('Error picking from gallery:', error);
      Alert.alert("Error", "Failed to access photo library. Please try again.");
    }
  };

  // Helper function for debugging permissions
  const debugPermissions = async () => {
    if (Platform.OS === 'android') {
      const cameraStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      
      const storagePermission = parseInt(Platform.Version, 10) >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      
      const storageStatus = await PermissionsAndroid.check(storagePermission);
      
      console.log('Camera permission status:', cameraStatus);
      console.log('Storage permission status:', storageStatus);
      console.log('Android version:', Platform.Version);
    }
  };
  
  // Debug permissions when modal opens
  useEffect(() => {
    if (visible) {
      debugPermissions();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{strings.captureEvidence}</Text>
          
          <TouchableOpacity 
            style={styles.optionButton} 
            onPress={handleTakePhoto}
          >
            <Text style={styles.optionText}>{strings.takePhoto}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionButton} 
            onPress={handleChooseFromGallery}
          >
            <Text style={styles.optionText}>{strings.chooseFromGallery}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
          >
            <Text style={styles.cancelText}>{strings.cancel}</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity 
              style={styles.debugButton} 
              onPress={async () => {
                await debugPermissions();
                Alert.alert(
                  "Permission Status",
                  `Camera: ${hasCameraPermission ? 'Granted' : 'Denied'}\nStorage: ${hasStoragePermission ? 'Granted' : 'Denied'}`
                );
              }}
            >
              <Text style={styles.debugText}>Check Permissions</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: colors.black,
  },
  optionButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  optionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: colors.lightGrey,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelText: {
    color: colors.grey,
    fontSize: 16,
    fontWeight: '500',
  },
  debugButton: {
    backgroundColor: '#FFE0E0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  debugText: {
    color: '#FF0000',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ImagePickerModal;
