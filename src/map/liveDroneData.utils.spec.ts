import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startLiveDroneData } from "./liveDroneData.utils";

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

    const stop = startLiveDroneData(map);

    expect(setData.drones).toHaveBeenCalledOnce();
    expect(setData.pilots).toHaveBeenCalledOnce();
    expect(setData.lines).toHaveBeenCalledOnce();
    expect(setData.drones.mock.lastCall?.[0].features.length).toBeGreaterThan(0);

    stop();
  });

  it("updates every source once per second", () => {
    const { map, setData } = fakeMap();

    const stop = startLiveDroneData(map);
    vi.advanceTimersByTime(3000);

    expect(setData.drones).toHaveBeenCalledTimes(4);
    expect(setData.pilots).toHaveBeenCalledTimes(4);
    expect(setData.lines).toHaveBeenCalledTimes(4);

    stop();
  });

  it("moves the drones between updates", () => {
    const { map, setData } = fakeMap();

    const stop = startLiveDroneData(map);
    const before = setData.drones.mock.lastCall?.[0].features[0].geometry.coordinates;
    vi.advanceTimersByTime(1000);
    const after = setData.drones.mock.lastCall?.[0].features[0].geometry.coordinates;

    expect(after).not.toEqual(before);

    stop();
  });

  it("stops updating once stopped", () => {
    const { map, setData } = fakeMap();

    const stop = startLiveDroneData(map);
    stop();
    vi.advanceTimersByTime(5000);

    expect(setData.drones).toHaveBeenCalledOnce();
  });
});
