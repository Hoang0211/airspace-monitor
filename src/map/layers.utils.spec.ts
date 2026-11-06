import { describe, expect, it, vi } from "vitest";
import { MAP_LAYERS, MAP_SOURCES } from "./layers";
import { addMapLayers, applyLayerVisibility } from "./layers.utils";

describe("addMapLayers", () => {
  it("adds every source before the layers that use it", () => {
    const calls: string[] = [];
    addMapLayers({
      addSource: vi.fn((id: string) => calls.push(`source:${id}`)),
      addLayer: vi.fn((layer: { id: string }) => calls.push(`layer:${layer.id}`)),
    } as never);

    const sourceCount = Object.keys(MAP_SOURCES).length;

    expect(calls.slice(0, sourceCount).every((call) => call.startsWith("source:"))).toBe(true);
    expect(calls.slice(sourceCount)).toEqual(MAP_LAYERS.map((layer) => `layer:${layer.id}`));
  });
});

describe("applyLayerVisibility", () => {
  it("hides every map layer belonging to a switched-off toggle, and only those", () => {
    const setLayoutProperty = vi.fn();

    applyLayerVisibility({ setLayoutProperty } as never, {
      sensors: true,
      coverage: false,
      zones: true,
      trails: true,
      pilots: false,
    });

    expect(setLayoutProperty).toHaveBeenCalledWith("coverage-fill", "visibility", "none");
    expect(setLayoutProperty).toHaveBeenCalledWith("coverage-outline", "visibility", "none");
    expect(setLayoutProperty).toHaveBeenCalledWith("pilots", "visibility", "none");
    expect(setLayoutProperty).toHaveBeenCalledWith("pilot-links", "visibility", "none");
    expect(setLayoutProperty).toHaveBeenCalledWith("sensors", "visibility", "visible");
    expect(setLayoutProperty).toHaveBeenCalledWith("zones-fill", "visibility", "visible");
    expect(setLayoutProperty).toHaveBeenCalledWith("zones-outline", "visibility", "visible");
    expect(setLayoutProperty).toHaveBeenCalledWith("trails", "visibility", "visible");
  });
});
