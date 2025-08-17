import React from 'react';
import { Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/shared/components';

interface ClockInButtonProps {
  isCheckedIn: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export function ClockInButton({ isCheckedIn, onCheckIn, onCheckOut }: ClockInButtonProps) {
  const handleCheckIn = () => {
    Alert.alert(
      'Potwierdzenie',
      'Czy chcesz rozpocząć pracę?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Rozpocznij',
          onPress: () => {
            onCheckIn();
            Alert.alert('Sukces', 'Rozpoczęto pracę');
          },
        },
      ]
    );
  };

  const handleCheckOut = () => {
    Alert.alert(
      'Potwierdzenie',
      'Czy chcesz zakończyć pracę?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Zakończ',
          onPress: () => {
            onCheckOut();
            Alert.alert('Sukces', 'Zakończono pracę');
          },
        },
      ]
    );
  };

  return isCheckedIn ? (
    <Button
      title="Zakończ pracę"
      onPress={handleCheckOut}
      variant="secondary"
      size="large"
      icon={<MaterialCommunityIcons name="clock-out" size={24} color="#fff" />}
    />
  ) : (
    <Button
      title="Rozpocznij pracę"
      onPress={handleCheckIn}
      variant="primary"
      size="large"
      icon={<MaterialCommunityIcons name="clock-in" size={24} color="#fff" />}
    />
  );
}