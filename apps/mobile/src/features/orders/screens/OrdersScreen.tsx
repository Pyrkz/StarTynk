import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type OrdersScreenNavigationProp = NativeStackNavigationProp<any>;

export default function OrdersScreen() {
  const navigation = useNavigation<OrdersScreenNavigationProp>();

  const handleNewOrder = () => {
    navigation.navigate('Order' as any);
  };

  const handleOrderHistory = () => {
    navigation.navigate('OrderHistory' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Zamówienia</Text>
          <Text style={styles.subtitle}>
            Zarządzaj swoimi zamówieniami materiałów
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* New Order Card */}
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={handleNewOrder}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FEAD00', '#D75200']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="add-circle-outline" size={48} color="#fff" />
              </View>
              <Text style={styles.optionTitle}>Nowe zamówienie</Text>
              <Text style={styles.optionDescription}>
                Złóż nowe zamówienie materiałów i narzędzi
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Order History Card */}
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={handleOrderHistory}
            activeOpacity={0.8}
          >
            <View style={styles.whiteCard}>
              <View style={[styles.iconContainer, styles.darkIconContainer]}>
                <Ionicons name="time-outline" size={48} color="#D75200" />
              </View>
              <Text style={[styles.optionTitle, styles.darkTitle]}>
                Historia zamówień
              </Text>
              <Text style={[styles.optionDescription, styles.darkDescription]}>
                Przeglądaj wcześniejsze zamówienia
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Last Order Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Ostatnie zamówienie</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.statusText}>Dostarczone</Text>
            </View>
          </View>
          
          <View style={styles.lastOrderContent}>
            <Text style={styles.orderId}>Zamówienie #3</Text>
            <Text style={styles.orderDate}>16.01.2024, 14:00</Text>
            
            <View style={styles.orderItemsContainer}>
              <Text style={styles.itemsLabel}>Produkty (3):</Text>
              <View style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>• Worki z gipsem tynkarskim</Text>
                <Text style={styles.itemQuantity}>x10</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>• Paca tynkarska</Text>
                <Text style={styles.itemQuantity}>x2</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={handleOrderHistory}
            >
              <Text style={styles.viewAllButtonText}>Zobacz wszystkie zamówienia</Text>
              <Ionicons name="arrow-forward" size={16} color="#D75200" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFCF2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  optionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  optionCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientCard: {
    padding: 24,
    alignItems: 'center',
  },
  whiteCard: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  darkIconContainer: {
    backgroundColor: 'rgba(215, 82, 0, 0.1)',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  darkTitle: {
    color: '#333',
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  darkDescription: {
    color: '#666',
  },
  summaryCard: {
    marginHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lastOrderContent: {
    marginTop: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  orderItemsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginBottom: 16,
  },
  itemsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#D75200',
    fontWeight: '600',
  },
});