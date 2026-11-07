import { beforeEach, describe, expect, it } from "vitest";
import type { Alert, DroneSummary } from "../detection/detection.types";
import { useAppStore } from "./store";

const ALERT: Alert = { id: "alert-1", droneId: "UAV-001", zoneName: "Zone", time: 5 };
const DRONE: DroneSummary = {
  id: "UAV-001",
  behavior: "transit",
  status: "tracked",
  speed: 10,
  firstSeenAt: 0,
  distanceToPilot: 100,
  position: [24.97, 60.3],
  pilot: [24.98, 60.3],
};

describe("recordTick", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  it("updates the site time and drones, and adds new alerts", () => {
    useAppStore.getState().recordTick(5, [ALERT], [DRONE]);

    expect(useAppStore.getState().siteTime).toBe(5);
    expect(useAppStore.getState().alerts).toEqual([ALERT]);
    expect(useAppStore.getState().drones).toEqual([DRONE]);
  });

  it("keeps the same alert list on a tick with no new alerts", () => {
    useAppStore.getState().recordTick(5, [ALERT], []);
    const { alerts } = useAppStore.getState();

    useAppStore.getState().recordTick(6, [], []);

    expect(useAppStore.getState().siteTime).toBe(6);
    expect(useAppStore.getState().alerts).toBe(alerts);
  });
});
