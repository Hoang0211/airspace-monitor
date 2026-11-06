import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import type { LngLat } from "../data/geo.types";
import { bearingTo, distance, offset } from "../data/geo.utils";
import { ZONES } from "../data/zones";
import type { Behavior, Drone, SimulatorOptions } from "./droneSimulator.types";
import { angleDifference, clamp, createRng } from "./droneSimulator.utils";

const DEFAULT_OPTIONS: SimulatorOptions = {
  center: [24.97, 60.3],
  radiusMeters: 8000,
  maxDrones: 12,
  spawnIntervalTicks: 3,
  trailLength: 30,
  seed: 42,
  warmStartTicks: 1800,
  noTakeoffZones: ZONES,
};

const BEHAVIORS: readonly Behavior[] = ["patrol", "loiter", "transit"];

const MAX_TURN_DEGREES_PER_TICK = 30;
const MIN_SPEED = 6;
const MAX_SPEED = 22;
const WAYPOINT_REACHED_METERS = 80;
const WAYPOINT_AREA_FACTOR = 0.7;
const PATROL_LOOPS = 3;
const PATROL_WAYPOINT_COUNT = 3;
const MIN_PATROL_SPREAD_METERS = 1000;
const MAX_PATROL_SPREAD_METERS = 2000;
const LOITER_RADIUS_METERS = 300;
// A little wider than the circle, so a drone counts as being there while it circles.
const LOITER_ARRIVED_METERS = 400;
const MIN_LOITER_SECONDS = 180;
const MAX_LOITER_SECONDS = 420;
const MIN_TRANSIT_METERS = 4000;
const MAX_TRANSIT_METERS = 8000;
// Gives up after this many tries, so zones that leave no room can't cause an endless loop.
const MAX_POINT_ATTEMPTS = 100;

/** A fake drone source. Each tick is one simulated second, so call tick() more often to speed up. */
export class DroneSimulator {
  private readonly options: SimulatorOptions;
  private readonly rng: ReturnType<typeof createRng>;
  private readonly drones = new Map<string, Drone>();
  private time = 0;
  private nextId = 1;

  constructor(options: Partial<SimulatorOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.rng = createRng(this.options.seed);

    for (let i = 0; i < this.options.warmStartTicks; i++) {
      this.tick();
    }
  }

  get simTime(): number {
    return this.time;
  }

  getDrones(): Drone[] {
    return [...this.drones.values()];
  }

  tick(): Drone[] {
    this.time += 1;

    const { spawnIntervalTicks, maxDrones } = this.options;
    if (this.time % spawnIntervalTicks === 0 && this.drones.size < maxDrones) {
      this.spawnDrone();
    }

    for (const drone of this.drones.values()) {
      this.progressMission(drone);

      if (this.hasFinishedFlight(drone)) {
        this.drones.delete(drone.id);
        continue;
      }

      this.steer(drone);
      this.move(drone);
    }

    return this.getDrones();
  }

  /** Adds a drone at its pilot's position, ready to take off. */
  private spawnDrone(): void {
    const behavior = this.rng.pick(BEHAVIORS);
    const pilot = this.pickAllowedPoint(() => this.pointInArea(this.options.radiusMeters));
    const speed = this.rng.range(6, 18);
    const waypoints = this.pickWaypoints(behavior, pilot);

    const drone: Drone = {
      id: `UAV-${String(this.nextId++).padStart(3, "0")}`,
      behavior,
      position: pilot,
      pilot,
      heading: bearingTo(pilot, waypoints[0]),
      speed,
      waypoints,
      waypointIndex: 0,
      loiterCenter: behavior === "loiter" ? waypoints[0] : undefined,
      missionRemaining: this.pickMissionLength(behavior),
      trail: [],
    };

    this.drones.set(drone.id, drone);
  }

  private pickWaypoints(behavior: Behavior, pilot: LngLat): LngLat[] {
    const firstWaypoint = this.pointInArea(this.options.radiusMeters * WAYPOINT_AREA_FACTOR);

    if (behavior === "patrol") {
      const nearbyWaypoints = Array.from({ length: PATROL_WAYPOINT_COUNT - 1 }, () =>
        offset(
          firstWaypoint,
          this.rng.range(0, 360),
          this.rng.range(MIN_PATROL_SPREAD_METERS, MAX_PATROL_SPREAD_METERS),
        ),
      );

      return [firstWaypoint, ...nearbyWaypoints];
    }

    if (behavior === "loiter") return [firstWaypoint];

    const destination = this.pickAllowedPoint(() =>
      offset(pilot, this.rng.range(0, 360), this.rng.range(MIN_TRANSIT_METERS, MAX_TRANSIT_METERS)),
    );

    return [destination];
  }

  private pickMissionLength(behavior: Behavior): number | null {
    // Reaching the first waypoint starts the first loop, and each loop then reaches every waypoint.
    if (behavior === "patrol") return 1 + PATROL_LOOPS * PATROL_WAYPOINT_COUNT;
    if (behavior === "loiter") return this.rng.range(MIN_LOITER_SECONDS, MAX_LOITER_SECONDS);

    return null;
  }

  private pointInArea(radiusMeters: number): LngLat {
    return offset(this.options.center, this.rng.range(0, 360), this.rng.range(0, radiusMeters));
  }

  /** Tries random points until one is inside the area and outside the no-takeoff zones. */
  private pickAllowedPoint(randomPoint: () => LngLat): LngLat {
    const { center, radiusMeters, noTakeoffZones } = this.options;
    let point = randomPoint();

    for (let attempt = 1; attempt < MAX_POINT_ATTEMPTS; attempt++) {
      const isInsideArea = distance(point, center) <= radiusMeters;
      const isInsideZone = noTakeoffZones.some((zone) =>
        booleanPointInPolygon(point, zone.polygon),
      );
      if (isInsideArea && !isInsideZone) break;

      point = randomPoint();
    }

    return point;
  }

  /**
   * Moves a patrol on when it reaches a waypoint, and counts down its mission or a loiter's. A
   * mission only counts down at the target, so no drone can head home before getting there.
   */
  private progressMission(drone: Drone): void {
    if (drone.missionRemaining === null) return;

    if (drone.loiterCenter) {
      if (distance(drone.position, drone.loiterCenter) < LOITER_ARRIVED_METERS) {
        drone.missionRemaining -= 1;
      }
    } else if (
      distance(drone.position, drone.waypoints[drone.waypointIndex]) < WAYPOINT_REACHED_METERS
    ) {
      drone.waypointIndex = (drone.waypointIndex + 1) % drone.waypoints.length;
      drone.missionRemaining -= 1;
    }

    if (drone.missionRemaining <= 0) this.startReturning(drone);
  }

  private startReturning(drone: Drone): void {
    drone.waypoints = [drone.pilot];
    drone.waypointIndex = 0;
    drone.loiterCenter = undefined;
    drone.missionRemaining = null;
  }

  /** A drone on its final leg is finished once it reaches the end of that leg. */
  private hasFinishedFlight(drone: Drone): boolean {
    return (
      drone.missionRemaining === null &&
      distance(drone.position, drone.waypoints[0]) < WAYPOINT_REACHED_METERS
    );
  }

  /** Turns toward the current target gradually, rather than snapping to it. */
  private steer(drone: Drone): void {
    let targetHeading: number;

    if (drone.loiterCenter) {
      // Aim along the circle, turning in or out depending on how far off the circle the drone is.
      const bearingToCenter = bearingTo(drone.position, drone.loiterCenter);
      const distanceToCenter = distance(drone.position, drone.loiterCenter);
      targetHeading =
        bearingToCenter + 90 - Math.min(60, (distanceToCenter - LOITER_RADIUS_METERS) / 10);
    } else {
      targetHeading = bearingTo(drone.position, drone.waypoints[drone.waypointIndex]);
    }

    const turn = clamp(
      angleDifference(drone.heading, targetHeading),
      -MAX_TURN_DEGREES_PER_TICK,
      MAX_TURN_DEGREES_PER_TICK,
    );
    drone.heading = (drone.heading + turn + 360) % 360;
  }

  private move(drone: Drone): void {
    drone.position = offset(drone.position, drone.heading, drone.speed);
    drone.speed = clamp(drone.speed + this.rng.range(-0.5, 0.5), MIN_SPEED, MAX_SPEED);

    drone.trail.push(drone.position);
    if (drone.trail.length > this.options.trailLength) drone.trail.shift();
  }
}
