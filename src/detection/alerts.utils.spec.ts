import { describe, expect, it } from "vitest";
import type { Zone } from "../data/zones.types";
import { addAlerts, detectZoneEntries } from "./alerts.utils";
import type { Alert, ZonesByDrone } from "./detection.types";

function makeZone(id: string): Zone {
  return {
    id,
    name: `${id} name`,
    kind: "airport",
    polygon: { type: "Polygon", coordinates: [] },
  };
}

function makeAlert(id: string): Alert {
  return { id, droneId: "UAV-001", zoneName: "Zone", time: 0 };
}

const AIRPORT = makeZone("airport");
const TIKKURILA = makeZone("tikkurila");
const NOWHERE: ZonesByDrone = new Map();

/** Runs one drone through a zone on each tick, and collects the alert times. */
function alertTimes(zones: (Zone | null)[]): number[] {
  const times: number[] = [];
  let previous = NOWHERE;

  zones.forEach((zone, time) => {
    const { alerts, zonesByDrone } = detectZoneEntries(previous, [{ id: "UAV-001", zone }], time);
    times.push(...alerts.map((alert) => alert.time));
    previous = zonesByDrone;
  });

  return times;
}

describe("detectZoneEntries", () => {
  it("raises an alert with the drone, zone and time when a drone enters a zone", () => {
    const { alerts } = detectZoneEntries(NOWHERE, [{ id: "UAV-007", zone: AIRPORT }], 1234);

    expect(alerts).toEqual([
      {
        id: "UAV-007-airport-1234",
        droneId: "UAV-007",
        zoneName: "airport name",
        time: 1234,
      },
    ]);
  });

  it("raises no alert for a drone outside every zone", () => {
    expect(alertTimes([null, null, null])).toEqual([]);
  });

  it("raises one alert on entry, and none while the drone stays inside", () => {
    expect(alertTimes([null, AIRPORT, AIRPORT, AIRPORT, AIRPORT])).toEqual([1]);
  });

  it("raises no new alert when the drone leaves", () => {
    expect(alertTimes([AIRPORT, null, null])).toEqual([0]);
  });

  it("raises another alert when the drone enters again", () => {
    expect(alertTimes([AIRPORT, AIRPORT, null, null, AIRPORT, AIRPORT])).toEqual([0, 4]);
  });

  it("raises another alert when the drone moves straight into a different zone", () => {
    expect(alertTimes([AIRPORT, AIRPORT, TIKKURILA, TIKKURILA])).toEqual([0, 2]);
  });

  it("tracks each drone separately", () => {
    const first = detectZoneEntries(NOWHERE, [{ id: "UAV-001", zone: AIRPORT }], 1);
    const second = detectZoneEntries(
      first.zonesByDrone,
      [
        { id: "UAV-001", zone: AIRPORT },
        { id: "UAV-002", zone: AIRPORT },
      ],
      2,
    );

    expect(second.alerts.map((alert) => alert.droneId)).toEqual(["UAV-002"]);
  });

  it("only remembers drones that are in a zone now", () => {
    const first = detectZoneEntries(
      NOWHERE,
      [
        { id: "UAV-001", zone: AIRPORT },
        { id: "UAV-002", zone: AIRPORT },
      ],
      1,
    );
    const second = detectZoneEntries(
      first.zonesByDrone,
      [
        { id: "UAV-001", zone: null },
        { id: "UAV-003", zone: TIKKURILA },
      ],
      2,
    );

    expect([...second.zonesByDrone]).toEqual([["UAV-003", "tikkurila"]]);
  });

  it("leaves the previous tick's zones unchanged", () => {
    const previous = new Map([["UAV-001", "airport"]]);

    detectZoneEntries(previous, [{ id: "UAV-001", zone: null }], 1);

    expect([...previous]).toEqual([["UAV-001", "airport"]]);
  });
});

describe("addAlerts", () => {
  it("puts new alerts above the existing ones", () => {
    const list = addAlerts([makeAlert("old")], [makeAlert("new")]);

    expect(list.map((alert) => alert.id)).toEqual(["new", "old"]);
  });

  it("drops the oldest alerts beyond 20", () => {
    const full = Array.from({ length: 20 }, (_, index) => makeAlert(`old-${index}`));

    const list = addAlerts(full, [makeAlert("new")]);

    expect(list).toHaveLength(20);
    expect(list[0].id).toBe("new");
    expect(list.at(-1)?.id).toBe("old-18");
  });

  it("leaves the existing list unchanged", () => {
    const existing = [makeAlert("old")];

    addAlerts(existing, [makeAlert("new")]);

    expect(existing).toHaveLength(1);
  });
});
