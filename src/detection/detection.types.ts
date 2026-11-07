import type { Zone } from "../data/zones.types";
import type { Drone } from "../simulation/droneSimulator.types";

export type DroneStatus = "undetected" | "tracked" | "alert";

export interface Classification {
  status: DroneStatus;
  /** The restricted zone behind an alert, and null for any other status. */
  zone: Zone | null;
}

export type ClassifiedDrone = Drone & Classification;

export interface Alert {
  id: string;
  droneId: string;
  zoneName: string;
  /** Simulated seconds when the drone entered the zone. */
  time: number;
}

/** The zone each drone is in right now, by drone ID, with only drones that are in one. */
export type ZonesByDrone = ReadonlyMap<string, string>;

export interface ZoneEntries {
  alerts: Alert[];
  zonesByDrone: ZonesByDrone;
}
