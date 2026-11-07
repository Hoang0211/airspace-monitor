import type { Alert } from "../detection/detection.types";

export type LayerToggle = "sensors" | "coverage" | "zones" | "trails" | "pilots";

export type LayerVisibility = Record<LayerToggle, boolean>;

export type PlaybackSpeed = 1 | 2 | 5;

export interface Playback {
  playing: boolean;
  speed: PlaybackSpeed;
}

export interface AppState {
  layers: LayerVisibility;
  setLayerVisible: (layer: LayerToggle, visible: boolean) => void;
  playback: Playback;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  /** Simulated seconds since the app opened. */
  siteTime: number;
  /** Newest first. */
  alerts: Alert[];
  recordTick: (siteTime: number, newAlerts: Alert[]) => void;
}
