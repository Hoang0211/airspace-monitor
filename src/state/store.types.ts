import type { LngLat } from "../data/geo.types";
import type { Alert, DroneSummary } from "../detection/detection.types";

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
  drones: DroneSummary[];
  recordTick: (siteTime: number, newAlerts: Alert[], drones: DroneSummary[]) => void;
  /** Stays set after the drone is gone, so the details panel can report the lost contact. */
  selectedDroneId: string | null;
  selectDrone: (droneId: string | null) => void;
  /** Where the map was last asked to fly. Each request is a new value, even for the same place. */
  flyTarget: LngLat | null;
  flyTo: (target: LngLat) => void;
}
