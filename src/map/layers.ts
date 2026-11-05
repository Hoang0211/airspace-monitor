import type { AddLayerObject, GeoJSONSourceSpecification } from "maplibre-gl";
import { SENSORS } from "../data/sensors";
import { ZONES } from "../data/zones";
import type { LayerToggle } from "../state/store.types";
import { coverageToGeoJSON, sensorsToGeoJSON, zonesToGeoJSON } from "./geojson.utils";

export const SENSOR_ICON_IMAGE = "sensor-icon";
export const ZONE_HATCH_IMAGE = "zone-hatch";

export const ZONE_COLOR = "#ff5c5f";
export const COVERAGE_COLOR = "#5eead4";
export const LABEL_HALO_COLOR = "#0b1014";
const LABEL_COLOR = "#e6edf3";

export const STATIC_SOURCES: Record<string, GeoJSONSourceSpecification> = {
  zones: { type: "geojson", data: zonesToGeoJSON(ZONES) },
  coverage: { type: "geojson", data: coverageToGeoJSON(SENSORS) },
  sensors: { type: "geojson", data: sensorsToGeoJSON(SENSORS) },
};

/** Listed bottom to top, as they are drawn on the map. */
export const STATIC_LAYERS: AddLayerObject[] = [
  {
    id: "zones-fill",
    type: "fill",
    source: "zones",
    paint: { "fill-pattern": ZONE_HATCH_IMAGE },
  },
  {
    id: "zones-outline",
    type: "line",
    source: "zones",
    paint: { "line-color": ZONE_COLOR, "line-width": 2 },
  },
  {
    id: "coverage-fill",
    type: "fill",
    source: "coverage",
    paint: { "fill-color": COVERAGE_COLOR, "fill-opacity": 0.06 },
  },
  {
    id: "coverage-outline",
    type: "line",
    source: "coverage",
    paint: { "line-color": COVERAGE_COLOR, "line-opacity": 0.45, "line-width": 1 },
  },
  {
    id: "sensors",
    type: "symbol",
    source: "sensors",
    layout: {
      "icon-image": SENSOR_ICON_IMAGE,
      "icon-allow-overlap": true,
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 12,
      "text-anchor": "top",
      "text-offset": [0, 1],
      "text-optional": true,
    },
    paint: {
      "text-color": LABEL_COLOR,
      "text-halo-color": LABEL_HALO_COLOR,
      "text-halo-width": 1.5,
    },
  },
];

/** The map layers each side panel toggle controls. Trails and pilots have no layers yet. */
export const TOGGLE_LAYERS: Record<LayerToggle, string[]> = {
  sensors: ["sensors"],
  coverage: ["coverage-fill", "coverage-outline"],
  zones: ["zones-fill", "zones-outline"],
  trails: [],
  pilots: [],
};
