import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useOrder } from '../context/OrderContext';
import { CartItem } from '../types';
import { useAppStore } from '../../../store/useAppStore';

type CartScreenNavigationProp = NativeStackNavigationProp<any>;

export default function CartScreen() {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { cart, updateCartItemQuantity, removeFromCart, clearCart, getTotalItems } = useOrder();
  const user = useAppStore((state) => state.user);
  const [deliveryLocation, setDeliveryLocation] = useState('');

  const handleIncreaseQuantity = (productId: string, currentQuantity: number) => {
    updateCartItemQuantity(productId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (productId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateCartItemQuantity(productId, currentQuantity - 1);
    }
  };

  const handleRemoveItem = (productId: string) => {
    Alert.alert(
      'Usuń produkt',
      'Czy na pewno chcesz usunąć ten produkt z koszyka?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', onPress: () => removeFromCart(productId), style: 'destructive' },
      ]
    );
  };

  const handlePlaceOrder = () => {
    if (!deliveryLocation.trim()) {
      Alert.alert('Błąd', 'Proszę podać miejsce dostawy');
      return;
    }

    // TODO: Implement order submission to backend
    Alert.alert(
      'Zamówienie złożone',
      'Twoje zamówienie zostało pomyślnie złożone. Otrzymasz powiadomienie o jego statusie.',
      [
        {
          text: 'OK',
          onPress: () => {
            clearCart();
            navigation.navigate('Dashboard');
          },
        },
      ]
    );
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImagePlaceholder}>
        <Ionicons name="cube-outline" size={32} color="#D75200" />
      </View>
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
        <Text style={styles.itemPrice}>Jednostka: {item.product.unit}</Text>
      </View>

      <View style={styles.itemActions}>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleDecreaseQuantity(item.product.id, item.quantity)}
          >
            <Ionicons name="remove" size={18} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.quantity}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleIncreaseQuantity(item.product.id, item.quantity)}
          >
            <Ionicons name="add" size={18} color="#333" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.product.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#D75200" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const totalItems = getTotalItems();
  const isEmpty = cart.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Koszyk</Text>
        <View style={styles.itemCount}>
          <Text style={styles.itemCountText}>{totalItems}</Text>
        </View>
      </View>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Twój koszyk jest pusty</Text>
          <TouchableOpacity
            style={styles.continueShoppingButton}
            onPress={() => navigation.navigate('Ordering')}
          >
            <Text style={styles.continueShoppingText}>Kontynuuj zamawianie</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.product.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Order Details Section */}
          <View style={styles.orderDetailsSection}>
            <Text style={styles.sectionTitle}>Szczegóły zamówienia</Text>
            
            <View style={styles.userInfo}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={styles.userInfoText}>
                {user?.name || 'Użytkownik'}
              </Text>
            </View>

            <View style={styles.deliveryInput}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <TextInput
                style={styles.deliveryTextInput}
                placeholder="Miejsce dostawy (np. Budowa ul. Główna 123)"
                placeholderTextColor="#999"
                value={deliveryLocation}
                onChangeText={setDeliveryLocation}
                multiline
              />
            </View>
          </View>


          {/* Place Order Button */}
          <View style={styles.bottomActions}>
            <TouchableOpacity 
              style={styles.placeOrderButton}
              onPress={handlePlaceOrder}
            >
              <LinearGradient
                colors={['#FEAD00', '#D75200']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.placeOrderText}>Złóż zamówienie</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  itemCount: {
    backgroundColor: '#D75200',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  continueShoppingButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#D75200',
    borderRadius: 12,
  },
  continueShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  cartItem: {
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
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    padding: 8,
  },
  orderDetailsSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  deliveryInput: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
  },
  deliveryTextInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 60,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  placeOrderButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFA500',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});