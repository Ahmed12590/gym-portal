import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  primaryGymId?: string;
}

interface Gym {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

interface AuthStore {
  user: User | null;
  gym: Gym | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setGym: (gym: Gym | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>(
  persist(
    (set) => ({
      user: null,
      gym: null,
      isAuthenticated: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
      setGym: (gym) => set({ gym }),
      logout: () =>
        set({
          user: null,
          gym: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-store",
    }
  )
);

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export const useUIStore = create<UIStore>(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      theme: "light",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "ui-store",
    }
  )
);

interface DashboardStore {
  selectedGymId: string | null;
  selectedBranchId: string | null;
  filters: Record<string, any>;
  setSelectedGym: (gymId: string | null) => void;
  setSelectedBranch: (branchId: string | null) => void;
  setFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
}

export const useDashboardStore = create<DashboardStore>(
  persist(
    (set) => ({
      selectedGymId: null,
      selectedBranchId: null,
      filters: {},
      setSelectedGym: (gymId) => set({ selectedGymId: gymId }),
      setSelectedBranch: (branchId) => set({ selectedBranchId: branchId }),
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),
    }),
    {
      name: "dashboard-store",
    }
  )
);

interface NotificationStore {
  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>;
  addNotification: (
    type: "success" | "error" | "warning" | "info",
    message: string
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (type, message) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: Math.random().toString(36).substring(7),
          type,
          message,
        },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));

interface LoadingStore {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
