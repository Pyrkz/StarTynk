'use client'

import { useHeader } from '@/features/header'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Button } from '@/components/ui/Button'

export default function ExampleNotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useHeader()

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Przykład z powiadomieniami
          </h1>
          <p className="text-gray-600">
            Ta strona pokazuje, jak działa system powiadomień z headerem.
            Liczba nieprzeczytanych powiadomień: {unreadCount}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Powiadomienia</h2>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
              >
                Oznacz wszystkie jako przeczytane
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {notification.title}
                    </h3>
                    {notification.message && (
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    )}
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Oznacz jako przeczytane
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Brak powiadomień
              </p>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}