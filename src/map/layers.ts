import type { AddLayerObject, GeoJSONSourceSpecification } from "maplibre-gl";
import { SENSORS } from "../data/sensors";
import { ZONES } from "../data/zones";
import type { LayerToggle } from "../state/store.types";
import { coverageToGeoJSON, sensorsToGeoJSON, zonesToGeoJSON } from "./geojson.utils";

export const SENSOR_ICON_IMAGE = "sensor-icon";
export const ZONE_HATCH_IMAGE = "zone-hatch";
export const DRONE_ICON_IMAGE = "drone-icon";
export const PILOT_ICON_IMAGE = "pilot-icon";

export const ZONE_COLOR = "#ff5c5f";
export const COVERAGE_COLOR = "#5eead4";
export const LABEL_HALO_COLOR = "#0b1014";
export const PILOT_COLOR = "#e6edf3";
const LABEL_COLOR = "#e6edf3";
const DRONE_COLOR = "#fbbf24";

const EMPTY_GEOJSON: GeoJSONSourceSpecification["data"] = {
  type: "FeatureCollection",
  features: [],
};

export const MAP_SOURCES: Record<string, GeoJSONSourceSpecification> = {
  zones: { type: "geojson", data: zonesToGeoJSON(ZONES) },
  coverage: { type: "geojson", data: coverageToGeoJSON(SENSORS) },
  sensors: { type: "geojson", data: sensorsToGeoJSON(SENSORS) },
  // These three start empty, and are filled by setData on every simulation tick.
  drones: { type: "geojson", data: EMPTY_GEOJSON },
  pilots: { type: "geojson", data: EMPTY_GEOJSON },
  lines: { type: "geojson", data: EMPTY_GEOJSON },
};

/** Listed bottom to top, as they are drawn on the map. */
export const MAP_LAYERS: AddLayerObject[] = [
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
    id: "trails",
    type: "line",
    source: "lines",
    filter: ["==", ["get", "kind"], "trail"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": DRONE_COLOR, "line-opacity": 0.5, "line-width": 2 },
  },
  {
    id: "pilot-links",
    type: "line",
    source: "lines",
    filter: ["==", ["get", "kind"], "pilot-link"],
    paint: {
      "line-color": PILOT_COLOR,
      "line-opacity": 0.5,
      "line-width": 1,
      "line-dasharray": [2, 2],
    },
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
  {
    id: "pilots",
    type: "symbol",
    source: "pilots",
    layout: {
      "icon-image": PILOT_ICON_IMAGE,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  },
  {
    id: "drones",
    type: "symbol",
    source: "drones",
    layout: {
      "icon-image": DRONE_ICON_IMAGE,
      "icon-rotate": ["get", "heading"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
    paint: {
      "icon-color": DRONE_COLOR,
      "icon-halo-color": LABEL_HALO_COLOR,
      "icon-halo-width": 1,
    },
  },
  {
    id: "drones-label",
    type: "symbol",
    source: "drones",
    minzoom: 13,
    layout: {
      "text-field": ["get", "droneId"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 12,
      "text-anchor": "top",
      "text-offset": [0, 1.2],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": LABEL_COLOR,
      "text-halo-color": LABEL_HALO_COLOR,
      "text-halo-width": 1.5,
    },
  },
];

/** The map layers each side panel toggle controls. */
export const TOGGLE_LAYERS: Record<LayerToggle, string[]> = {
  sensors: ["sensors"],
  coverage: ["coverage-fill", "coverage-outline"],
  zones: ["zones-fill", "zones-outline"],
  trails: ["trails"],
  pilots: ["pilots", "pilot-links"],
};
