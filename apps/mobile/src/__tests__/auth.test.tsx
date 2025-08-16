import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { authService } from '@/services/auth.service';
// TODO: Replace with @repo/shared after consolidation
// import { tokenStorage } from '@/lib/storage/token-storage';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('@/services/auth.service');
jest.mock('@/lib/storage/token-storage');

describe('Mobile Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Email login flow', async () => {
    const mockLogin = jest.spyOn(authService, 'login').mockResolvedValue({
      success: true,
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 900,
    });

    const { getByPlaceholderText, getByText } = render(
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    );

    // Enter credentials
    fireEvent.changeText(
      getByPlaceholderText('Email or Phone'),
      'test@example.com'
    );
    fireEvent.changeText(
      getByPlaceholderText('Password'),
      'Test123!@#'
    );

    // Submit form
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        identifier: 'test@example.com',
        password: 'Test123!@#',
        loginMethod: 'email',
        clientType: 'mobile',
      });
    });

    // Verify tokens are stored
    expect(tokenStorage.saveTokens).toHaveBeenCalledWith({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: expect.any(Number),
    });
  });

  test('Phone login flow', async () => {
    const { getByPlaceholderText, getByText } = render(
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    );

    // Enter phone number
    fireEvent.changeText(
      getByPlaceholderText('Email or Phone'),
      '+1234567890'
    );
    fireEvent.changeText(
      getByPlaceholderText('Password'),
      'Test123!@#'
    );

    // Submit form
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: '+1234567890',
          loginMethod: 'phone',
        })
      );
    });
  });

  test('Token refresh on 401', async () => {
    const mockRefresh = jest.spyOn(authService, 'refreshSession')
      .mockResolvedValue(true);

    // Simulate API call that returns 401
    const apiCall = jest.fn()
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({ data: 'success' });

    // Make API call
    await apiCall();

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});