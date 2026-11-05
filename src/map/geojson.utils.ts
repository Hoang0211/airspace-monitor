import { circle } from "@turf/circle";
import type { FeatureCollection, Point, Polygon } from "geojson";
import type { Sensor } from "../data/sensors.types";
import type { Zone } from "../data/zones.types";

export function sensorsToGeoJSON(sensors: Sensor[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: sensors.map((sensor) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: sensor.position },
      properties: { id: sensor.id, name: sensor.name },
    })),
  };
}

export function coverageToGeoJSON(sensors: Sensor[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: sensors.map((sensor) =>
      circle(sensor.position, sensor.rangeMeters, {
        steps: 64,
        units: "meters",
        properties: { sensorId: sensor.id },
      }),
    ),
  };
}

export function zonesToGeoJSON(zones: Zone[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: zones.map((zone) => ({
      type: "Feature",
      geometry: zone.polygon,
      properties: { id: zone.id, name: zone.name, kind: zone.kind },
    })),
  };
}
