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

// Mock data for Store Activity tab
const storeActivityData = Array(25).fill(0).map((_, index) => ({
  id: `sa-${index + 1}`,
  elementName: `FS-${6217 + index}-STAPLES-FS${index + 1}`,
  subTypeName: 'Floor Stack',
  brandName: `Fortune & Kohinoor ${index % 3 === 0 ? 'Premium' : 'Standard'}`,
  execution: index % 2 === 0 ? 'Monthly' : 'Quarterly',
  planName: `Fortune_Kohinoor_FS_${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index % 12]}25`,
  planEndDate: `${index % 28 + 1}-${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index % 12]}-2025`,
}));

// Mock data for Paid Visibility Tracker tab
const paidVisibilityData = Array(18).fill(0).map((_, index) => ({
  id: `pv-${index + 1}`,
  elementName: `PV-${1234 + index}-METRO-PV${index + 1}`,
  subTypeName: 'End Cap Display',
  brandName: `Tropicana ${index % 2 === 0 ? 'Gold' : 'Select'}`,
  execution: index % 3 === 0 ? 'Weekly' : (index % 3 === 1 ? 'Monthly' : 'Quarterly'),
  planName: `Tropicana_EndCap_${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index % 12]}25`,
  planEndDate: `${index % 28 + 1}-${['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][index % 12]}-2025`,
}));

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
  
  // Get user data on component mount
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
  }, []);
  
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
    navigation.navigate('PerformActivity', { item });
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
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{strings.noDataAvailable}</Text>
    </View>
  );
  
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
          Welcome, {userData.username || "User"}
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
      
      {/* List */}
      <FlatList
        data={paginatedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={renderSeparator}
        ListEmptyComponent={renderEmptyComponent}
      />
      
      {/* Pagination */}
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
          ]}>{strings.previous}</Text>
        </TouchableOpacity>
        
        <Text style={styles.pageIndicator}>
          {strings.page} {currentPage + 1} {strings.of} {maxPages}
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
          ]}>{strings.next}</Text>
        </TouchableOpacity>
      </View>
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
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.grey,
    fontSize: 16,
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
