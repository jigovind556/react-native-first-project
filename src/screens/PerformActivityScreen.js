import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import colors from '../constants/colors';
import strings from '../constants/strings';

const PerformActivityScreen = ({ navigation, route }) => {
  // Extract details from the passed item
  const { item } = route.params || {};
  
  const handleFillForm = () => {
    // Generate dummy store code and media plan id
    const storeCode = `ST${Math.floor(1000 + Math.random() * 9000)}`;
    const mediaPlanId = `MP${Math.floor(10000 + Math.random() * 90000)}`;
    
    // Navigate to the Evidence Tags screen with the necessary data
    navigation.navigate('EvidenceTags', { 
      item, 
      storeCode,
      mediaPlanId
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>{strings.performActivity}</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>{strings.brandName}</Text>
              <Text style={styles.value}>{item?.brandName || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{strings.elementName}</Text>
              <Text style={styles.value}>{item?.elementName || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{strings.planName}</Text>
              <Text style={styles.value}>{item?.planName || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{strings.execution}</Text>
              <Text style={styles.value}>{item?.execution || 'N/A'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>{strings.planEndDate}</Text>
              <Text style={styles.value}>{item?.planEndDate || 'N/A'}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.fillButton} 
            onPress={handleFillForm}
          >
            <Text style={styles.buttonText}>{strings.fillForm}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{strings.cancel}</Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.grey,
  },
  value: {
    flex: 2,
    fontSize: 14,
    color: colors.black,
  },
  fillButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    alignSelf: 'center',
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
});

export default PerformActivityScreen;
