import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

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
const mockArchivedWorks: Work[] = [
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
  {
    id: '4',
    room: 'Sypialnia główna',
    squareMeters: 22.0,
    linearMeters: 18,
    date: new Date(2025, 7, 10),
    status: 'approved',
    rating: 100,
    projectName: 'Mieszkanie Nowak',
    projectAddress: 'ul. Polna 12, Konstancin',
  },
  {
    id: '5',
    room: 'Pokój dziecięcy',
    squareMeters: 15.5,
    linearMeters: 16,
    date: new Date(2025, 7, 8),
    status: 'approved',
    rating: 100,
    projectName: 'Mieszkanie Nowak',
    projectAddress: 'ul. Polna 12, Konstancin',
  },
  {
    id: '6',
    room: 'Korytarz',
    squareMeters: 12.0,
    linearMeters: 22,
    date: new Date(2025, 7, 5),
    status: 'rejected',
    rating: 0,
    projectName: 'Biuro Start-up',
    projectAddress: 'ul. Mokotowska 50, Warszawa',
  },
];

const WorkArchiveScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'approved' | 'partial' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'project' | 'status'>('date');

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
        return `${rating}%`;
      case 'partial':
        return `${rating}%`;
      case 'rejected':
        return '0%';
      default:
        return '-';
    }
  };

  const filteredAndSortedWorks = useMemo(() => {
    let filtered = mockArchivedWorks;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(work =>
        work.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.projectAddress.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(work => work.status === selectedFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.date.getTime() - a.date.getTime();
        case 'project':
          return a.projectName.localeCompare(b.projectName);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedFilter, sortBy]);

  const stats = useMemo(() => {
    const totalSquareMeters = mockArchivedWorks.reduce((sum, work) => sum + work.squareMeters, 0);
    const totalLinearMeters = mockArchivedWorks.reduce((sum, work) => sum + work.linearMeters, 0);
    const approvedWorks = mockArchivedWorks.filter(work => work.status === 'approved');
    const averageRating = approvedWorks.length > 0
      ? approvedWorks.reduce((sum, work) => sum + (work.rating || 0), 0) / approvedWorks.length
      : 0;

    return {
      totalWorks: mockArchivedWorks.length,
      totalSquareMeters: totalSquareMeters.toFixed(1),
      totalLinearMeters: totalLinearMeters.toFixed(0),
      averageRating: averageRating.toFixed(0),
    };
  }, []);

  const renderWorkItem = ({ item }: { item: Work }) => (
    <TouchableOpacity style={styles.workItem}>
      <View style={styles.workItemLeft}>
        <View style={styles.workItemHeader}>
          <Text style={styles.workItemTitle}>{item.room}</Text>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusIndicatorText}>
              {getStatusText(item.status, item.rating)}
            </Text>
          </View>
        </View>
        <Text style={styles.workItemProject}>{item.projectName}</Text>
        <Text style={styles.workItemAddress}>{item.projectAddress}</Text>
        <View style={styles.workItemMetrics}>
          <Text style={styles.metricText}>{item.squareMeters} m²</Text>
          <Text style={styles.metricSeparator}>•</Text>
          <Text style={styles.metricText}>{item.linearMeters} mb</Text>
          <Text style={styles.metricSeparator}>•</Text>
          <Text style={styles.metricText}>
            {item.date.toLocaleDateString('pl-PL')}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Archiwum prac</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalWorks}</Text>
            <Text style={styles.statLabel}>Wszystkie prace</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalSquareMeters}</Text>
            <Text style={styles.statLabel}>m² wykonane</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalLinearMeters}</Text>
            <Text style={styles.statLabel}>mb wykonane</Text>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#FEAD00', '#D75200']}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.statValueWhite}>{stats.averageRating}%</Text>
            </LinearGradient>
            <Text style={styles.statLabel}>Średnia ocena</Text>
          </View>
        </View>
      </ScrollView>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj po nazwie, projekcie..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              Wszystkie
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'approved' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('approved')}
          >
            <Text style={[styles.filterText, selectedFilter === 'approved' && styles.filterTextActive]}>
              Zaakceptowane
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'partial' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('partial')}
          >
            <Text style={[styles.filterText, selectedFilter === 'partial' && styles.filterTextActive]}>
              Do poprawki
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'rejected' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('rejected')}
          >
            <Text style={[styles.filterText, selectedFilter === 'rejected' && styles.filterTextActive]}>
              Odrzucone
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sortuj:</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              const options: Array<'date' | 'project' | 'status'> = ['date', 'project', 'status'];
              const currentIndex = options.indexOf(sortBy);
              setSortBy(options[(currentIndex + 1) % options.length]);
            }}
          >
            <Text style={styles.sortButtonText}>
              {sortBy === 'date' ? 'Data' : sortBy === 'project' ? 'Projekt' : 'Status'}
            </Text>
            <Ionicons name="swap-vertical" size={16} color="#FFA500" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Works List */}
      <FlatList
        data={filteredAndSortedWorks}
        renderItem={renderWorkItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>Brak prac do wyświetlenia</Text>
          </View>
        }
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statGradient: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 4,
  },
  statValueWhite: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filters: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#FFA500',
    borderColor: '#FFA500',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFF',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sortLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#FFA500',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  workItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workItemLeft: {
    flex: 1,
  },
  workItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  workItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusIndicatorText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  workItemProject: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  workItemAddress: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  workItemMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 12,
    color: '#6b7280',
  },
  metricSeparator: {
    fontSize: 12,
    color: '#d1d5db',
    marginHorizontal: 8,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
});

export default WorkArchiveScreen;