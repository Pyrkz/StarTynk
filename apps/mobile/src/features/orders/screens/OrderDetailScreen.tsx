import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Order, OrderTimeline, CartItem } from '../types';

type OrderDetailScreenNavigationProp = NativeStackNavigationProp<any>;
type OrderDetailScreenRouteProp = RouteProp<{ OrderDetail: { order: Order } }, 'OrderDetail'>;

export default function OrderDetailScreen() {
  const navigation = useNavigation<OrderDetailScreenNavigationProp>();
  const route = useRoute<OrderDetailScreenRouteProp>();
  const [order, setOrder] = useState<Order>(route.params.order);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLocation, setEditedLocation] = useState(order.deliveryLocation);
  const [editedQuantities, setEditedQuantities] = useState<{ [key: string]: number }>(
    order.items.reduce((acc, item) => ({ ...acc, [item.product.id]: item.quantity }), {})
  );

  const canEdit = order.status === 'pending' || order.status === 'seen';

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

  const getTimelineIcon = (status: OrderTimeline['status']) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'seen':
        return 'eye-outline';
      case 'approved':
        return 'checkmark-circle-outline';
      case 'delivered':
        return 'cube-outline';
      case 'modified':
        return 'create-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getTimelineDescription = (status: OrderTimeline['status']) => {
    switch (status) {
      case 'pending':
        return 'Zamówienie złożone';
      case 'seen':
        return 'Zamówienie zobaczone przez biuro';
      case 'approved':
        return 'Przyjęte do realizacji / W drodze';
      case 'delivered':
        return 'Dostarczone na budowę';
      case 'modified':
        return 'Zamówienie zmodyfikowane';
      default:
        return '';
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

  const handleDeleteOrder = () => {
    Alert.alert(
      'Usuń zamówienie',
      'Czy na pewno chcesz usunąć to zamówienie?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { 
          text: 'Usuń', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete order
            navigation.goBack();
          }
        },
      ]
    );
  };

  const handleEditOrder = () => {
    // Navigate to ordering screen with pre-filled cart
    navigation.navigate('Order' as any, { editOrder: order });
  };

  const handleRemoveItem = (itemIndex: number) => {
    Alert.alert(
      'Usuń produkt',
      'Czy na pewno chcesz usunąć ten produkt z zamówienia?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { 
          text: 'Usuń', 
          style: 'destructive',
          onPress: () => {
            const updatedItems = order.items.filter((_, index) => index !== itemIndex);
            const removedItem = order.items[itemIndex];
            const newTimeline = [...order.timeline, {
              status: 'modified' as const,
              timestamp: new Date(),
              description: `Usunięto: ${removedItem.product.name}`,
              modificationType: 'items' as const
            }];
            setOrder({ 
              ...order, 
              items: updatedItems,
              timeline: newTimeline,
              isModified: true,
              lastModifiedAt: new Date()
            });
          }
        },
      ]
    );
  };

  const handleSaveChanges = () => {
    const hasLocationChanged = editedLocation !== order.deliveryLocation;
    const hasQuantitiesChanged = order.items.some(
      item => editedQuantities[item.product.id] !== item.quantity
    );

    if (!hasLocationChanged && !hasQuantitiesChanged) {
      setIsEditing(false);
      return;
    }

    let newTimeline = [...order.timeline];

    if (hasLocationChanged) {
      newTimeline.push({
        status: 'modified' as const,
        timestamp: new Date(),
        description: `Zmieniono lokalizację dostawy`,
        modificationType: 'location' as const
      });
    }

    if (hasQuantitiesChanged) {
      const changedItems = order.items.filter(
        item => editedQuantities[item.product.id] !== item.quantity
      );
      changedItems.forEach(item => {
        newTimeline.push({
          status: 'modified' as const,
          timestamp: new Date(),
          description: `Zmieniono ilość: ${item.product.name} (${item.quantity} → ${editedQuantities[item.product.id]})`,
          modificationType: 'quantity' as const
        });
      });
    }

    const updatedItems = order.items.map(item => ({
      ...item,
      quantity: editedQuantities[item.product.id]
    }));

    setOrder({
      ...order,
      deliveryLocation: editedLocation,
      items: updatedItems,
      timeline: newTimeline,
      isModified: true,
      lastModifiedAt: new Date()
    });
    setIsEditing(false);
  };

  const handleQuantityChange = (productId: string, newQuantity: string) => {
    const quantity = parseInt(newQuantity) || 0;
    if (quantity >= 0) {
      setEditedQuantities({ ...editedQuantities, [productId]: quantity });
    }
  };

  const renderTimelineItem = (item: OrderTimeline, index: number) => {
    const isLast = index === order.timeline.length - 1;
    const isCompleted = true; // All items in timeline are completed

    return (
      <View key={index} style={styles.timelineItem}>
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineIconContainer, isCompleted && styles.timelineIconCompleted]}>
            <Ionicons 
              name={getTimelineIcon(item.status)} 
              size={20} 
              color={isCompleted ? '#fff' : '#999'} 
            />
          </View>
          {!isLast && <View style={[styles.timelineLine, isCompleted && styles.timelineLineCompleted]} />}
        </View>
        
        <View style={styles.timelineContent}>
          <Text style={styles.timelineTitle}>{getTimelineDescription(item.status)}</Text>
          <Text style={styles.timelineDate}>{formatDate(item.timestamp)}</Text>
          {item.description && (
            <Text style={styles.timelineDescription}>{item.description}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderCartItem = ({ item, index }: { item: CartItem; index: number }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        {isEditing ? (
          <View style={styles.quantityEditContainer}>
            <TextInput
              style={styles.quantityInput}
              value={editedQuantities[item.product.id].toString()}
              onChangeText={(text) => handleQuantityChange(item.product.id, text)}
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={styles.unitText}>{item.product.unit}</Text>
          </View>
        ) : (
          <Text style={styles.itemDetails}>
            {item.quantity} {item.product.unit}
          </Text>
        )}
      </View>
      
      {canEdit && isEditing && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(index)}
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Zamówienie #{order.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informacje o zamówieniu</Text>
            {order.isModified && (
              <View style={styles.modifiedBadge}>
                <Text style={styles.modifiedText}>Zmodyfikowane</Text>
              </View>
            )}
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            {isEditing ? (
              <TextInput
                style={styles.locationInput}
                value={editedLocation}
                onChangeText={setEditedLocation}
                placeholder="Miejsce dostawy"
                multiline
              />
            ) : (
              <Text style={styles.infoText}>{order.deliveryLocation}</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.infoText}>Złożone: {formatDate(order.createdAt)}</Text>
          </View>
          {order.lastModifiedAt && (
            <View style={styles.infoRow}>
              <Ionicons name="create-outline" size={20} color="#666" />
              <Text style={styles.infoText}>Ostatnia modyfikacja: {formatDate(order.lastModifiedAt)}</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status realizacji</Text>
          <View style={styles.timeline}>
            {order.timeline.map((item, index) => renderTimelineItem(item, index))}
          </View>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produkty ({order.items.length})</Text>
            {canEdit && (
              <TouchableOpacity onPress={() => {
                if (isEditing) {
                  handleSaveChanges();
                } else {
                  setIsEditing(true);
                }
              }}>
                <Text style={styles.editText}>{isEditing ? 'Zapisz' : 'Edytuj'}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList
            data={order.items}
            renderItem={renderCartItem}
            keyExtractor={(_, index) => index.toString()}
            scrollEnabled={false}
          />

          {canEdit && (
            <TouchableOpacity 
              style={styles.addProductButton}
              onPress={handleEditOrder}
            >
              <Ionicons name="add-circle-outline" size={20} color="#D75200" />
              <Text style={styles.addProductText}>Dodaj produkty</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        {canEdit && (
          <View style={styles.actionsSection}>
            {isEditing && (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(false);
                  setEditedLocation(order.deliveryLocation);
                  setEditedQuantities(
                    order.items.reduce((acc, item) => ({ ...acc, [item.product.id]: item.quantity }), {})
                  );
                }}
              >
                <Text style={styles.cancelButtonText}>Anuluj zmiany</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDeleteOrder}
            >
              <Ionicons name="trash-outline" size={20} color="#F44336" />
              <Text style={styles.deleteButtonText}>Usuń zamówienie</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    flex: 1,
    marginLeft: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  editText: {
    fontSize: 14,
    color: '#D75200',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconCompleted: {
    backgroundColor: '#4CAF50',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#F5F5F5',
    marginTop: 4,
  },
  timelineLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    color: '#666',
  },
  timelineDescription: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    gap: 8,
  },
  addProductText: {
    fontSize: 14,
    color: '#D75200',
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '600',
  },
  modifiedBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modifiedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  locationInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    minHeight: 40,
  },
  quantityEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  quantityInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: '#333',
    minWidth: 60,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});