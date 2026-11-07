import { create } from "zustand";
import { addAlerts } from "../detection/alerts.utils";
import type { AppState } from "./store.types";

export const useAppStore = create<AppState>()((set) => ({
  layers: { sensors: true, coverage: true, zones: true, trails: true, pilots: true },
  setLayerVisible: (layer, visible) =>
    set((state) => ({ layers: { ...state.layers, [layer]: visible } })),
  playback: { playing: true, speed: 1 },
  setPlaying: (playing) => set((state) => ({ playback: { ...state.playback, playing } })),
  setSpeed: (speed) => set((state) => ({ playback: { ...state.playback, speed } })),
  siteTime: 0,
  alerts: [],
  drones: [],
  recordTick: (siteTime, newAlerts, drones) =>
    set((state) => ({
      siteTime,
      // Keeps the same list when nothing is new, so the alert list doesn't re-render on every tick.
      alerts: newAlerts.length > 0 ? addAlerts(state.alerts, newAlerts) : state.alerts,
      drones,
    })),
  selectedDroneId: null,
  selectDrone: (selectedDroneId) => set({ selectedDroneId }),
}));
