import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import { describe, expect, it } from "vitest";
import type { LngLat } from "../data/geo.types";
import { bearingTo, distance, offset } from "../data/geo.utils";
import { ZONES } from "../data/zones";
import type { Zone } from "../data/zones.types";
import { DroneSimulator } from "./droneSimulator";
import type { Behavior, Drone } from "./droneSimulator.types";
import { angleDifference } from "./droneSimulator.utils";

const CENTER: LngLat = [24.97, 60.3];
const RADIUS = 8000;
const ARRIVAL_METERS = 80;
// Longer than any flight, so a test that never gets what it waits for still ends.
const MAX_FLIGHT_TICKS = 10_000;

function forEachDrone(
  simulator: DroneSimulator,
  ticks: number,
  visit: (drone: Drone) => void,
): void {
  for (let i = 0; i < ticks; i++) {
    simulator.tick().forEach(visit);
  }
}

/** Visits each drone once, on the first tick it is seen. It has had one tick of flight by then. */
function forEachNewDrone(
  simulator: DroneSimulator,
  ticks: number,
  visit: (drone: Drone) => void,
): number {
  const seen = new Set<string>();

  forEachDrone(simulator, ticks, (drone) => {
    if (seen.has(drone.id)) return;
    seen.add(drone.id);
    visit(drone);
  });

  return seen.size;
}

function newSimulator(seed = 1, maxDrones = 12): DroneSimulator {
  return new DroneSimulator({
    center: CENTER,
    radiusMeters: RADIUS,
    seed,
    maxDrones,
    warmStartTicks: 0,
  });
}

/** Runs a new simulator until a drone with this behavior takes off, so a test can follow it. */
function startFlight(behavior: Behavior): { simulator: DroneSimulator; drone: Drone } {
  const simulator = newSimulator();

  for (let i = 0; i < MAX_FLIGHT_TICKS; i++) {
    const drone = simulator.tick().find((candidate) => candidate.behavior === behavior);
    if (drone) return { simulator, drone };
  }

  throw new Error(`No ${behavior} drone took off`);
}

function tickUntil(simulator: DroneSimulator, isDone: () => boolean): void {
  for (let i = 0; i < MAX_FLIGHT_TICKS && !isDone(); i++) simulator.tick();
}

function isFlying(simulator: DroneSimulator, drone: Drone): boolean {
  return simulator.getDrones().some(({ id }) => id === drone.id);
}

/** Runs the simulator and reports each drone once, as it stood when it was removed. */
function collectFinishedDrones(simulator: DroneSimulator, ticks: number): Drone[] {
  const flying = new Map<string, Drone>();
  const finished: Drone[] = [];

  for (let i = 0; i < ticks; i++) {
    const current = new Set(simulator.tick().map((drone) => drone.id));
    for (const drone of simulator.getDrones()) flying.set(drone.id, drone);

    for (const [id, drone] of flying) {
      if (current.has(id)) continue;
      finished.push(drone);
      flying.delete(id);
    }
  }

  return finished;
}

describe("DroneSimulator", () => {
  describe("seeding", () => {
    it("produces identical flights from the same seed", () => {
      const first = new DroneSimulator({ seed: 7 });
      const second = new DroneSimulator({ seed: 7 });

      for (let i = 0; i < 1000; i++) {
        first.tick();
        second.tick();
      }

      expect(first.getDrones()).toEqual(second.getDrones());
    });

    it("produces different flights from a different seed", () => {
      expect(new DroneSimulator({ seed: 7 }).getDrones()).not.toEqual(
        new DroneSimulator({ seed: 8 }).getDrones(),
      );
    });
  });

  describe("start", () => {
    it("already has drones when created, whatever the seed", () => {
      for (let seed = 1; seed <= 50; seed++) {
        expect(new DroneSimulator({ seed }).getDrones().length).toBeGreaterThan(0);
      }
    });

    it("counts the warm start in the simulation time", () => {
      expect(new DroneSimulator({ warmStartTicks: 50 }).simTime).toBe(50);
    });

    it("starts empty without a warm start", () => {
      expect(newSimulator().getDrones()).toEqual([]);
    });
  });

  describe("spawning", () => {
    it("adds one drone every interval", () => {
      const simulator = new DroneSimulator({ spawnIntervalTicks: 3, warmStartTicks: 0 });
      const counts = Array.from({ length: 9 }, () => simulator.tick().length);

      expect(counts).toEqual([0, 0, 1, 1, 1, 2, 2, 2, 3]);
    });

    it("fills up to maxDrones and never goes over", () => {
      const simulator = new DroneSimulator({
        maxDrones: 3,
        spawnIntervalTicks: 1,
        warmStartTicks: 0,
      });
      let peak = 0;

      for (let i = 0; i < 2000; i++) {
        peak = Math.max(peak, simulator.tick().length);
      }

      expect(peak).toBe(3);
    });

    it("replaces a finished drone within one interval", () => {
      const simulator = new DroneSimulator({
        maxDrones: 3,
        spawnIntervalTicks: 3,
        warmStartTicks: 30,
      });
      let ticksBelowMaximum = 0;
      let longestGap = 0;

      for (let i = 0; i < 3600; i++) {
        ticksBelowMaximum = simulator.tick().length < 3 ? ticksBelowMaximum + 1 : 0;
        longestGap = Math.max(longestGap, ticksBelowMaximum);
      }

      // Two drones can finish close together, and they are replaced one at a time.
      expect(longestGap).toBeGreaterThan(0);
      expect(longestGap).toBeLessThanOrEqual(9);
    });

    it("handles 50 drones", () => {
      const simulator = new DroneSimulator({
        maxDrones: 50,
        spawnIntervalTicks: 1,
        warmStartTicks: 100,
      });

      expect(simulator.getDrones()).toHaveLength(50);
    });

    it("never reuses a drone ID", () => {
      const firstObjectForId = new Map<string, Drone>();

      forEachDrone(newSimulator(), 3600, (drone) => {
        expect(firstObjectForId.get(drone.id) ?? drone).toBe(drone);
        firstObjectForId.set(drone.id, drone);
      });
    });
  });

  describe("takeoff", () => {
    it("starts every drone at its pilot", () => {
      const count = forEachNewDrone(newSimulator(), 1800, (drone) => {
        expect(distance(drone.position, drone.pilot)).toBeLessThanOrEqual(drone.speed + 1);
      });

      expect(count).toBeGreaterThan(0);
    });

    it("points patrol and transit drones at their first waypoint", () => {
      let checked = 0;

      forEachNewDrone(newSimulator(), 1800, (drone) => {
        if (drone.behavior === "loiter") return;
        expect(drone.heading).toBeCloseTo(bearingTo(drone.pilot, drone.waypoints[0]), 1);
        checked++;
      });

      expect(checked).toBeGreaterThan(0);
    });

    it("gives only a loitering drone a circle to fly around", () => {
      forEachNewDrone(newSimulator(), 1800, (drone) => {
        expect(drone.loiterCenter).toEqual(
          drone.behavior === "loiter" ? drone.waypoints[0] : undefined,
        );
      });
    });

    it("keeps pilots out of the real zones, across many seeds", () => {
      for (let seed = 1; seed <= 30; seed++) {
        forEachDrone(newSimulator(seed), 600, (drone) => {
          for (const zone of ZONES) {
            expect(booleanPointInPolygon(drone.pilot, zone.polygon)).toBe(false);
          }
        });
      }
    });

    it("keeps pilots out of any zones it is given", () => {
      const west = offset(CENTER, 270, 2000)[0];
      const east = offset(CENTER, 90, 2000)[0];
      const south = offset(CENTER, 180, 2000)[1];
      const north = offset(CENTER, 0, 2000)[1];
      const zone: Zone = {
        id: "test-zone",
        name: "Test zone",
        kind: "protected-site",
        polygon: {
          type: "Polygon",
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
        },
      };
      const simulator = new DroneSimulator({ noTakeoffZones: [zone], warmStartTicks: 0 });

      forEachDrone(simulator, 1800, (drone) => {
        expect(booleanPointInPolygon(drone.pilot, zone.polygon)).toBe(false);
      });
    });

    it("keeps pilots inside the area", () => {
      forEachDrone(newSimulator(), 1800, (drone) => {
        expect(distance(drone.pilot, CENTER)).toBeLessThanOrEqual(RADIUS);
      });
    });
  });

  describe("flight limits", () => {
    it("turns at most 30 degrees per tick", () => {
      const headings = new Map<string, number>();

      forEachDrone(newSimulator(), 3600, (drone) => {
        const previous = headings.get(drone.id);
        if (previous !== undefined) {
          const turn = Math.abs(angleDifference(previous, drone.heading));
          expect(turn).toBeLessThanOrEqual(30.000001);
        }
        headings.set(drone.id, drone.heading);
      });
    });

    it("keeps speed within limits over a long flight", () => {
      forEachDrone(newSimulator(), 7200, (drone) => {
        expect(drone.speed).toBeGreaterThanOrEqual(6);
        expect(drone.speed).toBeLessThanOrEqual(22);
      });
    });
  });

  describe("patrol flights", () => {
    it("keeps patrol waypoints 1 to 2 km from the first one", () => {
      let checked = 0;

      forEachNewDrone(newSimulator(), 1800, (drone) => {
        if (drone.behavior !== "patrol") return;
        const [first, ...others] = drone.waypoints;

        expect(others).toHaveLength(2);
        for (const waypoint of others) {
          expect(distance(first, waypoint)).toBeGreaterThanOrEqual(999);
          expect(distance(first, waypoint)).toBeLessThanOrEqual(2001);
        }
        checked++;
      });

      expect(checked).toBeGreaterThan(0);
    });

    it("plans 3 full loops, which is 10 waypoint arrivals", () => {
      let checked = 0;

      forEachDrone(newSimulator(), 60, (drone) => {
        if (drone.behavior !== "patrol") return;
        expect(drone.missionRemaining).toBe(10);
        checked++;
      });

      expect(checked).toBeGreaterThan(0);
    });

    it("counts one arrival per waypoint, and moves on to the next", () => {
      const { simulator, drone } = startFlight("patrol");

      tickUntil(simulator, () => drone.waypointIndex !== 0);

      expect(drone.waypointIndex).toBe(1);
      expect(drone.missionRemaining).toBe(9);
    });

    it("returns to its first waypoint to complete a loop", () => {
      const { simulator, drone } = startFlight("patrol");
      const indexes: number[] = [];

      for (let i = 0; i < MAX_FLIGHT_TICKS && drone.missionRemaining !== null; i++) {
        simulator.tick();
        if (indexes.at(-1) !== drone.waypointIndex) indexes.push(drone.waypointIndex);
      }

      // Index 0 appears again whenever the drone is flying back to the first waypoint.
      expect(indexes.slice(0, 7)).toEqual([0, 1, 2, 0, 1, 2, 0]);
    });

    it("flies back to its pilot and is removed after its last arrival", () => {
      const { simulator, drone } = startFlight("patrol");

      tickUntil(simulator, () => drone.missionRemaining === null);

      expect(drone.missionRemaining).toBeNull();
      expect(drone.waypoints).toEqual([drone.pilot]);

      tickUntil(simulator, () => !isFlying(simulator, drone));

      expect(isFlying(simulator, drone)).toBe(false);
      expect(distance(drone.position, drone.pilot)).toBeLessThan(ARRIVAL_METERS);
    });
  });

  describe("loiter flights", () => {
    /** Follows a loitering drone until its countdown has started. */
    function startCircling(): {
      simulator: DroneSimulator;
      drone: Drone;
      center: LngLat;
      startingCountdown: number;
    } {
      const { simulator, drone } = startFlight("loiter");
      const center = drone.waypoints[0];
      const startingCountdown = drone.missionRemaining as number;

      tickUntil(simulator, () => drone.missionRemaining !== startingCountdown);

      return { simulator, drone, center, startingCountdown };
    }

    it("does not count down until it reaches the circle", () => {
      const { simulator, drone } = startFlight("loiter");
      const center = drone.waypoints[0];
      const startingCountdown = drone.missionRemaining;

      expect(distance(drone.position, center)).toBeGreaterThan(500);

      for (let i = 0; i < MAX_FLIGHT_TICKS && distance(drone.position, center) > 500; i++) {
        simulator.tick();
        expect(drone.missionRemaining).toBe(startingCountdown);
      }

      expect(distance(drone.position, center)).toBeLessThanOrEqual(500);
    });

    it("counts down once at the circle, one per tick", () => {
      const { simulator, drone, startingCountdown } = startCircling();
      const before = drone.missionRemaining as number;

      simulator.tick();

      expect(before).toBeLessThan(startingCountdown);
      expect(drone.missionRemaining).toBe(before - 1);
    });

    it("stays close to the circle while it counts down", () => {
      const { simulator, drone, center } = startCircling();

      for (let i = 0; i < MAX_FLIGHT_TICKS && drone.missionRemaining !== null; i++) {
        simulator.tick();
        expect(distance(drone.position, center)).toBeLessThan(600);
      }

      expect(drone.missionRemaining).toBeNull();
    });

    it("flies back to its pilot and is removed when the time is up", () => {
      const { simulator, drone } = startFlight("loiter");

      tickUntil(simulator, () => drone.missionRemaining === null);

      expect(drone.loiterCenter).toBeUndefined();
      expect(drone.waypoints).toEqual([drone.pilot]);

      tickUntil(simulator, () => !isFlying(simulator, drone));

      expect(isFlying(simulator, drone)).toBe(false);
      expect(distance(drone.position, drone.pilot)).toBeLessThan(ARRIVAL_METERS);
    });
  });

  describe("transit flights", () => {
    it("picks destinations 4 to 8 km from the pilot, inside the area and outside the zones", () => {
      let checked = 0;

      for (let seed = 1; seed <= 30; seed++) {
        forEachDrone(newSimulator(seed), 600, (drone) => {
          if (drone.behavior !== "transit") return;
          const [destination] = drone.waypoints;
          const tripLength = distance(drone.pilot, destination);

          expect(tripLength).toBeGreaterThanOrEqual(3999);
          expect(tripLength).toBeLessThanOrEqual(8001);
          expect(distance(destination, CENTER)).toBeLessThanOrEqual(RADIUS);
          for (const zone of ZONES) {
            expect(booleanPointInPolygon(destination, zone.polygon)).toBe(false);
          }
          checked++;
        });
      }

      expect(checked).toBeGreaterThan(0);
    });

    it("is on its final leg from the start", () => {
      forEachDrone(newSimulator(), 1800, (drone) => {
        if (drone.behavior === "transit") expect(drone.missionRemaining).toBeNull();
      });
    });

    it("removes the drone when it reaches its destination", () => {
      const { simulator, drone } = startFlight("transit");
      const [destination] = drone.waypoints;

      tickUntil(simulator, () => !isFlying(simulator, drone));

      expect(isFlying(simulator, drone)).toBe(false);
      expect(distance(drone.position, destination)).toBeLessThan(ARRIVAL_METERS);
    });
  });

  describe("finishing flights", () => {
    it("removes drones of every behavior, each at the end of its final leg", () => {
      const finished = collectFinishedDrones(newSimulator(), 7200);

      for (const drone of finished) {
        expect(drone.missionRemaining).toBeNull();
        expect(distance(drone.position, drone.waypoints[0])).toBeLessThan(ARRIVAL_METERS);
      }

      const behaviors = new Set(finished.map((drone) => drone.behavior));
      expect(behaviors).toEqual(new Set(["patrol", "loiter", "transit"]));
    });

    it("keeps replacing drones during a long run", () => {
      const simulator = newSimulator();
      const idsBefore = new Set<string>();
      const idsInLastTenMinutes = new Set<string>();

      forEachDrone(simulator, 6600, (drone) => idsBefore.add(drone.id));
      forEachDrone(simulator, 600, (drone) => idsInLastTenMinutes.add(drone.id));

      const newIds = [...idsInLastTenMinutes].filter((id) => !idsBefore.has(id));
      expect(newIds.length).toBeGreaterThan(0);
    });
  });

  describe("trail", () => {
    it("caps the trail length", () => {
      const simulator = new DroneSimulator({ trailLength: 5, warmStartTicks: 0 });
      let longest = 0;

      forEachDrone(simulator, 500, (drone) => {
        longest = Math.max(longest, drone.trail.length);
      });

      expect(longest).toBe(5);
    });

    it("ends the trail at the drone's current position", () => {
      forEachDrone(newSimulator(), 200, (drone) => {
        expect(drone.trail.at(-1)).toEqual(drone.position);
      });
    });
  });
});
