export interface DashboardData {
  todayTasks: number;
  pendingTasks: number;
  completedThisWeek: number;
  hoursToday: number;
  currentProject: string;
  notifications: number;
}

export interface ActivityItem {
  id: string;
  type: 'success' | 'warning' | 'primary' | 'error';
  title: string;
  description: string;
  timestamp: Date;
}

export interface QuickActionItem {
  id: string;
  icon: string;
  iconFamily: 'MaterialIcons' | 'MaterialCommunityIcons' | 'Ionicons';
  title: string;
  color: string;
  route: string;
  enabled: boolean;
}