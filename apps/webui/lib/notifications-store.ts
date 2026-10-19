import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationSeverity = 'success' | 'warning' | 'error' | 'info'

export interface PlatformNotification {
  id: string
  message: string
  severity: NotificationSeverity
  timestamp: string
  read: boolean
}

interface NotificationsState {
  notifications: PlatformNotification[]
  addNotification: (notification: Omit<PlatformNotification, 'id' | 'read'> & { id?: string; timestamp?: string }) => void
  markAllAsRead: () => void
  clearAll: () => void
}

export const useNotifications = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => {
          const id = notification.id || Math.random().toString(36).substring(7)
          if (state.notifications.some(n => n.id === id)) {
            return state
          }
          return {
            notifications: [
              {
                ...notification,
                id,
                timestamp: notification.timestamp || new Date().toISOString(),
                read: false,
              },
              ...state.notifications,
            ],
          }
        }),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: 'platform-notifications',
    }
  )
)
