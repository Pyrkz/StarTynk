import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../../store/useAppStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface DayItemProps {
  day: number;
  dayName: string;
  isToday?: boolean;
  hasWork?: boolean;
}

const DayItem: React.FC<DayItemProps> = ({ day, dayName, isToday, hasWork }) => (
  <View style={styles.dayContainer}>
    <Text style={styles.dayName}>{dayName}</Text>
    <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
      <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>{day}</Text>
    </View>
    {hasWork && <View style={styles.workDot} />}
  </View>
);

type DashboardScreenNavigationProp = NativeStackNavigationProp<any>;

export default function DashboardScreen() {
  const user = useAppStore((state) => state.user);
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  
  // Get current date info
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get start of week (Monday)
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  
  // Generate week days
  const weekDays = [];
  const dayNames = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDays.push({
      day: date.getDate(),
      dayName: dayNames[i],
      isToday: date.getDate() === currentDay,
      hasWork: i < 5, // Mock data - work days Mon-Fri
    });
  }
  
  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Dzień dobry';
    if (hour < 18) return 'Miłego dnia';
    return 'Dobry wieczór';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>
              {user?.name || 'Użytkownik'}
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>Ten tydzień</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Zobacz wszystko</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekContainer}>
            {weekDays.map((dayInfo, index) => (
              <DayItem
                key={index}
                day={dayInfo.day}
                dayName={dayInfo.dayName}
                isToday={dayInfo.isToday}
                hasWork={dayInfo.hasWork}
              />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Szybkie akcje</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Order' as any)}
            >
              <LinearGradient
                colors={['#FEAD00', '#D75200']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Ionicons name="add-circle-outline" size={32} color="#fff" />
                <Text style={styles.actionText}>Nowe zamówienie</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionCardContent}>
                <Ionicons name="time-outline" size={32} color="#D75200" />
                <Text style={styles.actionTextDark}>Historia pracy</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Podsumowanie</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Zamówień dzisiaj</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>8.5h</Text>
              <Text style={styles.statLabel}>Czas pracy</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>245 zł</Text>
              <Text style={styles.statLabel}>Zarobki dzisiaj</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFCF2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#D75200',
    fontWeight: '500',
  },
  weekContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: '#D75200',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  todayNumber: {
    color: '#fff',
    fontWeight: '600',
  },
  workDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FEAD00',
    marginTop: 8,
  },
  quickActions: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  actionCard: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardContent: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  actionTextDark: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D75200',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});