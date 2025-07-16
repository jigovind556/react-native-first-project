import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Geolocation from 'react-native-geolocation-service';
import colors from '../constants/colors';
import strings from '../constants/strings';
import ImagePickerModal from '../components/ImagePickerModal';
import { submitEvidence } from '../services/fakeEvidenceApi';

const EvidenceTagsScreen = ({ navigation, route }) => {
  const { item, storeCode, mediaPlanId } = route.params || {};
  
  // Request location permission when component mounts
  useEffect(() => {
    requestLocationPermission();
  }, []);
  
  const [isValidEvidence, setIsValidEvidence] = useState('');
  const [reason, setReason] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState(null);
  const [captureTime, setCaptureTime] = useState(null);
  const [locationError, setLocationError] = useState(null);
  
  // DropDownPicker state variables
  const [openValidEvidenceDropdown, setOpenValidEvidenceDropdown] = useState(false);
  const [openReasonDropdown, setOpenReasonDropdown] = useState(false);
  const [validEvidenceItems, setValidEvidenceItems] = useState([
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' }
  ]);
  const [reasonItems, setReasonItems] = useState([
    { label: 'Element Fixture Not Ready', value: 'Element Fixture Not Ready' },
    { label: 'Product Missing', value: 'Product Missing' },
    { label: 'Space Not Available', value: 'Space Not Available' },
    { label: 'Store Closed', value: 'Store Closed' },
    { label: 'Other', value: 'Other' }
  ]);
  
  // Request location permissions for Android
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      // iOS permission handling is done by Geolocation service
      return true;
    }
    
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "This app needs access to your location to record where evidence was captured.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };
  
  // Get current location
  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      setLocationError('Location permission denied');
      return;
    }
    
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationError(null);
      },
      (error) => {
        setLocationError(error.message);
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };
  
  const handleImageSelect = (image) => {
    setSelectedImage(image);
    
    // Set capture time
    const now = new Date();
    setCaptureTime(now);
    
    // Get location when an image is selected
    getCurrentLocation();
  };
  
  const handleSubmit = async () => {
    // Validate inputs
    if (isValidEvidence === '') {
      Alert.alert('Error', 'Please select if valid evidence is available');
      return;
    }
    
    if (isValidEvidence === 'Yes' && !selectedImage) {
      Alert.alert('Error', 'Please capture or select an image');
      return;
    }
    
    if (isValidEvidence === 'No' && !reason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }
    
    // Prepare data for submission
    const evidenceData = {
      itemId: item.id,
      brandName: item.brandName,
      elementName: item.elementName,
      storeCode,
      mediaPlanId,
      isValidEvidence,
      capturedAt: captureTime ? captureTime.toISOString() : new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      ...(isValidEvidence === 'Yes' && {
        imageUri: selectedImage.uri,
        imageType: selectedImage.type,
        imageName: selectedImage.fileName || `image_${Date.now()}.jpg`,
        location: location || { latitude: null, longitude: null, accuracy: null },
      }),
      ...(isValidEvidence === 'No' && {
        reason,
      }),
    };
    
    setIsSubmitting(true);
    
    try {
      const response = await submitEvidence(evidenceData);
      setIsSubmitting(false);
      
      Alert.alert(
        'Success', 
        strings.evidenceSubmitted,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Dashboard') 
          }
        ]
      );
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert('Error', error.message || 'Failed to submit evidence');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>{strings.evidenceTags}</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Store Code:</Text>
              <Text style={styles.infoValue}>{storeCode}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Media Plan ID:</Text>
              <Text style={styles.infoValue}>{mediaPlanId}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Brand Name:</Text>
              <Text style={styles.infoValue}>{item?.brandName}</Text>
            </View>
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>{strings.isValidEvidenceAvailable}</Text>
            
            <View style={[styles.pickerContainer, { zIndex: 3000 }]}>
              <DropDownPicker
                open={openValidEvidenceDropdown}
                value={isValidEvidence}
                items={validEvidenceItems}
                setOpen={setOpenValidEvidenceDropdown}
                setValue={setIsValidEvidence}
                setItems={setValidEvidenceItems}
                placeholder="Select..."
                style={styles.dropDownPicker}
                dropDownContainerStyle={styles.dropDownContainer}
              />
            </View>
            
            {isValidEvidence === 'Yes' && (
              <View style={styles.imageSection}>
                <View style={styles.imageButtonsRow}>
                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={() => setImagePickerVisible(true)}
                  >
                    <Text style={styles.imageButtonText}>
                      {selectedImage ? 'Change Image' : 'Select Image'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {selectedImage && (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: selectedImage.uri }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <Text style={styles.imageInfoText} numberOfLines={1}>
                      {selectedImage.fileName || 'Image selected'}
                    </Text>
                    
                    {/* Location and Date/Time Information */}
                    <View style={styles.metadataContainer}>
                      <Text style={styles.metadataTitle}>Capture Details:</Text>
                      
                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>Date/Time:</Text>
                        <Text style={styles.metadataValue}>
                          {captureTime ? captureTime.toLocaleString() : 'Processing...'}
                        </Text>
                      </View>
                      
                      {location ? (
                        <>
                          <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Latitude:</Text>
                            <Text style={styles.metadataValue}>
                              {location.latitude.toFixed(6)}
                            </Text>
                          </View>
                          
                          <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Longitude:</Text>
                            <Text style={styles.metadataValue}>
                              {location.longitude.toFixed(6)}
                            </Text>
                          </View>
                        </>
                      ) : (
                        <Text style={styles.metadataError}>
                          {locationError || 'Fetching location...'}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}
            
            {isValidEvidence === 'No' && (
              <View>
                <Text style={styles.formLabel}>{strings.reason}</Text>
                <View style={[styles.pickerContainer, { zIndex: 2000 }]}>
                  <DropDownPicker
                    open={openReasonDropdown}
                    value={reason}
                    items={reasonItems}
                    setOpen={setOpenReasonDropdown}
                    setValue={setReason}
                    setItems={setReasonItems}
                    placeholder="Select Reason..."
                    style={styles.dropDownPicker}
                    dropDownContainerStyle={styles.dropDownContainer}
                  />
                </View>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>{strings.submit}</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>{strings.cancel}</Text>
            </TouchableOpacity>
          </View>
          
          <ImagePickerModal
            visible={imagePickerVisible}
            onClose={() => setImagePickerVisible(false)}
            onImageSelect={handleImageSelect}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey,
  },
  infoValue: {
    flex: 2,
    fontSize: 14,
    color: colors.black,
  },
  formContainer: {
    marginTop: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.black,
  },
  pickerContainer: {
    marginBottom: 40, // Increased margin to account for dropdown
  },
  dropDownPicker: {
    borderColor: colors.lightGrey,
    height: 50,
  },
  dropDownContainer: {
    borderColor: colors.lightGrey,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  imageButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    margin: 8,
  },
  imageButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageInfoText: {
    fontSize: 12,
    color: colors.grey,
    marginBottom: 8,
  },
  metadataContainer: {
    width: '100%',
    backgroundColor: colors.lightGrey,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    alignSelf: 'stretch',
    maxWidth: 300,
  },
  metadataTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metadataLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.grey,
  },
  metadataValue: {
    flex: 2,
    fontSize: 12,
    color: colors.black,
  },
  metadataError: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
});

export default EvidenceTagsScreen;
