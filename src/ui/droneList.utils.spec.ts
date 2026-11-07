import { describe, expect, it } from "vitest";
import type { DroneStatus, DroneSummary } from "../detection/detection.types";
import { sortDrones } from "./droneList.utils";

function makeDrone(id: string, status: DroneStatus): DroneSummary {
  return {
    id,
    behavior: "transit",
    status,
    speed: 10,
    firstSeenAt: 0,
    distanceToPilot: 100,
    position: [24.97, 60.3],
    pilot: [24.98, 60.3],
  };
}

const DRONES = [
  makeDrone("UAV-004", "tracked"),
  makeDrone("UAV-003", "undetected"),
  makeDrone("UAV-002", "tracked"),
  makeDrone("UAV-001", "alert"),
];

const ids = (drones: DroneSummary[]) => drones.map(({ id }) => id);

describe("sortDrones", () => {
  it("puts alerts first and undetected drones last when sorting by status", () => {
    expect(ids(sortDrones(DRONES, "status"))).toEqual(["UAV-001", "UAV-002", "UAV-004", "UAV-003"]);
  });

  it("ignores status when sorting by ID", () => {
    expect(ids(sortDrones(DRONES, "id"))).toEqual(["UAV-001", "UAV-002", "UAV-003", "UAV-004"]);
  });

  it("orders IDs by number once they pass three digits", () => {
    const drones = [makeDrone("UAV-1000", "tracked"), makeDrone("UAV-999", "tracked")];

    expect(ids(sortDrones(drones, "id"))).toEqual(["UAV-999", "UAV-1000"]);
  });

  it("leaves the original list unchanged", () => {
    const original = [...DRONES];

    sortDrones(DRONES, "status");

    expect(DRONES).toEqual(original);
  });
});
