import { beforeEach, describe, expect, it } from "vitest";
import type { Alert } from "../detection/detection.types";
import { useAppStore } from "./store";

const ALERT: Alert = { id: "alert-1", droneId: "UAV-001", zoneName: "Zone", time: 5 };

describe("recordTick", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  it("updates the site time and adds new alerts", () => {
    useAppStore.getState().recordTick(5, [ALERT]);

    expect(useAppStore.getState().siteTime).toBe(5);
    expect(useAppStore.getState().alerts).toEqual([ALERT]);
  });

  it("keeps the same alert list on a tick with no new alerts", () => {
    useAppStore.getState().recordTick(5, [ALERT]);
    const { alerts } = useAppStore.getState();

    useAppStore.getState().recordTick(6, []);

    expect(useAppStore.getState().siteTime).toBe(6);
    expect(useAppStore.getState().alerts).toBe(alerts);
  });
});
