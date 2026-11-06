import { create } from "zustand";
import type { AppState } from "./store.types";

export const useAppStore = create<AppState>()((set) => ({
  layers: { sensors: true, coverage: true, zones: true, trails: true, pilots: true },
  setLayerVisible: (layer, visible) =>
    set((state) => ({ layers: { ...state.layers, [layer]: visible } })),
  playback: { playing: true, speed: 1 },
  setPlaying: (playing) => set((state) => ({ playback: { ...state.playback, playing } })),
  setSpeed: (speed) => set((state) => ({ playback: { ...state.playback, speed } })),
}));
