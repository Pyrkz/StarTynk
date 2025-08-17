import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useNavigation } from '@react-navigation/native';
import AddWorkModal from '../components/AddWorkModal';

const { width } = Dimensions.get('window');

interface Work {
  id: string;
  room: string;
  squareMeters: number;
  linearMeters: number;
  date: Date;
  status: 'pending' | 'approved' | 'partial' | 'rejected';
  rating?: number;
  projectName: string;
  projectAddress: string;
}

// Mock data - później będzie z API
const mockWorks: Work[] = [
  {
    id: '1',
    room: 'Salon',
    squareMeters: 45.5,
    linearMeters: 28,
    date: new Date(2025, 7, 15),
    status: 'approved',
    rating: 100,
    projectName: 'Mieszkanie Kowalskich',
    projectAddress: 'ul. Marszałkowska 15, Warszawa',
  },
  {
    id: '2',
    room: 'Kuchnia',
    squareMeters: 18.2,
    linearMeters: 15,
    date: new Date(2025, 7, 14),
    status: 'partial',
    rating: 70,
    projectName: 'Dom jednorodzinny',
    projectAddress: 'ul. Słoneczna 8, Piaseczno',
  },
  {
    id: '3',
    room: 'Łazienka',
    squareMeters: 8.5,
    linearMeters: 12,
    date: new Date(2025, 7, 13),
    status: 'approved',
    rating: 100,
    projectName: 'Apartament Premium',
    projectAddress: 'ul. Złota 44, Warszawa',
  },
];

const WorkScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getStatusColor = (status: Work['status']) => {
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

  const getStatusText = (status: Work['status'], rating?: number) => {
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

  const renderCalendarDay = (day: Date, index: number) => {
    const isSelected = isSameDay(day, selectedDate);
    const hasWork = mockWorks.some(work => isSameDay(work.date, day));

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          isSelected && styles.selectedDay,
        ]}
        onPress={() => setSelectedDate(day)}
      >
        <Text style={[
          styles.calendarDayText,
          isSelected && styles.selectedDayText,
        ]}>
          {format(day, 'd')}
        </Text>
        {hasWork && (
          <View style={[
            styles.workIndicator,
            isSelected && styles.selectedWorkIndicator,
          ]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderWorkCard = (work: Work) => (
    <TouchableOpacity 
      key={work.id} 
      style={styles.workCard}
      onPress={() => navigation.navigate('WorkDetail' as any, { workId: work.id })}
    >
      <View style={styles.workCardHeader}>
        <View style={styles.workCardInfo}>
          <Text style={styles.workCardTitle}>{work.room}</Text>
          <Text style={styles.workCardProject}>{work.projectName}</Text>
          <Text style={styles.workCardAddress}>{work.projectAddress}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(work.status) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(work.status, work.rating)}
          </Text>
        </View>
      </View>
      
      <View style={styles.workCardMetrics}>
        <View style={styles.metricItem}>
          <Ionicons name="square-outline" size={16} color="#6b7280" />
          <Text style={styles.metricText}>{work.squareMeters} m²</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="resize" size={16} color="#6b7280" />
          <Text style={styles.metricText}>{work.linearMeters} mb</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.metricText}>
            {format(work.date, 'd MMM', { locale: pl })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleAddWork = (newWork: any) => {
    // Tu będzie logika dodawania pracy
    console.log('Nowa praca:', newWork);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Moje Prace</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <LinearGradient
              colors={['#FEAD00', '#D75200']}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {format(currentMonth, 'LLLL yyyy', { locale: pl })}
            </Text>
            <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <Ionicons name="chevron-forward" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((day: string, index: number) => (
              <Text key={index} style={styles.calendarWeekDay}>{day}</Text>
            ))}
            {monthDays.map((day, index) => renderCalendarDay(day, index))}
          </View>
        </View>

        {/* Recent Works */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ostatnie prace</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('WorkArchive' as any)}
            >
              <Text style={styles.viewAllText}>Zobacz wszystkie</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFA500" />
            </TouchableOpacity>
          </View>

          {mockWorks.slice(0, 3).map(renderWorkCard)}
        </View>

        {/* Stats Summary */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Podsumowanie miesiąca</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>156.2</Text>
              <Text style={styles.statLabel}>m² wykonane</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>89%</Text>
              <Text style={styles.statLabel}>Średnia ocena</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Ukończone prace</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <AddWorkModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddWork}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFCF2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 48,
    height: 48,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarSection: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarWeekDay: {
    width: (width - 64) / 7,
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  calendarDay: {
    width: (width - 64) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  selectedDay: {
    backgroundColor: '#FFA500',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: '600',
  },
  workIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFA500',
    position: 'absolute',
    bottom: 4,
  },
  selectedWorkIndicator: {
    backgroundColor: '#FFF',
  },
  recentSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#FFA500',
    fontWeight: '500',
  },
  workCard: {
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
  workCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  workCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  workCardProject: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  workCardAddress: {
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
  workCardMetrics: {
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
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default WorkScreen;