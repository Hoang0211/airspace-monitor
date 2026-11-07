import type { LngLat } from "../data/geo.types";
import type { Zone } from "../data/zones.types";
import type { Behavior, Drone } from "../simulation/droneSimulator.types";

export type DroneStatus = "undetected" | "tracked" | "alert";

export interface Classification {
  status: DroneStatus;
  /** The restricted zone behind an alert, and null for any other status. */
  zone: Zone | null;
}

export type ClassifiedDrone = Drone & Classification;

/** The site time each drone was first detected, by drone ID, with only drones seen so far. */
export type FirstSeenByDrone = ReadonlyMap<string, number>;

/** A small copy of what the side panel shows, so full drones never go through React state. */
export interface DroneSummary {
  id: string;
  behavior: Behavior;
  status: DroneStatus;
  /** Meters per second. */
  speed: number;
  /** Null until a sensor has detected the drone. */
  firstSeenAt: number | null;
  /** Meters. */
  distanceToPilot: number;
  position: LngLat;
  pilot: LngLat;
}

export interface Alert {
  id: string;
  droneId: string;
  zoneName: string;
  /** Simulated seconds after the app opened, when the drone entered the zone. */
  time: number;
}

/** The zone each drone is in right now, by drone ID, with only drones that are in one. */
export type ZonesByDrone = ReadonlyMap<string, string>;

export interface ZoneEntries {
  alerts: Alert[];
  zonesByDrone: ZonesByDrone;
}
