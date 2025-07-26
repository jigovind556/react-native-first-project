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
import ImageView from "react-native-image-viewing";
import DropDownPicker from 'react-native-dropdown-picker';
import Geolocation from 'react-native-geolocation-service';
import colors from '../constants/colors';
import strings from '../constants/strings';
import config from '../constants/config';
import ImagePickerModal from '../components/ImagePickerModal';
import { submitEvidence } from '../services/fakeEvidenceApi';
import { processImagesWithWatermark } from '../utils/imageWatermark';

const EvidenceTagsScreen = ({ navigation, route }) => {
  const { item, storeCode, mediaPlanId } = route.params || {};
  
  // Request location permission when component mounts
  useEffect(() => {
    requestLocationPermission();
  }, []);
  
  const [isValidEvidence, setIsValidEvidence] = useState('');
  const [reason, setReason] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState(null);
  const [captureTime, setCaptureTime] = useState(null);
  const [locationError, setLocationError] = useState(null);
  
  // Image viewer states
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  
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
      return null;
    }
    
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(locationData);
          setLocationError(null);
          resolve(locationData);
        },
        (error) => {
          setLocationError(error.message);
          console.log(error.code, error.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };
  
  const handleImageSelect = async (images) => {
    // Get max images limit from config
    const maxImages = config.maxImagesAllowed;
    
    // Set capture time
    const now = new Date();
    setCaptureTime(now);
    
    // Get location when images are selected
    await getCurrentLocation();
    
    // When adding more images, combine with existing ones
    let updatedImages;
    
    if (selectedImages.length > 0) {
      // We're adding more images to existing ones
      updatedImages = [...selectedImages, ...images];
      
      // Ensure we don't exceed the limit
      if (updatedImages.length > maxImages) {
        updatedImages = updatedImages.slice(0, maxImages);
        Alert.alert('Limit Reached', `Maximum ${maxImages} images are allowed. Only the first ${maxImages} images have been kept.`);
      }
    } else {
      // First time adding images
      updatedImages = images.length > maxImages ? images.slice(0, maxImages) : images;
      if (images.length > maxImages) {
        Alert.alert('Limit Reached', `Maximum ${maxImages} images are allowed. Only the first ${maxImages} images have been selected.`);
      }
    }
    
    // Show loading indicator
    setIsSubmitting(true);
    
    try {
      // Process images with watermark
      const processedImages = await processImagesWithWatermark(
        // Only process the newly added images
        selectedImages.length > 0 ? images : updatedImages,
        location,
        now
      );
      
      // Combine processed images with existing ones
      let finalImages;
      if (selectedImages.length > 0) {
        finalImages = [...selectedImages, ...processedImages];
        // Ensure we don't exceed the limit
        if (finalImages.length > maxImages) {
          finalImages = finalImages.slice(0, maxImages);
        }
      } else {
        finalImages = processedImages;
      }
      
      setSelectedImages(finalImages);
    } catch (error) {
      console.error('Error processing images:', error);
      Alert.alert('Error', 'Failed to process images with watermark. Using original images instead.');
      setSelectedImages(updatedImages);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubmit = async () => {
    // Validate inputs
    if (isValidEvidence === '') {
      Alert.alert('Error', 'Please select if valid evidence is available');
      return;
    }
    
    if (isValidEvidence === 'Yes' && selectedImages.length === 0) {
      Alert.alert('Error', 'Please capture or select at least one image');
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
        images: selectedImages.map((img, index) => ({
          imageUri: img.uri,
          imageType: img.type,
          imageName: img.fileName || `image_${Date.now()}_${index}.jpg`,
        })),
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
                  {selectedImages.length > 0 && (
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={() => setImagePickerVisible(true)}
                    >
                      <Text style={styles.imageButtonText}>Change Images</Text>
                    </TouchableOpacity>
                  )}
                  
                  {(selectedImages.length === 0 || selectedImages.length < config.maxImagesAllowed) && (
                    <TouchableOpacity
                      style={[styles.imageButton, selectedImages.length > 0 && styles.addMoreButton]}
                      onPress={() => setImagePickerVisible(true)}
                    >
                      <Text style={styles.imageButtonText}>
                        {selectedImages.length === 0 ? 'Select Images' : 'Add More Images'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <Text style={styles.imageNotesText}>
                  Note: .jpg, .jpeg, .png File formats are allowed and file size less than 6 MB are allowed.
                </Text>
                
                {isSubmitting && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Processing images with watermark...</Text>
                  </View>
                )}
                
                {selectedImages.length > 0 && (
                  <View>
                    <View style={styles.imagesStatusContainer}>
                      <Text style={styles.imagesCountText}>
                        {selectedImages.length} {selectedImages.length === 1 ? 'image' : 'images'} selected 
                        (Maximum {config.maxImagesAllowed})
                      </Text>
                      {selectedImages.some(img => img.watermarked) && (
                        <Text style={styles.watermarkInfoText}>Images include date/time and location watermarks</Text>
                      )}
                    </View>
                    <View style={styles.imageGridContainer}>
                      {selectedImages.map((image, index) => (
                        <View key={`${image.uri}_${index}`} style={styles.imagePreviewContainer}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                              setImageViewerIndex(index);
                              setImageViewerVisible(true);
                            }}
                          >
                            <View style={styles.imageWrapper}>
                              <Image
                                source={{ uri: image.uri }}
                                style={styles.imagePreview}
                                resizeMode="cover"
                              />
                              {image.watermarked && (
                                <View style={styles.watermarkIndicator}>
                                  <Text style={styles.watermarkIndicatorText}>W</Text>
                                </View>
                              )}
                              <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  const newImages = [...selectedImages];
                                  newImages.splice(index, 1);
                                  setSelectedImages(newImages);
                                }}
                              >
                                <Text style={styles.removeImageText}>✕</Text>
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                          <Text style={styles.imageInfoText} numberOfLines={1}>
                            {`Image ${index + 1}`}
                          </Text>
                        </View>
                      ))}
                      
                      {/* Add an "Add Image" button directly in the grid if fewer than max allowed images */}
                      {selectedImages.length < config.maxImagesAllowed && (
                        <TouchableOpacity 
                          style={[styles.imagePreviewContainer, styles.addImageContainer]}
                          onPress={() => setImagePickerVisible(true)}
                        >
                          <View style={[styles.imageWrapper, styles.addImageWrapper]}>
                            <Text style={styles.addImageIcon}>+</Text>
                            <Text style={styles.addImageText}>Add Image</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                    
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
            currentCount={selectedImages.length}
          />

          {/* Full Screen Image Viewer */}
          <ImageView
            images={selectedImages.map(img => ({ uri: img.uri }))}
            imageIndex={imageViewerIndex}
            visible={imageViewerVisible}
            onRequestClose={() => setImageViewerVisible(false)}
            presentationStyle="fullScreen"
            swipeToCloseEnabled={true}
            FooterComponent={({ imageIndex }) => (
              <View style={styles.imageViewerFooter}>
                {selectedImages[imageIndex]?.watermarked && (
                  <View style={styles.imageViewerMetadata}>
                    <Text style={styles.imageViewerMetadataText}>
                      {captureTime ? captureTime.toLocaleString() : 'Unknown Time'}
                    </Text>
                    {location && (
                      <Text style={styles.imageViewerMetadataText}>
                        Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </Text>
                    )}
                  </View>
                )}
                <Text style={styles.imageViewerCounter}>
                  {imageIndex + 1} / {selectedImages.length}
                </Text>
              </View>
            )}
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
  addMoreButton: {
    backgroundColor: colors.primary,
  },
  imageButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  imageGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginVertical: 10,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: '31%', // For 3 images per row with margin
    marginHorizontal: '1%',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    marginBottom: 4,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  imageInfoText: {
    fontSize: 12,
    color: colors.grey,
    marginTop: 4,
    textAlign: 'center',
  },
  imagesStatusContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  imagesCountText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  watermarkInfoText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  imageNotesText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.grey,
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 10,
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 10,
    color: colors.primary,
    fontSize: 14,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  removeImageText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  watermarkIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  watermarkIndicatorText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageWrapper: {
    borderWidth: 1,
    borderColor: colors.grey,
    borderStyle: 'dashed',
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageIcon: {
    fontSize: 32,
    color: colors.grey,
    marginBottom: 8,
  },
  addImageText: {
    fontSize: 12,
    color: colors.grey,
    textAlign: 'center',
  },
  metadataContainer: {
    width: '100%',
    backgroundColor: colors.lightGrey,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    alignSelf: 'center',
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
  // Image viewer styles
  imageViewerFooter: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    width: '100%',
  },
  imageViewerMetadata: {
    marginBottom: 8,
    alignItems: 'center',
  },
  imageViewerMetadataText: {
    color: colors.white,
    fontSize: 14,
    marginBottom: 4,
  },
  imageViewerCounter: {
    color: colors.white,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default EvidenceTagsScreen;
