import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WorkCardProps {
  room: string;
  squareMeters: number;
  linearMeters: number;
  date: Date;
  status: 'pending' | 'approved' | 'partial' | 'rejected';
  rating?: number;
  projectName: string;
  projectAddress: string;
  onPress?: () => void;
}

const WorkCard: React.FC<WorkCardProps> = ({
  room,
  squareMeters,
  linearMeters,
  date,
  status,
  rating,
  projectName,
  projectAddress,
  onPress,
}) => {
  const getStatusColor = (status: WorkCardProps['status']) => {
    switch (status) {
      case 'approved':
        return '#22c55e';
      case 'partial':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: WorkCardProps['status'], rating?: number) => {
    switch (status) {
      case 'approved':
        return `Zaakceptowane ${rating}%`;
      case 'partial':
        return `Do poprawki ${rating}%`;
      case 'rejected':
        return 'Odrzucone';
      default:
        return 'Oczekuje na ocenę';
    }
  };

  const formatDate = (date: Date) => {
    const months = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.title}>{room}</Text>
          <Text style={styles.project}>{projectName}</Text>
          <Text style={styles.address}>{projectAddress}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(status) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(status, rating)}
          </Text>
        </View>
      </View>
      
      <View style={styles.metrics}>
        <View style={styles.metricItem}>
          <Ionicons name="square-outline" size={16} color="#6b7280" />
          <Text style={styles.metricText}>{squareMeters} m²</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="resize" size={16} color="#6b7280" />
          <Text style={styles.metricText}>{linearMeters} mb</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.metricText}>
            {formatDate(date)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  project: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default WorkCard;