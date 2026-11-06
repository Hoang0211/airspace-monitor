import { describe, expect, it } from "vitest";
import { MAP_LAYERS, MAP_SOURCES, TOGGLE_LAYERS } from "./layers";

describe("layer definitions", () => {
  it("draws the layers in the agreed order", () => {
    expect(MAP_LAYERS.map((layer) => layer.id)).toEqual([
      "zones-fill",
      "zones-outline",
      "coverage-fill",
      "coverage-outline",
      "trails",
      "pilot-links",
      "sensors",
      "pilots",
      "drones",
      "drones-label",
    ]);
  });

  it("only uses sources that are defined", () => {
    for (const layer of MAP_LAYERS) {
      const source = "source" in layer ? layer.source : undefined;
      expect(Object.keys(MAP_SOURCES)).toContain(source);
    }
  });

  it("only maps toggles to layers that exist", () => {
    const layerIds = MAP_LAYERS.map((layer) => layer.id);

    for (const toggleLayers of Object.values(TOGGLE_LAYERS)) {
      for (const id of toggleLayers) expect(layerIds).toContain(id);
    }
  });

  it("hides the pilot links along with the pilots", () => {
    expect(TOGGLE_LAYERS.pilots).toEqual(["pilots", "pilot-links"]);
  });
});
