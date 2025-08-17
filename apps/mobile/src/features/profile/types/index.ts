export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  employeeId?: string;
  department?: string;
  position?: string;
}

export interface ProfileStats {
  totalDaysWorked: number;
  totalTasksCompleted: number;
  averageRating?: number;
  currentProject?: string;
}

export interface ProfileMenuItem {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showBadge?: boolean;
  badgeCount?: number;
}