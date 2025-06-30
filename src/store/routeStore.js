import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRouteStore = create(
  persist(
    (set) => ({
      origin: null,
      destination: null,
      routeGeo: null,
      routeSteps: [],
      setOrigin: (origin) => set({ origin }),
      setDestination: (destination) => set({ destination }),
      setRouteGeo: (routeGeo) => set({ routeGeo }),
      setRouteSteps: (routeSteps) => set({ routeSteps }),
      clearRoute: () => set({ origin: null, destination: null, routeGeo: null, routeSteps: [] })
    }),
    {
      name: 'route-storage',
      version: 1
    }
  )
);
