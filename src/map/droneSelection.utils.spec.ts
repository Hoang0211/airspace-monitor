import { describe, expect, it, vi } from "vitest";
import { applyDroneSelection, enableDroneSelection } from "./droneSelection.utils";
import { pilotLinkFilter } from "./layers";

function fakeClickMap(features: { properties: { droneId: string } }[]) {
  let onClick: ((event: { point: unknown }) => void) | undefined;
  const queryRenderedFeatures = vi.fn(() => features);
  const map = {
    on: (_type: string, handler: typeof onClick) => {
      onClick = handler;
    },
    off: () => {
      onClick = undefined;
    },
    queryRenderedFeatures,
  };

  return {
    map: map as never,
    queryRenderedFeatures,
    click: () => onClick?.({ point: { x: 1, y: 2 } }),
    isListening: () => onClick !== undefined,
  };
}

describe("enableDroneSelection", () => {
  it("reports the drone under the click, looking only at the drones layer", () => {
    const { map, queryRenderedFeatures, click } = fakeClickMap([
      { properties: { droneId: "UAV-007" } },
    ]);
    const onSelect = vi.fn();

    enableDroneSelection(map, onSelect);
    click();

    expect(onSelect).toHaveBeenCalledExactlyOnceWith("UAV-007");
    expect(queryRenderedFeatures).toHaveBeenCalledWith({ x: 1, y: 2 }, { layers: ["drones"] });
  });

  it("reports null for a click on empty map", () => {
    const { map, click } = fakeClickMap([]);
    const onSelect = vi.fn();

    enableDroneSelection(map, onSelect);
    click();

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("removes its listener when turned off", () => {
    const { map, isListening } = fakeClickMap([]);

    const disable = enableDroneSelection(map, vi.fn());
    expect(isListening()).toBe(true);

    disable();

    expect(isListening()).toBe(false);
  });
});

describe("applyDroneSelection", () => {
  const fakeSelectionMap = () => ({ setFeatureState: vi.fn(), setFilter: vi.fn() });

  it("marks the drone and its trail, and shows its pilot link", () => {
    const map = fakeSelectionMap();

    applyDroneSelection(map as never, null, "UAV-007");

    expect(map.setFeatureState.mock.calls).toEqual([
      [{ source: "drones", id: 7 }, { selected: true }],
      [{ source: "lines", id: 7 }, { selected: true }],
    ]);
    expect(map.setFilter).toHaveBeenCalledExactlyOnceWith(
      "pilot-links",
      pilotLinkFilter("UAV-007"),
    );
  });

  it("clears the previous drone when another is selected", () => {
    const map = fakeSelectionMap();

    applyDroneSelection(map as never, "UAV-007", "UAV-009");

    expect(map.setFeatureState.mock.calls).toEqual([
      [{ source: "drones", id: 7 }, { selected: false }],
      [{ source: "lines", id: 7 }, { selected: false }],
      [{ source: "drones", id: 9 }, { selected: true }],
      [{ source: "lines", id: 9 }, { selected: true }],
    ]);
  });

  it("clears everything when nothing is selected", () => {
    const map = fakeSelectionMap();

    applyDroneSelection(map as never, "UAV-007", null);

    expect(map.setFeatureState).toHaveBeenCalledTimes(2);
    expect(map.setFilter).toHaveBeenCalledExactlyOnceWith("pilot-links", pilotLinkFilter(null));
  });
});
