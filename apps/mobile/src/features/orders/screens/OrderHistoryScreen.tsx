import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Order } from '../types';

type OrderHistoryScreenNavigationProp = NativeStackNavigationProp<any>;

// Mock data for order history
const mockOrders: Order[] = [
  {
    id: '1',
    userId: '123',
    items: [
      { product: { id: '1', name: 'Worki z gipsem tynkarskim', category: 'Materiały podstawowe', unit: 'szt', image: null }, quantity: 10 },
      { product: { id: '8', name: 'Paca tynkarska', category: 'Narzędzia i akcesoria', unit: 'szt', image: null }, quantity: 2 },
    ],
    deliveryLocation: 'Budowa ul. Główna 123, Warszawa',
    status: 'delivered',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-16T14:00:00'),
    timeline: [
      { status: 'pending', timestamp: new Date('2024-01-15T10:30:00') },
      { status: 'seen', timestamp: new Date('2024-01-15T11:00:00') },
      { status: 'approved', timestamp: new Date('2024-01-15T14:00:00') },
      { status: 'delivered', timestamp: new Date('2024-01-16T14:00:00') },
    ],
  },
  {
    id: '2',
    userId: '123',
    items: [
      { product: { id: '2', name: 'Cement', category: 'Materiały podstawowe', unit: 'worek', image: null }, quantity: 20 },
      { product: { id: '5', name: 'Siatka zbrojeniowa', category: 'Materiały podstawowe', unit: 'rolka', image: null }, quantity: 5 },
      { product: { id: '21', name: 'Rękawice robocze', category: 'BHP', unit: 'para', image: null }, quantity: 10 },
    ],
    deliveryLocation: 'Budowa ul. Nowa 45, Kraków',
    status: 'approved',
    createdAt: new Date('2024-01-17T08:00:00'),
    updatedAt: new Date('2024-01-17T09:30:00'),
    timeline: [
      { status: 'pending', timestamp: new Date('2024-01-17T08:00:00') },
      { status: 'seen', timestamp: new Date('2024-01-17T08:15:00') },
      { status: 'approved', timestamp: new Date('2024-01-17T09:30:00') },
    ],
  },
  {
    id: '3',
    userId: '123',
    items: [
      { product: { id: '3', name: 'Wapno', category: 'Materiały podstawowe', unit: 'worek', image: null }, quantity: 15 },
    ],
    deliveryLocation: 'Budowa ul. Polna 78, Wrocław',
    status: 'pending',
    createdAt: new Date('2024-01-18T11:00:00'),
    updatedAt: new Date('2024-01-18T11:00:00'),
    timeline: [
      { status: 'pending', timestamp: new Date('2024-01-18T11:00:00') },
    ],
  },
];

export default function OrderHistoryScreen() {
  const navigation = useNavigation<OrderHistoryScreenNavigationProp>();

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'seen':
        return '#2196F3';
      case 'approved':
        return '#9C27B0';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Oczekuje';
      case 'seen':
        return 'Zobaczone';
      case 'approved':
        return 'W realizacji';
      case 'delivered':
        return 'Dostarczone';
      case 'cancelled':
        return 'Anulowane';
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOrderPress = (order: Order) => {
    navigation.navigate('OrderDetail' as any, { order });
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => handleOrderPress(item)}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Zamówienie #{item.id}</Text>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.deliveryLocation}
          </Text>
        </View>

        <Text style={styles.itemsLabel}>Produkty ({item.items.length}):</Text>
        {item.items.slice(0, 2).map((cartItem, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              • {cartItem.product.name}
            </Text>
            <Text style={styles.itemQuantity}>x{cartItem.quantity}</Text>
          </View>
        ))}
        {item.items.length > 2 && (
          <Text style={styles.moreItems}>
            + {item.items.length - 2} więcej produktów
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historia zamówień</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Orders List */}
      <FlatList
        data={mockOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Brak historii zamówień</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFCF2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
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
  moreItems: {
    fontSize: 14,
    color: '#D75200',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});