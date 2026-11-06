import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

    const { stop } = startLiveDroneData(map, NORMAL);

    expect(setData.drones).toHaveBeenCalledOnce();
    expect(setData.pilots).toHaveBeenCalledOnce();
    expect(setData.lines).toHaveBeenCalledOnce();
    expect(setData.drones.mock.lastCall?.[0].features.length).toBeGreaterThan(0);

    stop();
  });

  it("updates every source once per second", () => {
    const { map, setData } = fakeMap();

    const { stop } = startLiveDroneData(map, NORMAL);
    vi.advanceTimersByTime(3000);

    expect(setData.drones).toHaveBeenCalledTimes(4);
    expect(setData.pilots).toHaveBeenCalledTimes(4);
    expect(setData.lines).toHaveBeenCalledTimes(4);

    stop();
  });

  it("moves the drones between updates", () => {
    const { map, setData } = fakeMap();

    const { stop } = startLiveDroneData(map, NORMAL);
    const before = setData.drones.mock.lastCall?.[0].features[0].geometry.coordinates;
    vi.advanceTimersByTime(1000);
    const after = setData.drones.mock.lastCall?.[0].features[0].geometry.coordinates;

    expect(after).not.toEqual(before);

    stop();
  });

  it.each([2, 5] as const)("updates %i times per second at that speed", (speed) => {
    const { map, setData } = fakeMap();

    const { setPlayback, stop } = startLiveDroneData(map, NORMAL);
    setPlayback({ playing: true, speed });
    setData.drones.mockClear();
    vi.advanceTimersByTime(1000);

    expect(setData.drones).toHaveBeenCalledTimes(speed);

    stop();
  });

  it("still fills the sources when it starts paused, then waits", () => {
    const { map, setData } = fakeMap();

    const { stop } = startLiveDroneData(map, PAUSED);
    vi.advanceTimersByTime(5000);

    expect(setData.drones).toHaveBeenCalledOnce();

    stop();
  });

  it("stops updating while paused", () => {
    const { map, setData } = fakeMap();

    const { setPlayback, stop } = startLiveDroneData(map, NORMAL);
    setPlayback(PAUSED);
    vi.advanceTimersByTime(5000);

    expect(setData.drones).toHaveBeenCalledOnce();

    stop();
  });

  it("carries on from the same flights after a pause", () => {
    const { map, setData } = fakeMap();

    const { setPlayback, stop } = startLiveDroneData(map, NORMAL);
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

    const { setPlayback, stop } = startLiveDroneData(map, NORMAL);
    setPlayback({ playing: true, speed: 2 });
    setPlayback({ playing: true, speed: 5 });
    setPlayback(NORMAL);
    setData.drones.mockClear();
    vi.advanceTimersByTime(1000);

    expect(setData.drones).toHaveBeenCalledOnce();

    stop();
  });

  it("stops updating once stopped", () => {
    const { map, setData } = fakeMap();

    const { stop } = startLiveDroneData(map, NORMAL);
    stop();
    vi.advanceTimersByTime(5000);

    expect(setData.drones).toHaveBeenCalledOnce();
  });
});
