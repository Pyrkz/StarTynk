import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useUsers } from '@repo/features/users';
import { UserDTO } from '@repo/shared/types';
import { formatDate } from '@repo/features/shared';

export function UsersExample() {
  const {
    users,
    isLoading,
    error,
    filters,
    setFilters,
    pagination,
    refetch,
  } = useUsers({
    pageSize: 20,
  });

  const renderUser = ({ item }: { item: UserDTO }) => (
    <TouchableOpacity style={styles.userCard}>
      <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
      <View style={styles.userMeta}>
        <Text style={styles.userRole}>{item.role}</Text>
        <Text style={styles.userDate}>Dołączył: {formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleLoadMore = () => {
    if (pagination.hasNext && !isLoading) {
      pagination.nextPage();
    }
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Błąd: {error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Użytkownicy</Text>
        <Text style={styles.subtitle}>
          Strona {pagination.page} z {pagination.totalPages} ({pagination.total} użytkowników)
        </Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && pagination.page === 1}
            onRefresh={() => {
              pagination.firstPage();
              refetch();
            }}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading && pagination.page > 1 ? (
            <ActivityIndicator style={styles.loadingFooter} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Brak użytkowników</Text>
            </View>
          ) : null
        }
      />

      <View style={styles.paginationControls}>
        <TouchableOpacity
          style={[styles.paginationButton, !pagination.hasPrevious && styles.disabledButton]}
          onPress={pagination.previousPage}
          disabled={!pagination.hasPrevious}
        >
          <Text style={styles.paginationButtonText}>Poprzednia</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.paginationButton, !pagination.hasNext && styles.disabledButton]}
          onPress={pagination.nextPage}
          disabled={!pagination.hasNext}
        >
          <Text style={styles.paginationButtonText}>Następna</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  userCard: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  userRole: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingFooter: {
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});