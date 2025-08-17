import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import CircularProgress from '../components/CircularProgress';

interface WorkDetail {
  id: string;
  room: string;
  squareMeters: number;
  linearMeters: number;
  originalSquareMeters?: number; // Oryginalne metry wpisane przez pracownika
  originalLinearMeters?: number;
  date: Date;
  status: 'pending' | 'approved' | 'partial' | 'rejected';
  rating?: number;
  projectName: string;
  projectAddress: string;
  description?: string;
  photos?: string[];
  feedback?: string;
  pricePerSquareMeter: number; // Cena za m²
  pricePerLinearMeter: number; // Cena za mb
}

const WorkDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const [workDetail] = useState<WorkDetail>({
    id: '1',
    room: 'Salon',
    squareMeters: 42.5, // Po weryfikacji
    linearMeters: 26, // Po weryfikacji
    originalSquareMeters: 45.5, // Wpisane przez pracownika
    originalLinearMeters: 28, // Wpisane przez pracownika
    date: new Date(2025, 7, 15),
    status: 'partial',
    rating: 70,
    projectName: 'Mieszkanie Kowalskich',
    projectAddress: 'ul. Marszałkowska 15, Warszawa',
    description: 'Tynkowanie ścian w salonie. Wykonane zgodnie ze standardem.',
    photos: [],
    feedback: 'Drobne nierówności przy narożnikach do poprawy.',
    pricePerSquareMeter: 45, // 45 zł/m²
    pricePerLinearMeter: 25, // 25 zł/mb
  });

  const [photos, setPhotos] = useState<string[]>(workDetail.photos || []);
  const [isEditing, setIsEditing] = useState(false);

  // Obliczenia wypłaty
  const calculatePayment = () => {
    const squareMetersPayment = workDetail.squareMeters * workDetail.pricePerSquareMeter;
    const linearMetersPayment = workDetail.linearMeters * workDetail.pricePerLinearMeter;
    const totalPayment = squareMetersPayment + linearMetersPayment;
    const rating = workDetail.rating || 0;
    const currentPayment = (totalPayment * rating) / 100;
    const potentialPayment = totalPayment - currentPayment;

    return {
      total: totalPayment,
      current: currentPayment,
      potential: potentialPayment,
      squareMetersPayment,
      linearMetersPayment,
    };
  };

  const payment = calculatePayment();

  const getStatusText = () => {
    const rating = workDetail.rating || 0;
    if (rating === 100) return 'Zaakceptowane';
    if (rating >= 70) return 'Do poprawki';
    if (rating >= 50) return 'Wymaga poprawy';
    return 'Odrzucone';
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Uprawnienia', 'Potrzebujemy dostępu do galerii, aby dodać zdjęcia.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Uprawnienia', 'Potrzebujemy dostępu do aparatu, aby zrobić zdjęcie.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleSave = () => {
    // Tu będzie logika zapisywania
    setIsEditing(false);
    Alert.alert('Sukces', 'Zmiany zostały zapisane');
  };

  const showImageOptions = () => {
    Alert.alert(
      'Dodaj zdjęcie',
      'Wybierz źródło zdjęcia',
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Zrób zdjęcie', onPress: takePhoto },
        { text: 'Wybierz z galerii', onPress: pickImage },
      ],
    );
  };

  const hasMetersChanged = workDetail.originalSquareMeters !== workDetail.squareMeters || 
                           workDetail.originalLinearMeters !== workDetail.linearMeters;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{workDetail.room}</Text>
            <Text style={styles.headerSubtitle}>{workDetail.projectName}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Central Rating Section */}
        <View style={styles.ratingSection}>
          <CircularProgress
            value={workDetail.rating || 0}
            size={250}
            strokeWidth={25}
            text={getStatusText()}
          />
          
          {/* Payment Info */}
          <View style={styles.paymentSection}>
            <View style={styles.paymentCard}>
              <Text style={styles.paymentLabel}>Wypłata</Text>
              <Text style={styles.paymentAmount}>{payment.current.toFixed(2)} zł</Text>
              <Text style={styles.paymentPercentage}>({workDetail.rating}%)</Text>
            </View>
            
            {workDetail.rating && workDetail.rating < 100 && (
              <View style={styles.potentialCard}>
                <Text style={styles.potentialLabel}>Możesz jeszcze zarobić</Text>
                <Text style={styles.potentialAmount}>+{payment.potential.toFixed(2)} zł</Text>
                <Text style={styles.potentialHint}>po poprawkach</Text>
              </View>
            )}
          </View>
        </View>

        {/* Metrics Section */}
        <View style={styles.metricsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Wymiary pracy</Text>
            {hasMetersChanged && (
              <View style={styles.changedBadge}>
                <Ionicons name="information-circle" size={16} color="#f59e0b" />
                <Text style={styles.changedBadgeText}>Zmienione</Text>
              </View>
            )}
          </View>

          <View style={styles.metricsCards}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="square-outline" size={20} color="#FFA500" />
                <Text style={styles.metricTitle}>Powierzchnia</Text>
              </View>
              <View style={styles.metricValues}>
                <View>
                  <Text style={styles.metricValue}>{workDetail.squareMeters} m²</Text>
                  {workDetail.originalSquareMeters && workDetail.originalSquareMeters !== workDetail.squareMeters && (
                    <View style={styles.originalValue}>
                      <Text style={styles.originalValueText}>
                        Zgłoszone: {workDetail.originalSquareMeters} m²
                      </Text>
                      <Text style={styles.differenceText}>
                        ({(workDetail.squareMeters - workDetail.originalSquareMeters).toFixed(1)} m²)
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.metricPrice}>{payment.squareMetersPayment.toFixed(0)} zł</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="resize" size={20} color="#FFA500" />
                <Text style={styles.metricTitle}>Metry bieżące</Text>
              </View>
              <View style={styles.metricValues}>
                <View>
                  <Text style={styles.metricValue}>{workDetail.linearMeters} mb</Text>
                  {workDetail.originalLinearMeters && workDetail.originalLinearMeters !== workDetail.linearMeters && (
                    <View style={styles.originalValue}>
                      <Text style={styles.originalValueText}>
                        Zgłoszone: {workDetail.originalLinearMeters} mb
                      </Text>
                      <Text style={styles.differenceText}>
                        ({(workDetail.linearMeters - workDetail.originalLinearMeters).toFixed(1)} mb)
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.metricPrice}>{payment.linearMetersPayment.toFixed(0)} zł</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Project Info */}
        <View style={styles.projectInfoSection}>
          <Text style={styles.sectionTitle}>Szczegóły projektu</Text>
          <View style={styles.projectInfoCard}>
            <View style={styles.projectInfoRow}>
              <Ionicons name="location-outline" size={18} color="#6b7280" />
              <Text style={styles.projectInfoText}>{workDetail.projectAddress}</Text>
            </View>
            <View style={styles.projectInfoRow}>
              <Ionicons name="calendar-outline" size={18} color="#6b7280" />
              <Text style={styles.projectInfoText}>
                {workDetail.date.toLocaleDateString('pl-PL')}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Opis pracy</Text>
          <Text style={styles.descriptionText}>
            {workDetail.description || 'Brak opisu'}
          </Text>
        </View>

        {/* Photos */}
        <View style={styles.photosSection}>
          <Text style={styles.sectionTitle}>Zdjęcia ({photos.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                </View>
              ))}
              {photos.length === 0 && (
                <View style={styles.noPhotosPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="#d1d5db" />
                  <Text style={styles.noPhotosText}>Brak zdjęć</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Feedback */}
        {workDetail.feedback && (
          <View style={styles.feedbackSection}>
            <Text style={styles.sectionTitle}>Uwagi do poprawy</Text>
            <View style={styles.feedbackCard}>
              <Ionicons name="warning-outline" size={20} color="#f59e0b" />
              <Text style={styles.feedbackText}>{workDetail.feedback}</Text>
            </View>
          </View>
        )}
      </ScrollView>
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
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  paymentSection: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 16,
    paddingHorizontal: 20,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  paymentPercentage: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  potentialCard: {
    flex: 1,
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  potentialLabel: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 4,
  },
  potentialAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  potentialHint: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 2,
  },
  metricsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  changedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  changedBadgeText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  metricsCards: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  metricValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  originalValue: {
    marginTop: 4,
  },
  originalValueText: {
    fontSize: 14,
    color: '#6b7280',
  },
  differenceText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  metricPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22c55e',
  },
  projectInfoSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  projectInfoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  projectInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectInfoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  descriptionSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  photosSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  noPhotosPlaceholder: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotosText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  feedbackSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  feedbackCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});

export default WorkDetailScreen;