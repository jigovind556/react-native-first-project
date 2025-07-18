import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { logoutUser } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../constants/colors';
import strings from '../constants/strings';
import { getDashboardData, transformDashboardData } from '../services/dashboardService';

// Number of items to show per page
const ITEMS_PER_PAGE = 10;

const DashboardScreen = ({ navigation }) => {
  // State for active tab (0: Store Activity, 1: Paid Visibility Tracker)
  const [activeTab, setActiveTab] = useState(0);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(0);
  
  // State for expanded items
  const [expandedItems, setExpandedItems] = useState({});
  
  // State to hold user data
  const [userData, setUserData] = useState(null);
  
  // State for storing API data
  const [storeActivityData, setStoreActivityData] = useState([]);
  const [paidVisibilityData, setPaidVisibilityData] = useState([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Get user data and activity data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          setUserData(JSON.parse(userDataStr));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };
    
    fetchUserData();
    fetchDashboardData();
  }, []);
  
  // Function to fetch dashboard data from API
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Fetch both store activity and paid visibility data in one API call
      const dashboardResponse = await getDashboardData();
      
      if (dashboardResponse.success) {
        const { table, table1 } = dashboardResponse.data || { table: [], table1: [] };
        
        // Set paid visibility data (from table)
        setPaidVisibilityData(transformDashboardData(table || []));
        
        // Set store activity data (from table1)
        setStoreActivityData(transformDashboardData(table1 || []));
      } else {
        console.error("Dashboard data fetch failed:", dashboardResponse.error);
        setErrorMessage(dashboardResponse.error || strings.genericError);
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      setErrorMessage(strings.networkError || "Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };
  
  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      "Logout Confirmation",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              const result = await logoutUser();
              
              if (result.success) {
                // Navigate back to login screen
                navigation.replace('Login');
              } else {
                Alert.alert("Error", "Failed to logout. Please try again.");
              }
            } catch (error) {
              console.error("Error during logout:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          }
        }
      ]
    );
  };
  
  // Get current data based on active tab
  const currentData = activeTab === 0 ? storeActivityData : paidVisibilityData;
  
  // Get paginated data
  const paginatedData = currentData.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );
  
  // Maximum number of pages
  const maxPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
  
  // Handle tab switch
  const handleTabSwitch = (tabIndex) => {
    setActiveTab(tabIndex);
    setCurrentPage(0);
    setExpandedItems({});
  };
  
  // Toggle expanded item
  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  // Handle action button
  const handleAction = (item) => {
    // Pass store code and mediaPlanId to PerformActivity screen
    navigation.navigate('PerformActivity', { 
      item,
      storeCode: userData?.storecode || null,
      mediaPlanId: item.mediaPlanId || null
    });
  };
  
  // Render list item
  const renderItem = ({ item }) => {
    const isExpanded = expandedItems[item.id];
    
    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity 
          style={styles.itemHeader} 
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.headerContent}>
            <View style={styles.mainInfo}>
              <Text style={styles.brandName}>{item.brandName}</Text>
              <Text style={styles.dateText}>End: {item.planEndDate}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleAction(item)}
            >
              <Text style={styles.actionButtonText}>{strings.captureEvidence}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>{strings.elementName}</Text>
              <Text style={styles.expandedValue}>{item.elementName}</Text>
            </View>
            
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>{strings.subTypeName}</Text>
              <Text style={styles.expandedValue}>{item.subTypeName}</Text>
            </View>
            
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>{strings.execution}</Text>
              <Text style={styles.expandedValue}>{item.execution}</Text>
            </View>
            
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>{strings.planName}</Text>
              <Text style={styles.expandedValue}>{item.planName}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };
  
  // Render separator
  const renderSeparator = () => <View style={styles.separator} />;
  
  // Render empty component
  const renderEmptyComponent = () => {
    // Show different message based on loading state
    if (isLoading) {
      return null; // Loading indicator will be shown elsewhere
    }
    
    if (errorMessage) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchDashboardData}
          >
            <Text style={styles.retryButtonText}>{strings.retry || "Retry"}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{strings.noDataAvailable || "No data available"}</Text>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{strings.dashboard}</Text>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>{strings.logout || "Logout"}</Text>
        </TouchableOpacity>
      </View>
      
      {userData && (
        <Text style={styles.welcomeMessage}>
          Store Code, {userData.storecode || "N/A"}
        </Text>
      )}
      
      {/* Tab buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 0 && styles.activeTabButton]}
          onPress={() => handleTabSwitch(0)}
        >
          <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
            {strings.storeActivity}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 1 && styles.activeTabButton]}
          onPress={() => handleTabSwitch(1)}
        >
          <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
            {strings.paidVisibilityTracker}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{strings.loading || "Loading..."}</Text>
        </View>
      )}
      
      {/* List */}
      <FlatList
        data={paginatedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          (!paginatedData || paginatedData.length === 0) && styles.emptyListContainer
        ]}
        ItemSeparatorComponent={renderSeparator}
        ListEmptyComponent={renderEmptyComponent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      
      {/* Pagination - only show if we have data and not loading */}
      {!isLoading && currentData.length > 0 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === 0 && styles.disabledButton
            ]}
            onPress={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            <Text style={[
              styles.paginationButtonText,
              currentPage === 0 && styles.disabledButtonText
            ]}>{strings.previous || "Previous"}</Text>
          </TouchableOpacity>
          
          <Text style={styles.pageIndicator}>
            {strings.page || "Page"} {currentPage + 1} {strings.of || "of"} {maxPages}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage >= maxPages - 1 && styles.disabledButton
            ]}
            onPress={() => setCurrentPage(prev => Math.min(maxPages - 1, prev + 1))}
            disabled={currentPage >= maxPages - 1}
          >
            <Text style={[
              styles.paginationButtonText,
              currentPage >= maxPages - 1 && styles.disabledButtonText
            ]}>{strings.next || "Next"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  logoutButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  welcomeMessage: {
    fontSize: 16,
    color: colors.grey,
    marginBottom: 20,
    textAlign: 'left',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  activeTabText: {
    color: colors.white,
  },
  listContainer: {
    flexGrow: 1,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    borderRadius: 8,
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  itemHeader: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: colors.grey,
  },
  actionButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  expandedContent: {
    backgroundColor: colors.lightGrey,
    padding: 16,
  },
  expandedRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  expandedLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey,
  },
  expandedValue: {
    flex: 2,
    fontSize: 14,
    color: colors.black,
  },
  separator: {
    height: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.grey,
    fontSize: 16,
  },
  errorText: {
    color: colors.error || 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
  },
  paginationButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  paginationButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: colors.lightGrey,
  },
  disabledButtonText: {
    color: colors.grey,
  },
  pageIndicator: {
    fontSize: 14,
    color: colors.black,
  },
});

export default DashboardScreen;
