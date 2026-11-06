import { circle } from "@turf/circle";
import type { Feature, FeatureCollection, LineString, Point, Polygon } from "geojson";
import type { Sensor } from "../data/sensors.types";
import type { Zone } from "../data/zones.types";
import type { Drone } from "../simulation/droneSimulator.types";

/** MapLibre's feature-state needs a numeric ID, so "UAV-012" becomes 12. */
function droneFeatureId(drone: Drone): number {
  return Number(drone.id.slice("UAV-".length));
}

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

export function dronesToGeoJSON(drones: Drone[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: drones.map((drone) => ({
      type: "Feature",
      id: droneFeatureId(drone),
      geometry: { type: "Point", coordinates: drone.position },
      properties: { droneId: drone.id, heading: drone.heading },
    })),
  };
}

export function pilotsToGeoJSON(drones: Drone[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: drones.map((drone) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: drone.pilot },
      properties: { droneId: drone.id },
    })),
  };
}

/** One source for both kinds of line, with layers choosing between them by their `kind`. */
export function linesToGeoJSON(drones: Drone[]): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: drones.flatMap((drone) => {
      const lines: Feature<LineString>[] = [
        {
          type: "Feature",
          geometry: { type: "LineString", coordinates: [drone.pilot, drone.position] },
          properties: { droneId: drone.id, kind: "pilot-link" },
        },
      ];

      // A line needs at least two points, and a drone that just appeared has only one.
      if (drone.trail.length >= 2) {
        lines.push({
          type: "Feature",
          id: droneFeatureId(drone),
          geometry: { type: "LineString", coordinates: drone.trail },
          properties: { droneId: drone.id, kind: "trail" },
        });
      }

      return lines;
    }),
  };
}
