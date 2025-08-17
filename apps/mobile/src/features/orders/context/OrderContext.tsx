import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, CartItem, Order } from '../types';

interface OrderContextType {
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getProductQuantityInCart: (productId: string) => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Mock products data
  const products: Product[] = [
    // Materiały podstawowe
    { id: '1', name: 'Worki z gipsem tynkarskim', category: 'Materiały podstawowe', unit: 'szt', image: null },
    { id: '2', name: 'Cement', category: 'Materiały podstawowe', unit: 'worek', image: null },
    { id: '3', name: 'Wapno', category: 'Materiały podstawowe', unit: 'worek', image: null },
    { id: '4', name: 'Plastyfikatory', category: 'Materiały podstawowe', unit: 'l', image: null },
    { id: '5', name: 'Siatka zbrojeniowa', category: 'Materiały podstawowe', unit: 'rolka', image: null },
    { id: '6', name: 'Taśmy tynkarskie', category: 'Materiały podstawowe', unit: 'szt', image: null },
    { id: '7', name: 'Grunt do ścian', category: 'Materiały podstawowe', unit: 'l', image: null },
    
    // Narzędzia i akcesoria
    { id: '8', name: 'Paca tynkarska', category: 'Narzędzia i akcesoria', unit: 'szt', image: null },
    { id: '9', name: 'Kielnia', category: 'Narzędzia i akcesoria', unit: 'szt', image: null },
    { id: '10', name: 'Łata tynkarska 2m', category: 'Narzędzia i akcesoria', unit: 'szt', image: null },
    { id: '11', name: 'Poziomnica', category: 'Narzędzia i akcesoria', unit: 'szt', image: null },
    { id: '12', name: 'Dysze do agregatów', category: 'Narzędzia i akcesoria', unit: 'kpl', image: null },
    { id: '13', name: 'Węże do maszyn', category: 'Narzędzia i akcesoria', unit: 'szt', image: null },
    { id: '14', name: 'Mieszadło', category: 'Narzędzia i akcesoria', unit: 'szt', image: null },
    { id: '15', name: 'Wiadro 20l', category: 'Narzędzia i akcesoria', unit: 'szt', image: null },
    
    // Części zamienne
    { id: '16', name: 'Filtry do agregatów', category: 'Części zamienne', unit: 'szt', image: null },
    { id: '17', name: 'Uszczelki, o-ringi', category: 'Części zamienne', unit: 'kpl', image: null },
    { id: '18', name: 'Pompy do agregatów', category: 'Części zamienne', unit: 'szt', image: null },
    { id: '19', name: 'Rotory', category: 'Części zamienne', unit: 'szt', image: null },
    { id: '20', name: 'Łożyska', category: 'Części zamienne', unit: 'kpl', image: null },
    
    // BHP
    { id: '21', name: 'Rękawice robocze', category: 'BHP', unit: 'para', image: null },
    { id: '22', name: 'Maski przeciwpyłowe', category: 'BHP', unit: 'szt', image: null },
    { id: '23', name: 'Okulary ochronne', category: 'BHP', unit: 'szt', image: null },
    { id: '24', name: 'Kaski ochronne', category: 'BHP', unit: 'szt', image: null },
    { id: '25', name: 'Obuwie robocze', category: 'BHP', unit: 'para', image: null },
    { id: '26', name: 'Kombinezony robocze', category: 'BHP', unit: 'szt', image: null },
    
    // Materiały eksploatacyjne
    { id: '27', name: 'Środki czyszczące', category: 'Materiały eksploatacyjne', unit: 'l', image: null },
    { id: '28', name: 'Smary do konserwacji', category: 'Materiały eksploatacyjne', unit: 'szt', image: null },
    { id: '29', name: 'Folie ochronne', category: 'Materiały eksploatacyjne', unit: 'rolka', image: null },
    { id: '30', name: 'Worki na odpady', category: 'Materiały eksploatacyjne', unit: 'rolka', image: null },
    { id: '31', name: 'Ścierki', category: 'Materiały eksploatacyjne', unit: 'opak', image: null },
    
    // Sprzęt pomocniczy
    { id: '32', name: 'Halogen LED', category: 'Sprzęt pomocniczy', unit: 'szt', image: null },
    { id: '33', name: 'Przedłużacz 50m', category: 'Sprzęt pomocniczy', unit: 'szt', image: null },
    { id: '34', name: 'Rozdzielacz prądu', category: 'Sprzęt pomocniczy', unit: 'szt', image: null },
    { id: '35', name: 'Nagrzewnica', category: 'Sprzęt pomocniczy', unit: 'szt', image: null },
    { id: '36', name: 'Osuszacz powietrza', category: 'Sprzęt pomocniczy', unit: 'szt', image: null },
    { id: '37', name: 'Rusztowanie', category: 'Sprzęt pomocniczy', unit: 'kpl', image: null },
    { id: '38', name: 'Drabina aluminiowa', category: 'Sprzęt pomocniczy', unit: 'szt', image: null },
  ];

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevCart, { product, quantity }];
    });
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };


  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getProductQuantityInCart = (productId: string) => {
    const cartItem = cart.find(item => item.product.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const value = {
    products,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getProductQuantityInCart,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};