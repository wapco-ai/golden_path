import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRouteStore = create(
  persist(
    (set) => ({
      origin: null,
      destination: null,
      routeGeo: null,
      setOrigin: (origin) => set({ origin }),
      setDestination: (destination) => set({ destination }),
      setRouteGeo: (routeGeo) => set({ routeGeo }),
      clearRoute: () => set({ origin: null, destination: null, routeGeo: null })
    }),
    {
      name: 'route-storage',
      version: 1
    }
  )
);
