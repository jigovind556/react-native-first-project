// API service for dashboard data
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../utils/apiFetch';

/**
 * Fetch dashboard data from the API
 * Contains both store activity and paid visibility data
 * 
 * @returns {Promise} - Resolves with response data containing both store activities and paid visibility data
 */
export const getDashboardData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) {
      return {
        success: false,
        error: 'User data not found. Please log in again.',
        data: {
          table: [], // Paid visibility tracker data
          table1: [] // Store activity data
        }
      };
    }
    const parsedUserData = JSON.parse(userData);
    console.log(`Parsed user data:`, parsedUserData);
    const response = await apiFetch(
      `PlanDetails/GetAllPendingTasks?storecode=${parsedUserData.storecode}`,
      {
        method: 'GET',
      },
    );
    
    console.log(`Dashboard data fetch response:`, response);
    return response;
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return {
      success: false,
      error: 'Failed to fetch dashboard data. Please try again.',
      data: {
        table: [], // Paid visibility tracker data
        table1: [] // Store activity data
      }
    };
  }
};

/**
 * Transform API data to match the expected format for the dashboard
 * 
 * @param {Array} apiData - Raw data from the API
 * @returns {Array} - Transformed data for the UI
 */
export const transformDashboardData = (apiData) => {
  if (!apiData || !Array.isArray(apiData)) return [];
  
  return apiData.map((item, index) => ({
    id: item.id || `item-${index + 1}`,
    elementName: item.element_name || `Element-${index + 1}`,
    subTypeName: item.subtype_name || 'Unknown Type',
    brandName: item.brandname || 'Unknown Brand',
    execution: item.executiontemplatename || 'Monthly',
    planName: item.mediaplanname || `Plan-${index + 1}`,
    planEndDate: item.enddate || 'N/A',
    mediaPlanId: item.mediaPlanId || null,
    storeCode: item.storecode || null,  
  }));
};
