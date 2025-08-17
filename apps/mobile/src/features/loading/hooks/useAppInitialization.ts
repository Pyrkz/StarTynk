import { useState, useEffect } from 'react';
import { storageService } from '../../../shared/utils/storageService';
import { useAppStore } from '../../../store/useAppStore';
import { authService } from '../../auth/services/authService';

export const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { setUser, setIsAuthenticated, isAuthenticated } = useAppStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check for stored auth token
        const token = await storageService.getItem('auth_token');
        const userData = await storageService.getItem('user_data');

        if (token && userData) {
          try {
            // Verify token is still valid
            const user = await authService.verifyToken(token);
            setUser(user);
            setIsAuthenticated(true);
          } catch (error) {
            // Token invalid, clear storage
            await storageService.removeItem('auth_token');
            await storageService.removeItem('user_data');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('App initialization error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [setUser, setIsAuthenticated]);

  return {
    isInitialized,
    isAuthenticated,
  };
};