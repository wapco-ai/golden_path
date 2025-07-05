import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRouteStore = create(
  persist(
    (set) => ({
      origin: null,
      destination: null,
      routeGeo: null,
      routeSteps: [],
      transportMode: 'walking',
      alternativeRoutes: [],
      setOrigin: (origin) => set({ origin }),
      setDestination: (destination) => set({ destination }),
      setRouteGeo: (routeGeo) => set({ routeGeo }),
      setRouteSteps: (routeSteps) => set({ routeSteps }),
      setTransportMode: (transportMode) => set({ transportMode }),
      setAlternativeRoutes: (alternativeRoutes) => set({ alternativeRoutes }),
      clearRoute: () =>
        set({ origin: null, destination: null, routeGeo: null, routeSteps: [], alternativeRoutes: [], transportMode: 'walking' })
    }),
    {
      name: 'route-storage',
      version: 1
    }
  )
);
