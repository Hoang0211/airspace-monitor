import { describe, expect, it } from "vitest";
import { STATIC_LAYERS, STATIC_SOURCES, TOGGLE_LAYERS } from "./layers";

describe("layer definitions", () => {
  it("draws the layers in the agreed order", () => {
    expect(STATIC_LAYERS.map((layer) => layer.id)).toEqual([
      "zones-fill",
      "zones-outline",
      "coverage-fill",
      "coverage-outline",
      "sensors",
    ]);
  });

  it("only uses sources that are defined", () => {
    for (const layer of STATIC_LAYERS) {
      const source = "source" in layer ? layer.source : undefined;
      expect(Object.keys(STATIC_SOURCES)).toContain(source);
    }
  });

  it("only maps toggles to layers that exist", () => {
    const layerIds = STATIC_LAYERS.map((layer) => layer.id);

    for (const toggleLayers of Object.values(TOGGLE_LAYERS)) {
      for (const id of toggleLayers) expect(layerIds).toContain(id);
    }
  });
});
