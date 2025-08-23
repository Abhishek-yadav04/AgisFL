import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

type ThemeSlice = {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
};

// Base creator with state and actions
const themeSlice: StateCreator<ThemeSlice> = (set, get) => ({
  isDark: true,
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
  setTheme: (isDark: boolean) => set({ isDark }),
});

// Compose middleware: devtools → persist and sync
export const useThemeStore = create<ThemeState>()(
  devtools(
    persistNSync(
      persist(themeSlice, {
        name: 'agisfl-theme',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ isDark: state.isDark }),
      }),
      { name: 'agisfl-theme-sync', exclude: [] }
    ),
    { name: 'ThemeStore' }
  )
);

persist(themeSlice, {
  name: 'agisfl-theme',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ isDark: state.isDark }),
  onRehydrateStorage: () => (state, error) => {
    if (error) {
      console.error('Failed to rehydrate theme store:', error);
    }
  },
});

// Atomic selectors
export const useIsDark = () => useThemeStore((state) => state.isDark);
export const useThemeActions = () => useThemeStore((state) => ({
  toggleTheme: state.toggleTheme,
  setTheme: state.setTheme,
}));
