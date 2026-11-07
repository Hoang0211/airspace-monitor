import { describe, expect, it } from "vitest";
import type { FirstSeenByDrone } from "./detection.types";
import { updateFirstSeen } from "./firstSeen.utils";

const NONE_SEEN: FirstSeenByDrone = new Map();

describe("updateFirstSeen", () => {
  it("records the time a drone is first detected", () => {
    const firstSeen = updateFirstSeen(NONE_SEEN, [{ id: "UAV-001", status: "tracked" }], 12);

    expect(firstSeen.get("UAV-001")).toBe(12);
  });

  it("does not record a drone no sensor has detected", () => {
    const firstSeen = updateFirstSeen(NONE_SEEN, [{ id: "UAV-001", status: "undetected" }], 12);

    expect(firstSeen.has("UAV-001")).toBe(false);
  });

  it("keeps the first time, whatever the drone does afterward", () => {
    let firstSeen = updateFirstSeen(NONE_SEEN, [{ id: "UAV-001", status: "tracked" }], 12);
    firstSeen = updateFirstSeen(firstSeen, [{ id: "UAV-001", status: "alert" }], 13);
    firstSeen = updateFirstSeen(firstSeen, [{ id: "UAV-001", status: "undetected" }], 14);
    firstSeen = updateFirstSeen(firstSeen, [{ id: "UAV-001", status: "tracked" }], 15);

    expect(firstSeen.get("UAV-001")).toBe(12);
  });

  it("forgets a drone that has been removed", () => {
    const firstSeen = updateFirstSeen(NONE_SEEN, [{ id: "UAV-001", status: "tracked" }], 12);

    expect(updateFirstSeen(firstSeen, [], 13).size).toBe(0);
  });
});
