import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Profile, ShopSettings } from '@/types';

interface GlobalState {
  userProfile: Profile | null;
  setUserProfile: (profile: Profile | null) => void;
  shopSettings: ShopSettings | null;
  setShopSettings: (settings: ShopSettings | null) => void;
  clearStore: () => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      shopSettings: null,
      setShopSettings: (settings) => set({ shopSettings: settings }),
      clearStore: () => set({ userProfile: null, shopSettings: null }),
    }),
    {
      name: 'barbershop-storage', // nombre del item en localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
