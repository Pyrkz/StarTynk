import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrderProvider } from '../features/orders/context/OrderContext';

// Screens
import OrderingScreen from '../features/orders/screens/OrderingScreen';
import ProductDetailScreen from '../features/orders/screens/ProductDetailScreen';
import CartScreen from '../features/orders/screens/CartScreen';

export type OrderStackParamList = {
  Ordering: undefined;
  ProductDetail: { product: any };
  Cart: undefined;
};

const Stack = createNativeStackNavigator<OrderStackParamList>();

export default function OrderNavigator() {
  return (
    <OrderProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Ordering" component={OrderingScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
      </Stack.Navigator>
    </OrderProvider>
  );
}