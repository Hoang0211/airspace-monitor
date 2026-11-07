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

  it("gives each drone status its own color, on the arrow and the trail alike", () => {
    const paintOf = (id: string) => {
      const layer = MAP_LAYERS.find((candidate) => candidate.id === id);

      return (layer && "paint" in layer ? layer.paint : {}) as Record<string, unknown[]>;
    };
    const arrowColor = paintOf("drones")["icon-color"];
    const [, , alertName, alert, trackedName, tracked, undetected] = arrowColor;

    expect([alertName, trackedName]).toEqual(["alert", "tracked"]);
    expect(new Set([alert, tracked, undetected]).size).toBe(3);
    expect(paintOf("trails")["line-color"]).toEqual(arrowColor);
  });
});
