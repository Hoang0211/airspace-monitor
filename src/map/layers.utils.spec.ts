import { describe, expect, it, vi } from "vitest";
import { STATIC_LAYERS } from "./layers";
import { addStaticLayers, applyLayerVisibility } from "./layers.utils";

describe("addStaticLayers", () => {
  it("adds every source before the layers that use it", () => {
    const calls: string[] = [];
    addStaticLayers({
      addSource: vi.fn((id: string) => calls.push(`source:${id}`)),
      addLayer: vi.fn((layer: { id: string }) => calls.push(`layer:${layer.id}`)),
    } as never);

    expect(calls.slice(0, 3).every((call) => call.startsWith("source:"))).toBe(true);
    expect(calls.slice(3)).toEqual(STATIC_LAYERS.map((layer) => `layer:${layer.id}`));
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
      pilots: true,
    });

    expect(setLayoutProperty).toHaveBeenCalledWith("coverage-fill", "visibility", "none");
    expect(setLayoutProperty).toHaveBeenCalledWith("coverage-outline", "visibility", "none");
    expect(setLayoutProperty).toHaveBeenCalledWith("sensors", "visibility", "visible");
    expect(setLayoutProperty).toHaveBeenCalledWith("zones-fill", "visibility", "visible");
    expect(setLayoutProperty).toHaveBeenCalledWith("zones-outline", "visibility", "visible");
  });
});
