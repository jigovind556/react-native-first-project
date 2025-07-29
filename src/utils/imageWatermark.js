import { Platform } from 'react-native';

// Position constants for watermark positioning
const Position = {
  topLeft: 'topLeft',
  topCenter: 'topCenter',
  topRight: 'topRight',
  center: 'center',
  bottomLeft: 'bottomLeft',
  bottomCenter: 'bottomCenter',
  bottomRight: 'bottomRight',
};

// Text background type constants
const TextBackgroundType = {
  none: 'none',
  stretchX: 'stretchX',
  stretchY: 'stretchY',
};

/**
 * Format date and time for watermark
 * @param {Date} date - The date object
 * @returns {string} - Formatted date and time string
 */
const formatDateTime = (date) => {
  // Ensure it's a Date object
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  // Format: DD/MM/YYYY HH:MM:SS
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Adds a watermark with datetime and location information to an image using react-native-image-marker
 * @param {object} imageObject - The image object from image picker
 * @param {object} location - Location object with latitude and longitude
 * @param {Date} timestamp - The timestamp when image was captured
 * @returns {Promise<object>} - The processed image object with watermark
 */
export const addWatermark = async (imageObject, location, timestamp) => {
  // try {
    // Format date and time for watermark
    const dateTimeStr = timestamp ? formatDateTime(timestamp) : formatDateTime(new Date());
    
    // Format location for watermark
    let locationStr = 'Location: N/A';
    if (location && location.latitude && location.longitude) {
      locationStr = `Lat: ${location.latitude.toFixed(6)}, Long: ${location.longitude.toFixed(6)}`;
    }
    
    // Prepare watermark text
    const watermarkText = `${dateTimeStr}\n${locationStr}`;
    
    // Check if the URI is valid
    if (!imageObject.uri) {
      console.error('Invalid image URI:', imageObject);
      return imageObject;
    }

    // Normalize the URI format for Android and iOS
    const normalizedUri = Platform.OS === 'android' && !imageObject.uri.startsWith('file://') && !imageObject.uri.startsWith('content://') && !imageObject.uri.startsWith('http')
      ? `file://${imageObject.uri}`
      : imageObject.uri;
      
    console.log('Using normalized image URI:', normalizedUri);

    // Add watermark to image

    
};

/**
 * Process multiple images with watermarks
 * @param {Array} images - Array of image objects
 * @param {object} location - Location object with latitude and longitude
 * @param {Date} timestamp - The timestamp when images were captured
 * @returns {Promise<Array>} - Array of processed image objects
 */
export const processImagesWithWatermark = async (images, location, timestamp) => {
  try {
    if (!images || !Array.isArray(images) || images.length === 0) {
      console.warn('No images to process');
      return [];
    }
    
    console.log('Processing images with watermark:', images.length);
    console.log('Sample image object structure:', JSON.stringify({
      ...images[0],
      uri: images[0].uri ? images[0].uri.substring(0, 30) + '...' : null
    }, null, 2));
    
    // Process each image with its own watermark
    const processedImages = [];
    
    // Process images sequentially to avoid memory issues
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      if (!image || !image.uri) {
        console.warn(`Skipping invalid image at index ${i}:`, image);
        processedImages.push(image); // Keep the original even if invalid
        continue;
      }
      
      try {
        // const processedImage = await addWatermark(image, location, image.timestamp || timestamp);
        const processedImage = image;
        processedImages.push(processedImage);
      } catch (innerError) {
        console.error(`Error processing image at index ${i}:`, innerError);
        // Keep the original image if processing fails for this specific image
        processedImages.push(image);
      }
    }
    
    console.log('Images processed successfully:', processedImages.length);
    return processedImages;
  } catch (error) {
    console.error('Error processing images with watermark:', error);
    // Return original images if processing fails
    return images;
  }
};
