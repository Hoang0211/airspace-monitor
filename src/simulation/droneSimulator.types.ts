import type { LngLat } from "../data/geo.types";
import type { Zone } from "../data/zones.types";

export type Behavior = "patrol" | "loiter" | "transit";

export interface Drone {
  id: string;
  behavior: Behavior;
  position: LngLat;
  /** Where the pilot stands for the whole flight. The drone takes off from this point. */
  pilot: LngLat;
  /** Degrees clockwise from north. */
  heading: number;
  /** Meters per second. */
  speed: number;
  /**
   * The points to fly toward: a patrol loops through these, a loiter circles the first, and a
   * transit ends at the first. On the final leg, this is a single point where the flight ends.
   */
  waypoints: LngLat[];
  waypointIndex: number;
  /** Set while the drone is circling a point. */
  loiterCenter?: LngLat;
  /**
   * What is left before the drone flies home: waypoint arrivals for a patrol, or seconds at the
   * circle for a loiter. Null on the final leg, which for a transit drone is the whole flight.
   */
  missionRemaining: number | null;
  /** Recent positions, oldest first. */
  trail: LngLat[];
}

export interface SimulatorOptions {
  center: LngLat;
  /** Pilots, waypoints and destinations are all picked within this distance of the center. */
  radiusMeters: number;
  maxDrones: number;
  /** A new drone takes off every this many ticks, as long as there is room for one. */
  spawnIntervalTicks: number;
  /** How many positions each drone keeps in its trail. */
  trailLength: number;
  /** The same seed always produces the same flights. */
  seed: number;
  /** Ticks to run before the first update, so the airspace isn't empty when the app opens. */
  warmStartTicks: number;
  /** Pilots and transit destinations are never placed inside these zones. */
  noTakeoffZones: Zone[];
}
