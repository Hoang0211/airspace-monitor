import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { distance } from "../data/geo.utils";
import { SENSORS } from "../data/sensors";
import { ZONES } from "../data/zones";
import { classifyDrone } from "../detection/classifyDrone.utils";
import type { Alert } from "../detection/detection.types";
import type { Playback } from "../state/store.types";
import { startLiveDroneData } from "./liveDroneData.utils";

const NORMAL: Playback = { playing: true, speed: 1 };
const PAUSED: Playback = { playing: false, speed: 1 };

function fakeMap() {
  const setData = { drones: vi.fn(), pilots: vi.fn(), lines: vi.fn() };
  const getSource = (id: keyof typeof setData) => ({ setData: setData[id] });

  return { map: { getSource } as never, setData };
}

describe("startLiveDroneData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fills every source straight away, with drones already flying", () => {
    const { map, setData } = fakeMap();

    const { stop } = startLiveDroneData(map, NORMAL, vi.fn());

    expect(setData.drones).toHaveBeenCalledOnce();
    expect(setData.pilots).toHaveBeenCalledOnce();
    expect(setData.lines).toHaveBeenCalledOnce();
    expect(setData.drones.mock.lastCall?.[0].features.length).toBeGreaterThan(0);

    stop();
  });

  it("updates every source once per second", () => {
    const { map, setData } = fakeMap();

    const { stop } = startLiveDroneData(map, NORMAL, vi.fn());
    vi.advanceTimersByTime(3000);

    expect(setData.drones).toHaveBeenCalledTimes(4);
    expect(setData.pilots).toHaveBeenCalledTimes(4);
    expect(setData.lines).toHaveBeenCalledTimes(4);

    stop();
  });

  it("moves the drones between updates", () => {
    const { map, setData } = fakeMap();

    const { stop } = startLiveDroneData(map, NORMAL, vi.fn());
    const before = setData.drones.mock.lastCall?.[0].features[0].geometry.coordinates;
    vi.advanceTimersByTime(1000);
    const after = setData.drones.mock.lastCall?.[0].features[0].geometry.coordinates;

    expect(after).not.toEqual(before);

    stop();
  });

  it("gives every drone the status that matches where it is", () => {
    const { map, setData } = fakeMap();

    const { stop } = startLiveDroneData(map, NORMAL, vi.fn());
    const seen = new Set<string>();

    for (let i = 0; i < 600; i++) {
      vi.advanceTimersByTime(1000);

      for (const { geometry, properties } of setData.drones.mock.lastCall?.[0].features ?? []) {
        const position = geometry.coordinates;

        expect(properties.status).toBe(classifyDrone({ position }, SENSORS, ZONES).status);
        seen.add(properties.status);
      }
    }

    expect(seen).toEqual(new Set(["undetected", "tracked", "alert"]));

    stop();
  });

  it.each([2, 5, 10] as const)("updates %i times per second at that speed", (speed) => {
    const { map, setData } = fakeMap();

    const { setPlayback, stop } = startLiveDroneData(map, NORMAL, vi.fn());
    setPlayback({ playing: true, speed });
    setData.drones.mockClear();
    vi.advanceTimersByTime(1000);

    expect(setData.drones).toHaveBeenCalledTimes(speed);

    stop();
  });

  it("still fills the sources when it starts paused, then waits", () => {
    const { map, setData } = fakeMap();

    const { stop } = startLiveDroneData(map, PAUSED, vi.fn());
    vi.advanceTimersByTime(5000);

    expect(setData.drones).toHaveBeenCalledOnce();

    stop();
  });

  it("stops updating while paused", () => {
    const { map, setData } = fakeMap();

    const { setPlayback, stop } = startLiveDroneData(map, NORMAL, vi.fn());
    setPlayback(PAUSED);
    vi.advanceTimersByTime(5000);

    expect(setData.drones).toHaveBeenCalledOnce();

    stop();
  });

  it("carries on from the same flights after a pause", () => {
    const { map, setData } = fakeMap();

    const { setPlayback, stop } = startLiveDroneData(map, NORMAL, vi.fn());
    vi.advanceTimersByTime(1000);
    const [firstDrone] = setData.drones.mock.lastCall?.[0].features ?? [];

    setPlayback(PAUSED);
    vi.advanceTimersByTime(5000);
    setPlayback(NORMAL);
    vi.advanceTimersByTime(1000);
    const [sameDrone] = setData.drones.mock.lastCall?.[0].features ?? [];

    expect(setData.drones).toHaveBeenCalledTimes(3);
    expect(sameDrone.id).toBe(firstDrone.id);
    expect(sameDrone.geometry.coordinates).not.toEqual(firstDrone.geometry.coordinates);

    stop();
  });

  it("keeps a single timer when the playback changes repeatedly", () => {
    const { map, setData } = fakeMap();

    const { setPlayback, stop } = startLiveDroneData(map, NORMAL, vi.fn());
    setPlayback({ playing: true, speed: 2 });
    setPlayback({ playing: true, speed: 5 });
    setPlayback(NORMAL);
    setData.drones.mockClear();
    vi.advanceTimersByTime(1000);

    expect(setData.drones).toHaveBeenCalledOnce();

    stop();
  });

  describe("alerts", () => {
    /** Runs for a while, and counts each time a drone's status turns to alert on the map. */
    function runAndCountEntries(setData: ReturnType<typeof fakeMap>["setData"], ticks: number) {
      let entries = 0;
      let alerting = new Set<number>();

      for (let i = 0; i <= ticks; i++) {
        if (i > 0) vi.advanceTimersByTime(1000);

        const features = setData.drones.mock.lastCall?.[0].features ?? [];
        const now = new Set<number>(
          features
            .filter((feature: { properties: { status: string } }) => {
              return feature.properties.status === "alert";
            })
            .map((feature: { id: number }) => feature.id),
        );
        for (const id of now) if (!alerting.has(id)) entries++;
        alerting = now;
      }

      return entries;
    }

    const alertsFrom = (onTick: ReturnType<typeof vi.fn>): Alert[] =>
      onTick.mock.calls.flatMap(([, alerts]) => alerts);

    it("raises exactly one alert each time a drone enters a zone, and none in between", () => {
      const { map, setData } = fakeMap();
      const onTick = vi.fn();

      const { stop } = startLiveDroneData(map, NORMAL, onTick);
      const entries = runAndCountEntries(setData, 1800);

      expect(entries).toBeGreaterThan(0);
      expect(alertsFrom(onTick)).toHaveLength(entries);

      stop();
    });

    it("gives each alert the site time it happened at", () => {
      const { map } = fakeMap();
      const onTick = vi.fn();

      const { stop } = startLiveDroneData(map, NORMAL, onTick);
      vi.advanceTimersByTime(600_000);

      for (const [siteTime, alerts] of onTick.mock.calls) {
        for (const alert of alerts) expect(alert.time).toBe(siteTime);
      }
      expect(alertsFrom(onTick).length).toBeGreaterThan(0);

      stop();
    });
  });

  describe("drone summaries", () => {
    it("reports every drone on each tick, with the status shown on the map", () => {
      const { map, setData } = fakeMap();
      const onTick = vi.fn();

      const { stop } = startLiveDroneData(map, NORMAL, onTick);
      vi.advanceTimersByTime(60_000);

      const summaries = onTick.mock.lastCall?.[2];
      const features = setData.drones.mock.lastCall?.[0].features;

      expect(summaries.map(({ id }: { id: string }) => id)).toEqual(
        features.map((feature: { properties: { droneId: string } }) => feature.properties.droneId),
      );
      expect(summaries.map(({ status }: { status: string }) => status)).toEqual(
        features.map((feature: { properties: { status: string } }) => feature.properties.status),
      );

      stop();
    });

    it("gives each drone its distance to its pilot", () => {
      const { map } = fakeMap();
      const onTick = vi.fn();

      const { stop } = startLiveDroneData(map, NORMAL, onTick);
      const summaries = onTick.mock.lastCall?.[2];

      expect(summaries.length).toBeGreaterThan(0);
      for (const { position, pilot, distanceToPilot } of summaries) {
        expect(distanceToPilot).toBe(distance(position, pilot));
      }

      stop();
    });

    it("keeps each drone's first seen time, and only sets it once detected", () => {
      const { map } = fakeMap();
      const onTick = vi.fn();
      const firstSeen = new Map<string, number>();

      const { stop } = startLiveDroneData(map, NORMAL, onTick);
      vi.advanceTimersByTime(600_000);

      for (const [, , summaries] of onTick.mock.calls) {
        for (const { id, status, firstSeenAt } of summaries) {
          if (status !== "undetected") expect(firstSeenAt).not.toBeNull();
          if (firstSeenAt === null) continue;

          expect(firstSeenAt).toBe(firstSeen.get(id) ?? firstSeenAt);
          firstSeen.set(id, firstSeenAt);
        }
      }
      expect(firstSeen.size).toBeGreaterThan(0);

      stop();
    });
  });

  describe("site time", () => {
    it("starts at zero when the app opens, and adds one on every tick", () => {
      const { map } = fakeMap();
      const onTick = vi.fn();

      const { stop } = startLiveDroneData(map, NORMAL, onTick);
      vi.advanceTimersByTime(3000);

      expect(onTick.mock.calls.map(([siteTime]) => siteTime)).toEqual([0, 1, 2, 3]);

      stop();
    });

    it("runs faster at a higher speed", () => {
      const { map } = fakeMap();
      const onTick = vi.fn();

      const { stop } = startLiveDroneData(map, { playing: true, speed: 5 }, onTick);
      vi.advanceTimersByTime(1000);

      expect(onTick.mock.lastCall?.[0]).toBe(5);

      stop();
    });

    it("stops while paused", () => {
      const { map } = fakeMap();
      const onTick = vi.fn();

      const { setPlayback, stop } = startLiveDroneData(map, NORMAL, onTick);
      setPlayback(PAUSED);
      onTick.mockClear();
      vi.advanceTimersByTime(600_000);

      expect(onTick).not.toHaveBeenCalled();

      stop();
    });
  });

  it("stops updating once stopped", () => {
    const { map, setData } = fakeMap();

    const { stop } = startLiveDroneData(map, NORMAL, vi.fn());
    stop();
    vi.advanceTimersByTime(5000);

    expect(setData.drones).toHaveBeenCalledOnce();
  });
});
